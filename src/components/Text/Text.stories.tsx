import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Components/Layout and type/Text',
  component: Text,
  args: { children: 'Invite people to work on this project with you.' },
  argTypes: {
    as: { control: 'select', options: ['p', 'span', 'div', 'label', 'strong', 'em', 'small', 'li', 'figcaption'] },
    size: { control: 'select', options: [undefined, 'xs', 'sm', 'base', 'lg', 'xl'] },
    tone: { control: 'select', options: [undefined, 'default', 'muted', 'primary', 'danger'] },
    weight: { control: 'select', options: [undefined, 'normal', 'medium', 'semibold', 'bold'] },
  },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => <div className="flex flex-col gap-2">{(['xs', 'sm', 'base', 'lg', 'xl'] as const).map((s) => <Text key={s} size={s}>text-{s}: The quick brown fox</Text>)}</div>,
};

export const Tones: Story = {
  render: () => <div className="flex flex-col gap-2">{(['default', 'muted', 'primary', 'danger'] as const).map((t) => <Text key={t} tone={t}>{t}: The quick brown fox</Text>)}</div>,
};

export const Weights: Story = {
  render: () => <div className="flex flex-col gap-2">{(['normal', 'medium', 'semibold', 'bold'] as const).map((w) => <Text key={w} weight={w}>{w}: The quick brown fox</Text>)}</div>,
};

export const Truncate: Story = {
  render: () => <div style={{ width: 200 }}><Text truncate>quarterly-report-final-version-2.pdf</Text></div>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <Text {...args}>Invite people to work on this project with you, and give each of them only the access they need.</Text>
      <Text {...args}>{"Donaudampfschifffahrtsgesellschaftskapitänskajüte"}</Text>
    </div>
  ),
};
