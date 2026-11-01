# Splitter

Two panes with a handle between them that people drag, or move with the keys, to give one pane more room: a list and its detail, a sidebar and an editor, code and its output.

```tsx
import { Splitter } from "serupa-ds";

<Splitter separatorLabel="Folders" defaultSize={25} min={15} max={50} collapsible storageKey="mail-folders" style={{ height: "100%" }}>
  <FolderList />
  <MessageList />
</Splitter>

<Splitter direction="vertical" defaultSize={70} separatorLabel="Editor">
  <Editor />
  <Terminal />
</Splitter>
```

## When to use

- Two areas people work in side by side, where how much room each needs depends on the task: a list and detail, a sidebar and editor.
- A panel people sometimes want out of the way (`collapsible`), such as a file tree.

## When not to use

- A sidebar that opens over the page on phones: use [Drawer](../Drawer/README.md), since a handle is hard to drag on a small screen.
- A fixed layout people don't need to change: use [Grid](../Grid/README.md) or [Stack](../Stack/README.md).
- Switching between views rather than showing two at once: use [Tabs](../Tabs/README.md).

## Anatomy

Drawn from the `Playground` story.

1. **First pane** (`.dk-splitter__pane--first`): one side.
2. **Handle** (`.dk-splitter__handle`): drag it, or focus it and use the arrow keys, to share the space; Enter collapses a pane.
3. **Second pane** (`.dk-splitter__pane--second`): the other side.

## Usage

- Name the handle after the pane it resizes (`separatorLabel="Folders"`), so a screen reader says what moving it changes.
- Give the Splitter a height (a vertical one needs it; a horizontal one fills its parent's height when you give it one), and set `min` so the first pane never gets too narrow to use.
- Printed, the panes show their whole content rather than their scrolled windows: the Splitter drops its height, the panes grow to fit, and the separator isn't printed.
- Set `storageKey` so people's layout comes back on their next visit. It's read after the page loads, so a server-rendered page first shows `defaultSize`.
- Sizes are percent of the Splitter, so the layout keeps its proportions when the window resizes.
- Each pane scrolls on its own. Put one Splitter inside another's pane for three panes.

## Behavior

- Dragging the handle moves it with the pointer, even outside the handle, between `min` and `max`. Without dragging (WCAG 2.5.7): a press on the handle, then a press anywhere else in the Splitter, puts the handle there; that second press is the Splitter's, so a button under it isn't pressed. Pressing the handle again, Escape or leaving it cancels. The handle is 8px wide, with a 1px line down its middle that turns 2px primary on hover, while dragged and on focus.
- With `collapsible`, Enter on the handle or a double-click collapses the first pane to 0, and again brings it back at its last size. A collapsed pane is hidden, so Tab skips what's in it, and an arrow key brings it back at `min`. When your code collapses it (a controlled `size` of 0) while focus is inside it, focus moves to the handle.
- Collapsing and bringing back with Enter or a double-click slides: the handle and the second pane glide to their new place while the first pane wipes out or in with them, over 200ms. Press Enter again mid-way and it turns back from where it is. Dragging, the arrow keys and a `size` your code sets move at once, and with reduced motion so does the toggle.
- In a right-to-left page the first pane is on the right, and the arrow keys follow what you see: ArrowLeft moves the handle left.

## Accessibility

- **Role and name:** the WAI-ARIA window splitter pattern. The handle is a focusable `role="separator"` with `aria-orientation`, `aria-valuenow` (the first pane's size in percent), `aria-valuemin`, `aria-valuemax` and `aria-controls` pointing at the first pane. It's named by `separatorLabel`, or "Resize panes" (the `resizePanes` label, "Ubah ukuran panel" in `idLabels`).
- **Keyboard:** Tab reaches the handle; the table below says what each key does there.
- **Touch:** on a touch screen the 8px handle takes a press over 24px, reaching 8px into each pane without moving anything, so a finger can grab it.
- **Contrast:** the handle's line is 3:1 on the page in all six themes, and the focus ring shows around the handle (`Splitter.test.tsx`). In forced colors the line uses the system's text and highlight colors.
- **What's still yours:** a name for each pane's content (a heading, or `nav` and `main` landmarks inside), and a layout that still works when a pane is at `min`.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the handle, between the first pane's content and the second's |
| ArrowLeft, ArrowRight | Move the handle by `step` (a side-by-side Splitter; left and right as you see them, also right to left) |
| ArrowUp, ArrowDown | Move the handle by `step` (`direction="vertical"`) |
| Home, End | Move the handle to `min` and `max` |
| Enter | With `collapsible`: collapse the first pane, or bring it back at its last size |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | | Goes to the root `<div>`. |
| `children` | two `ReactNode`s | | The first and second panes. The handle resizes the first; the second takes the rest. |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Side by side (the first at the start) or stacked (the first on top). |
| `size` | `number` | | The first pane's size in percent (controlled). |
| `defaultSize` | `number` | `50` | The first pane's size at first (uncontrolled). `0` starts it collapsed when `collapsible`. |
| `onSizeChange` | `(size: number) => void` | | Each new size in percent, while dragging or moving with the keys. |
| `min`, `max` | `number` | `10`, `90` | The first pane's least and largest size, in percent. |
| `step` | `number` | `5` | How far an arrow key moves the handle, in percent. |
| `collapsible` | `boolean` | `false` | Enter and a double-click collapse the first pane and bring it back. |
| `storageKey` | `string` | | Keeps an uncontrolled size in `localStorage` under this key. |
| `separatorLabel` | `string` | `'Resize panes'` | The handle's accessible name: say what it resizes. |

`className`, `style`, `ref` and other props go to the root `<div>`, which has `data-component="splitter"` and `data-direction`.

## Component tokens

Each is an optional override: set it on the page, a container or one Splitter. The list lives in `src/components/Splitter/splitter.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from splitter.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--splitter-line` | `field-border` | The handle's line (3:1 on the page). |
| `--splitter-line-active` | `primary` | The line on hover, while dragged and on focus. |
| `--splitter-focus-ring` | `focus-ring` | The handle's focus ring. |
| `--splitter-handle-size` | `spacing-2` | How thick the handle is, the area a pointer can grab (8px). |
<!-- token-table:end -->
