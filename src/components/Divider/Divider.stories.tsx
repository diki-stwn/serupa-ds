import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Layout and type/Divider',
  component: Divider,
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }, label: { control: 'text' } },
} satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <div className="flex flex-col gap-4 text-sm text-text"><span>Above</span><Divider {...args} /><span>Below</span></div>,
};

export const WithLabel: Story = { ...Playground, args: { label: 'or' } };

export const Vertical: Story = {
  render: () => <div className="flex items-stretch gap-3 text-sm text-text" style={{ height: 24 }}><span>Edit</span><Divider orientation="vertical" /><span>Share</span><Divider orientation="vertical" /><span>Delete</span></div>,
};

export const LongLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4 text-sm text-text" style={{ width: 240 }}>
      <span>Above</span>
      <Divider {...args} label="or continue with a single sign-on provider" />
      <Divider {...args} label={"Donaudampfschifffahrtsgesellschaftskapitänskajüte"} />
      <span>Below</span>
    </div>
  ),
};
