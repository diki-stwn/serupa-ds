import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem } from './List';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';

const people = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'Viewer' },
];

const meta = {
  title: 'Components/Content/List',
  component: List,
  subcomponents: { ListItem },
  args: {
    'aria-label': 'Members',
    children: people.map((p) => <ListItem key={p.name} leading={<Avatar name={p.name} size="sm" />} title={p.name} description={p.email} trailing={<Badge>{p.role}</Badge>} />),
  },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card'] }, children: { control: false } },
  render: (args) => <div style={{ maxWidth: 480 }}><List {...args} /></div>,
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Links: Story = {
  args: {
    variant: 'card',
    children: people.map((p, i) => <ListItem key={p.name} href="#" selected={i === 0} leading={<Avatar name={p.name} size="sm" />} title={p.name} description={p.email}
      trailing={<IconButton icon="more_horiz" label={`More for ${p.name}`} size="sm" />} />),
  },
};

export const Files: Story = {
  args: {
    'aria-label': 'Files',
    children: [
      <ListItem key="a" leading="description" title="Quarterly report.pdf" description="2.4 MB" trailing="Yesterday" />,
      <ListItem key="b" leading="image" title="Logo.png" description="320 KB" trailing="Mar 3" />,
      <ListItem key="c" leading="folder" title="Archive" description="12 files" trailing="Feb 18" />,
    ],
  },
};

export const Settings: Story = {
  args: {
    variant: 'card', 'aria-label': 'Settings',
    children: [
      <ListItem key="a" leading="person" title="Profile" description="Name, photo and email" onClick={() => {}} trailing="›" />,
      <ListItem key="b" leading="notifications" title="Notifications" description="Email and push" onClick={() => {}} />,
      <ListItem key="c" leading="lock" title="Security" description="Password and two-step sign-in" disabled href="#" />,
    ],
  },
};

export const LongText: Story = {
  args: {
    children: [
      <ListItem key="a" leading={<Avatar name="Maria Magdalena von Hohenzollern" size="sm" />} title="Maria Magdalena von Hohenzollern-Sigmaringen" description="maria.magdalena.hohenzollern@example.com" trailing={<Badge>Administrator</Badge>} />,
      <ListItem key="b" leading={<Avatar name="Grace Hopper" size="sm" />} title="Donaudampfschifffahrtsgesellschaftskapitänskajüte" description="no-place-to-break@Donaudampfschifffahrtsgesellschaftskapitänskajüte.example" trailing={<Badge>Editor</Badge>} />,
    ],
  },
  render: (args) => <div style={{ width: 260 }}><List {...args} /></div>,
};
