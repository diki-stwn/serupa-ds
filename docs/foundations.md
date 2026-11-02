# Foundations

The source of the Foundations pages in Storybook (`docs/foundations/*.mdx` show these sections by heading).

## Color families

| Group | Families | Character |
| --- | --- | --- |
| Neutrals | `slate`, `gray`, `zinc`, `neutral`, `stone` | Cool (slate) through pure (neutral) to warm (stone) greys. Pick **one** per product; the aliases use `zinc`. |
| Warm | `red`, `orange`, `amber`, `yellow` | Errors, warnings, highlights. |
| Greens | `lime`, `green`, `emerald`, `teal` | Success, positive states. |
| Blues | `cyan`, `sky`, `blue`, `indigo` | Links, primary actions, info. |
| Purples & pinks | `violet`, `purple`, `fuchsia`, `pink`, `rose` | Accents, brand flavour. |

## Naming

A color token's name is also its class suffix: `blue-500` is `bg-blue-500` / `text-blue-500` as classes, and `var(--blue-500)` in CSS.

## Using the shades

- **50–200** — tinted backgrounds, hover fills, subtle badges.
- **300–400** — borders, dividers, decorative accents.
- **500–600** — solid fills, primary buttons, icons.
- **700–950** — text, dark surfaces, text on light tints.

## Contrast

Every token's usage note gives its contrast against white or black text. Rules of thumb:

Text on white, and white text on a fill, both reach 4.5:1 at the same shade (the two are the same pair):

- **500+** — the neutrals: `slate`, `gray`, `zinc`, `neutral`, `stone`.
- **600+** — `red`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.
- **700+** — `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`.
- On a `-50` / `-100` tint, set text in the same family at **700–900**.

## Themes

Six themes share **one set of foundations**: the same palette, type, spacing, radius, shadows and components. A theme only changes where the alias colors point.

| Theme | Brand hue | Mode |
| --- | --- | --- |
| Blue Light *(default)* | `blue` | light |
| Blue Dark | `blue` | dark |
| Violet Light | `violet` | light |
| Violet Dark | `violet` | dark |
| Emerald Light | `emerald` | light |
| Emerald Dark | `emerald` | dark |

Switch themes with the `data-theme` attribute on any element, e.g. `<html data-theme="violet-dark">`. Everything inside follows: components use aliases only, so they need no changes.

**Brand and mode without JavaScript** — `data-brand` and `data-mode` work on their own, with no script. On `<html>`, or on any element:

```html
<html data-brand="violet" data-mode="auto">           <!-- follows the operating system from the first paint -->
<section data-mode="dark">…</section>                 <!-- a dark section inside a light page -->
<div data-brand="emerald">…</div>                     <!-- another brand for one part of the page -->
```

Each color that changes between themes is a `light-dark()` pair, and `data-mode` sets `color-scheme` (`auto` is `light dark`), so the light or dark value is chosen where the color is used. Server-rendered and React apps get dark mode with nothing to inject and no flash. With `base.css`, a section with its own `data-mode`, `data-brand` or `data-theme` also takes that theme's text color and `surface` background, so its plain text switches with it (a class on the section still sets its background). When printing, a `data-mode` page or section prints its light colors, since printers drop backgrounds; a flat `*-dark` theme has no light values, so it prints with its backgrounds. A page with neither attribute stays light. An element with `data-theme` keeps that flat theme, so it still wins; inside such a page, give a section both `data-brand` and `data-mode` to switch it. Needs `light-dark()`: Chrome and Edge 123, Safari 17.5, Firefox 120. Older browsers lose the colors of a page or section themed only by `data-brand` and `data-mode`; one with `data-theme` (which `theme.js` sets on the page) keeps them, since the flat themes don't use `light-dark()`.

**More contrast** — `data-contrast="more"` gives 7:1 body text (muted text and placeholders included), stronger borders and field outlines, and a 3px focus ring instead of 2px, in every theme. Status text (`success-text`, `warning-text`, `danger-text`, `info-text`) reaches 7:1 too, on the page, on cards and on its own subtle fill, and the status icon colors step up with it. The brand color steps up within its own hue (brand 800 in light themes, brand 300 in dark, so violet stays violet): links and secondary button labels reach 7:1 on the page and on the brand tint, so does the text on a primary fill, and the focus ring takes brand 700 / 300. Subtle badge labels keep their normal 4.5:1 colors for now. It also applies on its own when the visitor's system asks for more contrast (`prefers-contrast: more`); a page can opt out with `data-contrast="normal"` on `<html>`.

**Density** — `data-density="compact"` makes `md` controls 28px and `lg` 36px (from 32 and 44) for dashboards and data-heavy screens; `sm` stays 24px, the WCAG 2.2 minimum target. Components read the `--control-height-*` tokens, so they need nothing else. `data-density="comfortable"` puts the defaults back for one section.

**Shadows** — `data-shadow="brand"` tints the box shadows (`shadow-2xs` to `shadow-2xl`): each one's black becomes a deep shade of the brand color, at the same opacity, so raised cards, menus and dialogs sit in the brand rather than in grey. The shade is worked out where the attribute is, so a section with its own `data-brand` needs its own `data-shadow="brand"` too. `data-shadow="neutral"` puts the black back for one section.

**Fluid type** — `data-type-scale="fluid"` lets the heading sizes (`text-2xl` to `text-9xl`, and the `type-*` styles that use them, such as `type-display` and `type-heading-1`) follow the width of the window: 70% of their size on a 320px phone, never under 20px, growing to their full size at 1280px and wider. Body sizes (`text-xl` and smaller) don't change. Each size is a `clamp()` with a `rem` part, so browser zoom still enlarges it. Zooming also narrows the window the sizes follow, so at 200% a heading is about 1.6 times its size and at 300% at least double, which meets WCAG 1.4.4 (body text doubles at 200% as usual). Line heights stay as they are. `data-type-scale="fixed"` puts the fixed sizes back for one section.

**Automatic dark mode** — `theme.js` (standalone, no React, `dist/theme.js` in the package) sets `data-theme` for the page from a brand and a mode, follows the visitor's light/dark setting live when the mode is `auto`, and remembers a choice the visitor makes. Load it first in `<head>` so the page never flashes the wrong theme:

```html
<html data-brand="blue" data-mode="auto">   <!-- brand: blue | violet | emerald; mode: auto | light | dark -->
<script src="dist/theme.js"></script>
```

```js
Serupa.theme.set({ mode: 'dark' });          // a theme switcher; remembered in this browser
Serupa.theme.set({ brand: 'violet' });
Serupa.theme.reset();                         // back to the page's data-brand / data-mode
Serupa.theme.get();                           // { brand, mode, theme: 'violet-dark' }
Serupa.theme.onChange(({ theme }) => { … });  // returns an unsubscribe function
```

## Alias tokens

Alias tokens give a colour a **job** instead of a hue. Each one points to a palette colour rather than holding its own value, and that pointer can differ per theme: `primary` is `{blue-600}` in Blue Light and `{violet-400}` in Violet Dark.

**Use aliases in your UI, the palette for the aliases.** Build screens with `primary`, `text`, `border`… and only reach for a palette color like `blue-600` directly when no alias fits; a palette color looks the same in every theme.

`‹brand›` below is `blue`, `violet` or `emerald`. One exception: Emerald Light uses one step darker for `primary` (`emerald-700`), `primary-hover` (`emerald-800`) and `focus-ring` (`emerald-600`), because white text on `emerald-600` is below 4.5:1.

| Alias | Light themes | Dark themes | Use |
| --- | --- | --- | --- |
| `primary` | `‹brand›-600` | `‹brand›-400` | Brand color: primary buttons, links, selected states. |
| `primary-hover` | `‹brand›-700` | `‹brand›-300` | Hover / pressed state of `primary`. |
| `primary-subtle` | `‹brand›-50` | `‹brand›-950` | Brand tint for selected rows and badges. |
| `on-primary` | `white` | `‹brand›-950` | Text and icons on `primary` fills. |
| `secondary` | `zinc-100` | `zinc-700` | Secondary button fill; hover fill for outline and ghost buttons. |
| `secondary-hover` | `zinc-200` | `zinc-600` | Hover state of `secondary`. |
| `highlight` | `zinc-200` | `zinc-700` | The highlighted row in a list: a focused Menu item, the active Combobox or TimePicker option, the current Sidebar page. Text, icons and a primary bar keep AA on it; muted text does not, so a highlighted row switches its muted lines to `text`. |
| `pressed` | `zinc-300` | `zinc-600` | The fill while a row, tab, day or page button is held down: one step past its hover. |
| `surface` | `white` | `zinc-900` | Page and card background. |
| `surface-muted` | `zinc-50` | `zinc-800` | Secondary panels, sidebars, table headers. |
| `surface-raised` | `white` | `zinc-800` | A raised card (Card `elevated`). In dark, where shadows don't show, the lighter surface carries the lift. |
| `surface-overlay` | `white` | `zinc-800` | Anything in the top layer: Menu, Popover, Dialog, Drawer, Toast, and the Combobox, DatePicker and TimePicker lists. |
| `surface-inverse` | `zinc-900` | `zinc-50` | Contrasting blocks: tooltips, inverse banners. |
| `text` | `zinc-900` | `zinc-50` | Body text and headings on `surface`. |
| `text-muted` | `zinc-500` | `zinc-400` | Secondary text, captions, placeholders. |
| `text-inverse` | `white` | `zinc-900` | Text on `surface-inverse`. |
| `border` | `zinc-200` | `zinc-700` | Default borders and dividers. |
| `border-strong` | `zinc-300` | `zinc-600` | Emphasised dividers and outlines. Form fields use `field-border`. |
| `border-raised` | `white` | `zinc-700` | A raised card's edge: invisible in light, a 1px lighter edge in dark. |
| `border-overlay` | `zinc-200` | `zinc-600` | The edge of a top-layer surface; one step stronger than `border` in dark. |
| `focus-ring` | `‹brand›-500` | `‹brand›-400` | Keyboard focus outline, in the brand hue. |
| `success` | `green-600` | `green-500` | Success icons and fills (3:1). Not for text: use `success-text`. |
| `success-subtle` | `green-50` | `green-950` | Success alert / badge background. |
| `success-text` | `green-700` | `green-300` | Success text on `surface`, `surface-muted` and `success-subtle` (4.5:1+). Class `text-success-text`. |
| `warning` | `amber-600` | `amber-500` | Warning icons and fills; put dark text on it. Not for text: use `warning-text`. |
| `warning-subtle` | `amber-50` | `amber-950` | Warning alert / badge background. |
| `warning-text` | `amber-700` | `amber-300` | Warning text on `surface`, `surface-muted` and `warning-subtle` (4.5:1+). Class `text-warning-text`. |
| `danger` | `red-600` | `red-600` | Errors, destructive buttons; white text on it. |
| `danger-hover` | `red-700` | `red-700` | Hover / pressed state of `danger`. |
| `on-danger` | `white` | `white` | Text and icons on `danger` fills. |
| `danger-subtle` | `red-50` | `red-950` | Error alert / badge background. |
| `danger-text` | `red-700` | `red-300` | Destructive text and icons on `surface` and danger tints. |
| `danger-subtle-hover` | `red-100` | `red-900` | Hover fill for destructive secondary, outline and ghost buttons. |
| `danger-border` | `red-300` | `red-800` | Border of a destructive outline button. |
| `info` | `sky-700` | `sky-400` | Informational icons and text. |
| `info-subtle` | `sky-50` | `sky-950` | Info alert / badge background. |
| `info-text` | `sky-700` | `sky-300` | Info text on `surface`, `surface-muted` and `info-subtle` (4.5:1+). Class `text-info-text`. |
| `field` | `white` | `zinc-800` | Background of text inputs, selects and other form fields. |
| `field-readonly` | `zinc-50` | `zinc-900` | Background of read-only and disabled fields: a step flatter than `field`, so they read as not editable. |
| `field-border` | `zinc-500` | `zinc-400` | Border of form fields: 3:1+ on `field` and `surface` (WCAG 1.4.11, a control's boundary). |
| `field-border-hover` | `zinc-600` | `zinc-300` | Field border on hover. |
| `placeholder` | `zinc-500` | `zinc-400` | Placeholder text (4.5:1+ on `field`). A hint, never a label. |
| `overlay` | zinc-900 at 50% | zinc-950 at 70% | The dimmed backdrop behind dialogs and drawers. |

### Contrast, checked in every theme

- `on-primary` on `primary`: 5.2–7.9:1. `text-muted` on `surface`: 4.8:1 light, 7.9:1 dark.
- `focus-ring` on `surface`: 3.7:1 or more.
- Dark themes use a light `primary` (brand 400) with dark text (brand 950), because white text on a mid-tone fill fails in dark mode.

### Naming

- `<role>`: the main colour for that job (`primary`, `surface`, `text`, `border`).
- `<role>-hover`, `-muted`, `-strong`, `-subtle`: variants of the same job. `-subtle` is a light tint for backgrounds.
- `on-<role>` / `<role>-inverse`: the colour that goes **on top of** that role (`on-primary` text on a `primary` button).

### Adding an alias

1. Name it after its job, not its colour (`danger`, not `red`).
2. Set its value to `{palette-token}` — the target must exist; an alias of a missing token, or of itself, is dropped.
3. Check contrast: text aliases need 4.5:1 on the surface they sit on (3:1 for icons, borders and focus rings). The palette tokens' usage notes give the ratios.
4. Only colours can be aliases: spacing, radius, shadow and type tokens hold their own values.

### Adding a theme

1. Pick a brand hue from the palette.
2. Give each alias a target in the new theme: copy a Light or Dark column and swap the brand hue.
3. Check `on-primary` on `primary` (4.5:1) and `focus-ring` on `surface` (3:1). Step the brand one shade darker (light) or lighter (dark) if either fails.
4. Nothing else changes: palette, type, spacing, radius, shadows and components are shared.

## Typography

The type scales and font families, named by role (`text-xl`, `font-semibold`, `tracking-tight`, `leading-relaxed`).

**Families**

| Token | Font | Use |
| --- | --- | --- |
| `font-sans` | Inter | Default for UI and body text. |
| `font-serif` | Georgia | Editorial or long-form accents. |
| `font-mono` | The system's monospace: SF Mono, Menlo, Consolas or Liberation Mono | Code, IDs, tabular figures. A bare `<kbd>` uses `font-sans`, like `<Kbd>`. |

Fonts ship with the system in `fonts/` and are declared by `tokens.css`: Inter (upright and italic, variable 100–900). Icons are SVGs, not a font. Nothing loads from another server. Georgia and Courier New are pre-installed on most computers.

**Sizes** — each size carries its own line height. Both are tokens in the `fontSize` group (`var(--text-sm)`, `var(--text-sm--line-height)`) that the `text-*` classes and the components read. A `text-*` class sets only size and line height.

**Type styles** — `type-xs` … `type-9xl` (generated into `tokens.css` from the Type scale) set the whole style at once: family, size, line height, weight and letter spacing. From `type-2xl` up they carry `tracking-tight`, and from `type-6xl` up `tracking-tighter`, so a large style reads as set as tightly as a Heading of that size. Use one for a block of plain text; combine `text-*`, `font-*` and `tracking-*` when you need to vary one property. The two sets never conflict, whatever order the stylesheets load in.

| Class | Size | Line height |
| --- | --- | --- |
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |
| `text-5xl` – `text-9xl` | 48, 60, 72, 96, 128px | 1 (tight) |

**Type roles** — styles named for what the text is for, built from the same sizes, weights and tracking. Prefer a role to a size style: it carries the weight and tracking the system uses for that job, so a page title set with a class matches a `<Heading level={1}>`.

| Class | Size / line height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `type-display` | 48px / 1.1 | 600 | tight | Hero and marketing headlines. Two lines don't touch, unlike `type-5xl` (line height 1). |
| `type-heading-1` | 30px / 36px | 600 | tight | Page title; `<Heading level={1}>` |
| `type-heading-2` | 24px / 32px | 600 | tight | Section title; `<Heading level={2}>` |
| `type-heading-3` | 20px / 28px | 600 | normal | Subsection; `<Heading level={3}>` |
| `type-heading-4` | 18px / 28px | 600 | normal | Group title; `<Heading level={4}>`, Dialog and Drawer titles |
| `type-title` | 16px / 24px | 600 | normal | Card, list and EmptyState titles |
| `type-body` | 16px / 24px | 400 | normal | Running text |
| `type-body-sm` | 14px / 20px | 400 | normal | UI text: controls, cells, menus, descriptions |
| `type-label` | 14px / 20px | 500 | normal | Field labels, table headers, tabs |
| `type-caption` | 12px / 16px | 400 | normal | Hints, timestamps, footnotes (with `text-muted`) |
| `type-overline` | 12px / 16px, uppercase | 600 | widest | An eyebrow above a title |
| `type-code` | 14px / 20px, `font-mono` | 400 | normal | Inline code and code blocks |

Each role is also a `font` shorthand token (`var(--text-type-label)`) and a typography token in `design-tokens/`.

**Weights** — three defaults:

| Token | Weight | Use |
| --- | --- | --- |
| `font-normal` | Regular (400) | Body text, long-form reading, inputs. |
| `font-medium` | Medium (500) | Buttons, labels, tabs, table headers, emphasis inside body text. |
| `font-semibold` | Semibold (600) | Headings and titles at every size. |

Reach for these first, and use only these in components. The other weights stay available for special cases such as marketing pages, display type or charts: `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-bold` (700), `font-extrabold` (800) and `font-black` (900). Load Inter with the full range (`family=Inter:wght@100..900`), or just `400;500;600` on pages that only use the defaults.

**Tracking** `tracking-tighter` (-0.05em) to `tracking-widest` (0.1em); **leading** `leading-none` (1) to `leading-loose` (2), plus fixed `leading-3` to `leading-10` (12–40px).

Rules of thumb:

- Body text: `text-base` in `font-sans`, `font-normal`; long-form reading: add `leading-relaxed`.
- Headings: `font-semibold`, with `tracking-tight` from `text-2xl` up.
- `text-5xl` and larger have a line height of 1: add `leading-tight` if a heading can wrap.
- Don't go below `text-xs` (12px), and keep body text at `text-sm` or larger.

### Text utilities

Every typography property has classes in `bundle.css`. The values that form a scale are tokens in the `typography` group: weights, tracking, leading, font stretch, underline thickness and offset, line clamp and tab size.

| Property | Classes |
| --- | --- |
| font-family | `font-sans`, `font-serif`, `font-mono` |
| font-size | `text-xs` … `text-9xl` (each with its default line height) |
| font-smoothing | `antialiased`, `subpixel-antialiased` |
| font-style | `italic`, `not-italic` |
| font-weight | `font-thin` … `font-black` (defaults: `font-normal`, `font-medium`, `font-semibold`) |
| font-stretch | `font-stretch-ultra-condensed` … `font-stretch-ultra-expanded`; percentages `font-stretch-50%` `-75%` `-90%` `-95%` `-100%` `-105%` `-110%` `-125%` `-150%` `-200%` |
| font-variant-numeric | `normal-nums`, `ordinal`, `slashed-zero`, `lining-nums`, `oldstyle-nums`, `proportional-nums`, `tabular-nums`, `diagonal-fractions`, `stacked-fractions` (they combine) |
| font-feature-settings | No classes: set it in CSS, e.g. `font-feature-settings: "cv11"` |
| letter-spacing | `tracking-tighter` … `tracking-widest` |
| line-clamp | `line-clamp-1` … `line-clamp-6`, `line-clamp-none` |
| line-height | `leading-none`, `-tight`, `-snug`, `-normal`, `-relaxed`, `-loose`, and `leading-<spacing>` |
| list-style-image / position / type | `list-image-none`; `list-inside`, `list-outside`; `list-disc`, `list-decimal`, `list-none` |
| text-align | `text-left`, `-center`, `-right`, `-justify`, `-start`, `-end` |
| color | `text-<color>` for every palette color and alias (`text-blue-600`, `text-primary`, `text-text-muted`), `text-inherit`, `text-current`, `text-transparent` |
| text-decoration-line | `underline`, `overline`, `line-through`, `no-underline` |
| placeholder color | `placeholder-<color>` for every palette color and alias, `placeholder-inherit`, `placeholder-current`, `placeholder-transparent` (use `placeholder-text-muted`) |
| text-decoration-color | `decoration-<color>`, `decoration-current`, `decoration-inherit`, `decoration-transparent` |
| text-decoration-style | `decoration-solid`, `-double`, `-dotted`, `-dashed`, `-wavy` |
| text-decoration-thickness | `decoration-0`, `1`, `2`, `4`, `8`, `decoration-auto`, `decoration-from-font` |
| text-underline-offset | `underline-offset-0`, `1`, `2`, `4`, `8`, `-auto` (and negatives) |
| text-transform | `uppercase`, `lowercase`, `capitalize`, `normal-case` |
| text-overflow | `truncate`, `text-ellipsis`, `text-clip` |
| text-wrap | `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty` |
| text-indent | `indent-<spacing>`, `-indent-<spacing>` |
| tab-size | `tab-0`, `tab-2`, `tab-4`, `tab-8` |
| vertical-align | `align-baseline`, `-top`, `-middle`, `-bottom`, `-text-top`, `-text-bottom`, `-sub`, `-super` |
| white-space | `whitespace-normal`, `-nowrap`, `-pre`, `-pre-line`, `-pre-wrap`, `-break-spaces` |
| word-break | `break-normal`, `break-all`, `break-keep` |
| overflow-wrap | `wrap-break-word`, `wrap-anywhere`, `wrap-normal` |
| hyphens | `hyphens-none`, `hyphens-manual`, `hyphens-auto` |
| content | `content-none` |

Text rules of thumb:

- Set text color with aliases (`text-text`, `text-text-muted`, `text-primary`), not palette colors, so it follows the theme.
- Headings: `text-balance`; paragraphs: `text-pretty`. Numbers in tables: `tabular-nums`.
- Japanese: with `base.css`, a heading inside `lang="ja"` breaks between phrases (`word-break: auto-phrase`), so a word isn't split across lines. Chrome and Edge 119 and later do this; other browsers break as before.
- Truncate single lines with `truncate`; clamp previews with `line-clamp-2` or `-3`, and make the full text reachable.
- Links in body text: `underline underline-offset-2`. Uppercase labels: `uppercase tracking-wide text-xs font-medium`.

## Iconography

Icons are **Material Symbols**, **Rounded** style, **Fill** on, weight 400, plus custom icons drawn to the same rules. Use no other icon set or style. Each icon is an inline SVG, so there's nothing to load and nothing flashes.

Use the `Icon` component (`<Icon name="delete" />`) or pass a name to Button (`leftIcon="add"`, `icon="settings"`). Every Material Symbol works by name; find one on the Foundations/Icons page in Storybook, which searches all of them and copies the name. You can also pass an icon imported from `serupa-ds/icons` (`icon={RocketLaunch}`). Details are in the Icon guidelines.

- **Sizes:** 14px (`sm` buttons), 16px (`md` buttons, inline with `text-sm`), 20px (`lg` buttons, list rows), 24px (default, toolbars and navigation), 40px+ (empty states).
- **Color:** icons follow the text color. Use `text` or `text-muted` for neutral icons and `success`, `warning`, `danger` or `info` for status.
- **Meaning:** icons are decorative by default. Add an `aria-label` only when the icon carries meaning alone, and give icon-only buttons an `aria-label`.
- **Consistency:** one icon per meaning across the product (always `delete`, never `delete` in one place and `remove` in another).

**Custom icons.** For what Material Symbols doesn't have, draw your own on the same 24×24 grid, in one color, and put the SVGs in `assets/Icons/` (`serupa-sparkle.svg`). `node tools/icons/build.mjs` cleans them and builds them into the components, so `<Icon name="serupa-sparkle" />` and `leftIcon="serupa-sparkle"` work with the same sizes, colors and accessibility as Material Symbols. The build refuses anything unsafe or off-system with the reason. Drawing rules and details are in the Icon guidelines.

## Backgrounds

Background utilities, as classes in `bundle.css`. Backgrounds have no scale of their own: colors come from the palette and alias tokens, so there are no new tokens.

| Property | Classes |
| --- | --- |
| background-attachment | `bg-fixed`, `bg-local`, `bg-scroll` |
| background-clip | `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`, `bg-clip-text` |
| background-color | `bg-<color>` for every palette color and alias (`bg-gray-100`, `bg-surface`, `bg-primary`), `bg-inherit`, `bg-current`, `bg-transparent` |
| background-image | `bg-none`; linear gradients `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` and `bg-linear-45` (any of 0–315° in 45° steps, negatives too); `bg-radial`; `bg-conic`, `bg-conic-90`… |
| gradient stops | `from-<color>`, `via-<color>`, `to-<color>`; positions `from-0%` … `to-100%` in 5% steps |

The gradients (`bg-linear-*`, `bg-radial*`, `bg-conic*` and the stops) ship in `utilities-extra.css`, not in `bundle.css`: import `serupa-ds/utilities-extra.css` after it to use them.
| background-origin | `bg-origin-border`, `bg-origin-padding`, `bg-origin-content` |
| background-position | `bg-top-left`, `bg-top`, `bg-top-right`, `bg-left`, `bg-center`, `bg-right`, `bg-bottom-left`, `bg-bottom`, `bg-bottom-right` |
| background-repeat | `bg-repeat`, `bg-repeat-x`, `bg-repeat-y`, `bg-repeat-space`, `bg-repeat-round`, `bg-no-repeat` |
| background-size | `bg-auto`, `bg-cover`, `bg-contain` |

Gradients mix in the OKLab color space, so blends between hues stay bright instead of turning grey: `bg-linear-to-r from-primary to-info`.

Rules of thumb:

- Use alias backgrounds (`bg-surface`, `bg-surface-muted`, `bg-primary-subtle`) so surfaces follow the theme; palette backgrounds look the same in every theme.
- Keep text on a solid background: if text sits on a gradient or image, check contrast at its lightest point, or add a `bg-surface` panel behind it.
- Use gradients sparingly, for heroes and illustrations, not for UI controls.
- Images: `bg-cover bg-center bg-no-repeat` fills a box without distortion.

## Spacing

The spacing scale, named `spacing-<step>`: 1 step = 4px (`spacing-4` = 16px = `p-4`). Steps: `0`, `px` (1px), `0.5`–`3.5` in half steps, `4`–`12`, then `14`, `16`, `20`, `24` … `64`, `72`, `80`, `96` (384px).

- Stay on the scale: `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px) and `16` (64px) cover most layouts.
- Spacing inside a group should be smaller than the spacing between groups.

### Padding and margin

Every spacing step works as padding and margin, as classes in `bundle.css`.

| Padding | Margin | Sets |
| --- | --- | --- |
| `p-` | `m-` | All sides |
| `px-` / `py-` | `mx-` / `my-` | Inline (left and right) / block (top and bottom) |
| `ps-` / `pe-` | `ms-` / `me-` | Inline start / end: follows text direction (left/right in LTR, swapped in RTL) |
| `pbs-` / `pbe-` | `mbs-` / `mbe-` | Block start / end: follows the writing mode |
| `pt-` `pr-` `pb-` `pl-` | `mt-` `mr-` `mb-` `ml-` | One physical side |

- **Values** — every spacing step: `p-4` is `spacing-4` (16px), `mt-0.5` is 2px, `px-px` is 1px.
- **Auto margins** — `m-auto`, `mx-auto` (center a block), `ms-auto` (push to the end of a flex row), and the other sides.
- **Negative margins** — prefix with `-`: `-mt-2` (-8px), `-mx-4`. Use them sparingly, to pull an element into its parent's padding.
- **Space between** — `space-x-4` and `space-y-4` add a gap between children (on every child but the last). Prefer `gap` on flex and grid; use `space-*` for plain stacks. Negative versions exist (`-space-x-2`) for overlapping avatars, and `space-x-reverse` / `space-y-reverse` put the gap on the other side for `flex-row-reverse` and `flex-col-reverse`. These rules have zero specificity, so a margin class on a child still wins.

Rules of thumb:

- Pad containers, gap their children: give a card `p-4` or `p-6` and lay out its contents with `gap` or `space-y-*`, rather than margins on each child.
- Prefer the logical classes (`ps-`, `pe-`, `ms-`, `me-`) in components, so they work in right-to-left languages.
- Center page content with `mx-auto` plus a max width.

## Corner radius

The corner radius scale. `rounded-sm` is 4px; the 2px step is `rounded-xs`.

| Token | Value | Use |
| --- | --- | --- |
| `rounded-none` | 0 | Square |
| `rounded-xs` | 2px | Tags, small chips |
| `rounded-sm` / `rounded` | 4px | Inputs, small buttons, checkboxes |
| `rounded-md` | 6px | Buttons |
| `rounded-lg` | 8px | Cards, menus |
| `rounded-xl` | 12px | Panels |
| `rounded-2xl` | 16px | Modals |
| `rounded-3xl` | 24px | Hero blocks |
| `rounded-4xl` | 32px | Very large surfaces |
| `rounded-full` | 9999px | Pills, avatars |

A container nested inside another should have a smaller radius than its parent.

## Borders and outlines

Border and outline utilities, as classes in `bundle.css`. Widths and offsets are tokens in the `borders` group; colors come from the palette and alias tokens.

| Property | Classes |
| --- | --- |
| border-radius | `rounded-<size>` on all corners; sides `rounded-t-`, `-r-`, `-b-`, `-l-`, `-s-`, `-e-`; corners `rounded-tl-`, `-tr-`, `-br-`, `-bl-`, `-ss-`, `-se-`, `-ee-`, `-es-` |
| border-width | `border` (1px), `border-0`, `-2`, `-4`, `-8`; sides `border-x`, `-y`, `-s`, `-e`, `-bs`, `-be`, `-t`, `-r`, `-b`, `-l` (each with the same widths); between children `divide-x`, `divide-y` (and `-0`, `-2`, `-4`, `-8`, `-reverse`) |
| border-color | `border-<color>` for every palette color and alias, on every side (`border-t-danger`, `border-x-border`); `divide-<color>`; `inherit`, `current`, `transparent` |
| border-style | `border-solid`, `-dashed`, `-dotted`, `-double`, `-hidden`, `-none`; `divide-dashed`… |
| outline-width | `outline` (1px), `outline-0`, `-1`, `-2`, `-4`, `-8` |
| outline-color | `outline-<color>` for every palette color and alias |
| outline-style | `outline-solid`, `-dashed`, `-dotted`, `-double`, `outline-none`, `outline-hidden` (transparent, still visible in forced-colors mode) |
| outline-offset | `outline-offset-0`, `-1`, `-2`, `-4`, `-8` and negatives |

Width classes draw a solid line on the sides they set, so `border` alone draws a box and `border-t-4` only a top line. Style classes (`border-dashed`) change the line of any width class on the same element; on their own they draw nothing. Its color is the text color unless you add one: use `border-border` (the alias) for dividers and `border-border-strong` for inputs.

Rules of thumb:

- Borders: `border border-border` for cards and dividers, `border-field-border` for form fields (`border-danger` when invalid, with the message in `danger-text`), `border-danger-border` for destructive outline buttons.
- Focus: one recipe everywhere, `outline: var(--focus-ring-width) solid var(--focus-ring); outline-offset: var(--focus-ring-offset)` on `:focus-visible` (the utilities `outline-2 outline-offset-2 outline-focus-ring` give the same). An outline follows the corner radius and its gap is transparent, so the ring reads on tinted backgrounds such as an Alert, Card or Navbar, and forced-colors mode draws it. Use an inset ring only where an outline would be clipped, as in Tabs. Never remove a focus style without replacing it; prefer `outline-hidden` over `outline-none`.
- Lists and tables: `divide-y divide-border` instead of a border on each row.

## Effects

Effect utilities, as classes in `bundle.css`. Box, inner and text shadows are tokens in the `shadow` group; opacity uses the `opacity` group; blend modes and masks are keywords. The masks (`mask-*`) ship in `utilities-extra.css`: import `serupa-ds/utilities-extra.css` after `bundle.css` to use them.

**Shadow names.** `shadow-2xs` → `shadow-xs` → `shadow-sm` → `shadow-md` → `shadow-lg` → `shadow-xl` → `shadow-2xl`, all black at 5–25% opacity. Earlier versions of this system used other names: the old `shadow-sm` is now `shadow-xs` (Button uses it, so buttons look the same), the old bare `shadow` is now `shadow-sm`, and `shadow-inner` is now `inset-shadow-sm`. `shadow` and `shadow-inner` still work.

| Property | Classes | Tokens |
| --- | --- | --- |
| box-shadow | `shadow-2xs` `-xs` `-sm` `-md` `-lg` `-xl` `-2xl` `-none`; inner `inset-shadow-2xs` `-xs` `-sm` `-none`; rings `ring` (1px) `ring-0` `-1` `-2` `-4` `-8`, `ring-inset`, `inset-ring` (and widths), `ring-offset-0` `-1` `-2` `-4` `-8`; colors `shadow-<color>`, `inset-shadow-<color>`, `ring-<color>`, `inset-ring-<color>`, `ring-offset-<color>` for every palette color and alias; `shadow-initial`, `inset-shadow-initial` and `text-shadow-initial` undo a color class | `shadow-*`, `inset-shadow-*` |
| text-shadow | `text-shadow-2xs` `-xs` `-sm` `-md` `-lg` `-none`; `text-shadow-<color>`, `text-shadow-inherit` | `text-shadow-*` |
| opacity | `opacity-0` … `opacity-100` in 5% steps | `opacity-*` |
| mix-blend-mode | `mix-blend-normal` `-multiply` `-screen` `-overlay` `-darken` `-lighten` `-color-dodge` `-color-burn` `-hard-light` `-soft-light` `-difference` `-exclusion` `-hue` `-saturation` `-color` `-luminosity` `-plus-darker` `-plus-lighter` | — |
| background-blend-mode | `bg-blend-normal` … `bg-blend-luminosity` (same list, without the plus modes) | — |
| mask-clip | `mask-clip-border` `-padding` `-content` `-fill` `-stroke` `-view`, `mask-no-clip` | — |
| mask-composite | `mask-add` `mask-subtract` `mask-intersect` `mask-exclude` | — |
| mask-image | `mask-none`; edges `mask-t-from-<%>` `mask-t-to-<%>` (also `-r-` `-b-` `-l-` `-x-` `-y-`); `mask-linear-<angle>` (45° steps, negatives) with `mask-linear-from-<%>` `-to-<%>`; `mask-radial-from-<%>` `-to-<%>` with `mask-circle` `mask-ellipse`, `mask-radial-closest-side` `-closest-corner` `-farthest-side` `-farthest-corner`, `mask-radial-at-<position>`; `mask-conic-<angle>` with `mask-conic-from-<%>` `-to-<%>`. Percentages run 0–100% in 5% steps | — |
| mask-mode | `mask-alpha` `mask-luminance` `mask-match` | — |
| mask-origin | `mask-origin-border` `-padding` `-content` `-fill` `-stroke` `-view` | — |
| mask-position | `mask-top-left` `mask-top` `mask-top-right` `mask-left` `mask-center` `mask-right` `mask-bottom-left` `mask-bottom` `mask-bottom-right` | — |
| mask-repeat | `mask-repeat` `mask-no-repeat` `mask-repeat-x` `mask-repeat-y` `mask-repeat-space` `mask-repeat-round` | — |
| mask-size | `mask-auto` `mask-cover` `mask-contain` | — |
| mask-type | `mask-type-alpha` `mask-type-luminance` (on SVG `<mask>` elements) | — |

**Stacking.** A shadow, an inner shadow, a ring and an inset ring all draw on one element at once: `shadow-md ring-1 ring-border` is a card with a hairline edge. Mask gradients stack too and intersect: `mask-b-from-60% mask-r-from-80%` fades the bottom and the right.

**Colors.** A color class swaps the black for that color at full strength (rings default to the text color). For a soft tint, set the variable directly, e.g. `--dk-shadow-color: color-mix(in oklab, var(--primary) 30%, transparent)`.

**Masks.** `-from-` is where the element is still fully visible and `-to-` where it is fully hidden, measured from the named edge or the gradient's start: `mask-b-from-50%` keeps the top half and fades the bottom half out.

Rules of thumb:

- Elevation: inputs and buttons `shadow-xs`, cards `shadow-sm` (or `shadow-md` on hover), menus and popovers `shadow-lg`, dialogs `shadow-xl`/`shadow-2xl`. Higher elements get bigger shadows.
- Shadows barely show in dark themes, so elevation there comes from the surface: put raised content on `surface-raised` with a `border-raised` edge, and anything in the top layer on `surface-overlay` with a `border-overlay` edge. Both are white in light themes, so the same classes work in every theme.
- Focus: use the outline recipe from Borders, not a ring. A `ring-offset` paints its gap in one color, which shows as a band on any tinted background, and box-shadow rings disappear in forced-colors mode.
- `text-shadow-*` only for text over images or video; never on body text over solid surfaces.
- `opacity-disabled` (50%) for disabled controls, as every component uses; don't lower the opacity of text to make it secondary — use `text-muted`.
- Blend modes for illustrations and image treatments (`mix-blend-multiply` to drop a white background), not for UI chrome.
- Masks for fading scroll edges (`mask-b-from-80%` on a scrolling list) and image vignettes (`mask-radial-from-60%`).

## Elevation and layers

How things sit above one another: the page, raised cards, floating menus and dialogs. Elevation is shown three ways at once, so it reads in every theme: the surface color, an edge, and a shadow.

**The levels**

| Level | What sits there | Surface | Edge | Shadow |
| --- | --- | --- | --- | --- |
| 0 · Page | The page, Navbar, Sidebar, tables | `surface` | `border` between regions | none |
| 0 · Recessed | Side panels, table headers, filled Cards, wells | `surface-muted` | none | none, or `inset-shadow-xs` for an input well |
| 1 · Resting | Outline Cards, Buttons, inputs | `surface` (fields: `field`) | `border` (fields: `field-border`) | `shadow-xs` |
| 2 · Raised | Elevated Cards, a card while it's dragged or hovered | `surface-raised` | `border-raised` | `shadow-md` |
| 3 · Floating | Menu, Popover, Combobox, DatePicker and TimePicker lists, Toast | `surface-overlay` | `border-overlay` | `shadow-lg` |
| 4 · Modal | Dialog and Drawer, over the `overlay` backdrop | `surface-overlay` | `border-overlay` | `shadow-xl` |
| Inverse | Tooltip | `surface-inverse` | none | `shadow-md` |

- Higher means bigger shadow and, in dark themes, a lighter surface. Don't skip the surface and edge and rely on the shadow alone.
- Keep to one raised level per region. A card inside a card stays at level 1; give the inner one `filled` or no border instead of a second shadow.
- Elevation means "this is above the page", not "this is important". Use color and type for emphasis.

**Light and dark**

In light themes, shadows carry the lift: `surface-raised` and `surface-overlay` are white like `surface`, and `border-raised` is invisible. In dark themes (a `zinc-900` page), shadows hardly show, so the surface steps up to `zinc-800` and the edge to `zinc-700` or `zinc-600`. Because the tokens change with the theme, the same classes work in both: `bg-surface-overlay border border-border-overlay shadow-lg` is a correct floating panel in all six themes.

In forced-colors mode, backgrounds and shadows are replaced, so only the edge survives. Every floating surface has a real border for that reason; keep it if you restyle one.

**Layers and z-index**

- The floating components (Menu, Popover, Tooltip, the Combobox, DatePicker, DateRangePicker and TimePicker lists) and the modal ones (Dialog, Drawer) open in the browser's **top layer** (`popover` and `showModal()`). The top layer is above every z-index on the page, so they can't be hidden by a parent's `overflow: hidden` or a high z-index, and you never need to raise them. Toasts move into an open Dialog or Drawer so they stay visible and clickable there.
- Your own fixed and sticky elements use the named layers (`z-sticky`, `z-dropdown`, `z-overlay`, `z-modal`, `z-popover`, `z-toast`, `z-tooltip`, listed in Layout under Utility classes), so they stack in the same order as the components.
- Use the numbered steps (`z-10`, `z-20`) only inside one component, such as a badge over an avatar. Wrap that component in `isolate` so its z-indexes can't compete with the page's.
- A new stacking context traps z-index: `transform`, `filter`, `opacity` below 1, `isolation: isolate` and `position: sticky` with a z-index all create one. If something won't come to the front, look for one of these on an ancestor before raising a number.

## Filters

Filter and backdrop-filter utilities, as classes in `bundle.css`. Scales are tokens in the `filters` group (backdrop opacity uses the `opacity` group); grayscale, invert and sepia need none. Filter classes combine on one element (`blur-sm grayscale`), and so do backdrop classes.

| Property | Classes | Tokens |
| --- | --- | --- |
| blur | `blur-xs` (4px) `-sm` (8px) `-md` (12px) `-lg` (16px) `-xl` (24px) `-2xl` (40px) `-3xl` (64px), `blur-none` | `blur-*` |
| brightness | `brightness-0` `-50` `-75` `-90` `-95` `-100` `-105` `-110` `-125` `-150` `-200` | `brightness-*` |
| contrast | `contrast-0` `-50` `-75` `-100` `-125` `-150` `-200` | `contrast-*` |
| drop-shadow | `drop-shadow-xs` `-sm` `-md` `-lg` `-xl` `-2xl` `-none`; color `drop-shadow-<color>` for every palette color and alias | `drop-shadow-*` |
| grayscale | `grayscale` (100%), `grayscale-0` `-25` `-50` `-75` `-100` | — |
| hue-rotate | `hue-rotate-0` `-15` `-30` `-60` `-90` `-180`, negatives `-hue-rotate-15`… | `hue-rotate-*` |
| invert | `invert` (100%), `invert-0` `-25` `-50` `-75` `-100` | — |
| saturate | `saturate-0` `-50` `-100` `-150` `-200` | `saturate-*` |
| sepia | `sepia` (100%), `sepia-0` `-25` `-50` `-75` `-100` | — |
| filter | `filter-none` turns every filter off | — |
| backdrop-filter | `backdrop-blur-*`, `backdrop-brightness-*`, `backdrop-contrast-*`, `backdrop-grayscale(-*)`, `backdrop-hue-rotate-*` (and negatives), `backdrop-invert(-*)`, `backdrop-opacity-0` … `-100` (5% steps), `backdrop-saturate-*`, `backdrop-sepia(-*)`, `backdrop-filter-none` | same as above, plus the `opacity` group |

Drop shadows follow an element's shape (transparent PNGs, SVG icons, clipped shapes), where `shadow-*` draws a box. A color class such as `drop-shadow-primary` keeps the shadow's size and swaps the black for that color, at full strength; for a softer tint, set `--dk-drop-shadow-color` to a transparent color, e.g. `color-mix(in oklab, var(--primary) 40%, transparent)`.

Backdrop filters change what's behind an element, so they only show through a see-through background, such as `background: color-mix(in oklab, var(--surface) 70%, transparent)`.

Rules of thumb:

- Frosted glass: that translucent `surface` with `backdrop-blur-md backdrop-saturate-150` for sticky headers, `backdrop-blur-sm` for menus and `backdrop-blur-lg` behind dialogs.
- Text over a photo: `brightness-50` or a gradient on the image, then check contrast at the lightest point.
- `grayscale` for disabled or inactive images and logo walls (and `filter: none` on hover, in your own CSS).
- Blur is expensive on large areas and on scroll. Keep `blur-*` and `backdrop-blur-*` on small or fixed elements, and give text a solid fallback for browsers that skip backdrop filters.
- Use `shadow-*` for cards and panels; save `drop-shadow-*` for icons, illustrations and cut-out images.

## Tables

Table utilities, as classes in `bundle.css`. They add no tokens: `border-spacing` uses the spacing scale, and the rest are keywords.

| Property | Classes |
| --- | --- |
| border-collapse | `border-collapse` (cells share borders), `border-separate` (each cell has its own) |
| border-spacing | `border-spacing-<step>`, `border-spacing-x-<step>`, `border-spacing-y-<step>` for every spacing step (`0`, `px`, `0.5` … `96`); only works with `border-separate` |
| table-layout | `table-auto` (columns fit their content), `table-fixed` (columns follow the first row or set widths, ignoring content) |
| caption-side | `caption-top`, `caption-bottom` |

Rules of thumb:

- Data tables: `border-collapse` with `divide-y divide-border` on `<tbody>` or `border-b border-border` on rows, `text-sm`, and `px-3 py-2` cells.
- Use `border-separate border-spacing-2` (or `border-spacing-y-2` for row cards) when cells need their own rounded corners or backgrounds.
- `table-fixed` with column widths (`w-1/3`, `w-24`) keeps long content from pushing columns around and renders faster for big tables; pair it with `truncate` in cells.
- Put numbers in `tabular-nums text-right` cells, and give every table a `<caption>` or an `aria-label` describing it.

## Transforms

Transform utilities, as classes in `bundle.css`. Perspective, rotation, scale, skew and zoom are tokens in the `transforms` group; translate uses the spacing scale. `rotate`, `scale` and `translate` set the CSS properties of the same name, so `rotate-45 scale-110 translate-x-2` all apply together.

| Property | Classes | Tokens |
| --- | --- | --- |
| backface-visibility | `backface-visible`, `backface-hidden` | — |
| perspective | `perspective-dramatic` (100px) `-near` (300px) `-normal` (500px) `-midrange` (800px) `-distant` (1200px), `perspective-none` | `perspective-*` |
| perspective-origin | `perspective-origin-center` `-top` `-top-right` `-right` `-bottom-right` `-bottom` `-bottom-left` `-left` `-top-left` | — |
| rotate | `rotate-0` `-1` `-2` `-3` `-6` `-12` `-45` `-90` `-180` and negatives (`-rotate-90`), `rotate-none`; 3D `rotate-x-*` `rotate-y-*` `rotate-z-*` | `rotate-*` |
| scale | `scale-0` `-50` `-75` `-90` `-95` `-100` `-105` `-110` `-125` `-150` `-200`; `scale-x-*` `scale-y-*` `scale-z-*`; negatives mirror (`-scale-x-100`); `scale-3d`, `scale-none` | `scale-*` |
| skew | `skew-0` `-1` `-2` `-3` `-6` `-12`, `skew-x-*` `skew-y-*` and negatives | `skew-*` |
| transform | `transform` (applies rotate-x/y/z and skew), `transform-none`, `transform-gpu`, `transform-cpu` | — |
| transform-box | `transform-border` `transform-content` `transform-fill` `transform-stroke` `transform-view` (what `origin-*` measures from; `transform-fill` for SVG shapes) | — |
| transform-origin | `origin-center` `-top` `-top-right` `-right` `-bottom-right` `-bottom` `-bottom-left` `-left` `-top-left` | — |
| transform-style | `transform-3d` (preserve-3d), `transform-flat` | — |
| translate | `translate-<step>`, `translate-x-<step>`, `translate-y-<step>`, `translate-z-<step>` for every spacing step; fractions `-1/2` … `-11/12` and `-full` (of the element's own size); negatives; `translate-3d`, `translate-none` | `spacing-*` |
| zoom | `zoom-50` `-75` `-90` `-95` `-100` `-105` `-110` `-125` `-150` `-200` | `zoom-*` |

Transforms move how an element is drawn, not where it sits in the layout, so neighbours don't shift. `zoom` is the exception: it changes the element's layout size too.

3D needs three things: a `perspective-*` on the parent, `transform-3d` where children should keep their depth, and `rotate-x-*` or `rotate-y-*` on the element. Add `backface-hidden` to the faces of a flipping card.

Rules of thumb:

- Micro-interactions: in your own CSS, scale a card up a little on hover and a control down while it's pressed, with `transition-transform duration-150` on the element (utilities have no `hover:` or `active:` prefix):

  ```css
  @media (hover: hover) { .card-link:hover { scale: var(--scale-105); } }
  .pressable:active { scale: var(--scale-95); }
  ```
- Menus and dialogs enter from `scale-95 opacity-0` to `scale-100 opacity-100`, with `origin-top` for menus that drop down.
- Centre an absolutely positioned element with `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
- Rotate disclosure chevrons with `rotate-180` (or `-rotate-90`) instead of swapping icons.
- Animate `translate` and `scale`, not `top` or `width`: they don't trigger layout. Don't use `zoom` for animation.
- Respect reduced motion: drop large movements and 3D flips when the viewer prefers reduced motion.

## Page layout

How to lay out a page: the breakpoints it adapts at, the containers that hold its content, and the spacing between its parts. The tokens and classes are in Layout under Utility classes; this is how to use them together.

**Breakpoints**

Design for a phone first, then add what changes on wider screens. The five breakpoints are minimum widths:

| Breakpoint | From | Layout it usually gets |
| --- | --- | --- |
| (none) | 0 | One column. Navigation behind Navbar's menu button. 16px side padding. |
| `sm` | 640px | Still one column; forms and cards can sit two to a row. 24px side padding. |
| `md` | 768px | Two columns. Navbar shows its links. |
| `lg` | 1024px | A Sidebar beside the content, or three columns of cards. 32px side padding. |
| `xl` | 1280px | Content reaches its container's width; extra space goes to the margins. |
| `2xl` | 1536px | Only for dense data: wide tables, dashboards. |

- Change the layout where the content needs it, not at every breakpoint. Two or three changes are usually enough.
- Test at 320px wide. WCAG 1.4.10 asks that content reflows without scrolling sideways at that width (400% zoom on a 1280px screen); only data tables, maps and diagrams may scroll.
- For a component that sits in places of different widths (a card in a sidebar and in the main column), let its width decide, not the screen's: Grid's `columns="auto"` and `minColumnWidth`, or a container query (`@container`).

**Containers**

Wrap each band of the page (header, main content, footer) in a Container of the same `size`, so their edges line up.

| Content | Container | Max content width |
| --- | --- | --- |
| Articles, help pages, settings forms | `size="prose"` | 672px, about 70 characters a line |
| A page of cards or a form with a side panel | `size="lg"` | 1024px |
| Most app pages (the default) | `size="xl"` | 1280px |
| Dashboards and wide tables | `size="2xl"` | 1536px |
| A layout that brings its own margins, such as a full-bleed hero | `size="full"` | none |

- Keep reading text within `prose` width even on a wide page: put a long description in its own `prose` block.
- The maximum is the content's: the side padding sits outside it, and grows to the screen's safe area where a notch is. The padding follows the screen's width, so in a narrow pane use `padded={false}` and pad the pane itself.
- Don't nest Containers. Inside one, lay things out with Stack and Grid.
- An app shell (Sidebar and Navbar) fills the window; put a Container inside the content area, not around the shell.

**Spacing rhythm**

Use spacing to show what belongs together: the closer two things are, the more related they look. Pick from a few steps of the spacing scale and use them the same way on every page.

| Between | Step | Size |
| --- | --- | --- |
| An icon and its label; a label and its control | `1` to `2` | 4–8px |
| Fields in a form; items in a list; lines of a card | `3` to `4` | 12–16px |
| Groups inside a section; cards in a grid | `6` | 24px |
| A section's heading and the groups under it | `4` to `6` | 16–24px |
| Sections of a page | `8` to `12` | 32–48px |
| The page header and the content; bands on a marketing page | `12` to `16` | 48–64px |

- Space inside a group is always smaller than the space between groups. If two gaps are equal, the groups stop reading as groups.
- Pad the container and gap its children: a Card has `p-6`, and its contents sit in a Stack with `gap={3}` or `gap={4}`. Don't add margins to each child.
- On small screens, step the big gaps down one step: `gap-8 md:gap-12`.
- Compact density (`data-density="compact"`) shrinks controls, not the page's spacing. For a denser table or list, choose smaller gaps on purpose.

**A typical app page**

```jsx
<div style={{ display: 'flex', minHeight: '100vh' }}>
  <Sidebar header={<Logo />}>…</Sidebar>
  <Container as="main" size="xl" className="py-8">
    <Stack gap={8}>
      <Stack gap={2}><Heading level={1}>Projects</Heading><Text tone="muted">12 active</Text></Stack>
      <Grid columns="auto" gap={6}>{cards}</Grid>
    </Stack>
  </Container>
</div>
```

## Layout

Layout scales as tokens, and layout utilities as classes in `bundle.css` (`.container`, `.flex`, `.grid`, `.sticky`, `.z-30`, `.aspect-video`, `.overflow-hidden`…).

**Breakpoints** — mobile first: styles apply from the breakpoint up.

| Token | Min width | Typical screens |
| --- | --- | --- |
| `screen-sm` | 640px | Large phones in landscape, small tablets |
| `screen-md` | 768px | Tablets |
| `screen-lg` | 1024px | Laptops |
| `screen-xl` | 1280px | Desktops |
| `screen-2xl` | 1536px | Large desktops |

**Responsive classes** — put a breakpoint in front of a layout class to apply it from that width up: `sm:` `md:` `lg:` `xl:`. These four are the only prefixes: there are no `hover:`, `focus:`, `active:` or `dark:` classes, so write those states in your own CSS (the themes already handle dark). Start with the phone layout and add what changes on wider screens:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">…</div>
<nav class="hidden md:flex items-center gap-4">…</nav>
<h1 class="text-2xl md:text-4xl">…</h1>
```

Responsive versions exist for the classes that shape a layout: display; flex direction, wrap, grow and shrink; `grid-cols-*`, `col-span-*`, `order-*`; `items-*`, `justify-*`, `self-*`; `gap-*` and padding (`p-`, `px-`, `py-`, `pt-`, `pr-`, `pb-`, `pl-`) at every spacing step; auto margins; `w-auto`, `w-full`, `w-fit`, width fractions, `max-w-*`, `h-auto`, `h-full`; `text-xs` … `text-9xl` and text alignment; position and overflow. Colors, borders and effects have none: they rarely change with screen width, and components handle their own states. For anything else, write a media query with the breakpoint's value (`@media (min-width: 768px)`); CSS variables don't work inside `@media`.

**Container** — `.container` is full width and snaps its max-width to the current breakpoint (640, 768, 1024, 1280, 1536px). It isn't centered and has no padding: add `margin-inline: auto` and a side padding such as `spacing-4` (16px), or `spacing-6` from `md` up.

**Z-index layers** — page-level layers have names, so every menu, dialog and toast stacks the same way. Use them as classes (`z-modal`) or in CSS (`var(--z-modal)`):

| Token | Value | Layer |
| --- | --- | --- |
| `z-sticky` | 20 | Sticky headers, toolbars and side navigation |
| `z-dropdown` | 30 | Dropdown menus and select lists, above sticky bars |
| `z-overlay` | 40 | The `overlay` backdrop behind a dialog |
| `z-modal` | 50 | Dialogs and drawers |
| `z-popover` | 60 | Popovers opened from inside a dialog |
| `z-toast` | 70 | Toasts, above dialogs |
| `z-tooltip` | 80 | Tooltips, above everything |

The numbered steps `z-0` … `z-50` and `z-auto` are for local stacking inside one component (a badge over an avatar), not for page layers.

**Aspect ratio** — `aspect-auto`, `aspect-square` (1 / 1) for avatars and thumbnails, `aspect-video` (16 / 9) for media.

**Columns** — `columns-1` to `columns-12` set a column count; `columns-3xs` (256px) to `columns-7xl` (1280px) fit as many columns as possible of at least that width. Use them for masonry-style lists; use grid for app layouts.

**Every layout utility** in `bundle.css`:

| Property | Classes |
| --- | --- |
| aspect-ratio | `aspect-auto`, `aspect-square`, `aspect-video` (tokens) |
| columns | `columns-1`…`12`, `columns-3xs`…`7xl` (tokens), `columns-auto` |
| break-after / break-before | `break-after-auto` `-avoid` `-all` `-avoid-page` `-page` `-left` `-right` `-column` (and `break-before-*`) |
| break-inside | `break-inside-auto` `-avoid` `-avoid-page` `-avoid-column` |
| box-decoration-break | `box-decoration-clone`, `box-decoration-slice` |
| box-sizing | `box-border`, `box-content` |
| display | `block` `inline-block` `inline` `flex` `inline-flex` `grid` `inline-grid` `contents` `flow-root` `list-item` `hidden`, `table` `inline-table` `table-caption` `table-cell` `table-column` `table-column-group` `table-footer-group` `table-header-group` `table-row-group` `table-row`, `sr-only` `not-sr-only` |
| float / clear | `float-left` `-right` `-start` `-end` `-none`; `clear-left` `-right` `-start` `-end` `-both` `-none` |
| isolation | `isolate`, `isolation-auto` |
| object-fit / object-position | `object-contain` `-cover` `-fill` `-none` `-scale-down`; `object-top-left` `-top` `-top-right` `-left` `-center` `-right` `-bottom-left` `-bottom` `-bottom-right` |
| overflow | `overflow-auto` `-hidden` `-clip` `-visible` `-scroll`, and `overflow-x-*`, `overflow-y-*` |
| overscroll-behavior | `overscroll-auto` `-contain` `-none`, and `overscroll-x-*`, `overscroll-y-*` |
| position | `static` `fixed` `absolute` `relative` `sticky` |
| top / right / bottom / left | `inset-<step>`, `inset-x-` `-y-` `-s-` `-e-` `-bs-` `-be-`, `top-` `right-` `bottom-` `left-` `start-` `end-` for every spacing step, fractions (`top-1/2`), `-full`, `-px`, `-auto`, and negatives (`-top-2`); `start-` and `end-` are the same as `inset-s-` and `inset-e-`, and follow the text direction |
| visibility | `visible` `invisible` `collapse` |
| z-index | `z-0` … `z-50`, `z-auto`, named layers `z-sticky` … `z-tooltip` (tokens), negatives `-z-10` |
| containment | `contain-none` `-content` `-strict` `-size` `-inline-size` `-layout` `-paint` `-style` (the last five combine); `@container` and `@container-normal` mark a container for container queries |

For responsive changes, write your own media queries with the breakpoint values.

## Flexbox and grid

Flexbox and grid utilities, as classes in `bundle.css`. Most are keywords; the few values that aren't on another scale are tokens in the `flexGrid` group (`flex-auto`, `grid-auto-fr`, `order-first`…). `order-first` and `order-last` are -9999 and 9999.

| Property | Classes |
| --- | --- |
| flex-basis | `basis-<spacing>`, `basis-1/2` (fractions), `basis-xs`…`basis-7xl` (container), `basis-auto`, `basis-full` |
| flex-direction | `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` |
| flex-wrap | `flex-nowrap`, `flex-wrap`, `flex-wrap-reverse` |
| flex | `flex-1`…`flex-12`, fractions `flex-1/2`…`flex-11/12`, `flex-auto`, `flex-initial`, `flex-none` |
| flex-grow / flex-shrink | `grow`, `grow-0`…`grow-12`, `shrink`, `shrink-0`…`shrink-12` |
| order | `order-1`…`order-12`, `-order-*`, `order-first`, `order-last`, `order-none` |
| grid-template-columns / rows | `grid-cols-1`…`12`, `grid-rows-1`…`12`, `-none`, `-subgrid` |
| grid-column / grid-row | `col-span-1`…`12`, `col-span-full`, `col-start-1`…`13`, `col-end-1`…`13`, `-auto` (and `row-*` the same) |
| grid-auto-flow | `grid-flow-row`, `-col`, `-dense`, `-row-dense`, `-col-dense` |
| grid-auto-columns / rows | `auto-cols-auto`, `-min`, `-max`, `-fr`, `-<spacing>` (and `auto-rows-*`) |
| gap | `gap-<spacing>`, `gap-x-<spacing>`, `gap-y-<spacing>` |
| justify-content | `justify-start`, `-end`, `-center`, `-between`, `-around`, `-evenly`, `-stretch`, `-normal`, `-center-safe`, `-end-safe` |
| justify-items / justify-self | `justify-items-*`, `justify-self-*` (start, end, center, stretch, normal/auto, safe variants) |
| align-content | `content-start`, `-end`, `-center`, `-between`, `-around`, `-evenly`, `-baseline`, `-stretch`, `-normal`, `-center-safe`, `-end-safe` |
| align-items / align-self | `items-*`, `self-*` (start, end, center, baseline, baseline-last, stretch, auto, safe variants) |
| place-content / items / self | `place-content-*`, `place-items-*`, `place-self-*` |

The `-safe` variants (`justify-center-safe`, `items-end-safe`…) fall back to the start when the content doesn't fit, so nothing overflows out of reach.

Rules of thumb:

- One dimension (a row of buttons, a toolbar, a stack) → flex. Two dimensions (cards, dashboards, forms) → grid.
- Space children with `gap-*` from the spacing scale, not margins: `gap-2` inside controls, `gap-4` between related items, `gap-6`–`gap-8` between groups.
- Card grids: `grid grid-cols-1 gap-4`, widening with media queries to 2, 3 or 4 columns. Equal columns use `minmax(0, 1fr)`, so long content can't stretch them.
- Push one item to the end of a row with `ms-auto` or `justify-between`; center anything with `place-items-center`.
- Avoid `order-*` for content that's read in sequence: screen readers and keyboard focus follow the source order, not the visual one.

## Sizing

The full sizing set: **width**, **min-width**, **max-width**, **height**, **min-height**, **max-height**, **inline-size**, **min-inline-size**, **max-inline-size**, **block-size**, **min-block-size** and **max-block-size**. Every one takes the same scale, so tokens hold the scale once and `bundle.css` has a class for each property × value.

| Property | Class prefix |
| --- | --- |
| width / min-width / max-width | `w-` / `min-w-` / `max-w-` |
| height / min-height / max-height | `h-` / `min-h-` / `max-h-` |
| inline-size / min / max | `inline-` / `min-inline-` / `max-inline-` |
| block-size / min / max | `block-` / `min-block-` / `max-block-` |
| width and height together | `size-` |

Inline and block sizes follow the writing direction: in left-to-right horizontal text, inline is width and block is height. Prefer them in components that must work in other writing modes. `.block` and `.inline` (display) stay separate from `.block-*` and `.inline-*` (size).

**The scale**

- **Numbers** — the spacing scale: `w-4` = `spacing-4` (16px), `h-10` = 40px, `block-8` = 32px. Every spacing step from `0` to `96` exists for every prefix.
- **Container sizes** (width-axis prefixes only) — tokens `container-3xs` (256px) to `container-7xl` (1280px): `max-w-md`, `inline-lg`, `min-w-xs`…
- **Fractions** — `1/2`, thirds, quarters, fifths, sixths and twelfths (tokens `sizing-1-2` … `sizing-11-12`). In CSS the slash is escaped: `.w-1\/2`.
- **Keywords** — `auto` (not for max), `px`, `full`, `screen` (100vw on the inline axis, 100vh on the block axis), `dvw`/`dvh`, `lvw`/`lvh`, `svw`/`svh`, `min`, `max`, `fit`, `none` (max only) and `lh` (one line, height axis).

**Container scale**

| Token | Value | Use |
| --- | --- | --- |
| `container-3xs` | 16rem (256px) | Narrow popovers, sidebars |
| `container-2xs` | 18rem (288px) | Sidebars, filter panels |
| `container-xs` | 20rem (320px) | Small dialogs, popover cards |
| `container-sm` | 24rem (384px) | Sign-in forms, narrow dialogs |
| `container-md` | 28rem (448px) | Standard dialogs |
| `container-lg` | 32rem (512px) | Wide dialogs, forms |
| `container-xl` | 36rem (576px) | Side panels, form pages |
| `container-2xl` | 42rem (672px) | Settings pages, long forms |
| `container-3xl` | 48rem (768px) | Article and document bodies with images |
| `container-4xl` | 56rem (896px) | Content pages |
| `container-5xl` | 64rem (1024px) | Dashboards with a sidebar |
| `container-6xl` | 72rem (1152px) | Wide app layouts |
| `container-7xl` | 80rem (1280px) | Marketing and full app shells |
| `container-prose` | 65ch | `max-w-prose`: body text at about 65 characters per line |

Rules of thumb:

- Cap running text at `max-w-prose` so lines stay readable.
- Dialogs: `max-w-md` by default, `max-w-sm` for confirmations, `max-w-lg` or `max-w-xl` for forms.
- Page content: `max-w-7xl` centered, or `.container`.
- Use `min-h-dvh` rather than `h-screen` for full-height mobile layouts, so the browser bar doesn't cut the bottom off.
- Give flex and grid children that hold text `min-w-0`, so long words wrap instead of overflowing.


**Control heights** — every control at one size is the same height, so buttons, inputs and selects line up in a row. Components read these tokens; in your own markup use `h-control-sm`, `min-h-control-md` or `size-control-lg` (a square, for icon buttons).

| Token | Value | Use |
| --- | --- | --- |
| `control-height-sm` | 1.5rem (24px) | Small controls; the WCAG 2.2 AA minimum target |
| `control-height-md` | 2rem (32px) | Default buttons, inputs and selects |
| `control-height-lg` | 2.75rem (44px) | Large controls; the comfortable touch target (WCAG 2.5.5) |

## Motion

Motion explains a change: where a menu came from, that a press registered, that something is still loading. It never decorates and never makes anyone wait. Most of it takes 100–300ms.

**Should it animate?** Ask before choosing a duration. Motion earns its place by doing one of these, and only these:

- **Shows where something came from or went**: a menu growing from its button, a drawer sliding from its edge, a row gliding to its new place.
- **Confirms the hand was felt**: a press scaling down, a switch thumb travelling, a check popping in.
- **Shows that something is still happening**: a spinner, a placeholder's pulse, an indeterminate bar.
- **Joins two states that would otherwise jump**: a panel opening, an indicator sliding between segments, a fill arriving at its value.

If none fits, it doesn't move. How often someone sees it decides how much it may move:

| How often | Examples | Motion |
| --- | --- | --- |
| Hundreds of times a day | Typing, a key held in a list, hover across a toolbar, a menu opened again and again | None, or a color change at `motion-hover`. Never a delay, never a scale or slide that has to finish before the next one. |
| Many times a session | Opening a menu, popover or select; a toggle; a tab | Short: the `-sm` roles, `ease-enter` / `ease-exit`. |
| Now and then | A dialog, a drawer, a toast, a page's first list of results | The `-md` and `-lg` roles; a stagger is allowed here. |
| Rarely | A first-run hint, a task finished, an upload done | The one place for `ease-celebrate`. |

**Keyboard.** An action someone repeats from the keyboard (arrow keys through a list, a calendar or a tab list; Tab through a form; a shortcut) should answer at once: focus and selection move in the same frame, with no slide or fade to wait for. What a key opens or closes answers at once too: a menu, popover, combobox list or date or time picker opened by Enter, Space or an arrow is there in the first frame, and one closed by Escape is gone in the same frame. A pointer or a tap keeps the enter and the exit, because there the motion shows where the surface came from. The same goes for the Tabs line or fill and the SegmentedControl selection: picked by an arrow they jump, and clicked they slide. Each reads the last input through `src/internal/lastInput.ts` (the layers through `useExit`) and puts `data-instant` on itself, and its CSS leaves out the starting style and the exit transition under it.

**Turned down.** Examples of motion this system says no to, and why: a menu's items arriving one by one (people open menus all day, and the last item would be late every time); a hover lift on every card in a grid (the page shimmers as the pointer crosses it); a dialog that bounces as it opens (overshoot is for small things); a toast that wobbles (it would be the tenth one today); a delay before a dropdown opens on click (it reads as lag); a page fading in on every navigation (it slows what people do most).

**Reviewing motion.** A note on a pull request's motion says what it does now, what it should do, and which rule says so, so the change can be checked against the rule rather than a taste:

| Before | After | Why |
| --- | --- | --- |
| Menu items arrive one by one over 250ms | They appear with the menu | Opened many times a session: no stagger |
| The panel closes over `motion-enter-md` | It closes over `motion-exit-md` | An exit takes about two thirds of its enter |
| ArrowDown slides the highlight to the next option | The highlight moves in the same frame | A key repeated from the keyboard answers at once |

Transition and animation scales are tokens in one `transitions` group (`var(--duration-150)`, `var(--ease-out)`, `var(--animate-spin)`), with matching utility classes in `bundle.css` (`.transition`, `.duration-200`, `.ease-out`, `.animate-pulse`). Components use the **roles**. A role names what is moving rather than how long it takes, and points at a step of the scale, so one change to a role moves every component that uses it.

**Roles**

| Role | Today | What moves |
| --- | --- | --- |
| `motion-press` | `duration-100` | A control answering while it's held down (Button scales down). |
| `motion-release` | `duration-300` | A press let go coming back to size with `ease-enter`, settling with no overshoot (Button, Badge). |
| `motion-hover` | `duration-150` | Hover and focus changes on a control that stays put: colors, borders, shadows. |
| `motion-enter-sm` | `duration-150` | A small surface appearing: tooltips, popovers, menus, date pickers. |
| `motion-enter-md` | `duration-200` | A medium surface appearing: dialogs, toasts. |
| `motion-enter-lg` | `duration-300` | A large surface appearing: drawers, sheets. |
| `motion-exit-sm` / `-md` / `-lg` | `duration-100` / `150` / `200` | The same surfaces leaving. |
| `motion-change-sm` | `duration-150` | A small part changing in place: a chevron turning, a slider thumb growing, a row gliding to its place. |
| `motion-change-md` | `duration-200` | A panel opening or collapsing in place, an indicator sliding: Accordion, Sidebar, SegmentedControl, Tabs. |
| `motion-change-lg` | `duration-300` | Something travelling far: a progress or meter fill moving to its value, a carousel slide. |
| `motion-loop-spinner` | `duration-700` | One turn of a spinner, the one spinner speed: Loader's ring (and so Button, Badge and SearchInput), Switch and the circular Progress while they load. Under reduced motion they stand still and breathe over twice this. |
| `motion-loop-placeholder` | `duration-1000` | One pass of a loading placeholder's pulse (Image while it loads). |
| `motion-loop-blink` | `duration-1000` | One blink of a text caret (PinInput). |
| `motion-loop-progress` | `duration-1200` | One pass of an indeterminate progress bar. |
| `motion-ripple` / `motion-ripple-fade` | `duration-500` / `300` | Kept for your own press ripples; no component uses them since Button and Badge dropped theirs. |
| `motion-stagger` | `delay-50` | The gap between items of a group arriving one after another: list rows, toasts, grid cards. |
| `motion-stagger-limit` | `delay-300` | The longest any staggered item waits, so a long list still arrives within a moment. |
| `motion-sequence` | `delay-50` | The offset between the steps of one entrance: a dialog's or drawer's backdrop starts, then its panel. Exits don't sequence. |
| `ease-enter` | `ease-out-quart` | Something appearing: quick off the mark, then a long smooth landing. |
| `ease-exit` | `ease-out-quart` | Something leaving: at full speed from the first frame, then easing off as it fades. An ease-in starts slowly, and the first frames after a close are the ones people watch, so closing felt sluggish. |
| `ease-move` | `ease-in-out-cubic` | Something that stays on screen and changes: a thumb sliding, a panel resizing, a color changing. |
| `ease-settle` | `ease-out-expo` | Something arriving at a new value or let go by the hand: a fill, a slide, a drawer dropped. Most of the travel at once, then a long glide to rest. |
| `ease-pop` | `ease-out-back` | Something small popping into place: a check mark, a count, a dot. Overshoots by about 4%, then settles. |
| `ease-spring` | `ease-spring-snappy` | A press let go springing back, or a thumb or indicator landing: a real spring that overshoots and settles. |
| `ease-fling` | `ease-out-cubic` | Something the hand let go of mid-motion carrying on to rest at the hand's speed: a drawer or carousel slide flicked. |
| `ease-celebrate` | `ease-elastic` | A small, rare moment worth celebrating: a success check landing, a count bumping, an item snapping into its slot after a drag. Wobbles, then settles. |

`tools/test/motion-tokens.mjs` fails component CSS that writes its own duration, delay or easing (a `250ms`, a `cubic-bezier()`) instead of a token, and component CSS that takes the scale itself (`var(--duration-150)`, `var(--ease-in-out)`) instead of a role; `duration-0` and `ease-linear` are allowed, and what hasn't moved to a role yet is listed in the check. It also checks that each role names a step of the scale and that every exit is shorter than its enter.

**Waits.** Some waits live in JavaScript, because CSS can't express them: how long before a spinner shows, or how long a tooltip waits for the pointer to rest. They are named once in `src/internal/timing.ts`, so two that must agree can't drift apart. For example, Button's busy wait is Loader's default delay. The `serupa/no-literal-delay` lint rule fails a number written into a `setTimeout` or `setInterval` in a component.

| Wait | Value | What it's for |
|---|---|---|
| `spinnerDelay` | 300ms | Before a loading indicator appears, so a quick wait doesn't flash one: Loader's default `delay`, Button's `loading`. |
| `spinnerMinShown` | 500ms | Once a loading indicator shows, it stays at least this long. |
| `feedbackHold` | 2000ms | How long a "done" state holds: Button's `successText`, CopyButton's "Copied". |
| `hoverIntent` | 400ms | The pointer rests this long before a tooltip shows (Tooltip's default `delay`). |
| `hoverLeave` | 100ms | A tooltip waits this long after the pointer leaves, so moving onto it keeps it open. |
| `hoverWarm` | 300ms | After a tooltip closes, the next one opens at once for this long. |
| `cardIntent` | 500ms | The pointer rests this long on a link, or focus stays on it, before its HoverCard opens (its default `openDelay`). |
| `cardLeave` | 300ms | A HoverCard waits this long after the pointer or focus leaves it and its link (its default `closeDelay`). |
| `submenuIntent` | 150ms | The pointer rests this long on a menu item before its submenu opens or closes. |
| `typingPause` | 250ms | Typing pauses this long before Combobox's `loadOptions` runs (its default `debounce`). |
| `announcePause` | 700ms | Combobox waits this long after the options change before saying how many there are. |
| `quickArrival` | 250ms | A picture that arrives this soon after mount appears without Image's fade. |
| `holdDelay`, `holdRepeat` | 400ms, 50ms | A held NumberInput step button waits, then repeats. |
| `clickAfterDrag` | 500ms | After a Splitter drag, the click the browser sends is ignored for this long. |
| `repeatQuiet` | 1000ms | The same toast again within this long is a repeat, not a new toast. |
| `relativeTick` | 15s | How often RelativeTime refreshes. |

**Timing**

- Bigger surfaces take longer, because they travel further: a tooltip enters in 150ms, a dialog in 200ms, a drawer in 300ms.
- An exit takes about two thirds of its enter. What was closed should get out of the way, and nobody waits to watch it go.
- Feedback for an action (a press, a toggle, a check) starts within a frame and takes 100ms or less, so the control feels like it answered the hand.
- Nothing over 300ms answers a click. `duration-500` and longer are for loops and large page-level changes only.

**Easing.** Most of what makes motion feel smooth is its curve. Enter with `ease-enter`, leave with `ease-exit`, change in place with `ease-move`, and arrive at a new value with `ease-settle`. Pop small things into place with `ease-pop`, and let a press go with `ease-spring`. Spinners and progress bars turn at constant speed (`ease-linear`). Steps (`steps()`, `step-end`) are for ticking spinners.

- **Exits ease out too.** A closed surface should be mostly gone in the first frames, because that is when the eye is on it. An ease-in spends those frames barely moving and saves its speed for the end, when nobody is watching any more. So `ease-exit` is the same strong ease-out as `ease-enter`, over the shorter exit duration. Keep the `ease-in-*` curves for something that leaves and keeps going off the screen, like a toast swiped away.
- **Strength.** The curves come in three strengths: `cubic` is gentle, `quart` firm and `expo` hard. A stronger curve does more of its travel at the start of an ease-out (or the end of an ease-in), so the same duration feels quicker and smoother. Entering surfaces use `quart`, values arriving use `expo`.
- **Overshoot.** `ease-out-back` passes the end by about 4% and comes back; keep it for small things (a check, a dot, a count), never a dialog or a page.
- **Elastic.** `ease-elastic` wobbles: it overshoots by about 37%, swings back and settles over a few bounces. It's delightful once and tiring the tenth time, so it has its own role, `ease-celebrate`, and rules. Use it for a small thing at a rare, good moment: a success check landing, a count bumping, an item dropped into its slot, a first-run hint arriving. Give it `motion-change-lg` or longer so the wobble reads. Never use it for surfaces (menus, popovers, dialogs, drawers), for page or layout moves, for hover or press, or for anything people do over and over. Animate `scale` or `translate`, not size. Under reduced motion it's off, like every overshoot.
- **Springs.** `ease-spring-soft` and `ease-spring-snappy` are damped springs written as CSS `linear()`, generated by `tools/tokens/spring.mjs` (damping ratio 0.85 and 0.6). A spring settles in the duration you give it, so give it about twice the motion it answers: a press held for `motion-press` springs back over `motion-change-md`. Browsers without `linear()` (before Chrome 113, Safari 17.2, Firefox 112) use their default `ease`, which still arrives.
- **Fling.** What the hand lets go of mid-motion (a drawer swiped, a carousel flicked) carries on at the hand's speed and slows to rest, instead of jumping to a speed of its own. The speed is the pointer's over its last 100ms, and the settle runs on `ease-fling` for 3 × distance ÷ speed, since that curve starts at three times its average speed (between 150 and 400ms).
- **Interruptible.** Animate opening and closing with transitions, not keyframes. A transition turns around from where it is when the state flips half way (a menu closed while it opens), where a keyframe animation jumps to its start. The overlays enter from `@starting-style` for this reason.

**Sequencing.** Animate one thing at a time where you can. When a group must arrive together, as with a page's first list of results or a loader's dots, stagger them by `motion-stagger` (50ms) and cap the wait at `motion-stagger-limit` (300ms), so items past the sixth arrive together. Stagger only a group seen now and then: never a menu's items or a stack of toasts, which people open over and over and would wait for every time. The `stagger` utility does this: put it on the parent, and each child gets `animation-delay` and `--dk-stagger-delay` (for a transition of your own) from its place, with `sibling-index()` where the browser has it. A surface's content appears with it, never after it. Hover and focus changes start at once (no delay). Tooltips wait 400ms before showing (their `delay` prop), so passing the pointer over a toolbar doesn't flash them.

**Layout changes.** When things move to a new place (a list reordered or filtered, a card expanded, a grid switched to a list), let them glide there instead of jumping: run the change inside `withViewTransition(() => …)` and mark what should travel with `view-transition-name`, or the `view-transition-match` class, which names each element after itself. The browser does the measuring (FLIP), off the main thread, over `motion-change-md` with `ease-move` (set for every View Transition in `base.css`). Under reduced motion nothing travels; the old and new states crossfade. Where View Transitions are missing the change just happens. `view-transition-none` keeps an element out of it.

**Performance.** Animate `opacity`, `transform`, `translate`, `scale` and `rotate`, which the compositor runs without laying the page out again. Animate colors only on small controls. Never animate `width`, `height`, `top`, `left`, margins or padding, and avoid `transition-all`, which animates them too. The one exception is a disclosure panel's height (Accordion), where a jump of everything below reads as a glitch: one panel, only while it moves, never under reduced motion.

**Reduced motion.** When the viewer prefers reduced motion (`prefers-reduced-motion: reduce`), surfaces appear and leave with a fade or not at all, with no sliding or scaling. Loops stop moving: the components' spinners stand still and breathe (opacity) over twice `motion-loop-spinner`, so progress still shows, because a spinner that stops completely reads as stuck; the `animate-spin` utility turns three times slower (`animate-spin-reduced`). `bundle.css` stops `ping`, `pulse` and `bounce`, slows `spin`, turns `animate-enter` into a plain fade and drops the `stagger` delays. Every component's own animations do the same, and yours should too.

**Scales.** These are what the roles point at, and what utility classes use.

- **Duration:** `duration-0`, `75`, `100`, `150`, `200`, `300`, `500`, `700`, `1000`, `1200` (ms).
- **Easing:** `ease-linear`, `ease-in` (`cubic-bezier(0.4, 0, 1, 1)`), `ease-out` (the same curve as `ease-out-quart`), and `ease-in-out` (the same curve as `ease-in-out-cubic`, the default for the `transition` classes); `ease-out-cubic`, `-quart`, `-expo`, `ease-in-cubic`, `-quart`, `-expo` and `ease-in-out-cubic`, `-quart`, `-expo`; `ease-out-back`; and the springs `ease-spring-soft`, `ease-spring-snappy` and `ease-elastic`.
- **Delay:** `delay-0` to `delay-1000`, in the same steps as duration, plus `delay-50` for a stagger step.

**Transition properties** — `transition` (the default set: colors, outline and gradient stops, opacity, shadow, transform and translate/scale/rotate, filters, and discrete properties like `display`), `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform`, `transition-all`, `transition-none`. Each animates at `duration-150` with `ease-in-out` unless a `duration-*` or `ease-*` class says otherwise, whatever the class order; `duration-initial` and `ease-initial` go back to those defaults. Name the properties you animate; avoid `transition-all` in components because it also animates layout.

**Transition behavior** — `transition-normal`, `transition-discrete`. `transition-discrete` lets `display`, `visibility` and other discrete properties take part, for fading an element in from `hidden`.

**Animations**

| Token | Value | Use |
| --- | --- | --- |
| `animate-spin` | `spin 1s linear infinite` | Turning things: refresh icons, simple spinners. (The Loader component has its own, livelier ring.) |
| `animate-ping` | `ping 1s cubic-bezier(0, 0, 0.2, 1) infinite` | A radar ping behind a notification dot or live badge. |
| `animate-pulse` | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` | Skeleton placeholders while content loads. |
| `animate-bounce` | `bounce 1s infinite` | A scroll-down hint. Use sparingly. |
| `animate-enter` | `enter` over `motion-enter-md` with `ease-enter` | Content arriving: it fades in as it rises 8px into place. With `stagger` on the parent, the items arrive one after another. Under reduced motion it only fades. |
| `animate-none` | `none` | Turns an animation off. |

The `spin`, `ping`, `pulse`, `bounce`, `enter` and `fade-in` keyframes ship in `bundle.css`.

```html
<ul class="stagger">
  <li class="animate-enter">Arrives first</li>
  <li class="animate-enter">50ms later</li>
  <li class="animate-enter">100ms later</li>
</ul>
```

## SVG

SVG utilities, as classes in `bundle.css`. Colors come from the palette and alias tokens; stroke widths are the `stroke-width-*` tokens in the `borders` group.

| Property | Classes | Tokens |
| --- | --- | --- |
| fill | `fill-<color>` for every palette color and alias, `fill-none` `fill-current` `fill-inherit` `fill-transparent` | color tokens |
| stroke | `stroke-<color>`, `stroke-none` `stroke-current` `stroke-inherit` `stroke-transparent` | color tokens |
| stroke-width | `stroke-0` `stroke-1` `stroke-2` `stroke-3` `stroke-4` (in the SVG's own units, so they scale with the drawing) | `stroke-width-*` |

Rules of thumb:

- Inline icons and logos: `fill-current` (or `stroke-current` for outline art) so they take the text color, then color the parent with `text-*` aliases. That keeps them in step with the theme.
- Use alias colors (`fill-primary`, `stroke-border`, `fill-success`) for meaning; palette colors are for illustrations and charts.
- Outline drawings: `fill-none stroke-current stroke-2`. Because the width is in the SVG's units, a 24-unit icon drawn at 48px gets a 4px line; add `vector-effect="non-scaling-stroke"` on the shapes for a fixed width.
- The system's icons (Material Symbols and custom icons) already fill with `currentColor`: color them with `text-*` on the icon or its parent.

## States

Every interactive component moves through the same seven states, in this order of precedence (a later one wins):

| State | When | How it looks | Tokens |
| --- | --- | --- | --- |
| Rest | Nothing is happening | The component's own colors | — |
| Hover | A pointer is over it (`:hover`, only on devices that hover) | A neutral fill (`secondary`, `surface-muted` or `highlight`), or darker text | `secondary`, `surface-muted`, `highlight` |
| Pressed | It's held down (`:active`, or Space and Enter on a Button) | One step past hover: `pressed` for rows, tabs, days and page buttons; filled buttons shrink slightly instead | `pressed`, `--button-press-scale` |
| Focus | Keyboard focus (`:focus-visible`) | A 2px `focus-ring` outline, 2px out (inset where the box clips it) | `focus-ring`, `focus-ring-width`, `focus-ring-offset` |
| Selected | It's the current choice (`aria-selected`, `aria-current`, `aria-checked`, `aria-pressed`) | `primary` fill or indicator, or `highlight` for the current page in a list | `primary`, `on-primary`, `highlight` |
| Disabled | It can't be used (`disabled`, `aria-disabled`) | The whole thing at `opacity-disabled`, with a `not-allowed` cursor and no hover or pressed | `opacity-disabled` |
| Invalid | Its value is wrong (`aria-invalid`) | A `danger` border or edge, with a danger focus ring; the fill stays, so on and off still read correctly | `danger`, `danger-text` |

Focus shows on top of every other state, and disabled turns hover and pressed off. A component's README lists its own values under "States".

## Interactivity

Interactivity utilities, as classes in `bundle.css`. They add no tokens: colors come from the palette and alias tokens, `scroll-m-*` and `scroll-p-*` use the spacing scale, and the rest are keywords.

| Property | Classes |
| --- | --- |
| accent-color | `accent-<color>` for every palette color and alias, `accent-auto` `accent-inherit` `accent-current` `accent-transparent` |
| appearance | `appearance-none` `appearance-auto` |
| caret-color | `caret-<color>`, `caret-inherit` `caret-current` `caret-transparent` |
| color-scheme | `scheme-normal` `scheme-light` `scheme-dark` `scheme-light-dark` `scheme-only-light` `scheme-only-dark` |
| cursor | `cursor-auto` `-default` `-pointer` `-wait` `-text` `-move` `-help` `-not-allowed` `-none` `-context-menu` `-progress` `-cell` `-crosshair` `-vertical-text` `-alias` `-copy` `-no-drop` `-grab` `-grabbing` `-all-scroll` `-col-resize` `-row-resize` `-n-resize` `-e-resize` `-s-resize` `-w-resize` `-ne-resize` `-nw-resize` `-se-resize` `-sw-resize` `-ew-resize` `-ns-resize` `-nesw-resize` `-nwse-resize` `-zoom-in` `-zoom-out` |
| field-sizing | `field-sizing-fixed` `field-sizing-content` (inputs and textareas that grow with their content) |
| pointer-events | `pointer-events-auto` `pointer-events-none` |
| resize | `resize` `resize-x` `resize-y` `resize-none` |
| scroll-behavior | `scroll-smooth` `scroll-auto` |
| scrollbar-color | `scrollbar-thumb-<color>` and `scrollbar-track-<color>` (set both; the other defaults to transparent) |
| scrollbar-width | `scrollbar-auto` `scrollbar-thin` `scrollbar-none` |
| scrollbar-gutter | `scrollbar-gutter-auto` `scrollbar-gutter-stable` `scrollbar-gutter-both` |
| scroll-margin | `scroll-m-<step>` and sides `scroll-mx-` `-my-` `-ms-` `-me-` `-mbs-` `-mbe-` `-mt-` `-mr-` `-mb-` `-ml-` for every spacing step; negatives |
| scroll-padding | `scroll-p-<step>` and sides `scroll-px-` `-py-` `-ps-` `-pe-` `-pbs-` `-pbe-` `-pt-` `-pr-` `-pb-` `-pl-` |
| scroll-snap-align | `snap-start` `snap-end` `snap-center` `snap-align-none` |
| scroll-snap-stop | `snap-normal` `snap-always` |
| scroll-snap-type | `snap-x` `snap-y` `snap-both` `snap-none`, with `snap-mandatory` or `snap-proximity` (default) |
| touch-action | `touch-auto` `touch-none` `touch-manipulation`, `touch-pan-x` `-pan-left` `-pan-right` `-pan-y` `-pan-up` `-pan-down` `-pinch-zoom` (these combine) |
| user-select | `select-none` `select-text` `select-all` `select-auto` |
| will-change | `will-change-auto` `-scroll` `-contents` `-transform` |

Rules of thumb:

- Cursors: `cursor-pointer` on anything clickable that isn't a link (Button does this), `cursor-not-allowed` when disabled, `cursor-progress` while loading, `cursor-grab`/`cursor-grabbing` on draggable items, `cursor-text` on editable areas.
- Form controls: `accent-primary` makes checkboxes, radios, range sliders and progress bars match the theme; `caret-primary` colors the text cursor. Use `appearance-none` only when you redraw the control yourself, and keep its focus style.
- Dark themes: put `scheme-dark` on the root (or `scheme-light-dark`) so native scrollbars, inputs and date pickers turn dark too.
- `field-sizing-content` for comment boxes and tag inputs that should grow as people type; give them a `max-h-*`.
- Anchors under a sticky header: `scroll-mt-16` on the targets (or `scroll-pt-16` on the scrolling container) so the header doesn't cover them. Pair `scroll-smooth` with reduced-motion handling.
- Carousels: `snap-x snap-mandatory` on the track and `snap-start` (or `snap-center`) on each slide; `scrollbar-none` only if there are other controls.
- Scrollbars: `scrollbar-thin scrollbar-thumb-border-strong scrollbar-track-transparent` in dense panels; `scrollbar-gutter-stable` stops layouts from jumping when content starts to scroll.
- `pointer-events-none` on decorative overlays and icons inside inputs; never on something that should be reachable by keyboard, since it doesn't stop focus.
- `select-none` on drag handles and buttons, `select-all` on codes and IDs people copy.
- `touch-manipulation` on buttons removes the double-tap zoom delay; `touch-none` on canvases and sliders that handle gestures themselves.
- Use `will-change-transform` only while an animation runs, then remove it.

## Content and voice

How the words in a product built with the system should read: labels, hints, errors, empty states and the words the components say on their own. Write plainly, for someone who is busy and may be using a screen reader, a translation tool or a small screen.

**Voice**

- Plain and direct. Short sentences, everyday words, one idea per sentence.
- Say "you" to the person and talk about what they can do, not about the system.
- No "please", no "sorry" for routine things, no exclamation marks, no jokes in errors.
- Never blame the person. "That date is before the start date", not "You entered an invalid date".
- Point to things by their name, never by shape, color, position or sound alone: "Select Save", not "Select the button below"; "Check the start date", not "Fix the red field". Someone using a screen reader, a zoomed screen or a different layout can't see "below" or "red" (WCAG 1.3.3).
- Leave out words that tell the reader something should be quick for them: "simply", "just", "obviously", "of course", "easy". When it isn't quick for them, the word makes them feel slow; when it is, the word adds nothing. "Add an email address", not "Just add an email address".
- Use plain, neutral terms: "allow list" and "block list", not "whitelist" and "blacklist"; "main" and "replica" (or "primary" and "secondary"), not "master" and "slave".

**Capitalization and punctuation**

- Sentence case everywhere: titles, buttons, labels, menu items, tabs and column headings. "Save changes", not "Save Changes". Proper nouns keep their capitals.
- No full stop on a label, button, heading or single-line hint. Use one when a message has more than one sentence, and on Alert and Toast bodies.
- The ellipsis character (…), not three dots. Use it for something in progress ("Loading…", "Saving…") and on a menu item or button that asks for more before it acts ("Rename…").
- Avoid ampersands, slashes and abbreviations people have to decode: "and", "or", "for example".

**Buttons and links**

- Start with a verb that says what happens: "Save", "Send invite", "Delete project". Avoid "OK", "Yes", "Submit" and "Click here".
- Use the same verb in the title and the button: a dialog titled "Delete project?" has a "Delete" button, not "Confirm".
- A link says where it goes: "Billing settings", not "Learn more" on its own. If several links on a page would read the same, give each a distinct name.
- Icon-only buttons need a name (`aria-label`) that is the same verb you'd write on a text button.

**Labels and hints**

- A field label is a noun phrase: "Email", "Start date", "Project name". Don't use the placeholder as the label; it disappears as soon as someone types.
- A hint says what's expected before someone gets it wrong: "At least 12 characters", "As shown on your ID".
- Mark the exception, not the rule: if most fields are required, mark the optional ones (Field's `optional`).

**Errors**

Say what happened and how to fix it, in that order, next to the thing that needs fixing.

| Instead of | Write |
| --- | --- |
| Invalid input | Enter a date after 1 Jan 2026 |
| Error 413 | report.pdf is larger than 10 MB |
| This field is required | Enter your email |
| Something went wrong | We couldn't save your changes. Try again. |
| photo.heic: this type of file isn't accepted. | photo.heic isn't a PNG or JPG. |

- Put a field's error in Field's `error`, so it's tied to the control and read with it.
- If nothing the person does will fix it, say so and say what happens next: "We couldn't reach the server. Your changes are kept and will be sent when you're back online."
- Don't show an error while someone is still typing. Check on blur or on submit.

**Empty states and confirmations**

- An empty state says what will be here and how to add the first one: "No projects yet" and a "Create project" button.
- A confirmation names the thing and the consequence: "Delete Website redesign? Its 12 tasks are deleted too." Keep destructive confirmations for actions that can't be undone; for the rest, act and offer Undo in a Toast.

**Numbers, dates and units**

- Let the locale write them. `SerupaProvider`'s `locale` sets how the date and time components show and read dates; use `Intl.NumberFormat` and `Intl.DateTimeFormat` with the same locale for your own text.
- In English, write dates with the month as a word, "24 Oct 2026", so they can't be read as day-month or month-day. Use relative dates ("2 hours ago", "Yesterday") only where the exact time doesn't matter, and give the exact one in a tooltip or title.
- Numerals for every number, "3 files", not "three files". Group thousands ("12,400").
- A space between a number and its unit, "12 MB", "30 s", except % and °. `formatFileSize()` writes file sizes this way.
- Ranges with an en dash and no spaces: "1–5", "Mon–Fri".

**The words the components say**

Close buttons, loading text, pagination and the other built-in words come from one set, below. `<SerupaProvider labels>` replaces any of them for a subtree, and each component's own prop (`closeLabel`, `dismissLabel`, `loadingText`, …) still wins for one instance. `idLabels` is the full Indonesian set. `labels` and `icons` can be written inline (`labels={{ close: "Tutup" }}`): a re-render with the same contents doesn't re-render the components under the provider.

- Overlays close with "Close" (Dialog, Drawer); notices go away with "Dismiss" (Alert, Toast).
- Loading is "Loading…" everywhere; give a specific one when you can: `loadingText="Saving…"`.
- When you change one, keep the patterns above: a verb for a button, sentence case, no full stop.

## Accessibility standard

The target is **WCAG 2.2 level AA**, in all six themes, at any zoom up to 400%, with a keyboard, a screen reader, a touch screen, and in forced-colors (high-contrast) mode. The components meet their share of it; a page meets the rest only if the app does its part. This is who does what.

**What the system guarantees**

- **Contrast.** Text, placeholder, icon, control-border and focus-ring colors meet 4.5:1 or 3:1 in every theme; the foundation check measures every pair on every change. `data-contrast="more"` (or the system's "increase contrast" setting) raises body, muted, placeholder, status and brand-colored text to 7:1.
- **Keyboard.** Every component works with the keys its pattern in the ARIA Authoring Practices expects: Tab into it, arrows inside composite widgets (menus, tabs, lists, calendars), Enter and Space to act, Escape to close. Each README has a Keyboard table.
- **Focus.** Focus is always visible: a 2px ring in the brand color, plus an outline that survives forced colors. Inside a strong fill (`bg-primary`, `bg-danger`, `bg-surface-inverse`) the ring takes the fill's text color, so it still stands out at 3:1; a light surface nested inside such a fill should set `--focus-ring` back itself. Dialogs and drawers move focus in, keep it there, and return it to the button that opened them. Menus and lists return focus to their button when they close.
- **Names, roles and states.** Each component renders the right element or ARIA role and keeps `aria-expanded`, `aria-selected`, `aria-invalid`, `aria-current` and the rest in step. Built-in buttons have names (the words in Content and voice), and Field ties a control to its label, hint and error.
- **Announcements.** Loading, toasts and other status changes are announced through live regions that work inside an open Dialog too.
- **Target size.** Buttons, fields and other sized controls are at least 24px tall (2.5.8), including `sm` and compact density; `lg` is 44px for touch-first screens. A checkbox, radio or switch takes clicks on its label too; one without a visible label is smaller than 24px, so leave space around it (the spacing exception in 2.5.8).
- **Reflow and zoom.** Components fit a 320px-wide screen and wrap instead of clipping, and sizes are in `rem`, so text zoom works.
- **Fields on iOS.** Safari on iPhone and iPad zooms into a focused field whose text is under 16px. There, Input, Textarea and Select (and the components built on them) draw their own text at 16px at every size, keeping the box height. Don't stop the zoom with `maximum-scale=1` in the viewport tag: it also stops pinch zoom, which WCAG 1.4.4 needs.
- **Motion.** Under `prefers-reduced-motion`, components stop their animations and keep at most a short fade, and `base.css` makes every other transition on the page near-instant. Nothing flashes.
- **Forced colors and RTL.** Borders, focus and selected states stay visible in forced colors, and layouts use logical properties, so right-to-left languages mirror correctly.
- **Dragging.** Anything you can drag also works without dragging (2.5.7): Slider takes arrow keys and clicks on the track, and FileUpload has a Choose button.

These are checked on every change: axe on every Storybook story in every theme, the contrast pairs, and component tests for keyboard, focus, names and announcements.

**What the app must do**

The system can't know your content, your page structure or your flows. For a page to meet WCAG 2.2 AA, the app must:

- **Page.** Set `<html lang>`, a unique `<title>` per page, and landmarks: one `main` (Container `as="main"`), a `nav` per navigation (Navbar and Sidebar render one), a header and a footer. Add a "Skip to content" link.
- **Headings.** One `h1` per page and no skipped levels. Heading's `level` sets the element; its look can differ.
- **Names.** Give every field a visible label (Field), every IconButton a `label`, every meaningful Image `alt` text (and `alt=""` for decoration), and every link text that says where it goes.
- **Errors.** Write errors that say what's wrong and how to fix it, next to the field; on submit, move focus to the first error or a summary. Don't ask people to re-enter what they already gave in the same flow (3.3.7), and don't make sign-in depend on a memory or puzzle test (3.3.8).
- **Color.** Don't use color alone to carry meaning in your own content: charts, status dots and links in text need a second cue.
- **Focus in single-page apps.** After a route change, move focus to the new page's heading or `main`, and announce it. After deleting an item, move focus to the next item or the list.
- **Your own CSS.** Keep the focus ring (never `outline: none` alone), keep targets at 24px, and keep sticky headers from covering the focused element (`scroll-padding-top`).
- **Media and time.** Captions and transcripts for audio and video; a way to pause anything that moves for more than 5 seconds; a warning and a way to extend before a session times out.
- **Help.** Put help links and contact details in the same place on every page (3.2.6).
- **Test.** Use the keyboard alone through each flow, try a screen reader (VoiceOver, NVDA), zoom to 400%, and turn on forced colors. Automated checks find about a third of problems.

## Accessibility

Accessibility utilities, as classes in `bundle.css`. They add no tokens.

| Property | Classes |
| --- | --- |
| forced-color-adjust | `forced-color-adjust-auto` (default: the browser swaps in the viewer's high-contrast colors), `forced-color-adjust-none` (keep this element's own colors) |
| screen-reader only | `sr-only` (hidden on screen, still read aloud), `not-sr-only` (undo it, e.g. on focus) |

**Forced colors** is the high-contrast mode in Windows and some browsers: the viewer picks a small set of system colors and the browser replaces backgrounds, text and borders with them, and drops shadows and background images. The system's alias colors mean nothing there, so design for it:

- Leave `forced-color-adjust-auto` almost everywhere. Use `forced-color-adjust-none` only where the color *is* the content: color swatches and pickers, palette previews, charts with a legend, brand logos.
- Inside a `forced-color-adjust-none` element, add a border or text label so the meaning doesn't rely on color alone.
- Shadows and fills disappear, so anything that is only separated by a shadow or background needs a border too (`border` with a `transparent` color still draws in forced colors).
- Focus: use outlines (`outline-2 outline-focus-ring`) or `outline-hidden`, never `outline-none` alone — rings and shadows vanish in forced colors. Button keeps its ring and adds a transparent 2px outline on focus, which only shows in forced colors; its transparent border shows there too.

**Screen-reader text.** Give icon-only controls a name: an `aria-label`, or a `sr-only` span inside the button. For a "Skip to content" link, wrap it in `<VisuallyHidden focusable>`, which hides it until it's tabbed to and then shows it.
