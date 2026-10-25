# Pagination

Moves through pages of results: previous and next arrows around the page numbers, with … where pages are skipped. It always shows the same number of slots, so the arrows stay put as the page changes. Pages are buttons, or links with `getHref` when each page has its own URL.

```jsx
const { Pagination } = window.Serupa;

const [page, setPage] = React.useState(1);
<Pagination count={totalPages} page={page} onPageChange={setPage} />

// Each page has a URL (server rendering, shareable links)
<Pagination count={20} page={page} getHref={(n) => `/orders?page=${n}`} />

<Pagination count={8} size="sm" siblings={0} />
```

## When to use

- Long lists or tables of results split into pages, where people jump to a page or come back to one: orders, search results, logs.
- Results where each page should have its own URL, to share, bookmark or render on the server.

## When not to use

- A feed people scroll through without caring which page they're on: use a "Load more" [Button](../Button/README.md) under the list instead.
- Steps of a task done in order: use [Stepper](../Stepper/README.md) instead.
- A few views of the same thing: use [Tabs](../Tabs/README.md) instead.

## Usage

- Put it under the list or table it pages through.
- When pages have URLs, pass `getHref` so every page is a link; clicks still call `onPageChange`. They go through your router's link set with `configure({ link })`, or `linkAs`.
- Where space is tight, use `size="sm"` and fewer `siblings`. The number of slots stays the same, so the arrows don't move.
- Page numbers are written in the digits of the locale from `SerupaProvider` (or the browser), as Calendar writes its
  days: ١ ٢ ٣ in Egyptian Arabic, ۱ ۲ ۳ in Persian. A page's name comes from `pageLabel`, so translate it with the
  other labels.

`paginationRange(page, count, siblings, boundaries)` returns the same list of pages and ellipses, for building your own.

## Accessibility

- It's a `<nav>` landmark named "Pagination" with a list. The current page has `aria-current="page"`; the ellipses are hidden from screen readers.
- At the first or last page the arrow is disabled (a link loses its `href` and gets `aria-disabled`).
- Pages, also on hover, the current page and the ellipsis keep 4.5:1 in all six themes (`Pagination.test.tsx`).
- The arrows point the other way in right-to-left pages.
- After a page change, move focus to the top of the new results (or announce them) so keyboard and screen reader users know the list changed.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To each page, the arrows and any link or button in it; a disabled arrow is skipped |
| Enter | Goes to that page (Space too, when the pages are buttons) |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<nav>`. |
| `count` | number | required | How many pages there are |
| `page` | number | none | The current page, from 1 (controlled) |
| `defaultPage` | number | `1` | The page it starts on when uncontrolled |
| `onPageChange` | `(page) => void` | none | Called with the new page |
| `getHref` | `(page) => string` | none | Makes every page a link. Clicks still call `onPageChange` |
| `linkAs` | a component | the `configure({ link })` link, else `'a'` | With `getHref`, your router's link component for the page links (it gets `href`, `className` and the rest). The disabled arrows stay plain `<a>` |
| `siblings` | number | `1` | Pages on each side of the current one |
| `boundaries` | number | `1` | Pages always shown at each end |
| `size` | `'sm'` \| `'md'` | `'md'` | 24px or 32px squares |
| `aria-label` | string | `"Pagination"` | The nav's name |
| `previousLabel`, `nextLabel` | string | `"Previous page"`, `"Next page"` | The arrows' names |
| `pageLabel` | `(page) => string` | `"Page " + page` | A page's name |

`className`, `style`, `ref` and everything else go to the `<nav>`, which has `data-component="pagination"`.

## Component tokens

Each is an optional override: set it on the page, a container or one pagination. The list lives in `src/components/Pagination/pagination.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--pagination-text` | `text` | A page number and the arrows. |
| `--pagination-bg-hover` | `secondary` | A page or arrow on hover. |
| `--pagination-bg-pressed` | `pressed` | A page or arrow while it's pressed, one step past hover. |
| `--pagination-current-bg` | `primary` | The current page's background. |
| `--pagination-current-text` | `on-primary` | The current page's number (4.5:1 on current-bg). |
| `--pagination-ellipsis` | `text-muted` | The … between page ranges (4.5:1 on surface). |
| `--pagination-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--pagination-font-size` | `text-sm` | Page numbers (14px). |
| `--pagination-weight-current` | `font-semibold` | The current page's weight (600). |
| `--pagination-size` | `control-height-md` | A page's width and height at size md (32px). |
| `--pagination-size-sm` | `control-height-sm` | At size sm (24px). |
| `--pagination-gap` | `spacing-1` | Space between pages (4px). |
| `--pagination-padding-x` | `spacing-2` | Side padding inside a page, for wide numbers (8px). |
| `--pagination-padding-x-sm` | `spacing-1` | At size sm (4px), so any digit fits in the 24px square. |
| `--pagination-radius` | `rounded-md` | A page's corners (6px). |
| `--pagination-disabled` | `opacity-disabled` | Previous or next when there's no page that way. |
