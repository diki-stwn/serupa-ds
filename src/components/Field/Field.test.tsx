import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { css, lowContrast } from '../../../tools/test/vitest/helpers';
import { page, userEvent } from 'vitest/browser';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { Combobox } from '../Combobox/Combobox';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Slider } from '../Slider/Slider';
import { Input } from '../Input/Input';
import { Radio, RadioGroup } from '../Radio/Radio';
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
    const f = el('plain').closest('[data-component="field"]') as HTMLElement;
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
    const f = el('mail').closest('[data-component="field"]') as HTMLElement;
    const ids = described('mail');
    expect(ids[0]).toBe('own');
    expect(document.getElementById(ids[1])?.textContent).toBe('For receipts.');
    expect(document.getElementById(ids[2])?.textContent).toBe('Enter an email address.');
    expect(el('mail').getAttribute('aria-invalid')).toBe('true');
    expect(el('mail').parentElement?.className).toMatch(/dk-input--invalid/);
    expect(el('mail').getAttribute('aria-required')).toBe('true');
    expect(f.querySelector('label > span[aria-hidden]')?.getAttribute('aria-hidden')).toBe('true');
    expect([...f.children].map((c) => c.className.split(' ')[0])).toEqual(['dk-field__label', 'dk-field__hint', 'dk-field__control', 'dk-field__error']);
    expect((f.querySelector<HTMLElement>('[data-icon] + span[id]')?.previousElementSibling as HTMLElement | null)?.dataset.icon).toBe('error');

    await screen.getByRole('button', { name: 'Clear' }).click();
    expect(described('mail')).toHaveLength(2);
    expect(el('mail').getAttribute('aria-invalid')).toBeNull();
    expect(f.querySelector('[data-icon="error"]')).toBeNull();
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
    expect(css(el('locked').closest('[data-component="field"]')!.querySelector('label')).opacity).toBe('0.5');
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

  test('group required: the * stays hidden and the legend says "Required" in words, so the group is read as required whatever it holds; in the provider\'s words; not shown (FR1)', async () => {
    await render(<>
      <Field group required label="Contact by"><RadioGroup><Radio value="e">Email</Radio><Radio value="p">Phone</Radio></RadioGroup></Field>
      <Field group required label="Extras"><label><input type="checkbox" id="x1" />Gift wrap</label></Field>
      <SerupaProvider labels={idLabels}><Field group required label="Kontak"><label><input type="checkbox" />Surel</label></Field></SerupaProvider>
      <Field group label="Optional set"><label><input type="checkbox" />Nothing</label></Field>
    </>);
    for (const name of ['Contact by Required', 'Extras Required', 'Kontak Wajib diisi']) await expect.element(page.getByRole('group', { name, exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole('group', { name: 'Optional set', exact: true })).toBeInTheDocument();
    const legend = el('x1').closest('fieldset')!.querySelector('legend')!, said = legend.lastElementChild as HTMLElement;
    expect([css(said).position, Math.round(said.getBoundingClientRect().width) <= 1]).toEqual(['absolute', true]);
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

  test('clicking the label of a Slider, SegmentedControl or ColorPicker focuses it (their root is a <div>, which a label can\'t focus by itself) (AK1)', async () => {
    await render(<>
      <Field label="Volume"><Slider defaultValue={30} /></Field>
      <Field label="View"><SegmentedControl options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} defaultValue="week" /></Field>
      <Field label="Tag color"><ColorPicker swatches={['#1d4ed8', '#16a34a']} defaultValue="#16a34a" /></Field>
    </>);
    const label = (t: string) => [...document.querySelectorAll('label')].find((l) => l.textContent === t)!;
    await userEvent.click(label('Volume'));
    expect(document.activeElement?.getAttribute('role')).toBe('slider');
    await userEvent.click(label('View'));
    expect([document.activeElement?.getAttribute('role'), document.activeElement?.textContent]).toEqual(['radio', 'Week']);
    await userEvent.click(label('Tag color'));
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true');
  });

  test('with an error, the control points at it with aria-errormessage too (the description keeps it, for screen readers that skip aria-errormessage), directly or at any depth (J12)', async () => {
    const r = await render(<>
      <Field label="Email" error="Enter an email address"><input id="em" /></Field>
      <Field label="Name" error="Required"><Tooltip content="Your full name"><Input id="nm" /></Tooltip></Field>
    </>);
    for (const id of ['em', 'nm']) {
      const c = document.getElementById(id)!;
      const msg = c.getAttribute('aria-errormessage');
      expect([!!msg && document.getElementById(msg)?.textContent, (c.getAttribute('aria-describedby') || '').split(' ').includes(msg || '-')]).toEqual([id === 'em' ? 'Enter an email address' : 'Required', true]);
    }
    await r.rerender(<Field label="Email"><input id="em" /></Field>);
    expect(document.getElementById('em')!.hasAttribute('aria-errormessage')).toBe(false);
  });

  test('layout="horizontal" (D17): the label in a 192px column on the control\'s first line (baselines aligned), 16px from it; hint and error under the control; still named and described', async () => {
    await render(<div style={{ width: '560px' }}>
      <Field id="h-in" layout="horizontal" label="Display name" hint="Shown on your profile." error="Too short.">
        <Input defaultValue="An" />
      </Field>
    </div>);
    const f = el('h-in').closest('[data-component="field"]') as HTMLElement;
    const [hintId, errorId] = described('h-in');
    const label = el('h-in').labels![0].getBoundingClientRect(), box = el('h-in').parentElement!.getBoundingClientRect();
    const hint = document.getElementById(hintId)!.getBoundingClientRect(), error = document.getElementById(errorId)!.getBoundingClientRect();
    expect([f.dataset.layout, Math.round(label.width), Math.round(box.left - label.right), Math.round(box.width)]).toEqual(['horizontal', 192, 16, 560 - 192 - 16]);
    // the label's text sits on the input's text line
    const text = document.createRange(); text.selectNodeContents(el('h-in').labels![0].firstChild!);
    const input = el('h-in').getBoundingClientRect();
    expect(Math.abs((text.getBoundingClientRect().top + text.getBoundingClientRect().bottom) / 2 - (input.top + input.bottom) / 2)).toBeLessThan(2);
    expect([hint.top >= box.bottom, error.top >= hint.bottom, Math.round(hint.left) === Math.round(box.left)]).toEqual([true, true, true]);
    expect([el('h-in').labels![0].textContent, described('h-in').length, el('h-in').getAttribute('aria-invalid')]).toEqual(['Display name', 2, 'true']);
  });

  test('layout="horizontal" stacks again when the field is narrower than both columns, and is ignored with group', async () => {
    await render(<>
      <div style={{ width: '300px' }}><Field id="h-narrow" layout="horizontal" label="Display name"><Input /></Field></div>
      <div style={{ width: '560px' }}><Field group layout="horizontal" label="Plan" data-testid="h-group"><RadioGroup name="p"><Radio value="a">A</Radio></RadioGroup></Field></div>
    </>);
    const label = el('h-narrow').labels![0].getBoundingClientRect(), box = el('h-narrow').parentElement!.getBoundingClientRect();
    expect([box.top >= label.bottom, Math.round(box.left), Math.round(box.width)]).toEqual([true, Math.round(label.left), 300]);
    const g = document.querySelector('[data-testid="h-group"]') as HTMLElement;
    expect([g.tagName, g.classList.contains('dk-field--horizontal'), g.dataset.layout]).toEqual(['FIELDSET', false, undefined]);
  });
});


describe('Field inside a shadow root (GR60)', () => {
  test('clicking the label of a Slider focuses its thumb, and nothing warns that the label names nothing or the Slider has no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      await render(<Field label="Shadow volume"><Slider defaultValue={30} /></Field>, { container: inner });
      const root = host.shadowRoot!;
      await userEvent.click(root.querySelector<HTMLElement>('label')!);
      expect([root.activeElement?.getAttribute('role'), warn.mock.calls.map((c) => String(c[0])).filter((m) => /names nothing|no accessible name/.test(m))]).toEqual(['slider', []]);
    } finally { host.remove(); warn.mockRestore(); }
  });
});
