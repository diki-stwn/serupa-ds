/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterAll, describe, expect, test } from 'vitest';
import { cdp, server, userEvent } from 'vitest/browser';
import { keepMotion } from '../../tools/test/vitest/helpers';
import { storiesToRun } from '../../tools/test/vitest/stories';

// The motion quality gate (EH1): every animation a story runs, on mount and after the interactions below, must
//   (2) stay off layout: animate only what the compositor runs (opacity, transform, translate, scale, rotate, filter,
//       clip-path) or a discrete property (visibility, display); colors and shadows only in a transition that ends,
//       never in a loop that repaints every frame; never width, height, inset, margins, padding, gaps or grid tracks
//   (3) turn back from where it is when reversed: a surface that can close mid-entry enters with a transition, not
//       keyframes, which restart from the top
//   (4) not run on mount: a transition right after mount means a style changed between the first paint and the next
//   (6) only fade under reduced motion: nothing moves or scales, loops included
//   (seamless) grow out of what opened them: a popup placed next to its trigger (data-side) that scales does so from
//       the edge facing the trigger, not from its centre
//   (refined) leave nothing promoted at rest: no will-change once the motion has ended, which keeps text crisp and
//       memory free
// What fails today is in KNOWN, under the queue item that fixes it. Fixing one fails this until its line goes, so
// the list only shrinks. Frame times under CPU throttling aren't gated: in a headless browser every animation, an
// opacity fade included, ran at the same 33 ms a frame on 25 Oct 2026, so they measure the machine, not the motion.
keepMotion();

type Rule = 'layout' | 'paint loop' | 'keyframes' | 'on mount' | 'reduced motion' | 'origin' | 'will-change';
// Each line: the queue item that fixes it, and the components whose stories show it (a run that covers all of them,
// a pull request's included, fails when the breach is gone and the line is still here).
const KNOWN: Record<Rule, Record<string, [string, string[]]>> = {
  layout: {
    'dk-accordion__panel': ['EH2: opens by animating grid-template-rows', ['Accordion']],
    'dk-switch__thumb': ['EG1: the thumb slides by left', ['Switch']],
    'dk-segmented__indicator': ['EG1: the indicator slides by left and width', ['SegmentedControl']],
    'dk-progress__fill': ['FB1: the fill grows by inline-size', ['Progress']],
    'dk-meter__fill': ['FB1: the fill grows by inline-size', ['Meter']],
    'dk-carousel__dot': ['FB1: the current dot widens by width', ['Carousel']],
  },
  'paint loop': {
    'dk-loader-arc': ['EE1: stroke-dasharray', ['Loader', 'Button', 'IconButton', 'Fab', 'SearchInput', 'Badge']],
    'dk-loader-shine': ['EE1: background-position', ['Loader']],
  },
  keyframes: Object.fromEntries([
    ['dk-toast-up', 'Toast'], ['dk-toast-down', 'Toast'],
  ].map(([k, c]) => [k, ['DZ1: enter with a transition, with an exit', [c]]])),
  'on mount': {
    'dk-input': ['DZ1: the Input a Popover focuses as it opens transitions its focus ring in its first frame', ['Popover']],
  },
  'reduced motion': {
    spin: ['EE1: spinners keep turning, slower', ['Loader', 'Button', 'IconButton', 'Fab', 'SearchInput', 'Badge']],
    'dk-loader-tick': ['EE1: the spokes keep ticking', ['Loader']],
    'dk-btn-loader-in': ['EE1: scales in', ['Button', 'IconButton', 'Fab']],
    'dk-badge-loader-in': ['EE1: scales in', ['Badge']],
  },
  origin: {},
  'will-change': {},
};
// Keyframes that may run once: what appears and can't be taken back mid-way, so there is nothing to reverse.
const ONCE = new Set(['dk-loader-in', 'dk-btn-loader-in', 'dk-badge-loader-in', 'dk-btn-ripple']);
const COMPOSITOR = /^(opacity|transform|translate|scale|rotate|filter|backdrop-filter|clip-path)$/;
const DISCRETE = /^(visibility|display|overlay|content-visibility|pointer-events)$/;
const LAYOUT = /^(width|height|(min|max)-(width|height)|inline-size|block-size|inset.*|top|right|bottom|left|margin.*|padding.*|gap|row-gap|column-gap|grid.*|flex.*|font-size|line-height|letter-spacing|border(-\w+)?-width|border-width)$/;

const kebab = (p: string) => p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
function animated(a: Animation): string[] {
  if (a instanceof CSSTransition) return [a.transitionProperty];
  const frames = (a.effect as KeyframeEffect).getKeyframes();
  return [...new Set(frames.flatMap((f) => Object.keys(f)).filter((p) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)).map(kebab))];
}
const loops = (a: Animation) => (a.effect as KeyframeEffect).getTiming().iterations === Infinity;
const target = (a: Animation) => (a.effect as KeyframeEffect).target;
const label = (a: Animation) => (a instanceof CSSAnimation ? a.animationName : `${(target(a)?.className?.toString() || target(a)?.tagName || '').split(' ')[0]} ${(a as CSSTransition).transitionProperty}`);
// The KNOWN key: an animation by name, a transition by its element's first class.
const key = (a: Animation) => (a instanceof CSSAnimation ? a.animationName : (target(a)?.className?.toString() || '').split(' ')[0]);

const seen = new Set<string>();
// Records a breach; true when KNOWN doesn't list it, so it fails.
const note = (rule: Rule, k: string) => { seen.add(`${rule}:${k}`); return !KNOWN[rule][k]; };
// What still has will-change once every animation that ends has ended.
async function promoted(host: Element): Promise<string[]> {
  const ending = inside(host).filter((a) => !loops(a));
  await Promise.race([Promise.allSettled(ending.map((a) => a.finished)), new Promise((r) => setTimeout(r, 1500))]);
  await frame();
  return [...document.body.querySelectorAll('*')].filter((el) => getComputedStyle(el).willChange !== 'auto').flatMap((el) => {
    const k = (el.className?.toString() || el.tagName).split(' ')[0];
    return note('will-change', k) ? [`${k}: keeps will-change: ${getComputedStyle(el).willChange} at rest; set it only while it moves`] : [];
  });
}

function judge(list: Animation[], when: 'mount' | 'interaction', reduced: boolean): string[] {
  const out: string[] = [];
  const breach = (rule: Rule, a: Animation, why: string) => { if (note(rule, key(a))) out.push(`${label(a)}: ${why}`); };
  for (const a of list) {
    const props = animated(a);
    const layout = props.filter((p) => LAYOUT.test(p));
    if (layout.length) breach('layout', a, `animates ${layout.join(', ')}, which lays the page out on every frame`);
    const paint = props.filter((p) => !COMPOSITOR.test(p) && !DISCRETE.test(p) && !LAYOUT.test(p));
    if (paint.length && loops(a)) breach('paint loop', a, `loops ${paint.join(', ')}, which repaints on every frame`);
    if (a instanceof CSSAnimation && !loops(a) && !ONCE.has(a.animationName)) breach('keyframes', a, 'enters with keyframes, which restart from the top when reversed mid-way; use a transition');
    if (when === 'mount' && a instanceof CSSTransition && !DISCRETE.test(a.transitionProperty)) breach('on mount', a, 'transitions on the first frame after mount');
    const moves = props.filter((p) => p !== 'opacity' && !DISCRETE.test(p));
    if (reduced && moves.length) breach('reduced motion', a, `animates ${moves.join(', ')} when the viewer prefers reduced motion; fade instead`);
    const el = target(a);
    if (el instanceof HTMLElement && el.dataset.side && props.some((p) => p === 'scale' || p === 'transform')) {
      const [x, y] = getComputedStyle(el).transformOrigin.split(' ').map(parseFloat);
      const w = el.offsetWidth, h = el.offsetHeight, side = el.dataset.side;
      const facing = side === 'bottom' ? y <= 2 : side === 'top' ? y >= h - 2 : side === 'right' ? x <= 2 : side === 'left' ? x >= w - 2 : true;
      if (!facing) breach('origin', a, `placed on the ${side} of its trigger but scales from ${Math.round(x)}px ${Math.round(y)}px of ${w}×${h}; grow from the edge facing the trigger`);
    }
  }
  return out;
}

const STYLESHEETS = import.meta.glob<string>('../components/*/*.css', { query: '?raw', import: 'default', eager: true });
// Commas inside var(…) or cubic-bezier(…) don't split.
const list = (v: string) => { const out = ['']; let depth = 0; for (const c of v) { if (c === '(') depth++; if (c === ')') depth--; if (c === ',' && !depth) out.push(''); else out[out.length - 1] += c; } return out.map((x) => x.trim()).filter(Boolean); };
// Each rule that sets a transition: its KNOWN key (the first class of the element it styles, as a transition's key
// is), its selector and the properties it transitions.
function transitions(css: string): Array<[string, string, string[]]> {
  const out: Array<[string, string, string[]]> = [];
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const props = [...body.matchAll(/(?:^|;)\s*(transition(?:-property)?)\s*:\s*([^;]+)/g)]
      .flatMap(([, name, value]) => list(value).map((part) => (name === 'transition' ? part.split(/\s+/)[0] : part)));
    const sel = selector.trim().replace(/\s+/g, ' ');
    const k = /\.([\w-]+)/.exec(sel.split(',')[0].trim().split(/[\s>+~]+/).pop() || '')?.[1] || sel;
    if (props.length) out.push([k, sel, props]);
  }
  return out;
}

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const inside = (host: Element) => document.getAnimations().filter((a) => { const t = target(a); return !!t && (host.contains(t) || !document.body.contains(t) || !host.isConnected || t.closest('[data-dk-portal], [popover], dialog') !== null); });
const $ = (host: Element, sel: string) => host.querySelector<HTMLElement>(sel);
// What a person does to each part that moves when they use it.
const INTERACT: Record<string, (host: HTMLElement) => Promise<void>> = {
  TimePicker: async (h) => { await userEvent.click($(h, 'button[aria-expanded]')!); },
  Switch: async (h) => { await userEvent.click($(h, '[role=switch]')!); },
  SegmentedControl: async (h) => { await userEvent.click(h.querySelectorAll<HTMLElement>('[role=radio]')[1]); },
  Checkbox: async (h) => { await userEvent.click($(h, 'input[type=checkbox]')!); },
  Accordion: async (h) => { await userEvent.click($(h, 'button')!); },
  Tabs: async (h) => { const tabs = h.querySelectorAll('[role=tab]'); await userEvent.click(tabs[1]); },
  Sidebar: async (h) => { await userEvent.click($(h, 'button')!); },
  Dialog: async (h) => { await userEvent.click($(h, 'button')!); },
  Drawer: async (h) => { await userEvent.click($(h, 'button')!); },
  Menu: async (h) => { await userEvent.click($(h, 'button')!); },
  Popover: async (h) => { await userEvent.click($(h, 'button')!); },
  Tooltip: async (h) => { await userEvent.hover($(h, 'button')!); },
  Combobox: async (h) => { await userEvent.click($(h, 'button[aria-expanded]')!); },
  Button: async (h) => { await userEvent.hover($(h, 'button')!); },
};

const session = server.browser === 'chromium' ? (cdp() as unknown as { send: (m: string, p: object) => Promise<unknown> }) : null;
const reduce = (on: boolean) => session?.send('Emulation.setEmulatedMedia', { features: on ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] });
afterAll(() => reduce(false));

describe('motion quality gate', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories move only the way the motion rules allow`, async () => {
      const problems: string[] = [];
      for (const reduced of session ? [false, true] : [false]) {
        await reduce(reduced);
        for (const [exportName, ui] of list) {
          // The pointer off the page's parts first: a story mounted under it would start a hover transition.
          await userEvent.hover(document.documentElement, { position: { x: 0, y: 0 }, force: true });
          const host = document.body.appendChild(document.createElement('div'));
          const root = createRoot(host);
          flushSync(() => root.render(ui));
          await frame();
          const at = (when: 'mount' | 'interaction', l: Animation[]) => judge(l, when, reduced).map((p) => `${exportName}${reduced ? ' (reduced motion)' : ''}${when === 'interaction' ? ' after use' : ''}: ${p}`);
          problems.push(...at('mount', inside(host)));
          if (exportName === 'Playground' && INTERACT[name]) {
            await INTERACT[name](host);
            await frame();
            problems.push(...at('interaction', inside(host)));
          }
          problems.push(...(await promoted(host)).map((p) => `${exportName}${reduced ? ' (reduced motion)' : ''}: ${p}`));
          if (exportName === 'Playground' && INTERACT[name]) await userEvent.keyboard('{Escape}');
          root.unmount();
          host.remove();
          await frame();
        }
      }
      expect([...new Set(problems)]).toEqual([]);
    });
  }
  // A transition that only runs when a value changes (a fill growing, an indicator moving to the picked segment)
  // runs in no story above, so every component stylesheet is read for it too (FA1).
  test('no component stylesheet transitions a layout property', () => {
    const problems: string[] = [];
    for (const [file, css] of Object.entries(STYLESHEETS)) {
      for (const [k, sel, props] of transitions(css)) {
        const layout = props.filter((p) => p === 'all' || LAYOUT.test(p));
        if (layout.length && note('layout', k)) problems.push(`${file.replace('../components/', '')}: ${sel} transitions ${layout.join(', ')}, which lays the page out on every frame of the change`);
      }
    }
    expect(problems).toEqual([]);
  });
  // A KNOWN line nothing breaks any more is a fixed item: take the line out, so a regression fails again. Checked
  // after every story has run (the tests run in a random order), in Chromium (the one that emulates reduced motion),
  // for the lines whose components all ran.
  afterAll(() => {
    if (!session) return;
    const ran = new Set(storiesToRun().map(([n]) => n));
    const stale = (Object.entries(KNOWN) as Array<[Rule, Record<string, [string, string[]]>]>).flatMap(([rule, m]) => Object.entries(m)
      .filter(([k, [, components]]) => components.every((c) => ran.has(c)) && !seen.has(`${rule}:${k}`)).map(([k]) => `${rule}: ${k}`));
    if (stale.length) throw new Error(`These KNOWN motion breaches no longer happen; remove their lines from src/internal/motion.test.tsx: ${stale.join(', ')}`);
  });
});
