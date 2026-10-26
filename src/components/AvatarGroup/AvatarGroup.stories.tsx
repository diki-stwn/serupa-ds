import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar/Avatar';

// A local picture, so stories load nothing from other servers.
const PIC = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#1e3a8a"/><circle cx="40" cy="32" r="14" fill="#fde68a"/><path d="M14 80 Q40 40 66 80Z" fill="#fde68a"/></svg>');
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton'];

const meta = {
  title: 'Components/Content/AvatarGroup',
  component: AvatarGroup,
  args: { label: 'Assigned to', size: 'md', max: 4 },
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
  render: (args) => <AvatarGroup {...args}>{PEOPLE.map((n, i) => <Avatar key={n} name={n} src={i === 0 ? PIC : undefined} />)}</AvatarGroup>,
} satisfies Meta<typeof AvatarGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = {
  render: (args) => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => <AvatarGroup key={s} {...args} size={s} label={'Assigned to, ' + s}>{PEOPLE.map((n) => <Avatar key={n} name={n} />)}</AvatarGroup>)}
  </div>,
};
export const AllShown: Story = { args: { max: undefined } };
export const Total: Story = {
  args: { label: 'Members', max: undefined, total: 120, size: 'sm' },
  render: (args) => <AvatarGroup {...args}>{PEOPLE.slice(0, 5).map((n) => <Avatar key={n} name={n} />)}</AvatarGroup>,
};
export const WithStatus: Story = {
  render: (args) => <AvatarGroup {...args}>{PEOPLE.slice(0, 3).map((n, i) => <Avatar key={n} name={n} status={(['online', 'away', 'busy'] as const)[i]} />)}</AvatarGroup>,
};
/** showMore: "+N" is a button that lists the people not shown, for keyboard and touch users too. */
export const ShowMore: Story = { args: { max: 3, showMore: true } };

export const Overflow: Story = {
  args: { max: 3 },
  render: (args) => (
    <div style={{ width: 160 }}>
      <AvatarGroup {...args}>{[...PEOPLE, ...PEOPLE.map((n) => n + ' II'), "Donaudampfschifffahrtsgesellschaftskapitänskajüte"].map((n) => <Avatar key={n} name={n} />)}</AvatarGroup>
    </div>
  ),
};
