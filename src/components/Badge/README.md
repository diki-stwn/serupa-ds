# Badge

A short label for status, counts and categories, optionally clickable. One size (20px tall, `text-xs`, 12px icons) in three styles (**subtle**, **solid**, **outline**), six tones built on the status colors and 17 palette tones for categories and tags. Every tone and style keeps 4.5:1 text in all six themes. Extras: a status dot, a leading icon, a count and a remove button. States: hover, focus and active on clickable badges, and loading on any badge.

```jsx
const { Badge } = window.Serupa;

<Badge>Draft</Badge>                                    // subtle, neutral
<Badge tone="success" dot>Online</Badge>
<Badge variant="solid" tone="danger" dot ping>Live</Badge>          // live states only
<Badge tone="warning" leftIcon="schedule">Pending</Badge>
<Badge variant="solid" tone="primary">New</Badge>
<Badge variant="outline" tone="info">Beta</Badge>
<Badge tone="violet" onRemove={() => removeTag("Design")}>Design</Badge>

// "something new", no number: a lone indicator dot on the corner of the control
<button aria-label="Notifications, new" className="relative">
  <Icon name="notifications" />
  <Badge dot tone="danger" className="absolute top-0 right-0" />
</button>

// clickable: a button or a link, with hover, focus and active states
<Badge tone="success" dot onClick={openFilter}>Open</Badge>
<Badge tone="info" href="/docs">Docs</Badge>
<Badge variant="solid" tone="primary" loading={saving} onClick={retry}>Retry</Badge>

// a count on an icon button: name the button, hide the number
<button aria-label="Notifications, 5 unread">
  <Icon name="notifications" />
  <Badge variant="solid" tone="danger" count={5} aria-hidden="true" />
</button>
```

## When to use

- The status of an item in a table, a list or a card: "Draft", "Paid", "Failed".
- Tags and categories on an item, including filter chips people can remove.
- A count or a "something new" dot on an icon or a nav item, such as unread messages.

## When not to use

- An action: use [Button](../Button/README.md) instead. A badge is a label first. Make it clickable when the badge itself is the natural target (a status that opens its filter, a tag that links to its page).
- A message that needs a sentence, or that people must act on: use [Alert](../Alert/README.md) instead.
- Picking one option from a few: use [SegmentedControl](../SegmentedControl/README.md) instead.

## Anatomy

Drawn from the `Extras` story.

1. **Dot** (`.dk-badge__dot`): an optional mark of the tone before the label.
2. **Label** (`.dk-badge__label`): the word or number the badge says.
3. **Remove** (`.dk-badge__remove`): takes the badge away, when it can be removed (a filter, a tag).

## Usage

- Keep labels to one or two words; a badge is not a sentence. A badge is at most as wide as its container, and a longer label ends in an ellipsis; then the full label shows as the badge's `title` on hover (as on Button), unless you pass your own `title` or `aria-label`. Keyboard and touch users can't see a title, so keep labels short enough to fit.
- Use status tones for status and palette tones for categories. Don't make a category red or green: it reads as a status.
- Use `subtle` by default and `solid` sparingly: one strong badge per row or card.

### Styles

| Style | Light themes | Dark themes | Use for |
| --- | --- | --- | --- |
| `subtle` (default) | 100 fill, 700 text, 1px outline in the text color at 20% | 950 fill, 300 text, outline at 20% | Most badges: statuses in tables, tags, categories |
| `solid` | 600 or 700 fill, white text | 400 fill, 950 text | Strong emphasis: "New", counts, one urgent status |
| `outline` | 700 text and 1px border | 300 text, 400 border | Quiet labels on busy or tinted surfaces (transparent fill) |

### Tones

- **`neutral`** (default): `secondary` fill and `text` (subtle, outlined in the text color at 20% like every subtle badge), `surface-inverse` and `text-inverse` (solid), `border-strong` and `text` (outline).
- **`primary`**: the theme's brand color, through the alias colors (`primary-subtle`, `primary`, `on-primary`), so it follows Blue, Violet and Emerald.
- **Statuses**: `success` (green), `warning` (amber), `danger` (red), `info` (sky).
- **Palette**: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, for categories and tags.

Status and palette tones use the fixed palette steps in the Styles table. Solid uses 600 where white text keeps 4.5:1 on it (red, blue, indigo, violet, purple, fuchsia, pink, rose) and 700 for the lighter families. The steps follow the nearest theme: a badge in a dark area nested in a light page takes the dark steps.

### Extras

- **Dot**: `dot` adds a 6px dot before the label, centered in a box as tall as an icon and 2px narrower (10×12px), so a dot badge spaces like an icon badge with a little less room for the lighter dot. Use it for live states ("Online", "Away").
- **Indicator**: `dot` with no label, icon or count renders a lone dot that says "something new" without a number, for the corner of an icon or avatar. It's a solid circle in the tone's fill (any `variant` is ignored), 8px, with a 2px ring in the surface color so it stays apart from what it overlaps. You place it (for example `className="absolute top-0 right-0"` inside a `relative` parent). It can't be clicked or removed (too small to target): `onClick`, `href` and `onRemove` are dropped with a warning. Switch to `count` once you know how many.
- **Ping**: `ping` with `dot` adds the system's ping animation (the same `ping` keyframes and `--animate-ping` token as the `animate-ping` utility): a copy of the dot grows to twice its size and fades, every second, while the dot stays put. It works on a dot in a label and on the indicator. Use it for live states ("Live", "Recording", "In a call"), not for unread or ordinary statuses: several pinging dots on one screen compete for attention. Off under reduced motion and in forced-colors mode. Constant motion lasting more than 5 seconds should be stoppable (WCAG 2.2.2), so turn `ping` off when the state ends or after a while.
- **Icon**: `leftIcon` adds a 12px icon before the label. It replaces the dot.
- **Count**: `count` makes a round pill, as wide as it is tall for one digit, with tabular digits. Past `max` (99) it shows "99+", while screen readers hear the real count and a tooltip (`title`) shows it, unless you pass your own `title`; at 0 it renders nothing unless `showZero`. The number is written in the digits of the locale from `SerupaProvider` (or the browser), as Calendar writes its days: ٩٩+ in Egyptian Arabic. A count badge has no label, dot, icon or remove button.
- **Optical balance**: like Button, an icon reads lighter than text, so a badge with an icon on one side only gets 2px more padding on the text side (`--badge-icon-offset`): a leading icon or dot pads the end (6 + 2px), a × pads the start. With an icon on both sides, or none, the padding is even. Logical sides, so right-to-left mirrors it.
- **Remove**: `onRemove` adds a × button at the end, for filter chips and tags. It's a real `<button type="button">` named "Remove" + the label, with a 2px focus ring. The × mirrors a leading icon: an icon-sized box (12px), `--badge-gap` from the label, and the same end padding as the start, so a badge with an icon, a label and a × is balanced. Because the × glyph sits further inside its box than most icons, the box is pulled in 2px on each side to even out what you see. The button still has a full 24×24 target (the WCAG 2.2 minimum, as on a small Button), reaching 2px past the badge's top and bottom, and its focus ring goes round all of it.

## States

Only a clickable badge (`onClick` or `href`) has hover, focus and active states, so a plain status badge never looks clickable.

| State | Look |
| --- | --- |
| Hover | A layer over the fill at 10%: the text color on subtle and outline (and the text moves 30% toward black in light themes, white in dark), black (light) or white (dark) on solid. The layer always moves away from the text, so every tone and style keeps 4.5:1 |
| Active (pressed) | The same layer at 15% |
| Focus | Keyboard focus only: a 2px `focus-ring` outline 2px out, like Button. The gap is transparent, and forced-colors mode draws it too |
| Loading | Any badge: a 12px ring in the text color, centered over the hidden content; the badge keeps its width and colors |
| Disabled | A disabled clickable badge: 50% opacity, `not-allowed` cursor, no layer |

## Behavior

### Micro-interactions

The same as Button's, each with a component token to tune it or turn it off. Only scale, opacity and the loading blur move, so nothing around the badge reflows.

- **Press** (clickable badges): shrinks to 97% while held by pointer, Space or Enter, in 100ms, and comes back over 300ms with `ease-enter`, settling at full size with no overshoot. Off: `--badge-press-scale: 100%`.
- **Loading** (any badge): the content fades out while the ring fades and grows in, in 150ms; both blur a little (`blur-xs`) as they cross, so it reads as one change.
- Under reduced motion, the press is off and loading only fades (no blur). Your `onPointerDown`, `onKeyDown`, `onKeyUp` and `onBlur` still run first.

## Accessibility

- Every tone and style keeps 4.5:1 text, and outline borders 3:1, in all six themes; `Badge.test.tsx` checks all 69 combinations in each theme.
- Don't rely on color alone: say the status in the label ("Failed", not just a red badge). The dot and icons are decorative and hidden from screen readers.
- An indicator dot is hidden from screen readers. Say what it means on the control it sits on ("Notifications, new"), or give the dot an `aria-label` (it then becomes `role="img"`).
- A number alone means little to a screen reader. Name the control the count sits on ("Notifications, 5 unread") and hide the badge with `aria-hidden`, or give the badge an `aria-label`.
- A clickable badge is a real `<button>` or link, so Tab, Enter and Space work and screen readers announce it as one. Its label is its name; make it say what happens ("Filter: Open"), not just the status.
- While loading, the label stays in the accessibility tree (the badge keeps its name), `aria-busy` is set and `loadingText` is announced once.
- The remove button is reachable with Tab and pressed with Enter or Space. When `onRemove` takes the badge away and its × had focus, focus moves to the next tag's × in the same list, or the one before it after the last tag, so it isn't lost on the page. After the last tag, or to put focus somewhere else (such as the input that adds tags), move it in `onRemove`: the badge leaves focus alone then.
- In forced-colors (high-contrast) mode every badge gets a visible border.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To a clickable badge (a `<button>` or link), then to its remove button |
| Enter, Space | Press a clickable badge (Enter only, on a link), or the remove button |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<span>`. |
| `variant` | `'subtle'` \| `'solid'` \| `'outline'` | `'subtle'` | The style |
| `tone` | `'neutral'` \| `'primary'` \| `'success'` \| `'warning'` \| `'danger'` \| `'info'` \| a palette family (`'red'` … `'rose'`) | `'neutral'` | The color |
| `dot` | boolean | `false` | A 6px status dot before the label, in the text color. With no label, icon or count, a lone indicator dot (see Extras) |
| `ping` | boolean | `false` | With `dot` (in a label or the indicator): the dot pings, growing and fading every second. For live states. Ignored without a dot |
| `leftIcon` | icon name or element | | An icon before the label (Material Symbols or custom icon name); replaces the dot |
| `count` | number | | Makes it a count badge: a round pill with the number. 0 renders nothing |
| `max` | number | `99` | Past this, the count shows `99+` |
| `showZero` | boolean | `false` | Show a count of 0 |
| `onRemove` | function | | Adds a × button at the end that calls it |
| `removeLabel` | string | `'Remove'` | The × button's accessible name, before the label: "Remove Design" |
| `onClick` | function | | Renders a `<button type="button">` with hover, focus and active states. `onRemove` is ignored then (a button can't hold another button) |
| `href` | string | | Renders a link (the component set with `Serupa.configure({ link })`, `<a>` by default) with the same states; `target="_blank"` gets `rel="noopener noreferrer"` |
| `disabled` | boolean | `false` | With `onClick`: a native disabled button, at 50% with no states |
| `loading` | boolean | `false` | A ring at the icon size replaces the content and the badge keeps its width. Sets `aria-busy`; on a clickable badge also `aria-disabled`, and clicks, Enter and Space do nothing while focus stays. A remove button is disabled meanwhile. Once the ring shows, it stays at least 500ms, so loading that ends a moment later doesn't flash it |
| `loadingText` | string | `'Loading…'` | Announced to screen readers when loading starts ("" announces nothing) |

Any other attribute (`id`, `className`, `style`, `title`, `type`, `aria-*`, `data-*`, `ref`) goes to the outer element: a `<span>`, or the `<button>` or link when clickable. Every badge has `data-component="badge"`, `data-variant`, `data-tone` and `data-size` for tests, plus `data-interactive` when clickable and `data-loading` while loading.

## Component tokens

Each is an optional override: set it on the page, a container or one badge. Unset, it uses the shared token below. The list lives in `src/components/Badge/badge.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from badge.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-neutral-subtle-bg` | `secondary` | Neutral subtle: fill |
| `--badge-neutral-subtle-text` | `text` | Neutral subtle: text and icon |
| `--badge-neutral-solid-bg` | `surface-inverse` | Neutral solid: fill |
| `--badge-neutral-solid-text` | `text-inverse` | Neutral solid: text and icon |
| `--badge-neutral-outline-text` | `text` | Neutral outline: text and icon |
| `--badge-neutral-outline-border` | `border-strong` | Neutral outline: border |
| `--badge-primary-subtle-bg` | `primary-subtle` | Primary subtle: fill |
| `--badge-primary-subtle-text` | `primary` | Primary subtle: text and icon |
| `--badge-primary-solid-bg` | `primary` | Primary solid: fill |
| `--badge-primary-solid-text` | `on-primary` | Primary solid: text and icon |
| `--badge-primary-outline-text` | `primary` | Primary outline: text and icon |
| `--badge-primary-outline-border` | `primary` | Primary outline: border |
| `--badge-indicator-ring-color` | `surface` | The indicator's ring color; set it to the color behind |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-height` | `spacing-5` | Height (20px) |
| `--badge-icon-size` | `spacing-3` | Icon size (12px): leading icon, ×, loading ring, the dot box's height |
| `--badge-dot-size` | `spacing-1.5` | Status dot (6px) |
| `--badge-indicator-size` | `spacing-2` | The lone indicator dot (8px) |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-padding-x` | `spacing-1.5` | Side padding (6px) |
| `--badge-icon-offset` | `spacing-0.5` | Extra padding on the text side when there's an icon (or dot, or ×) on one side only (2px) |
| `--badge-gap` | `spacing-1` | Gap between the dot or icon, the label and the × (4px) |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-border-width` | `border-width-1` | Border width (subtle and outline badges, and every badge in forced-colors mode) |
| `--badge-radius` | `rounded-md` | Corner radius (6px), like Button. Count badges are always fully round |
| `--badge-subtle-border` | `opacity-20` | Strength of the subtle badge's outline, in its text color (20%). Set `0%` for no outline |
| `--badge-indicator-ring` | `border-width-2` | The indicator's ring in the surface color (2px) |

**States**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-hover-layer` | `opacity-10` | Clickable badges: the hover layer's strength (10%) |
| `--badge-active-layer` | `opacity-15` | Clickable badges: the layer while pressed (15%) |
| `--badge-state-text` | `opacity-30` | Clickable subtle and outline badges: how far the text moves toward black (light) or white (dark) on hover and press (30%) |
| `--badge-focus-ring` | `focus-ring` | Clickable badges: the keyboard focus ring |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--badge-press-scale` | `scale-97` | Clickable badges: size while pressed (97%); `100%` turns it off |
| `--badge-press-duration` | `motion-press` | How fast the press scales down (100ms). The release comes back over `motion-release` with `ease-enter`. |
| `--badge-loading-duration` | `motion-enter-sm` | Cross-fade between the content and the loading ring (150ms) |
<!-- token-table:end -->
