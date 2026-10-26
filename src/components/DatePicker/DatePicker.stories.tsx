import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './DatePicker';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/DatePicker',
  component: DatePicker,
  args: { 'aria-label': 'Date', size: 'md', invalid: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ width: 'var(--spacing-64)' }}><Story /></div>],
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithValue: Story = { args: { defaultValue: new Date(2025, 10, 22) } };
export const InField: Story = {
  render: function Render() {
    const [due, setDue] = React.useState<Date | null>(null);
    return <Field label="Due date" hint="mm/dd/yyyy, from today on"><DatePicker value={due} onValueChange={setDue} min={new Date()} /></Field>;
  },
};
export const Sizes: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
    {(['sm', 'md', 'lg'] as const).map((s) => <DatePicker key={s} size={s} aria-label={s} defaultValue={new Date(2025, 10, 22)} />)}
  </div>,
};
export const German: Story = { args: { locale: 'de-DE', defaultValue: new Date(2025, 10, 22), buttonLabel: 'Datum wählen' } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: new Date(2025, 10, 22) } };
export const ReadOnly: Story = { name: 'Read-only', args: { readOnly: true, defaultValue: new Date(2025, 10, 22) } };

export const OverflowNarrow: Story = {
  args: { defaultValue: '2026-12-31' },
  decorators: [(Story) => <div style={{ width: 140 }}><Story /></div>],
};
