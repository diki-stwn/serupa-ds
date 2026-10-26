import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadMore } from './LoadMore';

const meta = {
  title: 'Components/Navigation/LoadMore',
  component: LoadMore,
  args: { onLoadMore: (): void => undefined, count: 20, total: 134 },
} satisfies Meta<typeof LoadMore>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Default: Story = {};
export const WithoutTotal: Story = { name: 'Without a total', args: { count: undefined, total: undefined } };
export const Loading: Story = { args: { loading: true } };
export const End: Story = { name: 'Nothing more', args: { hasMore: false, count: 134 } };

// A list that loads 10 more each time, 3 pages in all, slowly enough to see the button loading.
function Paged() {
  const [n, setN] = React.useState(10);
  const load = () => new Promise<void>((done) => setTimeout(() => { setN((x) => Math.min(x + 10, 30)); done(); }, 600));
  return (
    <div style={{ maxWidth: 360 }}>
      <ul style={{ margin: 0, paddingInlineStart: 20 }}>{Array.from({ length: n }, (_, i) => <li key={i}>Invoice {i + 1}</li>)}</ul>
      <LoadMore onLoadMore={load} count={n} total={30} hasMore={n < 30} />
    </div>
  );
}
export const InAList: Story = { name: 'In a list', render: () => <Paged /> };

// The stress story (G14): a long label and end text in a narrow column, and big numbers.
export const LongText: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <LoadMore onLoadMore={(): void => undefined} count={1234567} total={98765432} label="Show the next fifty Donaudampfschifffahrtsgesellschaft results" />
      <LoadMore onLoadMore={(): void => undefined} hasMore={false} endText="That’s every Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung record there is" />
    </div>
  ),
};
