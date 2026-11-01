import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommandPalette, type Command, type CommandPaletteProps } from './CommandPalette';
import { Button } from '../Button/Button';
import { Kbd } from '../Kbd/Kbd';

const COMMANDS: Command[] = [
  { id: 'home', label: 'Home', group: 'Pages', icon: 'home' },
  { id: 'projects', label: 'Projects', group: 'Pages', icon: 'folder' },
  { id: 'settings', label: 'Settings', group: 'Pages', icon: 'settings', keywords: ['preferences', 'account'] },
  { id: 'new', label: 'New project', group: 'Actions', icon: 'add', shortcut: ['mod', 'N'] },
  { id: 'invite', label: 'Invite people', group: 'Actions', icon: 'person_add' },
  { id: 'theme', label: 'Switch to dark theme', group: 'Actions', icon: 'dark_mode', shortcut: ['mod', 'shift', 'L'] },
  { id: 'export', label: 'Export as PDF', group: 'Actions', icon: 'download', disabled: true },
];

const meta = {
  title: 'Components/Overlays/CommandPalette',
  component: CommandPalette,
  args: { commands: COMMANDS },
  render: function Render(args: CommandPaletteProps) {
    const [open, setOpen] = React.useState(!!args.defaultOpen);
    const [ran, setRan] = React.useState('Nothing yet.');
    return <>
      <p>Press <Kbd keys={['mod', 'K']} /> anywhere, or the button. Last chosen: {ran}</p>
      <Button variant="outline" onClick={() => setOpen(true)}>Search commands</Button>
      <CommandPalette {...args} open={open} onOpenChange={setOpen} onSelect={(c) => setRan(c.label)} />
    </>;
  },
} satisfies Meta<typeof CommandPalette>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
// Open, before anything is typed: every command, by group, the first one active.
export const Default: Story = { args: { defaultOpen: true } };
// No groups: one list under "Commands".
export const Ungrouped: Story = { args: { defaultOpen: true, commands: COMMANDS.map(({ group: _g, ...c }) => c) } };
// The stress story (G14): long words, long labels, more items than fit; the visual baselines show how it copes.
export const LongText: Story = {
  args: {
    defaultOpen: true,
    commands: [
      { id: 'long', label: 'Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung', group: 'A group name long enough to wrap twice in a narrow column', shortcut: ['mod', 'shift', 'alt', 'K'] },
      ...Array.from({ length: 30 }, (_, i) => ({ id: 'p' + i, label: 'Project number ' + (i + 1), group: 'Projects' })),
    ],
  },
};
