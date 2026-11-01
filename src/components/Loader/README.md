# Loader

Shows that something is loading when you can't say how far along it is. Six looks: a **ring** (a quarter arc turning on a faint track), **spokes** (eight spokes ticking round a circle, like the iOS activity indicator), **dots** (three pulsing dots), **pixel** (a 3×3 grid of square pixels with a wave of light running through it), **text** (words with a shine sweeping through them) and **skeleton** (placeholder shapes where the content will be, with the same shine).

Called Spinner before 3.0.0: see the upgrade table in the changelog.

```jsx
const { Loader } = window.Serupa;

<Loader />                                   // ring, 24px, text color, "Loading…"
<Loader size="lg" />                         // a page or an empty area that is loading
<Loader variant="spokes" />                  // ticking spokes, like iOS
<Loader variant="dots" />                    // softer: chat replies, inline waits
<Loader variant="pixel" size="lg" />         // a 3×3 grid with a diagonal wave
<Loader tone="primary" label="Loading projects" />
<Loader variant="text" label="Loading projects…" />   // words with a shine
<Loader tone="inverse" />                    // white, on a dark scrim or a photo

// next to text that already says it: decorative
<span className="flex items-center gap-2 text-text-muted">
  <Loader size="sm" label="" /> Loading projects…
</span>

// the shape of what's coming: name one skeleton, the rest are decorative
<div className="flex gap-3" aria-busy="true">
  <Loader variant="skeleton" shape="circle" size="lg" label="Loading profile" />
  <Loader variant="skeleton" lines={2} label="" />
</div>
```

## When to use

- Content or a result is on its way and you can't tell how long it will take: a list loading, a search running.
- A reply or an AI task is being prepared and people should see that work is going on.
- The layout of what's coming is known, so a skeleton can hold its place while it loads.

## When not to use

- Waits you can measure (uploads, imports): use [Progress](../Progress/README.md) instead; a progress bar tells people how long it will take.
- A button whose action is running: use `<Button loading>` on the [Button](../Button/README.md) instead; it shows the ring in the center of the button, so buttons don't need a loader of their own.

## Anatomy

Drawn from the `Playground` story.

1. **Loader** (`.dk-loader`): the whole indicator, named "Loading" (or your label) for screen readers.
2. **Track** (`.dk-loader__track`): the spinner's faint full circle.
3. **Arc** (`.dk-loader__arc`): the part that turns; it stops under reduced motion and pulses instead.

## Usage

- Use a skeleton when you know the shape of what's loading, such as a list, a card or a profile; use the ring when you don't.
- Keep the pixel grid for moments that can carry it; the ring is the everyday loader.
- Show one ring per loading area, not one per row.
- Keep the label specific when it helps ("Loading projects"), and short.
- If loading fails, replace the loader with an error message and a way to retry; never leave it spinning.

Mark the area that is loading with `aria-busy` while the loader shows, and replace the loader with the content when it arrives:

```jsx
<section aria-busy={loading}>
  {loading ? <Loader /> : <ProjectList projects={projects} />}
</section>
```

### Variants and sizes

| | sm | md | lg |
| --- | --- | --- | --- |
| Ring (16, 24, 40px) | Inline with `text-sm`, inside small controls | Default: cards, panels, list rows | A whole page or an empty area |
| Spokes (16, 24, 40px) | Inline, small controls | Cards, panels, list rows; where the product should feel at home on Apple platforms | A whole page or an empty area |
| Dots (16, 24, 40px) | Inline "typing…" style waits | Chat replies, short inline waits | Rarely; prefer the ring for large areas |
| Pixel (16, 24, 40px) | Inline, next to a label | An AI task, a panel | An empty page or a splash screen |
| Text (`text-xs`, `text-sm`, `text-base`) | Inline, in small type | Where words say more than a drawing: "Generating summary…" | Under a page title or in an empty area |
| Skeleton lines (16, 20, 24px lines) | Captions, metadata | Body text, list rows | Titles, larger text |

Use one look per kind of wait across the product: the ring for loading content you can't predict, the skeleton when you know its shape, the dots for "someone is replying", the text when the words matter ("Thinking…", "Generating summary…").

### Spokes

`variant="spokes"` is eight rounded spokes round a circle, like the current iOS activity indicator, in its proportions: each spoke is about 10% of the loader's size wide (2.4px at 24px) and 25% long, round an empty middle about 40% across. The lead spoke is at full strength and each one behind it (anticlockwise) is fainter, down to 25% (85, 70, 55, 45, 35, 30, 25), a tail that shows the direction. The drawing ticks a spoke at a time (45°, no easing between ticks) and makes a full turn every second (`--loader-spokes-duration`, `duration-1000`): a tick every 125ms.

```jsx
<Loader variant="spokes" />
<Loader variant="spokes" size="lg" tone="muted" label="Loading photos" />
```

It takes the same sizes, tones and delay as the ring; `primary` and `muted` color it. Under reduced motion it stands still and breathes, like the ring. Use it where the product should feel at home on Apple platforms, or where a quieter, more mechanical motion suits better than the ring's smooth turn; keep one of the two per product.

### Pixel

`variant="pixel"` is a 3×3 grid of square pixels in one color, the loader's tone: no rounded corners and no gaps, just subtle dividers between them. The dividers are hairlines (half a unit of its 24-unit drawing: 0.5px at 24px, 0.8px at 40px) in the loader's color at 10%, cut through the squares, so a divider looks the same whether the squares beside it are lit or dim, on any surface and in every tone. A wave of light runs along the diagonals from the top-left corner to the bottom-right: each square rises from 15% to full strength, holds, and fades again, 75ms after the diagonal before it, in a 1.2s loop (`--loader-pixel-duration`, `duration-1200`, `ease-in-out`).

```jsx
<Loader variant="pixel" />
<Loader variant="pixel" size="lg" tone="primary" label="Generating" />
<Loader variant="pixel" pattern="spiral" />
<Loader variant="pixel" pattern="random" tone="inverse" glow />            // with a glow, on a dark scrim
```

#### Patterns

`pattern` sets the order the squares light in. Every pattern moves like the wave: each square rises from 15% to full, holds and fades with the same curve (`ease-in-out`), only in its own order. Wave, sweep, fall and rise loop in 1.2s (`--loader-pixel-duration`); snake and spiral in 1.5s; cross and checker in 1s, with steps `--loader-pixel-stagger` (75ms) apart.

| `pattern` | Order | Cycle |
| --- | --- | --- |
| `wave` (default) | Diagonals from the top-left corner, 75ms apart | 1.2s |
| `random` | Each square rises and fades on its own clock (1.5s to 2.2s, starting 0 to 1s in), so the clocks drift apart and the order never repeats visibly | no loop |
| `sweep` | Columns, left to right, 150ms apart | 1.2s |
| `fall` | Rows, top to bottom, 150ms apart | 1.2s |
| `rise` | Rows, bottom to top, 150ms apart | 1.2s |
| `snake` | Square by square, left to right, then back along the next row, 75ms apart | 1.5s |
| `spiral` | Clockwise round the edge from the top-left, then the center, 75ms apart | 1.5s |
| `cross` | The four corners, then the plus (edges and center) 525ms later | 1s |
| `checker` | The X (corners and center), then the four edges 525ms later | 1s |

Under reduced motion every pattern slows to half speed (2.4s; snake and spiral 3s; cross and checker 2s; random 4s) and keeps its order: the squares only fade, without moving.

#### Glow

`glow` adds a soft halo of the loader's color round the lit squares (a 2px blur, `--loader-pixel-glow-size`). It's off by default and works best on dark surfaces; on light ones it looks blurry. To glow every pixel loader in an area without the prop, set `--loader-pixel-glow` there. It has more character than the ring: keep it for moments that can carry it, such as an empty page, an AI task or a splash screen.

### Text

`variant="text"` is a loader made of words: the label, with a shine sweeping through it. Use it where the words say more than a drawing would:

```jsx
<Loader variant="text" label="Thinking…" />
<Loader variant="text" size="sm" label="Saving…" />
```

The words rest at 65% of the text color, and a band of full color sweeps through them from left to right every 2 seconds, easing in and out (`ease-in-out`), a shine that shows it's still working. The resting words keep 4.5:1 contrast on `surface` in every theme (the tests check it), so the text stays in the text color around it: `primary` and `muted` don't apply to it, only `inverse`. Its size is the type size: `text-xs` for `sm`, `text-sm` for `md`, `text-base` for `lg`, in `font-medium`. Screen readers hear the words once, as the loader's name; the visible copy is hidden from them so it isn't read twice. With `label=""` it still shows "Loading" but is decorative. Under reduced motion it's plain text, without the shine.

To put words next to a ring, place a Text loader beside a decorative ring, or a ring beside your own text with `label=""`.

Keep it short and specific, and end with an ellipsis when the wait continues: "Loading projects…", "Saving…".

### Skeleton

`variant="skeleton"` draws gray shapes where the content will be, so the layout is already in place and nothing jumps when the content arrives.

```jsx
<Loader variant="skeleton" />                               // one line of text-sm, full width
<Loader variant="skeleton" lines={3} />                     // a paragraph: the last line is 60% wide
<Loader variant="skeleton" shape="circle" size="lg" />      // an avatar, 40px
<Loader variant="skeleton" shape="circle" className="size-12" />   // 48px
<Loader variant="skeleton" shape="rect" />                  // an image or card: full width, 96px tall
<Loader variant="skeleton" shape="rect" className="h-40" />
<Loader variant="skeleton" shape="rect" className="w-48 h-32" />
```

- **text** (default): `lines` lines, each as tall as the size's text line (16, 20 or 24px) with a bar as tall as the type (12, 14 or 16px) and `rounded-sm` corners. Full width; with several lines the last is 60% wide, so it reads as a paragraph. Give it a width class (`w-1/2`, `w-48`) for a short line such as a name.
- **circle**: the loader's size (16, 24 or 40px), fully round. `className="size-12"` sets another size.
- **rect**: full width and 96px tall (`--loader-skeleton-rect-height`), `rounded-md` corners. Set the size with classes (`h-40`, `w-48 h-32`); for a ratio, `h-auto aspect-video`.

Lines and rects stretch to their container and shrink beside an avatar in a row, while the circle keeps its size.

The fill is the text color at 10% (`--loader-skeleton-fill`), so it fits any surface and theme. A lighter band (the text color at 5%) sweeps through it from left to right every 2 seconds, easing in and out, like the text variant. Under reduced motion it's a still fill. Browsers without `color-mix()` show the `secondary` color, still.

`primary` and `muted` don't apply; `inverse` makes it white for dark scrims. While it waits out the delay it is hidden, but its shapes keep their space. Match the real layout closely and keep it short: a few rows, not a screenful.

### Inverse tone

On a dark scrim, overlay, photo or video, which stay dark in every theme, use `tone="inverse"`: the ring, spokes, dots, pixel grid, text or skeleton turn white.

```jsx
<div className="absolute inset-0 grid place-items-center bg-overlay">
  <Loader tone="inverse" size="lg" label="Uploading photo" />
</div>
```

Don't use it on `surface-inverse`, which turns light in dark themes; there, leave the tone as `neutral` and it takes `text-inverse` from its parent.

## Behavior

### Show-after delay

By default a loader waits 300ms before it appears. Most requests finish sooner, so people never see a loader flash on and off. While it waits it keeps its space (nothing jumps when it appears), shows nothing, and isn't announced. If the content arrives first and you remove the loader, it never shows at all. Use `delay={0}` where the wait is certain to be long, or when the loader replaces something the person just clicked.

### Minimum time

Once it shows, a loader stays at least 500ms. Without that, work ending at 320ms would show a spinner for 20ms, cut off in the middle of its fade-in, which reads as a glitch. For the minimum to work, keep the Loader mounted and pass `loading={false}` when the work ends, rather than removing it. It then stays until the 500ms are up, and renders nothing after that. If the work ends within the delay, it never shows.

```tsx
<Loader loading={isFetching} />
```

## Accessibility

- A loader with a label is a `role="progressbar"` without a value, which is how ARIA says "busy, progress unknown". Its name is `label` ("Loading…").
- When it appears, `label` is announced once through the system's shared polite status region (the same one Button's loading uses), so screen-reader users hear that something started loading.
- In forced colors (Windows high contrast) the browser drops background colors, so skeleton bones keep a still `GrayText` fill instead of going blank.
- `label=""` makes it decorative (`aria-hidden`), for when visible text next to it already says what's loading, or when a parent announces it (as Button does).
- In a group of skeletons, name one ("Loading profile") and pass `label=""` to the rest, so it's announced once, and set `aria-busy` on the area.
- It draws in the text color, so it keeps the contrast of the text it sits with. With `tone`, use it on `surface` backgrounds, where `primary` and `text-muted` meet the 3:1 non-text contrast.
- The text variant's visible words are hidden from screen readers, which already hear the same text as its name.
- Under reduced motion the text variant is plain text, the skeleton a still fill, the pixel patterns run at half speed (2.4s), the ring and the spokes stand still and breathe between full and half strength (opacity, 2s), and the dots fade without growing. Nothing turns.
- **Keyboard:** none: it isn't focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<span>`. |
| `variant` | `'ring'` \| `'spokes'` \| `'dots'` \| `'pixel'` \| `'text'` \| `'skeleton'` | `'ring'` | The look |
| `shape` | `'text'` \| `'circle'` \| `'rect'` | `'text'` | Skeleton only: lines of text, an avatar, or an image or card |
| `lines` | number, 1 to 20 | `1` | Skeleton with `shape="text"` only: how many lines |
| `pattern` | `'wave'` \| `'random'` \| `'sweep'` \| `'fall'` \| `'rise'` \| `'snake'` \| `'spiral'` \| `'cross'` \| `'checker'` | `'wave'` | Pixel only: the order the squares light in (see Patterns) |
| `glow` | boolean | `false` | Pixel only: a soft halo of its color round the lit squares; best on dark surfaces |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | 16px, 24px or 40px, the same steps as icons (and the skeleton circle); for `text` and skeleton lines, `text-xs`, `text-sm` or `text-base` |
| `tone` | `'neutral'` \| `'primary'` \| `'muted'` \| `'inverse'` | `'neutral'` | `neutral` takes the text color, so it fits any surface (white on a primary button, `text` on a page). `primary` and `muted` color the ring, dots or pixel grid with those aliases (`text` and `skeleton` stay in the text color). `inverse` makes it white in every theme, for dark scrims, overlays and media |
| `label` | string | `'Loading…'` | Its accessible name, announced when it appears, and the words `text` shows. `''` makes it decorative |
| `delay` | number (ms) | `300` | Waits this long before showing. `0` shows it at once |
| `loading` | boolean | `true` | Pass `false` when the work ends. Once shown, it stays at least 500ms, then renders nothing |

`tone="current"`, the old name of `neutral`, was removed in 4.0.0; like any unknown tone it falls back to `neutral`, with no warning.

Any other attribute (`id`, `className`, `style`, `data-*`, `ref`) goes to the outer `<span>`. Every loader has `data-component="loader"`, `data-variant` and `data-size` for tests, and a skeleton also `data-shape`, and a pixel loader `data-pattern`.

## Component tokens

Each is an optional override: set it on the page, a container or one loader. Unset, it uses the shared token below. The list lives in `src/components/Loader/loader.tokens.json` (also in `design-tokens/components/`), and the tests check the CSS uses exactly these defaults.

```css
.sidebar { --loader-size-md: var(--spacing-5); }        /* smaller loaders in one area */
:root { --loader-track-opacity: var(--opacity-10); }   /* a fainter track everywhere */
.gallery { --loader-skeleton-rect-height: var(--spacing-48); }
```

<!-- token-table:start (made from loader.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--loader-primary` | `primary` | Color with `tone="primary"` |
| `--loader-muted` | `text-muted` | Color with `tone="muted"` |
| `--loader-inverse` | `white` | Color with `tone="inverse"` (every variant) |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--loader-size-sm` | `spacing-4` | Size sm (16px) |
| `--loader-size-md` | `spacing-6` | Size md (24px) |
| `--loader-size-lg` | `spacing-10` | Size lg (40px) |
| `--loader-skeleton-rect-height` | `spacing-24` | Height of the skeleton rect when no class sets one (96px) |

**Shape**

| Token | Default | Use |
| --- | --- | --- |
| `--loader-stroke-width` | `stroke-width-2` | Ring thickness in its 24-unit drawing (about 8% of its size) |
| `--loader-track-opacity` | `opacity-20` | Strength of the ring's track |
| `--loader-dots-dim` | `opacity-25` | How faint a dot gets between pulses |
| `--loader-label-dim` | `opacity-65` | How strong the text variant's words are between shines (keeps 4.5:1 on `surface`) |
| `--loader-skeleton-fill` | `opacity-10` | Strength of the skeleton's fill (the text color) |
| `--loader-skeleton-shine` | `opacity-5` | Strength of the band that sweeps through the skeleton |
| `--loader-skeleton-radius` | `rounded-md` | Corners of the skeleton rect (6px) |
| `--loader-skeleton-text-radius` | `rounded-sm` | Corners of the skeleton's text lines (4px) |
| `--loader-pixel-dim` | `opacity-15` | How faint a pixel square is between waves |
| `--loader-pixel-glow` | `spacing-0` | Glow around the lit pixel squares (blur radius); 0 is off. The `glow` prop sets it to `--loader-pixel-glow-size` |
| `--loader-pixel-divider` | `opacity-10` | Strength of the dividers, in the loader's color; the same next to lit and dim squares |
| `--loader-pixel-divider-width` | `stroke-width-1` | Width of the dividers, in half-units of the 24-unit drawing (1: 0.5px at 24px) |
| `--loader-pixel-glow-size` | `spacing-0.5` | Blur radius of the glow the `glow` prop turns on (2px) |
| `--loader-spokes-width` | `stroke-width-4` | Spoke thickness (drawn at 5/8 scale: 2.5 of the 24 units, about 10% of the size) |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--loader-dots-duration` | `duration-1000` | One pulse of the dots |
| `--loader-dots-stagger` | `delay-150` | Delay from one dot to the next |
| `--loader-pixel-stagger` | `delay-75` | Delay from one step of a pixel pattern to the next |
| `--loader-pixel-duration` | `duration-1200` | One loop of the pixel grid in the wave, sweep, fall and rise patterns (1.2s) |
| `--loader-spokes-duration` | `duration-1000` | One full turn of the spokes, a spoke at a time (a tick every 125ms) |
<!-- token-table:end -->

The ring is a quarter arc that turns once every `motion-loop-spinner` (700ms) with `ease-linear`, the one spinner speed of the library: Switch's pending ring and the indeterminate circular Progress turn with it. Only the drawing turns, so nothing is repainted on each frame. The text shine and the skeleton shimmer take 2s (`duration-1000` twice) with `ease-in-out`, and both move on `translate`, which the compositor runs without repainting: the skeleton slides a layer three bones wide through each bone, and the text slides a window holding a full-color copy of the words across them. Under reduced motion the ring stands still and breathes over twice that (2s, `ease-in-out`). It fades in over `duration-150` with `ease-out`.
