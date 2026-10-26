import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fab } from './Fab';

const meta = {
  title: 'Components/Actions/Fab',
  component: Fab,
  args: { icon: 'add', label: 'New project', position: 'static' },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    position: { control: 'inline-radio', options: ['static', 'bottom-end', 'bottom-start', 'top-end', 'top-start'] },
  },
  parameters: { docs: { description: { component: 'The examples use position="static" so they stay in the page; a real FAB is fixed to a corner (bottom-end by default).' } } },
} satisfies Meta<typeof Fab>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Kinds: Story = {
  render: () => <div className="flex gap-4 items-center">
    <Fab icon="add" label="New project" position="static" />
    <Fab icon="add" label="Add" size="sm" position="static" />
    <Fab icon="edit" label="Compose" extended position="static" />
  </div>,
};

export const Small: Story = { args: { size: 'sm' } };
export const Extended: Story = { args: { icon: 'edit', label: 'Compose', extended: true } };
export const ExtendedSmall: Story = { name: 'Extended, small', args: { icon: 'edit', label: 'Compose', extended: true, size: 'sm' } };
export const Disabled: Story = {
  render: (args) => <div className="flex gap-4 items-center">
    <Fab {...args} disabled />
    <Fab {...args} size="sm" disabled />
    <Fab {...args} icon="edit" label="Compose" extended disabled />
  </div>,
};
export const Loading: Story = {
  render: (args) => <div className="flex gap-4 items-center">
    <Fab {...args} icon="upload" label="Upload" loading />
    <Fab {...args} icon="upload" label="Upload" extended loading />
  </div>,
};
export const Destructive: Story = {
  render: (args) => <div className="flex gap-4 items-center">
    <Fab {...args} icon="delete" label="Delete selected" destructive />
    <Fab {...args} icon="delete" label="Delete selected" extended destructive />
  </div>,
};

// A transformed box is the containing block for position: fixed, so here each FAB sits in a corner of the frame
// (24px in) rather than of the screen.
export const Positions: Story = {
  name: 'Positions (in a frame)',
  render: () => (
    <div aria-label="Screen" role="group" style={{ position: 'relative', transform: 'translateZ(0)', height: 280, maxWidth: 480, border: '1px solid var(--border)', borderRadius: 'var(--rounded-lg)' }}>
      <Fab icon="add" label="Add (bottom-end)" position="bottom-end" />
      <Fab icon="chat" label="Chat (bottom-start)" position="bottom-start" />
      <Fab icon="search" label="Search (top-end)" size="sm" position="top-end" />
      <Fab icon="edit" label="Compose" extended position="top-start" />
    </div>
  ),
};

export const LongLabel: Story = {
  args: { label: 'Create a new project from a template' },
  render: (args) => (
    <div style={{ width: 200 }}>
      <Fab {...args} extended />
    </div>
  ),
};
