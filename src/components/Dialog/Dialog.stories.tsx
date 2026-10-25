import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog, type DialogProps } from './Dialog';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Overlays/Dialog',
  component: Dialog,
  args: { open: false, title: 'Invite people', description: 'They’ll get an email with a link.', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: function Render(args: DialogProps) {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Invite people</Button>
      <Dialog {...args} open={open} onOpenChange={setOpen}
        footer={args.alert ? <><Button variant="secondary" onClick={() => setOpen(false)}>Keep</Button><Button destructive onClick={() => setOpen(false)}>Delete</Button></>
          : <><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Send invite</Button></>}>
        {args.alert ? null : <Field label="Email"><Input type="email" placeholder="name@company.com" /></Field>}
      </Dialog>
    </>;
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Confirmation: Story = { args: { alert: true, size: 'sm', title: 'Delete Atlas?', description: 'This removes the project and its files. It can’t be undone.' } };
export const Small: Story = { args: { size: 'sm', title: 'Rename project', description: undefined } };
export const Large: Story = { args: { size: 'lg', title: 'Share Atlas', description: 'Anyone you invite can view and comment.' } };
export const FullScreen: Story = { args: { fullScreen: true, title: 'Edit profile', description: 'Changes show on your public page.' } };
export const NoCloseButton: Story = { args: { closeButton: false, title: 'Invite people' } };
const TERMS = Array.from({ length: 24 }, (_, i) => <p key={i}>Section {i + 1}. You keep the rights to what you upload. We store it only to show it to the people you share it with, and delete it 30 days after you remove it.</p>);
/** A body taller than the screen with nothing focusable in it: Tab reaches the body, and the arrow keys scroll it. */
export const LongText: Story = {
  name: 'Long text',
  args: { title: 'Terms of use', description: undefined },
  render: function Render(args: DialogProps) {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Read the terms</Button>
      <Dialog {...args} open={open} onOpenChange={setOpen} footer={<Button onClick={() => setOpen(false)}>Accept</Button>}>{TERMS}</Dialog>
    </>;
  },
};
