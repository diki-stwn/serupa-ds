import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeView, type TreeViewItem } from './TreeView';

const files: TreeViewItem[] = [
  { id: 'src', label: 'src', icon: 'folder', children: [
    { id: 'components', label: 'components', icon: 'folder', children: [
      { id: 'button', label: 'Button.tsx', icon: 'draft' },
      { id: 'menu', label: 'Menu.tsx', icon: 'draft' },
    ] },
    { id: 'index', label: 'index.ts', icon: 'draft' },
  ] },
  { id: 'docs', label: 'docs', icon: 'folder', children: [
    { id: 'intro', label: 'Introduction.mdx', icon: 'draft' },
    { id: 'old', label: 'Archive (read only)', icon: 'folder', disabled: true, children: [] },
  ] },
  { id: 'readme', label: 'README.md', icon: 'draft' },
];

const meta = {
  title: 'Components/Navigation/TreeView',
  component: TreeView,
  args: { 'aria-label': 'Files', items: files, defaultExpanded: ['src', 'components'], defaultValue: ['menu'], style: { maxWidth: '320px' } },
  argTypes: { selectionMode: { control: 'inline-radio', options: ['single', 'multiple', 'none'] }, items: { control: false } },
} satisfies Meta<typeof TreeView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: { selectionMode: 'multiple', defaultExpanded: ['src', 'components', 'docs'], defaultValue: ['button', 'index', 'intro'] },
};

export const NoSelection: Story = {
  args: { selectionMode: 'none', 'aria-label': 'Contents', defaultValue: [], defaultExpanded: ['docs'] },
};

export const RightToLeft: Story = {
  args: { dir: 'rtl' },
};

export const LongLabels: Story = {
  args: {
    items: [
      { id: 'src', label: 'a-folder-with-a-very-long-name-for-every-component', icon: 'folder', children: [
        { id: 'long', label: 'Donaudampfschifffahrtsgesellschaftskapitänskajüte.tsx', icon: 'draft' },
        { id: 'menu', label: 'Menu.tsx', icon: 'draft' },
      ] },
    ],
    defaultExpanded: ['src'],
    defaultValue: ['long'],
    style: { maxWidth: '200px' },
  },
};
