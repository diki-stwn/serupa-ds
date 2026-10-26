import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from './Meter';

const meta = {
  title: 'Components/Feedback/Meter',
  component: Meter,
  args: { value: 72, label: 'Storage', showValue: true, size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>],
} satisfies Meta<typeof Meter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const LowIsGood: Story = {
  name: 'Zones: low is good',
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
    <Meter value={40} low={80} high={95} optimum={0} label="Storage" showValue />
    <Meter value={88} low={80} high={95} optimum={0} label="Storage" showValue formatValue={(v) => `${v}%, nearly full`} />
    <Meter value={98} low={80} high={95} optimum={0} label="Storage" showValue formatValue={(v) => `${v}%, full`} />
  </div>,
};
export const HighIsGood: Story = {
  name: 'Zones: high is good',
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
    <Meter value={85} low={20} high={60} optimum={100} label="Battery" showValue />
    <Meter value={45} low={20} high={60} optimum={100} label="Battery" showValue />
    <Meter value={12} low={20} high={60} optimum={100} label="Battery" showValue formatValue={(v) => `${v}%, low`} />
  </div>,
};
export const CustomValue: Story = { args: { value: 7.2, max: 10, formatValue: (v: number, _min: number, max: number) => `${v} of ${max} GB` } };
export const Sizes: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
    <Meter size="sm" value={30} aria-label="Small" />
    <Meter value={30} aria-label="Medium" />
    <Meter size="lg" value={30} aria-label="Large" />
  </div>,
};

export const LongLabel: Story = {
  args: { label: 'Storage used by photos, videos and shared documents' },
  decorators: [(Story) => <div style={{ width: 200 }}><Story /></div>],
};
