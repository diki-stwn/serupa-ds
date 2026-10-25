import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { color, css, lowContrast, settle } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Input } from './Input';

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const box = (id: string) => field(id).parentElement as HTMLElement;
const count = (id: string) => box(id).querySelector('.dk-input__count') as HTMLElement;
const announcer = () => document.querySelector<HTMLElement>('[data-dk-announcer]');

describe('Input', () => {
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
    await settle(300);
    const danger = color('var(--danger)');
    expect(field('i').getAttribute('aria-invalid')).toBe('true');
    expect(css(box('i')).borderTopColor).toBe(danger);
    field('i').focus();
    await settle(250);
    expect(css(box('i')).boxShadow).toContain(danger);
  });

  test('read-only: a surface-muted background, still focusable; disabled: native disabled, 50%, not-allowed', async () => {
    await render(<>
      <Input id="plain" aria-label="Plain" />
      <Input id="ro" readOnly defaultValue="INV-1" aria-label="Read-only" />
      <Input id="dis" disabled aria-label="Disabled" />
    </>);
    await settle(300);
    expect(css(box('ro')).backgroundColor).not.toBe(css(box('plain')).backgroundColor);
    expect(box('ro').className).toMatch(/readonly/);
    field('ro').focus();
    expect(document.activeElement).toBe(field('ro'));
    expect(field('dis').disabled).toBe(true);
    expect(css(box('dis')).opacity).toBe('0.5');
    expect(box('dis').className).toMatch(/disabled/);
    expect(css(field('dis')).cursor).toBe('not-allowed');
  });

  test('icons: decorative, 16px at md, before and after the field, and they don\'t take clicks', async () => {
    await render(<Input id="ic" leftIcon="search" rightIcon="mail" aria-label="Icons" />);
    const w = box('ic'), l = w.querySelector('.dk-input__icon--left')!, r = w.querySelector('.dk-input__icon--right')!;
    expect([...w.children].map((c) => c.className.split(' ')[0])).toEqual(['dk-input__icon', 'dk-input__field', 'dk-input__icon']);
    expect(w.firstElementChild).toBe(l);
    expect(w.lastElementChild).toBe(r);
    expect([l.getAttribute('aria-hidden'), r.getAttribute('aria-hidden')]).toEqual(['true', 'true']);
    expect(css(l.querySelector('.dk-icon')).fontSize).toBe('16px');
    expect(css(l).pointerEvents).toBe('none');
  });

  test('contrast in all six themes: text and placeholder 4.5:1 on the field; border, focus ring and invalid border 3:1', () => {
    expect(lowContrast([
      ['text', 'var(--text)', 'var(--field)', 4.5],
      ['placeholder', 'var(--placeholder)', 'var(--field)', 4.5],
      ['border', 'var(--field-border)', 'var(--field)', 3],
      ['border on page', 'var(--field-border)', 'var(--surface)', 3],
      ['focus', 'var(--focus-ring)', 'var(--surface)', 3],
      ['invalid', 'var(--danger)', 'var(--field)', 3],
    ])).toEqual([]);
  });

  test('showCount: "2 / 5" at the end of the field, linked by aria-describedby after the field\'s own; stops at maxLength and turns text-colored', async () => {
    await render(<><span id="hint">Up to 5</span><Input id="cnt" showCount maxLength={5} defaultValue="ab" aria-describedby="hint" aria-label="Code" rightIcon={<b>i</b>} /></>);
    const c0 = count('cnt'), col0 = css(c0).color;
    expect([c0.textContent, field('cnt').getAttribute('aria-describedby'), c0.nextElementSibling!.className, field('cnt').hasAttribute('maxlength')]).toEqual(['2 / 5', 'hint ' + c0.id, 'dk-input__icon dk-input__icon--right', false]);
    await userEvent.type(field('cnt'), 'cdefg');
    expect([field('cnt').value, count('cnt').textContent, count('cnt').classList.contains('dk-input__count--full')]).toEqual(['abcde', '5 / 5', true]);
    expect(css(count('cnt')).color).not.toBe(col0);
  });

  test('maxLength counts the characters people see: an emoji family and a flag are one each', async () => {
    await render(<Input id="emo" showCount maxLength={3} defaultValue="👨‍👩‍👧🇮🇩" aria-label="Emoji" />);
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
    await render(<form id="f"><Input id="rs" showCount maxLength={10} defaultValue="ab" aria-label="Reset" /></form>);
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
});
