import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './Grid';

const Box = ({ children }: { children?: React.ReactNode }) => <div className="rounded-md bg-surface-muted p-3 text-sm text-text">{children}</div>;
const cells = (n: number) => Array.from({ length: n }, (_, i) => <Box key={i}>Cell {i + 1}</Box>);

const meta = {
  title: 'Components/Layout and type/Grid',
  component: Grid,
  args: { children: cells(6) },
  argTypes: {
    columns: { control: 'select', options: ['auto', 1, 2, 3, 4, 6, 12] },
    gap: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24] },
    children: { control: false },
  },
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ThreeColumns: Story = { args: { columns: 3, gap: 6 } };

export const AutoFit: Story = { args: { minColumnWidth: '10rem', gap: 2, children: cells(9) } };

export const AsList: Story = {
  render: () => <Grid as="ul" columns={2}>{['Invoices', 'Receipts', 'Contracts', 'Reports'].map((t) => <li key={t}><Box>{t}</Box></li>)}</Grid>,
};

export const Overflow: Story = {
  args: { columns: 3, gap: 2, children: [<Box key="a">Donaudampfschifffahrtsgesellschaftskapitänskajüte</Box>, <Box key="b">A cell with a long sentence that wraps</Box>, <Box key="c">Short</Box>] },
  render: (args) => <div style={{ width: 240 }}><Grid {...args} /></div>,
};
