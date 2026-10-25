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
