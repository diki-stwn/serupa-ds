import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePicker } from './TimePicker';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/TimePicker',
  component: TimePicker,
  args: { 'aria-label': 'Time', size: 'md', step: 30, invalid: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ width: 'var(--spacing-56)' }}><Story /></div>],
} satisfies Meta<typeof TimePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WorkingHours: Story = {
  render: function Render() {
    const [t, setT] = React.useState<string | null>('09:00');
    return <Field label="Start time" hint="Between 8 AM and 6 PM"><TimePicker value={t} onValueChange={setT} min="08:00" max="18:00" step={15} /></Field>;
  },
};
export const TwentyFourHour: Story = { args: { hour12: false, defaultValue: '14:30' } };
export const Sizes: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
    {(['sm', 'md', 'lg'] as const).map((s) => <TimePicker key={s} size={s} aria-label={s} defaultValue="09:30" />)}
  </div>,
};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '10:00' } };
export const ReadOnly: Story = { name: 'Read-only', args: { readOnly: true, defaultValue: '10:00' } };

export const OverflowNarrow: Story = {
  args: { defaultValue: '23:30' },
  decorators: [(Story) => <div style={{ width: 120 }}><Story /></div>],
};
