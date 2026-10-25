import * as React from 'react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, color, css, keepMotion, press } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { Badge, type BadgeTone, type BadgeVariant } from './Badge';

// About motion: transitions and animations stay on for this file (setup.ts turns them off elsewhere).
keepMotion();

const TONES: BadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const VARIANTS: BadgeVariant[] = ['subtle', 'solid', 'outline'];

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const tv = (t: string, v: string) => q(`[data-t="${t}"][data-v="${v}"]`);

// Badge warns once per page, so every warning is collected from the start of the file.
const warns: string[] = [];
beforeAll(() => { vi.spyOn(console, 'warn').mockImplementation((m) => { warns.push(String(m)); }); });

// Colors with alpha, composited over what's behind them, for WCAG contrast.
type RGBA = [number, number, number, number];
const rgb = (c: string): RGBA => { const m = (c.match(/[\d.]+/g) || []).map(Number); const k = /^color\(srgb/.test(c) ? 255 : 1; return [m[0] * k, m[1] * k, m[2] * k, m.length > 3 ? m[3] : 1]; };
const lum = (c: RGBA) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const over = (fg: RGBA, bg: RGBA): RGBA => (fg[3] >= 1 ? fg : fg.map((x, i) => (i < 3 ? x * fg[3] + bg[i] * (1 - fg[3]) : 1)) as RGBA);
const ratio = (a: RGBA, b: RGBA) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const surface = () => rgb(color('var(--surface)'));

// Waits until nothing (finite) is still animating or transitioning.
const animationsDone = () => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));

/** Holds the mouse button down on an element for `ms` (a real press: :active, pointerdown), running `during` while it is held. */
async function hold<T>(target: Element, during: () => Promise<T> | T, { ms = 400, at }: { ms?: number; at?: { x: number; y: number } } = {}): Promise<T> {
  // userEvent calls start once awaited (then), so chain one now and look while the button is down.
  const click = userEvent.click(target, { delay: ms, position: at, force: true }).then(() => {});
  await expect.poll(() => target.matches(':active') || target.querySelector('.dk-badge__ripple') != null || target.hasAttribute('disabled'), { interval: 10 }).toBe(true);
  const out = await during();
  await click;
  return out;
}

/** Emulates prefers-reduced-motion: reduce (CSS media rules and matchMedia) until the returned function is called. */
function reduceMotion(): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.media.mediaText)) {
        const was = r.media.mediaText;
        flipped.push([r.media, was]);
        r.media.mediaText = /reduce/.test(was) ? 'all' : 'not all';
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
  const mm = window.matchMedia;
  window.matchMedia = ((query: string) => (/prefers-reduced-motion:\s*reduce/.test(query) ? { ...mm.call(window, 'all'), matches: true, media: query } : mm.call(window, query)));
  return () => { for (const [m, t] of flipped) m.mediaText = t; window.matchMedia = mm; };
}

let clicks = 0, removed: string[] = [];
const hit = () => { clicks++; };
let setLoading: (v: boolean) => void = () => {}, setCount: (n: number) => void = () => {};
const badgeRef = React.createRef<HTMLElement>();

function App() {
  const [tags, setTags] = React.useState(['Design', 'Research']);
  const [loading, sl] = React.useState(false); setLoading = sl;
  const [count, sc] = React.useState(0); setCount = sc;
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
    <Badge id="def">Default</Badge>
    {/* @ts-expect-error: unknown values, as plain JavaScript could pass */}
    <Badge id="bad" variant="glow" tone="gold" size="xl">Bad</Badge>
    {/* @ts-expect-error: the removed size prop */}
    <Badge id="sm" size="md">Old size</Badge>
    {TONES.map((t) => VARIANTS.map((v) => <Badge key={t + v} data-t={t} data-v={v} tone={t} variant={v}>{t}</Badge>))}
    {TONES.map((t) => VARIANTS.map((v) => <Badge key={'i' + t + v} data-it={t} data-v={v} tone={t} variant={v} onClick={hit}>{t}</Badge>))}
    <Badge id="btn" tone="primary" onClick={hit}>Click</Badge>
    <Badge id="sbtn" variant="solid" tone="primary" onClick={hit}>Solid</Badge>
    <Badge id="lnk" tone="info" href="#here" target="_blank">Link</Badge>
    <Badge id="dis" onClick={hit} disabled>Off</Badge>
    <Badge id="mi" tone="violet" onClick={hit} style={{ width: '160px' }}>Press me</Badge>
    <Badge id="mioff" onClick={hit} style={{ '--badge-ripple-opacity': '0', '--badge-press-scale': '100%' } as React.CSSProperties}>Calm</Badge>
    <Badge id="mipd" onClick={hit} onPointerDown={(e) => e.preventDefault()}>Mine</Badge>
    <Badge id="both" onClick={hit} onRemove={() => {}}>Both</Badge>
    <Badge id="ld" tone="success" leftIcon="check" onClick={hit} loading={loading}>Approve request</Badge>
    <Badge id="ldspan" loading loadingText="Syncing">Syncing</Badge>
    <Badge id="ldrm" loading onRemove={() => { removed.push('ldrm'); }}>Tag</Badge>
    <div id="ob">
      <Badge>Status</Badge>
      <Badge leftIcon="category">Status</Badge>
      <Badge dot>Status</Badge>
      <Badge onRemove={() => {}}>Status</Badge>
      <Badge leftIcon="category" onRemove={() => {}}>Status</Badge>
      <Badge count={5} />
      <span dir="rtl"><Badge leftIcon="category">Status</Badge></span>
    </div>
    <Badge id="pg" dot ping tone="danger" variant="solid">Live</Badge>
    <Badge id="pgind" dot ping tone="success" />
    <Badge id="pgabs" dot ping className="absolute" style={{ top: '0px', left: '0px' }} />
    <Badge id="pgnodot" ping>No dot</Badge>
    <Badge id="pgicon" ping dot leftIcon="check">Icon</Badge>
    <Badge id="ind" dot tone="danger" />
    <Badge id="indsm" dot variant="outline" />
    <Badge id="indnamed" dot tone="success" aria-label="Online" />
    <Badge id="indclick" dot onClick={hit} onRemove={() => {}} />
    <Badge id="dot" tone="success" dot>Online</Badge>
    <Badge id="icon" tone="warning" leftIcon="schedule" dot>Pending</Badge>
    <Badge id="c3" tone="danger" variant="solid" count={3} />
    <Badge id="c120" count={120} />
    <Badge id="c12m9" count={12} max={9} />
    <span id="zero"><Badge count={0} /></span>
    <span id="grow"><Badge count={count} /></span>
    <Badge id="zshow" count={0} showZero />
    <Badge id="ref" ref={badgeRef} className="extra" data-x="y" title="tip">Ref</Badge>
    <div id="tags">{tags.map((t) => <Badge key={t} tone="violet" onRemove={() => { removed.push(t); setTags((x) => x.filter((y) => y !== t)); }}>{t}</Badge>)}</div>
    <Badge id="rmlabel" onRemove={() => {}} removeLabel="Clear filter">Status: open</Badge>
    <div id="nest" data-theme="blue-dark" style={{ background: 'var(--surface)', padding: '4px' }}>
      <Badge id="indark" tone="violet">Dark</Badge>
      <div data-theme="blue-light"><Badge id="inlight" tone="violet">Light</Badge></div>
    </div>
  </div>;
}

async function show() {
  clicks = 0; removed = [];
  await render(<App />);
}
afterEach(async () => { await userEvent.unhover(document.body).catch(() => {}); });

describe('Badge', () => {
  // EB1: loading that ended a moment after it started flashed the ring for a frame or two.
  test('loading that ends after 20ms keeps the ring at least 500ms; it shows in the same render that turns it on', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      let set: (v: boolean) => void = () => {};
      function Wait() { const [on, s] = React.useState(false); set = s; return <Badge id="bl" loading={on}>Syncing</Badge>; }
      await render(<Wait />);
      const step = (ms: number) => React.act(async () => { vi.advanceTimersByTime(ms); });
      const busy = () => document.getElementById('bl')!.hasAttribute('aria-busy');
      await React.act(async () => set(true));
      expect(busy()).toBe(true);
      await step(20);
      await React.act(async () => set(false));
      await step(470);
      expect(busy()).toBe(true);    // 490ms
      await step(10);
      expect(busy()).toBe(false);   // 500ms
    } finally {
      await React.act(async () => { vi.advanceTimersByTime(5000); });   // the announcer's timers run out
      vi.useRealTimers();
    }
  });

  test('defaults: a <span> badge, subtle, neutral, with no size attribute or class; unknown variant and tone fall back to subtle and neutral', async () => {
    await show();
    const d = el('def');
    expect([d.tagName, d.dataset.component, d.dataset.variant, d.dataset.tone, d.hasAttribute('data-size'), /size/.test(d.className), d.querySelector('.dk-badge__label')!.textContent])
      .toEqual(['SPAN', 'badge', 'subtle', 'neutral', false, false, 'Default']);
    expect([el('bad').dataset.variant, el('bad').dataset.tone]).toEqual(['subtle', 'neutral']);
  });

  test('one size: 20px, text-xs, font-medium, 6px side padding and corners; the removed size prop is ignored (never reaches the DOM) with a warning', async () => {
    await show();
    const s = css(el('def'));
    expect([s.height, s.fontSize, s.lineHeight, s.fontWeight, s.borderTopLeftRadius, s.paddingLeft]).toEqual(['20px', '12px', '16px', '500', '6px', '6px']);
    expect([css(el('sm')).height, el('sm').getAttribute('size'), /size/.test(el('sm').className)]).toEqual(['20px', null, false]);
    expect(warns.some((m) => /size was removed in 4\.0\.0/.test(m))).toBe(true);
    expect([el('bad').getAttribute('size'), el('bad').dataset.size]).toEqual([null, undefined]);
  });

  test('outline: a 1px border on a transparent background', async () => {
    await show();
    const s = css(tv('success', 'outline'));
    expect([s.borderTopWidth, s.borderTopStyle, s.backgroundColor]).toEqual(['1px', 'solid', 'rgba(0, 0, 0, 0)']);
  });

  test(`contrast: all ${TONES.length} tones × 3 variants keep 4.5:1 text (and 3:1 outline borders) in all six themes`, async () => {
    await show();
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const surf = surface();
      for (const t of TONES) for (const v of VARIANTS) {
        const s = css(tv(t, v));
        const bg = v === 'outline' ? surf : over(rgb(s.backgroundColor), surf), fg = over(rgb(s.color), bg);
        const r = ratio(fg, bg); n++;
        if (r < 4.5) low.push(`${th} ${t} ${v}: ${r.toFixed(2)}`);
        if (v === 'outline' && t !== 'neutral') { const bd = ratio(over(rgb(s.borderTopColor), surf), surf); if (bd < 3) low.push(`${th} ${t} border: ${bd.toFixed(2)}`); }
      }
    }
    expect(low).toEqual([]);
    expect(n).toBe(TONES.length * 3 * 6);
  });

  test('palette tones each have their own color, and the status tones map to green, amber, red and sky; primary is the theme\'s primary', async () => {
    await show();
    const pal = ['violet', 'teal', 'amber'].map((t) => VARIANTS.map((v) => { const s = css(tv(t, v)); return v === 'outline' ? s.borderTopColor : s.backgroundColor; }));
    for (const k of [0, 1, 2]) expect(new Set(pal.map((x) => x[k])).size).toBe(3);
    expect(css(tv('success', 'solid')).backgroundColor).toBe(css(tv('green', 'solid')).backgroundColor);
    expect(css(tv('warning', 'subtle')).color).toBe(css(tv('amber', 'subtle')).color);
    expect(css(tv('primary', 'solid')).backgroundColor).toBe(color('var(--primary)'));
  });

  test('palette tones follow the nearest theme: dark steps inside a dark area, light steps in a light area nested in it', async () => {
    await show();
    const [dark, light, page] = [css(el('indark')).backgroundColor, css(el('inlight')).backgroundColor, css(tv('violet', 'subtle')).backgroundColor];
    expect(dark).not.toBe(light);
    expect(light).toBe(page);
  });

  test('dot: a 6px round dot centered in a 10×12px box (as tall as an icon, 2px narrower) before the label, in the text color, hidden from screen readers', async () => {
    await show();
    const e = el('dot'), d = e.querySelector('.dk-badge__dot') as HTMLElement, bx = d.parentElement!, s = css(d), br = bx.getBoundingClientRect(), dr = d.getBoundingClientRect();
    expect(e.firstElementChild).toBe(bx);
    expect(bx.classList.contains('dk-badge__icon--dot')).toBe(true);
    expect([br.width, br.height]).toEqual([10, 12]);
    expect(Math.abs((dr.left + dr.width / 2) - (br.left + br.width / 2))).toBeLessThan(0.5);
    expect(Math.abs((dr.top + dr.height / 2) - (br.top + br.height / 2))).toBeLessThan(0.5);
    expect([s.width, s.height, s.backgroundColor, bx.getAttribute('aria-hidden')]).toEqual(['6px', '6px', css(e).color, 'true']);
    expect(parseFloat(s.borderTopLeftRadius)).toBeGreaterThanOrEqual(3);
  });

  test('leftIcon: a Material Symbols icon before the label at 12px, decorative; it replaces the dot', async () => {
    await show();
    const e = el('icon'), i = e.querySelector('.dk-badge__icon') as HTMLElement;
    expect([(i.querySelector('[data-icon]') as HTMLElement).dataset.icon, i.getAttribute('aria-hidden'), css(i.querySelector('[data-icon]')).fontSize, !!e.querySelector('.dk-badge__dot')])
      .toEqual(['schedule', 'true', '12px', false]);
  });

  test('count: written in the digits of the locale, as Calendar writes its days: ٧ and ٩٩+ in ar-EG, ۱۲ in fa', async () => {
    await render(<>
      <SerupaProvider locale="ar-EG"><Badge id="car7" count={7} /><Badge id="car120" count={120} /></SerupaProvider>
      <SerupaProvider locale="fa"><Badge id="cfa12" count={12} /></SerupaProvider>
      <SerupaProvider locale="en-US"><Badge id="cen1500" count={1500} max={9999} /></SerupaProvider>
    </>);
    const shown = (id: string) => { const e = document.getElementById(id)!; return (e.querySelector('[aria-hidden="true"]') || e).textContent; };
    expect(['car7', 'car120', 'cfa12', 'cen1500'].map(shown)).toEqual(['٧', '٩٩+', '۱۲', '1500']);
    expect([document.getElementById('car120')!.title, document.getElementById('car120')!.querySelector('.dk-visually-hidden')!.textContent]).toEqual(['١٢٠', '١٢٠']);
  });

  test('count: a round pill (20px for one digit), "99+" past the default max, "max+" past a given max; nothing at 0, unless showZero', async () => {
    await show();
    const m = (id: string) => { const e = el(id), r = e.getBoundingClientRect(); return [(e.querySelector('[aria-hidden="true"]') || e).textContent, Math.round(r.width), Math.round(r.height), css(e).borderTopLeftRadius, css(e).fontVariantNumeric] as const; };
    const c3 = m('c3');
    expect([c3[0], c3[1], c3[2], c3[4]]).toEqual(['3', 20, 20, 'tabular-nums']);
    expect(parseFloat(c3[3])).toBeGreaterThanOrEqual(10);
    expect(m('c120')[0]).toBe('99+');
    expect(m('c120')[1]).toBeGreaterThan(20);
    expect(m('c12m9')[0]).toBe('9+');
    expect(el('zero').children.length).toBe(0);
    expect(m('zshow')[0]).toBe('0');
  });

  test('count past max: "99+" shows, and screen readers and the tooltip get the real count (AW1); your title wins', async () => {
    await render(<><Badge id="big" count={150} /><Badge id="own" count={150} title="150 unread messages" /><Badge id="few" count={7} /></>);
    const big = el('big');
    expect([big.title, big.querySelector('[aria-hidden="true"]')!.textContent, el('own').title, el('few').title, el('few').querySelector('.dk-visually-hidden'), big.querySelector('.dk-visually-hidden')!.textContent]).toEqual(['150', '99+', '150 unread messages', '', null, '150']);
  });

  test('count: a badge whose count goes from 0 to 2 and back to 0 appears and disappears without an error (hooks run on every render)', async () => {
    await show();
    setCount(2);
    await expect.poll(() => el('grow').querySelector('.dk-badge')?.textContent ?? null).toBe('2');
    setCount(0);
    await expect.poll(() => el('grow').children.length).toBe(0);
  });

  test('removable: a real <button type="button"> named "Remove Design" (removeLabel changes the verb), with a close icon', async () => {
    await show();
    const b = q('#tags button') as HTMLButtonElement;
    expect([b.tagName, b.type, b.getAttribute('aria-label'), (b.querySelector('[data-icon]') as HTMLElement).dataset.icon, q('#rmlabel button').getAttribute('aria-label')])
      .toEqual(['BUTTON', 'button', 'Remove Design', 'close', 'Clear filter Status: open']);
    await expect.element(page.getByRole('button', { name: 'Remove Design' })).toBeInTheDocument();
  });

  test('removable: the × mirrors a leading icon (a 12px box, --badge-gap less 2px from the label, the badge padding at the end, less 2px; a × with no leading icon adds the 2px offset at the start), and keeps a 24×24 target', async () => {
    await show();
    const e = q('#tags .dk-badge'), l = e.querySelector('.dk-badge__label')!.getBoundingClientRect(), btn = e.querySelector('button')!, b = btn.getBoundingClientRect(), r = e.getBoundingClientRect(), cs = css(e);
    const ring = getComputedStyle(btn, '::after');
    expect([b.width, b.height]).toEqual([12, 20]);
    expect(Math.round((b.left - l.right) * 10) / 10).toBe(2);
    expect(Math.round((r.right - b.right) * 10) / 10).toBe(5);
    expect([parseFloat(cs.paddingLeft), parseFloat(cs.paddingRight)]).toEqual([8, 6]);
    for (const [x, y] of [[b.left - 4, b.top + b.height / 2], [b.right + 4, b.top + b.height / 2], [b.left + b.width / 2, b.top - 1], [b.left + b.width / 2, b.bottom + 1]]) {
      expect(document.elementFromPoint(x, y)).toBe(btn);
    }
    expect([parseFloat(ring.left), parseFloat(ring.top), parseFloat(ring.width), parseFloat(ring.height)]).toEqual([-6, -2, 24, 24]);
  });

  test('removable: the focus ring goes round the whole 24×24 target; click and keyboard (Enter) call onRemove', async () => {
    await show();
    (q('#tags button')).focus();
    const a = getComputedStyle(document.activeElement!, '::after');
    expect([a.outlineWidth, a.outlineStyle, css(document.activeElement).outlineStyle]).toEqual(['2px', 'solid', 'none']);
    await userEvent.click(q('#tags button'));
    await expect.poll(() => removed).toEqual(['Design']);
    q('#tags button').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => removed.join()).toBe('Design,Research');
    expect(document.querySelectorAll('#tags .dk-badge').length).toBe(0);
  });

  test('subtle: a 1px outline in the text color at 20% (every tone), --badge-subtle-border: 0% removes it; solid stays borderless', async () => {
    await show();
    const alpha = (c: string) => rgb(c)[3];
    const one = (t: string, v: string) => { const s = css(tv(t, v)); const b = rgb(s.borderTopColor), c = rgb(s.color); return { w: s.borderTopWidth, a: alpha(s.borderTopColor), same: [0, 1, 2].every((i) => Math.abs(b[i] - c[i]) <= 1) }; };
    for (const t of ['neutral', 'primary', 'success', 'danger', 'violet', 'teal']) {
      const x = one(t, 'subtle');
      expect([t, x.w, x.same]).toEqual([t, '1px', true]);
      expect(Math.abs(x.a - 0.2)).toBeLessThan(0.01);
    }
    expect(one('success', 'solid').a).toBe(0);
    const v = tv('violet', 'subtle');
    v.style.setProperty('--badge-subtle-border', '0%');
    expect(alpha(css(v).borderTopColor)).toBe(0);
  });

  test('interactive: onClick renders <button type="button">, href a link (rel noopener for new tabs); a plain badge stays a span with no states', async () => {
    await show();
    const b = el('btn') as HTMLButtonElement, l = el('lnk') as HTMLAnchorElement, d = el('def');
    expect([b.tagName, b.type, b.classList.contains('dk-badge--interactive'), 'interactive' in b.dataset, css(b).cursor]).toEqual(['BUTTON', 'button', true, true, 'pointer']);
    expect([l.tagName, l.getAttribute('href'), l.rel, l.classList.contains('dk-badge--interactive'), css(l).textDecorationLine]).toEqual(['A', '#here', 'noopener noreferrer', true, 'none']);
    expect([d.classList.contains('dk-badge--interactive'), css(d).cursor, getComputedStyle(d, '::before').content]).toEqual([false, 'auto', 'none']);
  });

  test('interactive: click, Enter and Space call onClick', async () => {
    await show();
    await userEvent.click(el('btn'));
    el('btn').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect.poll(() => clicks).toBe(3);
  });

  test('hover and active: a layer in the text color, 10% on hover and 15% while pressed, with the text 30% darker (subtle and outline); solid uses black in light themes; disabled fades to 50% with no layer', async () => {
    await show();
    const layer = (e: Element) => { const c = getComputedStyle(e, '::before'); return [c.opacity, c.backgroundColor]; };
    const txt = css(el('btn')).color;
    expect(layer(el('btn'))[0]).toBe('0');
    await userEvent.hover(el('btn'));
    await expect.poll(() => layer(el('btn'))[0]).toBe('0.1');
    await animationsDone();
    const htxt = css(el('btn')).color;
    expect(layer(el('btn'))[1]).toBe(htxt);
    expect(htxt).not.toBe(txt);
    const act = await hold(el('btn'), async () => { await expect.poll(() => layer(el('btn'))[0]).toBe('0.15'); return layer(el('btn')); });
    expect(act[0]).toBe('0.15');
    await userEvent.hover(el('sbtn'));
    await expect.poll(() => layer(el('sbtn'))).toEqual(['0.1', 'rgb(0, 0, 0)']);
    await userEvent.hover(el('dis'), { force: true });
    await animationsDone();
    expect(layer(el('dis'))[0]).toBe('0');
    expect([css(el('dis')).opacity, css(el('dis')).cursor]).toEqual(['0.5', 'not-allowed']);
  });

  test('focus: keyboard focus draws the focus ring, a 2px outline 2px out with a transparent gap (also drawn in forced-colors mode)', async () => {
    await show();
    el('btn').focus();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(el('btn'));
    const ring = color('var(--focus-ring)');
    await expect.poll(() => css(el('btn')).outlineColor).toBe(ring);
    const s = css(el('btn'));
    expect([s.outlineStyle, s.outlineWidth, s.outlineOffset, s.boxShadow]).toEqual(['solid', '2px', '2px', 'none']);
  });

  test(`hover and pressed keep 4.5:1 text: ${TONES.length} tones × 3 styles × 2 states in all six themes`, async () => {
    await show();
    const off = document.createElement('style');
    off.textContent = '.dk-badge, .dk-badge::before { transition: none !important; }';
    document.head.appendChild(off);
    const low: string[] = [];
    let n = 0;
    const measure = (e: HTMLElement, state: string) => {
      for (const th of THEMES) {
        document.documentElement.setAttribute('data-theme', th);
        const s = css(e), b = getComputedStyle(e, '::before'), L = rgb(b.backgroundColor), op = parseFloat(b.opacity);
        const base = e.dataset.v === 'outline' ? surface() : over(rgb(s.backgroundColor), surface());
        const bg = over([L[0], L[1], L[2], op], base), r = ratio(over(rgb(s.color), bg), bg);
        n++;
        if (r < 4.5 || op < 0.05) low.push(`${th} ${e.dataset.it} ${e.dataset.v} ${state}: ${r.toFixed(2)} (layer ${op})`);
      }
      document.documentElement.setAttribute('data-theme', 'blue-light');
    };
    try {
      for (const t of TONES) for (const v of VARIANTS) {
        const e = q(`[data-it="${t}"][data-v="${v}"]`);
        // Hovered again until it takes: once in a while Firefox misses one of these 69 moves.
        await expect.poll(async () => { await userEvent.hover(e); return e.matches(':hover'); }).toBe(true);
        measure(e, 'hover');
        await press(e, async () => { await expect.poll(() => e.matches(':active') || e.querySelector('.dk-badge__ripple') != null).toBe(true); measure(e, 'pressed'); });
      }
    } finally { off.remove(); }
    expect(low).toEqual([]);
    expect(n).toBe(TONES.length * 3 * 2 * 6);
  }, 120_000);

  test('onClick with onRemove: the badge is the button, no nested × button, and a warning', async () => {
    await show();
    expect([el('both').tagName, !!q('#both button')]).toEqual(['BUTTON', false]);
    expect(warns.some((m) => /onRemove is ignored/.test(m))).toBe(true);
  });

  test('loading, interactive: a ring at the icon size (12px) centered over the hidden content (a 150ms cross-fade, the ring grows in), width kept, aria-busy and aria-disabled, announced "Loading"; clicks and Enter do nothing, focus stays; off again, it works again', async () => {
    await show();
    const ld = el('ld');
    const announcer = q('[data-dk-announcer]');
    announcer.textContent = '';
    setLoading(true);
    await expect.poll(() => ld.getAttribute('aria-busy')).toBe('true');
    ld.focus();
    const c0 = clicks;
    await userEvent.click(ld, { force: true });
    await userEvent.keyboard('{Enter}');
    // The cross-fade can start late on a busy runner, so wait for it to finish rather than for a fixed time.
    const sp = ld.querySelector('.dk-badge__loader') as HTMLElement;
    const content = () => [...ld.children].filter((c) => c !== sp && !c.classList.contains('dk-badge__ripples'));
    await expect.poll(() => [sp, ...content()].every((x) => x.getAnimations().every((a) => a.playState === 'finished'))).toBe(true);
    const xf = { lab: css(ld.querySelector('.dk-badge__label')).transitionDuration, ldr: css(sp).animationName, ldd: css(sp).animationDuration };
    expect(xf.lab).toMatch(/0\.15s/);
    expect([xf.ldr, xf.ldd]).toEqual(['dk-badge-loader-in', '0.15s']);
    const art = sp.querySelector('.dk-loader__art')!.getBoundingClientRect(), r = ld.getBoundingClientRect();
    expect(!!sp.querySelector('.dk-loader--ring')).toBe(true);
    expect(Math.round(art.width)).toBe(12);
    expect(Math.abs((art.left + art.width / 2) - (r.left + r.width / 2))).toBeLessThan(1);
    expect(Math.abs((art.top + art.height / 2) - (r.top + r.height / 2))).toBeLessThan(1);
    await expect.poll(() => content().map((c) => css(c).opacity).join()).toBe('0,0');
    // The layout size (the press scale doesn't change it), compared with the same badge's once it stops loading, below:
    // the width it had when the test started can differ by a few pixels in CI, where the text font isn't settled yet.
    const busy = [ld.offsetWidth, ld.offsetHeight];
    // Every badge that started loading at once is said, in one message.
    await expect.poll(() => announcer.textContent).toMatch(/(^|\. )Loading…$/);
    expect([css(ld).cursor, ld.textContent.endsWith('Approve request')]).toEqual(['progress', true]);
    expect([ld.getAttribute('aria-disabled'), document.activeElement === ld, clicks]).toEqual(['true', true, c0]);
    setLoading(false);
    await expect.poll(() => ld.getAttribute('aria-busy')).toBe(null);
    expect(!!ld.querySelector('.dk-badge__loader')).toBe(false);
    expect([ld.offsetWidth, ld.offsetHeight]).toEqual(busy);
    await expect.poll(() => css(ld.querySelector('.dk-badge__label')).opacity).toBe('1');
  });

  test('loading on a plain badge: aria-busy, stays a span, no aria-disabled; a remove button is disabled while it loads', async () => {
    await show();
    const e = el('ldspan');
    expect([e.tagName, e.getAttribute('aria-busy'), e.getAttribute('aria-disabled'), (q('#ldrm .dk-badge__remove') as HTMLButtonElement).disabled]).toEqual(['SPAN', 'true', null, true]);
  });

  test('micro-interactions: a clickable badge has the ripple layer first (under the content), a plain badge none; scale moves in 100ms', async () => {
    await show();
    const e = el('mi');
    expect(e.firstElementChild!.className).toBe('dk-badge__ripples');
    expect(!!el('def').querySelector('.dk-badge__ripples')).toBe(false);
    expect(css(e).transitionProperty).toMatch(/scale/);
    expect(css(e).transitionDuration).toMatch(/0\.1s/);
  });

  test('press and ripple: shrinks to 97% while held and comes back on release; one circle from the press point, text color at 20%, wide enough to reach the far corner, under the label, 500ms; removed after release', async () => {
    await show();
    const e = el('mi'), host = e.querySelector('.dk-badge__ripples')!.getBoundingClientRect();
    const held = await hold(e, async () => {
      await expect.poll(() => css(e).scale).toBe('0.97');
      const dots = e.querySelectorAll<HTMLElement>('.dk-badge__ripple'), d = dots[0], s = css(d);
      return { n: dots.length, op: s.opacity, bg: s.backgroundColor, color: css(e).color, dia: parseFloat(d.style.width), pe: s.pointerEvents, lab: css(e.querySelector('.dk-badge__label')).position, anim: s.animationDuration };
    }, { at: { x: 12, y: 12 } });
    const far = Math.hypot(host.width - 12 + 1, host.height - 12 + 1) * 2;
    expect([held.n, held.op, held.bg, held.lab, held.anim]).toEqual([1, '0.2', held.color, 'relative', '0.5s']);
    expect(held.dia).toBeGreaterThanOrEqual(far - 2);
    await expect.poll(() => ['none', '1'].includes(css(e).scale)).toBe(true);
    await expect.poll(() => e.querySelectorAll('.dk-badge__ripple').length, { timeout: 3000 }).toBe(0);
  });

  test('Enter shows the press like Space (data-pressed while held)', async () => {
    await show();
    const e = el('mi');
    e.focus();
    await userEvent.keyboard('{Enter>}');
    expect(e.hasAttribute('data-pressed')).toBe(true);
    await expect.poll(() => css(e).scale).toBe('0.97');
    await userEvent.keyboard('{/Enter}');
    expect(e.hasAttribute('data-pressed')).toBe(false);
  });

  test('tokens turn each off (--badge-ripple-opacity: 0, --badge-press-scale: 100%); your onPointerDown preventing the default skips the ripple; no press or ripple on disabled or plain badges', async () => {
    await show();
    const press = (id: string) => hold(el(id), async () => {
      if (id === 'mioff' || id === 'def') await expect.poll(() => el(id).matches(':active')).toBe(true);
      await new Promise(requestAnimationFrame);
      await animationsDone();
      return { scale: css(el(id)).scale, dots: el(id).querySelectorAll('.dk-badge__ripple').length };
    }, { ms: 250, at: { x: 6, y: 6 } });
    const unscaled = (s: string) => s === 'none' || s === '1';
    const off = await press('mioff'), pd = await press('mipd'), plain = await press('def');
    const dis = await hold(el('dis'), () => ({ scale: css(el('dis')).scale, dots: el('dis').querySelectorAll('.dk-badge__ripple').length }), { ms: 150, at: { x: 6, y: 6 } });
    expect([off.dots, unscaled(off.scale), pd.dots, dis.dots, unscaled(dis.scale), plain.dots, unscaled(plain.scale)]).toEqual([0, true, 0, 0, true, 0, true]);
  });

  test('optical balance, like Button: an icon on one side only (leading icon or dot / the ×) gives the text side 2px more padding; both or neither stay even; mirrored in right-to-left', async () => {
    await show();
    const ob = [...document.querySelectorAll('#ob .dk-badge')].map((e) => { const c = css(e); return parseFloat(c.paddingLeft) + '/' + parseFloat(c.paddingRight); });
    expect(ob).toEqual(['6/6', '6/8', '6/8', '8/6', '6/6', '4/4', '8/6']);
  });

  test('indicator: dot with no label is a lone 8px dot in the tone\'s solid fill, any variant, with a 2px surface ring; decorative, or role="img" when named; never clickable or removable (warns)', async () => {
    await show();
    const surf = color('var(--surface)');
    const m = (id: string) => { const e = el(id), c = css(e); return { tag: e.tagName, kids: e.children.length, w: c.width, h: c.height, r: parseFloat(c.borderTopLeftRadius), bg: c.backgroundColor, ring: c.boxShadow.includes(surf) && /0px 0px 0px 2px/.test(c.boxShadow), hidden: e.getAttribute('aria-hidden'), role: e.getAttribute('role'), v: e.dataset.variant }; };
    const md = m('ind'), sm = m('indsm'), named = m('indnamed'), click = m('indclick');
    expect([md.tag, md.kids, md.w, md.h, md.bg, md.ring, md.hidden, md.v]).toEqual(['SPAN', 0, '8px', '8px', css(tv('danger', 'solid')).backgroundColor, true, 'true', 'indicator']);
    expect(md.r).toBeGreaterThanOrEqual(4);
    expect([sm.w, sm.h, sm.bg]).toEqual(['8px', '8px', css(tv('neutral', 'solid')).backgroundColor]);
    expect([named.role, named.hidden]).toEqual(['img', null]);
    expect([click.tag, click.kids]).toEqual(['SPAN', 0]);
    expect(warns.some((w) => /dot indicator can't be clicked/.test(w))).toBe(true);
  });

  test('ping: off by default; with dot, a copy of the dot (its color, its size) runs the system\'s ping animation (1s, forever) on a dot in a label or the indicator; the dot stays 6px; ignored without a dot or with an icon; your absolute class still places the indicator', async () => {
    await show();
    const a = (e: Element) => { const c = getComputedStyle(e, '::after'); return { name: c.animationName, dur: c.animationDuration, iter: c.animationIterationCount, bg: c.backgroundColor, pos: c.position, w: c.width }; };
    const dot = q('#pg .dk-badge__dot'), ind = el('pgind');
    expect(getComputedStyle(q('#dot .dk-badge__dot'), '::after').animationName).toBe('none');
    expect(a(dot)).toMatchObject({ name: 'ping', dur: '1s', iter: 'infinite', bg: css(dot).backgroundColor, pos: 'absolute' });
    expect(css(dot).width).toBe('6px');
    expect(a(ind)).toMatchObject({ name: 'ping', bg: css(ind).backgroundColor, w: '8px' });
    expect([css(ind).position, css(el('pgabs')).position]).toEqual(['relative', 'absolute']);
    expect([el('pgnodot').classList.contains('dk-badge--ping'), el('pgicon').classList.contains('dk-badge--ping')]).toEqual([false, false]);
  });

  test('ref, className and other attributes pass through', async () => {
    await show();
    const e = badgeRef.current!;
    expect([e.id, e.classList.contains('extra'), e.dataset.x, e.title]).toEqual(['ref', true, 'y', 'tip']);
  });

  test('reduced motion: no press, no ripple and no ping; the loading ring only fades (no growing)', async () => {
    const restore = reduceMotion();
    try {
      await show();
      const o = await hold(el('mi'), async () => {
        await new Promise(requestAnimationFrame);
        return { ping: getComputedStyle(q('#pg .dk-badge__dot'), '::after').animationName + '/' + getComputedStyle(el('pgind'), '::after').display, scale: css(el('mi')).scale, dots: el('mi').querySelectorAll('.dk-badge__ripple').length, host: css(el('mi').querySelector('.dk-badge__ripples')).display, from: css(el('ldspan')).getPropertyValue('--dk-badge-loader-from').trim() };
      }, { ms: 200, at: { x: 6, y: 6 } });
      expect(o.ping).toBe('none/none');
      expect(['1', 'none']).toContain(o.scale);
      expect([o.dots, o.host]).toEqual([0, 'none']);
      expect(o.from).toMatch(/100%/);
    } finally { restore(); }
  });
});

describe('focus after removing a tag (179)', () => {
  function Tags({ onGone }: { onGone?: (name: string) => void }) {
    const [tags, setTags] = React.useState(['Design', 'Code', 'Docs']);
    return <><input id="add" aria-label="Add a tag" />
      <ul>{tags.map((t) => <li key={t}><Badge onRemove={() => { setTags((l) => l.filter((x) => x !== t)); onGone?.(t); }}>{t}</Badge></li>)}</ul></>;
  }
  const focused = () => document.activeElement?.getAttribute('aria-label') || document.activeElement?.id || document.activeElement?.tagName;

  test('moves to the next tag\'s ×, or the one before at the end of the list, instead of dropping to the page', async () => {
    await render(<Tags />);
    (document.querySelector('[aria-label="Remove Code"]') as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(focused).toBe('Remove Docs');
    await userEvent.keyboard('{Enter}');
    await expect.poll(focused).toBe('Remove Design');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.querySelectorAll('[data-component="badge"]').length).toBe(0);
    expect(focused()).toBe('BODY');   // nothing left to go to: the app moves focus (to the input that adds tags)
  });

  test('leaves focus alone when the handler moves it, or keeps the badge', async () => {
    await render(<><Tags onGone={() => (document.getElementById('add') as HTMLElement).focus()} /><Badge id="kept" onRemove={() => {}}>Kept</Badge></>);
    (document.querySelector('[aria-label="Remove Code"]') as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 30));
    expect(focused()).toBe('Add a tag');
    (document.querySelector('[aria-label="Remove Kept"]') as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 30));
    expect(focused()).toBe('Remove Kept');
  });
});
