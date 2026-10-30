import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { iconArg } from '../../../.storybook/icon-arg';

const meta = {
  title: 'Components/Feedback/Badge',
  component: Badge,
  args: { children: 'Active', variant: 'subtle', tone: 'success' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['subtle', 'solid', 'outline'] },
    tone: { control: 'select', options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] },
    leftIcon: iconArg,
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-2">{children}</div>;
const STATUS = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;

export const Playground: Story = {};

export const Styles: Story = {
  render: () => <div className="flex flex-col gap-3">
    {(['subtle', 'solid', 'outline'] as const).map((v) => <Row key={v}>{STATUS.map((t) => <Badge key={t} variant={v} tone={t}>{t}</Badge>)}</Row>)}
  </div>,
};

export const CategoryTones: Story = {
  name: 'Category tones',
  render: () => <Row>{(['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] as const).map((t) => <Badge key={t} tone={t}>{t}</Badge>)}</Row>,
};

export const Extras: Story = {
  render: () => <Row>
    <Badge tone="success" dot>Online</Badge>
    <Badge tone="danger" dot ping>Live</Badge>
    <Badge tone="info" leftIcon="schedule">Scheduled</Badge>
    <Badge tone="primary" count={8} />
    <Badge variant="solid" tone="danger" count={120} />
    <Badge onRemove={() => {}}>Design</Badge>
    <Badge tone="danger" dot aria-label="New messages" />
  </Row>,
};

export const Interactive: Story = {
  render: () => <Row>
    <Badge onClick={() => {}}>Filter: Open</Badge>
    <Badge href="#tag" tone="violet">Link badge</Badge>
    <Badge onClick={() => {}} loading>Saving</Badge>
    <Badge onClick={() => {}} disabled>Archived</Badge>
  </Row>,
};

export const LongLabel: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: 160 }}>
      <Badge {...args}>Waiting for approval from finance</Badge>
      <Badge {...args}>{"Donaudampfschifffahrtsgesellschaft"}</Badge>
    </div>
  ),
};
