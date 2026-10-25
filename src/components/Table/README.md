# Table

A data table built on native table markup: a header row, body rows and an optional footer, in a bordered frame that scrolls sideways when the table is too wide. Rows shade on hover (or every other one with `striped`), can be selected with a checkbox column (`TableSelectCell`), and columns can be sorted.

```jsx
const { Table, TableHead, TableBody, TableFoot, TableRow, TableHeaderCell, TableCell, TableSelectCell } = window.Serupa;

<Table caption="Team members">
  <TableHead>
    <TableRow>
      <TableSelectCell header label="Select all rows" checked={all} indeterminate={some} onChange={toggleAll} />
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Role</TableHeaderCell>
      <TableHeaderCell align="end" sort={sort} onSort={() => setSort(sort === 'ascending' ? 'descending' : 'ascending')}>Calls</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {people.map((p) => (
      <TableRow key={p.id} selected={picked.has(p.id)}>
        <TableSelectCell label={'Select ' + p.name} checked={picked.has(p.id)} onChange={() => toggle(p.id)} />
        <TableCell>{p.name}</TableCell>
        <TableCell><Text as="span" tone="muted">{p.role}</Text></TableCell>
        <TableCell align="end">{p.calls}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

<Table size="sm" striped stickyHeader containerProps={{ style: { maxHeight: 400 } }}>…</Table>
```

## When to use

- Data with several values per row that people compare down the columns: members and their roles, orders and their totals.
- People need to sort by a column, or read numbers lined up under each other.

## When not to use

- Items with a line or two of text each, such as people or files: use [List](../List/README.md) instead.
- Items with pictures or a lot of content each: use [Card](../Card/README.md)s in a [Grid](../Grid/README.md).
- Laying out a page or a form in columns: use [Grid](../Grid/README.md) or [Stack](../Stack/README.md); a table is for data.

## Usage

Table only lays out what you give it: sorting, filtering and selection state stay in your code.

- Give every table a `caption`. When a heading on the page already says what it holds, add `captionHidden` so screen readers still hear it.
- Set `align="end"` on number columns, in the header and the cells, so the digits line up.
- Use `size="sm"` for dense data, and `striped` when long rows are hard to follow across.
- With `stickyHeader`, give the frame a height through `containerProps`. The frame measures the header and keeps that much scroll padding at the top, so a focused link or button in a row scrolls into view below the header, not under it (WCAG 2.4.11).

## Accessibility

- It's a real `<table>`, so screen readers announce rows, columns and headers. Give it a `caption` (or `aria-label`) so people know what it holds.
- When it's too wide and scrolls, the frame becomes a focusable region named by the caption, so keyboard users can scroll it with the arrow keys. When it fits, it adds no tab stop.
- A sortable header is a button, and its `<th>` has `aria-sort` once sorted. After sorting, the button keeps focus, and the new order is read out politely ("Sorted by Amount, ascending.", the `tableSorted` label), because `aria-sort` alone is only heard when focus comes back to the header. Nothing is read on the first render.
- In print, the frame shows the whole table instead of its scrolled window, the header row repeats on every page, and a row isn't split across pages.
- Text and muted text keep 4.5:1 on plain, hovered, striped and selected rows, and the header text on its background; the selected bar keeps 3:1 (all six themes, `Table.test.tsx`). Selection isn't shown by color alone: the bar shows it, and a `TableSelectCell`'s checkbox ("Select Ada, checked") says it to screen readers. Browsers ignore `aria-selected` on a plain table's rows, so `selected` doesn't set it; give selectable rows a `TableSelectCell`. The checkbox outline keeps 3:1 on a shaded row.

## Props

### Table

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `size` | `'sm'` \| `'md'` | `'md'` | 12px cell padding, or 8px top and bottom for dense data |
| `striped` | boolean | `false` | Shades every other body row (rows then don't change on hover) |
| `stickyHeader` | boolean | `false` | Keeps the header in view; give the frame a height with `containerProps` |
| `caption` | node | none | The table's title, as its `<caption>` |
| `captionHidden` | boolean | `false` | Hides the caption on screen; screen readers still announce it |
| `containerProps` | div props | none | Go to the scrolling frame, which has `data-component="table"`. An `aria-label` or `aria-labelledby` here names the frame only while it scrolls (when it's a region); a caption takes precedence |

`className`, `ref` and everything else go to the `<table>`.

### The parts

| Part | Element | Props |
| --- | --- | --- |
| `TableHead`, `TableBody`, `TableFoot` | `<thead>`, `<tbody>`, `<tfoot>` | everything goes to the element |
| `TableRow` | `<tr>` | `selected`: shaded, with a primary bar at its start |
| `TableSelectCell` | `<td>`, or `<th scope="col">` with `header` | `label` (required, the checkbox's name: "Select Ada", "Select all rows"); `checked`, `defaultChecked`, `indeterminate`, `onChange`, `disabled`, `name`, `value` and `ref` go to the [Checkbox](../Checkbox/README.md); `cellProps` to the cell. A row whose checkbox is checked is shaded like a selected one |
| `TableHeaderCell` | `<th scope="col">` | `align` (`'start'` \| `'center'` \| `'end'`); `sort` (`'ascending'` \| `'descending'` \| `'none'`) and `onSort` make it a sort button. Pass `scope="row"` for a row header |
| `TableCell` | `<td>` | `align`; `'end'` also gives tabular digits, for numbers |

## Component tokens

Each is an optional override: set it on the page, a container or one table's frame. The list lives in `src/components/Table/table.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--table-bg` | `surface` | The table's background. |
| `--table-text` | `text` | Cell text. |
| `--table-border` | `border` | The frame and the lines between rows. |
| `--table-header-bg` | `surface-muted` | The header row's background. |
| `--table-header-text` | `text-muted` | Header text (4.5:1 on header-bg). |
| `--table-row-bg-hover` | `surface-muted` | A body row on hover, and every other row when striped (muted text keeps 4.5:1). |
| `--table-row-bg-selected` | `surface-muted` | A selected row's background. |
| `--table-row-indicator-selected` | `primary` | The bar at the start of a selected row. |
| `--table-focus-ring` | `focus-ring` | The keyboard focus ring (sort buttons, a scrolling table). |
| `--table-font-size` | `text-sm` | Cell text (14px). |
| `--table-header-weight` | `font-medium` | Header text weight (500). |
| `--table-padding-x` | `spacing-3` | A cell's side padding (12px). |
| `--table-padding-y` | `spacing-3` | A cell's top and bottom padding at size md (12px). |
| `--table-padding-y-sm` | `spacing-2` | At size sm (8px). |
| `--table-border-width` | `border-width-1` | The frame and row lines (1px). |
| `--table-indicator-width` | `border-width-2` | The selected row's bar (2px). |
| `--table-radius` | `rounded-lg` | The frame's corners (8px). |

## Related

- [Pagination](../Pagination/README.md): pages through a long table.
