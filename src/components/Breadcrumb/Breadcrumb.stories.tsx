import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

const meta = {
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  subcomponents: { BreadcrumbItem },
  args: {
    children: [
      <BreadcrumbItem key="h" href="#" icon="home">Home</BreadcrumbItem>,
      <BreadcrumbItem key="p" href="#">Projects</BreadcrumbItem>,
      <BreadcrumbItem key="w">Website redesign</BreadcrumbItem>,
    ],
  },
  argTypes: { separator: { control: 'inline-radio', options: ['chevron', 'slash'] }, collapse: { control: 'inline-radio', options: ['inline', 'menu'] }, children: { control: false } },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Slash: Story = { args: { separator: 'slash' } };

export const Collapsed: Story = {
  args: {
    maxItems: 3,
    children: ['Home', 'Acme', 'Design', 'Projects', 'Website redesign', 'Settings'].map((l, i, a) => <BreadcrumbItem key={l} href={i < a.length - 1 ? '#' : undefined}>{l}</BreadcrumbItem>),
  },
};

/** collapse="menu": "…" opens a menu of the hidden pages, and the trail stays on one line. */
export const CollapsedMenu: Story = {
  args: {
    maxItems: 3,
    collapse: 'menu',
    children: ['Home', 'Acme', 'Design', 'Projects', 'Website redesign', 'Settings'].map((l, i, a) => <BreadcrumbItem key={l} href={i < a.length - 1 ? '#' : undefined}>{l}</BreadcrumbItem>),
  },
};

export const LongLabels: Story = {
  name: 'Long labels',
  args: {
    children: [
      <BreadcrumbItem key="h" href="#" icon="home">Home</BreadcrumbItem>,
      <BreadcrumbItem key="c" href="#">Customer research and interviews, autumn</BreadcrumbItem>,
      <BreadcrumbItem key="n">Notes from the session with the support team about the new onboarding</BreadcrumbItem>,
    ],
  },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>],
};

export const TwoLevels: Story = {
  name: 'Two levels',
  args: { children: [<BreadcrumbItem key="p" href="#">Projects</BreadcrumbItem>, <BreadcrumbItem key="w">Website redesign</BreadcrumbItem>] },
};
