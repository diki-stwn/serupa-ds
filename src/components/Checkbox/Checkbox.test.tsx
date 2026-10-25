import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { color, css, lowContrast, settle } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { Checkbox, CheckboxGroup } from './Checkbox';

const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const label = (id: string) => input(id).closest('.dk-checkbox') as HTMLElement;

describe('Checkbox', () => {
  test('a native checkbox in a <label class="dk-checkbox">: md is a 16px box with a 1px field border, 4px corners and text-sm', async () => {
    await render(<Checkbox id="md">Newsletter</Checkbox>);
    await settle(300);
    const i = input('md'), s = css(i);
    expect(i.type).toBe('checkbox');
    expect(label('md').tagName).toBe('LABEL');
    expect(label('md').dataset.component).toBe('checkbox');
    expect(label('md').className).toMatch(/dk-checkbox dk-checkbox--size-md/);
    expect([s.appearance, s.width, s.height, s.borderTopWidth, s.borderTopLeftRadius]).toEqual(['none', '16px', '16px', '1px', '4px']);
    expect(s.borderTopColor).toBe(color('var(--field-border)'));
    expect(css(label('md')).fontSize).toBe('14px');
  });

  test('sizes: sm is a 14px box with text-xs, lg 20px with text-base, each centered on the first line; an unknown size falls back to md', async () => {
    await render(<>
      <Checkbox id="sm" size="sm">Small</Checkbox>
      <Checkbox id="lg" size="lg">Large</Checkbox>
      {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
      <Checkbox id="bad" size="xl">Bad</Checkbox>
    </>);
    const mid = (id: string) => {
      const box = input(id).getBoundingClientRect(), text = label(id).querySelector('.dk-checkbox__label')!.getBoundingClientRect();
      const line = Math.min(text.height, parseFloat(css(label(id)).lineHeight));
      return Math.abs(box.top + box.height / 2 - (text.top + line / 2));
    };
    expect([css(input('sm')).width, css(label('sm')).fontSize]).toEqual(['14px', '12px']);
    expect([css(input('lg')).width, css(label('lg')).fontSize]).toEqual(['20px', '16px']);
    expect(mid('sm')).toBeLessThan(1);
    expect(mid('lg')).toBeLessThan(1);
    expect(label('bad').dataset.size).toBe('md');
  });

  test('ref, name, value and attributes go to the <input>; className to the label; type can\'t be changed', async () => {
    const ref = React.createRef<HTMLInputElement>();
    // @ts-expect-error: type isn't a Checkbox prop, but plain JavaScript could pass it
    await render(<Checkbox id="a" ref={ref} name="news" value="yes" className="extra" data-x="y" type="radio">Newsletter</Checkbox>);
    expect(ref.current).toBe(input('a'));
    expect([input('a').type, input('a').name, input('a').value, input('a').dataset.x]).toEqual(['checkbox', 'news', 'yes', 'y']);
    expect(label('a').classList.contains('extra')).toBe(true);
  });

  test('its accessible name is the label alone (not the hidden check or the description), or aria-label without one', async () => {
    await render(<>
      <Checkbox>Newsletter</Checkbox>
      <Checkbox description="Get an email when someone mentions you.">Mentions</Checkbox>
      <Checkbox aria-label="Select row" />
    </>);
    await expect.element(page.getByRole('checkbox', { name: 'Newsletter', exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole('checkbox', { name: 'Mentions', exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole('checkbox', { name: 'Select row', exact: true })).toBeInTheDocument();
  });

  test('a click on the label and Space both toggle a controlled checkbox; checked is the primary fill with the check in on-primary', async () => {
    const changes: boolean[] = [];
    function App() {
      const [on, setOn] = React.useState(false);
      return <Checkbox id="c" checked={on} onChange={(e) => { changes.push(e.target.checked); setOn(e.target.checked); }}>Newsletter</Checkbox>;
    }
    await render(<App />);
    const icon = label('c').querySelector('.dk-checkbox__icon') as HTMLElement;
    expect(css(icon).visibility).toBe('hidden');
    await page.getByText('Newsletter').click();
    await page.getByText('Newsletter').unhover();
    await settle(250);
    expect(input('c').checked).toBe(true);
    expect(changes).toEqual([true]);
    expect(css(input('c')).backgroundColor).toBe(color('var(--primary)'));
    expect(css(input('c')).borderTopColor).toBe(color('var(--primary)'));
    expect(css(icon).visibility).toBe('visible');
    expect(css(icon).color).toBe(color('var(--on-primary)'));
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    input('c').focus();
    await userEvent.keyboard('[Space]');
    // Firefox and WebKit can report back before React has re-rendered the controlled checkbox
    await expect.poll(() => input('c').checked).toBe(false);
  });

  test('indeterminate: a dash on the primary fill (the native mixed state); it follows the prop after a click', async () => {
    function App() {
      const [mixed, setMixed] = React.useState(true);
      return <Checkbox id="m" indeterminate={mixed} onChange={() => setMixed(false)}>Select all</Checkbox>;
    }
    await render(<App />);
    await settle(300);
    const icon = () => input('m').nextElementSibling as HTMLElement;
    expect(input('m').indeterminate).toBe(true);
    expect((icon().querySelector<HTMLElement>('.dk-icon'))?.dataset.icon).toBe('remove');
    expect(css(icon()).visibility).toBe('visible');
    expect(css(input('m')).backgroundColor).toBe(color('var(--primary)'));
    await page.getByText('Select all').click();
    expect(input('m').indeterminate).toBe(false);
    expect(input('m').checked).toBe(true);
    expect((icon().querySelector<HTMLElement>('.dk-icon'))?.dataset.icon).toBe('check');
  });

  test('description: a muted second line under the label, added after the checkbox\'s own aria-describedby', async () => {
    await render(<>
      <Checkbox id="d" description="Get an email when someone mentions you." aria-describedby="outside" defaultChecked>Mentions</Checkbox>
      <span id="outside">Outside</span>
    </>);
    const d = label('d').querySelector('.dk-checkbox__description') as HTMLElement;
    expect(input('d').getAttribute('aria-describedby')).toBe('outside ' + d.id);
    expect(d.textContent).toBe('Get an email when someone mentions you.');
    expect(css(d).color).toBe(color('var(--text-muted)'));
    expect(d.getBoundingClientRect().top).toBeGreaterThanOrEqual(label('d').querySelector('.dk-checkbox__label')!.getBoundingClientRect().bottom - 1);
  });

  test('without a label it is just the 16px box', async () => {
    await render(<Checkbox id="b" aria-label="Select row" />);
    expect(label('b').className).toMatch(/dk-checkbox--bare/);
    expect(label('b').getBoundingClientRect().height).toBe(16);
    expect(label('b').querySelector('.dk-checkbox__text')).toBeNull();
  });

  test('hover darkens the border to field-border-hover', async () => {
    await render(<Checkbox id="h">Hover me</Checkbox>);
    await page.getByText('Hover me').hover();
    await settle(250);
    expect(css(input('h')).borderTopColor).toBe(color('var(--field-border-hover)'));
  });

  test('keyboard focus: a 2px focus-ring outline 2px out, like Button; the gap is transparent, with no box-shadow ring', async () => {
    await render(<><button type="button">Before</button><Checkbox id="f">Focus me</Checkbox></>);
    await page.getByRole('button', { name: 'Before' }).click();
    await userEvent.tab();
    await settle(250);
    const s = css(input('f'));
    expect(`${s.outlineStyle} ${s.outlineColor} ${s.outlineWidth} ${s.outlineOffset} ${s.boxShadow}`).toBe(`solid ${color('var(--focus-ring)')} 2px 2px none`);
  });

  test('invalid: aria-invalid and a danger border', async () => {
    await render(<Checkbox id="i" invalid>Terms</Checkbox>);
    await settle(300);
    expect(input('i').getAttribute('aria-invalid')).toBe('true');
    expect(css(input('i')).borderTopColor).toBe(color('var(--danger)'));
    expect(label('i').className).toMatch(/dk-checkbox--invalid/);
  });

  test('disabled: native disabled at 50% with a not-allowed cursor and a surface-muted box; clicks do nothing', async () => {
    const onChange = vi.fn();
    await render(<Checkbox id="x" disabled onChange={onChange}>Disabled</Checkbox>);
    await settle(300);
    const s = css(label('x'));
    expect([s.opacity, s.cursor]).toEqual(['0.5', 'not-allowed']);
    expect(css(input('x')).backgroundColor).toBe(color('var(--surface-muted)'));
    expect(label('x').className).toMatch(/dk-checkbox--disabled/);
    label('x').click();
    expect(input('x').checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('readOnly: focusable with aria-readonly; a click on the box or label and Space leave it as it was (checked or not), onClick still runs, and a checked box is submitted', async () => {
    const onChange = vi.fn(), onClick = vi.fn();
    await render(<form id="ro-form"><Checkbox id="ro" name="a" readOnly defaultChecked onChange={onChange} onClick={onClick}>Agreed</Checkbox><Checkbox id="ro2" readOnly>Not yet</Checkbox></form>);
    expect([input('ro').getAttribute('aria-readonly'), label('ro').className.includes('dk-checkbox--readonly'), css(label('ro')).cursor]).toEqual(['true', true, 'default']);
    await userEvent.click(label('ro'));
    await userEvent.click(input('ro2'));
    input('ro').focus();
    await userEvent.keyboard(' ');
    expect([input('ro').checked, input('ro2').checked, document.activeElement === input('ro'), onChange.mock.calls.length, onClick.mock.calls.length]).toEqual([true, false, true, 0, 2]);
    expect(new FormData(document.getElementById('ro-form') as HTMLFormElement).get('a')).toBe('on');
  });

  test('readOnly and controlled (checked without onChange): no React warning, and it stays checked', async () => {
    const warned: unknown[] = [], warn = console.error;
    console.error = (...a: unknown[]) => { warned.push(a[0]); };
    try { await render(<Checkbox id="roc" checked readOnly>Locked</Checkbox>); } finally { console.error = warn; }
    await userEvent.click(label('roc'));
    expect([input('roc').checked, warned]).toEqual([true, []]);
  });

  test('in a Field: described and invalid with the error; in a disabled Field group every checkbox is disabled and dimmed', async () => {
    await render(<>
      <Field label="Agreement" error="Accept the terms to go on."><Checkbox id="fld">I accept the terms</Checkbox></Field>
      <Field label="Notify me" group disabled><Checkbox id="g1">Email</Checkbox><Checkbox id="g2">SMS</Checkbox></Field>
    </>);
    expect([...(input('fld').labels || [])].map((l) => l.textContent).join('|')).toMatch(/I accept the terms/);
    expect(input('fld').getAttribute('aria-invalid')).toBe('true');
    expect(label('fld').className).toMatch(/dk-checkbox--invalid/);
    expect(input('fld').getAttribute('aria-describedby')).toBeTruthy();
    expect(css(label('g1')).opacity).toBe('0.5');
    expect(input('g2').matches(':disabled')).toBe(true);
  });

  test('contrast in all six themes: label and description 4.5:1; border, checked fill, focus ring and invalid border 3:1; the check 4.5:1 on its fill', () => {
    expect(lowContrast([
      ['label', 'var(--text)', 'var(--surface)', 4.5],
      ['description', 'var(--text-muted)', 'var(--surface)', 4.5],
      ['border', 'var(--field-border)', 'var(--field)', 3],
      ['border on page', 'var(--field-border)', 'var(--surface)', 3],
      ['checked fill', 'var(--primary)', 'var(--surface)', 3],
      ['check on fill', 'var(--on-primary)', 'var(--primary)', 4.5],
      ['check on hover fill', 'var(--on-primary)', 'var(--primary-hover)', 4.5],
      ['focus ring', 'var(--focus-ring)', 'var(--surface)', 3],
      ['invalid border', 'var(--danger)', 'var(--surface)', 3],
    ])).toEqual([]);
  });
});

describe('CheckboxGroup', () => {
  const box = (v: string) => document.querySelector<HTMLInputElement>(`#grp input[value="${v}"]`)!;
  const all = () => document.querySelector<HTMLInputElement>('#grp .dk-checkbox:first-child input')!;

  test('a named group: one name for every box, values in the boxes\' order, numbers stay numbers, and size, invalid and disabled reach the boxes', async () => {
    const seen: unknown[] = [];
    function App() {
      const [v, set] = React.useState<number[]>([]);
      return <CheckboxGroup id="grp" aria-label="Days" value={v} onValueChange={(n) => { seen.push(n); set(n); }} size="sm" invalid>
        <Checkbox value={1}>Mon</Checkbox><Checkbox value={2}>Tue</Checkbox><Checkbox value={3} disabled>Wed</Checkbox>
      </CheckboxGroup>;
    }
    await render(<App />);
    const g = document.getElementById('grp')!;
    expect([g.getAttribute('role'), g.getAttribute('aria-invalid'), g.dataset.component]).toEqual(['group', 'true', 'checkbox-group']);
    const names = [...g.querySelectorAll('input')].map((i) => i.name);
    expect(new Set(names).size).toBe(1);
    expect(names[0]).not.toBe('');
    expect([...g.querySelectorAll('.dk-checkbox')].map((l) => [l.getAttribute('data-size'), l.classList.contains('dk-checkbox--invalid')])).toEqual([['sm', true], ['sm', true], ['sm', true]]);
    await userEvent.click(box('2'));
    await userEvent.click(box('1'));
    await userEvent.click(box('2'));
    expect(seen).toEqual([[2], [1, 2], [1]]);
    expect([box('1').checked, box('2').checked, box('3').disabled]).toEqual([true, false, true]);
  });

  test('selectAll: unchecked with none, indeterminate (announced as mixed) with some, checked with all; a click checks every enabled box, then clears them, and leaves a disabled box as it is', async () => {
    const seen: string[][] = [];
    await render(<CheckboxGroup id="grp" aria-label="Toppings" defaultValue={['olives']} onValueChange={(v) => { seen.push(v); }}>
      <Checkbox selectAll>All toppings</Checkbox>
      <Checkbox value="cheese">Cheese</Checkbox><Checkbox value="ham">Ham</Checkbox><Checkbox value="olives" disabled>Olives</Checkbox>
    </CheckboxGroup>);
    expect([all().checked, all().indeterminate, all().name]).toEqual([false, false, '']);
    await userEvent.click(box('cheese'));
    expect([all().checked, all().indeterminate]).toEqual([false, true]);
    await userEvent.click(all());
    expect([all().checked, all().indeterminate, box('cheese').checked, box('ham').checked, box('olives').checked]).toEqual([true, false, true, true, true]);
    await userEvent.click(all());
    expect([all().checked, box('cheese').checked, box('ham').checked, box('olives').checked]).toEqual([false, false, false, true]);
    expect(seen).toEqual([['cheese', 'olives'], ['cheese', 'ham', 'olives'], ['olives']]);
  });

  test('required means at least one: every box is required (and the form won\'t submit) until one is checked; then none is', async () => {
    await render(<form id="rq"><CheckboxGroup id="grp" aria-label="Contact" name="via" required>
      <Checkbox value="mail">Email</Checkbox><Checkbox value="sms">SMS</Checkbox>
    </CheckboxGroup></form>);
    const form = document.getElementById('rq') as HTMLFormElement;
    expect([document.getElementById('grp')!.getAttribute('aria-required'), box('mail').required, box('sms').required, form.checkValidity()]).toEqual(['true', true, true, false]);
    await userEvent.click(box('sms'));
    expect([box('mail').required, box('sms').required, form.checkValidity()]).toEqual([false, false, true]);
  });

  test('a form gets every checked value under the name, and a reset brings back defaultValue', async () => {
    await render(<form id="fr"><CheckboxGroup id="grp" aria-label="Tags" name="tags" defaultValue={['a']}>
      <Checkbox value="a">A</Checkbox><Checkbox value="b">B</Checkbox><Checkbox value="c">C</Checkbox>
    </CheckboxGroup></form>);
    const form = document.getElementById('fr') as HTMLFormElement;
    await userEvent.click(box('c'));
    expect(new FormData(form).getAll('tags')).toEqual(['a', 'c']);
    form.reset();
    await expect.poll(() => new FormData(form).getAll('tags')).toEqual(['a']);
    expect(box('c').checked).toBe(false);
  });

  test('disabled: every box and select-all are disabled, and the group says aria-disabled', async () => {
    await render(<CheckboxGroup id="grp" aria-label="Off" disabled defaultValue={['x']}><Checkbox selectAll>All</Checkbox><Checkbox value="x">X</Checkbox><Checkbox value="y">Y</Checkbox></CheckboxGroup>);
    expect([document.getElementById('grp')!.getAttribute('aria-disabled'), all().disabled, box('x').disabled, box('y').disabled]).toEqual(['true', true, true, true]);
  });

  test('in a Field group: the legend names the group, and the boxes keep their own labels', async () => {
    await render(<Field label="Notify me about" group><CheckboxGroup id="grp"><Checkbox value="a">Replies</Checkbox><Checkbox value="b">Mentions</Checkbox></CheckboxGroup></Field>);
    await expect.element(page.getByRole('group', { name: 'Notify me about' })).toBeInTheDocument();
    await expect.element(page.getByRole('checkbox', { name: 'Replies' })).toBeInTheDocument();
    await expect.element(page.getByRole('checkbox', { name: 'Mentions' })).toBeInTheDocument();
  });
});
