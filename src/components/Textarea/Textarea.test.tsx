import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { Textarea } from './Textarea';

const el = (id: string) => document.getElementById(id) as HTMLTextAreaElement;
const box = (id: string) => {
  const i = el(id), w = i.parentElement as HTMLElement, c = css(w), f = css(i);
  return { rows: i.rows, wrap: w.className, fh: Math.round(i.getBoundingClientRect().height), fs: f.fontSize, pl: f.paddingLeft, pt: f.paddingTop, bc: c.borderTopColor, bw: c.borderTopWidth, r: c.borderRadius, bs: c.boxShadow, bg: c.backgroundColor, op: c.opacity, size: w.dataset.size, comp: w.dataset.component, resize: f.resize, oy: f.overflowY };
};
const count = (id: string) => el(id).parentElement!.querySelector('.dk-textarea__count') as HTMLElement;
const away = () => userEvent.hover(document.body, { position: { x: 800, y: 5 } });

function Ctrl(props: { onValue: (v: string) => void }) {
  const [v, set] = React.useState('xy');
  return <Textarea id="emoc" showCount maxLength={4} value={v} onChange={(e) => { props.onValue(e.target.value); set(e.target.value); }} aria-label="Emoji, controlled" />;
}

let changes: string[] = [], setCtrl: (v: string) => void = () => {};
function App(props: { tref?: React.Ref<HTMLTextAreaElement> }) {
  const [v, set] = React.useState(''), [cv, setC] = React.useState('abc'); setCtrl = setC;
  return <div style={{ display: 'grid', gap: '8px', width: '320px' }}>
    <label htmlFor="md">Notes</label>
    <Textarea id="md" ref={props.tref} placeholder="Dana" value={v} onChange={(e) => { changes.push(e.target.value); set(e.target.value); }} className="extra" data-x="y" />
    <Textarea id="sm" size="sm" rows={2} aria-label="Small" />
    <Textarea id="lg" size="lg" rows={1} aria-label="Large" />
    {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
    <Textarea id="bad" size="xl" rows={-2} aria-label="Bad" />
    <Textarea id="fixed" resize="none" aria-label="Fixed" />
    <Textarea id="auto" autoResize rows={2} maxRows={4} aria-label="Auto" />
    <div id="narrow" style={{ width: '320px' }}><Textarea id="wrap" autoResize rows={1} defaultValue="one two three four five six seven eight nine ten eleven twelve" aria-label="Wrap" /></div>
    <Textarea id="cnt" showCount maxLength={5} defaultValue="ab" aria-describedby="hint" aria-label="Count" />
    <p id="hint">Hint</p>
    <Textarea id="cnt2" showCount value={cv} onChange={(e) => setC(e.target.value)} aria-label="Count, no max" />
    <Textarea id="inv" invalid aria-label="Invalid" />
    <Textarea id="ro" readOnly defaultValue="Signed" aria-label="Read-only" />
    <Textarea id="dis" disabled aria-label="Disabled" />
  </div>;
}
const setup = async (tref?: React.Ref<HTMLTextAreaElement>) => { changes = []; await render(<App tref={tref} />); await document.fonts.ready; };

describe('Textarea', () => {
  test('a native <textarea> in a .dk-textarea box (data-component="textarea"); md text-sm, 12px side and 6px top padding, 1px border, 6px corners, 3 rows by default', async () => {
    await setup();
    const md = box('md');
    expect([el('md').tagName, md.comp, md.rows, md.fs, md.pl, md.pt, md.bw, md.r, md.fh]).toEqual(['TEXTAREA', 'textarea', 3, '14px', '12px', '6px', '1px', '6px', 3 * 20 + 12]);
    expect(md.wrap).toMatch(/dk-textarea dk-textarea--size-md/);
  });

  test('sizes: sm text-xs 8px/4px padding, lg text-base 16px/10px padding; rows sets the height; unknown size falls back to md and a bad rows to 3', async () => {
    await setup();
    const sm = box('sm'), lg = box('lg'), bad = box('bad');
    expect([sm.fs, sm.pl, sm.pt, sm.fh]).toEqual(['12px', '8px', '4px', 2 * 16 + 8]);
    expect([lg.fs, lg.pl, lg.pt, lg.fh]).toEqual(['16px', '16px', '10px', 24 + 20]);
    expect([bad.size, bad.rows]).toEqual(['md', 3]);
  });

  test('ref and attributes go to the <textarea>, className to the box; the <label htmlFor> names it', async () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    await setup(ref);
    const i = el('md');
    expect([ref.current === i, i.parentElement!.classList.contains('extra'), i.dataset.x, i.labels[0]?.textContent, i.placeholder]).toEqual([true, true, 'y', 'Notes', 'Dana']);
  });

  test('typing (with a new line) updates a controlled value through onChange', async () => {
    await setup();
    await userEvent.click(el('md'));
    await userEvent.keyboard('Ki{Enter}m');
    expect([el('md').value, changes.join('|')]).toEqual(['Ki\nm', 'K|Ki|Ki\n|Ki\nm']);
  });

  test('focus: the border and a 1px ring take the focus color; a transparent outline for forced-colors mode', async () => {
    await setup();
    await userEvent.click(el('md'));
    const ring = color('var(--focus-ring)');
    await expect.poll(() => box('md').bc).toBe(ring);
    await expect.poll(() => box('md').bs).toContain(ring);
    const c = css(el('md').parentElement);
    expect(box('md').bs).toMatch(/0px 0px 0px 1px/);
    expect([c.outlineWidth, c.outlineColor]).toEqual(['2px', 'rgba(0, 0, 0, 0)']);
  });

  test('hover: field-border-hover', async () => {
    await setup();
    await userEvent.hover(el('sm'));
    await expect.poll(() => box('sm').bc).toBe(color('var(--field-border-hover)'));
    expect(box('sm').bc).not.toBe(box('lg').bc);
    await away();
  });

  test('resize: a vertical handle by default; resize="none" has none', async () => {
    await setup();
    expect([box('md').resize, box('fixed').resize]).toEqual(['vertical', 'none']);
    expect(box('fixed').wrap).toMatch(/resize-none/);
  });

  test('autoResize: starts at rows (2 lines), grows a line at a time, stops at maxRows (4) and scrolls, shrinks back when emptied; no resize handle', async () => {
    await setup();
    const a0 = box('auto');
    expect([a0.fh, a0.resize]).toEqual([2 * 20 + 12, 'none']);
    await userEvent.click(el('auto'));
    await userEvent.keyboard('1{Enter}2{Enter}3');
    await expect.poll(() => [box('auto').fh, el('auto').scrollHeight > el('auto').clientHeight]).toEqual([3 * 20 + 12, false]);
    await userEvent.keyboard('{Enter}4{Enter}5{Enter}6');
    await expect.poll(() => [box('auto').fh, box('auto').oy, el('auto').scrollHeight > el('auto').clientHeight]).toEqual([4 * 20 + 12, 'auto', true]);
    await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
    await expect.poll(() => box('auto').fh).toBe(2 * 20 + 12);
  });

  test('autoResize: in CSS (field-sizing: content, no height set inline) where the browser has it, measured in script elsewhere; the page doesn\'t scroll as it grows', async () => {
    await setup();
    const f = el('auto'), css = CSS.supports('field-sizing', 'content');
    await userEvent.click(f);
    const y = scrollY;
    await userEvent.keyboard('1{Enter}2{Enter}3');
    await expect.poll(() => box('auto').fh).toBe(3 * 20 + 12);
    expect([getComputedStyle(f).getPropertyValue('field-sizing') === 'content', f.style.height !== '', scrollY]).toEqual([css, !css, y]);
  });

  test('autoResize: fits wrapped text, and refits when the width changes, raising no ResizeObserver loop error', async () => {
    const errors: string[] = [], onError = (e: ErrorEvent) => { errors.push(e.message); };
    addEventListener('error', onError);
    await setup();
    const w1 = box('wrap').fh;
    expect(w1).toBeGreaterThan(20 + 12);
    document.getElementById('narrow')!.style.width = '160px';
    await expect.poll(() => box('wrap').fh).toBeGreaterThan(w1);
    await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    removeEventListener('error', onError);
    expect(errors).toEqual([]);
  });

  test('showCount: written in the digits of the locale, as Calendar writes its days: ١٢ / ٢٠٠ in ar-EG, ۳ in fa', async () => {
    await render(<>
      <SerupaProvider locale="ar-EG"><Textarea id="car" showCount maxLength={200} defaultValue="Twelve chars" /></SerupaProvider>
      <SerupaProvider locale="fa"><Textarea id="cfa" showCount defaultValue="abc" /></SerupaProvider>
    </>);
    expect([count('car').textContent, count('cfa').textContent]).toEqual(['١٢ / ٢٠٠', '۳']);
  });

  test('showCount: "2 / 5" under the text, linked by aria-describedby after the field\'s own; counts typing, stops at maxLength and turns text-colored', async () => {
    await setup();
    const c0 = count('cnt'), col0 = css(c0).color;
    expect([c0.textContent, el('cnt').getAttribute('aria-describedby'), c0.classList.contains('dk-textarea__count--full')]).toEqual(['2 / 5', 'hint ' + c0.id, false]);
    await userEvent.click(el('cnt'));
    await userEvent.keyboard('{End}cdefg');
    expect([count('cnt').textContent, count('cnt').classList.contains('dk-textarea__count--full')]).toEqual(['5 / 5', true]);
    expect(css(count('cnt')).color).not.toBe(col0);
  });

  test('showCount and maxLength count the characters people see: an emoji family and a flag are one each (R32)', async () => {
    const seen: string[] = [];
    await render(<>
      <Textarea id="emo" showCount maxLength={4} defaultValue="👨‍👩‍👧🇮🇩" aria-label="Emoji" />
      <Ctrl onValue={(v) => seen.push(v)} />
    </>);
    expect([count('emo').textContent, el('emo').hasAttribute('maxlength')]).toEqual(['2 / 4', false]);
    await userEvent.click(el('emo'));
    await userEvent.keyboard('{End}abc');
    // Typing stops at the limit the count shows (the browser's maxlength would have stopped at 12 code units).
    expect([el('emo').value, count('emo').textContent]).toEqual(['👨‍👩‍👧🇮🇩ab', '4 / 4']);
    // Controlled: a paste in the middle is cut to fit, the text after it stays, and onChange gets the cut value.
    const c = el('emoc');
    // What a paste of three flags between x and y does to the field: the new value, then an input event.
    React.act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(c, 'x🇮🇩🇮🇩🇮🇩y');
      c.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect([c.value, seen.at(-1), count('emoc').textContent, c.selectionStart]).toEqual(['x🇮🇩🇮🇩y', 'x🇮🇩🇮🇩y', '4 / 4', 9]);
  });

  test('maxLength with an input method: the text is cut once the composition is confirmed, not while it\'s being typed', async () => {
    const seen: string[] = [];
    await render(<Textarea id="ime" showCount maxLength={3} defaultValue="あ" onChange={(e) => seen.push(e.target.value)} aria-label="IME" />);
    const t = el('ime'), set = (v: string) => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(t, v); t.dispatchEvent(new Event('input', { bubbles: true })); };
    t.focus();
    React.act(() => {
      t.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      set('あかんじ');
      set('あ漢字です');
    });
    // Mid-composition the half-typed text is left alone.
    expect(t.value).toBe('あ漢字です');
    React.act(() => { t.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '漢字です' })); });
    expect([t.value, seen.at(-1), count('ime').textContent]).toEqual(['あ漢字', 'あ漢字', '3 / 3']);
  });

  test('showCount without maxLength: the plain count, following a controlled value', async () => {
    await setup();
    expect(count('cnt2').textContent).toBe('3');
    React.act(() => setCtrl('a longer value'));
    expect(count('cnt2').textContent).toBe('14');
  });

  test('invalid: aria-invalid, a danger border and a danger focus ring', async () => {
    await setup();
    const d = color('var(--danger)');
    expect(el('inv').getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => box('inv').bc).toBe(d);
    el('inv').focus();
    await expect.poll(() => box('inv').bs).toContain(d);
  });

  test('read-only: surface-muted background, no handle; disabled: native disabled, 50%, not-allowed, no handle', async () => {
    await setup();
    const ro = box('ro'), dis = box('dis');
    expect(ro.bg).not.toBe(box('md').bg);
    expect([ro.resize, el('ro').readOnly, el('dis').disabled, dis.op, dis.resize, css(el('dis')).cursor]).toEqual(['none', true, true, '0.5', 'none', 'not-allowed']);
    expect(ro.wrap).toMatch(/readonly/);
    expect(dis.wrap).toMatch(/disabled/);
  });

  test('contrast in all six themes: text, placeholder and count 4.5:1 on the field; border, focus ring and invalid border 3:1', () => {
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const pairs: Array<[string, string, string, number]> = [['text', 'var(--text)', 'var(--field)', 4.5], ['placeholder', 'var(--placeholder)', 'var(--field)', 4.5], ['count', 'var(--text-muted)', 'var(--field)', 4.5], ['border', 'var(--field-border)', 'var(--field)', 3], ['border on page', 'var(--field-border)', 'var(--surface)', 3], ['focus', 'var(--focus-ring)', 'var(--surface)', 3], ['invalid', 'var(--danger)', 'var(--field)', 3]];
      for (const [n, fg, bg, need] of pairs) { const r = contrast(fg, bg); if (r < need) low.push(`${th} ${n} ${r.toFixed(2)}`); }
    }
    expect(low).toEqual([]);
  });

  test('no console errors', async () => {
    const error = vi.spyOn(console, 'error');
    await setup();
    await userEvent.click(el('md'));
    await userEvent.keyboard('x');
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('a form reset puts the count back to the default (P2)', async () => {
    await render(<form id="tf"><Textarea id="trs" showCount maxLength={10} defaultValue="ab" aria-label="Reset" /></form>);
    await userEvent.type(el('trs'), 'cdef');
    expect(count('trs').textContent).toBe('6 / 10');
    (document.getElementById('tf') as HTMLFormElement).reset();
    await expect.poll(() => [el('trs').value, count('trs').textContent]).toEqual(['ab', '2 / 10']);
  });
});
