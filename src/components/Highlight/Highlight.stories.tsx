import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Highlight } from './Highlight';
import { Input } from '../Input/Input';

const meta = {
  title: 'Components/Content/Highlight',
  component: Highlight,
  args: { children: 'Łódź, Poland', query: 'lodz' },
} satisfies Meta<typeof Highlight>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Accents and case don't matter: "lodz" marks "Łódź". */
export const Playground: Story = {};

/** words: every word of the query on its own. */
export const Words: Story = { args: { children: 'New York, United States', query: 'york new', words: true } };

const CITIES = ['São Paulo', 'Straße des 17. Juni, Berlin', 'Đà Nẵng', 'Zürich', 'Ørsted, Copenhagen', 'Tokyo'];
/** Search results: type to mark what matches. */
export const SearchResults: Story = {
  render: function Render() {
    const [q, setQ] = React.useState('sa');
    return (
      <div style={{ maxWidth: 320, display: 'grid', gap: 12 }}>
        <Input aria-label="Search cities" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul style={{ margin: 0, paddingInlineStart: 20, display: 'grid', gap: 4 }}>
          {CITIES.map((c) => <li key={c}><Highlight query={q}>{c}</Highlight></li>)}
        </ul>
      </div>
    );
  },
};

/** In an option (a command palette, a filtered list): the match keeps the text's weight and is underlined, so typing doesn't shift the letters. */
export const InOptions: Story = {
  render: function Render() {
    const [q, setQ] = React.useState('sa');
    return (
      <div style={{ maxWidth: 200, display: 'grid', gap: 12 }}>
        <Input aria-label="Filter cities" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul role="listbox" aria-label="Cities" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {CITIES.map((c) => (
            <li key={c} role="option" aria-selected={false} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Highlight query={q}>{c}</Highlight>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

export const LongText: Story = {
  args: { query: 'kapitän' },
  render: (args) => (
    <div style={{ width: 200 }}>
      <Highlight {...args}>{"Donaudampfschifffahrtsgesellschaftskapitänskajüte, a cabin on the Danube"}</Highlight>
    </div>
  ),
};
