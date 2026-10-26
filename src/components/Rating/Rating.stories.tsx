import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './Rating';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/Rating',
  component: Rating,
  args: { 'aria-label': 'Your rating', defaultValue: 3, max: 5, size: 'md', allowHalf: false, clearable: false, readOnly: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Rating>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const HalfStars: Story = { name: 'Half stars', args: { allowHalf: true, defaultValue: 3.5, clearable: true } };
export const InAField: Story = {
  name: 'In a field',
  args: { 'aria-label': undefined },
  render: function Render(args) {
    const [v, setV] = React.useState<number | null>(null);
    return <Field label="How was your stay?" hint="Pick again to clear.">
      <Rating {...args} value={v} onValueChange={setV} clearable name="stay" />
    </Field>;
  },
};
export const ReadOnly: Story = { name: 'Read-only', args: { readOnly: true, defaultValue: undefined, value: 4.3, 'aria-label': 'Average' } };
export const Sizes: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
    <Rating aria-label="Small" size="sm" defaultValue={2} />
    <Rating aria-label="Medium" defaultValue={3} />
    <Rating aria-label="Large" size="lg" defaultValue={4} />
  </div>,
};
export const Disabled: Story = { args: { disabled: true, defaultValue: 2 } };

export const Overflow: Story = {
  args: { max: 10, defaultValue: 7 },
  render: (args) => <div style={{ width: 160 }}><Rating {...args} /></div>,
};
