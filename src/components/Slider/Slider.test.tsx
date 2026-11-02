import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, drag } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { Slider } from './Slider';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const thumb = (id: string, i = 0) => el(id).querySelectorAll<HTMLElement>('[role=slider]')[i];
const now = (id: string, i = 0) => Number(thumb(id, i).getAttribute('aria-valuenow'));
const rect = (e: Element) => e.getBoundingClientRect();
// The root holds the track (a div) and the hidden inputs. The track holds the fill (a div), the marks (hidden
// spans, each an optional empty tick and a label) and the thumbs (role=slider), each with its value chip.
const MARK = ':scope > div > span[aria-hidden]', LABEL = `${MARK} > span:not(:empty)`;
const track = (id: string) => rect(el(id).querySelector(':scope > div')!);
const center = (e: Element) => { const r = rect(e); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
// A point on the track at a share of its width, relative to the slider root (as Playwright's positions are).
const at = (id: string, share: number) => { const t = track(id), r = rect(el(id)); return { x: t.left - r.left + t.width * share, y: r.height / 2 }; };
// The pointer events a slider gets, with where they land, for the message when a drag test fails.
const traced = (id: string) => {
  const seen: string[] = [], t = track(id), log = (e: PointerEvent) => { seen.push(`${e.type.replace('pointer', '')}@${Math.round(e.clientX)}`); };
  for (const k of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'] as const) el(id).addEventListener(k, log);
  return () => `track ${Math.round(t.left)}..${Math.round(t.right)}: ${seen.join(' ')}`;
};
const press = (id: string, share: number) => userEvent.click(el(id), { position: at(id, share) });

let calls: number[] = [], commits: string[] = [];
function Range() {
  const [v, set] = React.useState<[number, number]>([20, 80]);
  return <Slider id="rng" aria-label="Price" value={v} onValueChange={set} onValueCommit={(n) => { commits.push(n.join('-')); }} formatValue={(n) => '$' + n} name="price" />;
}
function App(props: { sref?: React.Ref<HTMLDivElement> }) {
  return <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <span id="vlab">Volume</span>
    <Slider id="one" aria-labelledby="vlab" defaultValue={50} ref={props.sref} className="extra" onValueChange={(v) => { calls.push(v); }} onValueCommit={(v) => { commits.push(String(v)); }} />
    <Range />
    <Slider id="stp" aria-label="Step" defaultValue={0.5} min={0} max={1} step={0.1} />
    <Slider id="dis" aria-label="Dis" defaultValue={30} disabled />
    <Slider id="sm" aria-label="Small" size="sm" defaultValue={0} />
    <div dir="rtl"><Slider id="rtl" aria-label="RTL" defaultValue={25} /></div>
    <Slider id="tok" aria-label="Tok" defaultValue={40} style={{ '--slider-fill': 'rgb(1, 2, 3)' } as React.CSSProperties} />
  </div>;
}
const setup = async (sref?: React.Ref<HTMLDivElement>) => { calls = []; commits = []; await render(<App sref={sref} />); };

const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

describe('Slider', () => {
  test('with Alt, Ctrl or ⌘ the arrow keys are left to the browser (Alt+← goes back a page) (L8E28)', async () => {
    await render(<Slider id="mk" aria-label="Volume" defaultValue={50} />);
    const t = thumb('mk');
    t.focus();
    const before = t.getAttribute('aria-valuenow');
    expect([modified(t), modified(t, 'ArrowLeft'), document.activeElement === t, t.getAttribute('aria-valuenow') === before]).toEqual([[false, false, false], [false, false, false], true, true]);
  });

  test('showValue without formatValue writes the number in the locale\'s digits and marks: "٤٠" in ar-EG, "1.500" in id-ID, "40" in en-US (GR24)', async () => {
    await render(<div style={{ width: '420px' }}>
      <SerupaProvider locale="ar-EG"><Slider id="v-ar" aria-label="Heat" showValue defaultValue={40} /></SerupaProvider>
      <SerupaProvider locale="id-ID"><Slider id="v-id" aria-label="Heat" showValue max={5000} defaultValue={1500} /></SerupaProvider>
      <SerupaProvider locale="en-US"><Slider id="v-en" aria-label="Heat" showValue defaultValue={40} /></SerupaProvider>
    </div>);
    const chip = (id: string) => el(id).querySelector('[role=slider] > [aria-hidden=true]')!.textContent;
    expect([chip('v-ar'), chip('v-id'), chip('v-en')]).toEqual(['٤٠', '1.500', '40']);
  });

  test('your onKeyDown runs first, with the root as currentTarget: preventDefault() on a key keeps the slider from changing; other keys still work', async () => {
    const changes: number[] = [], targets: (EventTarget | null)[] = [];
    await render(<Slider id="kd" aria-label="Volume" defaultValue={50} onValueChange={(v) => changes.push(v)}
      onKeyDown={(e) => { targets.push(e.currentTarget); if (e.key === 'ArrowRight') e.preventDefault(); }} />);
    thumb('kd').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([now('kd'), changes]).toEqual([50, []]);
    await userEvent.keyboard('{ArrowLeft}');
    expect([now('kd'), changes.length > 0]).toEqual([49, true]);
    expect(targets.length === 2 && targets.every((t) => t === document.getElementById('kd'))).toBe(true);
  });

  test('a range: onFocus and onBlur fire once each, entering and leaving the slider, not when Tab moves between its thumbs', async () => {
    const seen: string[] = [];
    await render(<><button id="before">Before</button>
      <Slider id="fb" aria-label="Price" defaultValue={[20, 80]} onFocus={() => seen.push('focus')} onBlur={() => seen.push('blur')} />
      <button id="after">After</button></>);
    el('before').focus();
    await userEvent.tab(); await userEvent.tab(); await userEvent.tab();
    expect([document.activeElement!.id, seen]).toEqual(['after', ['focus', 'blur']]);
  });

  test('a range\'s thumb names come from the labels: Indonesian under an id-ID provider', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Slider defaultValue={[20, 80]} /></SerupaProvider>);
    expect([...document.querySelectorAll('[role="slider"]')].map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Maksimum']);
  });

  test('one thumb: a role="slider" at 50 of 0..100, labelled by aria-labelledby, in the Tab order; ref and className reach the root; md is 20px tall', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await setup(ref);
    const root = el('one'), th = thumb('one');
    expect([root.querySelectorAll('[role=slider]').length, th.getAttribute('aria-valuenow'), th.getAttribute('aria-valuemin'), th.getAttribute('aria-valuemax')]).toEqual([1, '50', '0', '100']);
    expect([th.getAttribute('aria-labelledby'), th.tabIndex, th.getAttribute('aria-orientation'), root.getAttribute('role')]).toEqual(['vlab', 0, 'horizontal', null]);
    expect([ref.current === root, root.dataset.component, rect(root).height]).toEqual([true, 'slider', 20]);
    expect(root.className).toMatch(/extra/);
  });

  test('the thumb is centered on 50% of the track, vertically on the track; the fill covers half', async () => {
    await setup();
    const t = track('one'), c = center(thumb('one')), f = rect(el('one').querySelector(':scope > div > div')!);
    expect(Math.abs(c.x - (t.left + t.width / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(c.y - (t.top + t.height / 2))).toBeLessThanOrEqual(1);
    expect(Math.round(f.width / t.width * 100)).toBe(50);
  });

  test('keys: Right/Up +1, Left/Down −1, Shift+arrow ±10, PageDown −10, End/Home to the ends, clamped; onValueCommit once per press that changed the value (not at the ends)', async () => {
    await setup();
    thumb('one').focus();
    const seq: number[] = [];
    for (const k of ['{ArrowRight}', '{ArrowUp}', '{ArrowLeft}', '{ArrowDown}', '{ArrowDown}', '{Shift>}{ArrowUp}{/Shift}', '{PageDown}', '{PageDown}', '{End}', '{ArrowRight}', '{Home}', '{ArrowLeft}']) {
      await userEvent.keyboard(k); seq.push(now('one'));
    }
    expect(seq.join()).toBe('51,52,51,50,49,59,49,39,100,100,0,0');
    expect(commits.join()).toBe('51,52,51,50,49,59,49,39,100,0');
  });

  test('pointer: a press on the track jumps there (30) and dragging follows (60), with one commit at the end; the thumb takes focus', async () => {
    await setup();
    const trace = traced('one');
    await drag(el('one'), at('one', 0.3), at('one', 0.6));
    expect([calls[0], now('one'), commits.join(), document.activeElement === thumb('one')], trace()).toEqual([30, 60, '60', true]);
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test('L8E109: a press on the thumb let go where it was, or a drag back to the start, calls no onValueCommit', async () => {
    await setup();
    await press('one', 0.5);                                  // on the thumb at 50
    await drag(el('one'), at('one', 0.5), at('one', 0.5));    // a drag that ends where it began
    expect([now('one'), commits]).toEqual([50, []]);
    await press('one', 0.7);
    expect(commits).toEqual(['70']);
  });

  test('pointer: dragging past the end clamps (100), changing as it goes, with one commit at the end', async () => {
    await setup();
    const t = track('one'), r = rect(el('one'));
    // past the end, but inside the viewport: Firefox mangles mouse events outside it
    const beyond = { x: Math.min(t.right + 80, innerWidth - 10) - r.left, y: r.height / 2 };
    const trace = traced('one');
    await drag(el('one'), at('one', 0.3), beyond);
    expect([calls[0], now('one'), commits.join()], trace()).toEqual([30, 100, '100']);
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  test('range: a group named "Price" with thumbs "Minimum" (20, 0..80) and "Maximum" (80, 20..100), valuetext "$20"/"$80", and two hidden inputs', async () => {
    await setup();
    const root = el('rng'), th = [...root.querySelectorAll('[role=slider]')];
    expect([root.getAttribute('role'), root.getAttribute('aria-label')]).toEqual(['group', 'Price']);
    expect(th.map((x) => x.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum']);
    expect(th.map((x) => x.getAttribute('aria-valuenow'))).toEqual(['20', '80']);
    expect(th.map((x) => x.getAttribute('aria-valuemin') + '..' + x.getAttribute('aria-valuemax'))).toEqual(['0..80', '20..100']);
    expect(th.map((x) => x.getAttribute('aria-valuetext'))).toEqual(['$20', '$80']);
    expect([...root.querySelectorAll<HTMLInputElement>('input[type=hidden]')].map((i) => i.name + '=' + i.value)).toEqual(['price=20', 'price=80']);
  });

  test('range: a press moves the nearest thumb (90 → the high one, 10 → the low one); the low thumb\'s End goes up to the high thumb, and it can\'t pass it', async () => {
    await setup();
    await press('rng', 0.9);
    expect([now('rng', 0), now('rng', 1)]).toEqual([20, 90]);
    await press('rng', 0.1);
    expect([now('rng', 0), now('rng', 1)]).toEqual([10, 90]);
    thumb('rng', 0).focus();
    await userEvent.keyboard('{End}');
    expect([now('rng', 0), now('rng', 1)]).toEqual([90, 90]);
    await userEvent.keyboard('{ArrowRight}');
    expect([now('rng', 0), now('rng', 1)]).toEqual([90, 90]);
  });

  test('step 0.1: 0.5 → 0.8 with no floating-point noise; a press snaps to the nearest step (23.4% → 0.2)', async () => {
    await setup();
    thumb('stp').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(now('stp')).toBe(0.8);
    await press('stp', 0.234);
    expect(now('stp')).toBe(0.2);
  });

  test('disabled: out of the Tab order, aria-disabled, faded, and presses do nothing', async () => {
    await setup();
    const th = thumb('dis');
    expect([th.tabIndex, th.getAttribute('aria-disabled'), css(el('dis')).opacity]).toEqual([-1, 'true', '0.5']);
    await press('dis', 0.9);
    expect(now('dis')).toBe(30);
  });

  test('inside a disabled <fieldset>: disabled like a native input (Tab skips it, aria-disabled, keys and presses do nothing, no form value); enabling the fieldset brings it back', async () => {
    const calls: unknown[] = [];
    function Form() {
      const [off, setOff] = React.useState(true);
      return <form id="fsf"><fieldset disabled={off}><legend>Volume</legend><Slider id="fs" aria-label="Volume" name="vol" defaultValue={30} onValueChange={(v) => calls.push(v)} /></fieldset>
        <button type="button" id="fs-toggle" onClick={() => setOff(!off)}>toggle</button></form>;
    }
    await render(<Form />);
    const th = thumb('fs');
    expect([th.tabIndex, th.getAttribute('aria-disabled'), el('fs').dataset.disabled, [...new FormData(el('fsf') as HTMLFormElement).keys()].join()]).toEqual([-1, 'true', '', '']);
    th.focus();
    await userEvent.keyboard('{ArrowRight}');
    await press('fs', 0.9);
    expect([now('fs'), calls.length]).toEqual([30, 0]);
    await userEvent.click(el('fs-toggle'));
    await expect.poll(() => thumb('fs').tabIndex).toBe(0);
    thumb('fs').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([now('fs'), calls, thumb('fs').getAttribute('aria-disabled'), new FormData(el('fsf') as HTMLFormElement).get('vol')]).toEqual([31, [31], null, '31']);
  });

  test('in a Field: the label names the thumb (or a range\'s group) and the hint describes it; its own aria-label still wins', async () => {
    await render(<>
      <Field label="Volume" hint="0 is muted"><Slider data-testid="sf1" /></Field>
      <Field label="Price" hint="In dollars"><Slider data-testid="sf2" defaultValue={[20, 80]} /></Field>
      <Field label="Volume"><Slider data-testid="sf3" aria-label="Music volume" /></Field>
    </>);
    const root = (t: string) => document.querySelector<HTMLElement>(`[data-testid=${t}]`)!;
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    const one = root('sf1').querySelector('[role=slider]')!, two = root('sf2');
    expect([text(one.getAttribute('aria-labelledby')), text(one.getAttribute('aria-describedby')), root('sf1').getAttribute('aria-describedby')])
      .toEqual(['Volume', '0 is muted', null]);
    expect([two.getAttribute('role'), text(two.getAttribute('aria-labelledby')), text(two.getAttribute('aria-describedby'))]).toEqual(['group', 'Price', 'In dollars']);
    const own = root('sf3').querySelector('[role=slider]')!;
    expect([own.getAttribute('aria-label'), own.getAttribute('aria-labelledby')]).toEqual(['Music volume', null]);
  });

  test('ref.current.focus() and autoFocus land on the first thumb, as a form library focusing the first invalid field expects; disabled, nothing is focused', async () => {
    const one = React.createRef<HTMLDivElement>(), two = React.createRef<HTMLDivElement>(), off = React.createRef<HTMLDivElement>();
    await render(<>
      <Slider id="sfa" aria-label="Volume" autoFocus />
      <Slider id="sfr" ref={one} aria-label="Volume" />
      <Slider id="sfg" ref={two} aria-label="Price" defaultValue={[20, 80]} />
      <Slider id="sfd" ref={off} aria-label="Volume" disabled />
    </>);
    await expect.poll(() => document.activeElement).toBe(thumb('sfa'));
    expect(el('sfa').hasAttribute('autofocus')).toBe(false);
    one.current!.focus();
    expect(document.activeElement).toBe(thumb('sfr'));
    two.current!.focus();
    expect(document.activeElement).toBe(thumb('sfg', 0));
    off.current!.focus();
    expect(document.activeElement).toBe(thumb('sfg', 0));
    expect(one.current).toBe(el('sfr'));
  });

  test('sm: 16px thumb on a 4px track; at 0 the thumb is centered on the track\'s start and stays inside the slider', async () => {
    await setup();
    const t = track('sm'), c = center(thumb('sm'));
    expect([rect(el('sm')).height, t.height, c.w]).toEqual([16, 4, 16]);
    expect(Math.abs(c.x - t.left)).toBeLessThanOrEqual(1);
    expect(c.x - 8).toBeGreaterThanOrEqual(rect(el('sm')).left - 1);
  });

  test('right-to-left: 25 sits a quarter in from the right, ArrowLeft raises it, and a press near the left edge is near max', async () => {
    await setup();
    const t = track('rtl'), c = center(thumb('rtl'));
    expect(Math.abs(c.x - (t.right - t.width * 0.25))).toBeLessThanOrEqual(1);
    thumb('rtl').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(now('rtl')).toBe(26);
    await press('rtl', 0.1);
    expect(now('rtl')).toBe(90);
  });

  test('contrast: the track, fill and thumb ring keep 3:1 on the page in all six themes', async () => {
    await setup();
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor, q = (s: string) => css(el('one').querySelector(s));
      const parts = { track: q(':scope > div').backgroundColor, fill: q(':scope > div > div').backgroundColor, thumb: q('[role=slider]').borderTopColor };
      for (const [k, c] of Object.entries(parts)) { const r = contrast(c, page); n++; if (r < 3) low.push(`${th} ${k}: ${r.toFixed(2)}`); }
    }
    expect([low, n]).toEqual([[], 18]);
  });

  test('--slider-fill overrides one slider', async () => {
    await setup();
    expect(css(el('tok').querySelector(':scope > div > div')).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('min with decimals the step doesn\'t have (min 0.5, max 5.5, step 1): the value stays on 0.5, 1.5, 2.5…', async () => {
    await render(<Slider id="half" aria-label="Half" min={0.5} max={5.5} step={1} defaultValue={2.5} />);
    const t = thumb('half'), now = () => t.getAttribute('aria-valuenow');
    expect(now()).toBe('2.5');
    t.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(now()).toBe('3.5');
    await userEvent.keyboard('{Home}');
    expect(now()).toBe('0.5');
    await userEvent.keyboard('{ArrowRight}');
    expect(now()).toBe('1.5');
    await userEvent.keyboard('{End}{ArrowLeft}');
    expect(now()).toBe('4.5');
  });

  test('a step in exponent form (1e-7) keeps its decimals', async () => {
    await render(<Slider id="tiny" aria-label="Tiny" min={0} max={1e-6} step={1e-7} defaultValue={3e-7} />);
    const t = thumb('tiny');
    t.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(Number(t.getAttribute('aria-valuenow'))).toBe(4e-7);
  });

  test('readOnly: the thumb takes focus and says aria-readonly, but keys and presses leave the value, and a form still gets it', async () => {
    const changed: number[] = [];
    await render(<form id="ro-form" style={{ width: '420px' }}><Slider id="ro" aria-label="Locked" readOnly defaultValue={30} name="v" onValueChange={(v) => { changed.push(v); }} /></form>);
    const t = thumb('ro');
    expect([t.tabIndex, t.getAttribute('aria-readonly'), el('ro').hasAttribute('readonly')]).toEqual([0, 'true', false]);
    t.focus();
    await userEvent.keyboard('{ArrowRight}{End}{PageUp}');
    await press('ro', 0.9);
    expect([now('ro'), changed, document.activeElement === t]).toEqual([30, [], true]);
    expect(new FormData(el('ro-form') as HTMLFormElement).get('v')).toBe('30');
  });

  test('invalid: aria-invalid on each thumb, and a danger fill and ring that keep 3:1 on the page in all six themes', async () => {
    await render(<div style={{ width: '420px' }}><Slider id="bad" aria-label="Bad" invalid defaultValue={[20, 60]} /></div>);
    expect([...el('bad').querySelectorAll('[role=slider]')].map((t) => t.getAttribute('aria-invalid'))).toEqual(['true', 'true']);
    expect(el('bad').hasAttribute('aria-invalid')).toBe(false);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor, danger = css(el('bad').querySelector(':scope > div > div')).backgroundColor;
      expect(css(el('bad').querySelector('[role=slider]')).borderTopColor).toBe(danger);
      const r = contrast(danger, page); if (r < 3) low.push(`${th}: ${r.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('in a Field with required and an error: the thumb is invalid, and neither invalid nor aria-required lands on the root <div>', async () => {
    const warned: unknown[] = [], warn = console.error;
    console.error = (...a: unknown[]) => { warned.push(a[0]); };
    try {
      await render(<div style={{ width: '420px' }}><Field label="Volume" required error="Too loud"><Slider id="fv" aria-label="Volume" defaultValue={90} /></Field></div>);
    } finally { console.error = warn; }
    expect([thumb('fv').getAttribute('aria-invalid'), el('fv').hasAttribute('invalid'), el('fv').hasAttribute('aria-required'), el('fv').hasAttribute('aria-invalid')]).toEqual(['true', false, false, false]);
    expect(warned.filter((w) => /invalid|required/i.test(String(w)))).toEqual([]);
  });
  test('marks: true draws a mark per step (ticks only between the ends), and over 100 steps one per largeStep', async () => {
    await render(<div style={{ width: '420px' }}>
      <Slider id="mk" aria-label="Rating" min={0} max={10} marks defaultValue={3} />
      <Slider id="mk2" aria-label="Fine" min={0} max={100} step={0.5} largeStep={10} marks />
    </div>);
    const count = (id: string, s: string) => el(id).querySelectorAll(s).length;
    expect([count('mk', MARK), count('mk', `${MARK} > span:empty`), count('mk', LABEL), count('mk2', MARK)]).toEqual([11, 9, 0, 21]);
    expect([...el('mk').querySelectorAll(MARK)].every((m) => m.getAttribute('aria-hidden') === 'true')).toBe(true);
    // No labels, so no room is added under the track.
    expect(rect(el('mk')).height).toBe(rect(thumb('mk')).height);
  });

  test('marks with labels: the text sits under the track, centered on its value in either direction, and the slider makes room for it', async () => {
    const marks = [{ value: 0, label: '0°' }, { value: 50, label: 'Half' }, { value: 100, label: '100°' }, { value: 120, label: 'Off the track' }];
    await render(<div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Slider id="ml" aria-label="Heat" marks={marks} defaultValue={20} />
      <div dir="rtl"><Slider id="mlr" aria-label="Heat" marks={marks} defaultValue={20} /></div>
    </div>);
    for (const [id, dir] of [['ml', 1], ['mlr', -1]] as const) {
      const labels = [...el(id).querySelectorAll<HTMLElement>(LABEL)], t = track(id);
      expect(labels.map((l) => l.textContent)).toEqual(['0°', 'Half', '100°']);
      const mid = center(labels[1]);
      const want = dir === 1 ? t.left + t.width / 2 : t.right - t.width / 2;
      const text = document.createRange(); text.selectNodeContents(labels[1]);
      const tr = text.getBoundingClientRect();
      expect(Math.abs(tr.left + tr.width / 2 - want)).toBeLessThan(1.5);
      const start = document.createRange(); start.selectNodeContents(labels[0]);
      const sr = start.getBoundingClientRect();
      expect(Math.abs(sr.left + sr.width / 2 - (dir === 1 ? t.left : t.right))).toBeLessThan(1.5);
      expect(tr.top).toBeGreaterThanOrEqual(rect(thumb(id)).bottom);
      expect(tr.bottom).toBeLessThanOrEqual(rect(el(id)).bottom + 0.5);
      expect(mid.y).toBeGreaterThan(t.bottom);
    }
    // The thumb still sits on the track's line, and a press on a label moves it there.
    expect(Math.abs(center(thumb('ml')).y - (track('ml').top + track('ml').height / 2))).toBeLessThan(1);
    const half = el('ml').querySelectorAll<HTMLElement>(LABEL)[1], hr = rect(half), r = rect(el('ml'));
    await userEvent.click(el('ml'), { position: { x: hr.left - r.left + hr.width / 2, y: hr.top - r.top + hr.height / 2 } });
    expect(now('ml')).toBe(50);
  });

  test('showValue: the formatted value shows over the thumb only while it is focused, and stays out of what is read out', async () => {
    await render(<div style={{ width: '420px', paddingTop: '40px' }}><Slider id="sv" aria-label="Price" showValue formatValue={(v) => '$' + v} defaultValue={40} /><button id="away">Away</button></div>);
    const chip = () => el('sv').querySelector<HTMLElement>('[role=slider] > [aria-hidden]')!;
    expect([chip().textContent, chip().getAttribute('aria-hidden'), thumb('sv').getAttribute('aria-valuetext'), css(chip()).opacity]).toEqual(['$40', 'true', '$40', '0']);
    thumb('sv').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(chip().textContent).toBe('$41');
    await expect.poll(() => css(chip()).opacity).toBe('1');
    expect(rect(chip().firstElementChild!).bottom).toBeLessThanOrEqual(rect(thumb('sv')).top);
    expect(Math.abs(center(chip().firstElementChild!).x - center(thumb('sv')).x)).toBeLessThan(1);
    el('away').focus();
    await expect.poll(() => css(chip()).opacity).toBe('0');
  });

  test('contrast: mark labels keep 4.5:1 on the page, and the value chip\'s text 4.5:1 on the chip, in all six themes', async () => {
    await render(<div style={{ width: '420px' }}><Slider id="mc" aria-label="Heat" marks={[{ value: 50, label: 'Half' }]} showValue defaultValue={20} /></div>);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor, chip = css(el('mc').querySelector('[role=slider] > [aria-hidden] > span'));
      const a = contrast(css(el('mc').querySelector(LABEL)).color, page), b = contrast(chip.color, chip.backgroundColor);
      if (a < 4.5) low.push(`${th} label: ${a.toFixed(2)}`);
      if (b < 4.5) low.push(`${th} chip: ${b.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });
});

describe('Slider at 320px (GM2)', () => {
  // The labels are measured once the page's fonts have loaded and the slider has refitted to them (a frame later, from
  // its ResizeObserver). Under some locales (ja) a font is still arriving just after render, and the swap moves a label
  // by a fraction of a pixel; the slider refits on its own, which the second test checks, but a measure taken before
  // that frame saw the old nudge.
  const fontsIn = async () => { await document.fonts.ready; await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); };
  test('the value chip and the end labels stay inside the slider: nothing widens the page, in either direction, shown or hidden', async () => {
    const money = (v: number) => 'IDR ' + (v * 10000).toLocaleString('en-US') + ' per month';
    const marks = [{ value: 0, label: 'Nothing at all' }, { value: 50, label: 'Half' }, { value: 100, label: 'Everything there is' }];
    await render(<div id="gm2" style={{ width: '288px' }}>
      <Slider id="gm2-l" aria-label="Budget" defaultValue={100} showValue formatValue={money} marks={marks} />
      <div dir="rtl"><Slider id="gm2-r" aria-label="Budget" defaultValue={0} showValue formatValue={money} marks={marks} /></div>
    </div>);
    await fontsIn();
    for (const id of ['gm2-l', 'gm2-r']) {
      const box = el(id).getBoundingClientRect();
      const parts = [...el(id).querySelectorAll<HTMLElement>('[role="slider"] > [aria-hidden] > span, [aria-hidden] > span > span')].map((p) => p.getBoundingClientRect());
      expect([parts.length, parts.every((r) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5)]).toEqual([4, true]);
    }
    expect(el('gm2').scrollWidth).toBe(288);
    // The middle label stays centered on its point.
    const half = [...el('gm2-l').querySelectorAll<HTMLElement>('[aria-hidden] > span > span')][1].getBoundingClientRect(), t = el('gm2-l').querySelector('[role="slider"]')!.parentElement!.getBoundingClientRect();
    expect(Math.round(half.left + half.width / 2)).toBe(Math.round(t.left + t.width / 2));
  });
  test('a label that changes width after the first fit (a web font arriving) is fitted again, with the slider the same size', async () => {
    const marks = [{ value: 0, label: 'Nothing at all' }, { value: 100, label: 'Everything there is' }];
    await render(<div style={{ width: '200px' }}><Slider id="gm2-f" aria-label="Volume" defaultValue={50} marks={marks} /></div>);
    await fontsIn();
    const inside = () => {
      const box = el('gm2-f').getBoundingClientRect();
      return [...el('gm2-f').querySelectorAll<HTMLElement>('[aria-hidden] > span > span')].every((p) => { const r = p.getBoundingClientRect(); return r.left >= box.left - 0.5 && r.right <= box.right + 0.5; });
    };
    expect(inside()).toBe(true);
    const size = el('gm2-f').getBoundingClientRect().width;
    for (const p of el('gm2-f').querySelectorAll<HTMLElement>('[aria-hidden] > span > span')) p.style.letterSpacing = '2px';
    await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    expect([el('gm2-f').getBoundingClientRect().width, inside()]).toEqual([size, true]);
  });
  test('L8E84 in a Field, a level down (a row with a unit after it): the label, hint, error and disabled still reach it', async () => {
    await render(<>
      <Field label="Volume" hint="0 is muted" error="Too loud" disabled><div><Slider data-testid="sd1" defaultValue={90} /><span>dB</span></div></Field>
      <Field label="Price" hint="In dollars"><div><Slider data-testid="sd2" defaultValue={[20, 80]} /></div></Field>
    </>);
    const root = (t: string) => document.querySelector<HTMLElement>(`[data-testid=${t}]`)!;
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    const one = root('sd1').querySelector('[role=slider]')!, two = root('sd2');
    expect([text(one.getAttribute('aria-labelledby')), text(one.getAttribute('aria-describedby')), one.getAttribute('aria-invalid'), one.getAttribute('aria-disabled')])
      .toEqual(['Volume', '0 is muted / Too loud', 'true', 'true']);
    expect([two.getAttribute('role'), text(two.getAttribute('aria-labelledby')), text(two.getAttribute('aria-describedby'))]).toEqual(['group', 'Price', 'In dollars']);
  });
  test('L8E87 in a Field with an error: aria-errormessage is on each thumb (where aria-invalid is), not on the root <div>', async () => {
    await render(<>
      <Field label="Volume" error="Too loud"><Slider data-testid="se1" defaultValue={90} /></Field>
      <Field label="Price" error="Too wide"><Slider data-testid="se2" defaultValue={[10, 90]} /></Field>
    </>);
    const root = (t: string) => document.querySelector<HTMLElement>(`[data-testid=${t}]`)!;
    const said = (t: string) => [...root(t).querySelectorAll('[role=slider]')].map((th) => document.getElementById(th.getAttribute('aria-errormessage') || '')?.textContent ?? null);
    expect([said('se1'), said('se2'), root('se1').getAttribute('aria-errormessage'), root('se2').getAttribute('aria-errormessage')]).toEqual([['Too loud'], ['Too wide', 'Too wide'], null, null]);
  });
});
