import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, settle, withMotion, settled } from '../../../tools/test/vitest/helpers';
import { Combobox, type ComboboxOption } from './Combobox';
import { Field } from '../Field/Field';
import { DEFAULT_LABELS, idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';
const modded = (t: Element, key: string) => ['ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

const COUNTRIES: ComboboxOption[] = ['Argentina', 'Brazil', 'Canada', { value: 'ci', label: 'Côte d’Ivoire', description: 'Africa' }, { value: 'dk', label: 'Denmark', disabled: true }, 'Egypt', 'France'];
const el = (id: string) => document.getElementById(id) as HTMLInputElement;
// The parts found by role and state: the listbox's popup, the chevron (the button with aria-expanded), the × (the other
// button), the option aria-activedescendant points at, and the popup's status line.
const popOf = (id: string) => el(id).parentElement!.querySelector('[role=listbox]')!.parentElement as HTMLElement;
const toggleOf = (id: string) => el(id).parentElement!.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
const clearOf = (id: string) => el(id).parentElement!.querySelector<HTMLButtonElement>('button:not([aria-expanded])');
const activeOf = (id: string) => document.getElementById(el(id).getAttribute('aria-activedescendant')!)!;
// The popup's message rows: Loading (role=status), "No results" and "Couldn't load" (plain text: the announcer says them, GR53).
const messagesOf = (pop: Element) => [...pop.children].filter((c) => c.getAttribute('role') !== 'listbox');
const statusOf = (id: string) => messagesOf(popOf(id))[0];
const label = (o: Element) => o.firstElementChild!.firstElementChild!.textContent;
const st = (id: string) => {
  const i = el(id), list = i.closest('[data-component=combobox]')!.querySelector('[role=listbox]')!, pop = list.parentElement!, ad = i.getAttribute('aria-activedescendant');
  return { open: i.getAttribute('aria-expanded'), shown: !pop.hidden && pop.matches(':popover-open'), opts: [...list.querySelectorAll('[role=option]')].map(label), active: ad ? label(document.getElementById(ad)!) : null, text: i.value, focus: document.activeElement === i };
};
const selectAll = () => userEvent.keyboard('{Control>}a{/Control}');

function Countries(props: { cref?: React.Ref<HTMLInputElement> }) {
  return <div style={{ width: '320px' }}>
    <button id="before">Before</button>
    <label htmlFor="cb">Country</label>
    <Combobox id="cb" options={COUNTRIES} placeholder="Pick a country" ref={props.cref} className="extra" />
  </div>;
}
const open = async () => { el('before').focus(); await userEvent.keyboard('{Tab}{ArrowDown}'); };

describe('Combobox', () => {
  test('as the list narrows, the typed text is marked in each option, as it was matched: ignoring case and accents (185)', async () => {
    await render(<>
      <Combobox id="chl" aria-label="City" options={['Łódź', 'Kłodzko', 'Lodi', 'Paris']} />
      <Combobox id="chf" aria-label="City" options={['Łódź', 'Lodi']} filter={(o, t) => o.label.length > t.length} />
    </>);
    const marks = (id: string) => [...el(id).parentElement!.querySelectorAll('[role=option]')].map((o) => [...o.querySelectorAll('mark')].map((m) => m.textContent).join('|'));
    await userEvent.click(el('chl'));
    expect(marks('chl')).toEqual(['', '', '', '']);   // just opened: every option, nothing typed
    await userEvent.keyboard('LOD');
    await expect.poll(() => marks('chl')).toEqual(['Łód', 'łod', 'Lod']);
    expect(st('chl').opts).toEqual(['Łódź', 'Kłodzko', 'Lodi']);   // the label reads the same
    // A filter of the app's own may match on something else: nothing is marked.
    await userEvent.keyboard('{Escape}');
    await userEvent.click(el('chf'));
    await userEvent.keyboard('lo');
    await expect.poll(() => st('chf').opts).toEqual(['Łódź', 'Lodi']);
    expect(marks('chf')).toEqual(['', '']);
  });

  test('with Ctrl or ⌘ the arrows and Page keys are left to the system and the browser: closed, nothing opens; open, nothing moves (L8E35)', async () => {
    await render(<Combobox id="cmk" aria-label="Country" options={COUNTRIES} />);
    const t = document.getElementById('cmk') as HTMLInputElement;
    t.focus();
    const closed = [modded(t, 'ArrowDown'), modded(t, 'ArrowUp'), t.getAttribute('aria-expanded')];
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => t.getAttribute('aria-expanded')).toBe('true');
    const at = t.getAttribute('aria-activedescendant');
    expect([closed, modded(t, 'PageDown'), modded(t, 'ArrowDown'), t.getAttribute('aria-activedescendant') === at]).toEqual([[[false, false], [false, false], 'false'], [false, false], [false, false], true]);
  });

  test('switching to another window or tab mid-typing keeps the typed text and the value; leaving the field then puts the text back (L8E26)', async () => {
    const calls: unknown[] = [];
    await render(<><Combobox id="cwb" aria-label="Country" options={COUNTRIES} defaultValue="Brazil" onValueChange={(v) => calls.push(v)} /><button id="cwbn">Next</button></>);
    await userEvent.click(el('cwb'));
    await userEvent.clear(el('cwb'));
    await userEvent.keyboard('Arg');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    el('cwb').dispatchEvent(new FocusEvent('focusout', { bubbles: true })); el('cwb').dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([el('cwb').value, document.activeElement, calls]).toEqual(['Arg', el('cwb'), []]);
    document.getElementById('cwbn')!.focus();
    await expect.poll(() => el('cwb').value).toBe('Brazil');
  });

  test('required with multiple: the form submits once a tag is picked and not before; it stays aria-required (L8E18)', async () => {
    const screen = await render(<form id="rq"><Combobox aria-label="Fruit" id="rm" multiple required name="fruit" options={['Apple', 'Banana']} defaultValue={['Apple']} /></form>);
    const f = () => document.getElementById('rq') as HTMLFormElement, field = () => document.getElementById('rm') as HTMLInputElement;
    expect([f().checkValidity(), field().getAttribute('aria-required')]).toEqual([true, 'true']);
    await screen.rerender(<form id="rq"><Combobox aria-label="Fruit" id="rm" multiple required name="fruit" options={['Apple', 'Banana']} value={[]} /></form>);
    expect([f().checkValidity(), field().getAttribute('aria-required')]).toEqual([false, 'true']);
  });

  test('a role="combobox" field (aria-autocomplete list, collapsed) controlling a hidden role="listbox"; Input\'s 32px box; a chevron button out of the Tab order; ref and className', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Countries cref={ref} />);
    const i = el('cb'), box = i.parentElement!, list = box.querySelector('[role=listbox]')!, toggle = toggleOf('cb');
    expect([i.getAttribute('role'), i.getAttribute('aria-expanded'), i.getAttribute('aria-autocomplete'), i.getAttribute('aria-haspopup'), i.autocomplete]).toEqual(['combobox', 'false', 'list', 'listbox', 'off']);
    // aria-controls only while the list is open, on the field and the chevron.
    expect([i.getAttribute('aria-controls'), toggle.getAttribute('aria-controls')]).toEqual([null, null]);
    expect([list.getAttribute('role'), list.parentElement!.hidden, i.labels![0].textContent, ref.current === i]).toEqual(['listbox', true, 'Country', true]);
    expect(box.className).toMatch(/dk-input dk-combobox.*extra/);
    expect([box.dataset.component, box.offsetHeight, toggle.getAttribute('aria-label'), toggle.tabIndex]).toEqual(['combobox', 32, 'Show options', -1]);
  });

  // QA4: on a phone the first letter typed was capitalized, so a creatable value or a free-text query kept the capital.
  test('the field has autocapitalize, autocorrect and spellcheck off; autoCapitalize is yours to set (QA4)', async () => {
    await render(<><Combobox id="cap" aria-label="Country" options={COUNTRIES} /><Combobox id="cap2" aria-label="Name" options={COUNTRIES} autoCapitalize="words" /></>);
    expect([el('cap').getAttribute('autocapitalize'), el('cap').getAttribute('autocorrect'), el('cap').spellcheck, el('cap2').getAttribute('autocapitalize')]).toEqual(['off', 'off', false, 'words']);
  });

  test('a press on the box (left icon, side padding, past the chevron) focuses the field with the caret at the end; a disabled box stays put (GG2)', async () => {
    await render(<div style={{ width: '320px' }}>
      <Combobox id="bx" size="lg" leftIcon="search" options={COUNTRIES} defaultValue="Canada" aria-label="Country" />
      <Combobox id="bx-off" size="lg" leftIcon="search" options={COUNTRIES} disabled aria-label="Off" />
      <button id="bx-away">away</button>
    </div>);
    const box = (id: string) => el(id).closest('[data-component=combobox]') as HTMLElement;
    const b = box('bx').getBoundingClientRect(), y = b.height / 2;
    for (const x of [2, 20, b.width - 2]) {
      el('bx-away').focus();
      await userEvent.click(box('bx'), { position: { x, y } });
      expect([x, document.activeElement === el('bx'), el('bx').selectionStart]).toEqual([x, true, 6]);
    }
    el('bx-away').focus();
    await userEvent.click(box('bx-off'), { position: { x: 4, y }, force: true });
    expect(document.activeElement).not.toBe(el('bx-off'));
  });

  test('the chevron and × names come from the labels: Indonesian under an id-ID provider, with the field\'s label', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Field label="Negara"><Combobox id="cb-id" options={COUNTRIES} defaultValue="Brazil" clearable /></Field></SerupaProvider>);
    const names = [...el('cb-id').parentElement!.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual(['Hapus Negara', 'Tampilkan pilihan']);
  });

  test('long lists: closed, 2,000 options keep no option nodes in the page; open, the first 100 show with a "more" line and full counts; typing narrows them', async () => {
    const many = Array.from({ length: 2000 }, (_, i) => 'Option ' + i);
    await render(<div style={{ width: '320px' }}><button id="before">Before</button><Combobox id="cb" aria-label="Many" options={many} /></div>);
    const list = () => el('cb').parentElement!.querySelector('[role=listbox]')!;
    expect(list().querySelectorAll('[role=option]').length).toBe(0);
    await open();
    const rows = () => [...list().querySelectorAll('[role=option]')];
    // The "keep typing" line has no role, so it's found by its words.
    const more = () => Array.from(el('cb').parentElement!.querySelectorAll('div')).find((d) => !d.children.length && /^Keep typing/.test(d.textContent || ''))?.textContent;
    expect([rows().length, st('cb').active, more()]).toEqual([100, 'Option 0', 'Keep typing to narrow 1900 more']);
    expect([rows()[99].getAttribute('aria-posinset'), rows()[99].getAttribute('aria-setsize')]).toEqual(['100', '2000']);
    await userEvent.keyboard('{ArrowDown}');
    expect(st('cb').active).toBe('Option 1');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(st('cb').active).toBe('Option 99');   // the arrows wrap through the rows that are there
    await userEvent.keyboard('1999');
    await expect.poll(() => st('cb').opts).toEqual(['Option 1999']);
    expect([more(), rows()[0].getAttribute('aria-setsize')]).toEqual([undefined, '1']);
    await userEvent.keyboard('{Escape}');
    expect(list().querySelectorAll('[role=option]').length).toBe(0);
  });

  test('long lists: a picked option past the first 100 still shows, highlighted, when the list opens', async () => {
    const many = Array.from({ length: 500 }, (_, i) => 'Option ' + i);
    await render(<div><button id="before">Before</button><Combobox id="cb" aria-label="Many" options={many} defaultValue="Option 400" /></div>);
    await open();
    const rows = [...el('cb').parentElement!.querySelectorAll('[role=option]')];
    expect([rows.length, st('cb').active, rows[100].getAttribute('aria-posinset')]).toEqual([101, 'Option 400', '401']);
  });

  test('ArrowDown opens the list in the top layer with every option, the first highlighted, focus staying in the field', async () => {
    await render(<Countries />);
    await open();
    const s = st('cb');
    expect([s.open, s.shown, s.opts.length, s.active, s.focus]).toEqual(['true', true, 7, 'Argentina', true]);
  });

  test('arrows: down to Côte d’Ivoire, skip the disabled Denmark to Egypt, wrap past France to Argentina, ArrowUp wraps back to France', async () => {
    await render(<Countries />);
    await open();
    const seen: Array<string | null> = [];
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}'); seen.push(st('cb').active);
    await userEvent.keyboard('{ArrowDown}'); seen.push(st('cb').active);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}'); seen.push(st('cb').active);
    await userEvent.keyboard('{ArrowUp}'); seen.push(st('cb').active);
    expect(seen).toEqual(['Côte d’Ivoire', 'Egypt', 'Argentina', 'France']);
  });

  test('Enter picks the highlighted option and closes the list; reopening highlights it, marked aria-selected with a check', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
    const s = st('cb');
    expect([s.text, s.open, s.shown, s.focus]).toEqual(['Egypt', 'false', false, true]);
    await userEvent.keyboard('{ArrowDown}');
    const sel = popOf('cb').querySelector('[aria-selected=true]')!;
    expect([st('cb').active, label(sel), !!sel.querySelector('[data-icon]')]).toEqual(['Egypt', 'Egypt', true]);
  });

  test('typing filters, ignoring case and accents, and highlights the first match; no match shows "No results"; Escape puts back the picked label', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
    await selectAll(); await userEvent.keyboard('cote');
    let s = st('cb');
    expect([s.open, s.opts, s.active]).toEqual(['true', ['Côte d’Ivoire'], 'Côte d’Ivoire']);
    await userEvent.keyboard('xyz');
    const m = statusOf('cb');
    expect([st('cb').opts.length, m.textContent, m.getAttribute('role')]).toEqual([0, 'No results', null]);
    await userEvent.keyboard('{Escape}');
    s = st('cb');
    expect([s.open, s.text]).toEqual(['false', 'Egypt']);
  });

  test('typing ignores letters that don\'t decompose and width too: "lodz" finds Łódź, "strasse" finds Straße, "ｔｏｋｙｏ" finds Tokyo', async () => {
    await render(<div><button id="before">Before</button><Combobox id="cb" aria-label="City" options={['Łódź', 'Straße', 'Ørsted', 'Tokyo', 'Paris']} /></div>);
    await open();
    for (const [typed, found] of [['lodz', 'Łódź'], ['strasse', 'Straße'], ['orsted', 'Ørsted'], ['ｔｏｋｙｏ', 'Tokyo']]) {
      await selectAll(); await userEvent.keyboard(typed);
      expect(st('cb').opts, typed).toEqual([found]);
    }
  });

  test('leaving with half-typed text puts back the picked label; emptying the field and leaving clears the selection', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
    await selectAll(); await userEvent.keyboard('bra');
    el('before').focus();
    await expect.poll(() => el('cb').value).toBe('Egypt');
    el('cb').focus();
    await selectAll(); await userEvent.keyboard('{Backspace}');
    el('before').focus();
    await expect.poll(() => [el('cb').value, !!popOf('cb').querySelector('[aria-selected=true]')]).toEqual(['', false]);
  });

  test('a typed full label picks that option when focus leaves ("brazil" then Tab, "cote d’ivoire" without accents then a click elsewhere); onValueChange gets it; a disabled option\'s label doesn\'t pick it', async () => {
    const calls: Array<string | null> = [];
    await render(<div style={{ width: '320px' }}><button id="before">Before</button>
      <Combobox id="cb" aria-label="Country" options={COUNTRIES} onValueChange={(v) => calls.push(v)} /><button>After</button></div>);   // Tab stays on the page: Firefox fires no blur when it leaves
    el('cb').focus();
    await userEvent.keyboard('brazil{Tab}');
    await expect.poll(() => [el('cb').value, calls]).toEqual(['Brazil', ['Brazil']]);
    el('cb').focus();
    await selectAll(); await userEvent.keyboard('cote d’ivoire');
    await userEvent.click(el('before'));
    await expect.poll(() => [el('cb').value, calls]).toEqual(['Côte d’Ivoire', ['Brazil', 'ci']]);
    el('cb').focus();
    await selectAll(); await userEvent.keyboard('denmark');
    el('before').focus();
    await settle(50);
    expect([el('cb').value, calls]).toEqual(['Côte d’Ivoire', ['Brazil', 'ci']]);
  });

  test('a click on the field opens it (all options); a click on an option picks it and keeps focus in the field', async () => {
    await render(<Countries />);
    await userEvent.click(el('cb'));
    expect([st('cb').open, st('cb').opts.length]).toEqual(['true', 7]);
    await userEvent.click(popOf('cb').querySelectorAll('[role=option]')[1]);
    const s = st('cb');
    expect([s.text, s.open, s.focus]).toEqual(['Brazil', 'false', true]);
  });

  test('the chevron opens and closes the list, focusing the field; a disabled option can\'t be picked', async () => {
    await render(<Countries />);
    const toggle = toggleOf('cb');
    await userEvent.click(toggle);
    expect([st('cb').open, st('cb').focus]).toEqual(['true', true]);
    await userEvent.click(popOf('cb').querySelectorAll('[role=option]')[4], { force: true });
    expect([st('cb').text, st('cb').open]).toEqual(['', 'true']);
    await userEvent.click(toggle);
    expect(st('cb').open).toBe('false');
  });

  test('the list sits 4px under the field, aligned and at least as wide, at most 240px tall', async () => {
    await render(<Countries />);
    await userEvent.click(el('cb'));
    await expect.poll(() => Math.abs(popOf('cb').getBoundingClientRect().top - el('cb').parentElement!.getBoundingClientRect().bottom - 4) <= 1).toBe(true);
    const box = el('cb').parentElement!.getBoundingClientRect(), pop = popOf('cb');
    const r = pop.getBoundingClientRect();
    expect(Math.abs(r.top - box.bottom - 4)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.left - box.left)).toBeLessThanOrEqual(1);
    expect(pop.offsetWidth).toBeGreaterThanOrEqual(el('cb').parentElement!.offsetWidth);
    expect(pop.offsetHeight).toBeLessThanOrEqual(240);
  });

  test('controlled: shows the value\'s label; picking calls onValueChange and the hidden input follows; clearable × clears to null; a new value from outside shows its label', async () => {
    const calls: string[] = [];
    let setValue: (v: string | null) => void = () => {};
    function Controlled() {
      const [v, set] = React.useState<string | null>('Canada'); setValue = set;
      return <Combobox id="ctl" aria-label="Country" options={COUNTRIES} value={v} clearable name="country" onValueChange={(n) => { calls.push(String(n)); set(n); }} />;
    }
    await render(<><button id="before">Before</button><Controlled /></>);
    const hidden = () => document.querySelector<HTMLInputElement>('#ctl ~ input[type=hidden]')!.value;
    const clear = () => clearOf('ctl');
    expect([el('ctl').value, hidden(), clear()!.getAttribute('aria-label')]).toEqual(['Canada', 'Canada', 'Clear Country']);
    await userEvent.click(el('ctl'));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect([calls.join(), el('ctl').value, hidden()]).toEqual(['ci', 'Côte d’Ivoire', 'ci']);
    await userEvent.click(clear()!);
    expect([calls.join(), el('ctl').value, document.activeElement!.id, !!clear()]).toEqual(['ci,null', '', 'ctl', false]);
    el('before').focus();
    React.act(() => setValue('France'));
    expect(el('ctl').value).toBe('France');
  });

  test('filter={false}: the list shows what the app passes (from onInputChange); loading shows a status row with a loader', async () => {
    const typed: string[] = [];
    function Async() {
      const [q, setQ] = React.useState(''), [loading, setLoading] = React.useState(false);
      const opts = ['Ada', 'Grace', 'Linus'].filter((n) => n.toLowerCase().startsWith(q.toLowerCase()));
      return <Combobox id="async" aria-label="Person" options={opts} filter={false} loading={loading} loadingText="Finding people…" onInputChange={(t) => { typed.push(t); setQ(t); setLoading(t === 'zz'); }} />;
    }
    await render(<Async />);
    await userEvent.click(el('async'));
    await userEvent.keyboard('gr');
    expect([st('async').opts, typed.slice(0, 2)]).toEqual([['Grace'], ['g', 'gr']]);
    await selectAll(); await userEvent.keyboard('zz');
    const m = statusOf('async');
    expect([m.textContent, m.getAttribute('role'), !!m.querySelector('[data-component=loader]')]).toEqual(['Finding people…', 'status', true]);
  });

  test('disabled: doesn\'t open, and the chevron is disabled; --combobox-chevron overrides one field', async () => {
    await render(<>
      <Combobox id="dis" aria-label="Dis" options={COUNTRIES} disabled />
      <Combobox id="tok" aria-label="Tok" options={COUNTRIES} style={{ '--combobox-chevron': 'rgb(1, 2, 3)' } as React.CSSProperties} />
    </>);
    await userEvent.click(el('dis'), { force: true });
    expect([st('dis').open, toggleOf('dis').disabled]).toEqual(['false', true]);
    expect(getComputedStyle(toggleOf('tok')).color).toBe('rgb(1, 2, 3)');
  });

  test('PageDown and PageUp move by what the list shows at once (seven 32px rows in 240px), stopping at the ends (BH1)', async () => {
    const many = Array.from({ length: 50 }, (_, n) => 'Option ' + (n + 1));
    await render(<Combobox id="cpg" aria-label="Many" options={many} />);
    el('cpg').focus();
    await userEvent.keyboard('{ArrowDown}');
    const seen: Array<string | null> = [st('cpg').active];
    for (const k of ['{PageDown}', '{PageDown}', '{PageUp}', '{PageUp}', '{PageUp}']) { await userEvent.keyboard(k); seen.push(st('cpg').active); }
    expect(seen).toEqual(['Option 1', 'Option 8', 'Option 15', 'Option 8', 'Option 1', 'Option 1']);
    for (let n = 0; n < 8; n++) await userEvent.keyboard('{PageDown}');
    expect(st('cpg').active).toBe('Option 50');
  });

  test('the list is at most 28rem wide (or the field\'s width, if wider), and a long label wraps (BH2)', async () => {
    const long = 'A very long option label that would otherwise stretch the list right across the window and beyond';
    await render(<div style={{ width: '200px' }}><Combobox id="cwide" aria-label="Wide" options={['Short', long, 'x'.repeat(120)]} /></div>);
    el('cwide').focus();
    await userEvent.keyboard('{ArrowDown}');
    const pop = popOf('cwide');
    await expect.poll(() => pop.matches(':popover-open')).toBe(true);
    const w = pop.getBoundingClientRect().width, opt = pop.querySelectorAll<HTMLElement>('[role=option]');
    expect([w <= 448.5, w >= 200, opt[1].offsetHeight > 32, opt[2].scrollWidth <= opt[2].clientWidth]).toEqual([true, true, true, true]);
  });

  test('an option is named by its label; a text description is its aria-description (N8)', async () => {
    await render(<Countries />);
    await open();
    const ci = [...popOf('cb').querySelectorAll('[role=option]')].find((o) => label(o) === 'Côte d’Ivoire')!;
    expect([ci.getAttribute('aria-description'), ci.firstElementChild!.lastElementChild!.getAttribute('aria-hidden')]).toEqual(['Africa', 'true']);
  });

  test('once typing stops, how many options match is said ("2 results"); Indonesian "2 hasil" (BE1)', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await render(<Countries />);
    el('cb').focus();
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 900));
    expect(said).toEqual([]);   // opening shows every option; nothing is said until something is typed
    await userEvent.keyboard('an');
    await expect.poll(() => said.at(-1), { timeout: 3000 }).toBe('2 results');
    seen.disconnect();
    expect([idLabels.resultsCount(2), DEFAULT_LABELS.resultsCount(1)]).toEqual(['2 hasil', '1 result']);
  });

  // GR53: "No results" sat in a role=status row inserted with its text already in it, which VoiceOver and JAWS don't
  // read, so typing that matched nothing said nothing. The shared announcer says it now, as it says the counts.
  test('typing that matches nothing says "No results" through the announcer, then a match says its count again; the row is plain text, said once (GR53)', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await render(<Countries />);
    el('cb').focus();
    await userEvent.keyboard('{ArrowDown}zzz');
    await expect.poll(() => said.at(-1), { timeout: 3000 }).toBe('No results');
    expect([statusOf('cb').textContent, statusOf('cb').getAttribute('role'), popOf('cb').querySelectorAll('[role=status], [aria-live]').length]).toEqual(['No results', null, 0]);
    await selectAll(); await userEvent.keyboard('an');
    await expect.poll(() => said.at(-1), { timeout: 3000 }).toBe('2 results');
    seen.disconnect();
  });

  test('a load that fails says "Couldn\'t load" through the announcer (GR53)', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await render(<Combobox id="lf" aria-label="Country" debounce={0} loadOptions={() => Promise.reject(new Error('offline'))} />);
    el('lf').focus();
    await userEvent.keyboard('{ArrowDown}ca');
    await expect.poll(() => said.at(-1), { timeout: 3000 }).toBe(DEFAULT_LABELS.loadFailed);
    seen.disconnect();
  });

  test('contrast: labels and descriptions keep 4.5:1, even highlighted, and the chevron 3:1, in all six themes', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const pop = popOf('cb'), act = activeOf('cb'), c = (e: Element) => getComputedStyle(e).color;
      const bg = getComputedStyle(pop).backgroundColor, abg = getComputedStyle(act).backgroundColor, field = getComputedStyle(el('cb').parentElement!).backgroundColor;
      const pairs: Array<[string, string, string, number]> = [['label', c(pop.querySelector('[role=option] > span > span')!), bg, 4.5], ['active label', c(act), abg, 4.5], ['description on active', c(act.firstElementChild!.lastElementChild!), abg, 4.5], ['chevron', c(toggleOf('cb')), field, 3]];
      for (const [k, fg, on, min] of pairs) { const r = contrast(fg, on); if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    still.remove();
    expect(low).toEqual([]);
  });

  test('the highlighted option: highlight background and a 2px primary bar at its start, on the right in rtl', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowDown}');
    const act = () => activeOf('cb');
    const probe = document.createElement('div'); probe.style.background = 'var(--highlight)'; probe.style.color = 'var(--primary)'; document.body.appendChild(probe);
    await expect.poll(() => getComputedStyle(act()).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
    expect(getComputedStyle(act()).boxShadow).toBe(`${getComputedStyle(probe).color} 2px 0px 0px 0px inset`);
    document.documentElement.dir = 'rtl';
    await expect.poll(() => getComputedStyle(act()).boxShadow).toBe(`${getComputedStyle(probe).color} -2px 0px 0px 0px inset`);
    document.documentElement.removeAttribute('dir'); probe.remove();
  });

  test('the × is named after the field: "Clear Country" from a Field label (without its * or "(optional)"), aria-labelledby or aria-label; "Clear" with no label; clearLabel wins', async () => {
    await render(<>
      <Field label="Country" required><Combobox id="f1" options={COUNTRIES} defaultValue="Canada" clearable /></Field>
      <Field label="Region" optional><Combobox id="f2" options={COUNTRIES} defaultValue="Canada" clearable /></Field>
      <span id="by">Ship to</span><Combobox id="f3" aria-labelledby="by" options={COUNTRIES} defaultValue="Canada" clearable />
      <Combobox id="f4" options={COUNTRIES} defaultValue="Canada" clearable />
      <Combobox id="f5" aria-label="Country" options={COUNTRIES} defaultValue="Canada" clearable clearLabel="Remove country" />
    </>);
    const name = (id: string) => clearOf(id)!.getAttribute('aria-label');
    expect(['f1', 'f2', 'f3', 'f4', 'f5'].map(name)).toEqual(['Clear Country', 'Clear Region', 'Clear Ship to', 'Clear', 'Remove country']);
  });
});

describe('Combobox: autocomplete', () => {
  test('off by default; a passed autoComplete ("country-name") reaches the field', async () => {
    await render(<><Combobox id="cbac" aria-label="Topic" options={COUNTRIES} /><Combobox id="cbcn" aria-label="Country" options={COUNTRIES} autoComplete="country-name" /></>);
    const a = document.getElementById('cbac') as HTMLInputElement, b = document.getElementById('cbcn') as HTMLInputElement;
    expect([a.getAttribute('autocomplete'), b.getAttribute('autocomplete')]).toEqual(['off', 'country-name']);
  });
  test('a filter function decides the matches; ArrowUp opens on the last option and Alt+ArrowDown on the picked one; Enter on a typed exact label picks it, and with no match closes and puts the label back', async () => {
    const picked: (string | null)[] = [];
    const starts = (o: { label: string }, t: string) => o.label.toLowerCase().startsWith(t.trim().toLowerCase());
    await render(<div style={{ width: '320px' }}><button id="before">Before</button>
      <Combobox id="cb" aria-label="Country" options={COUNTRIES} filter={starts} defaultValue="Brazil" onValueChange={(v) => { picked.push(v); }} /></div>);
    el('before').focus();
    await userEvent.keyboard('{Tab}{ArrowUp}');
    expect(st('cb').active).toBe('Brazil');
    await userEvent.keyboard('{Escape}');
    await selectAll();
    await userEvent.keyboard('an');
    expect(st('cb').opts).toEqual([]);
    await selectAll();
    await userEvent.keyboard('ca');
    expect(st('cb').opts).toEqual(['Canada']);
    await selectAll();
    await userEvent.keyboard('egypt');
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}');
    await userEvent.keyboard('{Enter}');
    expect([st('cb').text, picked.join()]).toEqual(['Egypt', 'Egypt']);
    await selectAll();
    await userEvent.keyboard('zz{Enter}');
    expect([st('cb').open, st('cb').text]).toEqual(['false', 'Egypt']);
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect([st('cb').open, st('cb').active]).toEqual(['true', 'Egypt']);
  });

  test('form reset brings the default back; invalid marks the field; your onKeyDown can stop its keys; readOnly never opens', async () => {
    await render(<form id="f" style={{ width: '320px' }}>
      <Combobox id="cb" aria-label="Country" name="country" options={COUNTRIES} defaultValue="Canada" invalid />
      <Combobox id="ks" aria-label="Keys" options={COUNTRIES} onKeyDown={(e) => { if (e.key === 'ArrowDown') e.preventDefault(); }} />
      <Combobox id="ro" aria-label="Locked" options={COUNTRIES} readOnly defaultValue="France" />
    </form>);
    expect([el('cb').getAttribute('aria-invalid'), el('cb').parentElement!.className.includes('dk-input--invalid')]).toEqual(['true', true]);
    await userEvent.click(el('cb'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(el('cb').value).not.toBe('Canada');
    (document.getElementById('f') as HTMLFormElement).reset();
    await expect.poll(() => el('cb').value).toBe('Canada');
    el('ks').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(st('ks').open).toBe('false');
    el('ro').focus();
    await userEvent.keyboard('{ArrowDown}x');
    expect([st('ro').open, st('ro').text]).toEqual(['false', 'France']);
  });
});

describe('Combobox multiple (DF1)', () => {
  const box = (id: string) => el(id).closest('[data-component=combobox]') as HTMLElement;
  // Each tag's remove button is named "Remove" and the option's label.
  const tags = (id: string) => [...box(id).querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((l) => l.startsWith('Remove ')).map((l) => l.slice(7));
  const options = (id: string) => [...box(id).querySelectorAll('[role=option]')];
  const picked = (id: string) => options(id).filter((o) => o.getAttribute('aria-selected') === 'true').map(label);

  test('tags before the text; picking toggles an option and keeps the list open; Backspace in the empty field removes the last tag; a hidden input per value; form reset', async () => {
    const calls: string[][] = [];
    await render(<form id="mf" style={{ width: '360px' }}>
      <Combobox id="m" aria-label="Countries" name="country" multiple options={COUNTRIES} defaultValue={['Brazil']} onValueChange={(v) => calls.push(v)} />
    </form>);
    expect(tags('m')).toEqual(['Brazil']);
    el('m').focus();
    await userEvent.keyboard('{ArrowDown}');
    const list = box('m').querySelector('[role=listbox]')!;
    expect([list.getAttribute('aria-multiselectable'), st('m').active, picked('m')]).toEqual(['true', 'Argentina', ['Brazil']]);
    await userEvent.keyboard('{Enter}');
    expect([tags('m'), st('m').open, st('m').active, picked('m')]).toEqual([['Brazil', 'Argentina'], 'true', 'Argentina', ['Argentina', 'Brazil']]);
    await userEvent.keyboard('fr');
    expect(st('m').opts).toEqual(['France']);
    await userEvent.keyboard('{Enter}');
    expect([tags('m'), st('m').text, st('m').opts.length, st('m').active]).toEqual([['Brazil', 'Argentina', 'France'], '', COUNTRIES.length, 'France']);
    await userEvent.keyboard('{Enter}');   // France again: unpicked
    expect(tags('m')).toEqual(['Brazil', 'Argentina']);
    await userEvent.keyboard('{Escape}{Backspace}');
    expect([st('m').open, tags('m')]).toEqual(['false', ['Brazil']]);
    const form = document.getElementById('mf') as HTMLFormElement;
    expect(new FormData(form).getAll('country')).toEqual(['Brazil']);
    await userEvent.click(box('m').querySelector('button[aria-label="Remove Brazil"]')!);
    expect([tags('m'), new FormData(form).getAll('country'), st('m').focus]).toEqual([[], [], true]);
    expect(calls).toEqual([['Brazil', 'Argentina'], ['Brazil', 'Argentina', 'France'], ['Brazil', 'Argentina'], ['Brazil'], []]);
    form.reset();
    await expect.poll(() => tags('m')).toEqual(['Brazil']);
  });

  test('controlled; each pick and removal is read out ("Argentina added", "Argentina removed"; Indonesian "ditambahkan", "dihapus"); × clears every tag; leaving the field empties the search text', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    function Team() {
      const [v, setV] = React.useState<string[]>(['ci']);
      return <div style={{ width: '360px' }}>
        <Combobox id="t" aria-label="Team" multiple clearable value={v} onValueChange={setV} options={COUNTRIES} />
        <button id="after">After</button>
        <output id="tv">{v.join(',')}</output>
      </div>;
    }
    await render(<Team />);
    expect(tags('t')).toEqual(['Côte d’Ivoire']);
    el('t').focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.poll(() => said.at(-1)).toBe('Argentina added');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => said.at(-1)).toBe('Argentina removed');
    await userEvent.keyboard('can{Enter}');
    expect(document.getElementById('tv')!.textContent).toBe('ci,Canada');
    await userEvent.keyboard('xyz{Tab}');
    expect([st('t').text, st('t').open, document.activeElement!.id, tags('t')]).toEqual(['', 'false', 'after', ['Côte d’Ivoire', 'Canada']]);
    await userEvent.click(box('t').querySelector<HTMLButtonElement>('button[aria-label="Clear Team"]')!);
    expect([tags('t'), document.getElementById('tv')!.textContent]).toEqual([[], '']);
    seen.disconnect();
    expect([idLabels.valueAdded('Kanada'), idLabels.valueRemoved('Kanada')]).toEqual(['Kanada ditambahkan', 'Kanada dihapus']);
  });

  test('the box is 32px with no tags and grows a row at a time as tags wrap, with the buttons kept inside it; disabled tags have no remove button', async () => {
    const all = COUNTRIES.map((o) => (typeof o === 'string' ? o : o.value));
    await render(<div style={{ width: '240px' }}>
      <Combobox id="e" aria-label="None" multiple options={COUNTRIES} />
      <Combobox id="g" aria-label="Many" multiple options={COUNTRIES} defaultValue={all} />
      <Combobox id="d" aria-label="Off" multiple disabled options={COUNTRIES} defaultValue={['Egypt']} />
    </div>);
    expect(box('e').offsetHeight).toBe(32);
    const b = box('g').getBoundingClientRect(), toggle = box('g').querySelector('button[aria-expanded]')!.getBoundingClientRect();
    expect(b.height).toBeGreaterThan(60);
    expect(toggle.right <= b.right && toggle.left >= b.left).toBe(true);
    expect(tags('g').length).toBe(all.length);
    expect([box('d').textContent.includes('Egypt'), tags('d')]).toEqual([true, []]);
  });
});

describe('Combobox loadOptions (DG1)', () => {
  // A loadOptions whose answers the test hands back one at a time, in any order.
  function server() {
    const calls: { text: string; signal: AbortSignal; ok: (o: ComboboxOption[]) => void; fail: () => void }[] = [];
    const loadOptions = (text: string, { signal }: { signal: AbortSignal }) => new Promise<ComboboxOption[]>((ok, no) => { calls.push({ text, signal, ok, fail: () => no(new Error('offline')) }); });
    return { calls, loadOptions };
  }
  const box = (id: string) => el(id).closest('[data-component=combobox]') as HTMLElement;
  const status = (id: string) => messagesOf(box(id).querySelector('[popover]')!).map((s) => s.textContent).join(' | ');

  test('each new text aborts the request before it, and a late answer for older text is dropped ("ca" never replaces "can")', async () => {
    const s = server();
    await render(<div style={{ width: '320px' }}><Combobox id="l" aria-label="Country" loadOptions={s.loadOptions} debounce={0} /></div>);
    el('l').focus();
    await userEvent.keyboard('ca');
    await userEvent.keyboard('n');
    expect(s.calls.map((c) => [c.text, c.signal.aborted])).toEqual([['c', true], ['ca', true], ['can', false]]);
    expect(status('l')).toBe('Loading…');
    s.calls[2].ok(['Canada']);
    await expect.poll(() => st('l').opts).toEqual(['Canada']);
    s.calls[1].ok(['Cameroon', 'Canada']);   // too late: aborted, so dropped
    await new Promise((r) => setTimeout(r, 30));
    expect([st('l').opts, st('l').active, status('l')]).toEqual([['Canada'], 'Canada', '']);
  });

  test('typing waits for a pause (debounce) before loading; opening loads what "" finds; a rejected load says so and typing tries again', async () => {
    const s = server();
    await render(<div style={{ width: '320px' }}><Combobox id="d" aria-label="Country" loadOptions={s.loadOptions} debounce={150} /></div>);
    el('d').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(s.calls.map((c) => c.text)).toEqual(['']);
    s.calls[0].ok(['Argentina', 'Brazil']);
    await expect.poll(() => st('d').opts).toEqual(['Argentina', 'Brazil']);
    await userEvent.keyboard('per');
    expect(s.calls.length).toBe(1);   // still typing
    await expect.poll(() => s.calls.length).toBe(2);
    expect(s.calls[1].text).toBe('per');
    s.calls[1].fail();
    await expect.poll(() => status('d')).toBe("Couldn't load options. Type to try again.");
    await userEvent.keyboard('u');
    await expect.poll(() => s.calls.length).toBe(3);
    s.calls[2].ok(['Peru']);
    await expect.poll(() => [st('d').opts, status('d')]).toEqual([['Peru'], '']);
    expect(idLabels.loadFailed).toBe('Gagal memuat pilihan. Ketik untuk mencoba lagi.');
  });

  test('a request aborted by newer text that then rejects (as fetch does) says nothing; a loadOptions that throws at once says it failed', async () => {
    const s = server();
    await render(<div style={{ width: '320px' }}><Combobox id="x" aria-label="Country" loadOptions={s.loadOptions} debounce={0} /></div>);
    el('x').focus();
    await userEvent.keyboard('p');
    await userEvent.keyboard('e');
    expect(s.calls.map((c) => [c.text, c.signal.aborted])).toEqual([['p', true], ['pe', false]]);
    s.calls[0].fail();
    s.calls[1].ok(['Peru']);
    await expect.poll(() => st('x').opts).toEqual(['Peru']);
    expect(status('x')).not.toMatch(/load/i);
    const thrown = () => { throw new Error('no network'); };
    await render(<div style={{ width: '320px' }}><Combobox id="y" aria-label="Country" loadOptions={thrown} debounce={0} /></div>);
    el('y').focus();
    await userEvent.keyboard('a');
    await expect.poll(() => status('y')).toBe("Couldn't load options. Type to try again.");
  });

  test('a picked option keeps its label when later answers leave it out; unmounting aborts the request in flight', async () => {
    const s = server();
    const { unmount } = await render(<div style={{ width: '320px' }}><Combobox id="p" aria-label="Country" loadOptions={s.loadOptions} debounce={0} /></div>);
    el('p').focus();
    await userEvent.keyboard('can');
    s.calls.at(-1)!.ok([{ value: 'ca', label: 'Canada' }]);
    await expect.poll(() => st('p').opts).toEqual(['Canada']);
    await userEvent.keyboard('{Enter}');
    expect(st('p').text).toBe('Canada');
    await userEvent.keyboard('{Control>}a{/Control}xyz');
    s.calls.at(-1)!.ok([]);
    await expect.poll(() => status('p')).toBe('No results');
    await userEvent.keyboard('{Escape}');
    expect(st('p').text).toBe('Canada');
    await userEvent.keyboard('{Control>}a{/Control}q');
    const last = s.calls.at(-1)!;
    await unmount();
    expect([last.text, last.signal.aborted]).toEqual(['q', true]);
  });

  test('entry: the list fades in and grows from its top edge with a transition, not keyframes; only the fade under reduced motion (EF1)', async () => {
    await withMotion(async () => {
      await render(<Countries />);
      await userEvent.click(toggleOf('cb'));
      const pop = popOf('cb');
      const moves = pop.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty).sort();
      expect([moves, pop.getAnimations().some((a) => a instanceof CSSAnimation), pop.dataset.side, css(pop).transformOrigin.split(' ')[1]]).toEqual([['opacity', 'scale'], false, 'bottom', '0px']);
      await Promise.all(pop.getAnimations().map((a) => a.finished));
      expect([css(pop).opacity, css(pop).scale]).toEqual(['1', 'none']);
    });
  });
  test('exit: a press fades and shrinks the list out over 100ms, kept (inert, options in place) until the fade ends, as DatePicker\'s does (GK1); Escape takes it away at once (KW1)', async () => {
    await withMotion(async () => {
      const ms = (x: Animation) => Number(x.effect!.getComputedTiming().duration);
      const runs = (e: Element) => e.getAnimations().filter((x) => x instanceof CSSTransition && /^(opacity|scale)$/.test(x.transitionProperty)).map((x) => [(x as CSSTransition).transitionProperty, ms(x)]).sort();
      await render(<Countries />);
      await userEvent.click(toggleOf('cb'));
      const pop = popOf('cb');
      await settled(pop);
      await userEvent.click(toggleOf('cb'));
      expect([pop.hidden, toggleOf('cb').getAttribute('aria-expanded')]).toEqual([true, 'false']);
      // Kept in the top layer while it fades only where overlay can be held (Chromium); elsewhere it closes at once.
      if (CSS.supports('overlay', 'auto')) {
        expect([css(pop).display, pop.inert, pop.querySelectorAll('[role=option]').length, runs(pop)]).toEqual(['block', true, 7, [['opacity', 100], ['scale', 100]]]);
        await settled(pop);
      }
      await expect.poll(() => pop.querySelectorAll('[role=option]').length).toBe(0);
      expect(css(pop).display).toBe('none');
      await userEvent.click(toggleOf('cb'));
      await settled(pop);
      await userEvent.keyboard('{Escape}');
      expect([pop.hidden, css(pop).display, pop.getAnimations().length, pop.querySelectorAll('[role=option]').length]).toEqual([true, 'none', 0, 0]);
    });
  });
});
