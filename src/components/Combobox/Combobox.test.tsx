import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, settle } from '../../../tools/test/vitest/helpers';
import { Combobox, type ComboboxOption } from './Combobox';
import { Field } from '../Field/Field';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const COUNTRIES: ComboboxOption[] = ['Argentina', 'Brazil', 'Canada', { value: 'ci', label: 'Côte d’Ivoire', description: 'Africa' }, { value: 'dk', label: 'Denmark', disabled: true }, 'Egypt', 'France'];
const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const popOf = (id: string) => document.querySelector(`#${id} ~ .dk-combobox__popup`) as HTMLElement;
const label = (o: Element) => o.querySelector('.dk-combobox__label')!.textContent;
const st = (id: string) => {
  const i = el(id), list = document.getElementById(i.getAttribute('aria-controls')!)!, pop = list.parentElement!, ad = i.getAttribute('aria-activedescendant');
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
  test('a role="combobox" field (aria-autocomplete list, collapsed) controlling a hidden role="listbox"; Input\'s 32px box; a chevron button out of the Tab order; ref and className', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Countries cref={ref} />);
    const i = el('cb'), list = document.getElementById(i.getAttribute('aria-controls')!)!, box = i.parentElement!, toggle = box.querySelector<HTMLButtonElement>('.dk-combobox__toggle')!;
    expect([i.getAttribute('role'), i.getAttribute('aria-expanded'), i.getAttribute('aria-autocomplete'), i.getAttribute('aria-haspopup'), i.autocomplete]).toEqual(['combobox', 'false', 'list', 'listbox', 'off']);
    expect([list.getAttribute('role'), list.parentElement!.hidden, i.labels![0].textContent, ref.current === i]).toEqual(['listbox', true, 'Country', true]);
    expect(box.className).toMatch(/dk-input dk-combobox.*extra/);
    expect([box.dataset.component, box.offsetHeight, toggle.getAttribute('aria-label'), toggle.tabIndex]).toEqual(['combobox', 32, 'Show options', -1]);
  });

  test('the chevron and × names come from the labels: Indonesian under an id-ID provider, with the field\'s label', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Field label="Negara"><Combobox id="cb-id" options={COUNTRIES} defaultValue="Brazil" clearable /></Field></SerupaProvider>);
    const names = [...document.querySelectorAll('.dk-combobox__button')].map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual(['Hapus Negara', 'Tampilkan pilihan']);
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
    expect([st('cb').active, label(sel), !!sel.querySelector('.dk-combobox__check')]).toEqual(['Egypt', 'Egypt', true]);
  });

  test('typing filters, ignoring case and accents, and highlights the first match; no match shows "No results"; Escape puts back the picked label', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
    await selectAll(); await userEvent.keyboard('cote');
    let s = st('cb');
    expect([s.open, s.opts, s.active]).toEqual(['true', ['Côte d’Ivoire'], 'Côte d’Ivoire']);
    await userEvent.keyboard('xyz');
    const m = popOf('cb').querySelector('.dk-combobox__message')!;
    expect([st('cb').opts.length, m.textContent, m.getAttribute('role')]).toEqual([0, 'No results', 'status']);
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
    await settle(50);
    expect(el('cb').value).toBe('Egypt');
    el('cb').focus();
    await selectAll(); await userEvent.keyboard('{Backspace}');
    el('before').focus();
    await settle(50);
    expect([el('cb').value, !!popOf('cb').querySelector('[aria-selected=true]')]).toEqual(['', false]);
  });

  test('a typed full label picks that option when focus leaves ("brazil" then Tab, "cote d’ivoire" without accents then a click elsewhere); onValueChange gets it; a disabled option\'s label doesn\'t pick it', async () => {
    const calls: Array<string | null> = [];
    await render(<div style={{ width: '320px' }}><button id="before">Before</button>
      <Combobox id="cb" aria-label="Country" options={COUNTRIES} onValueChange={(v) => calls.push(v)} /></div>);
    el('cb').focus();
    await userEvent.keyboard('brazil{Tab}');
    await settle(50);
    expect([el('cb').value, calls]).toEqual(['Brazil', ['Brazil']]);
    el('cb').focus();
    await selectAll(); await userEvent.keyboard('cote d’ivoire');
    await userEvent.click(el('before'));
    await settle(50);
    expect([el('cb').value, calls]).toEqual(['Côte d’Ivoire', ['Brazil', 'ci']]);
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
    const toggle = document.querySelector<HTMLElement>('#cb ~ .dk-combobox__toggle')!;
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
    await settle(50);
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
    const clear = () => document.querySelector<HTMLElement>('#ctl ~ .dk-combobox__clear');
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
    const m = popOf('async').querySelector('.dk-combobox__message')!;
    expect([m.textContent, m.getAttribute('role'), !!m.querySelector('[data-component=loader]')]).toEqual(['Finding people…', 'status', true]);
  });

  test('disabled: doesn\'t open, and the chevron is disabled; --combobox-chevron overrides one field', async () => {
    await render(<>
      <Combobox id="dis" aria-label="Dis" options={COUNTRIES} disabled />
      <Combobox id="tok" aria-label="Tok" options={COUNTRIES} style={{ '--combobox-chevron': 'rgb(1, 2, 3)' } as React.CSSProperties} />
    </>);
    await userEvent.click(el('dis'), { force: true });
    expect([st('dis').open, document.querySelector<HTMLButtonElement>('#dis ~ .dk-combobox__toggle')!.disabled]).toEqual(['false', true]);
    expect(getComputedStyle(document.querySelector('#tok ~ .dk-combobox__toggle')!).color).toBe('rgb(1, 2, 3)');
  });

  test('contrast: labels and descriptions keep 4.5:1, even highlighted, and the chevron 3:1, in all six themes', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const pop = popOf('cb'), act = pop.querySelector('.dk-combobox__option--active')!, c = (e: Element) => getComputedStyle(e).color;
      const bg = getComputedStyle(pop).backgroundColor, abg = getComputedStyle(act).backgroundColor, field = getComputedStyle(el('cb').parentElement!).backgroundColor;
      const pairs: Array<[string, string, string, number]> = [['label', c(pop.querySelector('.dk-combobox__label')!), bg, 4.5], ['active label', c(act), abg, 4.5], ['description on active', c(act.querySelector('.dk-combobox__description')!), abg, 4.5], ['chevron', c(document.querySelector('#cb ~ .dk-combobox__toggle')!), field, 3]];
      for (const [k, fg, on, min] of pairs) { const r = contrast(fg, on); if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    still.remove();
    expect(low).toEqual([]);
  });

  test('the highlighted option: highlight background and a 2px primary bar at its start, on the right in rtl', async () => {
    await render(<Countries />);
    await open();
    await userEvent.keyboard('{ArrowDown}');
    const act = () => popOf('cb').querySelector('.dk-combobox__option--active')!;
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
    await settle();
    const name = (id: string) => document.querySelector(`#${id} ~ .dk-combobox__clear`)!.getAttribute('aria-label');
    expect(['f1', 'f2', 'f3', 'f4', 'f5'].map(name)).toEqual(['Clear Country', 'Clear Region', 'Clear Ship to', 'Clear', 'Remove country']);
  });
});
