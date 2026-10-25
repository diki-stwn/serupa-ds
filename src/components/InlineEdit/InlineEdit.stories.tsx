import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineEdit } from './InlineEdit';

const meta = {
  title: 'Components/Forms/InlineEdit',
  component: InlineEdit,
  args: { label: 'Project name', defaultValue: 'Apollo launch plan', placeholder: 'Add a name' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof InlineEdit>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = {
  render: () => <div style={{ display: 'grid', gap: 'var(--spacing-2)', maxWidth: '24rem' }}>
    {(['sm', 'md', 'lg'] as const).map((s) => <InlineEdit key={s} size={s} label={`Name (${s})`} defaultValue={`A ${s} title`} />)}
  </div>,
};
export const States: Story = {
  render: () => <div style={{ display: 'grid', gap: 'var(--spacing-2)', maxWidth: '24rem' }}>
    <InlineEdit label="Description" placeholder="Add a description" />
    <InlineEdit label="Owner" defaultValue="Ada Lovelace" readOnly />
    <InlineEdit label="Workspace" defaultValue="Serupa" disabled />
  </div>,
};
export const WithValidation: Story = {
  name: 'With validation',
  render: function Render() {
    const [name, setName] = React.useState('apollo-plan');
    return <div style={{ display: 'grid', gap: 'var(--spacing-1)', maxWidth: '24rem' }}>
      <InlineEdit label="Slug" value={name} onValueChange={setName}
        validate={(v) => (v.trim() === '' ? 'Enter a slug.' : /\s/.test(v) ? 'Use dashes instead of spaces.' : null)} inputProps={{ spellCheck: false, maxLength: 40 }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', paddingInline: 'var(--spacing-3)' }}>serupa.app/{name}</span>
    </div>;
  },
};
// validate returning a Promise, as a check on the server would: "apollo" is taken.
export const WithServerCheck: Story = {
  name: 'With a server check',
  render: () => <div style={{ maxWidth: '24rem' }}>
    <InlineEdit label="Slug" defaultValue="apollo-plan" inputProps={{ spellCheck: false }}
      validate={(v) => new Promise((done) => { setTimeout(() => done(v === 'apollo' ? 'That slug is taken.' : null), 600); })} />
  </div>,
};
