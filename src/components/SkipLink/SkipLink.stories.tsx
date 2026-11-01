import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkipLink } from './SkipLink';

// Press Tab in the canvas: the link shows at the top, and Enter moves focus into the main content below.
function Page(props: React.ComponentProps<typeof SkipLink>) {
  return (
    <div className="text-sm text-text">
      <SkipLink {...props}>{props.children}</SkipLink>
      <p>Press Tab to show the skip link, then Enter to move focus to the main content.</p>
      <nav aria-label="Example" className="flex gap-3 py-2"><a href="#one">One</a><a href="#two">Two</a><a href="#three">Three</a></nav>
      <main id={props.target || 'main'} className="mt-4 rounded-md border border-border p-4">Main content. The next Tab goes on from here.</main>
    </div>
  );
}

const meta = {
  title: 'Components/Navigation/SkipLink',
  component: SkipLink,
  render: (args) => <Page {...args} />,
} satisfies Meta<typeof SkipLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
/** Its own words and target: to a search results region, say. */
export const CustomTarget: Story = { args: { target: 'results', children: 'Skip to results' } };
// The stress story (G14): long words in a narrow viewport; the shown link wraps inside the screen, not past it.
export const LongText: Story = { args: { children: 'Langsung ke konten utama: Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung' } };
