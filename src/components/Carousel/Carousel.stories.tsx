import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './Carousel';
import { Image } from '../Image/Image';
import { Card, CardBody } from '../Card/Card';

// Local pictures, so stories load nothing from other servers.
const pic = (sky: string, sun: string, hill: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${sky}"/><circle cx="560" cy="260" r="70" fill="${sun}"/><path d="M0 440 Q200 340 400 420 T800 400 V600 H0Z" fill="${hill}"/></svg>`);
const PICS = [
  { src: pic('#1e3a8a', '#fde68a', '#14532d'), alt: 'Hills at dusk' },
  { src: pic('#0ea5e9', '#fef9c3', '#166534'), alt: 'Hills at noon' },
  { src: pic('#7c2d12', '#fdba74', '#3f2a1d'), alt: 'Desert at sunset' },
  { src: pic('#0f172a', '#e2e8f0', '#1e293b'), alt: 'Hills at night' },
];

const meta = {
  title: 'Components/Content/Carousel',
  component: Carousel,
  args: { label: 'Landscape photos', loop: false, arrows: true, dots: true },
  render: (args) => <div style={{ maxWidth: 480 }}><Carousel {...args}>{PICS.map((p) => <Image key={p.alt} {...p} alt={p.alt} ratio="4:3" rounded={false} />)}</Carousel></div>,
} satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Loop: Story = { args: { loop: true } };
export const Controlled: Story = {
  render: function Render(args) {
    const [i, setI] = React.useState(2);
    return <div style={{ maxWidth: 480 }}>
      <Carousel {...args} index={i} onIndexChange={setI}>{PICS.map((p) => <Image key={p.alt} {...p} alt={p.alt} ratio="4:3" rounded={false} />)}</Carousel>
      <p>Showing {PICS[i].alt}.</p>
    </div>;
  },
};
export const Cards: Story = {
  args: { label: 'Plans', arrows: false },
  render: (args) => <div style={{ maxWidth: 360 }}><Carousel {...args}>
    {['Starter', 'Team', 'Business'].map((n) => <Card key={n}><CardBody><strong>{n}</strong><p>Everything in the plan before, and more.</p></CardBody></Card>)}
  </Carousel></div>,
};
/** perView: three cards side by side from 1024px up, two from 768px, one on a phone; the dots count pages. */
export const PerView: Story = {
  args: { label: 'Products', perView: { base: 1, md: 2, lg: 3 } },
  render: (args) => <Carousel {...args}>
    {['Desk', 'Chair', 'Lamp', 'Shelf', 'Rug', 'Plant', 'Clock'].map((n) => <Card key={n}><CardBody><strong>{n}</strong><p>Ships in two days.</p></CardBody></Card>)}
  </Carousel>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 240 }}>
      <Carousel {...args} label="Customer stories from every region we work in">
        <Card><CardBody>Our team cut its release time in half, and Donaudampfschifffahrtsgesellschaftskapitänskajüte now ships every week.</CardBody></Card>
        <Card><CardBody>A second slide with a much longer quote that wraps over several lines in a narrow column.</CardBody></Card>
      </Carousel>
    </div>
  ),
};
