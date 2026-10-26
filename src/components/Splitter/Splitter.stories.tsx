import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Splitter } from './Splitter';

const Pane = (p: { children: React.ReactNode }) => <div style={{ padding: 'var(--spacing-4)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{p.children}</div>;
const meta = {
  title: 'Components/Layout/Splitter',
  component: Splitter,
  args: { direction: 'horizontal', defaultSize: 30, min: 15, max: 70, collapsible: true, separatorLabel: 'Folders', children: [<Pane key="a">Folders</Pane>, <Pane key="b">Messages</Pane>] },
  argTypes: { direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  decorators: [(Story) => <div style={{ height: 'var(--spacing-64)', border: 'var(--border-width-1) solid var(--border)', borderRadius: 'var(--rounded-md)', overflow: 'hidden' }}><Story /></div>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Splitter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { render: (args) => <Splitter {...args} style={{ height: 'var(--sizing-full)' }} /> };
export const Vertical: Story = {
  render: () => <Splitter direction="vertical" defaultSize={60} separatorLabel="Editor" style={{ height: 'var(--sizing-full)' }}>
    <Pane>Editor</Pane><Pane>Terminal</Pane>
  </Splitter>,
};
export const Collapsed: Story = {
  render: () => <Splitter collapsible defaultSize={0} separatorLabel="Sidebar" style={{ height: 'var(--sizing-full)' }}>
    <Pane>Sidebar</Pane><Pane>Press Enter on the handle to bring the sidebar back.</Pane>
  </Splitter>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 280, height: 'var(--sizing-full)' }}>
      <Splitter {...args} style={{ height: 'var(--sizing-full)' }}>
        <Pane>Donaudampfschifffahrtsgesellschaftskapitänskajüte</Pane>
        <Pane>Messages from every team, with long subjects that wrap over several lines</Pane>
      </Splitter>
    </div>
  ),
};
