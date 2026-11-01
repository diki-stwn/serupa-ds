import { useState } from 'react';
import { Divider, Icon, ToggleButton, ToggleGroup, Toolbar } from 'serupa-ds';

type Format = 'bold' | 'italic' | 'underline';
type Align = 'left' | 'center' | 'right';

export function FormattingBar() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [align, setAlign] = useState<Align>('left');

  return (
    <Toolbar aria-label="Text formatting" className="flex items-center gap-2 p-2 bg-surface rounded-md">
      <ToggleGroup
        type="multiple"
        aria-label="Text style"
        value={formats}
        onValueChange={(value: Format[]) => setFormats(value)}
      >
        <ToggleButton value="bold" aria-label="Bold">
          <Icon name="format_bold" />
        </ToggleButton>
        <ToggleButton value="italic" aria-label="Italic">
          <Icon name="format_italic" />
        </ToggleButton>
        <ToggleButton value="underline" aria-label="Underline">
          <Icon name="format_underlined" />
        </ToggleButton>
      </ToggleGroup>

      <Divider orientation="vertical" />

      <ToggleGroup
        type="single"
        aria-label="Text alignment"
        value={align}
        onValueChange={(value: Align) => {
          // Keep one alignment always selected.
          if (value) setAlign(value);
        }}
      >
        <ToggleButton value="left" aria-label="Align left">
          <Icon name="format_align_left" />
        </ToggleButton>
        <ToggleButton value="center" aria-label="Align center">
          <Icon name="format_align_center" />
        </ToggleButton>
        <ToggleButton value="right" aria-label="Align right">
          <Icon name="format_align_right" />
        </ToggleButton>
      </ToggleGroup>
    </Toolbar>
  );
}
