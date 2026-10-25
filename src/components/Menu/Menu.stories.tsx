import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuSub, type MenuProps } from './Menu';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';

// Room around the trigger so the menu opens on the side the story asks for instead of flipping.
const frame = (style: React.CSSProperties) => function Frame(Story: React.ComponentType) { return <div style={{ minHeight: 300, ...style }}><Story /></div>; };

const meta = {
  title: 'Components/Overlays/Menu',
  component: Menu,
  args: { placement: 'bottom-start', open: true, trigger: <Button variant="secondary" rightIcon="expand_more">Actions</Button>, children: null },
  argTypes: { placement: { control: 'select', options: ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start'] }, trigger: { control: false }, children: { control: false } },
  decorators: [frame({})],
  // A story with open: true shows its menu open in its own canvas, where the Storybook test checks it in all six
  // themes. On the docs page only the Playground opens; the others open on a click, so they don't all take focus
  // and scroll the page down to the last one.
  render: function Render(args: MenuProps, ctx) {
    const open = ctx.viewMode === 'docs' && ctx.name !== 'Playground' ? undefined : args.open;
    return (
      <Menu {...args} open={open}>
        {args.children ?? <>
          <MenuItem icon="edit" shortcut="⌘E">Edit</MenuItem>
          <MenuItem icon="content_copy">Duplicate</MenuItem>
          <MenuItem icon="archive" disabled>Archive</MenuItem>
          <MenuSeparator />
          <MenuGroup label="Danger zone">
            <MenuItem icon="delete" destructive>Delete</MenuItem>
          </MenuGroup>
        </>}
      </Menu>
    );
  },
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const IconTrigger: Story = {
  name: 'From an icon button',
  args: { open: undefined, placement: 'bottom-end', trigger: <IconButton icon="more_vert" label="Row actions" /> },
  decorators: [(Story) => <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 400 }}><Story /></div>],
};

export const BottomEnd: Story = {
  name: 'Placement: bottom-end',
  args: { placement: 'bottom-end', trigger: <IconButton icon="more_vert" label="Row actions" variant="secondary" /> },
  decorators: [frame({ display: 'flex', justifyContent: 'center' })],
};
export const TopStart: Story = {
  name: 'Placement: top-start',
  args: { placement: 'top-start' },
  decorators: [frame({ display: 'flex', alignItems: 'flex-end' })],
};
export const TopEnd: Story = {
  name: 'Placement: top-end',
  args: { placement: 'top-end' },
  decorators: [frame({ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' })],
};
export const RightStart: Story = {
  name: 'Placement: right-start',
  args: { placement: 'right-start' },
};

export const WithoutIcons: Story = {
  name: 'Without icons',
  args: {
    trigger: <Button variant="outline" rightIcon="expand_more">Sort by</Button>,
    children: <>
      <MenuItem>Name</MenuItem>
      <MenuItem>Date modified</MenuItem>
      <MenuItem>Date created</MenuItem>
      <MenuItem>Size</MenuItem>
    </>,
  },
};
export const Shortcuts: Story = {
  name: 'With shortcuts',
  args: {
    trigger: <Button variant="secondary" rightIcon="expand_more">Edit</Button>,
    children: <>
      <MenuItem icon="undo" shortcut="⌘Z">Undo</MenuItem>
      <MenuItem icon="redo" shortcut="⇧⌘Z">Redo</MenuItem>
      <MenuSeparator />
      <MenuItem icon="content_cut" shortcut="⌘X">Cut</MenuItem>
      <MenuItem icon="content_copy" shortcut="⌘C">Copy</MenuItem>
      <MenuItem icon="content_paste" shortcut="⌘V" disabled>Paste</MenuItem>
      <MenuSeparator />
      <MenuItem icon="select_all" shortcut="⌘A">Select all</MenuItem>
    </>,
  },
  decorators: [frame({ minHeight: 380 })],
};
export const DisabledItems: Story = {
  name: 'Disabled items',
  args: {
    children: <>
      <MenuItem icon="edit">Rename</MenuItem>
      <MenuItem icon="share" disabled>Share (owners only)</MenuItem>
      <MenuItem icon="download" shortcut="⌘D" disabled>Download</MenuItem>
      <MenuSeparator />
      <MenuItem icon="delete" destructive disabled>Delete</MenuItem>
    </>,
  },
};
export const Groups: Story = {
  name: 'Groups and separators',
  args: {
    trigger: <Button variant="secondary" leftIcon="person" rightIcon="expand_more">Account</Button>,
    children: <>
      <MenuGroup label="ana@example.com">
        <MenuItem icon="person">Profile</MenuItem>
        <MenuItem icon="settings">Settings</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup label="Workspace">
        <MenuItem icon="group">Members</MenuItem>
        <MenuItem icon="credit_card">Billing</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuItem icon="logout">Sign out</MenuItem>
    </>,
  },
  decorators: [frame({ minHeight: 400 })],
};
/** Settings: MenuCheckboxItem for on or off, MenuRadioGroup for one of a set. You hold the state. */
export const Checkable: Story = {
  name: 'Checkable items',
  render: function Render() {
    const [grid, setGrid] = React.useState(true), [rulers, setRulers] = React.useState(false), [sort, setSort] = React.useState('name');
    return <Menu defaultOpen trigger={<Button variant="secondary" rightIcon="expand_more">View</Button>}>
      <MenuGroup label="Show">
        <MenuCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="⌘'">Grid</MenuCheckboxItem>
        <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers} shortcut="⌘R">Rulers</MenuCheckboxItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
        <MenuRadioItem value="name">Name</MenuRadioItem>
        <MenuRadioItem value="date">Date modified</MenuRadioItem>
        <MenuRadioItem value="size">Size</MenuRadioItem>
      </MenuRadioGroup>
    </Menu>;
  },
  decorators: [frame({ minHeight: 400 })],
};
export const Links: Story = {
  args: {
    trigger: <Button variant="secondary" leftIcon="help" rightIcon="expand_more">Help</Button>,
    children: <>
      <MenuItem icon="article" href="#docs">Documentation</MenuItem>
      <MenuItem icon="support_agent" href="#support">Contact support</MenuItem>
      <MenuItem icon="open_in_new" href="https://github.com/diki-stwn/serupa-ds" target="_blank">Source on GitHub</MenuItem>
      <MenuItem icon="new_releases" href="#changelog" disabled>What’s new</MenuItem>
    </>,
  },
};
export const LongLabels: Story = {
  name: 'Long labels',
  args: {
    style: { maxWidth: 280 },
    children: <>
      <MenuItem icon="folder">Move to “Quarterly planning and budget review”</MenuItem>
      <MenuItem icon="share" shortcut="⌘⇧S">Share with everyone in the Northwind workspace</MenuItem>
      <MenuItem icon="delete" destructive>Delete this project and all of its files for good</MenuItem>
    </>,
  },
};
export const Submenus: Story = {
  args: {
    trigger: <Button variant="secondary" rightIcon="expand_more">File</Button>,
    children: <>
      <MenuItem icon="add" shortcut="⌘N">New</MenuItem>
      <MenuSub icon="share" label="Share">
        <MenuItem icon="mail">Email</MenuItem>
        <MenuItem icon="link">Copy link</MenuItem>
        <MenuSub label="More apps">
          <MenuItem>Chat</MenuItem>
          <MenuItem>Notes</MenuItem>
        </MenuSub>
      </MenuSub>
      <MenuSub icon="drive_file_move" label="Move to">
        <MenuItem>Drafts</MenuItem>
        <MenuItem>Archive</MenuItem>
      </MenuSub>
      <MenuSeparator />
      <MenuItem icon="close">Close</MenuItem>
    </>,
  },
  decorators: [frame({ minHeight: 360, paddingInlineEnd: 480 })],
};

// Opened (controlled) it shows at the target's corner; in the page a right-click opens it at the pointer.
export const Context: Story = {
  render: function Render(_args, ctx) {
    const open = ctx.viewMode === 'docs' ? undefined : true;
    return <ContextMenu aria-label="File actions" open={open} target={<div tabIndex={0} style={{ width: 280, padding: 16, border: '1px dashed var(--border)', borderRadius: 8 }}>Right-click, or focus and press Shift+F10</div>}>
      <MenuItem icon="open_in_new">Open</MenuItem>
      <MenuItem icon="edit">Rename</MenuItem>
      <MenuSeparator />
      <MenuItem icon="delete" destructive>Delete</MenuItem>
    </ContextMenu>;
  },
};
