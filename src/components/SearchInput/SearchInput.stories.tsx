import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchInput } from './SearchInput';

const meta = {
  title: 'Components/Forms/SearchInput',
  component: SearchInput,
  args: { 'aria-label': 'Search projects', placeholder: 'Search projects', size: 'md', loading: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-xs)' }}><Story /></div>],
} satisfies Meta<typeof SearchInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithText: Story = { args: { defaultValue: 'Atlas' } };
export const Loading: Story = { args: { defaultValue: 'Atl', loading: true } };
const PROJECTS = ['Atlas', 'Borealis', 'Cascade', 'Delta', 'Ember'];
export const Filtering: Story = {
  render: function Render() {
    const [q, setQ] = React.useState('');
    const shown = PROJECTS.filter((p) => p.toLowerCase().includes(q.toLowerCase()));
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      <SearchInput aria-label="Filter projects" placeholder="Filter projects" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul style={{ margin: 0 }}>{shown.map((p) => <li key={p}>{p}</li>)}</ul>
    </div>;
  },
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <SearchInput {...args} defaultValue={"Donaudampfschifffahrtsgesellschaftskapitänskajüte"} />
    </div>
  ),
};
