// One form contract for every control that takes a name (F10): each one, as a native field does,
//  - submits its value under its name with the form around it,
//  - submits with a form elsewhere on the page through form="…",
//  - goes back to its default on form.reset() after a change,
//  - in a <fieldset disabled>, submits nothing and is skipped by Tab.
// The single-feature tests (useFormReset, formAttribute) cover a few controls each; this runs the same four checks
// over the whole list, so a new control is added to CONTROLS and can't quietly skip one.
import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type * as lib from '../index';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { ColorPicker } from '../components/ColorPicker/ColorPicker';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { FileUpload } from '../components/FileUpload/FileUpload';
import { Input } from '../components/Input/Input';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { PinInput } from '../components/PinInput/PinInput';
import { Radio, RadioGroup } from '../components/Radio/Radio';
import { SearchInput } from '../components/SearchInput/SearchInput';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Select } from '../components/Select/Select';
import { Slider } from '../components/Slider/Slider';
import { Switch } from '../components/Switch/Switch';
import { TableSelectCell } from '../components/Table/Table';
import { Textarea } from '../components/Textarea/Textarea';
import { TimePicker } from '../components/TimePicker/TimePicker';

type Sent = Record<string, string>;
interface Control {
  /** The control with its name(s) and default; `form` is passed through when set. */
  el: (form?: string) => React.ReactElement;
  /** What it submits at first. */
  initial: Sent;
  /** Changes it as people do, inside `root`; and what it submits then. Left out for a control that is only
   *  controlled (FileUpload), whose reset is the app's, as with a controlled native field. */
  change?: (root: HTMLElement) => Promise<void>;
  changed?: Sent;
}

const $ = (root: HTMLElement, sel: string) => root.querySelector(sel) as HTMLElement;
const fill = async (el: HTMLElement, text: string) => {
  await userEvent.clear(el);
  await userEvent.type(el, text);
  await userEvent.keyboard('{Enter}');
  el.blur();
};
const file = new File(['x'], 'notes.txt', { type: 'text/plain' });

// Every component that takes a name prop (or startName), from the package's own exports: a new one fails the typecheck here until
// it's in the table, either with its checks or with why its name isn't a form value.
type Named = { [K in keyof typeof lib]: (typeof lib)[K] extends React.JSXElementConstructor<infer P> ? ([Extract<keyof P, 'name' | 'startName'>] extends [never] ? never : K) : never }[keyof typeof lib];

const CONTROLS: { [K in Named]: Control | string } = {
  Input: { el: (form) => <Input aria-label="Title" name="title" form={form} defaultValue="Apollo" />, initial: { title: 'Apollo' },
    change: (r) => fill($(r, 'input'), 'Gemini'), changed: { title: 'Gemini' } },
  Textarea: { el: (form) => <Textarea aria-label="Notes" name="notes" form={form} defaultValue="One" />, initial: { notes: 'One' },
    change: async (r) => { await userEvent.clear($(r, 'textarea')); await userEvent.type($(r, 'textarea'), 'Two'); }, changed: { notes: 'Two' } },
  PasswordInput: { el: (form) => <PasswordInput aria-label="Password" name="pw" form={form} defaultValue="secret" />, initial: { pw: 'secret' },
    change: (r) => fill($(r, 'input'), 'hunter2'), changed: { pw: 'hunter2' } },
  SearchInput: { el: (form) => <SearchInput aria-label="Search" name="q" form={form} defaultValue="cats" />, initial: { q: 'cats' },
    change: (r) => fill($(r, 'input'), 'dogs'), changed: { q: 'dogs' } },
  NumberInput: { el: (form) => <NumberInput aria-label="Seats" name="seats" form={form} defaultValue={3} />, initial: { seats: '3' },
    change: async (r) => { $(r, 'input').focus(); await userEvent.keyboard('{ArrowUp}'); $(r, 'input').blur(); }, changed: { seats: '4' } },
  PinInput: { el: (form) => <PinInput aria-label="Code" name="code" form={form} length={4} defaultValue="12" />, initial: { code: '12' },
    change: (r) => userEvent.fill($(r, 'input'), '9876'), changed: { code: '9876' } },
  PhoneInput: { el: (form) => <PhoneInput aria-label="Phone" name="phone" form={form} defaultCountry="US" defaultValue="+12015550123" />, initial: { phone: '+12015550123' },
    change: (r) => fill($(r, 'input[type="tel"]'), '2015550199'), changed: { phone: '+12015550199' } },
  Select: { el: (form) => <Select aria-label="Size" name="size" form={form} options={['S', 'M', 'L']} defaultValue="M" />, initial: { size: 'M' },
    change: async (r) => { await userEvent.selectOptions($(r, 'select'), 'L'); }, changed: { size: 'L' } },
  Checkbox: { el: (form) => <Checkbox name="terms" value="yes" form={form} defaultChecked>Agree</Checkbox>, initial: { terms: 'yes' },
    change: async (r) => { await userEvent.click($(r, 'input')); }, changed: {} },
  Switch: { el: (form) => <Switch name="alerts" value="on" form={form} defaultChecked>Alerts</Switch>, initial: { alerts: 'on' },
    change: async (r) => { await userEvent.click($(r, 'input')); }, changed: {} },
  RadioGroup: { el: (form) => <RadioGroup aria-label="Plan" name="plan" defaultValue="free"><Radio value="free" form={form}>Free</Radio><Radio value="pro" form={form}>Pro</Radio></RadioGroup>, initial: { plan: 'free' },
    change: async (r) => { await userEvent.click($(r, 'input[value="pro"]')); }, changed: { plan: 'pro' } },
  Radio: { el: (form) => <><Radio name="size" value="s" form={form} defaultChecked>S</Radio><Radio name="size" value="m" form={form}>M</Radio></>, initial: { size: 's' },
    change: async (r) => { await userEvent.click($(r, 'input[value="m"]')); }, changed: { size: 'm' } },
  TableSelectCell: { el: (form) => <table><tbody><tr><TableSelectCell label="Select Alpha" name="rows" value="alpha" form={form} defaultChecked /><td>Alpha</td></tr></tbody></table>, initial: { rows: 'alpha' },
    change: async (r) => { await userEvent.click($(r, 'input')); }, changed: {} },
  Slider: { el: (form) => <Slider aria-label="Volume" name="volume" form={form} defaultValue={30} />, initial: { volume: '30' },
    change: async (r) => { $(r, '[role="slider"]').focus(); await userEvent.keyboard('{End}'); }, changed: { volume: '100' } },
  SegmentedControl: { el: (form) => <SegmentedControl aria-label="View" name="view" form={form} options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} defaultValue="list" />, initial: { view: 'list' },
    change: async (r) => { await userEvent.click($(r, '[role="radio"][aria-checked="false"]')); }, changed: { view: 'grid' } },
  Combobox: { el: (form) => <Combobox aria-label="Fruit" name="fruit" form={form} options={['Apple', 'Banana', 'Cherry']} defaultValue="Apple" />, initial: { fruit: 'Apple' },
    change: async (r) => { await userEvent.click($(r, 'input')); await userEvent.click($(document.body, '[role="option"]:last-child')); }, changed: { fruit: 'Cherry' } },
  DatePicker: { el: (form) => <DatePicker aria-label="Day" name="day" form={form} locale="en-US" defaultValue={new Date(2026, 0, 5)} />, initial: { day: '2026-01-05' },
    change: (r) => fill($(r, 'input:not([type="hidden"])'), '02/10/2026'), changed: { day: '2026-02-10' } },
  DateRangePicker: { el: (form) => <DateRangePicker startName="from" endName="to" form={form} locale="en-US" defaultValue={{ start: new Date(2026, 0, 5), end: new Date(2026, 0, 9) }} />, initial: { from: '2026-01-05', to: '2026-01-09' },
    change: (r) => fill($(r, 'input:not([type="hidden"])'), '01/07/2026'), changed: { from: '2026-01-07', to: '2026-01-09' } },
  TimePicker: { el: (form) => <TimePicker aria-label="At" name="at" form={form} locale="en-US" hour12={false} defaultValue="09:00" />, initial: { at: '09:00' },
    change: (r) => fill($(r, 'input:not([type="hidden"])'), '14:30'), changed: { at: '14:30' } },
  ColorPicker: { el: (form) => <ColorPicker aria-label="Color" name="color" form={form} custom={false} swatches={['#1d4ed8', '#b91c1c']} defaultValue="#1d4ed8" />, initial: { color: '#1d4ed8' },
    change: async (r) => { await userEvent.click($(r, '[role="radio"][aria-checked="false"]')); }, changed: { color: '#b91c1c' } },
  FileUpload: { el: (form) => <FileUpload name="attachment" form={form} files={[file]} onFilesChange={() => {}} />, initial: { attachment: 'notes.txt' } },
  // A button's name and value go only with the button that submits the form, as with <button name>.
  CopyButton: 'a button', Fab: 'a button', Tab: 'a button', ToggleButton: 'a button',
  Avatar: "the person's name, shown as initials", Icon: "the icon's name",
};
const TABLE = Object.entries(CONTROLS).filter((e): e is [string, Control] => typeof e[1] !== 'string').map(([name, c]) => ({ name, ...c }));

// Enter in a text field submits; the page must stay.
const Form = (p: React.FormHTMLAttributes<HTMLFormElement>) => <form {...p} onSubmit={(e) => e.preventDefault()} />;
const sent = (form: HTMLFormElement): Sent => Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, typeof v === 'string' ? v : v.name]));

describe.each(TABLE)('$name keeps the form contract', (c) => {
  test('submits its value under its name', async () => {
    await render(<Form id="in">{c.el()}</Form>);
    expect(sent(document.getElementById('in') as HTMLFormElement)).toEqual(c.initial);
  });

  test('submits with a form elsewhere through form="…"', async () => {
    await render(<><Form id="away" /><div>{c.el('away')}</div></>);
    expect(sent(document.getElementById('away') as HTMLFormElement)).toEqual(c.initial);
  });

  if (c.change) test('goes back to its default on form.reset()', async () => {
    await render(<Form id="r">{c.el()}</Form>);
    const f = document.getElementById('r') as HTMLFormElement;
    await c.change!(f);
    await expect.poll(() => sent(f)).toEqual(c.changed);
    React.act(() => f.reset());
    await expect.poll(() => sent(f)).toEqual(c.initial);
  });

  test('in a disabled fieldset, submits nothing and is skipped by Tab', async () => {
    await render(<Form id="d"><button type="button" id="before">Before</button><fieldset disabled>{c.el()}</fieldset><button type="button" id="after">After</button></Form>);
    expect(sent(document.getElementById('d') as HTMLFormElement)).toEqual({});
    document.getElementById('before')!.focus();
    await userEvent.tab();
    expect(document.activeElement?.id).toBe('after');
  });
});
