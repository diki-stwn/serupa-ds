# Breadcrumb

Shows where the current page sits: links to the pages above it, from the top level down, with chevrons between them. The last item is the current page. On a deep trail, `maxItems` collapses the middle into a "…" button that shows it again.

```jsx
const { Breadcrumb, BreadcrumbItem } = window.Serupa;

<Breadcrumb>
  <BreadcrumbItem href="/" icon="home">Home</BreadcrumbItem>
  <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
  <BreadcrumbItem>Website redesign</BreadcrumbItem>
</Breadcrumb>

<Breadcrumb maxItems={3} separator="slash">…</Breadcrumb>

// With a router
<BreadcrumbItem as={RouterLink} to="/projects">Projects</BreadcrumbItem>
```

## When to use

- Pages two or more levels down a hierarchy, where people need to see where they are and go up a level.
- People who land deep in the product from a search or a shared link, and need a way to the pages above.

## When not to use

- The main way around the product: use a [Navbar](../Navbar/README.md) or a [Sidebar](../Sidebar/README.md) instead.
- Steps in a task done in order: use [Stepper](../Stepper/README.md) instead.
- A page at the top level, or a flat site: leave it out; the page's [Heading](../Heading/README.md) already says where people are.

## Anatomy

Drawn from the `Collapsed` story.

1. **List** (`.dk-breadcrumb__list`): the pages from the top level down to this one.
2. **Link** (`.dk-breadcrumb__link`): a page above this one.
3. **Separator** (`.dk-breadcrumb__separator`): the mark between pages; screen readers skip it.
4. **More** (`.dk-breadcrumb__more`): opens the pages hidden when the trail is too long.
5. **Current page** (`.dk-breadcrumb__item--current`): this page, last, not a link.

## Usage

- Go from the top level down to the current page, and make the current page the last item.
- Label each item with the title people see on that page, so the trail matches where it leads.
- On deep trails, set `maxItems` so it fits on one line; the first item and the last ones stay visible.
- Where the trail must stay on one line once "…" is pressed, such as a phone header, add `collapse="menu"`: "…" opens a [Menu](../Menu/README.md) of the hidden pages instead of putting them back in the trail.
- With a router, register its link component once with `configure({ link })`, or pass it as `as` so client-side navigation keeps working.

## Accessibility

- Each link, and the "…" button, takes a press over at least 24×24px (WCAG 2.5.8) without moving the trail. On a touch screen it's 44px high, as Apple and Material ask (the width stays, so links never overlap).
- A long unbroken label, such as a file name or a URL slug, wraps inside the trail rather than running past a 320px screen (WCAG 1.4.10).
- An item with only an `icon` needs an `aria-label`. Without one it's a link a screen reader can only call "link", and it warns once in the console.
- A Breadcrumb with no items renders nothing, so it doesn't leave an empty nav landmark.
- It's a `<nav>` landmark named "Breadcrumb" holding an ordered list, so screen readers say how many levels there are. Give it another name if the page has two.
- The current page has `aria-current="page"`. Separators sit inside the item after them and are hidden from screen readers, so the list has one item per page.
- With `collapse="menu"`, "…" is a menu button named "More pages" (`aria-haspopup="menu"`, `aria-expanded`), and the hidden pages are links in the menu. It follows Menu's keys: Enter, Space or ↓ opens it on the first page, ↑ ↓ move, Enter follows a link, and Escape closes it and returns to "…".
- Links, the current page and separators keep 4.5:1 on `surface` in all six themes (`Breadcrumb.test.tsx`).
- Links are underlined on hover only: their place in the trail and the chevrons already say they're links.
- **Keyboard:** Tab moves through the links, and Enter follows one. The current page is text, not a Tab stop. With `maxItems`, the "…" button is a Tab stop too, and Enter or Space shows the hidden pages (or opens their menu with `collapse="menu"`).

## Props

### Breadcrumb

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<nav>`. |
| `children` | BreadcrumbItems | none | From the top level to the current page |
| `separator` | `'chevron'` \| `'slash'` | `'chevron'` | What goes between items. The chevron points left in right-to-left text, following the nearest `dir`, so a `dir="ltr"` block on a right-to-left page points right |
| `maxItems` | number (2 or more) | no limit | Shows the first item, "…", then the last `maxItems - 1`. Pressing "…" shows them all and moves focus to the first one it showed |
| `collapse` | `'inline'` \| `'menu'` | `'inline'` | What "…" does: shows the hidden items in the trail, or opens a Menu of them |
| `aria-label` | string | `"Breadcrumb"` | The nav's name |
| `expandLabel` | string | `"Show all pages"` (`"More pages"` with `collapse="menu"`) | The "…" button's name, and the menu's |

`className`, `style`, `ref` and everything else go to the `<nav>`, which has `data-component="breadcrumb"`.

### BreadcrumbItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `href` | string | none | Where it goes |
| `icon` | an icon name or element | none | A 16px icon before the label |
| `as` | a component | the `configure({ link })` link, else `'a'` | Your router's link component. Set it once for the app with `configure({ link })`; `as` wins for one link. Typed: the props and `ref` are those of the element `as` names, so `as={RouterLink} to="/x"` checks `to`, and without `as` they're an `<a>`'s. A link set only with `configure({ link })` is typed as an `<a>`, so pass it `href`. |

The last item is the current page (Breadcrumb sets its `current` prop; you don't pass it): text with `aria-current="page"`, not a link, even if it has an `href`. `className`, `ref` and everything else go to the link.

## Component tokens

Each is an optional override: set it on the page, a container or one breadcrumb. The list lives in `src/components/Breadcrumb/breadcrumb.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from breadcrumb.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--breadcrumb-text` | `text-muted` | A link to a parent page (4.5:1 on surface). |
| `--breadcrumb-text-hover` | `text` | A link on hover. |
| `--breadcrumb-text-current` | `text` | The current page. |
| `--breadcrumb-separator` | `text-muted` | The chevron or slash between items. |
| `--breadcrumb-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--breadcrumb-font-size` | `text-sm` | The text (14px). |
| `--breadcrumb-weight-current` | `font-medium` | The current page's weight (500). |
| `--breadcrumb-gap` | `spacing-1.5` | Space between an item and a separator (6px). |
| `--breadcrumb-separator-size` | `spacing-4` | The chevron's size (16px). |
| `--breadcrumb-icon-size` | `spacing-4` | An item's icon (16px). |
| `--breadcrumb-focus-radius` | `rounded-sm` | The focus ring's corners (4px). |
<!-- token-table:end -->
