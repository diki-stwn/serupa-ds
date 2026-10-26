import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from './ToggleButton';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';

const meta = {
  title: 'Components/Actions/ToggleButton',
  component: ToggleButton,
  args: { children: 'Show grid', leftIcon: 'grid_on' },
  argTypes: { variant: { control: 'inline-radio', options: ['outline', 'ghost'] }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Pressed: Story = { args: { defaultPressed: true } };

export const Toolbar: Story = {
  render: () => (
    <ButtonGroup aria-label="Text formatting">
      <ToggleButton icon="format_bold" aria-label="Bold" defaultPressed />
      <ToggleButton icon="format_italic" aria-label="Italic" />
      <ToggleButton icon="format_underlined" aria-label="Underline" />
    </ButtonGroup>
  ),
};

export const Ghost: Story = {
  render: () => (
    <div className="flex gap-1">
      <ToggleButton variant="ghost" icon="format_bold" aria-label="Bold" defaultPressed />
      <ToggleButton variant="ghost" icon="format_italic" aria-label="Italic" />
      <ToggleButton variant="ghost" icon="format_list_bulleted" aria-label="Bulleted list" />
    </div>
  ),
};

export const Controlled: Story = {
  render: function Render() {
    const [muted, setMuted] = React.useState(false);
    return <ToggleButton pressed={muted} onPressedChange={setMuted} icon={muted ? 'volume_off' : 'volume_up'} aria-label="Mute" />;
  },
};

export const LongLabel: Story = {
  args: { children: 'Show the alignment grid on every page' },
  render: (args) => <div style={{ width: 180 }}><ToggleButton {...args} /></div>,
};
