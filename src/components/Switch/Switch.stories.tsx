import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta = {
  title: 'Components/Forms/Switch',
  component: Switch,
  args: { children: 'Wi-Fi', size: 'md', labelPosition: 'end' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, labelPosition: { control: 'inline-radio', options: ['end', 'start'] } },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

const Col = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3">{children}</div>;

export const Playground: Story = {};
export const WithDescription: Story = { name: 'With a description', args: { children: 'Auto-update', description: 'Install updates overnight', defaultChecked: true } };

export const Sizes: Story = {
  render: () => <Col><Switch size="sm">Small</Switch><Switch defaultChecked>Medium</Switch><Switch size="lg">Large</Switch></Col>,
};

export const States: Story = {
  render: () => <Col>
    <Switch defaultChecked>On</Switch>
    <Switch invalid>Required setting</Switch>
    <Switch readOnly defaultChecked>Read-only and on</Switch>
    <Switch disabled>Disabled</Switch>
    <Switch disabled defaultChecked>Disabled and on</Switch>
    <div style={{ maxWidth: 320 }}><Switch labelPosition="start" className="w-full justify-between">Label first</Switch></div>
  </Col>,
};

export const Pending: Story = {
  render: function Render() {
    const [on, setOn] = React.useState(false), [saving, setSaving] = React.useState(false);
    return <Switch checked={on} pending={saving} onChange={(e) => { setOn(e.currentTarget.checked); setSaving(true); setTimeout(() => { setSaving(false); }, 1500); }}>Sync contacts</Switch>;
  },
};

export const LongLabel: Story = {
  render: (args) => (
    <div style={{ width: 240 }}>
      <Switch {...args} description="Updates install overnight while the device is charging and connected to Wi-Fi.">
        Install updates automatically, including {"Donaudampfschifffahrtsgesellschaft"} add-ons
      </Switch>
    </div>
  ),
};
