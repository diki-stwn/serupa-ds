# Card

A surface that groups related content and its actions: a summary, a settings panel, an item in a grid. It's built from parts (`CardHeader`, `CardBody`, `CardFooter`) that you can mix with any content, and with `href` the whole card is clickable through one link on its title.

```jsx
const { Card, CardHeader, CardBody, CardFooter, Button, Badge } = window.Serupa;

<Card>
  <CardHeader title="Team plan" description="Up to 10 members" action={<Badge tone="success">Active</Badge>} />
  <CardBody>Renews on 1 March. You're using 6 of 10 seats.</CardBody>
  <CardFooter>
    <Button variant="secondary">Manage seats</Button>
    <Button>Upgrade</Button>
  </CardFooter>
</Card>

// a whole card as a link: the title is the link, and its area covers the card; buttons inside still work
<Card as="li" href="/projects/atlas">
  <CardHeader title="Atlas" description="Updated 2 hours ago" />
  <CardFooter><Button variant="secondary" size="sm" onClick={star}>Star</Button></CardFooter>
</Card>

// full-bleed media: no padding on the card, pad the parts yourself
<Card padding="none" className="overflow-hidden">
  <img src="cover.jpg" alt="" />
  <div className="p-5"><CardHeader title="Release notes" /></div>
</Card>
```

## When to use

- A summary of one thing with its own actions: a plan, a project, a report.
- A set of similar items in a grid, each opening its own page.
- A panel that sets one group of settings or content apart from the rest of the page.

## When not to use

- Rows of similar items people scan down: use [List](../List/README.md) instead, or [Table](../Table/README.md) when there are columns to compare.
- Only separating two parts of a page: use space from [Stack](../Stack/README.md), or a [Divider](../Divider/README.md).
- Content that sits over the page, such as a confirmation or a short form: use [Dialog](../Dialog/README.md) or [Popover](../Popover/README.md) instead.

## Anatomy

Drawn from the `FooterLayouts` story.

1. **Header** (`.dk-card__header`): the title and description, with an optional action beside them.
2. **Title** (`.dk-card__title`): what the card is about.
3. **Description** (`.dk-card__description`): a line or two more about it.
4. **Body** (`.dk-card__body`): the card's content.
5. **Footer** (`.dk-card__footer`): actions or details at the end.

## Usage

- Use `outline` for most cards, `elevated` for content over the page, and `filled` for a panel inside another surface.
- Give a linked card a `CardHeader` with a `title`: the title is the link and names it ("Atlas"), so screen reader users don't hear the whole card read out as one link.
- Buttons and other links can go inside a linked card. They sit above the card's link, so they work on their own and pressing them doesn't follow it.
- Use `as="li"` for linked cards in a list.
- For full-bleed media, set `padding="none"` and pad the parts yourself.

## States

| State | Look |
| --- | --- |
| Rest | `surface` with a `border` border and `shadow-xs` (outline); `surface-raised` with `shadow-md` and a `border-raised` edge (elevated: the edge only shows in dark); `surface-muted` (filled) |
| Hover (a linked card) | A `border-strong` border |
| Focus (a linked card) | From the keyboard: a 2px `focus-ring` outline, 2px outside the card |

The hover border fades in 150ms (`duration-150`, `ease-in-out`), at once with `prefers-reduced-motion`.

## Accessibility

- A card is a plain container: give it `as="section"` with a title when it's a landmark-worthy region, or `as="article"` for a self-contained item.
- The title is a real heading, so screen reader users can jump between cards. Set `headingLevel` to fit the page.
- A linked card has one link, around its `CardHeader` title (the "stretched link" pattern): it's named by the title, it's the card's first tab stop, and its clickable area covers the card. The card shows its focus ring. Without a direct `CardHeader` title, the link is empty, laid over the card and named by the card's text (or the card's `aria-label`).
- The body text and the header's description sit above the link's area, so they can be selected and copied with the mouse. A plain click on them still follows the link. A click that ends a text selection doesn't. A Ctrl, Cmd or Shift click, or a middle click, on them opens the link in a new tab, as it would on the title.
- The card itself stays a `<div>` (or `as`), so buttons and links inside are never nested in a link, which is invalid HTML.
- In forced-colors mode every card gets a visible border.
- The title, description and body text keep 4.5:1 on every variant, in all six themes (`Card.test.tsx`).
- In print, a card isn't split across two pages.
- **Keyboard:** with `href`, the card is one Tab stop (its link), and Enter opens it. Buttons and links inside are Tab stops of their own. Without `href`, the card adds no Tab stop.

## Props

### Card

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root element (`as`). |
| `variant` | `'outline'` \| `'elevated'` \| `'filled'` | `'outline'` | A border and a hairline shadow; a raised shadow (for content over the page); or `surface-muted` and flat (a panel inside another surface) |
| `padding` | `'none'` \| `'sm'` \| `'md'` \| `'lg'` | `'md'` | 0, 12px, 20px or 24px inside, and the parts sit 16px apart |
| `as` | `'div'` \| `'section'` \| `'article'` \| `'li'` | `'div'` | The element. Use `article` for a self-contained item, `li` inside a list |
| `href` | string | | Makes the whole card clickable through one link around the `CardHeader` title (the link component set with `configure({ link })`, `<a>` by default) |
| `target`, `rel` | string | | Go to the link. `target="_blank"` adds `rel="noopener noreferrer"` |

`className`, `style`, `ref` and everything else go to the card element (`aria-label` goes to the link of a linked card), which has `data-component="card"` and `data-variant`.

### CardHeader

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | node | | The title, as a heading in `text-base`, `font-semibold` |
| `description` | node | | A muted line under the title |
| `action` | node | | Something at the end of the header, such as a Badge or a menu button. In a narrow card it drops under the title rather than squeezing it |
| `headingLevel` | `2`–`6` | `3` | The title's heading level; pick the one that fits the page's outline |

Children come after the description.

### CardBody and CardFooter

`CardBody` holds the main content. `CardFooter` lays its children out in a wrapping row: `justify` is `'end'` (default), `'start'` or `'between'`. When the footer is narrower than 20rem (a card on a phone, or in a narrow column), each child takes the full row, one under the other, so each action gets a full-width tap target.

## Component tokens

Each is an optional override: set it on the page, a container or one card. The list lives in `src/components/Card/card.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from card.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--card-bg` | `surface` | The background of an outline card |
| `--card-bg-filled` | `surface-muted` | The background of a filled card |
| `--card-bg-elevated` | `surface-raised` | The background of an elevated card (one step up from the page in dark). |
| `--card-border-elevated` | `border-raised` | An elevated card's edge: invisible in light, a 1px lighter edge in dark |
| `--card-border` | `border` | The border of an outline card |
| `--card-title-color` | `text` | The title |
| `--card-description-color` | `text-muted` | The description |
| `--card-text` | `text` | Text in the body and footer |
| `--card-border-hover` | `border-strong` | A linked card's border on hover |
| `--card-focus-ring` | `focus-ring` | A linked card's keyboard focus ring |

**Shadow**

| Token | Default | Use |
| --- | --- | --- |
| `--card-shadow` | `shadow-xs` | An outline card's shadow |
| `--card-shadow-elevated` | `shadow-md` | An elevated card's shadow |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--card-radius` | `rounded-xl` | The corners |
| `--card-border-width` | `border-width-1` | The border |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--card-padding-sm` | `spacing-3` | Padding, `sm` |
| `--card-padding-md` | `spacing-5` | Padding, `md` |
| `--card-padding-lg` | `spacing-6` | Padding, `lg` |
| `--card-gap` | `spacing-4` | The space between the parts |
| `--card-header-gap` | `spacing-1` | The space between the title and the description |

**Type**

| Token | Default | Use |
| --- | --- | --- |
| `--card-title-weight` | `font-semibold` | The title's weight |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--card-press-scale` | `scale-97` | Size of a card with `href` while it's held down (97%). 1 turns it off |
<!-- token-table:end -->

## Related

- [Grid](../Grid/README.md): lays out a set of cards in columns that fit the screen.

## Migrating from 8.x

In 9.0.0 a linked card (`href`) is no longer one `<a>`:

- The card element is a `<div>` (or `as`, which `href` no longer ignores). `ref` points at it, not at a link. To reach the link, use `ref.current.querySelector('.dk-card__link')`.
- `href`, `target`, `rel` and `aria-label` go to the link, which wraps the `CardHeader` title. Other props, including `onClick`, stay on the card; a click on the link still bubbles to it.
- CSS that styled `a.dk-card` or `.dk-card--link:focus-visible` should target `.dk-card--link` and `.dk-card--link:has(.dk-card__link:focus-visible)`.
- A linked card without a `CardHeader` title still works (an empty link named by the card's text), but adding a title gives the link a short name.
