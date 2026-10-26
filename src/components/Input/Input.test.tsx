import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { color, css, lowContrast, settle, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Input } from './Input';
import { NumberInput } from '../NumberInput/NumberInput';
import { Textarea } from '../Textarea/Textarea';

// The tests that read digits say they mean en-US: with no locale, a count is in the browser's digits ("٣" in ar-EG).
const EnUS = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US">{children}</SerupaProvider>;

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const box = (id: string) => field(id).parentElement as HTMLElement;
const count = (id: string) => box(id).querySelector('.dk-input__count') as HTMLElement;
const announcer = () => document.querySelector<HTMLElement>('[data-dk-announcer]');

describe('Input', () => {
  test('prefix and suffix: muted text in the box around the field, heard after the field\'s own description; a press on one focuses the field; NumberInput takes them too', async () => {
    await render(<><span id="site-hint">Your shop</span>
      <Input id="site" aria-label="Website" prefix="https://" suffix=".com" aria-describedby="site-hint" />
      <NumberInput id="kg" aria-label="Weight" suffix="kg" defaultValue={12} />
      <Input id="none" aria-label="Plain" /></>);
    const said = (id: string) => (field(id).getAttribute('aria-describedby') || '').split(' ').map((x) => document.getElementById(x)!.textContent).join(' | ');
    const parts = [...box('site').children].map((c) => c.tagName === 'INPUT' ? 'field' : c.textContent);
    expect([parts, said('site'), said('kg'), field('none').hasAttribute('aria-describedby')]).toEqual([['https://', 'field', '.com'], 'Your shop | https:// | .com', 'kg', false]);
    const suffix = field('site').nextElementSibling as HTMLElement;
    expect([css(suffix).whiteSpace, css(suffix).color]).toEqual(['nowrap', color('var(--text-muted)')]);
    await userEvent.click(suffix);
    expect(document.activeElement).toBe(field('site'));
    await userEvent.click(field('kg').nextElementSibling as HTMLElement);
    expect(document.activeElement).toBe(field('kg'));
  });

  test('a press anywhere on the box (icons, side padding, the count) focuses the field with the caret at the end; a press on a disabled box does nothing (GE1)', async () => {
    await render(<div style={{ width: '300px' }}>
      <Input id="bx" size="lg" leftIcon="search" rightIcon="mail" defaultValue="hello" aria-label="Find" />
      <Input id="bx-off" size="lg" leftIcon="search" disabled aria-label="Off" />
      <button id="bx-away">away</button>
    </div>);
    const b = box('bx').getBoundingClientRect(), y = b.height / 2;
    for (const x of [2, 20, b.width - 20, b.width - 2]) {
      (document.getElementById('bx-away') as HTMLElement).focus();
      await userEvent.click(box('bx'), { position: { x, y } });
      expect([x, document.activeElement === field('bx'), field('bx').selectionStart]).toEqual([x, true, 5]);
    }
    (document.getElementById('bx-away') as HTMLElement).focus();
    await userEvent.click(box('bx-off'), { position: { x: 4, y }, force: true });
    expect(document.activeElement).not.toBe(field('bx-off'));
  });

  test('keyboard table: Tab reaches the field; Enter submits the form it\'s in (FH1)', async () => {
    const sent: string[] = [];
    await render(<form onSubmit={(e) => { e.preventDefault(); sent.push(new FormData(e.currentTarget).get('who') as string); }}>
      <button type="button" id="kb-before">before</button><Input id="kb-in" name="who" aria-label="Who" /><button>Send</button>
    </form>);
    field('kb-before').focus();
    await userEvent.tab();
    const at = document.activeElement?.id;
    await userEvent.keyboard('Dana{Enter}');
    expect([at, sent]).toEqual(['kb-in', ['Dana']]);
  });

  test('a native <input type="text"> in a .dk-input box; md is 32px, text-sm, 12px padding, a 1px border and 6px corners', async () => {
    await render(<Input id="md" aria-label="Name" />);
    const s = css(box('md'));
    expect([field('md').tagName, field('md').type]).toEqual(['INPUT', 'text']);
    expect(box('md').className).toMatch(/dk-input dk-input--size-md/);
    expect(box('md').dataset.component).toBe('input');
    expect([s.height, s.fontSize, s.paddingLeft, s.borderTopWidth, s.borderTopLeftRadius]).toEqual(['32px', '14px', '12px', '1px', '6px']);
  });

  test('sizes: sm 24px, text-xs, 8px padding; lg 44px, text-base, 16px padding; an unknown size falls back to md', async () => {
    await render(<>
      <Input id="sm" size="sm" aria-label="Small" />
      <Input id="lg" size="lg" aria-label="Large" />
      {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
      <Input id="bad" size="xl" aria-label="Bad" />
    </>);
    const m = (id: string) => { const s = css(box(id)); return [s.height, s.fontSize, s.paddingLeft]; };
    expect(m('sm')).toEqual(['24px', '12px', '8px']);
    expect(m('lg')).toEqual(['44px', '16px', '16px']);
    expect(box('bad').dataset.size).toBe('md');
  });

  test('ref and attributes go to the <input>, className to the box; a <label htmlFor> names it', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<><label htmlFor="a">Name</label><Input id="a" ref={ref} placeholder="Dana" className="extra" data-x="y" /></>);
    expect(ref.current).toBe(field('a'));
    expect(box('a').classList.contains('extra')).toBe(true);
    expect([field('a').dataset.x, field('a').placeholder]).toEqual(['y', 'Dana']);
    await expect.element(page.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  test('typing updates a controlled value through onChange', async () => {
    const changes: string[] = [];
    function App() {
      const [v, setV] = React.useState('');
      return <Input id="c" aria-label="Name" value={v} onChange={(e) => { changes.push(e.target.value); setV(e.target.value); }} />;
    }
    await render(<App />);
    await page.getByRole('textbox', { name: 'Name' }).click();
    await expect.poll(() => document.activeElement).toBe(field('c'));
    await userEvent.keyboard('Kim');
    await expect.poll(() => field('c').value).toBe('Kim');
    expect(changes).toEqual(['K', 'Ki', 'Kim']);
  });

  test('focus: the border and a 1px ring take the focus color; a transparent outline for forced-colors mode', async () => {
    await render(<Input id="f" aria-label="Focus" />);
    field('f').focus();
    const ring = color('var(--focus-ring)');
    // the border eases to the focus color; Firefox and WebKit can take longer than the 150ms to finish
    await expect.poll(() => css(box('f')).borderTopColor).toBe(ring);
    const s = css(box('f'));
    expect(s.boxShadow).toContain(ring);
    expect(s.boxShadow).toMatch(/0px 0px 0px 1px/);
    expect([s.outlineWidth, s.outlineColor]).toEqual(['2px', 'rgba(0, 0, 0, 0)']);
  });

  test('hover changes the border', async () => {
    await render(<><Input id="h" aria-label="Hover" /><Input id="r" aria-label="Rest" /></>);
    await page.getByRole('textbox', { name: 'Hover' }).hover();
    await expect.poll(() => css(box('h')).borderTopColor).not.toBe(css(box('r')).borderTopColor);
  });

  test('invalid: aria-invalid, a danger border and a danger focus ring', async () => {
    await render(<Input id="i" invalid aria-label="Invalid" />);
    const danger = color('var(--danger)');
    expect(field('i').getAttribute('aria-invalid')).toBe('true');
    expect(css(box('i')).borderTopColor).toBe(danger);
    field('i').focus();
    await expect.poll(() => css(box('i')).boxShadow).toContain(danger);
  });

  test('read-only: a surface-muted background, still focusable; disabled: native disabled, 50%, not-allowed', async () => {
    await render(<>
      <Input id="plain" aria-label="Plain" />
      <Input id="ro" readOnly defaultValue="INV-1" aria-label="Read-only" />
      <Input id="dis" disabled aria-label="Disabled" />
    </>);
    expect(css(box('ro')).backgroundColor).not.toBe(css(box('plain')).backgroundColor);
    expect(box('ro').className).toMatch(/readonly/);
    field('ro').focus();
    expect(document.activeElement).toBe(field('ro'));
    expect(field('dis').disabled).toBe(true);
    expect(css(box('dis')).opacity).toBe('0.5');
    expect(box('dis').className).toMatch(/disabled/);
    expect(css(field('dis')).cursor).toBe('not-allowed');
  });

  test('in a <fieldset disabled>: the same look as disabled (surface-muted, 50%, not-allowed), with no hover border; fields built on Input follow (NumberInput\'s steppers aren\'t dimmed twice)', async () => {
    await render(<>
      <Input id="fdref" disabled aria-label="Disabled" />
      <fieldset disabled><legend>Billing</legend>
        <Input id="fdin" aria-label="Company" />
        <NumberInput id="fdnum" aria-label="Seats" defaultValue={3} />
      </fieldset>
    </>);
    const ref = css(box('fdref')), b = css(box('fdin'));
    expect(field('fdin').matches(':disabled')).toBe(true);
    expect([b.opacity, b.backgroundColor, b.cursor, css(field('fdin')).cursor]).toEqual(['0.5', ref.backgroundColor, 'not-allowed', 'not-allowed']);
    const border = css(box('fdin')).getPropertyValue('--dk-input-bd');
    await userEvent.hover(box('fdin'), { force: true });
    expect(css(box('fdin')).getPropertyValue('--dk-input-bd')).toBe(border);
    const num = field('fdnum').parentElement as HTMLElement;
    expect(css(num).opacity).toBe('0.5');
    expect([...num.querySelectorAll('.dk-number-input__step')].map((s) => css(s).opacity)).toEqual(['1', '1']);
  });

  test('icons: decorative, 16px at md, before and after the field, and they don\'t take clicks', async () => {
    await render(<Input id="ic" leftIcon="search" rightIcon="mail" aria-label="Icons" />);
    const w = box('ic'), l = w.querySelector('.dk-input__icon--left')!, r = w.querySelector('.dk-input__icon--right')!;
    expect([...w.children].map((c) => c.className.split(' ')[0])).toEqual(['dk-input__icon', 'dk-input__field', 'dk-input__icon']);
    expect(w.firstElementChild).toBe(l);
    expect(w.lastElementChild).toBe(r);
    expect([l.getAttribute('aria-hidden'), r.getAttribute('aria-hidden')]).toEqual(['true', 'true']);
    expect(css(l.querySelector('[data-icon]')).fontSize).toBe('16px');
    expect(css(l).pointerEvents).toBe('none');
  });

  test('contrast in all six themes: text, placeholder, prefix and suffix 4.5:1 on the field; border, focus ring and invalid border 3:1', () => {
    expect(lowContrast([
      ['text', 'var(--text)', 'var(--field)', 4.5],
      ['placeholder', 'var(--placeholder)', 'var(--field)', 4.5],
      ['prefix and suffix', 'var(--text-muted)', 'var(--field)', 4.5],
      ['border', 'var(--field-border)', 'var(--field)', 3],
      ['border on page', 'var(--field-border)', 'var(--surface)', 3],
      ['focus', 'var(--focus-ring)', 'var(--surface)', 3],
      ['invalid', 'var(--danger)', 'var(--field)', 3],
    ])).toEqual([]);
  });

  test('showCount: "2 / 5" at the end of the field, linked by aria-describedby after the field\'s own; stops at maxLength and turns text-colored', async () => {
    await render(<><span id="hint">Up to 5</span><Input id="cnt" showCount maxLength={5} defaultValue="ab" aria-describedby="hint" aria-label="Code" rightIcon={<b>i</b>} /></>, { wrapper: EnUS });
    const c0 = count('cnt'), col0 = css(c0).color;
    expect([c0.textContent, field('cnt').getAttribute('aria-describedby'), c0.nextElementSibling!.className, field('cnt').hasAttribute('maxlength')]).toEqual(['2 / 5', 'hint ' + c0.id, 'dk-input__icon dk-input__icon--right', false]);
    await userEvent.type(field('cnt'), 'cdefg');
    expect([field('cnt').value, count('cnt').textContent, count('cnt').classList.contains('dk-input__count--full')]).toEqual(['abcde', '5 / 5', true]);
    expect(css(count('cnt')).color).not.toBe(col0);
  });

  test('maxLength counts the characters people see: an emoji family and a flag are one each', async () => {
    await render(<Input id="emo" showCount maxLength={3} defaultValue="👨‍👩‍👧🇮🇩" aria-label="Emoji" />, { wrapper: EnUS });
    expect(count('emo').textContent).toBe('2 / 3');
    await userEvent.type(field('emo'), 'abc');
    expect([field('emo').value, count('emo').textContent]).toEqual(['👨‍👩‍👧🇮🇩a', '3 / 3']);
  });

  test('the count is read out only near the limit: once when few are left, once at the limit, not on every keystroke (idea 105)', async () => {
    await render(<Input id="near" showCount maxLength={20} aria-label="Near" />);
    const said: string[] = [];
    await settle();
    const seen = new MutationObserver(() => { const t = announcer()?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await userEvent.type(field('near'), 'a'.repeat(16));
    await expect.poll(() => said.join('|')).toMatch(/4 characters left\.$/);
    await userEvent.type(field('near'), 'bbbbbb');
    await expect.poll(() => said.at(-1)).toBe('Character limit reached.');
    seen.disconnect();
    expect(said.join('|')).not.toMatch(/(19|10|5|3|2) characters? left/);
  });

  test('the count in Indonesian, in the locale\'s digits', async () => {
    await render(<SerupaProvider locale="ar-EG" labels={idLabels}><Input id="ar" showCount maxLength={12} defaultValue="abc" aria-label="Ar" /></SerupaProvider>);
    expect(count('ar').textContent).toBe('٣ / ١٢');
    expect(idLabels.charactersLeft(2)).toBe('Sisa 2 karakter.');
  });

  test('a form reset puts the count back to the default', async () => {
    await render(<form id="f"><Input id="rs" showCount maxLength={10} defaultValue="ab" aria-label="Reset" /></form>, { wrapper: EnUS });
    await userEvent.type(field('rs'), 'cdef');
    expect(count('rs').textContent).toBe('6 / 10');
    (document.getElementById('f') as HTMLFormElement).reset();
    await expect.poll(() => [field('rs').value, count('rs').textContent]).toEqual(['ab', '2 / 10']);
  });

  test('email, URL, username and one-time-code fields: no autocapitalize, autocorrect or spellcheck, unless set (idea 172)', async () => {
    await render(<>
      <Input id="em" type="email" aria-label="Email" />
      <Input id="url" type="url" aria-label="URL" />
      <Input id="un" autoComplete="username" aria-label="User" />
      <Input id="otp" autoComplete="one-time-code" aria-label="Code" />
      <Input id="own" type="email" spellCheck autoCapitalize="on" aria-label="Own" />
      <Input id="nm" aria-label="Name" />
    </>);
    const kb = (id: string) => [field(id).getAttribute('autocapitalize'), field(id).getAttribute('autocorrect'), field(id).getAttribute('spellcheck')];
    for (const id of ['em', 'url', 'un', 'otp']) expect(kb(id)).toEqual(['off', 'off', 'false']);
    expect(kb('own')).toEqual(['on', 'off', 'true']);
    expect(kb('nm')).toEqual([null, null, null]);
  });
  test('iOS: Input, Textarea and Select fields get 16px text where Safari would zoom into a smaller one (the rule only applies there)', () => {
    const rules: string[] = [];
    const walk = (list: CSSRuleList) => { for (const r of Array.from(list)) {
      if (r instanceof CSSSupportsRule && r.conditionText.includes('-webkit-touch-callout')) rules.push(...Array.from(r.cssRules).map((x) => x.cssText));
      else if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    } };
    for (const sheet of Array.from(document.styleSheets)) { try { walk(sheet.cssRules); } catch { /* another origin */ } }
    for (const f of ['dk-input__field', 'dk-textarea__field', 'dk-select__field']) {
      expect(rules.find((r) => r.includes('.' + f))).toMatch(/font-size: var\(--text-base\)/);
    }
  });

  test('the focus ring shows at once (no transition in), so a field focused as a popup opens doesn\'t animate on its first frame; it still fades out on blur', () => withMotion(async () => {
    await render(<><Input id="ring" aria-label="Name" /><button id="away">Away</button></>);
    const f = document.getElementById('ring') as HTMLInputElement, b = document.getElementById('ring')!.closest('[data-component=input]') as HTMLElement;
    const shadows = () => b.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === 'box-shadow').length;
    f.focus();
    expect([shadows(), css(b).boxShadow]).toEqual([0, expect.stringMatching(/0px 0px 0px 1px/)]);
    (document.getElementById('away') as HTMLElement).focus();
    expect(shadows()).toBe(1);
  }));
});

describe('Input and Textarea: constraint messages in the provider\'s words (216)', () => {
  const said = (id: string) => { const el = document.getElementById(id) as HTMLInputElement; el.reportValidity(); return el.validationMessage; };
  test('with idLabels, each failed constraint is said in Indonesian; typing clears it and the field is judged again', async () => {
    const screen = await render(<SerupaProvider labels={idLabels}>
      <Input id="v-req" aria-label="Nama" required />
      <Input id="v-mail" aria-label="Email" type="email" defaultValue="nope" />
      <Input id="v-min" aria-label="Umur" type="number" min={18} max={99} defaultValue="12" />
      <Input id="v-max" aria-label="Jumlah" type="number" max={5} defaultValue="9" />
      <Input id="v-pat" aria-label="Kode" pattern="[0-9]{4}" title="Empat angka." defaultValue="12a" />
      <Input id="v-len" aria-label="Sandi" minLength={8} />
      <Textarea id="v-ta" aria-label="Catatan" required />
    </SerupaProvider>);
    expect(['v-req', 'v-mail', 'v-min', 'v-max', 'v-pat', 'v-ta'].map(said)).toEqual([
      'Isi kolom ini.', 'Masukkan alamat email yang benar.', 'Nilai harus 18 atau lebih.', 'Nilai harus 5 atau kurang.', 'Ikuti format yang diminta. Empat angka.', 'Isi kolom ini.']);
    // tooShort is only flagged after people type
    await screen.getByLabelText('Sandi').fill('abc');
    expect(said('v-len')).toBe('Minimal 8 karakter (sekarang 3).');
    // Typing a good value takes the message off: the field is valid again.
    await screen.getByLabelText('Email').fill('a@b.co');
    expect([field('v-mail').validity.valid, field('v-mail').validationMessage]).toEqual([true, '']);
    await screen.getByLabelText('Nama').fill('Ani');
    expect(field('v-req').validity.valid).toBe(true);
  });

  test('English keeps the browser\'s own message; a message the product set itself stays; a controlled value change clears ours', async () => {
    function Controlled() {
      const [v, setV] = React.useState('');
      return <><Input id="v-ctl" aria-label="Ctl" required value={v} onChange={(e) => setV(e.target.value)} /><button type="button" onClick={() => setV('ok')}>Fill</button></>;
    }
    const screen = await render(<>
      <Input id="v-en" aria-label="Name" required />
      <SerupaProvider labels={idLabels}>
        <Input id="v-own" aria-label="Own" required />
        <Controlled />
      </SerupaProvider>
    </>);
    const browser = said('v-en');
    expect(browser).not.toBe('');
    expect(browser).not.toBe('Isi kolom ini.');
    field('v-own').setCustomValidity('Pick a username.');
    expect(said('v-own')).toBe('Pick a username.');
    expect(said('v-ctl')).toBe('Isi kolom ini.');
    await screen.getByRole('button', { name: 'Fill' }).click();
    await expect.poll(() => field('v-ctl').validity.valid).toBe(true);
  });
});

describe('Input mask', () => {
  const caret = (id: string) => [field(id).selectionStart, field(id).selectionEnd];

  test('typing fills the pattern: digits only where it takes digits, its own text shown between them, nothing past its end; the number keyboard for digits only', async () => {
    const seen: string[] = [];
    await render(<Input id="card" aria-label="Card number" mask="9999 9999 9999 9999" onChange={(e) => seen.push(e.target.value)} />);
    await userEvent.click(field('card'));
    await userEvent.keyboard('4242x42424242424242429');
    expect([field('card').value, caret('card'), field('card').inputMode]).toEqual(['4242 4242 4242 4242', [19, 19], 'numeric']);
    expect(seen.slice(0, 6)).toEqual(['4', '42', '424', '4242', '4242', '4242 4']);
  });

  test('an edit in the middle keeps the caret after the same character; Backspace and Delete next to the pattern\'s text remove the typed character beyond it', async () => {
    await render(<Input id="d" aria-label="Date" mask="99/99/9999" defaultValue="01022024" />);
    expect(field('d').value).toBe('01/02/2024');
    await userEvent.click(field('d'));
    field('d').setSelectionRange(1, 1);
    await userEvent.keyboard('9');   // 0 9 | 1 / 0 2 …: everything after moves along one slot
    expect([field('d').value, caret('d')]).toEqual(['09/10/2202', [2, 2]]);
    field('d').setSelectionRange(3, 3);   // just after the first "/"
    await userEvent.keyboard('{Backspace}');
    expect([field('d').value, caret('d')]).toEqual(['01/02/202', [1, 1]]);
    field('d').setSelectionRange(2, 2);   // just before the first "/"
    await userEvent.keyboard('{Delete}');
    expect([field('d').value, caret('d')]).toEqual(['01/22/02', [2, 2]]);
  });

  test('text set at once (a paste, autofill) is laid into the pattern; A makes letters capitals; plain text at the start stays; \\ makes a pattern character plain; value and defaultValue show masked', async () => {
    function Iban() {
      const [v, setV] = React.useState('');
      return <><Input id="iban" aria-label="IBAN" mask="AA99 **** **** ****" value={v} onChange={(e) => setV(e.target.value)} /><output id="held">{v}</output></>;
    }
    await render(<>
      <Iban />
      <Input id="phone" aria-label="Phone" mask="+62 999-9999-9999" defaultValue="81234567890" />
      <Input id="plain" aria-label="Code" mask={'\\9-999'} value="12" onChange={() => {}} />
    </>);
    await userEvent.fill(field('iban'), 'de89 3704-0044.0532');   // all at once, as a paste or autofill comes
    expect([field('iban').value, document.getElementById('held')!.textContent, field('iban').inputMode]).toEqual(['DE89 3704 0044 0532', 'DE89 3704 0044 0532', '']);
    expect([field('phone').value, field('plain').value]).toEqual(['+62 812-3456-7890', '9-12']);
    await userEvent.click(field('phone'));
    field('phone').setSelectionRange(17, 17);
    await userEvent.keyboard('{Backspace}');
    expect(field('phone').value).toBe('+62 812-3456-789');
  });
});
