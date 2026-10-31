import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';

const meta = {
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
  args: { content: 'Download as PDF', placement: 'top', open: true, children: <IconButton icon="download" label="Download" variant="secondary" hideTitle /> },
  argTypes: { placement: { control: 'select', options: ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'left-start', 'right-end'] }, children: { control: false } },
  decorators: [(Story) => <div style={{ padding: '56px 120px' }}><Story /></div>],
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnHover: Story = {
  name: 'On hover and focus',
  args: { open: undefined },
  render: () => <div className="flex gap-3">
    <Tooltip content="Download as PDF"><IconButton icon="download" label="Download" variant="secondary" hideTitle /></Tooltip>
    <Tooltip content="Ctrl + S" placement="bottom"><Button variant="secondary">Save</Button></Tooltip>
    <Tooltip content="Only owners can delete a project" placement="right"><Button variant="outline" destructive aria-disabled="true">Delete</Button></Tooltip>
  </div>,
};

export const Bottom: Story = { name: 'Placement: bottom', args: { placement: 'bottom' } };
export const Left: Story = { name: 'Placement: left', args: { placement: 'left' } };
export const Right: Story = { name: 'Placement: right', args: { placement: 'right' } };
export const BottomStart: Story = { name: 'Placement: bottom-start', args: { placement: 'bottom-start' } };
export const TopEnd: Story = { name: 'Placement: top-end', args: { placement: 'top-end' } };
export const RightEnd: Story = { name: 'Placement: right-end', args: { placement: 'right-end' } };
export const LeftStart: Story = { name: 'Placement: left-start', args: { placement: 'left-start' } };
export const LeftEnd: Story = { name: 'Placement: left-end', args: { placement: 'left-end' } };
export const TopStart: Story = {
  name: 'Placement: top-start',
  args: { placement: 'top-start', content: 'Saves a copy to your device', children: <Button variant="secondary" leftIcon="download">Download</Button> },
};
export const BottomEnd: Story = {
  name: 'Placement: bottom-end',
  args: { placement: 'bottom-end', content: 'Saves a copy to your device', children: <Button variant="secondary" leftIcon="download">Download</Button> },
};

export const OnText: Story = {
  name: 'On a text button',
  args: { content: 'Ctrl + S', children: <Button variant="secondary" leftIcon="save">Save</Button> },
};
export const LongText: Story = {
  name: 'Long text',
  args: {
    placement: 'bottom',
    content: 'Exports every page of this report, with its charts and comments, as one PDF file. Large reports can take a minute.',
  },
  decorators: [(Story) => <div style={{ minHeight: 120 }}><Story /></div>],
};
export const OnDisabledLooking: Story = {
  name: 'Explaining an unavailable action',
  args: {
    placement: 'right', content: 'Only owners can delete a project',
    children: <Button variant="outline" destructive aria-disabled="true" leftIcon="delete">Delete</Button>,
  },
};
export const Disabled: Story = {
  name: 'Disabled (never shows)',
  args: { disabled: true },
};
