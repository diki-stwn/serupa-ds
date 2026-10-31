// One scale for every one-line control (165): at each size, a Button, every input-like field and SegmentedControl
// are the same height (control-height-sm, -md, -lg: 24, 32 and 44px), with the same corner radius and text size, so a
// Button beside an Input in a toolbar or a form row lines up. A component that drifts by a pixel fails here, not in a
// screenshot someone has to notice.
import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Button } from '../components/Button/Button';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { InlineEdit } from '../components/InlineEdit/InlineEdit';
import { Input } from '../components/Input/Input';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { SearchInput } from '../components/SearchInput/SearchInput';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Select } from '../components/Select/Select';
import { TimePicker } from '../components/TimePicker/TimePicker';

type Size = 'sm' | 'md' | 'lg';
const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
// Each control at a size, without a label, so the first element is its drawn box.
const CONTROLS: [string, (size: Size) => React.ReactElement][] = [
  ['Button', (size) => <Button size={size}>Save</Button>],
  ['Input', (size) => <Input size={size} aria-label="Name" />],
  ['Select', (size) => <Select size={size} aria-label="Name" options={OPTIONS} />],
  ['Combobox', (size) => <Combobox size={size} aria-label="Name" options={OPTIONS} />],
  ['DatePicker', (size) => <DatePicker size={size} aria-label="Name" />],
  ['DateRangePicker', (size) => <DateRangePicker size={size} aria-label="Name" />],
  ['TimePicker', (size) => <TimePicker size={size} aria-label="Name" />],
  ['NumberInput', (size) => <NumberInput size={size} aria-label="Name" />],
  ['PasswordInput', (size) => <PasswordInput size={size} aria-label="Name" />],
  ['PhoneInput', (size) => <PhoneInput size={size} aria-label="Name" />],
  ['SearchInput', (size) => <SearchInput size={size} aria-label="Name" />],
  ['InlineEdit (editing)', (size) => <InlineEdit size={size} aria-label="Name" defaultValue="Ada" defaultEditing />],
  ['SegmentedControl', (size) => <SegmentedControl size={size} aria-label="View" options={OPTIONS} />],
];

const token = (name: string) => {
  const probe = document.body.appendChild(document.createElement('div'));
  probe.style.height = `var(--${name})`;
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
};
// The drawn box: the first element with a border or a fill, from the outside in.
const box = (root: Element) => [root, ...root.querySelectorAll('*')].find((e) => {
  const c = getComputedStyle(e);
  return parseFloat(c.borderTopWidth) > 0 || c.backgroundColor !== 'rgba(0, 0, 0, 0)';
}) as HTMLElement;
const textOf = (root: Element) => [root, ...root.querySelectorAll('input, button, [role="combobox"], [role="radio"]')].at(-1) as HTMLElement;

describe.each(['sm', 'md', 'lg'] as Size[])('size %s', (size) => {
  test('every one-line control is control-height tall, with one corner radius and one text size', async () => {
    const { container } = await render(<div>{CONTROLS.map(([n, el]) => <div key={n} data-name={n}>{el(size)}</div>)}</div>);
    await document.fonts.ready;
    const height = token('control-height-' + size);
    expect([24, 32, 44]).toContain(height);
    const rows = [...container.querySelectorAll<HTMLElement>('[data-name]')].map((cell) => {
      const b = box(cell.firstElementChild!), c = getComputedStyle(b);
      return { name: cell.dataset.name, height: Math.round(b.getBoundingClientRect().height * 10) / 10, radius: c.borderTopLeftRadius, text: getComputedStyle(textOf(b)).fontSize };
    });
    expect(rows.map((r) => [r.name, r.height]), 'heights').toEqual(rows.map((r) => [r.name, height]));
    expect(rows.map((r) => [r.name, r.radius]), 'radii').toEqual(rows.map((r) => [r.name, rows[0].radius]));
    expect(rows.map((r) => [r.name, r.text]), 'text sizes').toEqual(rows.map((r) => [r.name, rows[0].text]));
  });
});
