import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  args: { count: 10, defaultPage: 1 },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Controlled: Story = {
  render: function Render() {
    const [page, setPage] = React.useState(6);
    return <div className="flex flex-col gap-2 text-sm text-text"><Pagination count={12} page={page} onPageChange={setPage} /><span>Showing page {page} of 12</span></div>;
  },
};

export const Links: Story = { args: { count: 20, defaultPage: 10, getHref: (n: number) => '#page-' + n } };

export const Small: Story = { args: { count: 8, size: 'sm', siblings: 0 } };

export const Overflow: Story = {
  args: { count: 120, defaultPage: 60 },
  render: (args) => <div style={{ width: 240 }}><Pagination {...args} /></div>,
};

export const Summary: Story = {
  args: { count: 25, defaultPage: 3, total: 245, pageSize: 10 },
  render: (args) => <div style={{ maxWidth: 560 }}><Pagination {...args} /></div>,
};

/** pageSizeOptions: a select of page sizes after the summary. A new size keeps the first item shown in view. */
export const PageSize: Story = {
  args: { total: 245, pageSizeOptions: [10, 25, 50] },
  render: function Render(args) {
    const [per, setPer] = React.useState(10), [page, setPage] = React.useState(3);
    return <div style={{ maxWidth: 640 }}><Pagination {...args} count={Math.ceil(245 / per)} page={page} onPageChange={setPage} pageSize={per} onPageSizeChange={(n, p) => { setPer(n); setPage(p); }} /></div>;
  },
};
