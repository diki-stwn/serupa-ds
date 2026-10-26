import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { iconArg } from '../../../.storybook/icon-arg';

const meta = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  args: {
    icon: 'folder_open',
    title: 'No projects yet',
    description: 'Create a project to start tracking your work.',
    actions: <><Button leftIcon="add">New project</Button><Button variant="outline">Import</Button></>,
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, variant: { control: 'inline-radio', options: ['plain', 'dashed'] }, actions: { control: false }, icon: iconArg },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const NoResults: Story = {
  render: () => (
    <Card style={{ maxWidth: 480 }}>
      <EmptyState size="sm" icon="search_off" title="No results" description={'Nothing matches "quarterly".'} actions={<Button variant="outline" size="sm">Clear the search</Button>} />
    </Card>
  ),
};

export const Dashed: Story = { args: { variant: 'dashed', icon: 'upload', title: 'Drop files here', description: 'PNG, JPG or PDF, up to 10 MB.', actions: <Button variant="outline">Choose files</Button> } };

export const Small: Story = { args: { size: 'sm' } };

export const TextOnly: Story = {
  name: 'Text only',
  args: { icon: undefined, actions: undefined, title: 'Nothing here', description: 'Items you archive show up here.' },
};

export const DashedSmall: Story = {
  name: 'Dashed, small',
  args: { variant: 'dashed', size: 'sm', icon: 'add_photo_alternate', title: 'Add a cover image', description: undefined, actions: <Button variant="outline" size="sm">Upload</Button> },
};

export const LongText: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <EmptyState {...args} title="No projects match every one of the filters you picked" description={"Try fewer filters, or search for Donaudampfschifffahrtsgesellschaftskapitänskajüte by name instead."} />
    </div>
  ),
};
