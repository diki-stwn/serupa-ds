import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox, type ComboboxSingleProps } from './Combobox';
import { Field } from '../Field/Field';

const COUNTRIES = ['Argentina', 'Australia', 'Brazil', 'Canada', 'Côte d’Ivoire', 'Denmark', 'Egypt', 'France', 'Germany', 'India', 'Japan', 'Kenya', 'Mexico', 'Norway', 'Peru'];
const PEOPLE = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@example.com' },
  { value: 'grace', label: 'Grace Hopper', description: 'grace@example.com' },
  { value: 'linus', label: 'Linus Torvalds', description: 'linus@example.com', disabled: true },
  { value: 'margaret', label: 'Margaret Hamilton', description: 'margaret@example.com' },
];
const meta = {
  title: 'Components/Forms/Combobox',
  component: Combobox as React.ComponentType<ComboboxSingleProps>,   // one pick; several are in Multiple
  args: { 'aria-label': 'Country', placeholder: 'Pick a country', options: COUNTRIES, size: 'md', clearable: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-xs)', minHeight: 'var(--spacing-80)' }}><Story /></div>],
} satisfies Meta<ComboboxSingleProps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Multiple: Story = {
  render: function Render() {
    const [team, setTeam] = React.useState<string[]>(['ada', 'grace']);
    return <Field label="Reviewers" hint="Pick everyone who should review this.">
      <Combobox multiple clearable value={team} onValueChange={setTeam} options={PEOPLE} placeholder="Add a reviewer" name="reviewers" />
    </Field>;
  },
};
export const WithDescriptions: Story = {
  render: function Render() {
    const [owner, setOwner] = React.useState<string | null>('grace');
    return <Field label="Owner"><Combobox options={PEOPLE} value={owner} onValueChange={setOwner} clearable leftIcon="person" /></Field>;
  },
};
export const FromAServer: Story = {
  render: function Render() {
    const [q, setQ] = React.useState('');
    const [results, setResults] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
      if (!q) { setResults([]); return; }
      setLoading(true);
      const id = setTimeout(() => { setResults(COUNTRIES.filter((c) => c.toLowerCase().startsWith(q.toLowerCase()))); setLoading(false); }, 400);
      return () => clearTimeout(id);
    }, [q]);
    return <Field label="Country"><Combobox options={results} filter={false} loading={loading} onInputChange={setQ} placeholder="Start typing" emptyText={q ? 'No countries found' : 'Type to search'} /></Field>;
  },
};

const Col = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>{children}</div>;

export const Sizes: Story = {
  render: () => <Col>
    <Combobox aria-label="Small" size="sm" options={COUNTRIES} defaultValue="Kenya" />
    <Combobox aria-label="Medium" options={COUNTRIES} defaultValue="Kenya" />
    <Combobox aria-label="Large" size="lg" options={COUNTRIES} defaultValue="Kenya" />
  </Col>,
};

export const States: Story = {
  render: () => <Col>
    <Combobox aria-label="Empty" options={COUNTRIES} placeholder="Pick a country" />
    <Combobox aria-label="Chosen, clearable" options={COUNTRIES} defaultValue="Japan" clearable />
    <Combobox aria-label="With an icon" options={COUNTRIES} defaultValue="Peru" leftIcon="public" />
    <Combobox aria-label="Invalid" options={COUNTRIES} defaultValue="Norway" invalid />
    <Combobox aria-label="Disabled" options={COUNTRIES} defaultValue="Egypt" disabled />
  </Col>,
};

export const InAFieldWithAnError: Story = {
  name: 'In a field, with an error',
  render: () => <Field label="Country" error="Pick the country on your passport." required><Combobox options={COUNTRIES} placeholder="Pick a country" /></Field>,
};
