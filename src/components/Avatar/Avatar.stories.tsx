import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

// A stand-in photo, so the stories work offline.
const PHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="40" cy="32" r="14" fill="#fff" opacity=".85"/><ellipse cx="40" cy="74" rx="26" ry="20" fill="#fff" opacity=".85"/></svg>');

const meta = {
  title: 'Components/Content/Avatar',
  component: Avatar,
  args: { name: 'Grace Hopper', size: 'md', shape: 'circle' },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
    status: { control: 'select', options: [undefined, 'online', 'busy', 'away', 'offline'] },
  },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex gap-3 items-center">{children}</div>;

export const Playground: Story = {};

export const Kinds: Story = {
  name: 'Picture, initials and icon',
  render: () => <Row><Avatar src={PHOTO} name="Ada Lovelace" /><Avatar name="Grace Hopper" /><Avatar /><Avatar name="Atlas" shape="square" /></Row>,
};

export const Sizes: Story = {
  render: () => <Row>{(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => <Avatar key={s} size={s} name="Grace Hopper" />)}</Row>,
};

export const Status: Story = {
  render: () => <Row>{(['online', 'busy', 'away', 'offline'] as const).map((s) => <Avatar key={s} status={s} src={PHOTO} name="Ada Lovelace" />)}</Row>,
};

export const WithName: Story = {
  name: 'Next to a name',
  render: () => <div className="flex items-center gap-2 text-sm"><Avatar src={PHOTO} name="Ada Lovelace" alt="" size="sm" />Ada Lovelace</div>,
};

export const LongName: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Avatar {...args} name="Maria Magdalena Wilhelmina von Hohenzollern-Sigmaringen" />
      <Avatar {...args} name={"Donaudampfschifffahrtsgesellschaftskapitänskajüte"} />
    </div>
  ),
};
