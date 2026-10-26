import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PinInput } from './PinInput';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/PinInput',
  component: PinInput,
  args: { 'aria-label': 'Verification code', length: 6, size: 'md', type: 'numeric', mask: false, invalid: false, disabled: false, readOnly: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, type: { control: 'inline-radio', options: ['numeric', 'alphanumeric'] } },
} satisfies Meta<typeof PinInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Filled: Story = { args: { defaultValue: '492', size: 'lg' } };

export const InAField: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <Field label="Verification code" hint="We sent a 6-digit code to your phone." error="That code has expired.">
      <PinInput {...args} defaultValue="381904" />
    </Field>
  ),
};

export const Masked: Story = { args: { 'aria-label': 'PIN', length: 4, mask: true, defaultValue: '27' } };

export const Alphanumeric: Story = { args: { 'aria-label': 'Invite code', type: 'alphanumeric', length: 5, defaultValue: 'K7Q', size: 'sm' } };

export const Disabled: Story = { args: { disabled: true, defaultValue: '1234' } };

export const Overflow: Story = {
  args: { length: 12, defaultValue: '492817' },
  render: (args) => <div style={{ width: 200 }}><PinInput {...args} /></div>,
};
