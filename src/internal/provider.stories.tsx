import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SerupaProvider } from './provider';
import { idLabels } from './labels';
import { Alert } from '../components/Alert/Alert';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { Pagination } from '../components/Pagination/Pagination';
import { SearchInput } from '../components/SearchInput/SearchInput';
import { TimePicker } from '../components/TimePicker/TimePicker';

const meta = {
  title: 'Guides/SerupaProvider',
  component: SerupaProvider,
} satisfies Meta<typeof SerupaProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

const Sample = () => (
  <div className="flex flex-col gap-4 max-w-md">
    <Alert title="Saved" onDismiss={() => {}} />
    <div className="flex flex-wrap gap-2">
      <DatePicker aria-label="Date" defaultValue={new Date(2026, 2, 5)} />
      <TimePicker aria-label="Time" defaultValue="14:30" />
    </div>
    <SearchInput aria-label="Search" defaultValue="report" />
    <Pagination count={5} defaultPage={2} />
  </div>
);

/** Without a provider: the browser's locale and the English words. */
export const Default: Story = { render: () => <Sample /> };

/** Indonesian: dates, times and every built-in word. */
export const Indonesian: Story = { render: () => <SerupaProvider locale="id-ID" labels={idLabels}><Sample /></SerupaProvider> };

/** A nested provider changes only what it sets: here German dates inside the Indonesian words. */
export const Nested: Story = {
  render: () => (
    <SerupaProvider locale="id-ID" labels={idLabels}>
      <SerupaProvider locale="de-DE"><Sample /></SerupaProvider>
    </SerupaProvider>
  ),
};
