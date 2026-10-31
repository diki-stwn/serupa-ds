import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar/Avatar';
import { useNames } from '../../../.storybook/content';

// A local picture, so stories load nothing from other servers.
const PIC = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#1e3a8a"/><circle cx="40" cy="32" r="14" fill="#fde68a"/><path d="M14 80 Q40 40 66 80Z" fill="#fde68a"/></svg>');
const DEMO = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton'];
// The names follow the toolbar's Content menu: these, the worst case, none or one (.storybook/content.ts). The
// Avatars are AvatarGroup's own children (it counts them for max and +N), so each render maps the names itself.
const avatars = (names: string[], { pictures = false, status = false } = {}) => names.map((n, i) =>
  <Avatar key={n} name={n} src={pictures && i === 0 ? PIC : undefined} status={status ? (['online', 'away', 'busy'] as const)[i] : undefined} />);

const meta = {
  title: 'Components/Content/AvatarGroup',
  component: AvatarGroup,
  args: { label: 'Assigned to', size: 'md', max: 4 },
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
  render: function Render(args) { return <AvatarGroup {...args}>{avatars(useNames(DEMO), { pictures: true })}</AvatarGroup>; },
} satisfies Meta<typeof AvatarGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = {
  render: function Render(args) {
    const names = useNames(DEMO);
    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => <AvatarGroup key={s} {...args} size={s} label={'Assigned to, ' + s}>{avatars(names)}</AvatarGroup>)}
    </div>;
  },
};
export const AllShown: Story = { args: { max: undefined } };
export const Total: Story = {
  args: { label: 'Members', max: undefined, total: 120, size: 'sm' },
  render: function Render(args) { return <AvatarGroup {...args}>{avatars(useNames(DEMO).slice(0, 5))}</AvatarGroup>; },
};
export const WithStatus: Story = {
  render: function Render(args) { return <AvatarGroup {...args}>{avatars(useNames(DEMO).slice(0, 3), { status: true })}</AvatarGroup>; },
};
/** showMore: "+N" is a button that lists the people not shown, for keyboard and touch users too. */
export const ShowMore: Story = { args: { max: 3, showMore: true } };

export const Overflow: Story = {
  args: { max: 3 },
  render: (args) => (
    <div style={{ width: 160 }}>
      <AvatarGroup {...args}>{[...DEMO, ...DEMO.map((n) => n + ' II'), "Donaudampfschifffahrtsgesellschaftskapitänskajüte"].map((n) => <Avatar key={n} name={n} />)}</AvatarGroup>
    </div>
  ),
};
