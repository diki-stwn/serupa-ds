import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneInput } from './PhoneInput';
import { Field } from '../Field/Field';
import { formatPhone } from './phone';

const meta = {
  title: 'Components/Forms/PhoneInput',
  component: PhoneInput,
  args: { 'aria-label': 'Phone number', defaultCountry: 'ID' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => <div style={{ maxWidth: 320 }}><PhoneInput {...args} /></div>,
} satisfies Meta<typeof PhoneInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InAField: Story = {
  render: () => <div style={{ maxWidth: 320 }}><Field label="Mobile number" hint="We'll text you a code"><PhoneInput defaultCountry="ID" name="phone" /></Field></div>,
};

/** onValueChange reports E.164; formatPhone writes it back out for reading. */
export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = React.useState('+6281234567890');
    return <div style={{ maxWidth: 320, display: 'grid', gap: 8 }}>
      <Field label="Phone number"><PhoneInput value={value} onValueChange={setValue} /></Field>
      <p style={{ margin: 0 }}>Saved as <code>{value || '""'}</code>, shown as {formatPhone(value) || 'nothing'}</p>
    </div>;
  },
};

export const SomeCountries: Story = { args: { countries: ['ID', 'SG', 'MY', 'TH', 'VN', 'PH'], defaultValue: '+6591234567' } };

export const States: Story = {
  render: () => <div style={{ maxWidth: 320, display: 'grid', gap: 12 }}>
    <Field label="Invalid" error="Enter the whole number."><PhoneInput defaultValue="+62812" /></Field>
    <Field label="Disabled"><PhoneInput defaultValue="+12015550123" disabled /></Field>
    <Field label="Small"><PhoneInput defaultValue="+447400123456" size="sm" /></Field>
    <Field label="Large"><PhoneInput defaultValue="+819012345678" size="lg" /></Field>
  </div>,
};

/** Shared calling codes go by the area (+1 416 is Canada, +1 684 American Samoa), and Germany, Japan and London group by their area code length. */
export const ByArea: Story = {
  render: () => <div style={{ maxWidth: 320, display: 'grid', gap: 12 }}>
    <Field label="Toronto"><PhoneInput defaultValue="+14165550199" /></Field>
    <Field label="American Samoa"><PhoneInput defaultValue="+16847331234" /></Field>
    <Field label="Berlin"><PhoneInput defaultValue="+4930123456" /></Field>
    <Field label="German mobile"><PhoneInput defaultValue="+4915123456789" /></Field>
    <Field label="Tokyo"><PhoneInput defaultValue="+81312345678" /></Field>
    <Field label="Sri Lanka"><PhoneInput defaultValue="+94771234567" /></Field>
  </div>,
};

/** countries takes your own rows: here Singapore grouped in pairs, in place of the built-in row. */
export const OwnRows: Story = {
  args: { countries: ['ID', 'MY', { code: 'SG', dial: '65', trunk: '', pattern: '## ## ## ##', min: 8, max: 8 }], defaultValue: '+6591234567' },
};

export const LongValue: Story = {
  args: { defaultValue: '+62 812 3456 7890 1234' },
  render: (args) => <div style={{ width: 200 }}><PhoneInput {...args} /></div>,
};
