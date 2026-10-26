import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Field } from '../Field/Field';
import { PhoneInput, type PhoneValueDetails } from './PhoneInput';
import { PHONE_COUNTRIES, formatNational, formatPhone, parsePhone, phoneCountry } from './phone';

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const box = (id: string) => field(id).parentElement as HTMLElement;
const menu = (id: string) => box(id).querySelector('select') as HTMLSelectElement;
const part = (id: string) => box(id).querySelector('.dk-phone-input__country') as HTMLElement;
const dial = (id: string) => (box(id).querySelector('.dk-phone-input__dial') as HTMLElement).textContent;
const settled = () => expect.poll(() => document.getAnimations().length).toBe(0);
const pick = (sel: HTMLSelectElement, code: string) => userEvent.selectOptions(sel, code);

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

// The examples are in English whatever language the browser is in (run.mjs --locale); a test of another locale sets its own.
const Wrap = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US"><div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div></SerupaProvider>;

describe('PhoneInput', () => {
  test('Input\'s box around a country menu and a tel field (tel-national, inputmode tel); ref to the field, className and style to the box', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" defaultCountry="ID" ref={ref} className="extra" style={{ marginTop: '2px' }} /></Wrap>);
    const i = field('p'), b = box('p');
    expect([i.type, i.inputMode, i.getAttribute('autocomplete'), ref.current === i]).toEqual(['tel', 'tel', 'tel-national', true]);
    expect([b.className, b.dataset.component, b.style.marginTop, b.getBoundingClientRect().height]).toEqual(['dk-input dk-phone-input dk-input--size-md extra', 'phone-input', '2px', 32]);
    expect([menu('p').getAttribute('aria-label'), menu('p').value, dial('p')]).toEqual(['Country', 'ID', '+62']);
    // Each option names the country in the locale's words, with its calling code, sorted by name.
    const names = [...menu('p').options].map((o) => o.textContent);
    expect(names).toContain('Indonesia (+62)');
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en-US')));
    expect(names.length).toBe(PHONE_COUNTRIES.length);
  });

  test('typing groups the number by the country\'s pattern and drops a typed trunk 0; onValueChange gets E.164 and whether it\'s complete', async () => {
    const calls: Array<[string, PhoneValueDetails]> = [];
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" defaultCountry="ID" onValueChange={(v, d) => calls.push([v, d])} /></Wrap>);
    await userEvent.type(field('p'), '0812345');
    expect(field('p').value).toBe('812-345');
    expect(calls.at(-1)).toEqual(['+62812345', { country: 'ID', national: '812345', complete: false }]);
    await userEvent.type(field('p'), '67890');
    expect(field('p').value).toBe('812-3456-7890');
    expect(calls.at(-1)).toEqual(['+6281234567890', { country: 'ID', national: '81234567890', complete: true }]);
    // No more digits than the country uses (12 in ID).
    await userEvent.type(field('p'), '12345');
    expect(field('p').value.replace(/\D/g, '').length).toBe(12);
  });

  test('keyboard table: Tab goes to the country select, then the number; ArrowDown and ArrowUp there pick a country; Delete before a separator removes the digit beyond it (FH1)', async () => {
    await render(<Wrap><button id="kb-before">before</button><PhoneInput id="kp" aria-label="Phone" defaultCountry="US" defaultValue="+12015550123" /></Wrap>);
    document.getElementById('kb-before')!.focus();
    await userEvent.tab();
    const order = [document.activeElement === menu('kp')];
    const start = menu('kp').value;
    await userEvent.keyboard('{ArrowDown}');
    const down = menu('kp').value;
    await userEvent.keyboard('{ArrowUp}');
    // Passing through a country with shorter numbers keeps every digit typed.
    expect([down !== start, menu('kp').value, field('kp').value]).toEqual([true, start, '(201) 555-0123']);
    await userEvent.tab();
    order.push(document.activeElement === field('kp'));
    const i = field('kp');
    i.setSelectionRange(9, 9);   // before the "-" of "(201) 555-0123"
    await userEvent.keyboard('{Delete}');
    expect([order, i.value]).toEqual([[true, true], '(201) 555-123']);
  });

  test('Backspace after a separator removes the digit before it; typing in the middle keeps the caret after the new digit', async () => {
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" defaultCountry="US" defaultValue="+12015550123" /></Wrap>);
    const i = field('p');
    expect(i.value).toBe('(201) 555-0123');
    i.focus();
    i.setSelectionRange(10, 10);   // after "555-"
    await userEvent.keyboard('{Backspace}');
    expect([i.value, i.selectionStart]).toEqual(['(201) 550-123', 8]);
    i.setSelectionRange(1, 1);     // after "("
    await userEvent.keyboard('9');
    expect([i.value, i.selectionStart]).toEqual(['(920) 155-0123', 2]);
  });

  test('pasting "+…" picks the country from the calling code (the picked one first when it shares it); picking a country keeps the digits', async () => {
    const countries: string[] = [];
    await render(<Wrap>
      <PhoneInput id="p" aria-label="Phone" defaultCountry="US" onCountryChange={(c) => countries.push(c)} />
      <PhoneInput id="ca" aria-label="Canada" defaultCountry="CA" />
    </Wrap>);
    await userEvent.fill(field('p'), '+44 7400 123456');   // as a paste into the empty field
    expect([menu('p').value, dial('p'), field('p').value, countries.join()]).toEqual(['GB', '+44', '7400 123456', 'GB']);
    await pick(menu('p'), 'AU');
    expect([dial('p'), field('p').value, countries.join()]).toEqual(['+61', '740 012 345', 'GB,AU']);
    await userEvent.fill(field('ca'), '001 416 555 0199');
    expect([menu('ca').value, field('ca').value]).toEqual(['CA', '(416) 555-0199']);
  });

  test('form reset: the default number and country come back, in the field and in what the form sends', async () => {
    await render(<form id="pf"><PhoneInput id="pr" aria-label="Phone" name="phone" defaultValue="+6281234567890" /></form>);
    const f = document.getElementById('pf') as HTMLFormElement, start = field('pr').value;
    await userEvent.fill(field('pr'), '5551234');
    const sel = f.querySelector('select')!;
    sel.value = 'US'; sel.dispatchEvent(new Event('change', { bubbles: true }));
    await expect.poll(() => new FormData(f).get('phone')).not.toBe('+6281234567890');
    f.reset();
    await expect.poll(() => new FormData(f).get('phone')).toBe('+6281234567890');
    expect([field('pr').value, sel.value]).toEqual([start, 'ID']);
  });

  test('controlled: value in E.164 is shown grouped and follows the parent; the default country comes from the locale\'s region', async () => {
    function Ctl() {
      const [v, setV] = React.useState('+819012345678');
      return <>
        <PhoneInput id="c" aria-label="Ctl" value={v} onValueChange={setV} />
        <button type="button" onClick={() => setV('+33612345678')}>France</button>
        <output>{v}</output>
      </>;
    }
    await render(<Wrap><SerupaProvider locale="ja-JP"><Ctl /><PhoneInput id="d" aria-label="Default" /></SerupaProvider></Wrap>);
    expect([menu('c').value, field('c').value, menu('d').value]).toEqual(['JP', '90-1234-5678', 'JP']);
    await userEvent.type(field('c'), '{Backspace}');
    expect([field('c').value, document.querySelector('output')!.textContent]).toEqual(['90-1234-567', '+81901234567']);
    await userEvent.click(document.querySelector('button')!);
    await expect.poll(() => [menu('c').value, field('c').value]).toEqual(['FR', '6 12 34 56 78']);
  });

  test('controlled from outside: cleared, or a number of another country with country fixed; form reset: no default gives an empty field and the locale\'s country, a controlled field shows its value again', async () => {
    function Ctl(p: { country?: string }) {
      const [v, setV] = React.useState('+6281234567890');
      return <>
        <PhoneInput id="o" aria-label="Out" value={v} onValueChange={setV} country={p.country} />
        {['', '+33612345678', '+6281234567890'].map((n) => <button key={n} type="button" id={'set' + n.length} onClick={() => setV(n)}>{n || 'clear'}</button>)}
      </>;
    }
    const to = (n: number) => userEvent.click(document.getElementById('set' + n)!);
    const node: ((n: HTMLInputElement | null) => void) & { got?: HTMLInputElement | null } = (n) => { node.got = n; };
    const screen = await render(<Wrap><SerupaProvider locale="en-US"><form id="rf"><Ctl /><PhoneInput id="u" aria-label="Plain" name="u" ref={node} /></form></SerupaProvider></Wrap>);
    expect(node.got).toBe(field('u'));
    await to(0);
    await expect.poll(() => field('o').value).toBe('');
    expect(menu('o').value).toBe('ID');
    await screen.rerender(<Wrap><SerupaProvider locale="en-US"><form id="rf"><Ctl country="ID" /><PhoneInput id="u" aria-label="Plain" name="u" ref={node} /></form></SerupaProvider></Wrap>);
    await to(12);
    await expect.poll(() => menu('o').value).toBe('ID');
    await to(14);
    await expect.poll(() => field('o').value).not.toBe('');
    const shown = field('o').value;
    await userEvent.fill(field('u'), '2025550123');
    await pick(menu('u'), 'GB');
    (document.getElementById('rf') as HTMLFormElement).reset();
    await expect.poll(() => [field('u').value, menu('u').value]).toEqual(['', 'US']);
    expect(field('o').value).toBe(shown);
  });

  test('invalid marks the field; readOnly locks the country menu too; picking the country it already has reports nothing', async () => {
    const calls: string[] = [];
    await render(<Wrap><PhoneInput id="iv" aria-label="Bad" invalid defaultCountry="ID" /><PhoneInput id="ro" aria-label="Locked" readOnly defaultValue="+6281234567890" />
      <PhoneInput id="same" aria-label="Same" defaultCountry="ID" onValueChange={(v) => { calls.push(v); }} onCountryChange={(c) => { calls.push(c); }} /></Wrap>);
    expect([field('iv').getAttribute('aria-invalid'), box('iv').className.includes('dk-input--invalid'), menu('ro').disabled, menu('iv').disabled]).toEqual(['true', true, true, false]);
    menu('same').dispatchEvent(new Event('change', { bubbles: true }));
    expect(calls).toEqual([]);
  });

  test('Field labels the number; countries limits the menu; name submits E.164; disabled covers both; Indonesian labels; size sm and lg', async () => {
    await render(<Wrap>
      <form id="f">
        <Field label="Nomor HP"><PhoneInput id="fp" name="phone" countries={['SG', 'ID', 'MY']} defaultValue="+6591234567" /></Field>
      </form>
      <SerupaProvider labels={idLabels}><PhoneInput id="id" aria-label="HP" defaultCountry="ID" size="sm" /></SerupaProvider>
      <PhoneInput id="dis" aria-label="Off" disabled size="lg" />
    </Wrap>);
    expect([field('fp').labels![0].textContent, [...menu('fp').options].map((o) => o.value).join(), menu('fp').value]).toEqual(['Nomor HP', 'ID,MY,SG', 'SG']);
    expect(new FormData(document.getElementById('f') as HTMLFormElement).get('phone')).toBe('+6591234567');
    expect([menu('id').getAttribute('aria-label'), Math.round(box('id').getBoundingClientRect().height)]).toEqual(['Negara', 24]);
    expect([field('dis').disabled, menu('dis').disabled, box('dis').className.includes('dk-input--disabled'), Math.round(box('dis').getBoundingClientRect().height)]).toEqual([true, true, true, 44]);
  });

  test('the menu has its own 2px focus ring inside the box; the tokens override it; contrast of the code and chevron in all six themes', async () => {
    await render(<Wrap>
      <PhoneInput id="p" aria-label="Phone" defaultCountry="ID" />
      <PhoneInput id="t" aria-label="Tok" style={{ '--phone-input-dial': 'rgb(1, 2, 3)' } as React.CSSProperties} />
    </Wrap>);
    field('p').focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(menu('p'));
    expect([css(part('p')).outlineStyle, css(part('p')).outlineWidth]).toEqual(['solid', '2px']);
    expect(css(part('t')).color).toBe('rgb(1, 2, 3)');
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      void css(box('p')).backgroundColor;
      await settled();
      const bg = css(box('p')).backgroundColor;
      for (const [name, fg, min] of [['code', css(part('p')).color, 4.5], ['chevron', css(part('p').querySelector('[data-icon]')).color, 3], ['number', css(field('p')).color, 4.5]] as const) {
        const r = contrast(fg, bg);
        if (r < min) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('a calling code typed without "+" ("62 812…" with Indonesia picked) is dropped once the number is too long to be national, not doubled', async () => {
    const calls: string[] = [];
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" defaultCountry="ID" onValueChange={(v) => calls.push(v)} /></Wrap>);
    await userEvent.type(field('p'), '62 812-3456-7890');
    expect([field('p').value, calls.at(-1)]).toEqual(['812-3456-7890', '+6281234567890']);
    await pick(menu('p'), 'US');
    await userEvent.fill(field('p'), '1 415 555 0123');
    expect([field('p').value, calls.at(-1)]).toEqual(['(415) 555-0123', '+14155550123']);
  });

  test('Germany groups by the area code: "030 123456" is "30 123456"', async () => {
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" defaultCountry="DE" /></Wrap>);
    await userEvent.type(field('p'), '030 123456');
    expect(field('p').value).toBe('30 123456');
  });

  test('countries takes your own rows, which replace the built-in one; an unknown "+" code warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mine = { code: 'SG', dial: '65', trunk: '', pattern: '## ## ## ##', min: 8, max: 8 };
    await render(<Wrap><PhoneInput id="p" aria-label="Phone" countries={['ID', mine]} defaultCountry="SG" /></Wrap>);
    expect([...menu('p').options].map((o) => o.value).join()).toBe('ID,SG');
    await userEvent.type(field('p'), '91234567');
    expect(field('p').value).toBe('91 23 45 67');
    await userEvent.fill(field('p'), '+65 8123 4567');
    expect([menu('p').value, field('p').value]).toEqual(['SG', '81 23 45 67']);
    await userEvent.fill(field('p'), '+999 123');
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("calling code PhoneInput doesn't know")).length).toBe(1);
    warn.mockRestore();
  });

  test('the helpers: parsePhone, formatPhone, formatNational', () => {
    expect(parsePhone('+62 0812-3456-7890')).toEqual({ country: phoneCountry('ID'), national: '81234567890' });
    expect(parsePhone('+1 416 555 0199', 'CA')!.country.code).toBe('CA');
    // A shared calling code: the area picks the country (Canada's 416, American Samoa's 684, Kazakhstan's 7xx, Guernsey's 1481).
    expect(['+1 416 555 0199', '+1 684 733 1234', '+1 212 555 0199', '+7 701 123 4567', '+7 495 123 4567', '+44 1481 123456', '+44 7400 123456'].map((v) => parsePhone(v)!.country.code)).toEqual(['CA', 'AS', 'US', 'KZ', 'RU', 'GG', 'GB']);
    expect([parsePhone('+1 212 555 0199', 'CA')!.country.code, parsePhone('+1 4', 'CA')!.country.code]).toEqual(['US', 'CA']);
    // Every calling code in the world: Sri Lanka, and a country with no listed grouping (Aruba) keeps its digits ungrouped.
    expect([formatPhone('+94771234567'), formatPhone('+2975601234'), PHONE_COUNTRIES.length]).toEqual(['+94 77 123 4567', '+297 5601234', 244]);
    // German area codes are 2 to 5 digits: Berlin, a mobile, Cologne, and a 4-digit one.
    expect(['+4930123456', '+4915123456789', '+492211234567', '+4946211234567'].map((v) => formatPhone(v))).toEqual(['+49 30 123456', '+49 151 23456789', '+49 221 1234567', '+49 4621 1234567']);
    expect([parsePhone('0812'), parsePhone('+999 1')]).toEqual([undefined, undefined]);
    expect([formatPhone('+6281234567890'), formatPhone('+74951234567'), formatPhone('+999123')]).toEqual(['+62 812-3456-7890', '+7 495 123-45-67', '+999123']);
    expect(formatNational('81234567890123', phoneCountry('ID')!)).toBe('812-3456-7890123');
  });
});
