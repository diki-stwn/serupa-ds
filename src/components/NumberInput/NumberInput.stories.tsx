import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberInput } from './NumberInput';
import { Field } from '../Field/Field';

const meta = {
  title: 'Components/Forms/NumberInput',
  component: NumberInput,
  args: { 'aria-label': 'Quantity', defaultValue: 1, min: 0, max: 99, step: 1, size: 'md', steppers: true, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-3xs)' }}><Story /></div>],
} satisfies Meta<typeof NumberInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Decimals: Story = { args: { 'aria-label': 'Price', defaultValue: 9.5, step: 0.25, max: undefined, leftIcon: 'attach_money' } };
export const Locales: Story = {
  render: () => <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
    <Field label="Harga (id-ID, rupiah)"><NumberInput locale="id-ID" defaultValue={1500000} step={500} min={0} formatOptions={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }} /></Field>
    <Field label="Gewicht (de-DE)" hint="9,5 or 9.5 both work"><NumberInput locale="de-DE" defaultValue={9.5} step={0.1} /></Field>
    <Field label="Rate (en-US, percent)"><NumberInput locale="en-US" defaultValue={0.15} step={0.01} min={0} max={1} formatOptions={{ style: 'percent' }} /></Field>
  </div>,
};
export const Controlled: Story = {
  render: function Render() {
    const [guests, setGuests] = React.useState<number | null>(2);
    return <Field label="Guests" hint={guests == null ? 'Enter a number' : `${guests} ${guests === 1 ? 'guest' : 'guests'}`}>
      <NumberInput value={guests} onValueChange={setGuests} min={1} max={8} />
    </Field>;
  },
};
export const Currency: Story = {
  render: function Render() {
    const [cents, setCents] = React.useState<number | null>(1999);
    return <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
      <Field label="Price (en-US, US dollars)" hint={`Stored as ${cents ?? 'nothing'} cents`}><NumberInput locale="en-US" currency="USD" minorUnits value={cents} onValueChange={setCents} min={0} /></Field>
      <Field label="Preis (de-DE, euros)"><NumberInput locale="de-DE" currency="EUR" defaultValue={19.99} min={0} /></Field>
      <Field label="Harga (id-ID, rupiah)"><NumberInput locale="id-ID" currency="IDR" defaultValue={150000} step={1000} min={0} /></Field>
      <Field label="Price (ja-JP, yen)"><NumberInput locale="ja-JP" currency="JPY" defaultValue={1980} step={10} min={0} /></Field>
    </div>;
  },
};

export const LongValue: Story = {
  args: { defaultValue: 123456789012, max: undefined },
  decorators: [(Story) => <div style={{ width: 140 }}><Story /></div>],
};
