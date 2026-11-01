# VirtualList

A [List](../List/README.md) of any length that draws only the rows in view, so ten thousand people, files or log lines scroll as smoothly as ten. The rows are ListItems and look the same as in a List.

```tsx
import { VirtualList, ListItem } from "serupa-ds";

<VirtualList aria-label="Members" count={people.length} itemKey={(i) => people[i].id}
  renderItem={(i) => <ListItem title={people[i].name} description={people[i].email} />} />
```

## When to use

- Hundreds or thousands of rows that people scroll through on one page: members, files, events, log lines.
- A list inside a panel or card that should scroll by itself, at a fixed most height.

## When not to use

- Up to a couple of hundred rows: use a [List](../List/README.md). Every row is then in the page, so the browser's find (Ctrl+F) and printing see them all.
- Rows people compare across columns: use a [Table](../Table/README.md) with [Pagination](../Pagination/README.md).
- Choosing from a long list: use a [Combobox](../Combobox/README.md), which narrows as people type.

## Usage

- Give it an `aria-label` (or `aria-labelledby` pointing at a heading): it's a scrolling region people can Tab to.
- Pass `itemKey` when rows can be added, removed or reordered, so each row keeps its element.
- Set `estimatedItemHeight` near a typical row's height (56px fits a row with a description). Rows are measured once drawn, so rows of different heights are fine; the guess only sets the scroll range until the first rows are seen.
- It is 384px tall at most (`--virtual-list-height`). Set the token, or a `style` height, to fill a panel.
- Rows can be links or buttons. Tab moves through the rows that are drawn, and the row with focus stays drawn while scrolled away.
- Rows not drawn aren't in the page: the browser's find doesn't see them. Offer a search or filter for long lists.

## Behavior

- Browsers stop an element's height at about 17.9 million px (33.5 million in Chromium and WebKit). Past 15 million px of rows (about 270,000 rows of 56px), the scroll range stays at 15 million and is scaled: the scrollbar's position is the same fraction of the rows, so every row, the last included, can be reached. The wheel and the scrollbar then move through the rows faster than one pixel per pixel. End and Home still go to the last and first rows.
- It draws the rows in view and 4 more on each side (`overscan`); an empty space above and below stands in for the rest, so the scrollbar is the right size.
- Rows not measured yet count as the average height of those seen. When a row above the view turns out taller or shorter, the scroll moves by as much, so what's seen stays still.
- On the server it draws the first 20 rows.

## Accessibility

- **Role and name:** a `<ul role="list">` (or `<ol>`) named by your `aria-label`. Each drawn row has `aria-posinset` and `aria-setsize`, so screen readers say "5,001 of 10,000" though only a few rows are in the page.
- **Keyboard:** the list takes focus (`tabIndex` 0) and scrolls with the arrows, Page Up, Page Down, Home and End. Links and buttons in rows are reached with Tab; the row with focus is never removed while it has focus.
- **Contrast:** row text reads 4.5:1 and the focus ring 3:1 in all six themes (`VirtualList.test.tsx`).
- **What's still yours:** the name, and a search or filter for lists people need to find a row in.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the `<ul>`. |
| `count` | `number` | | How many rows there are. |
| `renderItem` | `(index: number) => ReactElement` | | Draws row `index`: a ListItem, or an element that passes its props and style to an `<li>`. |
| `itemKey` | `(index: number) => Key` | the index | A stable key for each row (its id). |
| `estimatedItemHeight` | `number` | `56` | A guess at a row's height in px, for rows not drawn yet. |
| `overscan` | `number` | `4` | Rows drawn beyond each edge of the view. |
| `variant` | `'plain' \| 'card'` | `'plain'` | `'card'`: inside a bordered, rounded frame, as List. |
| `divided` | `boolean` | `true` | Lines between rows. |
| `as` | `'ul' \| 'ol'` | `'ul'` | `'ol'` when the order matters. |

`className`, `ref` and every other prop go to the `<ul>`.

## Component tokens

Each is an optional override: set it on the page, a container or one VirtualList. The list lives in `src/components/VirtualList/virtual-list.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from virtual-list.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--virtual-list-focus-ring` | `focus-ring` | The ring around the list while it has keyboard focus (3:1). |
| `--virtual-list-height` | `spacing-96` | The most the list grows to before it scrolls inside (384px). |
<!-- token-table:end -->
