import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Timeline, TimelineItem } from './Timeline';

const events = <>
  <TimelineItem title="Order placed" time="12 Mar, 09:14" dateTime="2026-03-12T09:14" status="primary" icon="shopping_cart">Two items, paid by card.</TimelineItem>
  <TimelineItem title="Payment confirmed" time="12 Mar, 09:15" dateTime="2026-03-12T09:15" status="success" icon="check" />
  <TimelineItem title="Delivery delayed" time="13 Mar, 18:40" dateTime="2026-03-13T18:40" status="warning" icon="schedule">The courier missed the evening run. New estimate: 15 March.</TimelineItem>
  <TimelineItem title="Out for delivery" time="15 Mar, 08:02" dateTime="2026-03-15T08:02" />
</>;

const meta = {
  title: 'Components/Data display/Timeline',
  component: Timeline,
  args: { children: events, 'aria-label': 'Order history' },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
/** Dots instead of icons, in each status color. */
export const Dots: Story = {
  args: {
    children: <>
      <TimelineItem title="Neutral" time="Now" />
      <TimelineItem title="Primary" time="1 minute ago" status="primary" />
      <TimelineItem title="Success" time="5 minutes ago" status="success" />
      <TimelineItem title="Warning" time="1 hour ago" status="warning" />
      <TimelineItem title="Danger" time="Yesterday" status="danger" />
      <TimelineItem title="Info" time="Last week" status="info" />
    </>,
  },
};
/** From 768px up, events take turns on either side of a centered line. */
export const Alternate: Story = { args: { align: 'alternate' } };

export const LongText: Story = {
  args: {
    children: <>
      <TimelineItem title="Order placed for delivery to the warehouse on the far side of town" time="12 Mar, 09:14" dateTime="2026-03-12T09:14" status="primary" icon="shopping_cart">Two items, paid by card. Donaudampfschifffahrtsgesellschaftskapitänskajüte.</TimelineItem>
      <TimelineItem title="Donaudampfschifffahrtsgesellschaftskapitänskajüte" time="13 Mar, 18:40" dateTime="2026-03-13T18:40" status="warning" icon="schedule" />
    </>,
  },
  render: (args) => <div style={{ width: 240 }}><Timeline {...args} /></div>,
};
