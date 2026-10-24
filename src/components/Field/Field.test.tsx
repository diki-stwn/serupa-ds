import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { css, lowContrast } from '../../../tools/test/vitest/helpers';
import { Combobox } from '../Combobox/Combobox';
import { Input } from '../Input/Input';
import { Tooltip } from '../Tooltip/Tooltip';
import { Textarea } from '../Textarea/Textarea';
import { Field } from './Field';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const announcer = () => document.querySelector('[data-dk-announcer]') as HTMLElement;

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const described = (id: string) => (el(id).getAttribute('aria-describedby') || '').split(' ').filter(Boolean);

describe('Field', () => {
  test('the label names the control (Field\'s id becomes the control\'s id); the ref still reaches it; className and attributes go to the outer element; the label is font-medium', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Field id="plain" label="Name" className="extra" data-x="y"><Input ref={ref} /></Field>);
    const f = el('plain').closest('.dk-field') as HTMLElement;
    expect(ref.current).toBe(el('plain'));
    expect(el('plain').labels?.[0].textContent).toBe('Name');
    expect(f.className).toMatch(/dk-field extra/);
    expect([f.dataset.x, f.dataset.component]).toEqual(['y', 'field']);
    expect(css(f.querySelector('label')).fontWeight).toBe('500');
    expect(el('plain').getAttribute('aria-describedby')).toBeNull();
    expect(el('plain').getAttribute('aria-invalid')).toBeNull();
  });

  test('hint and error join the control\'s own aria-describedby; the error makes an Input invalid; required adds aria-required and a hidden *', async () => {
    function App() {
      const [err, setErr] = React.useState<string | null>('Enter an email address.');
      return <>
        <Field label="Email" hint="For receipts." error={err} required><Input id="mail" aria-describedby="own" /></Field>
        <p id="own">own</p>
        <button type="button" onClick={() => setErr(null)}>Clear</button>
      </>;
    }
    const screen = await render(<App />);
    const f = el('mail').closest('.dk-field') as HTMLElement;
    const ids = described('mail');
    expect(ids[0]).toBe('own');
    expect(document.getElementById(ids[1])?.textContent).toBe('For receipts.');
    expect(document.getElementById(ids[2])?.textContent).toBe('Enter an email address.');
    expect(el('mail').getAttribute('aria-invalid')).toBe('true');
    expect(el('mail').parentElement?.className).toMatch(/dk-input--invalid/);
    expect(el('mail').getAttribute('aria-required')).toBe('true');
    expect(f.querySelector('.dk-field__required')?.getAttribute('aria-hidden')).toBe('true');
    expect([...f.children].map((c) => c.className.split(' ')[0])).toEqual(['dk-field__label', 'dk-field__hint', 'dk-field__control', 'dk-field__error']);
    expect((f.querySelector('.dk-field__error .dk-icon') as HTMLElement | null)?.dataset.icon).toBe('error');

    await screen.getByRole('button', { name: 'Clear' }).click();
    expect(described('mail')).toHaveLength(2);
    expect(el('mail').getAttribute('aria-invalid')).toBeNull();
    expect(f.querySelector('.dk-field__error')).toBeNull();
  });

  test('optional adds "(optional)" or your words; a plain DOM control gets aria-invalid, never an unknown invalid attribute', async () => {
    await render(<>
      <Field label="Notes" optional><Textarea id="notes" /></Field>
      <Field label="Code" optional="Leave blank if none"><input id="native" /></Field>
      <Field label="Native bad" error="Bad"><input id="native-bad" /></Field>
    </>);
    expect(el('notes').labels?.[0].textContent).toBe('Notes(optional)');
    expect(el('native').labels?.[0].textContent).toBe('CodeLeave blank if none');
    expect(el('native-bad').getAttribute('aria-invalid')).toBe('true');
    expect(el('native-bad').hasAttribute('invalid')).toBe(false);
  });

  test('the default "(optional)" comes from the labels: Indonesian under an id-ID provider', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Field label="Catatan" optional><input id="opt-id" /></Field></SerupaProvider>);
    expect(el('opt-id').labels?.[0].textContent).toBe('Catatan(opsional)');
  });

  test('an error that appears or changes after mount is announced politely; one there from the start, or unchanged on a re-render, is not', async () => {
    function Form({ error }: { error?: string }) { return <Field label="Email" error={error}><input id="ann" /></Field>; }
    const r = await render(<Form error="Already there" />);
    await r.rerender(<Form error="Already there" />);
    await new Promise((ok) => setTimeout(ok, 700));
    expect(announcer().textContent).not.toContain('Already there');
    await r.rerender(<Form />);
    await r.rerender(<Form error="Enter an email address like name@example.com" />);
    await expect.poll(() => announcer().textContent).toBe('Enter an email address like name@example.com');
    await r.rerender(<Form error="Use a work address" />);
    await expect.poll(() => announcer().textContent).toBe('Use a work address');
  });

  test('the shared announcer is hidden without the utilities stylesheet (inline styles, not only the sr-only class)', async () => {
    await render(<Field label="X"><input id="hid" /></Field>);
    const a = announcer();
    expect([a.style.position, a.style.width, a.style.clipPath, a.style.overflow]).toEqual(['absolute', '1px', 'inset(50%)', 'hidden']);
  });

  test('a label whose control id is nowhere on the page warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Field label="Lost" id="nowhere-xyz">Just text</Field>);
    await expect.poll(() => warn.mock.calls.some((c) => String(c[0]).includes('nowhere-xyz'))).toBe(true);
    warn.mockRestore();
  });

  test('a native <select> as the direct child is the control, options and all: the label names it, the hint and error describe it, aria-invalid and aria-required', async () => {
    await render(<Field label="Size" hint="Pick one" error="Required" required><select><option value="">Choose</option><option>S</option></select></Field>);
    const s = document.querySelector('select')!;
    expect([s.labels?.[0].textContent?.replaceAll('*', ''), s.getAttribute('aria-invalid'), s.getAttribute('aria-required'), (s.getAttribute('aria-describedby') || '').split(' ').length]).toEqual(['Size', 'true', 'true', 2]);
  });

  test('disabled disables the control and dims the label', async () => {
    await render(<Field label="Locked" disabled><Input id="locked" /></Field>);
    expect(el('locked').disabled).toBe(true);
    expect(css(el('locked').closest('.dk-field')!.querySelector('.dk-field__label')).opacity).toBe('0.5');
  });

  test('group: a <fieldset> whose <legend> lays out like a label; the hint and error describe the fieldset; controls keep their ids; a disabled group disables every control', async () => {
    await render(<>
      <Field group label="Plan" hint="Pick one." error="Choose a plan." id="grp">
        <label><input type="radio" name="p" id="r1" />Free</label>
        <label><input type="radio" name="p" id="r2" />Pro</label>
      </Field>
      <Field group label="Off" disabled><input type="checkbox" id="c1" /></Field>
    </>);
    const fs = el('r1').closest('fieldset') as HTMLFieldSetElement, legend = fs.querySelector('legend')!;
    expect(fs.className).toMatch(/dk-field--group/);
    expect(legend.textContent).toBe('Plan');
    expect((fs.getAttribute('aria-describedby') || '').split(' ').map((i) => document.getElementById(i)?.textContent)).toEqual(['Pick one.', 'Choose a plan.']);
    expect(el('r1').id).toBe('r1');
    expect(css(fs).borderTopWidth).toBe('0px');
    expect(fs.querySelector('.dk-field__hint')!.getBoundingClientRect().top).toBeGreaterThanOrEqual(legend.getBoundingClientRect().bottom);
    expect(el('c1').matches(':disabled')).toBe(true);
  });

  test('no React warnings', async () => {
    const error = vi.spyOn(console, 'error'), warn = vi.spyOn(console, 'warn');
    await render(<>
      <Field label="Email" hint="Hint" error="Error" required><Input /></Field>
      <Field label="Native" error="Bad"><input /></Field>
      <Field group label="Group" disabled><input type="checkbox" /></Field>
    </>);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    error.mockRestore(); warn.mockRestore();
  });

  test('contrast in all six themes: label, hint, error and * at 4.5:1 on surface (the error on surface-muted too)', () => {
    expect(lowContrast([
      ['label', 'var(--text)', 'var(--surface)', 4.5],
      ['hint', 'var(--text-muted)', 'var(--surface)', 4.5],
      ['error', 'var(--danger-text)', 'var(--surface)', 4.5],
      ['error on muted', 'var(--danger-text)', 'var(--surface-muted)', 4.5],
      ['required', 'var(--danger-text)', 'var(--surface)', 4.5],
    ])).toEqual([]);
  });

  // The control can sit inside a Tooltip, your own wrapper or a form library's component: Field still wires it.
  test('a control at any depth gets the id, the hint and error, required and invalid, and its label names it', async () => {
    function EmailInput(p: React.ComponentProps<typeof Input>) { return <div className="wrap"><Input type="email" {...p} /></div>; }
    await render(<>
      <Field label="Email" hint="Work address" error="Required" required><Tooltip content="We never share it"><EmailInput /></Tooltip></Field>
      <Field id="deep" label="Phone" hint="Mobile"><div><span><Input /></span></div></Field>
    </>);
    const input = document.querySelector('.wrap input') as HTMLInputElement;
    expect([input.labels?.[0]?.textContent?.replace(/\*/g, ''), input.getAttribute('aria-required'), input.getAttribute('aria-invalid')]).toEqual(['Email', 'true', 'true']);
    const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    expect(ids.map((i) => document.getElementById(i)?.textContent)).toEqual(expect.arrayContaining(['Work address', 'Required']));
    expect([el('deep').labels?.[0]?.textContent, document.getElementById(described('deep')[0])?.textContent]).toEqual(['Phone', 'Mobile']);
  });

  test('a direct child component isn\'t described twice; a group Field inside a Field doesn\'t take its id', async () => {
    await render(<>
      <Field id="once" label="Name" hint="As on your ID"><Input /></Field>
      <Field id="outer" label="Outer" hint="Outer hint"><div><Field group label="Inner"><Input id="inner" /></Field></div></Field>
    </>);
    expect(described('once')).toHaveLength(1);
    expect([el('inner').id, el('inner').getAttribute('aria-describedby')]).toEqual(['inner', null]);
  });

  test('a Combobox\'s listbox is named by the Field label', async () => {
    await render(<Field label="Country"><Combobox options={['Indonesia', 'Japan']} /></Field>);
    const list = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(document.getElementById(list.getAttribute('aria-labelledby') || '')?.textContent).toBe('Country');
  });
});
