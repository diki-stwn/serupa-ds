import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from './Container';

const meta = {
  title: 'Components/Layout and type/Container',
  component: Container,
  parameters: { layout: 'fullscreen' },
  args: { children: <div className="rounded-md bg-surface-muted p-4 text-sm text-text">The content stays this wide and centered, with padding at the sides.</div> },
  argTypes: { size: { control: 'select', options: ['prose', 'md', 'lg', 'xl', '2xl', 'full'] }, children: { control: false } },
} satisfies Meta<typeof Container>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 py-4">
      {(['prose', 'md', 'lg', 'xl', '2xl'] as const).map((s) => <Container key={s} size={s}><div className="rounded-md bg-surface-muted p-3 text-sm text-text">size="{s}"</div></Container>)}
    </div>
  ),
};

export const Prose: Story = {
  args: { size: 'prose', children: <p className="text-base text-text">Long text reads best at around 65 to 75 characters a line. The prose size keeps an article to that width on a wide screen, and the side padding keeps it off the edges on a phone.</p> },
};

export const FullWidth: Story = {
  name: 'Full width',
  args: { size: 'full', children: <div className="rounded-md bg-surface-muted p-4 text-sm text-text">size="full" spans the page, keeping only the side padding.</div> },
};

export const NotPadded: Story = {
  name: 'No side padding',
  args: { size: 'md', padded: false, children: <div className="rounded-md bg-surface-muted p-4 text-sm text-text">padded={'{false}'}: no padding at the sides, for content that brings its own.</div> },
};

export const LongText: Story = {
  args: { size: 'prose', children: <div className="rounded-md bg-surface-muted p-4 text-sm text-text">A long paragraph keeps to the container's width and wraps, and an unbroken word like DonaudampfschifffahrtsgesellschaftskapitänskajüteDonaudampfschifffahrtsgesellschaftskapitänskajüte breaks rather than pushing the page sideways.</div> },
};
