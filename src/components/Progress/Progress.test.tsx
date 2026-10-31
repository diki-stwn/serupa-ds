import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { Progress } from './Progress';
import { idLabels } from '../../internal/labels';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const pb = (id: string) => (el(id).querySelector('[role=progressbar]') || el(id));
// How much of the track the fill covers, in whole percent.
const share = (id: string) => {
  const tr = el(id).querySelector('.dk-progress__track')!.getBoundingClientRect(), f = el(id).querySelector('.dk-progress__fill')!.getBoundingClientRect();
  return Math.round((Math.min(f.right, tr.right) - Math.max(f.left, tr.left)) / tr.width * 100); // the part the track shows
};
const thick = (id: string) => Math.round(el(id).querySelector('.dk-progress__track')!.getBoundingClientRect().height);
const value = (id: string) => el(id).querySelector('.dk-progress__value')?.textContent ?? null;
const aria = (id: string) => { const b = pb(id); return [b.getAttribute('aria-valuenow'), b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), b.getAttribute('aria-valuetext')]; };

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

// The examples are in English whatever language the browser is in (run.mjs --locale); a test of another locale sets its own.
const Wrap = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US"><div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div></SerupaProvider>;

describe('Progress', () => {
  test('bar: a progressbar with valuenow 45, min 0, max 100 and valuetext "45%", named by its label; ref and className reach the outer box', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Wrap><Progress id="p1" value={45} label="Uploading" showValue ref={ref} className="extra" /></Wrap>);
    expect(aria('p1')).toEqual(['45', '0', '100', '45%']);
    expect(document.getElementById(pb('p1').getAttribute('aria-labelledby')!)!.textContent).toBe('Uploading');
    expect([el('p1').getAttribute('role'), ref.current === el('p1'), el('p1').dataset.component]).toEqual([null, true, 'progress']);
    expect(el('p1').className).toMatch(/extra/);
  });

  test('the fill covers 45% of the track; showValue shows "45%" at the end of the label row; md is 8px thick; a new value moves the fill and the ARIA', async () => {
    const bar = (v: number) => <Wrap><Progress id="p1" value={v} label="Uploading" showValue /></Wrap>;
    const { rerender } = await render(bar(45));
    // The fill eases to a new width over 300ms.
    await expect.poll(() => share('p1')).toBe(45);
    expect([value('p1'), thick('p1')]).toEqual(['45%', 8]);
    await rerender(bar(80));
    await expect.poll(() => share('p1')).toBe(80);
    expect([pb('p1').getAttribute('aria-valuenow'), value('p1')]).toEqual(['80', '80%']);
  });

  test('max and formatValue: 3 of 8 is 38% of the track and reads "3 of 8"; the aria-label goes to the progressbar, not the box', async () => {
    await render(<Wrap><Progress id="p2" value={3} max={8} aria-label="Steps" formatValue={(v, m) => v + ' of ' + m} showValue /></Wrap>);
    await expect.poll(() => share('p2')).toBe(38);
    expect([pb('p2').getAttribute('aria-valuemax'), pb('p2').getAttribute('aria-valuetext'), value('p2')]).toEqual(['8', '3 of 8', '3 of 8']);
    expect([pb('p2').getAttribute('aria-label'), el('p2').hasAttribute('aria-label')]).toEqual(['Steps', false]);
  });

  test('values are clamped to 0..max', async () => {
    await render(<Wrap><Progress id="p3" value={150} aria-label="Over" /><Progress id="p4" value={-5} aria-label="Under" /></Wrap>);
    await expect.poll(() => share('p3')).toBe(100);
    await expect.poll(() => share('p4')).toBe(0);
    expect([pb('p3').getAttribute('aria-valuenow'), pb('p4').getAttribute('aria-valuenow')]).toEqual(['100', '0']);
  });

  test('the value is written as the locale writes a percentage, shown and read out: ٤٥٪ in ar-EG, %45 in tr-TR, 45 % in fr-FR', async () => {
    const LOCALES = ['ar-EG', 'tr-TR', 'fr-FR', 'en-US'];
    await render(<Wrap>{LOCALES.map((l) => <SerupaProvider key={l} locale={l}><Progress id={'loc-' + l} value={45} label="Upload" showValue /></SerupaProvider>)}</Wrap>);
    const seen = LOCALES.map((l) => [value('loc-' + l), pb('loc-' + l).getAttribute('aria-valuetext')]);
    expect(seen).toEqual(LOCALES.map((l) => { const t = new Intl.NumberFormat(l, { style: 'percent' }).format(0.45); return [t, t]; }));
    expect([seen[0][0]!.includes('٤٥'), seen[1][0]!.startsWith('%'), seen[3][0]]).toEqual([true, true, '45%']);
  });

  test('no value: indeterminate, without valuenow or valuetext, a sliding segment', async () => {
    await render(<Wrap><Progress id="ind" label="Preparing" /></Wrap>);
    expect([pb('ind').hasAttribute('aria-valuenow'), pb('ind').hasAttribute('aria-valuetext'), el('ind').dataset.state]).toEqual([false, false, 'indeterminate']);
    expect(withMotion(() => css(el('ind').querySelector('.dk-progress__fill')).animationName)).toBe('dk-progress-slide');
  });

  test('sizes: sm 4px, lg 12px', async () => {
    await render(<Wrap><Progress id="sm" value={50} size="sm" aria-label="s" /><Progress id="lg" value={50} size="lg" aria-label="l" /></Wrap>);
    expect([thick('sm'), thick('lg')]).toEqual([4, 12]);
  });

  test('circle: a 40px progressbar ring (24, 64px for sm, lg), the arc 30% round, the value inside for md and lg only; without a value a quarter arc that turns', async () => {
    await render(<SerupaProvider locale="en-US"><div>
      <Progress id="c1" variant="circle" value={30} showValue aria-label="Storage" />
      <Progress id="csm" variant="circle" size="sm" value={30} showValue aria-label="sm" />
      <Progress id="clg" variant="circle" size="lg" value={30} showValue aria-label="lg" />
      <Progress id="cind" variant="circle" aria-label="Loading" />
    </div></SerupaProvider>);
    const r = (id: string) => el(id).getBoundingClientRect(), dash = (id: string) => el(id).querySelector('.dk-progress__arc')!.getAttribute('stroke-dasharray');
    expect([Math.round(r('c1').width), Math.round(r('c1').height), Math.round(r('csm').width), Math.round(r('clg').width)]).toEqual([40, 40, 24, 64]);
    expect([el('c1').getAttribute('role'), el('c1').getAttribute('aria-valuenow'), el('c1').getAttribute('aria-label'), dash('c1')]).toEqual(['progressbar', '30', 'Storage', '30 100']);
    expect([value('c1'), value('clg'), value('csm')]).toEqual(['30%', '30%', null]);
    expect([el('cind').getAttribute('aria-valuenow'), dash('cind'), withMotion(() => css(el('cind').querySelector('.dk-progress__ring')).animationName)]).toEqual([null, '25 100', 'dk-progress-turn']);
  });

  test('contrast: every tone\'s fill keeps 3:1 on the page, and the label and values 4.5:1, in all six themes', async () => {
    const tones = ['primary', 'success', 'warning', 'danger'] as const;
    await render(<Wrap>
      <Progress id="p1" value={45} label="Uploading" showValue />
      <Progress id="c1" variant="circle" value={30} showValue aria-label="Storage" />
      {tones.map((t) => <Progress key={t} id={'tone-' + t} tone={t} value={60} aria-label={t} />)}
    </Wrap>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const tone of tones) {
        const r = contrast(css(el('tone-' + tone).querySelector('.dk-progress__fill')).backgroundColor, 'var(--surface)'); n++;
        if (r < 3) low.push(`${th} ${tone} fill on the page ${r.toFixed(2)}`);
      }
      for (const sel of ['#p1 .dk-progress__label', '#p1 .dk-progress__value', '#c1 .dk-progress__value']) {
        const r = contrast(css(document.querySelector(sel)).color, 'var(--surface)'); n++;
        if (r < 4.5) low.push(`${th} ${sel} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
    expect(n).toBe(42);
  });

  test('--progress-fill overrides one bar', async () => {
    await render(<Wrap><Progress id="tok" value={60} aria-label="tok" style={{ '--progress-fill': 'rgb(1, 2, 3)' } as React.CSSProperties} /></Wrap>);
    expect(css(el('tok').querySelector('.dk-progress__fill')).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

describe('Progress: done', () => {
  test('announceComplete says "Upload: complete" once when the value reaches max, not on mount at max or on the way; onComplete runs each time it gets there; own words and Indonesian', async () => {
    const said: string[] = [], dones: number[] = [];
    function App(props: { v: number; words?: string }) {
      return <><Progress id="pdone" label="Upload" value={props.v} announceComplete={props.words || true} onComplete={() => dones.push(props.v)} />
        <Progress id="pfull" aria-label="Quota" value={100} announceComplete onComplete={() => dones.push(-1)} /></>;
    }
    const screen = await render(<App v={10} />);
    const live = document.querySelector('[data-dk-announcer]')!;
    const watch = new MutationObserver(() => { if (live.textContent) said.push(live.textContent); });
    watch.observe(live, { childList: true, characterData: true, subtree: true });
    await screen.rerender(<App v={60} />);
    await screen.rerender(<App v={100} />);
    await expect.poll(() => said.length).toBeGreaterThan(0);
    await screen.rerender(<App v={30} />);
    await screen.rerender(<App v={100} words="All files uploaded" />);
    await expect.poll(() => said.at(-1)).toBe('All files uploaded');
    watch.disconnect();
    expect([[...new Set(said)], dones]).toEqual([['Upload: complete', 'All files uploaded'], [100, 100]]);
    expect([idLabels.progressComplete('Unggah'), idLabels.progressComplete('')]).toEqual(['Unggah: selesai', 'Selesai']);
  });
  test('a new value moves the fill on translate, not its width, and right to left it fills from the right (FB1)', async () => {
    const bar = (v: number) => <Wrap><div dir="rtl"><Progress id="mv" value={v} aria-label="mv" /></div></Wrap>;
    const { rerender } = await render(bar(30));
    const own = () => el('mv').querySelector('[role=progressbar]')!.firstElementChild as HTMLElement;
    await withMotion(async () => {
      void css(own()).translate;   // where it starts from
      await rerender(bar(70));
      const moves = own().getAnimations().filter((a): a is CSSTransition => a instanceof CSSTransition);
      expect(moves.map((a) => a.transitionProperty)).toEqual(['translate']);
      await Promise.all(moves.map((a) => a.finished));
    });
    const tr = own().parentElement!.getBoundingClientRect(), f = own().getBoundingClientRect();
    expect([share('mv'), Math.round(Math.max(f.left, tr.left) - tr.left)]).toEqual([70, 120]); // the 30% not filled is on the left
  });

  test('reduced motion: the indeterminate circle stands still and breathes (opacity, 1.4s), as Loader\'s ring does (EE1)', async () => {
    await render(<Progress id="crm" variant="circle" aria-label="Loading" />);
    const ring = el('crm').querySelector('svg') as SVGElement;
    const rules = [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules]; } catch { return []; } });
    const flat = (rs: CSSRule[]): CSSRule[] => rs.flatMap((r) => (r instanceof CSSGroupingRule ? [r, ...flat([...r.cssRules])] : [r]));
    const rm = flat(rules).filter((r): r is CSSMediaRule => r instanceof CSSMediaRule && /prefers-reduced-motion:\s*reduce/.test(r.conditionText) && /dk-progress/.test(r.cssText));
    const was = rm.map((r) => r.media.mediaText);
    rm.forEach((r) => { r.media.mediaText = '(min-width: 0px)'; });
    try {
      expect(withMotion(() => { const s = css(ring); return `${s.animationName} ${s.animationDuration}`; })).toBe('dk-progress-breathe 1.4s');
    } finally { rm.forEach((r, i) => { r.media.mediaText = was[i]; }); }
  });

  test('circle with a label: the label names the ring (it has no room to show it), unless aria-label or aria-labelledby does (L8E70)', async () => {
    await render(<>
      <Progress id="cl" variant="circle" value={20} label="Upload" />
      <Progress id="cla" variant="circle" value={20} label="Upload" aria-label="Sending" />
    </>);
    const names = (id: string) => { const n = el(id); const by = n.getAttribute('aria-labelledby'); return [n.getAttribute('role'), n.getAttribute('aria-label'), by ? by.split(' ').map((x) => document.getElementById(x)?.textContent).join(' ') : null]; };
    expect([names('cl'), names('cla')]).toEqual([['progressbar', 'Upload', null], ['progressbar', 'Sending', null]]);
    // A label that isn't text names it from a hidden copy inside the ring.
    await render(<Progress id="cle" variant="circle" value={20} label={<b>Backup</b>} />);
    expect([names('cle')[2], (el('cle').querySelector('[hidden]') as HTMLElement | null)?.id === el('cle').getAttribute('aria-labelledby')]).toEqual(['Backup', true]);
  });

  test('forced colors: the ring\'s track is GrayText, apart from the Highlight arc and from CanvasText (GK3)', async () => {
    await render(<><span id="gt" style={{ color: 'GrayText' }}>g</span><span id="ct" style={{ color: 'CanvasText' }}>c</span><span id="hl" style={{ color: 'Highlight' }}>h</span>
      <div id="rg"><Progress variant="circle" value={20} label="Upload" /></div></>);
    const r = await forcedColors((active) => {
      if (!active) return null;
      const ring = el('rg');
      const [track, arc] = [...ring.querySelectorAll('circle')].map((c) => css(c).stroke);   // the track, then the arc
      return [track === css(el('gt')).color, arc === css(el('hl')).color, track !== css(el('ct')).color];
    });
    if (r) expect(r).toEqual([true, true, true]);
  });

  test('a label word longer than the bar wraps and the value keeps its width, so at 320px the page doesn\'t scroll sideways (RF1, WCAG 1.4.10)', async () => {
    await page.viewport(320, 640);
    await render(<SerupaProvider locale="en-US"><div id="box" style={{ width: '200px' }}><Progress id="ll" value={40} showValue label="quarterly-report-Donaudampfschifffahrtsgesellschaftskapitänskajüte.pdf" /></div></SerupaProvider>);
    const header = el('ll').firstElementChild as HTMLElement, label = header.firstElementChild as HTMLElement, value = header.lastElementChild as HTMLElement;
    expect([el('box').scrollWidth <= 201, label.scrollWidth <= label.clientWidth + 1, value.textContent, value.scrollWidth <= value.clientWidth + 1]).toEqual([true, true, '40%', true]);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
