import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Forms/Textarea',
  component: Textarea,
  args: { placeholder: 'Tell us more', 'aria-label': 'Message', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, resize: { control: 'inline-radio', options: ['vertical', 'none'] } },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const AutoResize: Story = { name: 'Auto-resize', args: { autoResize: true, maxRows: 6, placeholder: 'Grows as you type, up to 6 lines' } };
export const Count: Story = { name: 'Character count', args: { showCount: true, maxLength: 280, defaultValue: 'A short note' } };

export const States: Story = {
  render: () => <div className="flex flex-col gap-3">
    <Textarea aria-label="Invalid" invalid defaultValue="Too short" />
    <Textarea aria-label="Read-only" readOnly defaultValue="Read-only" />
    <Textarea aria-label="Disabled" disabled defaultValue="Disabled" />
  </div>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 220 }}>
      <Textarea {...args} showCount maxLength={280} defaultValue={'Please call before delivery. Donaudampfschifffahrtsgesellschaftskapitänskajüte is the building at the end of the lane, past the second gate.'} />
    </div>
  ),
};
