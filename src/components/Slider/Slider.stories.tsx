import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/Slider',
  component: Slider,
  args: { 'aria-label': 'Volume', defaultValue: 50, min: 0, max: 100, step: 1, size: 'md', disabled: false, invalid: false, readOnly: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>],
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Range: Story = {
  render: function Render() {
    const [price, setPrice] = React.useState<[number, number]>([40, 120]);
    return <Field label={`Price: $${price[0]} to $${price[1]}`} group>
      <Slider aria-label="Price" value={price} onValueChange={setPrice} max={200} step={5} formatValue={(v) => `$${v}`} />
    </Field>;
  },
};
export const Small: Story = { args: { size: 'sm', defaultValue: 30 } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 70 } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 40 } };
export const Invalid: Story = {
  render: (args) => <Field label="Volume" error="Keep it under 80 for hearing safety"><Slider {...args} defaultValue={90} /></Field>,
};
export const Marks: Story = {
  args: { 'aria-label': 'Temperature', defaultValue: 21, min: 16, max: 28, marks: [{ value: 16, label: '16°' }, { value: 21, label: 'Comfort' }, { value: 28, label: '28°' }], showValue: true, formatValue: (v: number) => `${v}°` },
};
export const EveryStep: Story = { args: { 'aria-label': 'Rating', defaultValue: 3, min: 0, max: 10, marks: true } };

export const LongMarks: Story = {
  args: { marks: [{ value: 0, label: 'Completely silent' }, { value: 50, label: 'Halfway there' }, { value: 100, label: 'As loud as it goes' }] },
  decorators: [(Story) => <div style={{ width: 200, paddingBlockEnd: 32 }}><Story /></div>],
};
