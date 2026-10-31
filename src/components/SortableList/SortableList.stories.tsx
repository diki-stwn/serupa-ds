import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortableList } from './SortableList';

type Task = { id: string; title: string; owner: string };
const TASKS: Task[] = [
  { id: 't1', title: 'Write the launch brief', owner: 'Ada' },
  { id: 't2', title: 'Review the design tokens', owner: 'Grace' },
  { id: 't3', title: 'Record the demo', owner: 'Alan' },
  { id: 't4', title: 'Update the changelog', owner: 'Katherine' },
];
function Tasks(props: { disabled?: boolean }) {
  const [items, setItems] = React.useState(TASKS);
  return <div style={{ maxWidth: '24rem' }}>
    <SortableList aria-label="Launch tasks" items={items} getKey={(t) => t.id} getLabel={(t) => t.title} onReorder={setItems} disabled={props.disabled}
      renderItem={(t) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-3)' }}><span>{t.title}</span><span style={{ color: 'var(--text-muted)' }}>{t.owner}</span></div>} />
  </div>;
}

const meta = {
  title: 'Components/Content/SortableList',
  component: SortableList,
  args: { items: TASKS, getKey: (t: unknown) => (t as Task).id, getLabel: (t: unknown) => (t as Task).title, renderItem: (t: unknown) => (t as Task).title, onReorder: () => undefined },
  render: () => <Tasks />,
} satisfies Meta<typeof SortableList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Disabled: Story = { render: () => <Tasks disabled /> };

export const LongText: Story = {
  render: () => (
    <div style={{ width: 220 }}>
      <SortableList aria-label="Launch tasks" items={[{ id: 'a', title: 'Write the launch brief for every region and partner', owner: 'Ada' }, { id: 'b', title: 'Donaudampfschifffahrtsgesellschaftskapitänskajüte', owner: 'Grace' }]} getKey={(t) => t.id} getLabel={(t) => t.title} onReorder={() => undefined} renderItem={(t) => t.title} />
    </div>
  ),
};

const COLUMNS = [{ id: 'todo', title: 'To do' }, { id: 'doing', title: 'Doing' }, { id: 'review', title: 'Review' }, { id: 'done', title: 'Done' }];
/** orientation="horizontal": the items run in a row, such as a board's columns or a set of tabs. */
export const Horizontal: Story = {
  render: function Render() {
    const [items, setItems] = React.useState(COLUMNS);
    return <SortableList aria-label="Board columns" orientation="horizontal" items={items} getKey={(c) => c.id} getLabel={(c) => c.title} onReorder={setItems} renderItem={(c) => c.title} />;
  },
};
