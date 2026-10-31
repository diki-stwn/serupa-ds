import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Avatar, initials, type AvatarSize, type AvatarStatus } from './Avatar';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

// A 10×10 red PNG rather than an SVG data URL: WebKit's loaded check failed on the SVG (no 10px natural width).
const IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGM4w8CAB+GTG8HSAJNGT7H9UgyzAAAAAElFTkSuQmCC';
const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const STATUSES: AvatarStatus[] = ['online', 'busy', 'away', 'offline'];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;

/** Applies the stylesheets' @media (forced-colors: active) rules, as Windows High Contrast would, until the returned function is called. */
function forcedColors(): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && /forced-colors:\s*active/.test(r.media.mediaText)) { flipped.push([r.media, r.media.mediaText]); r.media.mediaText = 'all'; }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
  return () => { for (const [m, t] of flipped) m.mediaText = t; };
}

const Row = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>{children}</div>;

describe('Avatar', () => {
  test('the status is read in the provider\'s words: "Ana Lim, daring" under id-ID; statusLabel still wins', async () => {
    await render(<><SerupaProvider locale="id-ID" labels={idLabels}><Avatar id="as-id" name="Ana Lim" status="online" /><Avatar id="as-own" name="Ana Lim" status="busy" statusLabel="rapat" /></SerupaProvider></>);
    expect([el('as-id').getAttribute('aria-label'), el('as-own').getAttribute('aria-label')]).toEqual(['Ana Lim, daring', 'Ana Lim, rapat']);
  });

  test('picture: a 40px circle (role img, named by name), the <img> covers it and is decorative; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLSpanElement>();
    await render(<Avatar id="img" src={IMG} name="Ada Lovelace" ref={r} className="extra" data-x="y" />);
    const e = el('img'), i = e.querySelector('img')!;
    await expect.poll(() => i.complete && i.naturalWidth).toBe(10);
    const b = e.getBoundingClientRect();
    expect([e.tagName, e.getAttribute('role'), e.getAttribute('aria-label'), i.getAttribute('alt'), css(i).objectFit, b.width, b.height, r.current === e, e.dataset.x, e.dataset.component])
      .toEqual(['SPAN', 'img', 'Ada Lovelace', '', 'cover', 40, 40, true, 'y', 'avatar']);
    expect(e.className).toMatch(/extra/);
    expect(parseFloat(css(e.querySelector('.dk-avatar__frame')).borderTopLeftRadius)).toBeGreaterThanOrEqual(20);
  });

  test('initials: first and last words ("GH"), one word gives one letter, and a picture that fails to load falls back to initials', async () => {
    await render(<Row><Avatar id="ini" name="grace brewster hopper" /><Avatar id="one" name="Linus" /><Avatar id="broken" src="/nowhere.png" name="Alan Turing" /></Row>);
    const m = (id: string) => { const e = el(id), s = e.querySelector('.dk-avatar__initials'); return [s && s.textContent, s && s.getAttribute('aria-hidden'), !!e.querySelector('img')].join(':'); };
    await expect.poll(() => m('broken')).toBe('AT:true:false');
    expect([m('ini'), m('one')]).toEqual(['GH:true:false', 'L:true:false']);
  });

  test('initials: one character a person sees per word, from its first letter, digit or pictograph (CD1)', () => {
    expect(['ßen Müller', '"Ada" Lovelace', '(Grace) Hopper', '— Ada —', '👩🏽‍💻 Dev', 'émile zola', 'e\u0301mile zola', 'ǆemal bijedić', '42 Club', '...'].map((n) => initials(n)))
      .toEqual(['SM', 'AL', 'GH', 'A', '👩🏽‍💻D', 'ÉZ', 'E\u0301Z', 'ǄB', '4C', '']);
  });

  test('initials in a joining script stay two letters, kept apart by a zero-width non-joiner, not joined into a word (GR28)', () => {
    expect(['محمد عبد الله', 'فاطمة الزهراء', 'ܐܦܪܝܡ ܣܘܪܝܝܐ', 'محمد', 'محمد Ali', 'Ada Lovelace', 'דוד לוי'].map((n) => initials(n)))
      .toEqual(['م\u200cا', 'ف\u200cا', 'ܐ\u200cܣ', 'م', 'مA', 'AL', 'דל']);
  });

  test('no picture and no name: the person icon, hidden from screen readers; alt="" hides it (the name is written beside it); alt replaces the name', async () => {
    await render(<Row><Avatar id="none" /><Avatar id="alt" name="Ada Lovelace" alt="" /><Avatar id="alt2" name="Atlas" alt="Atlas project" shape="square" /></Row>);
    expect([el('none').getAttribute('aria-hidden'), el('none').getAttribute('role'), (el('none').querySelector('[data-icon]') as HTMLElement).dataset.icon]).toEqual(['true', null, 'person']);
    expect([el('alt').getAttribute('aria-hidden'), el('alt').getAttribute('role'), el('alt2').getAttribute('aria-label')]).toEqual(['true', null, 'Atlas project']);
  });

  test('a name of only spaces counts as none: the icon, hidden, no aria-label of spaces (AU1)', async () => {
    await render(<Row><Avatar id="blank" name="   " /></Row>);
    expect([el('blank').getAttribute('aria-hidden'), el('blank').getAttribute('aria-label'), el('blank').getAttribute('role'), !!el('blank').querySelector('[data-icon]')]).toEqual(['true', null, null, true]);
  });

  test('the <img> loads lazily and decodes async by default; imgProps reach it, can make it eager, and its onError still falls back (BJ1)', async () => {
    const err = vi.fn();
    await render(<Row>
      <Avatar id="lazy" src={IMG} name="Ada Lovelace" />
      <Avatar id="eager" src={IMG} name="Grace Hopper" imgProps={{ loading: 'eager', referrerPolicy: 'no-referrer', className: 'mine' }} />
      <Avatar id="bad" src="data:image/png;base64,broken" name="Linus T" imgProps={{ onError: err }} />
    </Row>);
    const img = (id: string) => el(id).querySelector('img')!;
    expect([img('lazy').loading, img('lazy').decoding, img('eager').loading, img('eager').referrerPolicy, img('eager').className]).toEqual(['lazy', 'async', 'eager', 'no-referrer', 'dk-avatar__img mine']);
    await expect.poll(() => el('bad').querySelector('.dk-avatar__initials')?.textContent).toBe('LT');
    expect(err).toHaveBeenCalledTimes(1);
  });

  test('sizes: 24/12, 32/12, 40/14, 48/16 and 64/20 (box/initials, px); the person icon scales with the size (14 to 40px); shape square: 8px corners', async () => {
    await render(<Row>
      {SIZES.map((s) => <Avatar key={s} data-s={s} size={s} name="Ada Lovelace" />)}
      {SIZES.map((s) => <Avatar key={'i' + s} data-is={s} size={s} />)}
      <Avatar id="alt2" name="Atlas" alt="Atlas project" shape="square" />
    </Row>);
    expect(SIZES.map((s) => { const e = q(`[data-s="${s}"]`); return Math.round(e.getBoundingClientRect().width) + '/' + css(e).fontSize; }))
      .toEqual(['24/12px', '32/12px', '40/14px', '48/16px', '64/20px']);
    expect(SIZES.map((s) => css(q(`[data-is="${s}"] .dk-icon`)).fontSize)).toEqual(['14px', '20px', '24px', '28px', '40px']);
    expect(css(q('#alt2 .dk-avatar__frame')).borderTopLeftRadius).toBe('8px');
  });

  test('unknown size, shape and status fall back to md, circle and none', async () => {
    // @ts-expect-error: unknown values, as plain JavaScript could pass
    await render(<Avatar id="bad" size="huge" shape="blob" status="party" name="X Y" />);
    const e = el('bad');
    expect([e.dataset.size, e.dataset.shape, !!e.querySelector('.dk-avatar__status'), e.getAttribute('aria-label')]).toEqual(['md', 'circle', false, 'X Y']);
  });

  test('status: a 10px dot at the bottom end in a 2px surface ring, hidden itself but added to the name ("Ada Lovelace, online"); statusLabel changes what it says', async () => {
    await render(<Row>
      {STATUSES.map((s) => <Avatar key={s} data-st={s} status={s} name="Ada Lovelace" />)}
      <Avatar id="stl" status="busy" statusLabel="in a meeting" name="Ada Lovelace" />
    </Row>);
    const sts = STATUSES.map((s) => { const e = q(`[data-st="${s}"]`), d = e.querySelector('.dk-avatar__status') as HTMLElement, r = d.getBoundingClientRect(), o = e.getBoundingClientRect();
      return { name: e.getAttribute('aria-label'), w: r.width, end: Math.round(o.right - r.right), bottom: Math.round(o.bottom - r.bottom), ring: /0px 0px 0px 2px/.test(css(d).boxShadow), hidden: d.getAttribute('aria-hidden'), bg: css(d).backgroundColor }; });
    STATUSES.forEach((s, i) => expect({ ...sts[i], bg: undefined }).toEqual({ name: 'Ada Lovelace, ' + s, w: 10, end: 0, bottom: 0, ring: true, hidden: 'true', bg: undefined }));
    expect(new Set(sts.map((s) => s.bg)).size).toBeGreaterThan(1);
    expect(el('stl').getAttribute('aria-label')).toBe('Ada Lovelace, in a meeting');
  });

  // DR1: color alone failed 1.4.1, and forced colors turned all four into the same dot.
  test('each status has its own shape (filled, bar, ring with a dot, empty ring), still four shapes in forced colors', async () => {
    await render(<Row>{STATUSES.map((s) => <Avatar key={s} data-st={s} status={s} name="Ada Lovelace" />)}</Row>);
    const shape = (s: AvatarStatus) => { const d = q(`[data-st="${s}"] [aria-hidden="true"]:not(.dk-avatar__frame *)`), a = getComputedStyle(d, '::after');
      return [css(d).borderTopWidth !== '0px', a.width !== '0px' && a.backgroundColor !== 'rgba(0, 0, 0, 0)' ? Math.round(parseFloat(a.width) / parseFloat(a.height)) : 0].join(); };
    expect(STATUSES.map(shape)).toEqual(['false,0', 'false,2', 'true,1', 'true,0']);
    const restore = forcedColors();
    try {
      expect(STATUSES.map(shape)).toEqual(['false,0', 'false,2', 'true,1', 'true,0']);
      const d = q('[data-st="busy"] [aria-hidden="true"]:not(.dk-avatar__frame *)');
      expect(getComputedStyle(d, '::after').backgroundColor).not.toBe(css(d).backgroundColor);
    } finally { restore(); }
  });

  test('alt="" with a status: the picture is hidden but the status is still read ("online"), in the provider\'s words or statusLabel', async () => {
    await render(<Row><Avatar data-a="1" alt="" name="Ada Lovelace" status="away" /><Avatar data-a="2" alt="" status="busy" statusLabel="in a meeting" /><Avatar data-a="3" alt="" name="Ada Lovelace" /></Row>);
    const a = (n: string) => q(`[data-a="${n}"]`);
    expect([a('1').getAttribute('aria-hidden'), a('1').getAttribute('role')]).toEqual([null, null]);
    expect(a('1').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('away');
    expect(a('2').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('in a meeting');
    expect(a('3').getAttribute('aria-hidden')).toBe('true');
  });

  test('component tokens (--avatar-bg, --avatar-size-md) override one avatar', async () => {
    await render(<Avatar id="tok" name="T K" style={{ '--avatar-bg': 'rgb(1, 2, 3)', '--avatar-size-md': '50px' } as React.CSSProperties} />);
    expect([css(el('tok').querySelector('.dk-avatar__frame')).backgroundColor, el('tok').getBoundingClientRect().width]).toEqual(['rgb(1, 2, 3)', 50]);
  });

  test('contrast: initials and the icon keep 4.5:1 on their background in all six themes', async () => {
    await render(<Avatar id="ini" name="grace brewster hopper" />);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const f = css(el('ini').querySelector('.dk-avatar__frame')), r = contrast(f.color, f.backgroundColor); n++;
      if (r < 4.5) low.push(`${th} initials: ${r.toFixed(2)}`);
    }
    expect([low, n]).toEqual([[], 6]);
  });

  test('a failed src falls back to initials; a new src shows its picture; a new failing one falls back again', async () => {
    let setSrc: (s: string) => void = () => {};
    function App() { const [s, set] = React.useState('/nowhere.png'); setSrc = set; return <Avatar id="sw" src={s} name="Alan Turing" />; }
    await render(<App />);
    const kind = () => (el('sw').querySelector('img') ? 'img' : el('sw').textContent);
    await expect.poll(kind).toBe('AT');
    setSrc(IMG);
    await expect.poll(kind).toBe('img');
    setSrc('/elsewhere.png');
    await expect.poll(kind).toBe('AT');
  });

  test('a server-rendered picture that failed before the page hydrated falls back to initials (L8E44)', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const ui = <Avatar id="hy" src={`/nowhere-${crypto.randomUUID()}.png`} name="Grace Hopper" imgProps={{ loading: 'eager' }} />;
    host.innerHTML = renderToString(ui);
    const img = host.querySelector('img')!;
    await expect.poll(() => img.complete).toBe(true);   // failed while no React was listening
    const root = hydrateRoot(host, ui);
    await expect.poll(() => (el('hy').querySelector('img') ? 'img' : el('hy').textContent)).toBe('GH');
    root.unmount();
    host.remove();
  });

  test('a server-rendered picture that loaded before the page hydrated stays', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const ui = <Avatar id="hy2" src={IMG} name="Grace Hopper" imgProps={{ loading: 'eager' }} />;
    host.innerHTML = renderToString(ui);
    const img = host.querySelector('img')!;
    await expect.poll(() => img.complete && img.naturalWidth > 0).toBe(true);
    const root = hydrateRoot(host, ui);
    await new Promise((r) => setTimeout(r, 200));
    expect(el('hy2').querySelector('img')).toBe(img);
    root.unmount();
    host.remove();
  });

  test('forced colors: the frame gets a border', async () => {
    const restore = forcedColors();
    try {
      await render(<Avatar id="ini" name="grace brewster hopper" />);
      expect(css(el('ini').querySelector('.dk-avatar__frame')).borderTopStyle).toBe('solid');
    } finally { restore(); }
  });

  test('no errors or React warnings', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<Row><Avatar src={IMG} name="Ada Lovelace" /><Avatar src="/nowhere.png" name="Alan Turing" /><Avatar status="online" /></Row>);
    await expect.poll(() => document.querySelectorAll('img').length).toBe(1);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
