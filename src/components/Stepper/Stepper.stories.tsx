import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from './Stepper';
import { Button } from '../Button/Button';

const STEPS = [{ title: 'Account', description: 'Email and password' }, { title: 'Profile', optional: true }, { title: 'Billing', description: 'Card or invoice' }, { title: 'Review' }];
const meta = {
  title: 'Components/Navigation/Stepper',
  component: Stepper,
  args: { steps: STEPS, current: 1, orientation: 'horizontal', size: 'md' },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    current: { control: { type: 'range', min: 0, max: 4 } },
  },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Interactive: Story = {
  render: function Render() {
    const [step, setStep] = React.useState(0);
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <Stepper steps={STEPS} current={step} onStepClick={setStep} />
      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        <Button disabled={step === STEPS.length} onClick={() => setStep(step + 1)}>{step >= STEPS.length - 1 ? 'Finish' : 'Next'}</Button>
      </div>
    </div>;
  },
};
export const Vertical: Story = { args: { orientation: 'vertical', current: 2 } };
export const WithError: Story = { args: { current: 2, steps: [{ title: 'Upload' }, { title: 'Check', status: 'error', description: '3 rows need fixing' }, { title: 'Import' }] } };
export const WithWarning: Story = { args: { current: 2, steps: [{ title: 'Details' }, { title: 'Photos', status: 'warning', description: 'Add at least one' }, { title: 'Publish' }] } };
/** A form people can fill in any order: clickable="all" makes every step but the current one a button. */
export const NonLinear: Story = {
  render: function Render() {
    const [step, setStep] = React.useState(1);
    return <Stepper steps={STEPS} current={step} onStepClick={setStep} clickable="all" />;
  },
};
/** Too narrow for the titles side by side (a phone, or 400% zoom): the circles, and the current step under them. */
export const Narrow: Story = { args: { current: 1 }, decorators: [(S) => <div style={{ maxWidth: '320px' }}><S /></div>] };

export const LongLabels: Story = {
  args: { steps: [{ title: 'Account and sign-in details', description: 'Email address, password and two-step verification' }, { title: 'Donaudampfschifffahrtsgesellschaftskapitänskajüte', optional: true }, { title: 'Billing', description: 'Card or invoice' }, { title: 'Review everything and confirm' }] },
  render: (args) => <div style={{ maxWidth: 320 }}><Stepper {...args} /></div>,
};
