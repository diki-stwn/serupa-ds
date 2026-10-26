import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from './PasswordInput';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/PasswordInput',
  component: PasswordInput,
  args: { 'aria-label': 'Password', placeholder: 'Your password' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => <div style={{ maxWidth: 320 }}><PasswordInput {...args} /></div>,
} satisfies Meta<typeof PasswordInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InAField: Story = {
  render: () => <div style={{ maxWidth: 320 }}><Field label="New password" hint="At least 12 characters"><PasswordInput autoComplete="new-password" /></Field></div>,
};

export const Shown: Story = { args: { defaultValue: 'correct horse battery staple', defaultVisible: true } };

export const Invalid: Story = {
  render: () => <div style={{ maxWidth: 320 }}><Field label="Password" error="That password is wrong."><PasswordInput defaultValue="hunter2" /></Field></div>,
};

// Caps Lock on: a key event with Caps Lock held shows the hint, as typing with it on does.
export const CapsLockOn: Story = {
  args: { defaultValue: 'PASSWORD', 'aria-label': 'Password' },
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector('input')!;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true, modifierCapsLock: true }));
  },
};

export const LongValue: Story = {
  args: { defaultValue: 'correct horse battery staple and a much longer passphrase', defaultVisible: true },
  render: (args) => <div style={{ width: 200 }}><PasswordInput {...args} /></div>,
};
