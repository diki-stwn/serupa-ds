import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './Toolbar';
import { Button } from '../Button/Button';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { Divider } from '../Divider/Divider';
import { IconButton } from '../IconButton/IconButton';
import { Menu, MenuItem } from '../Menu/Menu';
import { ToggleButton } from '../ToggleButton/ToggleButton';

const Formatting = () => [
  <ButtonGroup key="f" aria-label="Style">
    <ToggleButton icon="format_bold" aria-label="Bold" defaultPressed />
    <ToggleButton icon="format_italic" aria-label="Italic" />
    <ToggleButton icon="format_underlined" aria-label="Underline" />
  </ButtonGroup>,
  <Divider key="d1" orientation="vertical" />,
  <IconButton key="l" variant="ghost" icon="link" label="Insert link" />,
  <IconButton key="i" variant="ghost" icon="image" label="Insert image" disabled />,
  <Divider key="d2" orientation="vertical" />,
  <Menu key="m" trigger={<Button variant="ghost" rightIcon="expand_more">More</Button>}><MenuItem>Clear formatting</MenuItem><MenuItem>Word count</MenuItem></Menu>,
];

const meta = {
  title: 'Components/Actions/Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Text formatting', orientation: 'horizontal', children: Formatting() },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }, children: { control: false } },
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Vertical: Story = {
  args: { orientation: 'vertical', 'aria-label': 'Drawing tools', children: [
    <ToggleButton key="s" icon="arrow_selector_tool" aria-label="Select" defaultPressed />,
    <ToggleButton key="p" icon="edit" aria-label="Pen" />,
    <ToggleButton key="e" icon="ink_eraser" aria-label="Eraser" />,
    <Divider key="d" />,
    <IconButton key="u" variant="ghost" icon="undo" label="Undo" />,
  ] },
};

export const Actions: Story = {
  args: { 'aria-label': 'Selected files', children: [
    <Button key="d" variant="outline" leftIcon="download">Download</Button>,
    <Button key="m" variant="outline" leftIcon="drive_file_move">Move</Button>,
    <Button key="x" variant="outline" leftIcon="delete" destructive>Delete</Button>,
  ] },
};
