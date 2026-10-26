import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Menu, MenuItem } from '../Menu/Menu';

const meta = {
  title: 'Components/Actions/ButtonGroup',
  component: ButtonGroup,
  args: {
    'aria-label': 'Clipboard',
    children: [<Button key="c" variant="outline" leftIcon="content_copy">Copy</Button>, <Button key="x" variant="outline" leftIcon="content_cut">Cut</Button>, <Button key="p" variant="outline" leftIcon="content_paste">Paste</Button>],
  },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }, children: { control: false } },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Spaced: Story = { args: { attached: false, 'aria-label': undefined, children: [<Button key="c" variant="outline">Cancel</Button>, <Button key="s">Save</Button>] } };

export const Vertical: Story = {
  args: { orientation: 'vertical', 'aria-label': 'Zoom', children: [<IconButton key="i" variant="outline" icon="add" label="Zoom in" />, <IconButton key="o" variant="outline" icon="remove" label="Zoom out" />] },
};

/** Small icon-only buttons, in a row and a column: each keeps a 24px target where the next one overlaps it. */
export const SmallIcons: Story = {
  render: () => (
    <div className="flex gap-4 items-start">
      <ButtonGroup aria-label="Text alignment">
        {['format_align_left', 'format_align_center', 'format_align_right'].map((i) => <IconButton key={i} variant="outline" size="sm" icon={i} label={i.replace('format_align_', 'Align ')} />)}
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <IconButton variant="outline" size="sm" icon="add" label="Zoom in" />
        <IconButton variant="outline" size="sm" icon="remove" label="Zoom out" />
      </ButtonGroup>
    </div>
  ),
};

export const SplitButton: Story = {
  args: { 'aria-label': 'Publish', children: [<Button key="p">Publish</Button>, <Menu key="m" placement="bottom-end" trigger={<IconButton variant="primary" icon="expand_more" label="More publish options" />}><MenuItem>Schedule</MenuItem><MenuItem>Save as draft</MenuItem></Menu>] },
};

/** Six buttons in a 288px column: the attached row doesn't fit, so it wraps as separate buttons. */
export const Narrow: Story = {
  args: { 'aria-label': 'Format', children: ['Bold', 'Italic', 'Underline', 'Strike', 'Code', 'Link'].map((t) => <Button key={t} variant="outline">{t}</Button>) },
  decorators: [(Story) => <div style={{ width: '288px' }}><Story /></div>],
};

export const LongLabels: Story = {
  render: (args) => (
    <div style={{ width: 240 }}>
      <ButtonGroup {...args}>
        <Button variant="outline">Copy every selected row</Button>
        <Button variant="outline">Cut</Button>
        <Button variant="outline">{"Donaudampfschifffahrtsgesellschaft"}</Button>
      </ButtonGroup>
    </div>
  ),
};
