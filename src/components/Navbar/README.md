# Navbar

The bar across the top of an app: the brand on the left, the main page links, and actions on the right (search, a user menu, sign in). Below 768px wide the links fold into a menu button that opens them in a panel under the bar.

```jsx
const { Navbar, NavbarLink, Button, Avatar } = window.Serupa;

<Navbar
  sticky
  brand={<a href="/">Acme</a>}
  actions={<><Button variant="ghost" size="sm">Docs</Button><Avatar name="Ada Lovelace" size="sm" /></>}
>
  <NavbarLink href="/" active>Dashboard</NavbarLink>
  <NavbarLink href="/projects">Projects</NavbarLink>
  <NavbarLink as={RouterLink} to="/team">Team</NavbarLink>
</Navbar>
```

## When to use

- The top level of an app or site with a handful of main pages.
- A place for the brand and app-wide actions, such as search, a user menu or sign in.

## When not to use

- Many pages, or pages in groups and levels: use a [Sidebar](../Sidebar/README.md) instead.
- Switching between views of the same thing on one page: use [Tabs](../Tabs/README.md) instead.
- Showing where a page sits in a hierarchy: use a [Breadcrumb](../Breadcrumb/README.md) instead.

## Usage

- Keep the links to the main pages, a few short words each; below 768px they fold into the menu button. More links than fit below the bar scroll inside the panel.
- Mark the current page with `active` on its NavbarLink.
- Register your router's link component once with `configure({ link })`, or pass it in `as`, so links don't reload the page.
- Set `size` to the same width as the page's Container, so the bar lines up with the content.

## Accessibility

- It's a `<header>` (the banner landmark, when it's the page's top-level header) holding a `<nav>` named "Main", so people can jump to the links.
- The current page has `aria-current="page"` and a shaded background, not just a color change; in forced colors (Windows High Contrast), where the shading is dropped, an outline.
- On small screens the menu button has `aria-expanded` and `aria-controls`. Escape closes the menu and returns focus to the button.
- With the menu open, Tab goes from the button into the links, in the order they appear, since the panel opens under the bar: the links come after the button in the DOM while it's open. Tab past the last link, any move of focus out of the bar, or a press outside it closes the menu.
- Links keep 4.5:1 on the bar, and the current page and hovered links on their shading, in all six themes (`Navbar.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the brand, links and actions; on small screens, the menu button, then the menu's links once it's open |
| Enter / Space | On the menu button, opens or closes the menu |
| Escape | Closes the menu and returns focus to the menu button |

## Props

### Navbar

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<header>`. |
| `brand` | node | none | The logo or product name, usually a link home |
| `children` | NavbarLinks | none | The main pages |
| `actions` | node | none | Controls on the right; they stay in the bar on small screens |
| `sticky` | boolean | `false` | Stays at the top while the page scrolls (z-40). What Tab focuses, or a #link jumps to, scrolls into view below the bar instead of under it (WCAG 2.4.11): the page's `scroll-padding-top` follows the bar's height. |
| `size` | `'md'` \| `'lg'` \| `'xl'` \| `'2xl'` \| `'full'` | `'xl'` | The content's maximum width, the same as Container, so it lines up with the page |
| `aria-label` | string | `"Main"` | The links' nav name |
| `menuLabel` | string | `"Menu"` | The small-screen menu button's name |

`className`, `style`, `ref` and everything else go to the `<header>`, which has `data-component="navbar"` and `data-state="open"` or `"closed"` (the small-screen menu).

### NavbarLink

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `href` | string | none | Where it goes |
| `active` | boolean | `false` | The current page: shaded, with `aria-current="page"` |
| `as` | a component | the `configure({ link })` link, else `'a'` | Your router's link component. Set it once for the app with `configure({ link })`; `as` wins for one link. |

Following a link closes the small-screen menu. `className`, `ref` and everything else go to the link.

## Component tokens

Each is an optional override: set it on the page, a container or one navbar. The list lives in `src/components/Navbar/navbar.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--navbar-bg` | `surface` | The bar's background. |
| `--navbar-border` | `border` | The line under the bar. |
| `--navbar-brand-text` | `text` | The brand (logo and name) at the start of the bar. |
| `--navbar-link-text` | `text-muted` | A link (4.5:1 on bg and link-bg-hover). |
| `--navbar-link-text-hover` | `text` | A link on hover. |
| `--navbar-link-text-active` | `text` | The current page's link. |
| `--navbar-link-bg-hover` | `secondary` | A link's background on hover. |
| `--navbar-link-bg-pressed` | `pressed` | A link's fill while it's held down. |
| `--navbar-link-bg-active` | `secondary` | The current page's link background. |
| `--navbar-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--navbar-link-size` | `text-sm` | Link text (14px). |
| `--navbar-link-weight` | `font-medium` | Link weight (500). |
| `--navbar-height` | `spacing-16` | The bar's height (64px). |
| `--navbar-gap` | `spacing-6` | Space between the brand, the links and the actions (24px). |
| `--navbar-link-gap` | `spacing-1` | Space between links (4px). |
| `--navbar-link-padding-x` | `spacing-3` | A link's side padding (12px). |
| `--navbar-link-padding-y` | `spacing-2` | A link's top and bottom padding (8px). |
| `--navbar-border-width` | `border-width-1` | The line under the bar (1px). |
| `--navbar-link-radius` | `rounded-md` | A link's corners (6px). |
| `--navbar-z-index` | `z-40` | Above the page when sticky. |
