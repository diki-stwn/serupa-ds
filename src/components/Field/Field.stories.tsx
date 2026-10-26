import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from './Field';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';
import { Select } from '../Select/Select';
import { Checkbox } from '../Checkbox/Checkbox';
import { Radio, RadioGroup } from '../Radio/Radio';

const meta = {
  title: 'Components/Forms/Field',
  component: Field,
  args: { label: 'Email', hint: "We'll send the receipt here.", required: true },
  render: (args) => <Field {...args}><Input type="email" placeholder="you@example.com" /></Field>,
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithError: Story = { name: 'With an error', args: { error: 'Enter an email address like name@example.com' } };
export const Optional: Story = { args: { label: 'Company', hint: undefined, required: false, optional: true } };
export const Disabled: Story = { args: { disabled: true } };

export const OtherControls: Story = {
  name: 'Other controls',
  render: () => <div className="flex flex-col gap-4">
    <Field label="Message" hint="Up to 280 characters"><Textarea showCount maxLength={280} /></Field>
    <Field label="Country"><Select placeholder="Choose a country" options={['Indonesia', 'Malaysia', 'Singapore']} /></Field>
  </div>,
};

export const Group: Story = {
  name: 'Group of checkboxes or radios',
  render: () => <div className="flex flex-col gap-4">
    <Field group label="Notifications" hint="Pick any">
      <Checkbox defaultChecked>Email</Checkbox><Checkbox>SMS</Checkbox>
    </Field>
    <Field group required label="Plan" error="Choose a plan">
      <RadioGroup><Radio value="free">Free</Radio><Radio value="pro">Pro</Radio></RadioGroup>
    </Field>
  </div>,
};

export const LongText: Story = {
  args: {
    label: 'The email address we should send every receipt and invoice to',
    hint: 'We send one receipt per payment, plus a monthly summary for Donaudampfschifffahrtsgesellschaftskapitänskajüte.',
    error: 'Enter an email address like name@example.com, without spaces before or after it',
  },
  decorators: [(Story) => <div style={{ maxWidth: 240 }}><Story /></div>],
};
