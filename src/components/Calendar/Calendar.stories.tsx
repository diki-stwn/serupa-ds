import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './Calendar';

const meta = {
  title: 'Components/Forms/Calendar',
  component: Calendar,
  args: { defaultValue: new Date(2025, 2, 10), defaultMonth: new Date(2025, 2, 10) },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
// The visual and Storybook checks run on a fixed clock (CLOCK in tools/test/lib.mjs), so there today is 12 March 2025.
export const Today: Story = { args: { defaultValue: undefined, defaultMonth: undefined } };
export const MinAndMax: Story = { args: { min: new Date(2025, 2, 5), max: new Date(2025, 2, 25) } };
export const NoWeekends: Story = { args: { isDateDisabled: (d: Date) => d.getDay() === 0 || d.getDay() === 6 } };
export const MonthYearPicker: Story = { name: 'Month and year menus', args: { monthYearPicker: true, min: new Date(1950, 0, 1), max: new Date(2030, 11, 31) } };
export const German: Story = { args: { locale: 'de-DE', previousLabel: 'Vorheriger Monat', nextLabel: 'Nächster Monat' } };
export const Controlled: Story = {
  render: function Render() {
    const [day, setDay] = React.useState<Date | null>(new Date(2025, 2, 10));
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
      <Calendar value={day} onValueChange={setDay} />
      <span style={{ fontSize: 'var(--text-sm)' }}>Picked: {day ? day.toDateString() : 'nothing'}</span>
    </div>;
  },
};

export const LongText: Story = {
  name: 'Long month names (Portuguese), narrow',
  args: { locale: 'pt-BR', defaultValue: new Date(2025, 8, 10), defaultMonth: new Date(2025, 8, 10) },
  render: (args) => <div style={{ width: 240 }}><Calendar {...args} /></div>,
};
