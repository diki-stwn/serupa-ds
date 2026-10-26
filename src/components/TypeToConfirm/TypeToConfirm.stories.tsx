import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypeToConfirm } from './TypeToConfirm';

const meta = {
  title: 'Components/Forms/TypeToConfirm',
  component: TypeToConfirm,
  args: { phrase: 'acme/web', confirmLabel: 'Delete this repository', onConfirm: (): unknown => undefined, style: { maxWidth: 420 } },
} satisfies Meta<typeof TypeToConfirm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'This deletes its issues, pull requests and releases. It can’t be undone.' } };
// An action that takes a while: the button shows loading until the promise settles.
export const Slow: Story = { args: { onConfirm: () => new Promise((r) => setTimeout(r, 1500)) } };
export const Disabled: Story = { args: { disabled: true } };
// The stress story (G14): a long phrase with no spaces and a long button label; the phrase breaks anywhere.
export const LongText: Story = {
  args: {
    phrase: 'donaudampfschifffahrtsgesellschaftskapitaenswitwenrentenversicherung/production-eu-west',
    confirmLabel: 'Delete this organisation, its repositories, members and billing history for good',
  },
};
