import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { KeyboardShortcuts, useShortcut, type KeyboardShortcutsProps } from './KeyboardShortcuts';
import { Button } from '../Button/Button';
import { Kbd } from '../Kbd/Kbd';

// The page's shortcuts, set up where they're used; each with a description is listed.
function Page() {
  const [said, setSaid] = React.useState('Press a shortcut, or ? for the list.');
  useShortcut(['mod', 'K'], () => setSaid('Search'), { description: 'Search', group: 'Navigation' });
  useShortcut(['G'], () => setSaid('Go to inbox'), { description: 'Go to inbox', group: 'Navigation' });
  useShortcut(['C'], () => setSaid('New message'), { description: 'New message', group: 'Messages' });
  useShortcut(['mod', 'enter'], () => setSaid('Send'), { description: 'Send', group: 'Messages' });
  useShortcut(['E'], () => setSaid('Archive'), { description: 'Archive', group: 'Messages' });
  return <p>{said} Press <Kbd>?</Kbd> to see them all.</p>;
}

const meta = {
  title: 'Components/Overlays/KeyboardShortcuts',
  component: KeyboardShortcuts,
  args: {},
  render: function Render(args: KeyboardShortcutsProps) {
    const [open, setOpen] = React.useState(!!args.defaultOpen);
    return <>
      <Page />
      <Button variant="outline" onClick={() => setOpen(true)}>Keyboard shortcuts</Button>
      <KeyboardShortcuts {...args} open={open} onOpenChange={setOpen} />
    </>;
  },
} satisfies Meta<typeof KeyboardShortcuts>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
// Shortcuts the app doesn't set up itself (the browser's, an editor's) can be listed too.
export const WithListedShortcuts: Story = {
  args: { defaultOpen: true, shortcuts: [{ keys: ['mod', 'B'], description: 'Bold', group: 'Editor' }, { keys: ['mod', 'I'], description: 'Italic', group: 'Editor' }] },
};
// The stress story (G14): long descriptions and group names wrap, and the keys stay on one line at the end.
export const LongText: Story = {
  args: {
    defaultOpen: true,
    title: 'Keyboard shortcuts for the Donaudampfschifffahrtsgesellschaft workspace',
    shortcuts: [{ keys: ['mod', 'shift', 'alt', 'pagedown'], description: 'Move the selected conversation to the next Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung folder', group: 'Organizing very long conversation lists' }],
  },
};
