import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';
import { iconArg } from '../../../.storybook/icon-arg';

const meta = {
  title: 'Components/Forms/Select',
  component: Select,
  args: { 'aria-label': 'Country', placeholder: 'Choose a country', options: ['Indonesia', 'Malaysia', 'Singapore', 'Thailand'], size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, leftIcon: iconArg },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Groups: Story = {
  args: {
    placeholder: 'Pick a plan',
    options: [{ label: 'Monthly', options: [{ value: 'm-basic', label: 'Basic' }, { value: 'm-pro', label: 'Pro' }] },
      { label: 'Yearly', options: [{ value: 'y-basic', label: 'Basic' }, { value: 'y-pro', label: 'Pro', disabled: true }] }],
  },
};

export const WithIcon: Story = { name: 'With an icon', args: { leftIcon: 'public' } };

export const States: Story = {
  render: () => <div className="flex flex-col gap-3">
    <Select aria-label="Size small" size="sm" options={['Small']} />
    <Select aria-label="Size large" size="lg" options={['Large']} />
    <Select aria-label="Invalid" invalid placeholder="Required" options={['One']} />
    <Select aria-label="Disabled" disabled options={['Disabled']} />
  </div>,
};

export const LongOptions: Story = {
  args: { options: ['The Democratic Republic of São Tomé and Príncipe', 'Saint Vincent and the Grenadines', 'Donaudampfschifffahrtsgesellschaftskapitänskajüte'], defaultValue: 'The Democratic Republic of São Tomé and Príncipe' },
  decorators: [(Story) => <div style={{ width: 200 }}><Story /></div>],
};
