import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './CopyButton';
import { Input } from '../Input/Input';

const meta = {
  title: 'Components/Actions/CopyButton',
  component: CopyButton,
  args: { value: 'sk_live_51H8xQ2' },
  argTypes: { variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost'] }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const IconOnly: Story = { args: { iconOnly: true, children: 'Copy the API key', variant: 'ghost' } };
export const WithAField: Story = {
  name: 'Next to a field',
  render: () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', alignItems: 'center', maxWidth: 'var(--container-sm)' }}>
    <Input readOnly value="https://serupa.app/invite/7Hq2" aria-label="Invite link" />
    <CopyButton value="https://serupa.app/invite/7Hq2" size="md">Copy link</CopyButton>
  </div>,
};

export const LongLabel: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <CopyButton {...args}>Copy the secret API key to the clipboard</CopyButton>
    </div>
  ),
};

export const VariantsAndSizes: Story = {
  render: (args) => <div className="flex flex-wrap gap-3 items-center">
    <CopyButton {...args} variant="primary">Copy, primary</CopyButton>
    <CopyButton {...args} variant="link">Copy, link</CopyButton>
    <CopyButton {...args} size="lg">Copy, lg</CopyButton>
  </div>,
};
