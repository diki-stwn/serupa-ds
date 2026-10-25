import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from './SegmentedControl';
import { Field } from '../Field/Field';

const PERIODS = [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }];
const meta = {
  title: 'Components/Forms/SegmentedControl',
  component: SegmentedControl,
  args: { 'aria-label': 'Period', options: PERIODS, defaultValue: 'week', size: 'md', fullWidth: false, disabled: false, invalid: false, readOnly: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithIcons: Story = { args: { 'aria-label': 'View', defaultValue: 'list', options: [{ value: 'list', icon: 'list', label: 'List' }, { value: 'board', icon: 'view_kanban', label: 'Board' }, { value: 'calendar', icon: 'calendar_month', label: 'Calendar' }] } };
export const IconOnly: Story = { args: { 'aria-label': 'Text alignment', size: 'sm', defaultValue: 'left', options: [{ value: 'left', icon: 'format_align_left', 'aria-label': 'Left' }, { value: 'center', icon: 'format_align_center', 'aria-label': 'Center' }, { value: 'right', icon: 'format_align_right', 'aria-label': 'Right' }] } };
export const FullWidth: Story = { args: { fullWidth: true }, decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>] };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Invalid: Story = { render: (args) => <Field label="Period" required error="Pick the period to report on"><SegmentedControl {...args} /></Field> };
