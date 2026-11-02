import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { color, css, forcedColors, settle, keepMotion } from '../../../tools/test/vitest/helpers';
import { Loader } from './Loader';
import { announcerIdle } from '../../internal/announce';

// About motion: transitions and animations stay on for this file (setup.ts turns them off elsewhere).
keepMotion();

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const box = (id: string) => { const r = el(id).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
const vars = (v: Record<string, string>) => v as React.CSSProperties;
const announcer = () => document.querySelector('[data-dk-announcer]') as HTMLElement;
/** Runs read() with the element's named animation paused at each time, then lets it play on. */
function at<T>(node: Element, name: string | null, times: number[], read: (n: Element) => T): T[] {
  const a = node.getAnimations().find((x) => !name || (x as CSSAnimation).animationName === name);
  if (!a) throw new Error(`No ${name} animation`);
  a.pause();
  const out = times.map((ms) => { a.currentTime = ms; return read(node); });
  a.play();
  return out;
}
const opacity = (n: Element) => +parseFloat(getComputedStyle(n).opacity).toFixed(2);
/** Applies the page's prefers-reduced-motion: reduce rules (and drops the no-preference ones), as a viewer who asks for less motion sees them. Returns the undo. */
function reduceMotion() {
  const undo: Array<() => void> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.media.mediaText)) {
        const was = r.media.mediaText;
        r.media.mediaText = was.replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, '(min-width: 0px)').replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, '(max-width: -1px)');
        undo.push(() => { r.media.mediaText = was; });
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* another origin */ } }
  return () => undo.forEach((f) => f());
}

describe('Loader', () => {
  // EB1: the delay had no minimum, so work ending at 320ms showed a spinner for 20ms, cut off mid fade-in.
  test('delay, then a minimum: work ending at 320ms keeps the loader until 800ms; ending at 200ms never shows it; loading again during the minimum keeps it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      let set: (v: boolean) => void = () => {};
      function Wait() { const [on, s] = React.useState(true); set = s; return <div id="w"><Loader id="lw" loading={on} /></div>; }
      await render(<Wait />);
      const step = (ms: number) => React.act(async () => { vi.advanceTimersByTime(ms); });
      const state = () => { const l = el('lw'); return l ? (l.getAttribute('role') || 'waiting') : 'gone'; };
      expect(state()).toBe('waiting');
      await step(300);
      expect(state()).toBe('progressbar');
      await step(20);
      await React.act(async () => set(false));
      expect(state()).toBe('progressbar');   // 20ms in: stays
      await step(470);
      expect(state()).toBe('progressbar');   // 490ms in
      await step(10);
      expect(state()).toBe('gone');          // 500ms in: done
      await React.act(async () => set(true));
      await step(200);
      await React.act(async () => set(false));
      await step(1000);
      expect(state()).toBe('gone');          // ended inside the delay: never shown
      await React.act(async () => set(true));
      await step(300);
      await React.act(async () => set(false));
      await step(100);
      await React.act(async () => set(true));
      await step(1000);
      expect(state()).toBe('progressbar');   // loading again during the minimum: still shown
    } finally { vi.useRealTimers(); }
  });

  test('sizes: sm 16px, md 24px (default), lg 40px; an unknown variant, size and tone fall back to ring, md and neutral', async () => {
    await render(<>
      <Loader id="sm" size="sm" delay={0} />
      <Loader id="ring" delay={0} />
      <Loader id="lg" size="lg" delay={0} />
      {/* @ts-expect-error: unknown values, as plain JavaScript could pass */}
      <Loader id="bad" size="xl" variant="bars" tone="pink" delay={0} />
    </>);
    expect([box('sm'), box('ring'), box('lg')]).toEqual([[16, 16], [24, 24], [40, 40]]);
    expect(box('bad')).toEqual([24, 24]);
    expect(el('bad').className).toMatch(/dk-loader--ring/);
    expect(el('bad').className).not.toMatch(/pink/);
  });

  test('ring: an arc on a faint track (20%), rounded ends, stroke-width-2 in its 24-unit drawing; a quarter of the ring when still', async () => {
    await render(<Loader id="ring" delay={0} />);
    const tr = q('#ring svg > circle:first-of-type'), arc = q('#ring svg > circle:last-of-type'), s = css(arc);
    expect(css(tr).opacity).toBe('0.2');
    expect([s.opacity, s.strokeLinecap, s.fill, s.strokeWidth]).toEqual(['1', 'round', 'none', '2px']);
    expect([arc.getAttribute('pathLength'), arc.getAttribute('stroke-dasharray')]).toEqual(['100', '25 150']);
  });

  test('ring: the quarter arc stays as it is while the drawing turns steadily at motion-loop-spinner (0.7s a turn, KW22; the shared spin keyframes); nothing repaints on each frame (EE1)', async () => {
    await render(<Loader id="ring" delay={0} />);
    const svg = css(q('#ring svg')), arc = css(q('#ring svg > circle:last-of-type'));
    expect(`${svg.animationName} ${svg.animationDuration} ${svg.animationTimingFunction} ${svg.animationIterationCount}`).toBe('spin 0.7s linear infinite');
    expect([arc.animationName, q('#ring').getAnimations({ subtree: true }).filter((x) => (x as CSSAnimation).animationName !== 'dk-loader-in').map((x) => (x as CSSAnimation).animationName)]).toEqual(['none', ['spin']]);
  });

  test('dots: three dots pulsing (1s, forever), each 150ms after the one before', async () => {
    await render(<Loader id="dots" variant="dots" delay={0} />);
    const dots = [...document.querySelectorAll('#dots svg circle')].map((d) => { const s = getComputedStyle(d); return [s.animationName, s.animationDuration, s.animationDelay, s.animationIterationCount]; });
    expect(dots).toEqual([['dk-loader-dot', '1s', '0s', 'infinite'], ['dk-loader-dot', '1s', '0.15s', 'infinite'], ['dk-loader-dot', '1s', '0.3s', 'infinite']]);
  });

  test('pixel: nine square pixels edge to edge in a 3×3 grid (no corners, no gaps), 24px (md) and 40px (lg), in one color (the text color, or the tone: primary)', async () => {
    await render(<><Loader id="px" variant="pixel" delay={0} /><Loader id="pxlg" variant="pixel" size="lg" tone="primary" delay={0} /></>);
    const rs = [...el('px').querySelectorAll('svg > g > rect')];
    expect(el('px').dataset.variant).toBe('pixel');
    expect(rs.map((r) => `${r.getAttribute('x')},${r.getAttribute('y')}`).join(' ')).toBe('0,0 8,0 16,0 0,8 8,8 16,8 0,16 8,16 16,16');
    expect(rs.every((r) => r.getAttribute('width') === '8' && r.getAttribute('height') === '8' && !r.getAttribute('rx'))).toBe(true);
    expect([box('px'), box('pxlg')]).toEqual([[24, 24], [40, 40]]);
    expect(css(rs[0]).fill).toBe(css(el('px')).color);
    expect(css(q('#pxlg svg > g > rect')).fill).toBe(color('var(--primary)'));
  });

  test('pixel: subtle dividers between the squares, cut out of them (a mask per loader) and drawn on top in its color at 10%, half a grid unit wide', async () => {
    await render(<><Loader id="px" variant="pixel" delay={0} /><Loader id="px2" variant="pixel" delay={0} /><Loader id="px3" variant="pixel" delay={0} /></>);
    const e = el('px'), m = e.querySelector('mask')!, cut = m.querySelector('path')!, pth = e.querySelector('svg > path')!, g = e.querySelector('svg > g')!;
    const ps = css(pth), ids = [...document.querySelectorAll('[data-component=loader][data-variant=pixel] mask')].map((x) => x.id);
    expect([pth.getAttribute('d'), pth.getAttribute('transform')]).toEqual(['M16 0V48M32 0V48M0 16H48M0 32H48', 'scale(0.5)']);
    expect([css(cut).strokeOpacity, ps.strokeOpacity, ps.strokeWidth, ps.stroke]).toEqual(['1', '0.1', '1px', css(e).color]);
    expect(g.getAttribute('mask')).toBe(`url(#${m.id})`);
    expect(pth.previousElementSibling).toBe(g);
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('pixel: a wave along the diagonals, 75ms per step from the top-left, each square pulsing every 1.2s with ease-in-out', async () => {
    await render(<Loader id="px" variant="pixel" delay={0} />);
    const rs = [...el('px').querySelectorAll('svg > g > rect')], s = rs.map((r) => getComputedStyle(r));
    expect(rs.map((r) => r.getAttribute('class')!.match(/d(\d)/)![1]).join('')).toBe('012123234');
    expect(s.map((x) => x.animationDelay).join()).toBe('0s,0.075s,0.15s,0.075s,0.15s,0.225s,0.15s,0.225s,0.3s');
    expect(`${s[0].animationName} ${s[0].animationDuration} ${s[0].animationTimingFunction} ${s[0].animationIterationCount}`).toBe('dk-loader-pixel 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite');
  });

  test('pixel, right to left: the grid is mirrored, so the wave starts from the top right, the inline start (GI2); the drawing is never narrowed by base.css', async () => {
    await render(<div><Loader id="ltr" variant="pixel" delay={0} /><div dir="rtl"><Loader id="rtl" variant="pixel" delay={0} /></div></div>);
    const start = (id: string) => {
      const svg = el(id).querySelector('svg')!.getBoundingClientRect(), r = [...el(id).querySelectorAll('rect[width="8"]')].find((x) => getComputedStyle(x).animationName === 'dk-loader-pixel' && getComputedStyle(x).animationDelay === '0s')!.getBoundingClientRect();
      return [r.left + r.width / 2 > svg.left + svg.width / 2 ? 'right' : 'left', Math.round(r.top - svg.top)];
    };
    expect([start('ltr'), start('rtl'), css(el('rtl').querySelector('svg')).maxWidth]).toEqual([['left', 0], ['right', 0], 'none']);
  });

  test('pixel: a square rests at 15% (pixel-dim), is full at the crest and fades back', async () => {
    await render(<Loader id="px" variant="pixel" delay={0} />);
    const [rest, crest, after] = at(q('#px svg > g > rect'), 'dk-loader-pixel', [0, 480, 1140], opacity);
    expect([rest, crest]).toEqual([0.15, 1]);
    expect(after).toBeLessThan(0.3);
  });

  test('pixel: a divider looks the same between two lit squares as between two dim ones', async () => {
    await render(<div id="pxsbox" style={{ background: '#fff', color: 'rgb(17, 24, 39)', padding: '4px', display: 'inline-block' }}>
      <Loader id="pxs" variant="pixel" delay={0} label="" style={vars({ '--loader-size-md': 'var(--spacing-24)' })} />
    </div>);
    const still = document.createElement('style');
    still.textContent = '#pxs rect.dk-loader__px{animation:none!important} #pxs .dk-loader__px--d0,#pxs .dk-loader__px--d1{opacity:1!important}';
    document.head.appendChild(still);
    try {
      await settle(50);
      const base64 = await page.screenshot({ element: el('pxsbox'), save: false });   // without saving, the base64 PNG
      const img = await createImageBitmap(new Blob([Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))], { type: 'image/png' }));
      const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const outer = el('pxsbox').getBoundingClientRect(), svg = q('#pxs svg').getBoundingClientRect(), k = img.width / outer.width, u = svg.width / 24;
      const px = (x: number, y: number) => [...g.getImageData(Math.round((svg.left - outer.left + x * u) * k), Math.round((svg.top - outer.top + y * u) * k), 1, 1).data.slice(0, 3)];
      const [litDivider, dimDivider, lit, dim] = [px(8.05, 4), px(16.05, 20), px(4, 4), px(20, 20)];
      expect(litDivider.every((v, i) => Math.abs(v - dimDivider[i]) <= 3), JSON.stringify({ litDivider, dimDivider })).toBe(true);
      expect(lit.some((v, i) => Math.abs(v - dim[i]) > 60), JSON.stringify({ lit, dim })).toBe(true);
    } finally { still.remove(); }
  });

  test('pixel pattern="random": each square rises and fades like the wave on its own clock (nine different durations, 1.5s to 2.2s) and start, ease-in-out', async () => {
    await render(<Loader id="pxr" variant="pixel" pattern="random" delay={0} />);
    const e = el('pxr'), rs = [...e.querySelectorAll('svg > g > rect')].map((r) => getComputedStyle(r)), durs = rs.map((s) => parseFloat(s.animationDuration));
    expect(e.dataset.pattern).toBe('random');
    expect(e.className).toMatch(/dk-loader--pattern-random/);
    expect([...new Set(rs.map((s) => s.animationName))]).toEqual(['dk-loader-pixel']);
    expect(new Set(durs).size).toBe(9);
    expect([Math.min(...durs), Math.max(...durs)]).toEqual([1.5, 2.2]);
    expect(new Set(rs.map((s) => s.animationDelay)).size).toBeGreaterThanOrEqual(8);
    expect(rs[0].animationTimingFunction).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
  });

  test('pixel pattern: "wave" by default and for unknown values; other variants ignore it', async () => {
    await render(<>
      <Loader id="px" variant="pixel" delay={0} />
      {/* @ts-expect-error: an unknown pattern */}
      <Loader id="pxbad" variant="pixel" pattern="zigzag" delay={0} />
      <Loader id="ringpat" pattern="random" delay={0} />
    </>);
    expect([el('px').dataset.pattern, el('pxbad').dataset.pattern]).toEqual(['wave', 'wave']);
    expect(el('px').className).not.toMatch(/pattern/);
    expect([...new Set([...el('px').querySelectorAll('svg > g > rect')].map((r) => getComputedStyle(r).animationName))]).toEqual(['dk-loader-pixel']);
    expect(el('ringpat').className + '|' + (el('ringpat').dataset.pattern || '')).not.toMatch(/pattern/);
  });

  test('pixel pattern="random": the lit squares keep changing (many different combinations over 1.8s)', async () => {
    await render(<Loader id="pxr" variant="pixel" pattern="random" delay={0} />);
    const rs = [...document.querySelectorAll('#pxr svg > g > rect')], seen = new Set<string>();
    for (let i = 0; i < 12; i++) { seen.add(rs.map((r) => (+getComputedStyle(r).opacity > 0.6 ? 1 : 0)).join('')); await settle(150); }
    expect(seen.size, JSON.stringify([...seen])).toBeGreaterThanOrEqual(6);
  });

  const WANT = { sweep: ['024024024', '1.2s'], fall: ['000222444', '1.2s'], rise: ['444222000', '1.2s'], snake: ['012543678', '1.5s'], spiral: ['012783654', '1.5s'], cross: ['070777070', '1s'], checker: ['070707070', '1s'] } as const;
  test.each(Object.entries(WANT))('pixel pattern="%s": its order (steps of 75ms) and loop, with the wave\'s smooth rise and fade, ease-in-out', async (pt, [steps, dur]) => {
    await render(<Loader id="pp" variant="pixel" pattern={pt as keyof typeof WANT} delay={0} label="" />);
    const rs = [...el('pp').querySelectorAll('svg > g > rect')].map((r) => getComputedStyle(r));
    expect(el('pp').dataset.pattern).toBe(pt);
    expect([...new Set(rs.map((s) => s.animationName))].join()).toBe('dk-loader-pixel');
    expect(rs.map((s) => Math.round(parseFloat(s.animationDelay) / 0.075)).join('')).toBe(steps);
    expect([...new Set(rs.map((s) => s.animationDuration))].join()).toBe(dur);
    expect(rs[0].animationTimingFunction).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
  });

  test('pixel step patterns: a square rises gradually (still part-way at 15% of its cycle), holds, then fades back gradually', async () => {
    await render(<Loader id="snake" variant="pixel" pattern="snake" delay={0} />);
    const o = at(q('#snake svg > g > rect'), null, [0, 225, 450, 750, 1050, 1310], opacity);
    expect([o[0], o[2], o[3], o[5]], JSON.stringify(o)).toEqual([0.15, 1, 1, 0.15]);
    for (const v of [o[1], o[4]]) { expect(v).toBeGreaterThan(0.3); expect(v).toBeLessThan(0.9); }
  });

  test('every pixel pattern is as smooth as the wave (no faster change per 1% of its cycle)', async () => {
    const pats = ['wave', 'random', 'sweep', 'fall', 'rise', 'snake', 'spiral', 'cross', 'checker'] as const;
    await render(<>{pats.map((p) => <Loader key={p} id={'s-' + p} variant="pixel" pattern={p} delay={0} label="" />)}</>);
    const smooth: Record<string, number> = {};
    for (const p of pats) {
      const r = q(`#s-${p} svg > g > rect`), a = r.getAnimations()[0];
      const { duration, delay } = a.effect!.getComputedTiming();
      let max = 0, prev: number | null = null;
      a.pause();
      for (let k = 0; k <= 100; k++) {
        a.currentTime = (delay || 0) + (duration as number) * k / 100;
        const o = parseFloat(getComputedStyle(r).opacity);
        if (prev !== null) max = Math.max(max, Math.abs(o - prev));
        prev = o;
      }
      a.play();
      smooth[p] = +max.toFixed(3);
    }
    expect(Object.values(smooth).every((m) => m <= smooth.wave + 0.001), JSON.stringify(smooth)).toBe(true);
  });

  test('glow (pixel only): a 2px halo of the loader color (glow-size), off without it, ignored by other variants; --loader-pixel-glow sets another halo', async () => {
    await render(<>
      <Loader id="px" variant="pixel" delay={0} />
      <Loader id="pxgp" variant="pixel" glow delay={0} />
      <Loader id="ringglow" glow delay={0} />
      <Loader id="pxglow" variant="pixel" delay={0} style={vars({ '--loader-pixel-glow': 'var(--spacing-1)' })} />
    </>);
    const f = (id: string) => css(q(`#${id} svg`)).filter;
    expect(f('pxgp')).toMatch(/drop-shadow\(.*2px\)/);
    expect(el('pxgp').className).toMatch(/dk-loader--glow/);
    expect(el('ringglow').className).not.toMatch(/glow/);
    expect(f('px')).not.toMatch(/ 2px\)/);
    expect(f('px')).toMatch(/drop-shadow\(.*0px\)|^none$/);
    expect(f('px')).not.toMatch(/ [1-9]\d*px\)/);
    expect(f('pxglow')).toMatch(/4px/);
  });

  test('spokes: eight rounded spokes round a circle, 24px (md) and 40px (lg), in the text color (or the tone)', async () => {
    await render(<><Loader id="spk" variant="spokes" delay={0} /><Loader id="spklg" variant="spokes" size="lg" tone="primary" delay={0} /></>);
    const ls = [...el('spk').querySelectorAll('svg line')], s = css(ls[0]);
    expect([ls.length, el('spk').dataset.variant, s.strokeLinecap, s.strokeWidth]).toEqual([8, 'spokes', 'round', '4px']);
    expect((ls[0].parentNode as Element).getAttribute('transform')).toBe('scale(0.625)');
    expect(['x1', 'y1', 'x2', 'y2'].map((k) => ls[0].getAttribute(k)).join()).toBe('19.2,4,19.2,9.6');
    expect(s.stroke).toBe(css(el('spk')).color);
    expect(css(q('#spklg line')).stroke).toBe(color('var(--primary)'));
    expect([box('spk'), box('spklg')]).toEqual([[24, 24], [40, 40]]);
  });

  test('spokes: iOS proportions: each spoke about 10% of the size wide and 25% long, round a hole 40% across', async () => {
    await render(<Loader id="spk" variant="spokes" delay={0} />);
    const u = el('spk').getBoundingClientRect().width / 24, sc = 0.625;
    const w = 2.5 * u, len = ((9.6 - 4) * sc + 2.5) * u, hole = ((19.2 - 9.6) * sc - 1.25) * 2 / 24;
    expect(Math.abs(w / 24 - 0.104)).toBeLessThan(0.005);
    expect(Math.abs(len / 24 - 0.25)).toBeLessThan(0.01);
    expect(Math.abs(hole - 0.4)).toBeLessThan(0.01);
  });

  test('spokes: the lead spoke at full strength, the ones behind it (anticlockwise) fading to 25%', async () => {
    await render(<Loader id="spk" variant="spokes" delay={0} />);
    const ls = [...el('spk').querySelectorAll('svg line')];
    expect(ls.map((l) => l.getAttribute('transform')).join('|')).toBe([0, -45, -90, -135, -180, -225, -270, -315].map((d) => `rotate(${d} 19.2 19.2)`).join('|'));
    expect(ls.map((l) => +getComputedStyle(l).opacity).join()).toBe('1,0.85,0.7,0.55,0.45,0.35,0.3,0.25');
  });

  test('spokes: ticks a spoke at a time (45° steps, no turning in between), a full turn every 1s', async () => {
    await render(<Loader id="spk" variant="spokes" delay={0} />);
    const svg = q('#spk svg'), s = css(svg);
    expect(`${s.animationName} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationIterationCount}`).toMatch(/^dk-loader-tick 1s (step-end|steps\(1(, (jump-)?end)?\)) infinite$/);
    const ticks = at(svg, null, [0, 60, 130, 260, 990], (n) => { const m = new DOMMatrix(getComputedStyle(n).transform); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI); });
    expect(ticks).toEqual([0, 0, 45, 90, -45]);
  });

  test('tone neutral (default) draws in the text color around it; current, removed in 4.0.0, falls back to neutral like any unknown tone, with no warning', async () => {
    const warn = vi.spyOn(console, 'warn');
    await render(<>
      <Loader id="ring" delay={0} />
      <span style={{ color: 'rgb(200, 30, 40)' }}>
        <Loader id="tneutral" tone="neutral" delay={0} />
        {/* @ts-expect-error: removed in 4.0.0 */}
        <Loader id="tcurrent" tone="current" delay={0} />
        <Loader id="inherit" delay={0} />
      </span>
    </>);
    const strip = (e: HTMLElement) => e.className.replace(/\s+/g, ' ');
    expect([css(el('tneutral')).color, css(el('tcurrent')).color]).toEqual(['rgb(200, 30, 40)', 'rgb(200, 30, 40)']);
    expect(strip(el('tneutral'))).toBe(strip(el('tcurrent')));
    expect(el('tneutral').className + el('tcurrent').className + el('ring').className).not.toMatch(/neutral|current/);
    expect(warn.mock.calls.filter((c) => /current/.test(String(c[0])))).toEqual([]);
    warn.mockRestore();
    expect([css(el('inherit')).color, css(q('#inherit svg > circle:last-of-type')).stroke]).toEqual(['rgb(200, 30, 40)', 'rgb(200, 30, 40)']);
  });

  test('tone primary and muted color the ring or dots with the alias colors, and follow a nested theme', async () => {
    await render(<>
      <Loader id="ring" delay={0} />
      <Loader id="primary" tone="primary" delay={0} />
      <Loader id="muted" tone="muted" delay={0} />
      <div data-theme="violet-dark"><Loader id="nested" tone="primary" delay={0} /></div>
    </>);
    const art = (id: string) => css(q(`#${id} > span`)).color;
    expect(art('primary')).toBe(color('var(--primary)'));
    expect(css(q('#primary svg > circle:last-of-type')).stroke).toBe(color('var(--primary)'));
    expect(art('muted')).toBe(color('var(--text-muted)'));
    expect(art('primary')).not.toBe(css(el('ring')).color);
    const probe = document.createElement('div');
    probe.setAttribute('data-theme', 'violet-dark');
    probe.style.color = 'var(--primary)';
    document.body.appendChild(probe);
    const violet = css(probe).color;
    probe.remove();
    expect(art('nested')).toBe(violet);
  });

  test('tone inverse: a white ring, and white words in the text variant, whatever the text color around it, in a dark theme too', async () => {
    await render(<div id="scrim" style={{ background: '#000', color: 'rgb(15, 23, 42)' }}>
      <Loader id="inverse" tone="inverse" delay={0} />
      <Loader id="inversetext" variant="text" tone="inverse" label="Uploading" delay={0} />
    </div>);
    expect(css(el('inverse')).color).toBe('rgb(255, 255, 255)');
    expect(css(q('#inverse svg > circle:last-of-type')).stroke).toBe('rgb(255, 255, 255)');
    expect(css(q('#inversetext span:has(> [data-words])')).color).toBe('rgb(255, 255, 255)');
    el('scrim').setAttribute('data-theme', 'blue-dark');
    expect(css(el('inverse')).color).toBe('rgb(255, 255, 255)');
  });

  test('component tokens: --loader-size-md and --loader-track-opacity on one loader', async () => {
    await render(<Loader id="tok" delay={0} style={vars({ '--loader-size-md': 'var(--spacing-8)', '--loader-track-opacity': '0' })} />);
    expect(box('tok')).toEqual([32, 32]);
    expect(css(q('#tok svg > circle:first-of-type')).opacity).toBe('0');
  });

  test('named: role="progressbar" (indeterminate: no value) with aria-label "Loading…"; label sets the name; label="" makes it decorative', async () => {
    await render(<><Loader id="ring" delay={0} /><Loader id="named" label="Loading projects" delay={0} /><Loader id="deco" label="" delay={0} /></>);
    const r = el('ring'), d = el('deco');
    expect([r.getAttribute('role'), r.getAttribute('aria-label'), r.hasAttribute('aria-valuenow'), r.hasAttribute('aria-hidden')]).toEqual(['progressbar', 'Loading…', false, false]);
    expect(el('named').getAttribute('aria-label')).toBe('Loading projects');
    expect([d.getAttribute('aria-hidden'), d.hasAttribute('role'), d.hasAttribute('aria-label')]).toEqual(['true', false, false]);
    await expect.element(page.getByRole('progressbar', { name: 'Loading projects' })).toBeInTheDocument();
  });

  test('the drawing itself is hidden from assistive tech and not focusable', async () => {
    await render(<>{(['ring', 'spokes', 'dots', 'pixel'] as const).map((v) => <Loader key={v} variant={v} delay={0} />)}</>);
    const svgs = [...document.querySelectorAll('[data-component=loader] svg')];
    expect(svgs.length).toBe(4);
    expect(svgs.every((s) => s.getAttribute('aria-hidden') === 'true' && s.getAttribute('focusable') === 'false')).toBe(true);
  });

  test('it is announced through the shared polite status region', async () => {
    await render(<Loader delay={0} />);
    await expect.poll(() => announcer()?.textContent).toMatch(/Loading/);
    expect([announcer().getAttribute('role'), announcer().getAttribute('aria-live')]).toEqual(['status', 'polite']);
  });

  test('ref, className and other attributes pass through; data attributes for tests', async () => {
    const ref = React.createRef<HTMLSpanElement>();
    await render(<Loader id="ref" delay={0} ref={ref} className="extra" data-x="y" />);
    const r = ref.current!;
    expect(r.id).toBe('ref');
    expect(r.classList.contains('extra')).toBe(true);
    expect([r.dataset.x, r.dataset.component, r.dataset.variant, r.dataset.size]).toEqual(['y', 'loader', 'ring', 'md']);
  });

  test('variant="text": just the words, no ring or dots, in the text color around it, 14px/20px (md), as tall as the line; hidden from assistive tech (no double reading)', async () => {
    await render(<span style={{ color: 'rgb(15, 23, 42)' }}><Loader id="lab" variant="text" label="Loading projects" delay={0} /></span>);
    const e = el('lab'), l = e.querySelector('span:has(> [data-words])')!, s = css(l);
    expect([l.textContent, !!e.querySelector('svg'), e.children.length, e.dataset.variant]).toEqual(['Loading projects', false, 1, 'text']);
    expect([s.color, `${s.fontSize}/${s.lineHeight}`, Math.round(e.getBoundingClientRect().height)]).toEqual(['rgb(15, 23, 42)', '14px/20px', 20]);
    expect([l.getAttribute('aria-hidden'), e.getAttribute('role'), e.getAttribute('aria-label')]).toEqual(['true', 'progressbar', 'Loading projects']);
  });

  test('shine: the words rest at 65% of the text color (label-dim); a soft-edged window half the words wide holds a full-color copy (not read: the label is hidden, and the copy is generated content), sweeping every 2s with ease-in-out, forever, on translate (EE1)', async () => {
    await render(<span style={{ color: 'rgb(15, 23, 42)' }}><Loader id="lab" variant="text" label="Loading projects" delay={0} /></span>);
    const l = q('#lab span:has(> [data-words])'), g = l.firstElementChild as HTMLElement, s = css(l), w = css(g), copy = getComputedStyle(g, '::after');
    expect(s.webkitTextFillColor).toMatch(/0\.65\)$/);
    expect([l.textContent, g.dataset.words, copy.content, copy.webkitTextFillColor, s.overflow]).toEqual(['Loading projects', 'Loading projects', '"Loading projects"', 'rgb(15, 23, 42)', 'hidden']);
    expect(w.maskImage || w.webkitMaskImage).toMatch(/linear-gradient/);
    expect(Math.round(g.getBoundingClientRect().width * 2)).toBe(Math.round(l.getBoundingClientRect().width));
    for (const a of [w, copy]) expect(`${a.animationName} ${a.animationDuration} ${a.animationTimingFunction} ${a.animationIterationCount}`).toBe('dk-loader-glint 2s cubic-bezier(0.65, 0, 0.35, 1) infinite');
  });

  test('shine: the window starts off the left of the words and ends off the right (seamless loop), halfway at half time (ease-in-out is symmetric), while the copy moves back by as much so it stays on the words', async () => {
    await render(<Loader id="lab" variant="text" label="Loading projects" delay={0} />);
    const l = q('#lab span:has(> [data-words])'), g = l.firstElementChild!, lw = l.getBoundingClientRect().width;
    const runs = g.getAnimations({ subtree: true }).filter((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === 'dk-loader-glint');
    expect(runs.length).toBe(2);
    const left = (ms: number) => { runs.forEach((a) => { a.pause(); a.currentTime = ms; }); return (g.getBoundingClientRect().left - l.getBoundingClientRect().left) / lw; };
    const [start, mid, end] = [left(0), left(1000), left(1999)];
    expect(start).toBeCloseTo(-0.5, 1);
    expect(mid).toBeCloseTo(0.25, 2);
    expect(end).toBeGreaterThan(0.99);
    // The copy's translate is the window's, undone: in the copy's own width (twice the window's), half as many percent, the other way.
    const pct = (el: Element, pseudo?: string) => parseFloat(getComputedStyle(el, pseudo).translate);
    runs.forEach((a) => { a.currentTime = 700; });
    const gw = g.getBoundingClientRect().width;
    expect(pct(g) / 100 * gw + pct(g, '::after') / 100 * gw * 2).toBeCloseTo(0, 0);
    runs.forEach((a) => a.play());
  });

  test('shine: the resting words (text at 65%) keep 4.5:1 on surface in all six themes', () => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = (c: number[]) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const out: Record<string, number> = {};
    for (const th of ['blue-light', 'blue-dark', 'violet-light', 'violet-dark', 'emerald-light', 'emerald-dark']) {
      const d = document.createElement('div');
      d.setAttribute('data-theme', th);
      d.style.cssText = 'color:var(--text);background:var(--surface);opacity:var(--loader-label-dim, var(--opacity-65))';
      document.body.appendChild(d);
      const s = getComputedStyle(d), a = parseFloat(s.opacity), fg = rgb(s.color), bg = rgb(s.backgroundColor);
      d.remove();
      const L = [lum(fg.map((x, i) => x * a + bg[i] * (1 - a))), lum(bg)].sort((x, y) => y - x);
      out[th] = Math.round(((L[0] + 0.05) / (L[1] + 0.05)) * 100) / 100;
    }
    expect(Object.entries(out).filter(([, r]) => r < 4.5)).toEqual([]);
  });

  test('text variant: tone primary keeps the words in the text color; sizes sm text-xs, md text-sm, lg text-base', async () => {
    await render(<>
      <span style={{ color: 'rgb(15, 23, 42)' }}><Loader id="labp" variant="text" tone="primary" label="Thinking" delay={0} /></span>
      <Loader id="labsm" variant="text" size="sm" label="Saving" delay={0} />
      <Loader id="lablg" variant="text" size="lg" label="Preparing" delay={0} />
    </>);
    expect(css(q('#labp span:has(> [data-words])')).color).toBe('rgb(15, 23, 42)');
    expect([css(q('#labsm span:has(> [data-words])')).fontSize, css(q('#lablg span:has(> [data-words])')).fontSize]).toEqual(['12px', '16px']);
  });

  test('text variant: with label="" it still shows "Loading…", decorative; without a label it shows and says "Loading…"; ring and dots have no words', async () => {
    await render(<>
      <Loader id="labempty" variant="text" label="" delay={0} />
      <Loader id="labdefault" variant="text" delay={0} />
      <Loader id="ring" delay={0} />
      <Loader id="dots" variant="dots" delay={0} />
    </>);
    const e = el('labempty'), d = el('labdefault');
    expect([e.querySelector('span:has(> [data-words])')!.textContent, e.getAttribute('aria-hidden'), e.getAttribute('role')]).toEqual(['Loading…', 'true', null]);
    expect([d.querySelector('span:has(> [data-words])')!.textContent, d.getAttribute('aria-label')]).toEqual(['Loading…', 'Loading…']);
    expect([!!q('#ring span:has(> [data-words])'), !!q('#dots span:has(> [data-words])')]).toEqual([false, false]);
    expect(box('ring')).toEqual([24, 24]);
  });

  test('forced colors: skeleton bones keep a still GrayText fill instead of going blank (AM1)', async () => {
    await render(<div style={{ background: 'Canvas' }}><Loader id="fcs" variant="skeleton" lines={2} label="" delay={0} /></div>);
    const r = await forcedColors(async (active) => {
      if (!active) return null;
      const bone = css(q('#fcs span:empty')), page = css(q('#fcs').parentElement);
      return [bone.backgroundColor !== page.backgroundColor && bone.backgroundColor !== 'rgba(0, 0, 0, 0)', getComputedStyle(q('#fcs span:empty'), '::after').display];
    });
    if (r) expect(r).toEqual([true, 'none']);
  });

  function Skeletons() {
    return <div style={{ width: '300px', color: 'rgb(15, 23, 42)' }}>
      <Loader id="sk1" variant="skeleton" delay={0} />
      <Loader id="sk3" variant="skeleton" lines={3} label="" delay={0} />
      <Loader id="sksm" variant="skeleton" size="sm" lines={2} label="" delay={0} />
      <Loader id="sklg" variant="skeleton" size="lg" label="" delay={0} />
      <Loader id="skc" variant="skeleton" shape="circle" label="" delay={0} />
      <Loader id="skclg" variant="skeleton" shape="circle" size="lg" label="" delay={0} />
      <Loader id="skcz" variant="skeleton" shape="circle" className="size-12" label="" delay={0} />
      <Loader id="skr" variant="skeleton" shape="rect" label="" delay={0} />
      <Loader id="skrc" variant="skeleton" shape="rect" className="w-48 h-32" label="" delay={0} />
      {/* @ts-expect-error: an unknown shape */}
      <Loader id="skbad" variant="skeleton" shape="hex" lines={99} label="" delay={0} />
      <Loader id="skp" variant="skeleton" tone="primary" label="" delay={0} />
      <Loader id="sktok" variant="skeleton" shape="rect" label="" delay={0} style={vars({ '--loader-skeleton-rect-height': 'var(--spacing-10)', '--loader-skeleton-radius': '0' })} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <Loader id="skav" variant="skeleton" shape="circle" size="lg" label="" delay={0} />
        <Loader id="skrow" variant="skeleton" lines={2} label="" delay={0} />
      </div>
    </div>;
  }
  const bones = (id: string) => [...el(id).querySelectorAll('span:empty')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  const lines = (id: string) => el(id).querySelectorAll(':scope > span:not(:empty)').length;
  const radius = (id: string) => css(el(id).querySelector('span:empty')).borderRadius;

  test('skeleton: shape "text" by default, one line as tall as the text-sm line (20px) with a 14px bar, full width, 4px corners; lines={3} is a paragraph, the last 60% wide', async () => {
    await render(<Skeletons />);
    expect([el('sk1').dataset.variant, el('sk1').dataset.shape, lines('sk1'), box('sk1'), bones('sk1'), radius('sk1')]).toEqual(['skeleton', 'text', 1, [300, 20], [[300, 14]], '4px']);
    expect(el('sk1').querySelectorAll('svg, [data-words]').length).toBe(0);
    expect([lines('sk3'), box('sk3')[1], bones('sk3')]).toEqual([3, 60, [[300, 14], [300, 14], [180, 14]]]);
  });

  test('skeleton text sizes: sm 16px lines with 12px bars, lg 24px lines with 16px bars', async () => {
    await render(<Skeletons />);
    expect([box('sksm')[1], bones('sksm')[0][1], box('sklg')[1], bones('sklg')[0][1]]).toEqual([32, 12, 24, 16]);
  });

  test('skeleton circle: the loader size (24px md, 40px lg), fully round; className (size-12) sets another size', async () => {
    await render(<Skeletons />);
    expect([box('skc'), box('skclg')[0], box('skcz'), bones('skcz')]).toEqual([[24, 24], 40, [48, 48], [[48, 48]]]);
    expect(parseFloat(radius('skc'))).toBeGreaterThanOrEqual(9999);
  });

  test('skeleton rect: full width and 96px tall, 6px corners; className (w-48 h-32) sets the size; tokens --loader-skeleton-rect-height and --loader-skeleton-radius', async () => {
    await render(<Skeletons />);
    expect([box('skr'), radius('skr'), box('skrc'), bones('skrc')]).toEqual([[300, 96], '6px', [192, 128], [[192, 128]]]);
    expect([box('sktok')[1], radius('sktok')]).toEqual([40, '0px']);
  });

  test('skeleton: in a row next to an avatar, the lines take the rest of the width and the avatar keeps its size; an unknown shape falls back to text, lines are kept to 20', async () => {
    await render(<Skeletons />);
    expect([box('skav')[0], box('skrow')[0]]).toEqual([40, 248]);
    expect([el('skbad').dataset.shape, lines('skbad')]).toEqual(['text', 20]);
  });

  test('skeleton: named like the others (progressbar "Loading…"); label="" makes it decorative; tone primary is ignored, inverse is white', async () => {
    await render(<><Skeletons /><div style={{ background: '#000', width: '200px' }}><Loader id="skinv" variant="skeleton" tone="inverse" label="" delay={0} /></div></>);
    expect([el('sk1').getAttribute('role'), el('sk1').getAttribute('aria-label')]).toEqual(['progressbar', 'Loading…']);
    expect([el('sk3').getAttribute('aria-hidden'), el('sk3').getAttribute('role')]).toEqual(['true', null]);
    expect([css(el('skp')).color, css(el('skinv')).color]).toEqual(['rgb(15, 23, 42)', 'rgb(255, 255, 255)']);
  });

  test('skeleton fill: the text color at 10%, with a lighter band (5%) sweeping left to right every 2s, ease-in-out, on translate (EE1)', async () => {
    await render(<Skeletons />);
    const b = q('#sk1 span:empty'), s = getComputedStyle(b, '::after'), stops = s.backgroundImage.match(/color\(srgb [^)]*\)|rgba?\([^)]*\)/g) || [];
    expect(stops.length).toBe(13);
    expect(stops[0]).toMatch(/15 23 42|0\.0588/);
    expect(stops[0]).toMatch(/\/ 0\.1\)|, 0\.1\)/);
    expect(stops[6]).toMatch(/\/ 0\.05\)|, 0\.05\)/);
    expect(`${s.animationName} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationIterationCount}`).toBe('dk-loader-sweep 2s cubic-bezier(0.65, 0, 0.35, 1) infinite');
    // Three bones wide, it starts with its last third on the bone and ends with its first: the band passes through.
    const w = b.getBoundingClientRect().width;
    expect([Math.round(parseFloat(s.width) / w), css(b).overflow]).toEqual([3, 'hidden']);
    const moves = b.getAnimations({ subtree: true }).filter((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === 'dk-loader-sweep');
    // read the band where the sweep ends (Firefox hands back the keyframe's var() unresolved): two bones on,
    // a percentage of the band or a length
    moves[0].pause();
    moves[0].currentTime = 1999;
    const t = getComputedStyle(b, '::after').translate;
    const moved = t.endsWith('%') ? parseFloat(t) / 100 * parseFloat(s.width) / w : parseFloat(t) / w;
    moves[0].play();
    expect(Math.round(moved)).toBe(2);
  });

  test('delay: for the first 300ms nothing shows or is announced, but its space is kept (a waiting skeleton keeps its shapes); then it fades in, becomes a progressbar and is announced', async () => {
    let show!: () => void;
    function App() {
      const [late, setLate] = React.useState(false);
      show = () => setLate(true);
      return <div style={{ width: '300px' }}>
        {late ? <Loader id="delayed" /> : null}
        {late ? <Loader id="skwait" variant="skeleton" lines={2} label="" /> : null}
      </div>;
    }
    await render(<App />);
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);   // earlier tests' announcements have all been said
    if (announcer()) announcer().textContent = '';
    const t0 = performance.now();
    show();
    await expect.poll(() => document.getElementById('delayed')).toBeTruthy();
    await settle(100);
    const e = el('delayed');
    expect(performance.now() - t0).toBeLessThan(290);
    expect([css(e).visibility, !!e.querySelector('svg'), e.getAttribute('aria-hidden'), e.getAttribute('role'), box('delayed')[0], announcer()?.textContent || '']).toEqual(['hidden', false, 'true', null, 24, '']);
    expect([css(el('skwait')).visibility, lines('skwait'), box('skwait')[1]]).toEqual(['hidden', 2, 40]);
    await expect.poll(() => el('delayed').getAttribute('role'), { timeout: 2000 }).toBe('progressbar');
    expect(performance.now() - t0).toBeGreaterThanOrEqual(300);
    expect([css(el('delayed')).visibility, !!el('delayed').querySelector('svg'), css(el('delayed')).animationName]).toEqual(['visible', true, 'dk-loader-in']);
    await expect.poll(() => announcer().textContent).toMatch(/Loading/);
  });

  test('delay: a loader removed before 300ms never appears (a fast request shows nothing)', async () => {
    let hide!: () => void;
    function App() {
      const [quick, setQuick] = React.useState(true);
      hide = () => setQuick(false);
      return quick ? <Loader id="quick" /> : null;
    }
    await render(<App />);
    await settle(100);
    expect(css(el('quick')).visibility).toBe('hidden');
    hide();
    await expect.poll(() => document.getElementById('quick')).toBeNull();
  });

  test('reduced motion: the label is plain text; the ring (a quarter arc) and the spokes stand still and breathe (opacity, 1.4s); the dots only fade (EE1)', async () => {
    await render(<>
      <span style={{ color: 'rgb(15, 23, 42)' }}><Loader id="lab" variant="text" label="Loading projects" delay={0} /></span>
      <Loader id="ring" delay={0} />
      <Loader id="dots" variant="dots" delay={0} />
      <Loader id="spk" variant="spokes" delay={0} />
    </>);
    const restore = reduceMotion();
    try {
      const l = css(q('#lab span:has(> [data-words])'));
      expect([l.webkitTextFillColor, css(q('#lab [data-words]')).display]).toEqual([l.color, 'none']);
      const arc = css(q('#ring svg > circle:last-of-type'));
      const ring = css(q('#ring svg'));
      expect([`${ring.animationName} ${ring.animationDuration}`, arc.animationName]).toEqual(['dk-loader-breathe 1.4s', 'none']);
      expect(arc.strokeDasharray).toMatch(/^25(px)?,? 150/);
      expect(css(q('#dots svg circle')).animationName).toBe('dk-loader-dot-fade');
      const spk = css(q('#spk svg'));
      expect(`${spk.animationName} ${spk.animationDuration}`).toBe('dk-loader-breathe 1.4s');
    } finally { restore(); }
  });

  test('reduced motion: every pixel pattern keeps fading (no movement) at half speed (2.4s; snake and spiral 3s; cross and checker 2s; random 4s on one shared clock, keeping its scattered starts)', async () => {
    const pats = ['wave', 'random', 'sweep', 'snake', 'spiral', 'cross', 'checker'] as const;
    await render(<>{pats.map((p) => <Loader key={p} id={'r-' + p} variant="pixel" pattern={p} delay={0} label="" />)}</>);
    const restore = reduceMotion();
    try {
      const w = css(q('#r-wave svg > g > rect'));
      expect([w.animationName, w.animationDuration]).toEqual(['dk-loader-pixel', '2.4s']);
      expect(pats.map((p) => css(q(`#r-${p} svg > g > rect`)).animationDuration).join()).toBe('2.4s,4s,2.4s,3s,3s,2s,2s');
      const rs = [...document.querySelectorAll('#r-random svg > g > rect')].map((r) => getComputedStyle(r));
      expect([new Set(rs.map((s) => s.animationDuration)).size, rs[0].animationDuration]).toEqual([1, '4s']);
      expect(new Set(rs.map((s) => s.animationDelay)).size).toBeGreaterThanOrEqual(8);
    } finally { restore(); }
  });

  test('reduced motion: the skeleton is a still fill (the text color at 10%), no shimmer', async () => {
    await render(<div style={{ width: '300px', color: 'rgb(15, 23, 42)' }}><Loader id="sk1" variant="skeleton" delay={0} /></div>);
    const restore = reduceMotion();
    try {
      const s = css(q('#sk1 span:empty'));
      expect([s.animationName, s.backgroundImage]).toEqual(['none', 'none']);
      expect([s.backgroundColor, getComputedStyle(q('#sk1 span:empty'), '::after').display]).toEqual([expect.stringMatching(/0\.1\)$/), 'none']);
    } finally { restore(); }
  });
});
