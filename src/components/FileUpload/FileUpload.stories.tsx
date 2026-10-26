import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileUpload } from './FileUpload';

const meta = {
  title: 'Components/Forms/FileUpload',
  component: FileUpload,
  args: { multiple: true, accept: 'image/*,.pdf', maxSize: 5 * 1024 * 1024, maxFiles: 5, hint: 'Images or PDF, up to 5 MB each', disabled: false },
  decorators: [(Story) => <div style={{ maxWidth: 'var(--container-sm)' }}><Story /></div>],
} satisfies Meta<typeof FileUpload>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const SingleFile: Story = { args: { multiple: false, maxFiles: undefined, accept: 'image/png,image/jpeg', hint: 'PNG or JPG, up to 5 MB' } };
export const WithFiles: Story = {
  render: function Render(args) {
    const [files, setFiles] = React.useState<File[]>(() => [new File([new Uint8Array(240 * 1024)], 'site-plan.pdf', { type: 'application/pdf' }), new File([new Uint8Array(1.6 * 1024 * 1024)], 'cover.jpg', { type: 'image/jpeg' })]);
    return <FileUpload {...args} files={files} onFilesChange={setFiles} />;
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { invalid: true, required: true, hint: 'Add at least one image or PDF' } };
export const ReadOnly: Story = { ...WithFiles, args: { readOnly: true } };

export const LongText: Story = {
  args: { title: 'Drag your signed contracts, invoices and receipts here', buttonLabel: 'Choose files from this device', hint: 'Images or PDF, up to 5 MB each, and no more than five files at a time' },
  decorators: [(Story) => <div style={{ width: 220 }}><Story /></div>],
};
