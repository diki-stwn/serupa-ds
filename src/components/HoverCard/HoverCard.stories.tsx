import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HoverCard, type HoverCardProps } from './HoverCard';
import { Avatar } from '../Avatar/Avatar';
import { Link } from '../Link/Link';

// Room on every side of the link, so the card opens where the story asks instead of flipping.
const centered = (Story: React.ComponentType) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}><Story /></div>;

const person = (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <Avatar name="Dewi Lestari" size="lg" />
      <div className="flex flex-col">
        <strong>Dewi Lestari</strong>
        <span className="text-text-muted">Design lead, Payments</span>
      </div>
    </div>
    <p className="m-0">Owns the checkout and invoice screens. In Jakarta, usually online 9 to 5 WIB.</p>
    <Link href="#dewi-projects">See Dewi's projects</Link>
  </div>
);

const meta = {
  title: 'Components/Overlays/HoverCard',
  component: HoverCard,
  args: { trigger: <Link href="#dewi">@dewi</Link>, children: person },
  argTypes: { placement: { control: 'select', options: ['bottom', 'bottom-start', 'bottom-end', 'top', 'top-start', 'top-end', 'right', 'left'] }, trigger: { control: false }, children: { control: false } },
  // A story with open: true shows its card open in its own canvas, where the Storybook test checks it in all six
  // themes. On the docs page it opens on hover instead, so the open cards don't cover the page.
  render: function Render(args: HoverCardProps, ctx) {
    const card = <HoverCard {...args} open={ctx.viewMode === 'docs' ? undefined : args.open} />;
    return ctx.parameters.centered ? card : <div style={{ padding: '24px 120px', minHeight: 260 }}>Reviewed by {card} on Monday.</div>;
  },
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Open: Story = { args: { open: true }, decorators: [centered], parameters: { centered: true } };
export const Top: Story = { name: 'Placement: top', args: { open: true, placement: 'top' }, decorators: [centered], parameters: { centered: true } };
export const BottomStart: Story = { name: 'Placement: bottom-start', args: { open: true, placement: 'bottom-start' }, decorators: [centered], parameters: { centered: true } };
// Disabled: it never opens, for example while the link is disabled; hovering or focusing the link shows nothing.
export const Disabled: Story = { args: { disabled: true } };
// The stress story (G14): a long unbroken name and a long summary; the card wraps them inside its 320px.
export const LongText: Story = {
  args: {
    open: true,
    children: <div className="flex flex-col gap-2"><strong>Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung</strong><p className="m-0">A summary long enough to wrap several times inside the card, so the card grows taller rather than wider, and scrolls inside itself once it would be taller than the screen.</p></div>,
  },
  decorators: [centered], parameters: { centered: true },
};
