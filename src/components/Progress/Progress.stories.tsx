import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  args: { value: 45, label: 'Uploading report.pdf', showValue: true, variant: 'bar', size: 'md', tone: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['bar', 'circle'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: ['primary', 'success', 'warning', 'danger'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>],
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Tones: Story = {
  render: () => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
    <Progress value={45} label="Uploading" showValue />
    <Progress tone="success" value={100} label="Uploaded" showValue />
    <Progress tone="warning" value={92} label="Storage" showValue formatValue={(v) => `${v} of 100 GB`} />
    <Progress tone="danger" value={100} label="Quota reached" showValue />
  </div>,
};
export const Circle: Story = {
  render: () => <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
    <Progress variant="circle" size="sm" value={30} aria-label="Storage used" />
    <Progress variant="circle" value={30} showValue aria-label="Storage used" />
    <Progress variant="circle" size="lg" value={72} showValue aria-label="Course progress" />
    <Progress variant="circle" aria-label="Loading" />
  </div>,
};
export const Indeterminate: Story = { args: { value: undefined, label: 'Preparing your export', showValue: false } };
/** announceComplete says "Upload: complete" when the value reaches max; press Start to watch it fill. */
export const AnnounceComplete: Story = {
  name: 'Announce complete',
  render: function Render() {
    const [v, setV] = React.useState(0);
    React.useEffect(() => { if (v <= 0 || v >= 100) return; const t = setTimeout(() => setV(Math.min(100, v + 20)), 400); return () => clearTimeout(t); }, [v]);
    return <div style={{ display: 'grid', gap: 'var(--spacing-3)', maxWidth: 320 }}>
      <Progress label="Upload" value={v} showValue announceComplete />
      <button type="button" onClick={() => setV(20)}>Start</button>
    </div>;
  },
};

export const LongLabel: Story = {
  args: { label: 'Uploading quarterly-report-Donaudampfschifffahrtsgesellschaftskapitänskajüte-final-v2.pdf' },
  decorators: [(Story) => <div style={{ width: 200 }}><Story /></div>],
};
