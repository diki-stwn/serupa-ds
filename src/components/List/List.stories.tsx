import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem, type ListProps } from './List';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { Text } from '../Text/Text';
import { usePeople } from '../../../.storybook/content';

// The people come from the Content menu in the toolbar (demo, worst case, empty, one), so the same story can be
// checked with a long name, a missing email or role, right-to-left text, and no one at all.
function Members({ links, ...args }: ListProps & { links?: boolean }) {
  const people = usePeople();
  if (!people.length) return <Text tone="muted">No members yet</Text>;
  return (
    <List {...args}>
      {people.map((p, i) => links
        ? <ListItem key={p.name} href="#" selected={i === 0} leading={<Avatar name={p.name} alt="" size="sm" />} title={p.name} description={p.email}
            trailing={<IconButton icon="more_horiz" label={`More for ${p.name}`} size="sm" />} />
        : <ListItem key={p.name} leading={<Avatar name={p.name} alt="" size="sm" />} title={p.name} description={p.email} trailing={p.role ? <Badge>{p.role}</Badge> : undefined} />)}
    </List>
  );
}

const meta = {
  title: 'Components/Content/List',
  component: List,
  subcomponents: { ListItem },
  args: { 'aria-label': 'Members' },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card'] }, children: { control: false } },
  render: (args) => <div style={{ maxWidth: 480 }}><List {...args} /></div>,
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <div style={{ maxWidth: 480 }}><Members {...args} /></div>,
};

export const Links: Story = {
  args: { variant: 'card' },
  render: (args) => <div style={{ maxWidth: 480 }}><Members {...args} links /></div>,
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
      <ListItem key="a" leading={<Avatar name="Maria Magdalena von Hohenzollern" alt="" size="sm" />} title="Maria Magdalena von Hohenzollern-Sigmaringen" description="maria.magdalena.hohenzollern@example.com" trailing={<Badge>Administrator</Badge>} />,
      <ListItem key="b" leading={<Avatar name="Grace Hopper" alt="" size="sm" />} title="Donaudampfschifffahrtsgesellschaftskapitänskajüte" description="no-place-to-break@Donaudampfschifffahrtsgesellschaftskapitänskajüte.example" trailing={<Badge>Editor</Badge>} />,
    ],
  },
  render: (args) => <div style={{ width: 260 }}><List {...args} /></div>,
};
