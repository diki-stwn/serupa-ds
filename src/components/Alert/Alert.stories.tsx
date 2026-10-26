import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  args: { tone: 'info', title: 'Heads up', children: 'Your trial ends in 3 days.' },
  argTypes: { tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger', 'neutral'] } },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

const Col = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3" style={{ maxWidth: 480 }}>{children}</div>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => <Col>
    <Alert>A new version is available.</Alert>
    <Alert tone="success">Changes saved.</Alert>
    <Alert tone="warning">Your storage is almost full.</Alert>
    <Alert tone="danger">We couldn't save your changes.</Alert>
    <Alert tone="neutral">Comments are turned off for this file.</Alert>
  </Col>,
};

export const WithActions: Story = {
  name: 'With a title and actions',
  render: () => <Col>
    <Alert tone="danger" title="Payment failed" actions={<><Button size="sm" variant="secondary">Update card</Button><Button size="sm" variant="ghost">Later</Button></>}>We couldn't charge the card ending 4242.</Alert>
  </Col>,
};

export const Dismissible: Story = {
  render: function Render() {
    const [show, setShow] = React.useState(true);
    return <Col>{show ? <Alert tone="success" onDismiss={() => setShow(false)}>Changes saved.</Alert> : <Button variant="secondary" onClick={() => setShow(true)}>Show again</Button>}</Col>;
  },
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Alert {...args} title="Your payment method was declined by the bank, so the renewal didn't go through" onDismiss={() => {}}>
        We tried the card ending 4242 three times. Update it in Billing within 7 days to keep {"Donaudampfschifffahrtsgesellschaftskapitänskajüte"} and every other workspace running.
      </Alert>
    </div>
  ),
};
