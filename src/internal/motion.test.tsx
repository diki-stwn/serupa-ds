/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterAll, describe, expect, inject, test } from 'vitest';
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
// What fails today is in KNOWN, under the queue item that fixes it. Fixing one fails this until its line goes, so
// the list only shrinks. (1), frame times under CPU throttling, comes next.
keepMotion();

type Rule = 'layout' | 'paint loop' | 'keyframes' | 'on mount' | 'reduced motion';
const KNOWN: Record<Rule, Record<string, string>> = {
  layout: { 'dk-accordion__panel': 'EH2 (opens by animating grid-template-rows)', 'dk-switch__thumb': 'EG1 (the thumb slides by left)' },
  'paint loop': { 'dk-loader-arc': 'EE1 (stroke-dasharray)', 'dk-loader-shine': 'EE1 (background-position)' },
  keyframes: { 'dk-dialog-in': 'DZ1', 'dk-dialog-fade': 'DZ1', 'dk-drawer-in': 'DZ1', 'dk-drawer-fade': 'DZ1', 'dk-menu-in': 'DZ1', 'dk-popover-in': 'DZ1', 'dk-tooltip-in': 'DZ1', 'dk-toast-up': 'DZ1', 'dk-toast-down': 'DZ1' },
  'on mount': { 'dk-input': 'DZ1 (border and shadow colors transition on the first frame)' },
  'reduced motion': { spin: 'EE1 (spinners keep turning, slower)', 'dk-loader-tick': 'EE1', 'dk-btn-loader-in': 'EE1 (scales in)', 'dk-badge-loader-in': 'EE1 (scales in)' },
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
function judge(list: Animation[], when: 'mount' | 'interaction', reduced: boolean): string[] {
  const out: string[] = [];
  const breach = (rule: Rule, a: Animation, why: string) => { const k = `${rule}:${key(a)}`; seen.add(k); if (!KNOWN[rule][key(a)]) out.push(`${label(a)}: ${why}`); };
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
  }
  return out;
}

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const inside = (host: Element) => document.getAnimations().filter((a) => { const t = target(a); return !!t && (host.contains(t) || !document.body.contains(t) || !host.isConnected || t.closest('[data-dk-portal], [popover], dialog') !== null); });
const $ = (host: Element, sel: string) => host.querySelector<HTMLElement>(sel);
// What a person does to each part that moves when they use it.
const INTERACT: Record<string, (host: HTMLElement) => Promise<void>> = {
  Switch: async (h) => { await userEvent.click($(h, '[role=switch]')!); },
  Checkbox: async (h) => { await userEvent.click($(h, 'input[type=checkbox]')!); },
  Accordion: async (h) => { await userEvent.click($(h, 'button')!); },
  Tabs: async (h) => { const tabs = h.querySelectorAll('[role=tab]'); await userEvent.click(tabs[1]); },
  Sidebar: async (h) => { await userEvent.click($(h, 'button')!); },
  Dialog: async (h) => { await userEvent.click($(h, 'button')!); },
  Drawer: async (h) => { await userEvent.click($(h, 'button')!); },
  Menu: async (h) => { await userEvent.click($(h, 'button')!); },
  Popover: async (h) => { await userEvent.click($(h, 'button')!); },
  Tooltip: async (h) => { await userEvent.hover($(h, 'button')!); },
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
            await userEvent.keyboard('{Escape}');
          }
          root.unmount();
          host.remove();
          await frame();
        }
      }
      expect([...new Set(problems)]).toEqual([]);
    });
  }
  // A KNOWN line nothing breaks any more is a fixed item: take the line out, so a regression fails again. Checked
  // after every story has run (the tests run in a random order), on a full run in Chromium, the one that emulates
  // reduced motion.
  afterAll(() => {
    if (inject('only') !== null || !session) return;
    const stale = (Object.entries(KNOWN) as Array<[Rule, Record<string, string>]>).flatMap(([rule, m]) => Object.keys(m).filter((k) => !seen.has(`${rule}:${k}`)).map((k) => `${rule}: ${k}`));
    if (stale.length) throw new Error(`These KNOWN motion breaches no longer happen; remove their lines from src/internal/motion.test.tsx: ${stale.join(', ')}`);
  });
});
