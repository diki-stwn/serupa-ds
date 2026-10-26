import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import { NumberInput } from '../NumberInput/NumberInput';
import { iconArg } from '../../../.storybook/icon-arg';

const meta = {
  title: 'Components/Forms/Input',
  component: Input,
  args: { placeholder: 'you@example.com', 'aria-label': 'Email', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, leftIcon: iconArg, rightIcon: iconArg },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

const Col = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3" style={{ maxWidth: 320 }}>{children}</div>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => <Col>
    <Input size="sm" aria-label="Small" placeholder="Small" />
    <Input aria-label="Medium" placeholder="Medium" />
    <Input size="lg" aria-label="Large" placeholder="Large" />
  </Col>,
};

export const Icons: Story = {
  render: () => <Col>
    <Input leftIcon="search" aria-label="Search" placeholder="Search" />
    <Input type="url" rightIcon="link" aria-label="Website" placeholder="https://" />
  </Col>,
};

/** Fixed text around what's typed. It's added to the field's description, so screen readers hear it too. */
export const PrefixAndSuffix: Story = {
  name: 'Prefix and suffix',
  render: () => <Col>
    <Input type="url" prefix="https://" aria-label="Website" placeholder="example.com" />
    <Input prefix="@" aria-label="Username" placeholder="ana" />
    <Input suffix=".serupa.app" aria-label="Workspace address" placeholder="atlas" />
    <NumberInput suffix="kg" aria-label="Weight (kg)" defaultValue={12} />
  </Col>,
};

export const States: Story = {
  render: () => <Col>
    <Input aria-label="Default" defaultValue="Default" />
    <Input aria-label="Invalid" invalid defaultValue="not-an-email" />
    <Input aria-label="Read-only" readOnly defaultValue="Read-only" />
    <Input aria-label="Disabled" disabled defaultValue="Disabled" />
  </Col>,
};

export const Count: Story = {
  render: () => <Col>
    <Input showCount maxLength={30} aria-label="Title" defaultValue="Quarterly report" />
    <Input showCount maxLength={10} aria-label="Code" defaultValue="WELCOME-10" />
    <Input showCount aria-label="Note" defaultValue="No limit" />
  </Col>,
};

/** A <fieldset disabled> disables the fields inside, and they look disabled too. */
export const InDisabledFieldset: Story = {
  name: 'In a disabled fieldset',
  render: () => <fieldset disabled style={{ border: 0, margin: 0, padding: 0 }}>
    <Col>
      <Input aria-label="Company" defaultValue="Atlas Ltd" />
      <Input aria-label="Tax ID" placeholder="Tax ID" />
    </Col>
  </fieldset>,
};

export const LongValue: Story = {
  render: (args) => (
    <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Input {...args} defaultValue="grace.brewster.murray.hopper@navy.example.com" leftIcon="mail" />
      <Input {...args} placeholder="A placeholder far longer than the input is wide" />
    </div>
  ),
};
