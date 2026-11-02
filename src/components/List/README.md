# List

Rows of related things: people, files, notifications, settings. Each row has a title, an optional muted description, something before it (an Avatar or an icon) and something after it (a date, a Badge, an action). A row can be a link or a button; trailing actions stay outside it, so controls are never nested. A press anywhere on the row works, trailing meta ("3 days ago") included, except on a trailing action, which keeps its own press.

```jsx
const { List, ListItem, Avatar, Badge, IconButton } = window.Serupa;

<List variant="card" aria-label="Members">
  {people.map((p) => (
    <ListItem key={p.id} href={`/people/${p.id}`}
      leading={<Avatar name={p.name} src={p.photo} alt="" size="sm" />}
      title={p.name} description={p.email}
      trailing={<IconButton icon="more_horiz" label={`More for ${p.name}`} />} />
  ))}
</List>

<List>
  <ListItem leading="description" title="Report.pdf" description="2 MB" trailing="Yesterday" />
  <ListItem leading="settings" title="Open settings" onClick={openSettings} />
</List>
```

## When to use

- A set of similar things people scan and pick from: people, files, notifications, settings.
- Rows that each open something or do one thing, with an action of their own at the end.
- A list beside a detail view, where the selected row shows what's open.

## When not to use

- Data with several columns to compare or sort: use [Table](../Table/README.md) instead.
- Items with pictures or a lot of content each: use [Card](../Card/README.md)s in a [Grid](../Grid/README.md).
- Actions behind a button: use [Menu](../Menu/README.md) instead.
- An app's main navigation: use [Sidebar](../Sidebar/README.md) instead.

## Anatomy

Drawn from the `Settings` story.

1. **Item** (`.dk-list__item`): one row.
2. **Leading** (`.dk-list__leading`): an optional icon, avatar or image before the text.
3. **Title** (`.dk-list__title`): the row's main line.
4. **Description** (`.dk-list__description`): a second line with more detail.
5. **Trailing** (`.dk-list__trailing`): an optional value, badge, switch or action at the end.

## Usage

- Put actions in `trailing`, never inside the row's link or button, and name them for their row ("More for Ada Lovelace").
- Use `as="ol"` when the order matters.
- Use `variant="card"` for a list that stands on its own; inside a Card or a panel that already has a frame, keep it `plain`.
- With a router, pass its link component as `as` and its props (such as `to`) in `linkProps`.

## Accessibility

- It's a real list, so screen readers say how many rows there are, Safari's VoiceOver included (`role="list"` keeps the role it would drop from a list without bullets). Name it with `aria-label` when there's no heading over it.
- A whole row is one link or button, named by its title and description; trailing actions are separate controls, so give them names that say which row they're for ("More for Ada Lovelace").
- An Avatar beside a written name repeats it, so give it `alt=""`, as in the example above. Otherwise every row reads the name twice ("Ada Lovelace Ada Lovelace ada@example.com"). An icon beside a title that says the same is decorative too.
- Selected rows have a bar and `aria-current` or `aria-pressed`, not only a background.
- Titles and descriptions keep 4.5:1 on plain and shaded rows, and the selected bar 3:1, in all six themes (`List.test.tsx`).
- **Keyboard:** an item with `href` or `onClick` has one Tab stop, its main area, where Enter (Space too for a button) acts. A disabled one is skipped. Controls in `trailing` are Tab stops of their own. Plain items add none.

## Props

### List

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<ul>` or `<ol>`. |
| `variant` | `'plain'` \| `'card'` | `'plain'` | Bare rows, or rows in a bordered, rounded frame |
| `divided` | boolean | `true` | Lines between rows |
| `as` | `'ul'` \| `'ol'` | `'ul'` | `ol` when the order matters |

`className`, `style`, `ref`, `aria-label` and everything else go to the list, which has `data-component="list"`.

### ListItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | node | required | The main line |
| `description` | node | none | A second, muted line |
| `leading` | an icon name or node | none | Before the text: a 20px muted icon, an Avatar, an image |
| `trailing` | node | none | After the text, outside any link or button |
| `href` | string | none | Makes the main area a link |
| `onClick` | function | none | Makes the main area a button (without `href`) |
| `as` | a component | the `configure({ link })` link, else `'a'` | Your router's link component; its props (such as `to`) go in `linkProps`. Set it once for the app with `configure({ link })`; `as` wins for one link. |
| `linkProps` | object | none | Extra props for the link or button |
| `selected` | boolean | `false` | Shaded with a primary bar; `aria-current="true"` on a link (an `aria-current` in `linkProps`, such as `"page"` for the current page of a nav list, wins), `aria-pressed` on a button |
| `disabled` | boolean | `false` | Dims a link or button row and stops it |

`className`, `ref` and everything else go to the `<li>`.

## Component tokens

Each is an optional override: set it on the page, a container or one list. The list lives in `src/components/List/list.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from list.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--list-border` | `border` | Lines between items, and the frame of variant="card". |
| `--list-bg` | `surface` | The background of variant="card". |
| `--list-title-color` | `text` | An item's title. |
| `--list-description-color` | `text-muted` | An item's description (4.5:1 on bg and bg-hover). |
| `--list-bg-hover` | `surface-muted` | A link or button item on hover, and a selected item. |
| `--list-bg-pressed` | `pressed` | A link or button item while it's pressed (not while its trailing action is), one step past hover. |
| `--list-indicator-selected` | `primary` | The bar at the start of a selected item. |
| `--list-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--list-title-size` | `text-sm` | Titles (14px). |
| `--list-title-weight` | `font-medium` | Title weight (500). |
| `--list-description-size` | `text-sm` | Descriptions (14px). |
| `--list-padding-x` | `spacing-3` | An item's side padding (12px; variant="card": padding-x-card). |
| `--list-padding-x-card` | `spacing-4` | An item's side padding in variant="card" (16px). |
| `--list-padding-y` | `spacing-3` | An item's top and bottom padding (12px). |
| `--list-gap` | `spacing-3` | Space between the leading element, the text and the trailing element (12px). |
| `--list-border-width` | `border-width-1` | Lines and frame (1px). |
| `--list-indicator-width` | `border-width-2` | The selected item's bar (2px). |
| `--list-radius` | `rounded-lg` | The corners of variant="card" (8px). |
<!-- token-table:end -->
