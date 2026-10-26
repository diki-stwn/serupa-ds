import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Components/Forms/Radio',
  component: RadioGroup,
  subcomponents: { Radio },
  args: { 'aria-label': 'Plan', defaultValue: 'pro', orientation: 'vertical', size: 'md' },
  argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => <RadioGroup {...args}>
    <Radio value="free">Free</Radio>
    <Radio value="pro" description="Everything in Free, plus unlimited projects">Pro</Radio>
    <Radio value="team">Team</Radio>
  </RadioGroup>,
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Horizontal: Story = { args: { orientation: 'horizontal' } };
export const Invalid: Story = { args: { invalid: true, defaultValue: undefined } };
export const Disabled: Story = { args: { disabled: true } };

export const Controlled: Story = {
  render: function ControlledDemo() {
    const [value, setValue] = React.useState<string>('email');
    return <div className="flex flex-col gap-3">
      <RadioGroup aria-label="Contact by" value={value} onValueChange={setValue} orientation="horizontal">
        <Radio value="email">Email</Radio><Radio value="phone">Phone</Radio><Radio value="post">Post</Radio>
      </RadioGroup>
      <p className="text-sm">Picked: <code>{value}</code></p>
    </div>;
  },
};

export const LongLabels: Story = {
  render: (args) => (
    <div style={{ width: 240 }}>
      <RadioGroup {...args}>
        <Radio value="free">Free, for one person working on a handful of projects</Radio>
        <Radio value="pro" description="Everything in Free, plus unlimited projects, guests and a full year of version history">Pro</Radio>
        <Radio value="team">{"Donaudampfschifffahrtsgesellschaft"}</Radio>
      </RadioGroup>
    </div>
  ),
};
