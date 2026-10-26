import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';
import { Text } from '../Text/Text';

const meta = {
  title: 'Components/Actions/Link',
  component: Link,
  args: { href: '#', children: 'the guide' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['primary', 'neutral'] },
    underline: { control: 'inline-radio', options: ['always', 'hover'] },
    as: { control: false },
  },
  render: (args) => <Text>Read <Link {...args} /> before you start.</Text>,
} satisfies Meta<typeof Link>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const External: Story = { args: { href: 'https://example.com', external: true, children: 'the status page' } };

export const Neutral: Story = {
  render: () => <Text size="sm" tone="muted">By signing up you agree to the <Link href="#" tone="neutral">terms</Link> and the <Link href="#" tone="neutral">privacy policy</Link>.</Text>,
};

export const UnderlineOnHover: Story = {
  render: () => <nav aria-label="Footer"><ul className="flex gap-4 text-sm">{['Pricing', 'Docs', 'Blog'].map((l) => <li key={l}><Link href="#" underline="hover">{l}</Link></li>)}</ul></nav>,
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <Text>Read <Link {...args}>the complete guide to setting up single sign-on for your organisation</Link> first, or <Link {...args} href="https://example.com" external>{"Donaudampfschifffahrtsgesellschaft"}</Link>.</Text>
    </div>
  ),
};
