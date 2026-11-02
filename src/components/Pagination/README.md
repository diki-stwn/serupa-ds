# Pagination

Moves through pages of results: previous and next arrows around the page numbers, with … where pages are skipped. It always shows the same number of slots, so the arrows stay put as the page changes. Pages are buttons, or links with `getHref` when each page has its own URL.

```jsx
const { Pagination } = window.Serupa;

const [page, setPage] = React.useState(1);
<Pagination count={totalPages} page={page} onPageChange={setPage} />

// Each page has a URL (server rendering, shareable links)
<Pagination count={20} page={page} getHref={(n) => `/orders?page=${n}`} />

<Pagination count={8} size="sm" siblings={0} />

// Which items show: "21–30 of 245" before the pages
<Pagination count={25} page={3} total={245} pageSize={10} />

// …and a page-size select
<Pagination count={Math.ceil(245 / per)} page={page} onPageChange={setPage} total={245} pageSize={per}
  pageSizeOptions={[10, 25, 50]} onPageSizeChange={(n, p) => { setPer(n); setPage(p); }} />
```

## When to use

- Long lists or tables of results split into pages, where people jump to a page or come back to one: orders, search results, logs.
- Results where each page should have its own URL, to share, bookmark or render on the server.

## When not to use

- A feed people scroll through without caring which page they're on: use a "Load more" [Button](../Button/README.md) under the list instead.
- Steps of a task done in order: use [Stepper](../Stepper/README.md) instead.
- A few views of the same thing: use [Tabs](../Tabs/README.md) instead.

## Anatomy

Drawn from the `PageSize` story.

1. **Summary** (`.dk-pagination__summary`): which items are shown of how many.
2. **Previous and next** (`.dk-pagination__arrow`): go one page back or forward.
3. **Page** (`.dk-pagination__item`): a page to go to.
4. **Current page** (`.dk-pagination__item--current`): the page you're on.
5. **Gap** (`.dk-pagination__ellipsis`): stands for the pages not shown.
6. **Page size** (`.dk-pagination__page-size`): how many items a page holds.

## Usage

- Put it under the list or table it pages through.
- When pages have URLs, pass `getHref` so every page is a link; clicks still call `onPageChange`. They go through your router's link set with `configure({ link })`, or `linkAs`.
- The row stays on one line. When it's wider than its box (the defaults need about 340px), it shows fewer `siblings` and then fewer `boundaries` until it fits, and goes back to what you asked when there's room again. The arrows stay at the ends either way. Within one width the number of slots stays the same, so the arrows don't move as you page. `size="sm"` fits more.
- Page numbers are written in the digits of the locale from `SerupaProvider` (or the browser), as Calendar writes its
  days: ١ ٢ ٣ in Egyptian Arabic, ۱ ۲ ۳ in Persian. A page's name comes from `pageLabel`, so translate it with the
  other labels.

- With `total` and `pageSize`, a summary before the pages says which items show: "21–30 of 245", in the locale's digits and grouping ("1.001–1.010 dari 12.345" in id-ID). The pages sit at the end of the row, and wrap under the summary when both don't fit on one line. Change its words with the `itemsOf` label.
- With `pageSizeOptions` (and `pageSize`), an "Items per page" select after the summary offers the sizes, in the locale's digits. Picking one calls `onPageSizeChange(size, page)` with the page that keeps the first item shown in view: page 5 at 10 a page starts with item 41, which is on page 2 at 25 a page. Set both; an uncontrolled `page` moves by itself. Change its label with the `perPage` label.

`paginationRange(page, count, siblings, boundaries)` returns the same list of pages and ellipses, for building your own.

## Accessibility

- It's a `<nav>` landmark named "Pagination" with a list. The current page has `aria-current="page"`; the ellipses are hidden from screen readers.
- At the first or last page the arrow is disabled (a link loses its `href` and gets `aria-disabled`).
- Pages, also on hover, the current page and the ellipsis keep 4.5:1 in all six themes (`Pagination.test.tsx`).
- The arrows point the other way in right-to-left text. They follow the nearest `dir`, so a `dir="ltr"` block on a right-to-left page keeps left-to-right arrows.
- After a page change, move focus to the top of the new results (or announce them) so keyboard and screen reader users know the list changed.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To each page, the arrows and any link or button in it; a disabled arrow is skipped |
| Enter | Goes to that page (Space too, when the pages are buttons) |

An arrow that takes you to the first or last page turns disabled, so focus moves to the other arrow instead of falling back to the top of the page.

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
| `total` | number | none | How many items there are in all. With `pageSize`, shows the summary |
| `pageSize` | number | none | How many items a page holds. With `total`, shows the summary |
| `pageSizeOptions` | number[] | none | The page sizes to offer in an "Items per page" select after the summary. Needs `pageSize` |
| `onPageSizeChange` | (pageSize, page) => void | none | Called with the size picked and the page that keeps the first item shown in view |

`className`, `style`, `ref` and everything else go to the `<nav>`, which has `data-component="pagination"`.

## Component tokens

Each is an optional override: set it on the page, a container or one pagination. The list lives in `src/components/Pagination/pagination.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from pagination.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--pagination-text` | `text` | A page number and the arrows. |
| `--pagination-bg-hover` | `secondary` | A page or arrow on hover. |
| `--pagination-bg-pressed` | `pressed` | A page or arrow while it's pressed, one step past hover. |
| `--pagination-current-bg` | `primary` | The current page's background. |
| `--pagination-current-text` | `on-primary` | The current page's number (4.5:1 on current-bg). |
| `--pagination-ellipsis` | `text-muted` | The … between page ranges (4.5:1 on surface). |
| `--pagination-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--pagination-summary` | `text-muted` | The summary with total and pageSize, "21–30 of 245" (4.5:1 on surface). |
| `--pagination-font-size` | `text-sm` | Page numbers (14px). |
| `--pagination-weight-current` | `font-semibold` | The current page's weight (600). |
| `--pagination-size` | `control-height-md` | A page's width and height at size md (32px). |
| `--pagination-size-sm` | `control-height-sm` | At size sm (24px). |
| `--pagination-gap` | `spacing-1` | Space between pages (4px). |
| `--pagination-padding-x` | `spacing-2` | Side padding inside a page, for wide numbers (8px). |
| `--pagination-padding-x-sm` | `spacing-0.5` | At size sm (2px), so two semibold digits fit in the 24px square. |
| `--pagination-summary-gap` | `spacing-4` | Space between the summary and the pages (16px). |
| `--pagination-radius` | `rounded-md` | A page's corners (6px). |
| `--pagination-disabled` | `opacity-disabled` | Previous or next when there's no page that way. |
<!-- token-table:end -->
