import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Content/Card',
  component: Card,
  args: { variant: 'outline', padding: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outline', 'elevated', 'filled'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    as: { control: 'inline-radio', options: ['div', 'section', 'article', 'li'] },
  },
  render: (args) => (
    <Card {...args} style={{ maxWidth: 360 }}>
      <CardHeader title="Team plan" description="Up to 10 members" action={<Badge tone="success">Active</Badge>} />
      <CardBody>Renews on 1 March. You're using 6 of 10 seats.</CardBody>
      <CardFooter>
        <Button variant="secondary">Manage seats</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

const Grid = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>{children}</div>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => <Grid>
    <Card><CardHeader title="Outline" description="A border and a hairline shadow" /></Card>
    <Card variant="elevated"><CardHeader title="Elevated" description="A raised shadow" /></Card>
    <Card variant="filled"><CardHeader title="Filled" description="Muted and flat" /></Card>
  </Grid>,
};

export const Padding: Story = {
  render: () => <Grid>
    <Card padding="sm"><CardHeader title="Small" description="12px" /></Card>
    <Card><CardHeader title="Medium" description="20px" /></Card>
    <Card padding="lg"><CardHeader title="Large" description="24px" /></Card>
  </Grid>,
};

export const AsLink: Story = {
  name: 'As a link',
  render: () => <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, listStyle: 'none', margin: 0, padding: 0 }}>
    <li><Card href="#atlas"><CardHeader title="Atlas" description="Updated 2 hours ago" /></Card></li>
    <li><Card href="#beacon"><CardHeader title="Beacon" description="Updated yesterday" /></Card></li>
  </ul>,
};

export const LinkWithActions: Story = {
  name: 'As a link, with actions',
  render: () => <Card href="#atlas" style={{ maxWidth: 360 }}>
    <CardHeader title="Atlas" description="Updated 2 hours ago" />
    <CardBody>Six open tasks, two due this week.</CardBody>
    <CardFooter><Button variant="secondary" size="sm">Star</Button><Button size="sm">Open board</Button></CardFooter>
  </Card>,
};

export const FooterLayouts: Story = {
  name: 'Footer layouts',
  render: () => <div className="flex flex-col gap-4" style={{ maxWidth: 400 }}>
    <Card><CardHeader title="Delete project?" description="This removes every file in Atlas." /><CardFooter><Button variant="secondary">Cancel</Button><Button destructive>Delete</Button></CardFooter></Card>
    <Card><CardBody>Step 2 of 3</CardBody><CardFooter justify="between"><Button variant="ghost">Back</Button><div className="flex gap-2"><Button variant="secondary">Skip</Button><Button>Next</Button></div></CardFooter></Card>
  </div>,
};

export const LongText: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 280 }}>
      <CardHeader title="Enterprise plan for the whole organisation, billed yearly" description={"Donaudampfschifffahrtsgesellschaftskapitänskajüte"} action={<Badge tone="warning">Renewing soon</Badge>} />
      <CardBody>Renews on 1 March. You're using 96 of 100 seats across 14 teams, and 3 invitations are still waiting for an answer.</CardBody>
      <CardFooter>
        <Button variant="secondary">Manage every seat</Button>
        <Button>Upgrade the plan</Button>
      </CardFooter>
    </Card>
  ),
};
