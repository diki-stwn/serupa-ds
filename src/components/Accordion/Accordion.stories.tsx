import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion';

const faq = [
  ['shipping', 'How long does shipping take?', 'Orders ship within 2 business days, and arrive in 3 to 5.'],
  ['returns', 'Can I return an item?', 'Yes, within 30 days of delivery, as long as it is unused.'],
  ['warranty', 'Is there a warranty?', 'Every product has a one-year warranty against defects.'],
];
const items = faq.map(([v, t, c]) => <AccordionItem key={v} value={v} title={t}>{c}</AccordionItem>);

const meta = {
  title: 'Components/Content/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem },
  args: { defaultValue: ['shipping'], children: items },
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    variant: { control: 'inline-radio', options: ['plain', 'card'] },
    children: { control: false },
  },
  render: (args) => <div style={{ maxWidth: 480 }}><Accordion {...args} /></div>,
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { type: 'multiple', defaultValue: ['shipping', 'returns'] } };

export const Card: Story = { args: { variant: 'card' } };

export const WithDisabled: Story = {
  args: { children: [...items, <AccordionItem key="gift" value="gift" title="Gift wrapping (coming soon)" disabled>Not yet available.</AccordionItem>] },
};

/** type="multiple" with showExpandAll: one button opens every item, then closes them all. */
export const ExpandAll: Story = { args: { type: 'multiple', showExpandAll: true, defaultValue: [] } };

export const LongText: Story = {
  args: {
    children: [
      <AccordionItem key="a" value="a" title="How long does shipping take to every region outside the European Union?">Orders ship within 2 business days. Donaudampfschifffahrtsgesellschaftskapitänskajüte customers get theirs within a week.</AccordionItem>,
      <AccordionItem key="b" value="b" title="Donaudampfschifffahrtsgesellschaftskapitänskajüte">A title with no place to break.</AccordionItem>,
    ],
    defaultValue: ['a'],
  },
  render: (args) => <div style={{ width: 240 }}><Accordion {...args} /></div>,
};
