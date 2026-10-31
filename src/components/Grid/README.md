# Grid

Cells in equal columns, or as many columns as fit, with the same space between them from the spacing scale. Use it for a set of cards, a gallery, a dashboard's tiles.

```jsx
const { Grid, Card } = window.Serupa;

// As many columns as fit, each at least 256px: one on a phone, two or three on wider screens
<Grid>{projects.map((p) => <Card key={p.id} title={p.name} />)}</Grid>

<Grid columns={3} gap={6}>…</Grid>
// Up to three: three on a wide screen, two, then one as it narrows, each at least 240px
<Grid columns={3} minColumnWidth="240px">…</Grid>
// Two cards on a wide screen share the width instead of leaving empty columns
<Grid fill>{featured}</Grid>
<Grid minColumnWidth="container-3xs" as="ul">…</Grid>
<Grid minColumnWidth="12rem" gap={2}>…</Grid>
```

## When to use

- A set of similar items side by side: cards, a gallery, a dashboard's tiles.
- Columns that should follow the screen's width without writing breakpoints.

## When not to use

- Items in a single column or a single row: use [Stack](../Stack/README.md) instead.
- Data in rows and columns that people compare: use [Table](../Table/README.md) instead.
- Setting the page's width and side padding: use [Container](../Container/README.md) instead.

## Usage

- Prefer `columns="auto"` with a `minColumnWidth` that suits the content, so the grid fits any screen. A fixed number of columns stays the same on a phone.
- To cap the columns ("never more than three"), give `columns` a number and a `minColumnWidth`: the grid shows that many on a wide screen and fewer as they would get narrower than `minColumnWidth`, with no breakpoints.
- Use `fill` when a few cells should share the width (two featured cards). Leave it off when cells should line up with fuller rows above or in other grids.
- Use `as="ul"` when the cells are a list of things.
- Use the same `gap` as the layout around the grid, so the spacing reads as one system.

## Accessibility

- The reading and tab order follow the children, row by row: keep them in the order people see them.
- Use `as="ul"` when the cells are a list of things. It then carries `role="list"`, since Safari stops calling a list without bullets a list.
- **Keyboard:** none: a layout box, not focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root element (`as`). |
| `columns` | `1` to `12` \| `'auto'` | `'auto'` | A number of equal columns, or as many as fit. A number with `minColumnWidth` is "up to": that many, fewer on a narrower grid |
| `minColumnWidth` | a CSS length, or a sizing token name such as `'container-3xs'` | `container-3xs` (256px) with `'auto'`, none with a number | The narrowest a column gets. On a grid narrower than that, the one column takes the whole width |
| `fill` | boolean | `false` | With `'auto'` or "up to": a short row's cells stretch across the empty columns (`auto-fit`). A fixed number of columns ignores it |
| `gap` | a spacing step: `0` `0.5` `1` `1.5` `2` `2.5` `3` `3.5` `4` `5` `6` `7` `8` `9` `10` `11` `12` `14` `16` `20` `24` | `4` (16px) | The space between cells |
| `as` | `'div'` \| `'section'` \| `'ul'` \| `'ol'` | `'div'` | The element. A list loses its bullets, margins and padding |

A fixed number of columns doesn't change with the screen: for that, use `'auto'`, or add a `minColumnWidth`. A Grid inside another starts from its own defaults; it doesn't take the outer one's `gap` or `minColumnWidth`. `className`, `style`, `ref` and everything else go to the element, which has `data-component="grid"`.

## Component tokens

Each is an optional override: set it on the page, a container or one element. The list lives in `src/components/Grid/grid.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from grid.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--grid-gap` | `spacing-4` | The space between cells when gap isn't given (16px). |
| `--grid-min-column` | `container-3xs` | The narrowest a column gets with columns="auto" when minColumnWidth isn't given (256px). |
<!-- token-table:end -->
