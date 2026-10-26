import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, type PopoverProps } from './Popover';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Checkbox } from '../Checkbox/Checkbox';

// Room on every side of the trigger, so the panel opens where the story asks instead of flipping.
const centered = (Story: React.ComponentType) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 520 }}><Story /></div>;

const meta = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  args: {
    title: 'Share',
    trigger: <Button variant="outline" leftIcon="share">Share</Button>,
    children: ((close: () => void) => (
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); close(); }}>
        <Field label="Email"><Input type="email" placeholder="name@example.com" /></Field>
        <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={close}>Cancel</Button><Button size="sm" type="submit">Invite</Button></div>
      </form>
    )) as PopoverProps['children'],
  },
  argTypes: { placement: { control: 'select', options: ['bottom', 'bottom-start', 'bottom-end', 'top', 'top-start', 'top-end', 'right', 'right-start', 'left', 'left-start'] }, trigger: { control: false }, children: { control: false } },
  // A story with open: true shows its panel open in its own canvas, where the Storybook test checks it in all six
  // themes. On the docs page it opens on a click instead, so the open panels don't all take focus and scroll the
  // page down to the last one.
  render: function Render(args: PopoverProps, ctx) {
    const popover = <Popover {...args} open={ctx.viewMode === 'docs' ? undefined : args.open} />;
    return ctx.parameters.centered ? popover : <div style={{ padding: '24px 120px', minHeight: 260 }}>{popover}</div>;
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Info: Story = {
  render: () => (
    <div style={{ padding: 24, minHeight: 160 }}>
      <Popover aria-label="About billing" placement="right-start" initialFocus="panel" trigger={<IconButton icon="info" label="About billing" />}>
        You're billed on the 1st of each month. Changes apply from the next bill.
      </Popover>
    </div>
  ),
};

export const Bottom: Story = { name: 'Placement: bottom', args: { open: true, placement: 'bottom' }, decorators: [centered], parameters: { centered: true } };
export const Top: Story = { name: 'Placement: top', args: { open: true, placement: 'top' }, decorators: [centered], parameters: { centered: true } };
export const Right: Story = { name: 'Placement: right', args: { open: true, placement: 'right' }, decorators: [centered], parameters: { centered: true } };
export const Left: Story = { name: 'Placement: left', args: { open: true, placement: 'left' }, decorators: [centered], parameters: { centered: true } };
export const BottomEnd: Story = { name: 'Placement: bottom-end', args: { open: true, placement: 'bottom-end' }, decorators: [centered], parameters: { centered: true } };
export const TopStart: Story = { name: 'Placement: top-start', args: { open: true, placement: 'top-start' }, decorators: [centered], parameters: { centered: true } };
export const TopEnd: Story = { name: 'Placement: top-end', args: { open: true, placement: 'top-end' }, decorators: [centered], parameters: { centered: true } };
export const RightEnd: Story = { name: 'Placement: right-end', args: { open: true, placement: 'right-end' }, decorators: [centered], parameters: { centered: true } };
export const LeftStart: Story = { name: 'Placement: left-start', args: { open: true, placement: 'left-start' }, decorators: [centered], parameters: { centered: true } };
export const LeftEnd: Story = { name: 'Placement: left-end', args: { open: true, placement: 'left-end' }, decorators: [centered], parameters: { centered: true } };

export const WithoutTitle: Story = {
  name: 'Without a title',
  args: {
    open: true, title: undefined, 'aria-label': 'About billing', initialFocus: 'panel', placement: 'right-start',
    trigger: <IconButton icon="info" label="About billing" variant="secondary" />,
    children: 'You’re billed on the 1st of each month. Changes apply from the next bill.',
  },
};
export const Filters: Story = {
  name: 'With checkboxes and actions',
  args: {
    open: true, title: 'Filter projects', placement: 'bottom-start',
    trigger: <Button variant="secondary" leftIcon="filter_list">Filters</Button>,
    children: (close: () => void) => (
      <div className="flex flex-col gap-3">
        <Checkbox defaultChecked>Active</Checkbox>
        <Checkbox>Archived</Checkbox>
        <Checkbox disabled>Shared with me (none yet)</Checkbox>
        <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={close}>Reset</Button><Button size="sm" onClick={close}>Apply</Button></div>
      </div>
    ),
  },
  decorators: [(Story) => <div style={{ minHeight: 300 }}><Story /></div>],
};
export const LongContent: Story = {
  name: 'Long content',
  args: {
    open: true, title: 'What changes on the new plan', placement: 'bottom-start', initialFocus: 'panel',
    trigger: <Button variant="outline" leftIcon="info">Plan details</Button>,
    children: <>
      <p>Your workspace moves to the Team plan on the 1st of next month. Every member keeps their projects, files and comments, and nothing needs to be exported or set up again.</p>
      <p style={{ marginTop: 'var(--spacing-2)' }}>Storage goes from 10 GB to 100 GB, guests can comment on any project they’re invited to, and owners get a log of who changed what. You can switch back at any time from Billing.</p>
    </>,
  },
  decorators: [(Story) => <div style={{ minHeight: 360 }}><Story /></div>],
};
