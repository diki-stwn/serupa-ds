import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ErrorSummary } from './ErrorSummary';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';

const ERRORS = [
  { field: 'es-name', message: 'Enter your full name' },
  { field: 'es-email', message: 'Enter an email address in the right format, like name@example.com' },
  { field: 'es-date', message: 'Start date must be today or in the future' },
];

const meta = {
  title: 'Components/Forms/ErrorSummary',
  component: ErrorSummary,
  args: { errors: ERRORS, autoFocus: false },
} satisfies Meta<typeof ErrorSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Default: Story = {};
export const OneError: Story = { args: { errors: [ERRORS[1]] } };
export const WithDescription: Story = { args: { title: 'Check your booking', description: 'Fix these before you send the form again.' } };
// In a form: each link moves focus to its field and shows the field's label.
export const InAForm: Story = {
  render: (args) => (
    <form noValidate style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <ErrorSummary {...args} />
      <Field label="Full name" error="Enter your full name"><Input id="es-name" /></Field>
      <Field label="Email" error="Enter an email address in the right format, like name@example.com"><Input id="es-email" type="email" defaultValue="name@" /></Field>
      <Field label="Start date" error="Start date must be today or in the future"><Input id="es-date" type="date" /></Field>
    </form>
  ),
};
// The stress story (G14): long words, long messages and many errors; the visual baselines show how it wraps.
export const LongText: Story = {
  args: {
    title: 'Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung needs a few more answers',
    errors: Array.from({ length: 8 }, (_, k) => ({ field: 'long-' + k, message: k % 2 ? 'Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherungsnummer is missing' : 'Enter a description long enough to wrap onto a second line in a narrow column, so the list shows how it wraps' })),
  },
};
