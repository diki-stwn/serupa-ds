import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';

const meta = {
  title: 'Components/Layout and type/Heading',
  component: Heading,
  args: { level: 2, children: 'Recent activity' },
  argTypes: {
    level: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
    size: { control: 'select', options: [undefined, 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] },
  },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Levels: Story = {
  render: () => <div className="flex flex-col gap-3">
    <Heading level={1}>Level 1, text-3xl</Heading>
    <Heading level={2}>Level 2, text-2xl</Heading>
    <Heading level={3}>Level 3, text-xl</Heading>
    <Heading level={4}>Level 4, text-lg</Heading>
    <Heading level={5}>Level 5, text-base</Heading>
    <Heading level={6}>Level 6, text-sm</Heading>
  </div>,
};

export const LevelAndSize: Story = {
  name: 'Level and size apart',
  render: () => <div className="flex flex-col gap-3">
    <Heading level={1} size="lg">An h1 that looks lg</Heading>
    <Heading level={3} size="4xl">An h3 that looks 4xl</Heading>
  </div>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 240 }}>
      <Heading {...args} level={1}>Quarterly results for every region, team and product line</Heading>
      <Heading {...args}>{"Donaudampfschifffahrtsgesellschaftskapitänskajüte"}</Heading>
    </div>
  ),
};
