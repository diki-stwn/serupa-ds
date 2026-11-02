import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { colorName, contrastRatio, normalizeHex } from '../../internal/color';
import { Field } from '../Field/Field';
import { ColorPicker } from './ColorPicker';

const SW = [{ value: '#1D4ED8', label: 'Blue' }, { value: '#fde047', label: 'Yellow' }, '#fff', { value: '#18181b', label: 'Black' }];
const group = () => document.querySelector('[role="radiogroup"]') as HTMLElement;
const radios = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const swatch = (name: string) => radios().find((r) => r.getAttribute('aria-label') === name)!;
const el = (id: string) => document.getElementById(id) as HTMLElement;
const hex = () => document.querySelector('[data-component=color-picker] [data-component=input] input') as HTMLInputElement;
const line = () => document.querySelector('[data-component=color-picker] div[aria-live]') as HTMLElement;

function Controlled({ calls }: { calls: string[] }) {
  const [v, setV] = React.useState<string | null>('#1d4ed8');
  return <ColorPicker aria-label="Label color" swatches={SW} value={v} onValueChange={(x) => { calls.push(x); setV(x); }} contrastWith="#ffffff" />;
}

const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

describe('ColorPicker', () => {
  test('with Alt, Ctrl or ⌘ the arrow keys are left to the browser (Alt+← goes back a page) (L8E28)', async () => {
    await render(<ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" />);
    const t = document.querySelector('[role=radio]') as HTMLElement;
    t.focus();
    const before = t.getAttribute('aria-checked');
    expect([modified(t), modified(t, 'ArrowLeft'), document.activeElement === t, t.getAttribute('aria-checked') === before]).toEqual([[false, false, false], [false, false, false], true, true]);
  });

  test('switching to another window or tab mid-typing a hex keeps the text (L8E27)', async () => {
    const commits: string[] = [];
    await render(<ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" onValueCommit={(v) => commits.push(v)} />);
    await userEvent.click(hex());
    await userEvent.clear(hex());
    await userEvent.keyboard('fde0');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    hex().dispatchEvent(new FocusEvent('focusout', { bubbles: true })); hex().dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([hex().value, commits]).toEqual(['fde0', []]);
  });

  test('in a required Field with a hint: the control id once, the radiogroup named by the label, described by the hint and required; the hex field stays its own field', async () => {
    await render(<Field label="Accent" hint="Used for links" required><ColorPicker swatches={SW} /></Field>);
    const g = group(), label = document.querySelector('[data-component=field] label') as HTMLLabelElement, hint = document.querySelector('[data-component=field] > div[id]') as HTMLElement;
    expect([document.querySelectorAll('#' + CSS.escape(label.htmlFor)).length, g.getAttribute('aria-labelledby') === label.id]).toEqual([1, true]);
    expect([g.getAttribute('aria-describedby')?.split(' ').includes(hint.id), g.getAttribute('aria-required')]).toEqual([true, 'true']);
    expect([hex().id === label.htmlFor, hex().getAttribute('aria-describedby'), hex().getAttribute('aria-label')]).toEqual([false, null, 'Hex code']);
  });

  test('QA2: the hex field isn\'t autocorrected or capitalised by a phone keyboard ("fade00" stays), nor spellchecked', async () => {
    await render(<ColorPicker swatches={SW} />);
    expect(['spellcheck', 'autocorrect', 'autocapitalize'].map((n) => hex().getAttribute(n))).toEqual(['false', 'off', 'off']);
  });

  test('required: a form with no color picked isn\'t valid; submitting marks the swatches invalid and focuses them; picking one clears it', async () => {
    let sent = 0;
    await render(<form id="cpf" onSubmit={(e) => { e.preventDefault(); sent++; }}><ColorPicker aria-label="Accent" swatches={SW} name="accent" required /><button id="cps">Save</button></form>);
    const f = el('cpf') as HTMLFormElement;
    expect([f.checkValidity(), group().getAttribute('aria-required')]).toEqual([false, 'true']);
    await userEvent.click(el('cps'));
    await expect.poll(() => group().getAttribute('aria-invalid')).toBe('true');
    expect([sent, document.activeElement === radios()[0]]).toEqual([0, true]);
    await userEvent.click(swatch('Yellow'));
    expect([group().getAttribute('aria-invalid'), f.checkValidity()]).toEqual([null, true]);
  });

  test('invalid marks the swatches invalid; in a Field with an error, the radiogroup points to it', async () => {
    await render(<Field label="Accent" error="Pick a brand color"><ColorPicker swatches={SW} /></Field>);
    const err = document.querySelector('[data-component=field] [data-icon] + span[id]') as HTMLElement;
    expect([group().getAttribute('aria-invalid'), group().getAttribute('aria-errormessage') === err.id]).toEqual(['true', true]);
  });

  test('invalid shows on the swatches: their border takes the danger color, 3:1 on the page in all six themes', async () => {
    await render(<><div id="ok"><ColorPicker aria-label="Fine" swatches={SW} /></div><div id="bad"><ColorPicker aria-label="Wrong" swatches={SW} invalid /></div></>);
    const ring = (id: string) => css(document.querySelector(`#${id} [role="radio"]`)).boxShadow.match(/^(\w+\([^)]*\)|#\w+|\w+)/)![1];
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const r = contrast(ring('bad'), css(document.body).backgroundColor);
      if (ring('bad') === ring('ok') || r < 3) low.push(`${th}: ${ring('bad')} ${r.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('a radiogroup of swatches named by their labels (a bare hex by a name from its color, with its code as the tooltip), the picked one checked with a check icon; one Tab stop', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<ColorPicker ref={ref} id="cp" className="extra" aria-label="Label color" swatches={SW} defaultValue="#1d4ed8" />);
    expect([group().getAttribute('aria-label'), radios().map((r) => r.getAttribute('aria-label')), radios().map((r) => r.getAttribute('aria-checked')), radios().map((r) => r.tabIndex)])
      .toEqual(['Label color', ['Blue', 'Yellow', 'White', 'Black'], ['true', 'false', 'false', 'false'], [0, -1, -1, -1]]);
    expect([ref.current === document.getElementById('cp'), ref.current!.className, ref.current!.dataset.component, !!swatch('Blue').querySelector('[data-icon]'), css(swatch('Blue')).backgroundColor])
      .toEqual([true, 'dk-color-picker dk-color-picker--size-md extra', 'color-picker', true, 'rgb(29, 78, 216)']);
  });

  test('keyboard table: ArrowUp picks the previous swatch, as ArrowLeft does, and wraps (FH1)', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    swatch('Blue').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowUp}{ArrowUp}');
    expect([calls, document.activeElement === swatch('Black')]).toEqual([['#fde047', '#1d4ed8', '#18181b'], true]);
  });

  test('arrow keys, Home and End move and pick, wrapping; a click picks; onValueChange gets lowercase #rrggbb', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    swatch('Blue').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([document.activeElement === swatch('Yellow'), swatch('Yellow').getAttribute('aria-checked'), calls]).toEqual([true, 'true', ['#fde047']]);
    await userEvent.keyboard('{End}{ArrowDown}{Home}{ArrowLeft}');
    expect([calls, document.activeElement === swatch('Black')]).toEqual([['#fde047', '#18181b', '#1d4ed8', '#18181b'], true]);
    await userEvent.click(swatch('White'));
    expect(calls.at(-1)).toBe('#ffffff');
  });

  test('the hex field: six digits pick the color as people type, three on blur or Enter; a bad code goes back on blur and is marked invalid while typed', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    expect(hex().value).toBe('1d4ed8');
    await userEvent.fill(hex(), '#7C3AED');
    expect([calls, radios().every((r) => r.getAttribute('aria-checked') === 'false')]).toEqual([['#7c3aed'], true]);
    await userEvent.fill(hex(), 'f0a');
    expect(calls).toEqual(['#7c3aed']);
    await userEvent.keyboard('{Enter}');
    expect([calls.at(-1), hex().value]).toEqual(['#ff00aa', 'ff00aa']);
    await userEvent.fill(hex(), 'zz');
    expect(hex().getAttribute('aria-invalid')).toBe('true');
    hex().blur();
    await expect.poll(() => hex().value).toBe('ff00aa');
    expect(hex().hasAttribute('aria-invalid')).toBe(false);
  });

  test('the hex field (EY1): a code on its way to six digits isn\'t marked invalid until Enter, one that can\'t be a color is at once; a pasted code with spaces round it picks', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    for (const t of ['1', '1d', '1d4e', '1d4ed']) {
      await userEvent.fill(hex(), t);
      expect([t, hex().hasAttribute('aria-invalid')]).toEqual([t, false]);
    }
    await userEvent.keyboard('{Enter}');
    expect(hex().getAttribute('aria-invalid')).toBe('true');
    await userEvent.keyboard('{Backspace}');   // typing again clears it until the next Enter
    expect(hex().hasAttribute('aria-invalid')).toBe(false);
    await userEvent.fill(hex(), '1g');
    expect(hex().getAttribute('aria-invalid')).toBe('true');
    await userEvent.fill(hex(), '');
    const data = new DataTransfer();
    data.setData('text/plain', ' #7C3AED\n');
    // Firefox gives a ClipboardEvent made in script an empty copy of the clipboardData passed in, so the paste carries it as its own.
    const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: data });
    hex().dispatchEvent(ev);
    await expect.poll(() => calls.at(-1)).toBe('#7c3aed');
    expect([hex().value, hex().hasAttribute('aria-invalid')]).toEqual(['7C3AED', false]);
  });

  test('the browser\'s well (EY1): empty with nothing picked, and black chosen there is picked when it closes, though the well already held #000000', async () => {
    const changes: string[] = [], commits: string[] = [];
    await render(<ColorPicker aria-label="C" swatches={SW} onValueChange={(v) => changes.push(v)} onValueCommit={(v) => commits.push(v)} />);
    const native = document.querySelector('input[type="color"]') as HTMLInputElement;
    expect([native.value, native.hasAttribute('data-empty')]).toEqual(['#000000', true]);
    native.focus();
    native.dispatchEvent(new Event('input', { bubbles: true }));   // a drag that ends on black: input, and no change
    native.blur();
    await expect.poll(() => commits).toEqual(['#000000']);
    expect([changes, native.hasAttribute('data-empty')]).toEqual([['#000000'], false]);
  });

  test('the browser\'s color input picks too, and is named', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    const native = document.querySelector('input[type="color"]') as HTMLInputElement;
    expect([native.getAttribute('aria-label'), native.value]).toEqual(['Custom color', '#1d4ed8']);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(native, '#00ff00');   // past React's value tracking
    native.dispatchEvent(new Event('input', { bubbles: true }));
    await expect.poll(() => calls.at(-1)).toBe('#00ff00');
  });

  test('onValueCommit: once per choice: a swatch at once; the browser picker only when it closes (change), not on each drag step; the hex field on blur or Enter, not while typing', async () => {
    const changes: string[] = [], commits: string[] = [];
    await render(<ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" onValueChange={(v) => changes.push(v)} onValueCommit={(v) => commits.push(v)} />);
    await userEvent.click(swatch('Yellow'));
    expect([changes, commits]).toEqual([['#fde047'], ['#fde047']]);
    const native = document.querySelector('input[type="color"]') as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    for (const v of ['#110000', '#220000', '#330000']) { set.call(native, v); native.dispatchEvent(new Event('input', { bubbles: true })); }
    await expect.poll(() => changes.at(-1)).toBe('#330000');
    expect(commits).toEqual(['#fde047']);
    native.dispatchEvent(new Event('change', { bubbles: true }));
    expect(commits).toEqual(['#fde047', '#330000']);
    await userEvent.fill(hex(), '7c3aed');
    expect([changes.at(-1), commits.at(-1)]).toEqual(['#7c3aed', '#330000']);
    await userEvent.keyboard('{Enter}');
    hex().blur();
    expect(commits).toEqual(['#fde047', '#330000', '#7c3aed']);
  });

  test('form reset puts the first color back (uncontrolled), in the swatches, the hex field and the submitted value', async () => {
    await render(<form id="rf"><ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" name="color" /></form>);
    await userEvent.click(swatch('Black'));
    expect(new FormData(el('rf') as HTMLFormElement).get('color')).toBe('#18181b');
    (el('rf') as HTMLFormElement).reset();
    await expect.poll(() => swatch('Blue').getAttribute('aria-checked')).toBe('true');
    await expect.poll(() => hex().value).toBe('1d4ed8');
    expect(new FormData(el('rf') as HTMLFormElement).get('color')).toBe('#1d4ed8');
  });

  test('controlled, a parent that turns down a typed color: on blur the hex field shows the color it kept, not the rejected text (AF2)', async () => {
    const seen: string[] = [];
    await render(<><ColorPicker aria-label="C" swatches={SW} value="#1d4ed8" custom onValueChange={(x) => { seen.push(x); }} /><button>After</button></>);   // Tab stays on the page: Firefox fires no blur when it leaves
    await userEvent.clear(hex());
    await userEvent.type(hex(), '00ff00');
    await userEvent.tab();
    expect(seen).toContain('#00ff00');
    await expect.poll(() => hex().value).toBe('1d4ed8');
    expect(swatch('Blue').getAttribute('aria-checked')).toBe('true');
  });

  test('form: outside its form, the color still submits with it and its reset puts the first color back', async () => {
    await render(<><form id="ff" /><ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" name="color" form="ff" /></>);
    const f = el('ff') as HTMLFormElement;
    await userEvent.click(swatch('Black'));
    expect(new FormData(f).get('color')).toBe('#18181b');
    f.reset();
    await expect.poll(() => swatch('Blue').getAttribute('aria-checked')).toBe('true');
    expect(new FormData(f).get('color')).toBe('#1d4ed8');
  });

  test('form without name: outside its form, that form\'s reset still puts the first color back', async () => {
    await render(<><form id="fn" /><ColorPicker aria-label="C" swatches={SW} defaultValue="#1d4ed8" form="fn" required /></>);
    await userEvent.click(swatch('Black'));
    (el('fn') as HTMLFormElement).reset();
    await expect.poll(() => swatch('Blue').getAttribute('aria-checked')).toBe('true');
    await expect.poll(() => hex().value).toBe('1d4ed8');
  });

  test('contrastWith: the WCAG ratio, rounded down, in a polite live region; below minContrast it warns', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    expect([line().getAttribute('aria-live'), line().textContent, line().querySelector('[data-icon]')]).toEqual(['polite', 'Contrast 6.7:1', null]);
    await userEvent.click(swatch('Yellow'));
    expect([line().textContent, line().classList.contains('dk-color-picker__contrast--low'), !!line().querySelector('[data-icon]')])
      .toEqual(['Contrast 1.3:1, below 4.5:1, which can be hard to read', true, true]);
  });

  test('minContrast 3; Indonesian words and the locale\'s decimal mark', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><ColorPicker aria-label="Warna" swatches={SW} defaultValue="#767676" contrastWith="#ffffff" minContrast={3} /></SerupaProvider>);
    expect(line().textContent).toBe('Kontras 4,5:1');
    await userEvent.click(swatch('Yellow'));
    expect(line().textContent).toBe('Kontras 1,3:1, di bawah 3,0:1, bisa sulit dibaca');
  });

  test('contrastWith: before anything is picked, each swatch describes its ratio, and one under minContrast says so and is struck through; a bare hex swatch has its code as the tooltip', async () => {
    await render(<SerupaProvider locale="en-US"><ColorPicker aria-label="C" swatches={SW} contrastWith="#ffffff" /></SerupaProvider>);
    const desc = (r: HTMLElement) => document.getElementById(r.getAttribute('aria-describedby')!)?.textContent;
    expect(radios().map(desc)).toEqual(['Contrast 6.7:1', 'Contrast 1.3:1, below 4.5:1, which can be hard to read', 'Contrast 1.0:1, below 4.5:1, which can be hard to read', 'Contrast 17.7:1']);
    expect(radios().map((r) => r.hasAttribute('data-low-contrast'))).toEqual([false, true, true, false]);
    expect(radios().map((r) => getComputedStyle(r, '::after').content)).toEqual(['none', '""', '""', 'none']);
    expect([swatch('White').title, swatch('Blue').title, swatch('White').querySelector('[hidden]') != null]).toEqual(['#ffffff', 'Blue', true]);
    await expect.element(page.getByRole('radio', { name: 'Yellow' })).toHaveAccessibleDescription('Contrast 1.3:1, below 4.5:1, which can be hard to read');
    await userEvent.click(swatch('Yellow'));
    expect(getComputedStyle(swatch('Yellow'), '::after').content).toBe('none');
  });

  test('colorName: rough names from hue, saturation and lightness, in English and Indonesian through the provider', async () => {
    const cases: Array<[string, string, string]> = [
      ['#000000', 'Black', 'Hitam'], ['#ffffff', 'White', 'Putih'], ['#808080', 'Gray', 'Abu-abu'], ['#e4e4e7', 'Light gray', 'Abu-abu muda'],
      ['#ef4444', 'Red', 'Merah'], ['#7f1d1d', 'Dark red', 'Merah tua'], ['#f97316', 'Orange', 'Oranye'], ['#78350f', 'Brown', 'Cokelat'],
      ['#facc15', 'Yellow', 'Kuning'], ['#22c55e', 'Green', 'Hijau'], ['#14b8a6', 'Teal', 'Hijau toska'], ['#1d4ed8', 'Blue', 'Biru'],
      ['#1e3a8a', 'Dark blue', 'Biru tua'], ['#bfdbfe', 'Light blue', 'Biru muda'], ['#7c3aed', 'Purple', 'Ungu'], ['#ec4899', 'Pink', 'Merah muda'],
    ];
    await render(<><ColorPicker aria-label="en" swatches={cases.map((c) => c[0])} custom={false} />
      <SerupaProvider labels={idLabels}><ColorPicker aria-label="id" swatches={cases.map((c) => c[0])} custom={false} /></SerupaProvider></>);
    const names = (g: string) => [...document.querySelectorAll(`[role=radiogroup][aria-label="${g}"] [role=radio]`)].map((r) => r.getAttribute('aria-label'));
    expect([names('en'), names('id')]).toEqual([cases.map((c) => c[1]), cases.map((c) => c[2])]);
    expect([colorName('nope'), colorName('#1d4ed8')]).toEqual([null, { hue: 'blue', tone: '' }]);
  });

  test('in a Field: named by its label, and focusing the picker (a label click) focuses the picked swatch', async () => {
    await render(<Field label="Brand color"><ColorPicker swatches={SW} defaultValue="#fde047" /></Field>);
    const lbl = document.querySelector('label')!;
    expect(group().getAttribute('aria-labelledby')).toBe(lbl.id);
    (document.querySelector('[data-component=color-picker]') as HTMLElement).focus();
    expect(document.activeElement === swatch('Yellow')).toBe(true);
  });

  test('disabled, custom={false}, size sm and name: no field, disabled swatches, a hidden input with the value', async () => {
    await render(<form id="f"><ColorPicker aria-label="C" swatches={SW} defaultValue="#18181b" custom={false} size="sm" name="color" disabled /></form>);
    expect([hex(), radios().every((r) => r.disabled), Math.round(radios()[0].getBoundingClientRect().width), (document.querySelector('input[type="hidden"]') as HTMLInputElement).value])
      .toEqual([null, true, 24, '#18181b']);
  });

  test('the check is white or black, whichever stands out on the swatch (3:1 or more); the ring keeps 3:1 and the contrast line 4.5:1 on the page in all six themes', async () => {
    await render(<div style={{ background: 'var(--surface)', padding: '8px' }}><ColorPicker aria-label="C" swatches={SW} defaultValue="#fde047" contrastWith="#ffffff" /></div>);
    const low: string[] = [];
    for (const v of ['#1D4ED8', '#fde047', '#fff', '#18181b']) {
      await userEvent.click(radios()[SW.findIndex((s) => (typeof s === 'string' ? s : s.value) === v)]);
      const b = radios().find((r) => r.getAttribute('aria-checked') === 'true')!;
      const r = contrast(css(b.querySelector('[data-icon]')).color, css(b).backgroundColor);
      if (r < 3) low.push(`${v} check ${r.toFixed(2)}`);
    }
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
      const b = radios().find((r) => r.getAttribute('aria-checked') === 'true')!;
      const r = contrast(css(b).outlineColor, css(b.closest('div[style]')).backgroundColor);
      if (r < 3) low.push(`${th} ring ${r.toFixed(2)}`);
      const w = contrast(css(line()).color, css(b.closest('div[style]')).backgroundColor);
      if (w < 4.5) low.push(`${th} ${line().className} ${w.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  // DT1: the edge was --border, 1.27:1 on the page, so a white swatch on a white page (a black one on a dark page) had no edge.
  test('every swatch and the native well have an edge that keeps 3:1 on the page in all six themes, so white and black swatches show', async () => {
    await render(<div style={{ background: 'var(--surface)', padding: '8px' }}><ColorPicker aria-label="C" swatches={['#ffffff', '#000000']} /></div>);
    const page = () => css(radios()[0].closest('div[style]')).backgroundColor;
    const native = document.querySelector('input[type="color"]') as HTMLElement;
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const b of radios()) {
        const edge = /rgba?\([^)]*\)/.exec(css(b).boxShadow)![0], r = contrast(edge, page());
        if (r < 3) low.push(`${th} ${b.getAttribute('aria-label')} ${r.toFixed(2)}`);
      }
      const n = contrast(css(native).borderTopColor, page());
      if (n < 3) low.push(`${th} native well ${n.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('normalizeHex and contrastRatio', () => {
    expect([normalizeHex('#ABC'), normalizeHex('abcdef'), normalizeHex(' #1D4ED8 '), normalizeHex('#abcd'), normalizeHex('red'), contrastRatio('#000', '#fff'), contrastRatio('#777', '#777'), contrastRatio('x', '#fff')])
      .toEqual(['#aabbcc', '#abcdef', '#1d4ed8', null, null, 21, 1, null]);
  });
  test('L8E11: an opaque color with its alpha ("#1D4ED8FF", "#14df") or as devtools copy it ("rgb(29, 78, 216)") reads; a see-through one doesn\'t', () => {
    expect(['#1D4ED8FF', '14df', 'rgb(29, 78, 216)', 'rgb(29 78 216 / 100%)', 'rgba(29,78,216,1)'].map(normalizeHex)).toEqual(['#1d4ed8', '#1144dd', '#1d4ed8', '#1d4ed8', '#1d4ed8']);
    expect(['#1d4ed880', '#14d8', 'rgba(29, 78, 216, 0.5)', 'rgb(300, 0, 0)', '#1d4ed8f'].map(normalizeHex)).toEqual([null, null, null, null, null]);
  });
  test('L8E11: rgb() pasted into the hex field, as devtools copy a color, picks it', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    await userEvent.click(hex());
    const dt = new DataTransfer(); dt.setData('text', 'rgb(124, 58, 237)');
    // Firefox empties the clipboardData passed to a ClipboardEvent made in script (as in EY1 above), so the paste carries it as its own.
    const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', { value: dt });
    hex().dispatchEvent(ev);
    await expect.poll(() => [calls.at(-1), hex().value]).toEqual(['#7c3aed', '7c3aed']);
  });
  test('L8E11: a value with its alpha, as a token file writes it, shows as picked', async () => {
    await render(<ColorPicker aria-label="Brand" swatches={SW} defaultValue="#FDE047FF" />);
    expect(swatch('Yellow').getAttribute('aria-checked')).toBe('true');
  });
  test('a hex code typed in full width by a Japanese or Chinese IME reads as the same color (L8E2)', () => {
    expect([normalizeHex('＃１Ｄ４ＥＤ８'), normalizeHex('ａｂｃ'), normalizeHex('＃ＧＧＧ')]).toEqual(['#1d4ed8', '#aabbcc', null]);
  });
  test('L8E5: the Enter that confirms an input method\'s text doesn\'t pick a code that\'s still being typed', async () => {
    const calls: string[] = [];
    await render(<SerupaProvider locale="en-US"><Controlled calls={calls} /></SerupaProvider>);
    await userEvent.fill(hex(), 'f0a');
    hex().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true }));
    expect([calls, hex().value]).toEqual([[], 'f0a']);
    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual(['#ff00aa']);
  });
  test('autoFocus focuses the checked swatch, not the wrapper', async () => {
    await render(<ColorPicker aria-label="C" swatches={SW} defaultValue="#fde047" autoFocus />);
    await expect.poll(() => document.activeElement).toBe(swatch('Yellow'));
    expect(group().closest('[data-component=color-picker]')!.hasAttribute('autofocus')).toBe(false);
  });

  test('L8E86 in a Field, a level down (a row with a note after it): the label, hint, error, required and disabled still reach it', async () => {
    await render(<Field label="Accent" hint="Used for links" error="Pick one" required disabled><div><ColorPicker swatches={SW} /><span>Brand</span></div></Field>);
    const g = group(), text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    expect([text(g.getAttribute('aria-labelledby')), text(g.getAttribute('aria-describedby')), g.getAttribute('aria-invalid'), g.getAttribute('aria-required'), g.getAttribute('aria-disabled')])
      .toEqual(['Accent*', 'Used for links / Pick one', 'true', 'true', 'true']);   // the * is aria-hidden
    expect([radios().every((r) => r.disabled), hex().disabled]).toEqual([true, true]);
  });
});
