import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonAsButtonProps } from './Button';
import { iconArg } from '../../../.storybook/icon-arg';
import { Tooltip } from '../Tooltip/Tooltip';

const meta = {
  title: 'Components/Actions/Button',
  component: Button as React.ComponentType<ButtonAsButtonProps>,   // the <button> form; links are in As a link
  args: { children: 'Save changes', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    leftIcon: iconArg,
    rightIcon: iconArg,
    icon: iconArg,
  },
} satisfies Meta<ButtonAsButtonProps>;
export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => <Row>
    <Button>Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </Row>,
};

export const Destructive: Story = {
  render: () => <Row>
    <Button destructive>Delete</Button>
    <Button variant="secondary" destructive>Delete</Button>
    <Button variant="outline" destructive>Delete</Button>
    <Button variant="ghost" destructive>Remove</Button>
    <Button variant="link" destructive>Revoke</Button>
  </Row>,
};

export const Sizes: Story = {
  render: () => <Row>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </Row>,
};

export const Content: Story = {
  render: () => <Row>
    <Button>Label only</Button>
    <Button leftIcon="add">New project</Button>
    <Button variant="outline" rightIcon="arrow_forward">Next</Button>
    <Button variant="ghost" icon="more_horiz" aria-label="More actions" />
    <Button icon="add" aria-label="Add" size="lg" />
  </Row>,
};

export const States: Story = {
  render: () => <Row>
    <Button>Default</Button>
    <Button disabled>Disabled</Button>
    <Button loading>Saving</Button>
    <Button variant="outline" leftIcon="download" loading>Export</Button>
    <Button variant="ghost" icon="refresh" aria-label="Refresh" loading />
  </Row>,
};

export const AsLink: Story = {
  name: 'As a link',
  render: () => <Row>
    <Button href="#docs" variant="outline" rightIcon="arrow_forward">Read the docs</Button>
    <Button href="#docs" variant="link">Inline link</Button>
    <Button href="#docs" disabled>Disabled link</Button>
  </Row>,
};

export const Loading: Story = {
  name: 'Loading on click',
  render: function LoadingDemo() {
    const [busy, setBusy] = React.useState(false);
    return <Button loading={busy} loadingText="Saving" onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 2000); }}>Save</Button>;
  },
};

/** disabledReason: a disabled button that stays focusable and says why, here with a Tooltip showing the same words. */
export const DisabledWithReason: Story = {
  render: (args) => (
    <Tooltip content="Fill in your name first"><Button {...args} disabled disabledReason="Fill in your name first">Save</Button></Tooltip>
  ),
};

/** An onClick that returns a promise: loading until it settles, then the successText with a check for 2 seconds. */
export const AsyncSuccess: Story = {
  render: (args) => <Button {...args} successText="Saved" onClick={() => new Promise((ok) => setTimeout(ok, 1200))}>Save changes</Button>,
};
