# LoadMore

The end of a list that loads in pages: "Showing 20 of 134" over a Load more button, or infinite scroll, and an announcement of what each load added. People keep their place in a long list, and screen reader users hear that new items arrived.

```tsx
import { LoadMore } from "serupa-ds";

<LoadMore onLoadMore={loadNextPage} count={items.length} total={total} hasMore={items.length < total} />
```

## When to use

- A feed, a search result list or a history where people mostly read the newest items and sometimes want more.
- With `infinite`, a feed people scroll through, where pressing a button each page would get in the way.

## When not to use

- A table or a list people come back to at a given place, compare across pages, or link to: use [Pagination](../Pagination/README.md), so each page has an address.
- A list whose end matters, such as a footer below it: infinite scroll keeps pushing that end away. Use the button.

## Anatomy

Drawn from the `LongText` story.

1. **Summary** (`.dk-load-more__summary`): how many are shown of how many there are.
2. **Load more** (`.dk-load-more__button`): adds the next page of items below the ones shown.

## Usage

- Pass `count` (how many are shown) and `total` when you know it, so people see "Showing 20 of 134" and hear "20 more loaded. Showing 40 of 134."
- Return the fetch's promise from `onLoadMore`: the button shows loading and takes no second press until it settles. Or set `loading` from your own fetch state. A rejected promise just ends the loading state: show the error yourself (an [Alert](../Alert/README.md) above the button, say), since LoadMore says nothing about it.
- Set `hasMore={false}` after the last page. The button gives way to "You've reached the end" (`endText`, or `null` for nothing). If the button had focus, focus moves to that text, or with `null` to the "Showing 30 of 30" line (with no line either, to LoadMore itself, which is not a Tab stop), so it isn't lost.
- Put it right after the list, inside the same region, so new items appear just above it.

## Accessibility

- **Role and name:** a plain group with a native `<button>` named "Load more" (or `label`). A long `label` wraps onto more lines on a phone instead of being cut off. The summary and end text are plain text.
- **Announcements:** when `count` grows, the number added is said politely through the shared live region ("20 more loaded. Showing 40 of 134."). Without `count`, "More loaded" is said once a promise from `onLoadMore` settles. The button's own "Loading" isn't said, so a load is one message.
- **Focus:** focus stays on the button, which moves down below the new items, so the next Tab goes on from there. Once the load lands, the button is scrolled back into view (only as far as needed), so keyboard users see where they are rather than pressing again off screen. When the last page leaves no button, focus goes to the end text instead of falling back to the page.
- **Infinite scroll:** it loads when the button comes within 200px of the viewport, once per approach, and again only after `count` changes, so a load that adds nothing doesn't repeat. The button stays for keyboard and screen reader users, who don't scroll to load, and as the fallback where IntersectionObserver is missing.
- **Contrast:** the summary and end text read 4.5:1 on the page in all six themes (`LoadMore.test.tsx`).
- **What's still yours:** keep loaded items when people go back to the list, and tell people when a load fails (an [Alert](../Alert/README.md) with a retry).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the Load more button |
| Enter | Loads the next page. Focus stays on the button, or moves to the end text after the last page |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `onLoadMore` | `() => void \| PromiseLike` | | Required. Loads the next page; return a promise for loading and one press at a time. |
| `hasMore` | boolean | `true` | `false` once there's nothing more. |
| `loading` | boolean | `false` | Loading from your own fetch state. |
| `count` | number | | How many items are shown; when it grows, what was added is announced. |
| `total` | number | | How many in all, for "Showing 20 of 134". |
| `infinite` | boolean | `false` | Loads as it nears the viewport; the button stays. |
| `label` | `ReactNode` | `"Load more"` | The button's text. |
| `endText` | `ReactNode` | `"You've reached the end"` | Shown once `hasMore` is false; `null` shows nothing. |

The words are the labels `loadMore`, `showingOf`, `loadedMore`, `moreLoaded` and `allLoaded`; change them with `<SerupaProvider labels>`. `className`, `ref` and other props go to the `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one LoadMore. The list lives in `src/components/LoadMore/load-more.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from load-more.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--load-more-text` | `text-muted` | "Showing 20 of 134" and the end text (4.5:1 on the page). |
| `--load-more-gap` | `spacing-3` | Space between the summary and the button (12px). |
| `--load-more-padding` | `spacing-4` | Space above and below (16px). |
<!-- token-table:end -->
