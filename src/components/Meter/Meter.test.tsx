import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, color, contrast, css, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Meter, meterState } from './Meter';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const mt = (id: string) => el(id).querySelector('[role=meter]') as HTMLElement;
const share = (id: string) => {
  const tr = el(id).querySelector('[role=meter]')!.getBoundingClientRect(), f = el(id).querySelector('[role=meter] > div')!.getBoundingClientRect();
  return Math.round((Math.min(f.right, tr.right) - Math.max(f.left, tr.left)) / tr.width * 100); // the part the track shows
};
const thick = (id: string) => Math.round(el(id).querySelector('[role=meter]')!.getBoundingClientRect().height);
const value = (id: string) => el(id).querySelector('span[aria-hidden]')?.textContent ?? null;
const aria = (id: string) => { const b = mt(id); return [b.getAttribute('aria-valuenow'), b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), b.getAttribute('aria-valuetext')]; };
const fill = (id: string) => css(el(id).querySelector('[role=meter] > div')).backgroundColor;

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

// The examples are in English whatever language the browser is in (run.mjs --locale); a test of another locale sets its own.
const Wrap = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US"><div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div></SerupaProvider>;

describe('Meter', () => {
  test('a meter with valuenow 72, min 0, max 100 and valuetext "72%", named by its label; ref, className and props reach the outer box', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Wrap><Meter id="m1" value={72} label="Storage" showValue ref={ref} className="extra" data-x="y" /></Wrap>);
    expect(aria('m1')).toEqual(['72', '0', '100', '72%']);
    expect(document.getElementById(mt('m1').getAttribute('aria-labelledby')!)!.textContent).toBe('Storage');
    expect([el('m1').getAttribute('role'), ref.current === el('m1'), el('m1').dataset.component, el('m1').dataset.x, el('m1').dataset.state, el('m1').className]).toEqual([null, true, 'meter', 'y', 'none', 'dk-meter dk-meter--size-md extra']);
  });

  test('the fill covers 72% of the track; showValue shows "72%"; md is 8px thick and primary without zones; aria-label names it without a label', async () => {
    await render(<Wrap><Meter id="m1" value={72} label="Storage" showValue /><Meter id="m2" value={30} aria-label="Seats" /></Wrap>);
    await expect.poll(() => share('m1')).toBe(72);
    expect([value('m1'), thick('m1'), fill('m1'), mt('m2').getAttribute('aria-label'), mt('m2').hasAttribute('aria-labelledby'), el('m2').hasAttribute('aria-label'), value('m2')])
      .toEqual(['72%', 8, color('var(--primary)'), 'Seats', false, false, null]);
  });

  test('min, max and clamping: 7.2 of 10 is 72%; values outside are clamped; formatValue gets (value, min, max) and is shown and read out', async () => {
    await render(<Wrap>
      <Meter id="gb" value={7.2} max={10} label="Storage" showValue formatValue={(v, mn, mx) => `${v} of ${mx} GB (from ${mn})`} />
      <Meter id="hi" value={140} aria-label="High" />
      <Meter id="lo" value={-5} min={10} max={20} aria-label="Low" />
    </Wrap>);
    await expect.poll(() => share('gb')).toBe(72);
    expect([value('gb'), mt('gb').getAttribute('aria-valuetext'), aria('hi')[0], aria('lo')]).toEqual(['7.2 of 10 GB (from 0)', '7.2 of 10 GB (from 0)', '100', ['10', '10', '20', '0%']]);
  });

  test('zones, as HTML <meter> works them out: low is good, high is good, the middle is good; the fill is success, warning or danger', async () => {
    const cases: Array<[string, Partial<React.ComponentProps<typeof Meter>>, string]> = [
      ['a', { value: 40, low: 80, high: 95, optimum: 0 }, 'optimum'],
      ['b', { value: 88, low: 80, high: 95, optimum: 0 }, 'suboptimal'],
      ['c', { value: 98, low: 80, high: 95, optimum: 0 }, 'poor'],
      ['d', { value: 85, low: 20, high: 60, optimum: 100 }, 'optimum'],
      ['e', { value: 45, low: 20, high: 60, optimum: 100 }, 'suboptimal'],
      ['f', { value: 12, low: 20, high: 60, optimum: 100 }, 'poor'],
      ['g', { value: 50, low: 30, high: 70 }, 'optimum'],
      ['h', { value: 80, low: 30, high: 70 }, 'suboptimal'],
      ['i', { value: 10, low: 30 }, 'suboptimal'],
    ];
    await render(<Wrap>{cases.map(([id, p]) => <Meter key={id} id={id} value={0} aria-label={id} {...p} />)}</Wrap>);
    const tone: Record<string, string> = { optimum: color('var(--success)'), suboptimal: color('var(--warning)'), poor: color('var(--danger)') };
    expect(cases.map(([id]) => el(id).dataset.state)).toEqual(cases.map((c) => c[2]));
    expect(cases.map(([id]) => fill(id))).toEqual(cases.map((c) => tone[c[2]]));
  });

  test('outside the best zone the read-out and shown value say where it falls ("92%, high"), so the zone is not only a color (GH4); in the best zone, without zones, or with formatValue, it is the value alone; Indonesian words from the provider', async () => {
    await render(<Wrap>
      <Meter id="z-high" value={92} high={80} optimum={10} showValue aria-label="Storage" />
      <Meter id="z-low" value={12} low={20} high={60} optimum={100} aria-label="Battery" />
      <Meter id="z-mid" value={45} low={20} high={60} optimum={100} aria-label="Battery" />
      <Meter id="z-best" value={85} low={20} high={60} optimum={100} aria-label="Battery" />
      <Meter id="z-none" value={92} aria-label="Plain" />
      <Meter id="z-own" value={92} high={80} optimum={10} formatValue={() => 'Almost full'} aria-label="Own" />
      <SerupaProvider locale="id-ID" labels={idLabels}><Meter id="z-id" value={92} high={80} optimum={10} aria-label="Penyimpanan" /></SerupaProvider>
    </Wrap>);
    const pct = (l: string) => new Intl.NumberFormat(l, { style: 'percent' }).format(0.92);
    expect(['z-high', 'z-low', 'z-mid', 'z-best', 'z-none', 'z-own', 'z-id'].map((id) => mt(id).getAttribute('aria-valuetext')))
      .toEqual([pct('en-US') + ', high', '12%, low', '45%, medium', '85%', pct('en-US'), 'Almost full', pct('id-ID') + ', tinggi']);
    expect(value('z-high')).toBe(pct('en-US') + ', high');
  });

  test('meterState: no zones without low and high; edges as the HTML spec sets them (low and high clamped into min..max, high never under low, optimum clamped)', () => {
    expect([
      meterState(50, 0, 100),
      meterState(30, 0, 100, 30, 70), meterState(70, 0, 100, 30, 70), meterState(29.9, 0, 100, 30, 70),
      meterState(80, 0, 100, 30, 70, 0), meterState(70, 0, 100, 30, 70, 0), meterState(30, 0, 100, 30, 70, 0),
      meterState(30, 0, 100, 30, 70, 100), meterState(29, 0, 100, 30, 70, 100),
      meterState(50, 0, 100, 60, 40, 0),   // high under low: high becomes 60, and 50 is under low, which is good
      meterState(50, 0, 100, -20, 200, 500),   // all clamped: one zone, optimum at max is inside it
      meterState(5, 0, 10, 2, 8, 50),   // optimum over max is clamped to 10, over high: high is good
    ]).toEqual(['none', 'optimum', 'optimum', 'suboptimal', 'poor', 'suboptimal', 'suboptimal', 'suboptimal', 'poor', 'optimum', 'optimum', 'suboptimal']);
  });

  test('the value is written as the locale writes a percentage: ٧٢٪ in ar-EG, %72 in tr-TR', async () => {
    const LOCALES = ['ar-EG', 'tr-TR', 'en-US'];
    await render(<Wrap>{LOCALES.map((l) => <SerupaProvider key={l} locale={l}><Meter id={'loc-' + l} value={72} label="Storage" showValue /></SerupaProvider>)}</Wrap>);
    expect(LOCALES.map((l) => [value('loc-' + l), mt('loc-' + l).getAttribute('aria-valuetext')])).toEqual(LOCALES.map((l) => { const t = new Intl.NumberFormat(l, { style: 'percent' }).format(0.72); return [t, t]; }));
  });

  test('sizes: sm 4px, lg 12px; an unknown size falls back to md', async () => {
    await render(<Wrap><Meter id="sm" value={50} size="sm" aria-label="s" /><Meter id="lg" value={50} size="lg" aria-label="l" /><Meter id="bad" value={50} size={'huge' as never} aria-label="b" /></Wrap>);
    expect([thick('sm'), thick('lg'), thick('bad')]).toEqual([4, 12, 8]);
  });

  test('contrast: every zone\'s fill keeps 3:1 on the page, and the label and value 4.5:1, in all six themes', async () => {
    await render(<Wrap>
      <Meter id="p" value={60} label="Storage" showValue />
      <Meter id="o" value={10} low={30} high={70} optimum={0} aria-label="o" />
      <Meter id="s" value={50} low={30} high={70} optimum={0} aria-label="s" />
      <Meter id="x" value={90} low={30} high={70} optimum={0} aria-label="x" />
    </Wrap>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const id of ['p', 'o', 's', 'x']) { const r = contrast(fill(id), 'var(--surface)'); n++; if (r < 3) low.push(`${th} ${id} fill ${r.toFixed(2)}`); }
      for (const sel of ['#p .dk-meter__label', '#p .dk-meter__value']) { const r = contrast(css(document.querySelector(sel)).color, 'var(--surface)'); n++; if (r < 4.5) low.push(`${th} ${sel} ${r.toFixed(2)}`); }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
    expect([low, n]).toEqual([[], 36]);
  });

  test('--meter-fill-poor overrides one meter', async () => {
    await render(<Wrap><Meter id="tok" value={90} low={30} high={70} optimum={0} aria-label="tok" style={{ '--meter-fill-poor': 'rgb(1, 2, 3)' } as React.CSSProperties} /></Wrap>);
    expect(fill('tok')).toBe('rgb(1, 2, 3)');
  });
  test('a new value moves the fill on translate, not its width, and right to left it fills from the right (FB1)', async () => {
    const bar = (v: number) => <Wrap><div dir="rtl"><Meter id="mv" value={v} aria-label="mv" /></div></Wrap>;
    const { rerender } = await render(bar(30));
    const own = () => el('mv').querySelector('[role=meter]')!.firstElementChild as HTMLElement;
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
});
