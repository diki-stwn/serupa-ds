# SortableList

A list people put in their own order: tasks by priority, steps in a flow, columns in a table. Each row has a handle; people drag it, tap it and then tap where the row goes, or pick the row up with the keyboard and move it with the arrow keys. Every step is announced to screen readers.

```tsx
import { SortableList } from "serupa-ds";

const [tasks, setTasks] = React.useState([{ id: "brief", title: "Write the brief" }, { id: "review", title: "Review the designs" }]);
<SortableList
  aria-label="Launch tasks"
  items={tasks}
  getKey={(t) => t.id}
  getLabel={(t) => t.title}
  renderItem={(t) => <span>{t.title}</span>}
  onReorder={(next) => setTasks(next)}
/>
```

## When to use

- An order people choose and that matters: priorities, a playlist, the steps of a checklist, which columns show first.
- Short lists that fit on one screen, up to a few dozen rows.

## When not to use

- An order that follows from the data (date, name, size): offer sorting, such as Table's sortable headers.
- Moving items between groups or columns, such as a kanban board: that needs more than one list.
- Very long lists where dragging far is the main job: dragging scrolls at the edges, but offer "Move to top" or a position field as well.

## Anatomy

Drawn from the `Horizontal` story.

1. **Item** (`.dk-sortable-list__item`): one thing to put in order.
2. **Handle** (`.dk-sortable-list__handle`): drag it, or press Space and use the arrow keys, to move the item.
3. **Content** (`.dk-sortable-list__content`): what the item shows.

## Usage

- Name the list with `aria-label` (or `aria-labelledby`), and give each item a short name with `getLabel`. The name goes on its handle ("Reorder Write the brief") and in every announcement.
- `getKey` must return a stable id, not the index, so focus and any state inside a row follow it as it moves.
- Save the new order in `onReorder`. It's called once, on drop, and only when the position changed; it gets the new array and `{ from, to }` (from 0). If saving can fail, put the old order back and say so.
- Keep buttons and links inside rows: only the handle starts a drag.

## Behavior

- Pointer: press the handle and move more than 4px; the row follows the pointer and the others move out of its way. Letting go drops it. A press without moving picks the row up, as Space does; a press on another row's handle then drops it in that row's place, and a press on its own handle drops it where it is (WCAG 2.5.7: no drag needed). Held near the top or bottom edge of the list's scrolling container (or of the window), it scrolls that way, faster nearer the edge, so a row can be moved past the screen.
- Keyboard: Space or Enter on a handle picks the row up. The arrow keys move it one place, Home and End to either end. Space or Enter drops it, and Escape, Tab or a click elsewhere puts it back where it was. Focus stays on its handle throughout.
- Nothing is reported until the drop, so a cancelled move leaves your data alone.
- `disabled` shows the rows without handles.
- `orientation="horizontal"` lays the items out in a row (a board's columns, a set of tabs) that scrolls sideways inside itself when it doesn't fit: a drag moves sideways and scrolls at the left and right edges, and Left and Right follow the reading direction, so in right-to-left ArrowLeft moves an item later. Up and Down still move it earlier and later.

## Accessibility

- A `<ul role="list">` of `<li>` rows (the role keeps it a list in Safari). Each handle is a button named "Reorder" and the item's name, described by the keyboard instructions, with `aria-pressed` while its row is picked up.
- Screen readers hear each step in a polite live region: "Picked up Gemini, position 2 of 4.", "Gemini, position 3 of 4.", "Dropped Gemini at position 4 of 4." or "Cancelled. Gemini is back at position 2 of 4." The words come from `SerupaProvider` labels (Indonesian in `idLabels`).
- Screen reader users in browse mode activate the handle with Enter, which picks the row up the same way.
- The handle is at least 24 by 24px, and it keeps 3:1 (the text 4.5:1) on the row in all six themes (`SortableList.test.tsx`). In forced-colors mode the moving row gets a Highlight outline.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To each row's handle |
| Space / Enter | On a handle, picks the row up; again, drops it where it is |
| Up / Left, Down / Right | Moves the picked-up row one place, announcing where it is |
| Home / End | Moves it to the top or the bottom |
| Escape / Tab | Puts it back where it was |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<ul>`. |
| `items` | `T[]` | | The items, in order. |
| `getKey` | `(item: T) => string \| number` | | A stable id. |
| `getLabel` | `(item: T) => string` | | The item's name, for its handle and announcements. |
| `renderItem` | `(item: T, state: { index, dragging }) => ReactNode` | | A row's content, after its handle. |
| `onReorder` | `(items: T[], move: { from, to }) => void` | | On drop, when the position changed. |
| `disabled` | `boolean` | `false` | No handles. |
| `reorderLabel` | `string` | `'Reorder'` | The word before the item's name on its handle. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | A column or a row. |

Every other prop, `className` and `ref` go to the `<ul>`, which has `data-component="sortable-list"`. `autoFocus` focuses the first handle. A row has `data-state="dragging"` while it moves.

## Component tokens

Each is an optional override: set it on the page, a container or one list. The list lives in `src/components/SortableList/sortable-list.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from sortable-list.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--sortable-list-text` | `text` | The rows' text. |
| `--sortable-list-item-bg` | `surface` | A row's background. |
| `--sortable-list-item-border` | `border` | A row's border. |
| `--sortable-list-item-border-active` | `primary` | The border of the row being moved. |
| `--sortable-list-handle` | `text-muted` | The handle (3:1 on the row). |
| `--sortable-list-handle-active` | `text` | The handle on hover and while its row moves. |
| `--sortable-list-handle-bg-hover` | `secondary` | The handle's background on hover. |
| `--sortable-list-focus-ring` | `focus-ring` | The handle's keyboard focus ring. |
| `--sortable-list-item-shadow-active` | `shadow-md` | The raised look of the row being moved. |
| `--sortable-list-item-radius` | `rounded-md` | A row's corners (6px). |
| `--sortable-list-gap` | `spacing-2` | Space between rows (8px). |
| `--sortable-list-item-gap` | `spacing-2` | Space between the handle and the content (8px). |
| `--sortable-list-item-padding-y` | `spacing-2` | Space above and below a row's content (8px). |
| `--sortable-list-item-padding-x` | `spacing-3` | Space at a row's end, and its start without a handle (12px). |
| `--sortable-list-item-padding-start` | `spacing-1` | Space before the handle (4px). |
| `--sortable-list-handle-size` | `spacing-6` | The handle's smallest size, its target (24px). |
<!-- token-table:end -->
