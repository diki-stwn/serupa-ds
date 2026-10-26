import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image } from './Image';

// A local picture (a hillside at dusk), so stories load nothing from other servers.
const PIC = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect width="800" height="500" fill="url(#s)"/><circle cx="560" cy="300" r="60" fill="#fde68a"/><path d="M0 380 Q200 300 400 370 T800 340 V500 H0Z" fill="#14532d"/><path d="M0 430 Q250 370 500 430 T800 420 V500 H0Z" fill="#052e16"/></svg>');

const meta = {
  title: 'Components/Content/Image',
  component: Image,
  args: { src: PIC, alt: 'A hillside at dusk', ratio: 'video', fit: 'cover', rounded: true, viewable: false, frameProps: { style: { width: 320 } } },
  argTypes: { ratio: { control: 'inline-radio', options: ['auto', 'square', '4:3', 'video'] }, fit: { control: 'inline-radio', options: ['cover', 'contain'] } },
} satisfies Meta<typeof Image>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Ratios: Story = {
  render: (args) => <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
    {(['auto', 'square', '4:3', 'video'] as const).map((r) => <Image key={r} {...args} ratio={r} alt={'A hillside at dusk, ' + r} frameProps={{ style: { width: 180 } }} />)}
  </div>,
};
export const Contain: Story = { args: { ratio: 'square', fit: 'contain' } };
export const Viewable: Story = { args: { viewable: true } };
export const Removable: Story = {
  render: function Render(args) {
    const [shown, setShown] = React.useState(true);
    return shown ? <Image {...args} viewable onRemove={() => setShown(false)} /> : <button type="button" onClick={() => setShown(true)}>Put it back</button>;
  },
};
export const Fallback: Story = { args: { src: 'data:image/png;base64,broken', ratio: 'square', frameProps: { style: { width: 160 } } } };

export const Overflow: Story = {
  name: 'Overflow: narrow frame',
  args: { ratio: 'auto', frameProps: { style: { width: 120 } } },
};
