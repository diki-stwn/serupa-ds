import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './Stack';
import { Button } from '../Button/Button';

const Box = ({ children }: { children?: React.ReactNode }) => <div className="rounded-md bg-surface-muted p-3 text-sm text-text">{children}</div>;

const meta = {
  title: 'Components/Layout and type/Stack',
  component: Stack,
  args: { gap: 4, children: [<Box key="1">One</Box>, <Box key="2">Two</Box>, <Box key="3">Three</Box>] },
  argTypes: {
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    gap: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24] },
    align: { control: 'select', options: [undefined, 'stretch', 'start', 'center', 'end', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between'] },
    children: { control: false },
  },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Row: Story = {
  render: () => (
    <Stack direction="row" gap={2} justify="end">
      <Button variant="secondary">Cancel</Button>
      <Button>Save</Button>
    </Stack>
  ),
};

export const Gaps: Story = {
  render: () => <Stack gap={6}>{([1, 2, 4, 8] as const).map((g) => <Stack key={g} direction="row" gap={g}><Box>gap={g}</Box><Box>B</Box><Box>C</Box></Stack>)}</Stack>,
};

export const Wrap: Story = {
  render: () => <div style={{ maxWidth: 260 }}><Stack direction="row" gap={2} wrap>{['Design', 'Research', 'Engineering', 'Marketing', 'Sales'].map((t) => <Box key={t}>{t}</Box>)}</Stack></div>,
};

export const AsList: Story = {
  render: () => <Stack as="ul" gap={2}>{['Invoices', 'Receipts', 'Contracts'].map((t) => <li key={t}><Box>{t}</Box></li>)}</Stack>,
};

export const Overflow: Story = {
  args: { direction: 'row', wrap: true, gap: 2, children: [<Box key="1">Donaudampfschifffahrtsgesellschaftskapitänskajüte</Box>, <Box key="2">A box with a long label</Box>, <Box key="3">Three</Box>, <Box key="4">Four</Box>] },
  render: (args) => <div style={{ width: 240 }}><Stack {...args} /></div>,
};
