import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer, type DrawerProps } from './Drawer';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Field } from '../Field/Field';
import { Checkbox } from '../Checkbox/Checkbox';

const meta = {
  title: 'Components/Overlays/Drawer',
  component: Drawer,
  args: { open: false, title: 'Filters', description: 'Narrow the list of projects.', side: 'right', size: 'md' },
  argTypes: { side: { control: 'inline-radio', options: ['right', 'left', 'top', 'bottom'] }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: function Render(args: DrawerProps) {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Open filters</Button>
      <Drawer {...args} open={open} onOpenChange={setOpen}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Reset</Button><Button onClick={() => setOpen(false)}>Apply</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Field label="Name"><Input placeholder="Search projects" /></Field>
          <Checkbox>Only mine</Checkbox>
          <Checkbox>Include archived</Checkbox>
        </div>
      </Drawer>
    </>;
  },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Left: Story = { args: { side: 'left', size: 'sm', title: 'Menu', description: undefined } };
export const Bottom: Story = { args: { side: 'bottom', title: 'Share', description: 'Anyone with the link can view.' } };
export const Top: Story = { args: { side: 'top', size: 'sm', title: 'Announcements', description: 'What changed this week.' } };
export const Small: Story = { args: { size: 'sm', title: 'Filters' } };
export const Large: Story = { args: { size: 'lg', title: 'Project details', description: 'Everything about Atlas in one place.' } };
export const NoCloseButton: Story = { args: { closeButton: false, title: 'Filters' } };
export const StaysOpenOnBackdropPress: Story = { name: 'Stays open on a backdrop press', args: { closeOnBackdrop: false, title: 'Unsaved filters', description: 'Apply or reset them to close.' } };
const NOTES = Array.from({ length: 24 }, (_, i) => <p key={i}>Release {24 - i}. Faster search, a new export menu, and fixes for the calendar in right-to-left pages.</p>);
/** A body taller than the screen with nothing focusable in it: Tab reaches the body, and the arrow keys scroll it. */
export const LongText: Story = {
  name: 'Long text',
  args: { title: 'Release notes', description: undefined },
  render: function Render(args: DrawerProps) {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Release notes</Button>
      <Drawer {...args} open={open} onOpenChange={setOpen}>{NOTES}</Drawer>
    </>;
  },
};

export const UnsavedChanges: Story = {
  name: 'Unsaved changes',
  args: { title: 'Edit project', description: undefined },
  render: function Render(args: DrawerProps) {
    const [open, setOpen] = React.useState(false), [saved, setSaved] = React.useState('Atlas'), [name, setName] = React.useState('Atlas');
    const show = () => { setName(saved); setOpen(true); };
    return <>
      <Button onClick={show}>Edit {saved}</Button>
      <Drawer {...args} open={open} onOpenChange={setOpen} unsaved={name !== saved}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { setSaved(name); setOpen(false); }}>Save</Button></>}>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      </Drawer>
    </>;
  },
};
