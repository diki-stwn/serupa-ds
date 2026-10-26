import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleGroup } from './ToggleGroup';
import { ToggleButton } from '../ToggleButton/ToggleButton';

const meta = {
  title: 'Components/Actions/ToggleGroup',
  component: ToggleGroup,
  args: {
    'aria-label': 'Text alignment', type: 'single', defaultValue: ['left'],
    children: [
      <ToggleButton key="l" value="left" icon="format_align_left" aria-label="Align left" />,
      <ToggleButton key="c" value="center" icon="format_align_center" aria-label="Align center" />,
      <ToggleButton key="r" value="right" icon="format_align_right" aria-label="Align right" />,
    ],
  },
  argTypes: { type: { control: 'inline-radio', options: ['single', 'multiple'] }, children: { control: false } },
} satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: {
    'aria-label': 'Text style', type: 'multiple', defaultValue: ['bold', 'underline'],
    children: [
      <ToggleButton key="b" value="bold" icon="format_bold" aria-label="Bold" />,
      <ToggleButton key="i" value="italic" icon="format_italic" aria-label="Italic" />,
      <ToggleButton key="u" value="underline" icon="format_underlined" aria-label="Underline" />,
    ],
  },
};

export const WithLabels: Story = {
  args: {
    'aria-label': 'View', required: true, defaultValue: ['week'], attached: false, variant: 'ghost', size: 'sm',
    children: [
      <ToggleButton key="d" value="day">Day</ToggleButton>,
      <ToggleButton key="w" value="week">Week</ToggleButton>,
      <ToggleButton key="m" value="month">Month</ToggleButton>,
    ],
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const LongLabels: Story = {
  args: {
    children: [
      <ToggleButton key="d" value="day">Every day of the week</ToggleButton>,
      <ToggleButton key="w" value="week">Weekdays only</ToggleButton>,
      <ToggleButton key="m" value="month">Once a month</ToggleButton>,
    ],
    defaultValue: ['week'],
    'aria-label': 'Schedule',
  },
  render: (args) => <div style={{ width: 240 }}><ToggleGroup {...args} /></div>,
};
