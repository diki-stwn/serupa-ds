import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/DateRangePicker',
  component: DateRangePicker,
  args: { 'aria-label': 'Dates', size: 'md', months: 2, invalid: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, months: { control: 'inline-radio', options: [1, 2] } },
} satisfies Meta<typeof DateRangePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithValue: Story = { args: { defaultValue: { start: new Date(2025, 2, 10), end: new Date(2025, 2, 14) } } };
export const InField: Story = {
  render: function Render() {
    const [stay, setStay] = React.useState<DateRange>({ start: null, end: null });
    return <Field label="Stay" hint="mm/dd/yyyy, from today on"><DateRangePicker value={stay} onValueChange={setStay} min={new Date()} /></Field>;
  },
};
export const OneMonth: Story = { args: { months: 1 } };
export const Sizes: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
    {(['sm', 'md', 'lg'] as const).map((s) => <DateRangePicker key={s} size={s} aria-label={s} defaultValue={{ start: new Date(2025, 2, 10), end: new Date(2025, 2, 14) }} />)}
  </div>,
};
export const Disabled: Story = { args: { disabled: true, defaultValue: { start: new Date(2025, 2, 10), end: new Date(2025, 2, 14) } } };

export const OverflowNarrow: Story = {
  args: { defaultValue: { start: new Date(2025, 11, 24), end: new Date(2026, 0, 6) } },
  render: (args) => <div style={{ width: 200 }}><DateRangePicker {...args} /></div>,
};
