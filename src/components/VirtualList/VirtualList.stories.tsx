import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { VirtualList } from './VirtualList';
import { ListItem } from '../List/List';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';

// 10,000 made-up people: the same every time, so the screenshots stay the same.
const FIRST = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara', 'Dennis', 'Frances', 'Ken', 'Radia'];
const LAST = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Liskov', 'Ritchie', 'Allen', 'Thompson', 'Perlman'];
const ROLES = ['Admin', 'Editor', 'Viewer'];
const person = (i: number) => {
  const name = `${FIRST[i % 10]} ${LAST[Math.floor(i / 10) % 10]} ${i + 1}`;
  return { name, email: name.toLowerCase().replace(/ /g, '.') + '@example.com', role: ROLES[i % 3] };
};

const meta = {
  title: 'Components/Content/VirtualList',
  component: VirtualList,
  args: {
    'aria-label': 'Members',
    count: 10000,
    renderItem: (i: number) => {
      const p = person(i);
      return <ListItem leading={<Avatar name={p.name} alt="" size="sm" />} title={p.name} description={p.email} trailing={<Badge>{p.role}</Badge>} />;
    },
  },
  argTypes: { renderItem: { control: false } },
} satisfies Meta<typeof VirtualList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Default: Story = {};
export const Card: Story = { args: { variant: 'card' } };
// Rows that are links: Tab moves through the drawn rows, and the one with focus stays drawn when scrolled away.
export const Links: Story = {
  args: {
    variant: 'card',
    renderItem: (i: number) => { const p = person(i); return <ListItem href="#" selected={i === 0} title={p.name} description={p.email} />; },
  },
};
// Rows of different heights: each is measured once drawn.
export const MixedHeights: Story = {
  args: {
    renderItem: (i: number) => { const p = person(i); return <ListItem title={p.name} description={i % 4 === 0 ? `${p.email}, on the ${p.role.toLowerCase()} team since ${2000 + (i % 25)}, working across design, engineering and support` : p.email} />; },
  },
};
// The stress story (G14): long words and long labels that wrap.
export const LongText: Story = {
  args: {
    count: 500,
    renderItem: (i: number) => <ListItem title={`Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung ${i + 1}`} description="And a description long enough to wrap twice in a narrow column, so the rows are taller than the guess." />,
  },
};
export const Empty: Story = { args: { count: 0 } };
