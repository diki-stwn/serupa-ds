import * as React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Carousel } from '../components/Carousel/Carousel';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { ColorPicker } from '../components/ColorPicker/ColorPicker';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { Dialog } from '../components/Dialog/Dialog';
import { Drawer } from '../components/Drawer/Drawer';
import { Field } from '../components/Field/Field';
import { Input } from '../components/Input/Input';
import { Meter } from '../components/Meter/Meter';
import { Progress } from '../components/Progress/Progress';
import { Radio, RadioGroup } from '../components/Radio/Radio';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Select } from '../components/Select/Select';
import { Slider } from '../components/Slider/Slider';
import { Switch } from '../components/Switch/Switch';
import { Tab, TabList, TabPanel, Tabs } from '../components/Tabs/Tabs';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { PinInput } from '../components/PinInput/PinInput';
import { Popover } from '../components/Popover/Popover';
import { SearchInput } from '../components/SearchInput/SearchInput';
import { Textarea } from '../components/Textarea/Textarea';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { TreeView } from '../components/TreeView/TreeView';

// Each component that needs a name says so once in the console when it has none (a screen reader would announce only
// its role), and stays quiet when it's named the usual way: its label, a Field, aria-label or aria-labelledby.
const noop = () => {};
const TREE = [{ id: 'src', label: 'src' }];
const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
const UNNAMED: Array<[string, () => React.ReactElement]> = [
  ['Dialog', () => <Dialog open={false} onOpenChange={noop}>Body</Dialog>],
  ['Drawer', () => <Drawer open={false} onOpenChange={noop}>Body</Drawer>],
  ['Slider', () => <Slider />],
  ['Switch', () => <Switch />],
  ['Checkbox', () => <Checkbox />],
  ['Combobox', () => <Combobox options={OPTIONS} />],
  ['Select', () => <Select><option>A</option></Select>],
  ['Input', () => <Input placeholder="Email" />],
  ['SegmentedControl', () => <SegmentedControl options={OPTIONS} />],
  ['Progress', () => <Progress value={40} />],
  ['Meter', () => <Meter value={40} />],
  ['RadioGroup', () => <RadioGroup><Radio value="a">A</Radio></RadioGroup>],
  ['DatePicker', () => <DatePicker />],
  ['ColorPicker', () => <ColorPicker swatches={['#ff0000']} />],
  ['Carousel', () => <Carousel label=""><div>One</div></Carousel>],
  ['Textarea', () => <Textarea placeholder="Notes" />],
  ['NumberInput', () => <NumberInput />],
  ['PasswordInput', () => <PasswordInput />],
  ['SearchInput', () => <SearchInput placeholder="Search" />],
  ['PhoneInput', () => <PhoneInput />],
  ['PinInput', () => <PinInput />],
  ['TimePicker', () => <TimePicker />],
  ['Popover', () => <Popover trigger={<button type="button">Filters</button>}>Body</Popover>],
  ['TreeView', () => <TreeView items={TREE} />],
];
const NAMED: Array<[string, () => React.ReactElement]> = [
  ['Dialog', () => <Dialog open={false} onOpenChange={noop} title="Delete file">Body</Dialog>],
  ['Drawer', () => <Drawer open={false} onOpenChange={noop} aria-label="Filters">Body</Drawer>],
  ['Slider', () => <Field label="Volume"><Slider /></Field>],
  ['Switch', () => <Switch>Wi-Fi</Switch>],
  ['Checkbox', () => <Checkbox aria-label="Select row" />],
  ['Combobox', () => <Field label="Fruit"><Combobox options={OPTIONS} /></Field>],
  ['Select', () => <><label htmlFor="nc-select">Size</label><Select id="nc-select"><option>A</option></Select></>],
  ['Input', () => <><span id="nc-email">Email</span><Input aria-labelledby="nc-email" /></>],
  ['SegmentedControl', () => <SegmentedControl options={OPTIONS} aria-label="View" />],
  ['Progress', () => <Progress value={40} label="Upload" />],
  ['Meter', () => <Meter value={40} label="Storage" />],
  ['RadioGroup', () => <Field group label="Plan"><RadioGroup><Radio value="a">A</Radio></RadioGroup></Field>],
  ['DatePicker', () => <Field label="Start"><DatePicker /></Field>],
  ['ColorPicker', () => <ColorPicker swatches={['#ff0000']} aria-label="Color" />],
  ['Carousel', () => <Carousel label="Photos"><div>One</div></Carousel>],
  ['Textarea', () => <Field label="Notes"><Textarea /></Field>],
  ['NumberInput', () => <Field label="Quantity"><NumberInput /></Field>],
  ['PasswordInput', () => <Field label="Password"><PasswordInput /></Field>],
  ['SearchInput', () => <SearchInput aria-label="Search orders" />],
  ['PhoneInput', () => <Field label="Phone"><PhoneInput /></Field>],
  ['PinInput', () => <Field label="Code"><PinInput /></Field>],
  ['TimePicker', () => <Field label="Start"><TimePicker /></Field>],
  ['Popover', () => <Popover trigger={<button type="button">Filters</button>} title="Filters">Body</Popover>],
  ['TreeView', () => <TreeView items={TREE} aria-label="Files" />],
];

describe('accessible name warnings', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  test.each(UNNAMED)('%s with no name warns once', async (name, make) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<>{make()}{make()}</>);
    const said = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('accessible name'));
    expect(said).toEqual([expect.stringMatching(new RegExp('^' + name + ' has no accessible name'))]);
  });

  test.each(NAMED)('%s named the usual way says nothing', async (_name, make) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(make());
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('accessible name'))).toEqual([]);
  });

  test('a range Slider names its thumbs itself, so it says nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Slider defaultValue={[20, 80]} />);
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('accessible name'))).toEqual([]);
  });
});

describe('Tabs value warnings', () => {
  afterEach(() => { vi.restoreAllMocks(); });
  const tabs = (props: { value?: string; defaultValue?: string }) => (
    <Tabs {...props} onValueChange={noop}>
      <TabList aria-label="Sections"><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList>
      <TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel>
    </Tabs>
  );

  test('a controlled value that matches no Tab warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(tabs({ value: 'three' }));
    expect(warn.mock.calls.map((c) => String(c[0]))).toContainEqual(expect.stringContaining('Tabs: value "three" matches no Tab'));
  });

  test('a defaultValue that matches no Tab warns, and the first tab is selected', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await render(tabs({ defaultValue: 'three' }));
    expect(warn.mock.calls.map((c) => String(c[0]))).toContainEqual(expect.stringContaining('Tabs: defaultValue "three" matches no Tab'));
    await expect.element(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  test('a value that matches a Tab says nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<>{tabs({ value: 'two' })}{tabs({ defaultValue: 'one' })}</>);
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('Tabs:'))).toEqual([]);
  });
});
