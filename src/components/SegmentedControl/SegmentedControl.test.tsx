import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, forcedColors, press, withMotion } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl';

const PERIODS: SegmentedControlOption[] = [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year', disabled: true }];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const seg = (id: string, v: string) => el(id).querySelector<HTMLButtonElement>(`[data-value="${v}"]`)!;
const items = (id: string) => [...el(id).querySelectorAll('button')];
const checked = (id: string) => el(id).querySelector<HTMLElement>('[aria-checked=true]')?.dataset.value ?? null;
const focused = () => (document.activeElement as HTMLElement).dataset.value;
// How far the sliding selection is from the checked segment: [left, width] differences in px.
const off = (id: string) => {
  const i = el(id).querySelector(':scope > span[aria-hidden]')!.getBoundingClientRect(), c = el(id).querySelector('[aria-checked=true]')!.getBoundingClientRect();
  return [Math.round(i.left - c.left) || 0, Math.round(i.width - c.width) || 0]; // || 0: no -0
};
// Transitions still running (a theme change can cancel one and start another, so poll rather than await .finished).
const settled = () => expect.poll(() => document.getAnimations().length).toBe(0);

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

const Col = ({ children }: { children: React.ReactNode }) => <div style={{ width: '480px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>{children}</div>;
const Period = ({ sref }: { sref?: React.Ref<HTMLDivElement> }) => <>
  <button id="before">Before</button>
  <SegmentedControl id="per" aria-label="Period" options={PERIODS} ref={sref} className="extra" />
  <button id="after">After</button>
</>;
function Controlled({ calls, api }: { calls: string[]; api: { set?: (v: string) => void; view?: string } }) {
  const [v, setV] = React.useState('list');
  api.set = setV; api.view = v;
  return <SegmentedControl id="ctl" aria-label="View" value={v} onValueChange={(x) => { calls.push(x); setV(x); }} name="view"
    options={[{ value: 'list', icon: 'list', label: 'List' }, { value: 'board', icon: 'view_kanban', label: 'Board' }]} />;
}

const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

describe('SegmentedControl', () => {
  test('with Alt, Ctrl or ⌘ the arrow keys are left to the browser (Alt+← goes back a page) (L8E28)', async () => {
    await render(<SegmentedControl id="mk" aria-label="Period" options={PERIODS} defaultValue="day" />);
    const t = document.querySelector('#mk button') as HTMLElement;
    t.focus();
    const before = t.outerHTML;
    expect([modified(t), modified(t, 'ArrowLeft'), document.activeElement === t, t.outerHTML === before]).toEqual([[false, false, false], [false, false, false], true, true]);
  });

  test('your onKeyDown runs first, with the root as currentTarget: preventDefault() on a key keeps the selection; onFocus and onBlur fire only entering and leaving, not while arrowing between segments', async () => {
    const seen: string[] = [], targets: (EventTarget | null)[] = [];
    await render(<><SegmentedControl id="ev" aria-label="Period" options={PERIODS} defaultValue="day"
      onValueChange={(v) => seen.push('change ' + v)} onFocus={() => seen.push('focus')} onBlur={() => seen.push('blur')}
      onKeyDown={(e) => { targets.push(e.currentTarget); if (e.key === 'End') e.preventDefault(); }} /><button id="after">After</button></>);
    seg('ev', 'day').focus();
    await userEvent.keyboard('{End}');
    expect(seg('ev', 'day').getAttribute('aria-checked')).toBe('true');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect([document.activeElement!.id, seen]).toEqual(['after', ['focus', 'change week', 'blur']]);
    expect(targets.length > 0 && targets.every((t) => t === el('ev'))).toBe(true);
  });

  test('a radiogroup of role="radio" buttons, the first checked by default and the only Tab stop; ref and className reach the root; md is 32px; the selection sits exactly on the checked segment', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Col><Period sref={ref} /></Col>);
    const e = el('per'), it = items('per');
    expect([e.getAttribute('role'), e.getAttribute('aria-label'), ref.current === e, e.dataset.component, e.getBoundingClientRect().height]).toEqual(['radiogroup', 'Period', true, 'segmented-control', 32]);
    expect(e.className).toMatch(/extra/);
    expect([it.map((x) => x.getAttribute('role')).join(), it.map((x) => x.getAttribute('aria-checked')).join(), it.map((x) => x.tabIndex).join(), it[3].disabled])
      .toEqual(['radio,radio,radio,radio', 'true,false,false,false', '0,-1,-1,-1', true]);
    await expect.poll(() => off('per')).toEqual([0, 0]);
  });

  test('keys: Tab lands on the checked segment; ArrowRight selects and focuses the next, skips disabled ones and wraps; ArrowLeft back; End and Home; one Tab stop: Tab leaves from the newly checked segment', async () => {
    await render(<Col><Period /></Col>);
    el('before').focus();
    await userEvent.keyboard('{Tab}');
    const seen: Array<string | null | undefined> = [focused()];
    await userEvent.keyboard('{ArrowRight}'); seen.push(checked('per'), focused());
    await userEvent.keyboard('{ArrowRight}{ArrowRight}'); seen.push(checked('per'));
    await userEvent.keyboard('{ArrowLeft}'); seen.push(checked('per'));
    await userEvent.keyboard('{End}'); seen.push(checked('per'));
    await userEvent.keyboard('{Home}'); seen.push(checked('per'));
    expect(seen).toEqual(['day', 'week', 'week', 'day', 'month', 'month', 'day']);
    await userEvent.keyboard('{ArrowRight}{Tab}');
    expect(document.activeElement!.id).toBe('after');
    expect(items('per').map((x) => x.tabIndex).join()).toBe('-1,0,-1,-1');
  });

  test('keys: ArrowDown selects the next segment and ArrowUp the one before, as ArrowRight and ArrowLeft do, skipping disabled ones and wrapping (FH1)', async () => {
    await render(<Col><Period /></Col>);
    seg('per', 'day').focus();
    const seen: Array<string | null | undefined> = [];
    for (const k of ['{ArrowDown}', '{ArrowDown}', '{ArrowDown}', '{ArrowUp}']) { await userEvent.keyboard(k); seen.push(checked('per') + '/' + focused()); }
    expect(seen).toEqual(['week/week', 'month/month', 'day/day', 'month/month']);   // Year is disabled
  });

  test('L8E72 nothing checked that can be chosen (null, or a disabled segment): the arrows go from the focused segment, as in a native radio group', async () => {
    const seen: Array<string | null | undefined> = [];
    for (const v of [null, 'year']) {
      const { unmount } = await render(<SegmentedControl id="nc" aria-label="Period" options={PERIODS} value={v as string} onValueChange={(x) => seen.push(x)} />);
      seg('nc', 'day').focus();
      await userEvent.keyboard('{ArrowRight}');
      seg('nc', 'day').focus();
      await userEvent.keyboard('{ArrowLeft}');
      await unmount();
    }
    expect(seen).toEqual(['week', 'month', 'week', 'month']);
  });

  test('a click selects, and the selection moves to it; a disabled segment can\'t be chosen', async () => {
    await render(<Col><Period /></Col>);
    await userEvent.click(seg('per', 'month'));
    await expect.poll(() => checked('per')).toBe('month');
    // The selection slides over 200ms.
    await expect.poll(() => off('per')).toEqual([0, 0]);
    await userEvent.click(seg('per', 'year'), { force: true });
    expect(checked('per')).toBe('month');
  });

  test('in a Field: the label names the radiogroup and the hint describes it; its own aria-label still wins', async () => {
    await render(<>
      <Field label="Period" hint="Shown on the chart"><SegmentedControl data-testid="sg1" options={PERIODS} /></Field>
      <Field label="Period"><SegmentedControl data-testid="sg2" aria-label="Chart period" options={PERIODS} /></Field>
    </>);
    const root = (t: string) => document.querySelector<HTMLElement>(`[data-testid=${t}]`)!;
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    expect([text(root('sg1').getAttribute('aria-labelledby')), text(root('sg1').getAttribute('aria-describedby'))]).toEqual(['Period', 'Shown on the chart']);
    expect([root('sg2').getAttribute('aria-label'), root('sg2').getAttribute('aria-labelledby')]).toEqual(['Chart period', null]);
  });

  test('ref.current.focus() and autoFocus land on the selected segment, or else the first one that isn\'t disabled; all disabled, nothing is focused', async () => {
    const sel = React.createRef<HTMLDivElement>(), none = React.createRef<HTMLDivElement>(), off = React.createRef<HTMLDivElement>();
    const later: SegmentedControlOption[] = [{ value: 'a', label: 'A', disabled: true }, { value: 'b', label: 'B' }];
    await render(<>
      <SegmentedControl id="sfa" aria-label="Period" options={PERIODS} defaultValue="week" autoFocus />
      <SegmentedControl id="sfr" ref={sel} aria-label="Period" options={PERIODS} defaultValue="month" />
      <SegmentedControl id="sfn" ref={none} aria-label="Period" options={later} defaultValue="a" />
      <SegmentedControl id="sfd" ref={off} aria-label="Period" options={PERIODS} disabled />
    </>);
    await expect.poll(() => document.activeElement).toBe(seg('sfa', 'week'));
    expect(el('sfa').hasAttribute('autofocus')).toBe(false);
    sel.current!.focus();
    expect(document.activeElement).toBe(seg('sfr', 'month'));
    none.current!.focus();
    expect(document.activeElement).toBe(seg('sfn', 'b'));
    off.current!.focus();
    expect(document.activeElement).toBe(seg('sfn', 'b'));
    expect(sel.current).toBe(el('sfr'));
  });

  test('forced colors: the checked segment\'s text is HighlightText on the Highlight selection, kept as is (no backplate hides it), also on hover', async () => {
    await render(<SegmentedControl id="hc" aria-label="Period" options={PERIODS} />);
    const day = seg('hc', 'day');
    const r = await forcedColors(async (active) => {
      if (!active) return null;
      const label = css(day).color;
      // The segment paints nothing itself, so its label sits on the Highlight indicator; hovering it keeps HighlightText.
      await userEvent.hover(day);
      await new Promise((go) => setTimeout(go, 200));
      return [css(day).forcedColorAdjust, css(seg('hc', 'week')).forcedColorAdjust, css(day).backgroundColor, css(day).color === label];
    });
    if (r) expect(r).toEqual(['none', 'auto', 'rgba(0, 0, 0, 0)', true]);
  });

  test('controlled: onValueChange once (not again for the same segment); the hidden input follows; icons show before labels; a new value from outside moves the selection', async () => {
    const calls: string[] = [], api: { set?: (v: string) => void; view?: string } = {};
    await render(<Col><Controlled calls={calls} api={api} /></Col>);
    await userEvent.click(seg('ctl', 'board'));
    await userEvent.click(seg('ctl', 'board'));
    const hidden = el('ctl').querySelector<HTMLInputElement>('input[type=hidden]')!;
    expect([calls.join(), api.view, hidden.name + '=' + hidden.value, (seg('ctl', 'board').querySelector<HTMLElement>('[data-icon]'))?.dataset.icon])
      .toEqual(['board', 'board', 'view=board', 'view_kanban']);
    api.set!('list');
    await expect.poll(() => checked('ctl')).toBe('list');
    await expect.poll(() => off('ctl')[0]).toBe(0);
  });

  test('icon-only, sm: 24px tall, 24px-wide segments (centers 24px apart, WCAG 2.5.8) named by aria-label, defaultValue chosen; md stays square at 26px', async () => {
    await render(<Col><SegmentedControl id="ico" aria-label="Align" size="sm" defaultValue="c" options={[
      { value: 'l', icon: 'format_align_left', 'aria-label': 'Left' }, { value: 'c', icon: 'format_align_center', 'aria-label': 'Center' }, { value: 'r', icon: 'format_align_right', 'aria-label': 'Right' },
    ]} /></Col>);
    const it = items('ico');
    expect([el('ico').getBoundingClientRect().height, it.map((x) => x.getAttribute('aria-label')).join(), it.map((x) => Math.round(x.getBoundingClientRect().width)).join(), Math.round(it[0].getBoundingClientRect().height), checked('ico')])
      .toEqual([24, 'Left,Center,Right', '24,24,24', 18, 'c']);
    const centers = it.map((x) => { const r = x.getBoundingClientRect(); return r.left + r.width / 2; });
    expect(Math.round(centers[1] - centers[0])).toBeGreaterThanOrEqual(24);
    // The selection sits exactly on the checked segment.
    const ind = el('ico').querySelector(':scope > span[aria-hidden]')!.getBoundingClientRect(), c = it[1].getBoundingClientRect();
    expect([Math.round(ind.left), Math.round(ind.width)]).toEqual([Math.round(c.left), Math.round(c.width)]);
    await render(<SegmentedControl id="icomd" aria-label="Align" options={[{ value: 'l', icon: 'format_align_left', 'aria-label': 'Left' }, { value: 'r', icon: 'format_align_right', 'aria-label': 'Right' }]} />);
    expect(items('icomd').map((x) => Math.round(x.getBoundingClientRect().width)).join()).toBe('26,26');
  });

  test('lg: 44px tall like a lg Input or Button, 16px label padding, a base-size label and 38px-square icon-only segments', async () => {
    await render(<Col>
      <SegmentedControl id="lg" aria-label="Period" size="lg" options={PERIODS.slice(0, 2)} />
      <SegmentedControl id="lgi" aria-label="Align" size="lg" options={[{ value: 'l', icon: 'format_align_left', 'aria-label': 'Left' }, { value: 'r', icon: 'format_align_right', 'aria-label': 'Right' }]} />
    </Col>);
    const it = items('lg')[0];
    expect([el('lg').getBoundingClientRect().height, el('lg').dataset.size, css(it).paddingLeft, css(el('lg')).fontSize, items('lgi').map((x) => Math.round(x.getBoundingClientRect().width)).join()])
      .toEqual([44, 'lg', '16px', '16px', '38,38']);
  });

  test('fullWidth with a label too long for its equal share: the segments share by content instead, still filling the width, so "Kisi" gives its spare room to the long ones; wide enough, equal again (GR50)', async () => {
    const opts = [{ value: 'list', label: 'Daftar lengkap' }, { value: 'grid', label: 'Kisi' }, { value: 'map', label: 'Peta lokasi toko' }, { value: 'cal', label: 'Kalender' }];
    let setW: (w: number) => void = () => {};
    function Box() { const [w, set] = React.useState(320); setW = set; return <div style={{ width: w + 'px' }}><SegmentedControl id="fit" aria-label="View" fullWidth options={opts} defaultValue="list" /></div>; }
    await render(<Box />);
    const widths = () => items('fit').map((b) => Math.round(b.getBoundingClientRect().width));
    const whole = (v: string) => { const l = seg('fit', v).firstElementChild as HTMLElement; return l.scrollWidth <= l.clientWidth; };
    await expect.poll(() => whole('cal')).toBe(true);
    const w = widths();
    expect([whole('grid'), w[1] < w[0], Math.abs(w.reduce((a, b) => a + b, 0) - el('fit').clientWidth) <= 6]).toEqual([true, true, true]);
    setW(900);
    await expect.poll(() => new Set(widths()).size).toBe(1);
  });

  test('fullWidth: fills its container with equal segments; disabled: every segment disabled and out of the Tab order, faded', async () => {
    await render(<Col>
      <div style={{ width: '300px' }}><SegmentedControl id="full" aria-label="Full" fullWidth options={PERIODS.slice(0, 3)} /></div>
      <SegmentedControl id="dis" aria-label="Dis" disabled options={PERIODS.slice(0, 2)} />
    </Col>);
    expect(el('full').getBoundingClientRect().width).toBe(300);
    expect(new Set(items('full').map((x) => Math.round(x.getBoundingClientRect().width))).size).toBe(1);
    expect([el('dis').getAttribute('aria-disabled'), items('dis').every((x) => x.disabled && x.tabIndex === -1), css(el('dis')).opacity]).toEqual(['true', true, '0.5']);
  });

  test('long labels in 320px: the segments share the width by content, so short labels stay whole and the long one gives way, its full label as its title; the selection still sits on its segment (EU1)', async () => {
    const opts: SegmentedControlOption[] = [{ value: 'n', label: 'Notifications' }, { value: 'i', label: 'Internationalisation-preferences' }, { value: 's', label: 'Security' }];
    await render(<div style={{ width: '320px' }}><SegmentedControl id="lg" aria-label="Settings" options={opts} defaultValue="s" /><SegmentedControl id="ok" aria-label="Period" options={PERIODS} /></div>);
    const label = (v: string) => seg('lg', v).lastElementChild as HTMLElement;
    const whole = (v: string) => label(v).scrollWidth <= label(v).clientWidth;
    await expect.poll(() => seg('lg', 'i').title).toBe('Internationalisation-preferences');
    expect([Math.round(el('lg').getBoundingClientRect().width) <= 320, whole('n'), whole('s'), whole('i'), seg('lg', 'n').title, seg('lg', 's').title])
      .toEqual([true, true, true, false, '', '']);
    // The selection follows the last layout change (a late font can still move the columns), so poll for it.
    await expect.poll(() => off('lg')).toEqual([0, 0]);
    // Room to spare: no label cut, no title, and the control as wide as its segments need.
    const l = items('ok').map((b) => b.lastElementChild as HTMLElement);
    expect([l.every((x) => x.scrollWidth <= x.clientWidth), items('ok').every((b) => !b.title), Math.round(el('ok').getBoundingClientRect().width) < 320]).toEqual([true, true, true]);
  });

  test('right-to-left: segments run right to left and ArrowLeft goes to the next one', async () => {
    await render(<Col><div dir="rtl"><SegmentedControl id="rtl" aria-label="RTL" options={PERIODS.slice(0, 3)} /></div></Col>);
    seg('rtl', 'day').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(seg('rtl', 'day').getBoundingClientRect().left).toBeGreaterThan(seg('rtl', 'week').getBoundingClientRect().left);
    expect(checked('rtl')).toBe('week');
    await expect.poll(() => off('rtl')[0]).toBe(0);
  });

  test('contrast: the outline keeps 3:1 on the page, labels 4.5:1 (the selection\'s outline 2:1), in all six themes', async () => {
    await render(<Col><Period /></Col>);
    const e = el('per'), indi = e.querySelector(':scope > span[aria-hidden]')!;
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // Colors ease after a theme change; read the end state.
      for (const x of [e, ...e.querySelectorAll('*')]) void css(x).color;
      await settled();
      const bg = css(e).backgroundColor;
      const pairs: Array<[string, string, string, number]> = [
        ['outline on page', css(e).borderTopColor, 'var(--surface)', 3],
        ['label on bg', css(seg('per', 'day')).color, bg, 4.5],
        ['selected label', css(e.querySelector('[aria-checked=true]')).color, css(indi).backgroundColor, 4.5],
        ['selection outline on bg', css(indi).borderTopColor, bg, 2],
      ];
      for (const [k, fg, on, min] of pairs) { const r = contrast(fg, on); n++; if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    expect(low).toEqual([]);
    expect(n).toBe(24);
  });

  test('--segmented-control-bg overrides one control', async () => {
    await render(<SegmentedControl id="tok" aria-label="Tok" options={PERIODS.slice(0, 2)} style={{ '--segmented-control-bg': 'rgb(1, 2, 3)' } as React.CSSProperties} />);
    expect(css(el('tok')).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('readOnly: aria-readonly on the group; a click and the arrows move focus but not the selection; the form still gets the value', async () => {
    const calls: string[] = [];
    await render(<form id="ro-form"><SegmentedControl id="ro" aria-label="Period" options={PERIODS} defaultValue="week" readOnly name="p" onValueChange={(v) => { calls.push(v); }} /></form>);
    expect([el('ro').getAttribute('aria-readonly'), el('ro').hasAttribute('readonly'), items('ro').map((b) => b.tabIndex)]).toEqual(['true', false, [-1, 0, -1, -1]]);
    await userEvent.click(seg('ro', 'day'));
    expect([checked('ro'), focused()]).toEqual(['week', 'day']);
    seg('ro', 'week').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([checked('ro'), focused()]).toEqual(['week', 'month']);
    await userEvent.keyboard('{ArrowRight}{End}');
    expect([checked('ro'), focused(), calls]).toEqual(['week', 'month', []]);
    expect(new FormData(el('ro-form') as HTMLFormElement).get('p')).toBe('week');
  });

  test('invalid and required: aria-invalid and aria-required on the group, and a danger outline that keeps 3:1 on the page in all six themes', async () => {
    await render(<SegmentedControl id="bad" aria-label="Period" options={PERIODS} invalid required />);
    expect([el('bad').getAttribute('aria-invalid'), el('bad').getAttribute('aria-required'), el('bad').hasAttribute('invalid'), el('bad').hasAttribute('required')]).toEqual(['true', 'true', false, false]);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const r = contrast(css(el('bad')).borderTopColor, 'var(--surface)'); if (r < 3) low.push(`${th}: ${r.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('in a Field with required and an error: aria-invalid and aria-required on the group, and no invalid attribute or React warning', async () => {
    const warned: unknown[] = [], warn = console.error;
    console.error = (...a: unknown[]) => { warned.push(a[0]); };
    try {
      await render(<Field label="Period" required error="Pick one"><SegmentedControl id="fs" aria-label="Period" options={PERIODS} /></Field>);
    } finally { console.error = warn; }
    expect([el('fs').getAttribute('aria-invalid'), el('fs').getAttribute('aria-required'), el('fs').hasAttribute('invalid')]).toEqual(['true', 'true', false]);
    expect(warned.filter((w) => /invalid|required/i.test(String(w)))).toEqual([]);
  });

  test('pressed: a held segment shrinks to 95% and springs back; not when read-only (ED1)', async () => {
    await withMotion(async () => {
      await render(<><SegmentedControl id="sp" aria-label="View" options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Board' }]} defaultValue="a" />
        <SegmentedControl id="sr" aria-label="Locked" readOnly options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Board' }]} defaultValue="a" /></>);
      const seg = (id: string) => el(id).querySelectorAll('button')[1];
      expect(css(seg('sp')).transitionProperty).toContain('scale');
      await press(seg('sp'), () => expect.poll(() => css(seg('sp')).scale).toBe('0.95'));
      await expect.poll(() => css(seg('sp')).scale).toBe('none');
      await press(seg('sr'), () => expect(css(seg('sr')).scale).toBe('none'));
    });
  });
  test('a new choice slides the indicator from the last one by clip-path (compositor), never scale or width, so its border and corners keep their shape between segments of different widths; it comes to rest on the segment (EG1, GL1)', async () => {
    await withMotion(async () => {
      await render(<SegmentedControl id="sl" aria-label="View" options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Board view' }]} defaultValue="a" />);
      // The component measures the segments as they are when the choice is made, and this test measures them after.
      // A web font that arrives in between widens the labels (by 1 to 5px), and the slide is measured again and
      // settled early. So the fonts are in, and the control has measured them, before the click.
      await expect.poll(async () => { await document.fonts.ready; return document.fonts.status; }).toBe('loaded');
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      const [a, b] = items('sl');
      const ind = el('sl').firstElementChild as HTMLElement;
      // A click from the page itself, so the transitions are read a frame after the choice. A driver click (userEvent)
      // comes back after a round trip, which in WebKit can outlast the 200ms slide, leaving nothing to read. One press
      // (detail 1), as a mouse's: a click with none is a key's, which puts it there at once (KW1).
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      await new Promise(requestAnimationFrame);
      const moves = document.getAnimations().filter((x): x is CSSTransition => x instanceof CSSTransition && (x.effect as KeyframeEffect).target === ind);
      expect(moves.map((x) => [(x.effect as KeyframeEffect).pseudoElement, x.transitionProperty]).sort()).toEqual([['::after', 'clip-path'], ['::before', 'clip-path']]);
      // The border layer starts cut to the first segment (nothing cut from its start, the second segment's extra width
      // from its end) and ends cut to the second.
      const insets = (k: Keyframe) => String(k.clipPath).match(/-?[\d.]+px/g)!.slice(0, 4).map((n) => Math.round(parseFloat(n)));
      const border = moves.find((x) => (x.effect as KeyframeEffect).pseudoElement === '::before')!, [from, to] = (border.effect as KeyframeEffect).getKeyframes();
      expect([insets(from), insets(to)]).toEqual([[0, Math.round(b.offsetLeft + b.offsetWidth - a.offsetLeft - a.offsetWidth), 0, 0], [0, 0, 0, Math.round(b.offsetLeft - a.offsetLeft)]]);
      // Half way nothing is scaled, so the border is 1px and the corners round.
      moves.forEach((x) => { x.pause(); x.currentTime = Number(x.effect!.getComputedTiming().duration) / 2; });
      expect([css(ind).scale, css(ind).transform]).toEqual(['none', 'none']);
      moves.forEach((x) => x.play());
      // The component settles on a timer of the transition's length, which the pause above doesn't hold back: when it
      // fires first (WebKit), taking data-slide off cancels the transitions and finished rejects with AbortError. Either
      // way the slide is over, and where it came to rest is checked below.
      await Promise.all(moves.map((x) => x.finished.catch(() => {})));
      await expect.poll(() => ind.hasAttribute('data-slide')).toBe(false);
      expect(off('sl')).toEqual([0, 0]);
    });
  });
  test('from the keyboard (KW1): an arrow moves the indicator at once, with no slide', async () => {
    await withMotion(async () => {
      await render(<SegmentedControl id="sk" aria-label="View" options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Board view' }]} defaultValue="a" />);
      const ind = el('sk').firstElementChild as HTMLElement;
      items('sk')[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      const moves = document.getAnimations().filter((x) => (x.effect as KeyframeEffect).target === ind);
      expect([checked('sk'), moves.length, ind.hasAttribute('data-slide'), off('sk')]).toEqual(['b', 0, false, [0, 0]]);
    });
  });
  test('before the script runs, the selected segment carries the indicator\'s surface itself (FC1)', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(<SegmentedControl id="ssr" aria-label="View" options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Board' }]} defaultValue="b" />);
    document.body.append(host);
    try {
      expect([el('ssr').firstElementChild!.tagName, css(seg('ssr', 'b')).backgroundColor, css(seg('ssr', 'a')).backgroundColor]).toEqual(['BUTTON', color('var(--surface)'), 'rgba(0, 0, 0, 0)']);
    } finally { host.remove(); }
  });
  test('L8E85 in a Field, a level down (a row with a note after it): the label, hint, error, required and disabled still reach it', async () => {
    await render(<Field label="Period" hint="Shown on the chart" error="Pick one" required disabled><div><SegmentedControl data-testid="sd1" options={PERIODS} /><span>UTC</span></div></Field>);
    const g = document.querySelector<HTMLElement>('[data-testid=sd1]')!;
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    expect([text(g.getAttribute('aria-labelledby')), text(g.getAttribute('aria-describedby')), g.getAttribute('aria-invalid'), g.getAttribute('aria-required'), g.getAttribute('aria-disabled')])
      .toEqual(['Period*', 'Shown on the chart / Pick one', 'true', 'true', 'true']);   // the * is aria-hidden
    expect([...g.querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
  });
});
