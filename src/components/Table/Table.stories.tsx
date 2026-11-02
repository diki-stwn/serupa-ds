import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableActionBar, TableBody, TableVirtualBody, TableCell, TableFoot, TableHead, TableHeaderCell, TableRow, TableSelectCell, type SortDirection } from './Table';
import { Text } from '../Text/Text';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { FormattedNumber } from '../FormattedNumber/FormattedNumber';
import { usePeople } from '../../../.storybook/content';

// The rows follow the toolbar's Content menu: demo, the worst case, none or one (.storybook/content.ts).
function Rows({ selected }: { selected?: number }) {
  const people = usePeople();
  return (
    <>
      <TableHead>
        <TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell><TableHeaderCell align="end">Calls</TableHeaderCell></TableRow>
      </TableHead>
      <TableBody>
        {people.length ? null : <TableRow><TableCell colSpan={4}><Text as="span" tone="muted">No team members yet</Text></TableCell></TableRow>}
        {people.map((p, i) => (
          <TableRow key={p.name} selected={selected === undefined ? undefined : i === selected}>
            <TableCell>{p.name}</TableCell>
            <TableCell><Text as="span" tone="muted">{p.role || 'No role'}</Text></TableCell>
            <TableCell><Badge tone={p.status === 'Active' ? 'success' : 'neutral'}>{p.status}</Badge></TableCell>
            <TableCell align="end"><FormattedNumber value={p.calls} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
}

const meta = {
  title: 'Components/Content/Table',
  component: Table,
  args: { caption: 'Team members' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  render: (args) => <Table {...args}><Rows /></Table>,
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Striped: Story = { args: { striped: true, size: 'sm' } };

export const Selected: Story = { render: (args) => <Table {...args}><Rows selected={1} /></Table> };

/** Each row links to the person's page through one real link in its name cell, stretched over the row: click anywhere
 *  on a row, Ctrl/Cmd-click for a new tab, or Tab to the name. The checkboxes and Edit buttons sit above the link and work on their own. */
function LinkedRows(args: React.ComponentProps<typeof Table>) {
  const people = usePeople();
  return (
      <Table {...args}>
        <TableHead>
          <TableRow><TableHeaderCell><VisuallyHidden>Select</VisuallyHidden></TableHeaderCell><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell><TableHeaderCell><VisuallyHidden>Actions</VisuallyHidden></TableHeaderCell></TableRow>
        </TableHead>
        <TableBody>
          {people.map((p) => (
            <TableRow key={p.name} href={'#' + encodeURIComponent(p.name)}>
              <TableSelectCell label={'Select ' + p.name} />
              <TableCell>{p.name}</TableCell>
              <TableCell><Text as="span" tone="muted">{p.role || 'No role'}</Text></TableCell>
              <TableCell align="end"><Button size="sm" variant="ghost" aria-label={'Edit ' + p.name}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
export const RowLinks: Story = { render: (args) => <LinkedRows {...args} /> };

export const SelectableRows: Story = {
  render: function Render(args) {
    const people = usePeople();
    const [picked, setPicked] = React.useState<string[]>(people.slice(1, 2).map((p) => p.name));
    const all = people.length > 0 && picked.length === people.length;
    const toggle = (n: string) => setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);
    return <Table {...args}>
      <TableHead><TableRow>
        <TableSelectCell header label="Select all rows" checked={all} indeterminate={!all && picked.length > 0} onChange={() => setPicked(all ? [] : people.map((p) => p.name))} />
        <TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell><TableHeaderCell align="end">Calls</TableHeaderCell>
      </TableRow></TableHead>
      <TableBody>{people.map((p) => <TableRow key={p.name} selected={picked.includes(p.name)}>
        <TableSelectCell label={'Select ' + p.name} checked={picked.includes(p.name)} onChange={() => toggle(p.name)} />
        <TableCell>{p.name}</TableCell><TableCell><Text as="span" tone="muted">{p.role || 'No role'}</Text></TableCell><TableCell align="end"><FormattedNumber value={p.calls} /></TableCell>
      </TableRow>)}</TableBody>
    </Table>;
  },
};

// With rows selected, the bar above the table shows the count, actions for them, and Clear selection.
export const ActionBar: Story = {
  render: function Render(args) {
    const people = usePeople();
    const [picked, setPicked] = React.useState<string[]>([people[0], people[2]].filter(Boolean).map((p) => p.name));
    const all = people.length > 0 && picked.length === people.length;
    const toggle = (n: string) => setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);
    return <>
      <TableActionBar count={picked.length} onClear={() => setPicked([])}>
        <Button size="sm" variant="outline">Export</Button>
        <Button size="sm" variant="outline" onClick={() => setPicked([])}>Remove</Button>
      </TableActionBar>
      <Table {...args}>
        <TableHead><TableRow>
          <TableSelectCell header label="Select all rows" checked={all} indeterminate={!all && picked.length > 0} onChange={() => setPicked(all ? [] : people.map((p) => p.name))} />
          <TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell>
        </TableRow></TableHead>
        <TableBody>{people.map((p) => <TableRow key={p.name} selected={picked.includes(p.name)}>
          <TableSelectCell label={'Select ' + p.name} checked={picked.includes(p.name)} onChange={() => toggle(p.name)} />
          <TableCell>{p.name}</TableCell><TableCell><Text as="span" tone="muted">{p.role || 'No role'}</Text></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </>;
  },
};

export const Sortable: Story = {
  render: function Render(args) {
    const people = usePeople();
    const [sort, setSort] = React.useState<SortDirection>('descending');
    const rows = [...people].sort((a, b) => (sort === 'ascending' ? 1 : -1) * (a.calls - b.calls));
    return (
      <Table {...args}>
        <TableHead><TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell align="end" sort={sort} onSort={() => setSort(sort === 'ascending' ? 'descending' : 'ascending')}>Calls</TableHeaderCell></TableRow></TableHead>
        <TableBody>{rows.map((p) => <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell align="end"><FormattedNumber value={p.calls} /></TableCell></TableRow>)}</TableBody>
        <TableFoot><TableRow><TableCell>Total</TableCell><TableCell align="end"><FormattedNumber value={people.reduce((s, p) => s + p.calls, 0)} /></TableCell></TableRow></TableFoot>
      </Table>
    );
  },
};

export const StickyHeader: Story = {
  args: { stickyHeader: true, containerProps: { style: { maxHeight: 200 } } },
  render: (args) => (
    <Table {...args}>
      <TableHead><TableRow><TableHeaderCell>Invoice</TableHeaderCell><TableHeaderCell align="end">Amount</TableHeaderCell></TableRow></TableHead>
      <TableBody>{Array.from({ length: 12 }, (_, i) => <TableRow key={i}><TableCell>INV-{1001 + i}</TableCell><TableCell align="end"><FormattedNumber value={120 + i * 37} format="currency" currency="USD" /></TableCell></TableRow>)}</TableBody>
    </Table>
  ),
};

export const Virtual: Story = {
  args: { stickyHeader: true, containerProps: { style: { maxHeight: 320 } } },
  render: (args) => (
    <Table {...args} caption="Ten thousand invoices, drawn a window at a time">
      <TableHead><TableRow><TableHeaderCell>Invoice</TableHeaderCell><TableHeaderCell align="end">Amount</TableHeaderCell></TableRow></TableHead>
      <TableVirtualBody count={10000} renderRow={(i) => <TableRow><TableCell>INV-{1001 + i}</TableCell><TableCell align="end"><FormattedNumber value={120 + (i % 97) * 37} format="currency" currency="USD" /></TableCell></TableRow>} />
    </Table>
  ),
};

export const Overflow: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Table {...args} caption="Team members, with every role and how many calls each made this quarter">
        <TableHead>
          <TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role and permissions</TableHeaderCell><TableHeaderCell align="end">Calls this quarter</TableHeaderCell></TableRow>
        </TableHead>
        <TableBody>
          <TableRow><TableCell>Maria Magdalena von Hohenzollern-Sigmaringen</TableCell><TableCell>Administrator</TableCell><TableCell align="end">1,234,567</TableCell></TableRow>
          <TableRow><TableCell>Donaudampfschifffahrtsgesellschaftskapitänskajüte</TableCell><TableCell>Editor</TableCell><TableCell align="end">0</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const Align: Story = {
  render: (args) => <Table {...args}>
    <TableHead><TableRow><TableHeaderCell align="start">Start</TableHeaderCell><TableHeaderCell align="center">Center</TableHeaderCell><TableHeaderCell align="end">End</TableHeaderCell></TableRow></TableHead>
    <TableBody><TableRow><TableCell align="start">Ada</TableCell><TableCell align="center">Active</TableCell><TableCell align="end">1,204</TableCell></TableRow></TableBody>
  </Table>,
};
