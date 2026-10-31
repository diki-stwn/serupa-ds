import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox, type ComboboxSingleProps } from './Combobox';
import { Field } from '../Field/Field';
import { usePeople, useContent } from '../../../.storybook/content';

const COUNTRIES = ['Argentina', 'Australia', 'Brazil', 'Canada', 'Côte d’Ivoire', 'Denmark', 'Egypt', 'France', 'Germany', 'India', 'Japan', 'Kenya', 'Mexico', 'Norway', 'Peru'];
// The people come from the Content menu in the toolbar (demo, worst case, empty, one). The third one can't be picked.
const usePeopleOptions = () => usePeople().map((p, i) => ({ value: p.name, label: p.name, description: p.email, disabled: i === 2 || undefined }));
const meta = {
  title: 'Components/Forms/Combobox',
  component: Combobox as React.ComponentType<ComboboxSingleProps>,   // one pick; several are in Multiple
  args: { 'aria-label': 'Country', placeholder: 'Pick a country', options: COUNTRIES, size: 'md', clearable: false, disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-xs)', minHeight: 'var(--spacing-80)' }}><Story /></div>],
} satisfies Meta<ComboboxSingleProps>;
export default meta;
type Story = StoryObj<typeof meta>;

type Option = ReturnType<typeof usePeopleOptions>[number];
function Reviewers({ people }: { people: Option[] }) {
  const [team, setTeam] = React.useState<string[]>(() => people.slice(0, 2).map((p) => p.value));
  return <Field label="Reviewers" hint="Pick everyone who should review this.">
    <Combobox multiple clearable value={team} onValueChange={setTeam} options={people} placeholder="Add a reviewer" name="reviewers" emptyText={people.length ? undefined : 'No team members yet'} />
  </Field>;
}
function Owner({ people }: { people: Option[] }) {
  const [owner, setOwner] = React.useState<string | null>(people[1]?.value ?? people[0]?.value ?? null);
  return <Field label="Owner"><Combobox options={people} value={owner} onValueChange={setOwner} clearable leftIcon="person" emptyText={people.length ? undefined : 'No team members yet'} /></Field>;
}

export const Playground: Story = {};
export const Multiple: Story = {
  render: function Render() {
    const people = usePeopleOptions();
    // Keyed by the Content menu's choice, so a switch starts again from that content's first two people.
    return <Reviewers key={useContent()} people={people} />;
  },
};
// A pretend server: answers after 400ms with the countries that contain the text.
const search = (text: string, { signal }: { signal: AbortSignal }) => new Promise<string[]>((ok, no) => {
  const t = setTimeout(() => ok(COUNTRIES.filter((c) => c.toLowerCase().includes(text.toLowerCase()))), 400);
  signal.addEventListener('abort', () => { clearTimeout(t); no(new DOMException('Aborted', 'AbortError')); });
});
export const LoadOptions: Story = {
  name: 'With loadOptions',
  render: () => <Field label="Country"><Combobox placeholder="Search countries" loadOptions={search} clearable /></Field>,
};
export const WithDescriptions: Story = {
  render: function Render() {
    const people = usePeopleOptions();
    return <Owner key={useContent()} people={people} />;
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
    <Combobox aria-label="Read-only" options={COUNTRIES} defaultValue="Canada" readOnly />
  </Col>,
};

export const InAFieldWithAnError: Story = {
  name: 'In a field, with an error',
  render: () => <Field label="Country" error="Pick the country on your passport." required><Combobox options={COUNTRIES} placeholder="Pick a country" /></Field>,
};

export const LongOptions: Story = {
  args: { options: ['The Democratic Republic of São Tomé and Príncipe', 'Saint Vincent and the Grenadines', 'Donaudampfschifffahrtsgesellschaftskapitänskajüte', ...COUNTRIES], defaultValue: 'The Democratic Republic of São Tomé and Príncipe' },
  decorators: [(Story) => <div style={{ width: 200, minHeight: 'var(--spacing-80)' }}><Story /></div>],
};
