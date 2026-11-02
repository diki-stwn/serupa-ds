# TreeView

Nested items that open and close, such as folders and files, a table of contents or categories. People pick one item, or several, and move through the tree with the arrow keys in one Tab stop.

```tsx
import { TreeView, type TreeViewItem } from "serupa-ds";

const files: TreeViewItem[] = [
  { id: "src", label: "src", icon: "folder", children: [
    { id: "index", label: "index.ts", icon: "draft" },
  ] },
  { id: "readme", label: "README.md", icon: "draft" },
];

<TreeView aria-label="Files" items={files} defaultExpanded={["src"]} onValueChange={(ids) => open(ids[0])} />

// several picked
<TreeView aria-label="Files" items={files} selectionMode="multiple" value={picked} onValueChange={setPicked} />
```

## When to use

- A hierarchy people browse and pick from: folders and files, an org chart, nested categories.
- A table of contents with sections inside sections (`selectionMode="none"` when the items only open and close).

## When not to use

- One level of items: use a [RadioGroup](../Radio/README.md), a [Select](../Select/README.md) or a [Combobox](../Combobox/README.md).
- A site's navigation with links: use [Sidebar](../Sidebar/README.md), whose groups open and close, since a tree's items aren't links.
- Sections of content that open and close: use [Accordion](../Accordion/README.md).
- Rows with columns: use a [Table](../Table/README.md).

## Anatomy

Drawn from the `Multiple` story.

1. **Item** (`.dk-tree-view__item`): one node, with the nodes under it.
2. **Toggle** (`.dk-tree-view__toggle`): opens and closes the nodes under it; the arrow keys do too.
3. **Icon** (`.dk-tree-view__icon`): an optional picture, such as a folder or a file.
4. **Label** (`.dk-tree-view__label`): the node's name.
5. **Selected item** (`.dk-tree-view__item--selected`): a node chosen now.
6. **Group** (`.dk-tree-view__group`): the nodes under an open one, set in.

## Usage

- Pass `items`, each with a unique `id` and a `label`. An item with `children` opens and closes, even when its children are an empty array (a folder with nothing in it yet).
- Closed items' children aren't in the page, so a large tree costs only the items in view.
- `value` and `defaultValue` hold the picked ids, and `expanded` and `defaultExpanded` the open ones. Both are arrays, controlled or not.
- Give an item `textValue` when its label isn't plain text, so typing still finds it.
- A disabled item can still be focused and read, so people know it's there, but it can't be picked, opened or closed.
- When the focused item leaves the page from outside (you take it out of `items`, or close its parent through `expanded`), focus goes to its nearest parent in view, else the item now in its place, not to the page.
- Your `onKeyDown` runs before the tree's own keys, so `e.preventDefault()` in it keeps the tree from acting on that key.

## Accessibility

- **Role and name:** a `role="tree"` of `role="treeitem"`s with `aria-level`, `aria-posinset`, `aria-setsize` and `aria-expanded`. The children of an open item are in a `role="group"`. Picked items have `aria-selected`. With `selectionMode="multiple"`, the tree has `aria-multiselectable`. Name it with `aria-label` or `aria-labelledby`.
- **Keyboard:** the [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/). It has one Tab stop: the item used last, or else the first picked one, or else the first.

| Key | Does |
| --- | --- |
| Down / Up arrow | Moves to the next or previous item in view |
| Right arrow | Opens a closed item, or moves to an open item's first child (Left right to left) |
| Left arrow | Closes an open item, or moves to its parent (Right right to left) |
| Home / End | Moves to the first or last item in view |
| Enter / Space | Picks the item (toggles it with `selectionMode="multiple"`), or opens and closes it with `"none"` |
| * | Opens every sibling of the item |
| A letter | Moves to the next item starting with what was typed. Letters within half a second make one word, and a Space between them is part of it ("my files" finds "my files", not "my file") |
| Shift + Down / Up | With `"multiple"`: moves and picks |
| Shift + Space | With `"multiple"`: picks every item from the one picked last |
| Ctrl / Cmd + A | With `"multiple"`: picks every item in view |

- **Pointer:** a click on a row picks it (Shift+click picks a range with `"multiple"`), and a click on its chevron opens or closes it without picking. The chevron is a 24px target (WCAG 2.5.8) around its 20px icon.
- **Contrast:** labels read 4.5:1 on the background, and the picked row's on its highlight, in all six themes (`TreeView.test.tsx`). The picked row also has a 2px bar at its start, so it doesn't rely on the background alone.
- **What's still yours:** a name for the tree, and labels that make sense read alone ("Invoices", not "Folder 3").

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<ul role="tree">`. |
| `items` | `TreeViewItem[]` | | `{ id, label, textValue?, icon?, children?, disabled? }`, nested. |
| `selectionMode` | `'single'` \| `'multiple'` \| `'none'` | `'single'` | One picked item, any number, or none (items only open and close). |
| `value` | `string[]` | | The picked ids (controlled). |
| `defaultValue` | `string[]` | `[]` | The picked ids at first. |
| `onValueChange` | `(value: string[]) => void` | | Called when the picked ids change. |
| `expanded` | `string[]` | | The open ids (controlled). |
| `defaultExpanded` | `string[]` | `[]` | The open ids at first. |
| `onExpandedChange` | `(expanded: string[]) => void` | | Called when an item opens or closes. |
| `aria-label` | string | | What the tree holds ("Files"). |

`className`, `style`, `ref` and other props go to the `<ul role="tree">`, which has `data-component="tree-view"`.

## Component tokens

Each is an optional override: set it on the page, a container or one TreeView. The list lives in `src/components/TreeView/tree-view.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from tree-view.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--tree-view-bg` | `surface` | The background. |
| `--tree-view-text` | `text` | The labels (4.5:1 on bg). |
| `--tree-view-item-bg-hover` | `secondary` | A row's background on hover. |
| `--tree-view-item-bg-selected` | `highlight` | The picked row's background. |
| `--tree-view-item-indicator` | `primary` | The 2px bar at the picked row's start. |
| `--tree-view-icon-color` | `text-muted` | The chevrons and item icons. |
| `--tree-view-focus-ring` | `focus-ring` | The ring inside the focused row. |
| `--tree-view-item-bg-pressed` | `pressed` | A row's fill while it's held down. |
| `--tree-view-radius` | `rounded-md` | The tree's corners (6px). |
| `--tree-view-item-radius` | `rounded-sm` | A row's corners (4px). |
| `--tree-view-padding` | `spacing-1` | Space inside the tree (4px). |
| `--tree-view-indent` | `spacing-4` | How much further in each level starts (16px). |
| `--tree-view-item-padding-x` | `spacing-1` | Space at a row's start and end (4px). |
| `--tree-view-gap` | `spacing-1` | Space between the chevron, icon and label (4px). |
| `--tree-view-item-height` | `control-height-md` | A row's least height (32px). |
<!-- token-table:end -->
