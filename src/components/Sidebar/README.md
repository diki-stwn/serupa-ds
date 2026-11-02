# Sidebar

A vertical nav for an app's pages: an optional header (a logo, a workspace switcher), sections of items with icons, badges and nested groups, and a footer pinned to the bottom (settings, the signed-in user). `collapsed` narrows it to a 64px icon rail.

```jsx
const { Sidebar, SidebarSection, SidebarItem, Badge } = window.Serupa;

<div style={{ display: 'flex', height: '100vh' }}>
  <Sidebar header={<Logo />} footer={<UserButton />} collapsed={collapsed}>
    <SidebarSection>
      <SidebarItem href="/" icon="home" label="Home" active />
      <SidebarItem href="/inbox" icon="inbox" label="Inbox" badge={<Badge count={4} />} />
    </SidebarSection>
    <SidebarSection title="Workspace">
      <SidebarItem icon="folder" label="Projects">
        <SidebarItem href="/projects/web" label="Website" />
        <SidebarItem href="/projects/app" label="Mobile app" />
      </SidebarItem>
      <SidebarItem as={RouterLink} to="/reports" icon="bar_chart" label="Reports" />
    </SidebarSection>
  </Sidebar>
  <main style={{ flex: 1 }}>…</main>
</div>
```

## When to use

- An app with many pages, or pages in sections and groups.
- Navigation people use all the time, which should stay in view beside the content.
- When the screen has room for a column, or for a 64px icon rail with `collapsed`.

## When not to use

- A handful of top-level pages: use a [Navbar](../Navbar/README.md) instead.
- Small screens: Sidebar doesn't hide on its own, so put the nav in a [Drawer](../Drawer/README.md) or use a [Navbar](../Navbar/README.md), whose links fold into a menu button.
- Switching between views on one page: use [Tabs](../Tabs/README.md) instead.

## Anatomy

Drawn from the `Playground` story.

1. **Header** (`.dk-sidebar__header`): the product's name or a switcher, at the top.
2. **Section title** (`.dk-sidebar__section-title`): names a group of links.
3. **Link** (`.dk-sidebar__item`): a page to go to.
4. **Current link** (`.dk-sidebar__item--active`): the page you're on.
5. **Icon** (`.dk-sidebar__icon`): a picture of the page; it alone shows when the sidebar is collapsed, with the name as a tooltip.
6. **Badge** (`.dk-sidebar__badge`): an optional count, such as unread items.
7. **Nested links** (`.dk-sidebar__list--nested`): the pages under a link, shown when it's open.
8. **Footer** (`.dk-sidebar__footer`): the account or settings, at the bottom.

## Usage

It takes its parent's height and scrolls its items when they don't fit, so give the parent a height (a full-height flex row, as above).

- Give top-level items an `icon`, so they still show when the sidebar is collapsed, and use a string `label` so the tooltip can show it.
- Group related items under a `SidebarSection` with a short `title`; keep nesting to one level of SidebarItems.
- Mark the current page with `active`; a group holding it, at any depth, starts open.
- Put settings and the signed-in user in `footer`, so they stay at the bottom.
- Collapsed, the header and footer have the 64px rail too: pass a logo mark or an avatar then, such as `header={collapsed ? <LogoMark /> : <Logo />}`. Longer text there ends in an ellipsis rather than spilling over the page.
- Collapsing and expanding slide over 200ms without laying out the page on every frame. The column's width changes once: at the start when expanding, and at the end when collapsing. In between, only the sidebar's visible edge moves, so a heavy page beside it doesn't stutter. Toggling again mid-way turns back from where it is. With reduced motion it switches at once.

## Accessibility

- It's a `<nav>` landmark with lists of links; section titles name their lists.
- The current page has `aria-current="page"` and a shaded background. A group holding it is text-colored, so the trail stays visible when it's closed.
- A group is a button with `aria-expanded` and `aria-controls`.
- Collapsed, each label stays in the page for screen readers and shows as a tooltip on hover and focus, on a group's button too. Use a string `label` so the tooltip can show it.
- Collapsed, an item's badge is hidden on screen like its label but still read: the tooltip names the item ("Inbox") and the badge describes it ("4"), and an 8px dot on the icon's corner shows there is one. The dot keeps 3:1 in all six themes, and is CanvasText in forced-colors mode.
- In a collapsed rail, a group's menu keeps each item's link component (`as`, such as a router's Link, with its own props) and its link attributes, and marks the current page with `aria-current="page"` in medium weight.
- Items, the current page, hovered items and section titles keep 4.5:1 in all six themes (`Sidebar.test.tsx`).
- **Keyboard:** Tab moves through the items. Enter follows a link, and Enter or Space opens or closes a group. Collapsed, focus shows each label as a tooltip, and a group opens its items in a Menu, with the Menu's own keys.

## Props

### Sidebar

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<nav>`. |
| `children` | SidebarSections or SidebarItems | none | The items |
| `header` | node | none | Above the items |
| `footer` | node | none | Pinned to the bottom, under a line |
| `collapsed` | boolean | `false` | A 64px rail of icons. Labels, text or elements, become tooltips (and stay the items' names); groups open their items in a menu. Switching keeps focus in the item it was in: a nested link's focus goes to its group's button |
| `aria-label` | string | `"Main"` | The nav's name |

`className`, `style`, `ref` and everything else go to the `<nav>`, which has `data-component="sidebar"`.

### SidebarSection

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | node | none | A small heading that names the section's list. Hidden when collapsed |

### SidebarItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | node | required | The item's text |
| `icon` | an icon name or element | none | A 20px icon; top-level items need one to show when collapsed |
| `active` | boolean | `false` | The current page: shaded, with `aria-current="page"` |
| `badge` | node | none | At the end, such as a count Badge. Collapsed, a dot on the icon shows there is one, and screen readers still read the badge |
| `children` | SidebarItems | none | Makes it a group: a button that shows and hides them. They unfold and fold with the chevron, as an Accordion panel does (only a fade under reduced motion) |
| `defaultOpen` | boolean | open when a child is active | Whether a group starts open |
| `open` | boolean | none | Whether a group is open, controlled. Pair it with `onOpenChange` |
| `onOpenChange` | (open, { reason }) => void | none | Called when the group's button asks to open or close it, with `reason: 'trigger'` |
| `as` | a component | the `configure({ link })` link, else `'a'` | Your router's link component. Set it once for the app with `configure({ link })`; `as` wins for one item. Typed: the props are those of the element `as` names, so `as={RouterLink} to="/inbox"` checks `to`, and without `as` they're an `<a>`'s. A link set only with `configure({ link })` is typed as an `<a>`, so pass it `href`. The `ref` is an `HTMLElement`: the link, or a group's button. |

`href`, `className`, `ref` and everything else go to the link (an `<a>`, or what `as` names), or to a group's button.

## Component tokens

Each is an optional override: set it on the page, a container or one sidebar. The list lives in `src/components/Sidebar/sidebar.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from sidebar.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-bg` | `surface` | The sidebar's background. |
| `--sidebar-border` | `border` | The line on its inner edge. |
| `--sidebar-item-text` | `text-muted` | An item (4.5:1 on bg). |
| `--sidebar-item-text-hover` | `text` | An item on hover. |
| `--sidebar-item-text-active` | `text` | The current page's item. |
| `--sidebar-dot` | `primary` | Collapsed: the dot on an item's icon when it has a badge (3:1 on bg and on the current page's highlight). |
| `--sidebar-item-bg-hover` | `highlight` | An item's background on hover. |
| `--sidebar-item-bg-pressed` | `pressed` | An item's background while it's pressed, one step past hover. |
| `--sidebar-item-bg-active` | `highlight` | The current page's item background. |
| `--sidebar-section-title-color` | `text-muted` | A section's title (4.5:1 on bg). |
| `--sidebar-focus-ring` | `focus-ring` | The keyboard focus ring. |

**Type**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-item-size` | `text-sm` | Item text (14px). |
| `--sidebar-item-weight` | `font-medium` | Item weight (500). |
| `--sidebar-section-title-size` | `text-xs` | Section titles (12px). |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-width` | `container-3xs` | The sidebar's width (256px). |
| `--sidebar-width-collapsed` | `spacing-16` | Its width when collapsed to icons (64px). |
| `--sidebar-icon-size` | `spacing-5` | An item's icon (20px). |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-padding` | `spacing-3` | Space inside the sidebar (12px). |
| `--sidebar-item-padding-x` | `spacing-3` | An item's side padding (12px). |
| `--sidebar-item-padding-y` | `spacing-2` | An item's top and bottom padding (8px). |
| `--sidebar-item-gap` | `spacing-3` | Space between an item's icon and label (12px). |
| `--sidebar-section-gap` | `spacing-6` | Space between sections (24px). |
| `--sidebar-nested-indent` | `spacing-11` | Where nested items' labels start, lined up with their parent's label (44px). |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-border-width` | `border-width-1` | The edge line (1px). |

**Radius**

| Token | Default | Use |
| --- | --- | --- |
| `--sidebar-item-radius` | `rounded-md` | An item's corners (6px). |
<!-- token-table:end -->
