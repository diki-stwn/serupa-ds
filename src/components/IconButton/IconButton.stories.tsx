import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, type IconButtonProps } from './IconButton';

const meta = {
  title: 'Components/Actions/IconButton',
  component: IconButton as React.ComponentType<IconButtonProps>,
  args: { icon: 'more_vert', label: 'More actions', variant: 'ghost', size: 'md', shape: 'square' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    shape: { control: 'inline-radio', options: ['square', 'round'] },
  },
} satisfies Meta<IconButtonProps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => <div className="flex gap-3 items-center">
    <IconButton icon="add" label="Add" variant="primary" />
    <IconButton icon="edit" label="Edit" variant="secondary" />
    <IconButton icon="share" label="Share" variant="outline" />
    <IconButton icon="more_vert" label="More actions" />
    <IconButton icon="delete" label="Delete" destructive />
  </div>,
};

export const SizesAndShapes: Story = {
  name: 'Sizes and shapes',
  render: () => <div className="flex gap-3 items-center">
    <IconButton icon="edit" label="Edit" variant="secondary" size="sm" />
    <IconButton icon="edit" label="Edit" variant="secondary" />
    <IconButton icon="edit" label="Edit" variant="secondary" size="lg" />
    <IconButton icon="edit" label="Edit" variant="secondary" size="sm" shape="round" />
    <IconButton icon="edit" label="Edit" variant="secondary" shape="round" />
    <IconButton icon="edit" label="Edit" variant="secondary" size="lg" shape="round" />
  </div>,
};

export const States: Story = {
  render: () => <div className="flex gap-3 items-center">
    <IconButton icon="edit" label="Edit" variant="secondary" />
    <IconButton icon="edit" label="Edit (disabled)" variant="secondary" disabled />
    <IconButton icon="sync" label="Syncing" variant="secondary" loading />
    <IconButton icon="add" label="Add (disabled)" variant="primary" disabled />
    <IconButton icon="refresh" label="Refreshing" variant="primary" loading />
    <IconButton icon="delete" label="Delete (disabled)" destructive disabled />
  </div>,
};

export const AsALink: Story = {
  name: 'As a link',
  render: () => <div className="flex gap-3 items-center">
    <IconButton icon="open_in_new" label="Open the docs" variant="outline" href="#docs" />
    <IconButton icon="help" label="Help" href="#help" shape="round" />
  </div>,
};

export const LongLabel: Story = {
  args: { label: 'Open the menu with every action for this project, including archive and delete' },
};
