import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast, Toaster } from './Toast';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Feedback/Toast',
  component: Toaster,
  args: { position: 'bottom-end' },
  argTypes: { position: { control: 'select', options: ['bottom-end', 'bottom-start', 'bottom-center', 'top-start', 'top-center', 'top-end'] } },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Toaster {...args} />
      <Button variant="secondary" onClick={() => toast('Link copied')}>Neutral</Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Changes saved', tone: 'success' })}>Success</Button>
      <Button variant="secondary" onClick={() => toast({ title: 'New version available', description: 'Reload to update.', tone: 'info' })}>Info</Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Storage almost full', tone: 'warning' })}>Warning</Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Upload failed', description: 'The file is over 10 MB.', tone: 'danger', duration: 0 })}>Danger</Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Moved to trash', action: { label: 'Undo', onClick: () => toast('Restored') } })}>With an action</Button>
    </div>
  ),
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Shows the given toasts while the story is open (they stay until closed), and clears them when it closes.
function Showing(props: { position?: React.ComponentProps<typeof Toaster>['position']; limit?: number; toasts: Parameters<typeof toast>[0][] }) {
  // The toasts it opened with: shown once on mount, not again when a re-render passes a new array.
  const toasts = React.useRef(props.toasts);
  React.useEffect(() => { toasts.current.forEach((o) => toast(typeof o === 'string' ? { title: o, duration: 0 } : { duration: 0, ...o })); return () => toast.dismiss(); }, []);
  return <Toaster position={props.position} limit={props.limit} />;
}

export const Tones: Story = {
  render: (args) => <Showing position={args.position} limit={5} toasts={[
    'Link copied',
    { title: 'New version available', description: 'Reload to update.', tone: 'info' },
    { title: 'Changes saved', tone: 'success' },
    { title: 'Storage almost full', description: 'You’ve used 9.6 of 10 GB.', tone: 'warning' },
    { title: 'Upload failed', description: 'The file is over 10 MB.', tone: 'danger' },
  ]} />,
};
export const WithAction: Story = {
  render: (args) => <Showing position={args.position} toasts={[{ title: 'Moved to trash', description: 'Atlas and 3 files.', action: { label: 'Undo', onClick: () => {} } }]} />,
};
export const TopCenter: Story = {
  args: { position: 'top-center' },
  render: (args) => <Showing position={args.position} toasts={['Copied to clipboard', { title: 'Changes saved', tone: 'success' }]} />,
};
/** A burst: the same error three times is one toast with a count, and past the limit (3) the rest wait under "+2 more". */
export const Burst: Story = {
  render: (args) => <Showing position={args.position} toasts={[
    'Photo 1 uploaded', 'Photo 2 uploaded', 'Photo 3 uploaded', 'Photo 4 uploaded',
    { title: 'Network error', tone: 'danger' }, { title: 'Network error', tone: 'danger' }, { title: 'Network error', tone: 'danger' },
  ]} />,
};

export const LongText: Story = {
  render: (args) => <Showing position={args.position} toasts={[
    { title: 'Your export of every project, task and comment from the last year is ready', description: 'Download it within 7 days from Settings. Donaudampfschifffahrtsgesellschaftskapitänskajüte.', tone: 'success', action: { label: 'Download the export', onClick: () => {} } },
  ]} />,
};
