# Image

A picture in a frame: a fixed ratio, rounded corners, a placeholder while it loads and a fallback if it fails. It can open full size in a viewer, and show a remove button.

```tsx
import { Image } from "serupa-ds";

<Image src="/team.jpg" alt="The team at the 2025 offsite" ratio="video" />
<Image src={thumb} fullSrc={original} alt="Receipt from March 3" ratio="square" viewable />
<Image src={upload.url} alt={upload.name} ratio="4:3" onRemove={() => remove(upload)} />
```

## When to use

- Photos, screenshots and other pictures in a page, a card or a gallery.
- Pictures in a set that should all have the same shape, whatever their own size.
- Uploads people may want to see full size, or remove.

## When not to use

- A person's, team's or project's picture: use [Avatar](../Avatar/README.md) instead.
- A symbol for an action or a status: use [Icon](../Icon/README.md) instead.
- A purely decorative background: use a CSS `background-image` instead.

## Anatomy

Drawn from the `Removable` story.

1. **Picture** (`.dk-image__img`): the image, with its alternative text.
2. **View** (`.dk-image__view`): opens it full size.
3. **Remove** (`.dk-image__remove`): takes it away, when it can be removed.

## Usage

- Write `alt` to say what the picture shows. Use `""` only for a picture that's there for decoration.
- Use `fit="contain"` when the whole picture must show, such as a receipt or a document.
- With `viewable`, pass a larger `fullSrc` when `src` is a small thumbnail. Without it, the viewer shows the largest `srcSet` candidate, or `src`.
- For a picture shown at many widths, pass `srcSet` with widths (`"hero-640.jpg 640w, hero-1280.jpg 1280w"`) so small screens load a small file. You can leave `sizes` out on a lazy picture: Image sets `sizes="auto"`, and the browser picks by the width the frame is laid out at. Give `sizes` for a `priority` picture, which loads before layout.
- Use `sources` for another crop on phones (`media`) or a lighter format (`type: "image/avif"`): each becomes a `<source>` in a `<picture>` around the `<img>`, tried in order before `src`.
- Use `darkSrc` for a version drawn for a dark page (a chart, a diagram, a logo on dark), and `dim` to darken a photo a shade on a dark page so a bright one doesn't glare.
- Ask for confirmation yourself before `onRemove` removes something for good.

## Behavior

- It loads lazily (`loading="lazy"`) and decodes off the main thread (`decoding="async"`) by default. For the main picture at the top of a page, pass `priority`: it loads at once with `fetchpriority="high"`, so it shows sooner (Largest Contentful Paint).
- With `ratio="auto"`, pass the picture's `width` and `height`: the frame takes their shape before the picture arrives (at most as wide as its container), so the page doesn't jump when it loads. Without them, the frame has no height until then, and Image warns in the console once. With a fixed ratio and no size of its own (no `className` or `style` on the picture, no width on the frame), the frame takes its container's full width, so it has its shape while loading and keeps it if the picture fails. Give it a width (`frameProps={{ style: { width: 240 } }}` or a utility class) for a smaller one.
- While loading, the frame shows the placeholder fill with a lighter band sweeping through it every 2s, like Loader's skeleton (a still fill with reduced motion or forced colors). The band moves on `translate`, so it costs no repaints. In server-rendered HTML the picture is never hidden, so it paints as soon as it arrives, before your script runs or without it. A picture that hydrates from that HTML stays shown, since it may have painted in part already. A lazy picture that mounts on the client and is still loading a frame later is hidden and fades in over 200ms when it arrives (at once with reduced motion); a `priority` one is never hidden. A frame with `ratio="auto"` is at least 48px until the picture arrives, so give it a width and set `width` and `height` on the `<img>` to avoid a jump.
- On a lazy picture whose `srcSet` (or a source's) lists widths, `sizes` gets `auto` in front: `"auto"` alone when none was given, or `"auto, <yours>"`, so a browser that doesn't know `auto` uses yours (or the whole screen width). An eager or `priority` picture, `x` descriptors, or a `sizes` that already starts with `auto` are left as given.
- With `sources`, the `<picture>` is `display: contents`, so the frame and the `<img>` lay out exactly as without.
- `darkSrc` is the first `<source>`, for `(prefers-color-scheme: dark)` in server HTML. In the browser, a theme that fixes the frame's color scheme (a `*-dark` or `*-light` `data-theme`, a `data-mode`) decides instead, and the picture swaps when any `data-theme`, `data-mode` or `data-brand` on the page changes. The viewer opens the version shown.
- `dim` lays `--image-dim` at 20% over a loaded picture in a dark color scheme only (`light-dark()`); the remove button stays above it, and forced colors drop it.
- For a reader saving data (Data Saver, `navigator.connection.saveData`, or `prefers-reduced-data: reduce`), only a `priority` picture loads at once; any other is lazy even with `loading="eager"`. Each `srcSet` (the `<img>`'s and each source's) is cut to its smallest version. Server HTML can't know this, so it changes once the page's script runs, before a lazy picture loads.
- The viewer is a large Dialog titled with the alt text: Escape, the × or a click on the backdrop close it, and focus goes back to the picture. Its picture has the frame's placeholder while it loads (in the shape `width` and `height` give, or the thumbnail's) and the frame's fallback if it fails. Since the title already names it, the picture itself has `alt=""`, so it isn't read twice.
- The remove button only calls `onRemove`; ask for confirmation yourself if removing can't be undone.
- Once a removed picture is gone, focus moves to the next picture's remove button in the same list, else the one before, so it isn't lost (as with Badge's tags). A handler that moves focus itself is left alone.

## Accessibility

- `alt` is required by the types. A failed picture's fallback is a `role="img"` named by the alt text. The `<img>` stays in the frame, hidden under it, so its className, style, id, data-* and ref keep working and the frame keeps its size.
- The view button is named "View image: <alt>" and has `aria-haspopup="dialog"`; the remove button is named "Remove image: <alt>". Both work with the keyboard and show a focus ring.
- The fallback icon and the remove button keep 3:1 in all six themes (`Image.test.tsx`).
- **Keyboard:** with `viewable`, the picture is a button: Enter or Space opens it full size in a Dialog, Escape closes it, and focus comes back. With `onRemove`, its × is a Tab stop too. A plain image adds no Tab stop.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the `<img>`, not the frame around it. |
| `src` | `string` | | The picture's address. |
| `alt` | `string` | | Required. What the picture shows; `""` only for a decorative picture. |
| `ratio` | `'auto' \| 'square' \| '4:3' \| 'video' \| number` | `'auto'` | The frame's shape. A number is width / height. `auto` keeps the picture's own shape. |
| `fit` | `'cover' \| 'contain'` | `'cover'` | With a fixed ratio: fill and crop, or fit whole. |
| `priority` | `boolean` | `false` | The main picture at the top of a page: `loading="eager"` and `fetchpriority="high"` instead of lazy. |
| `rounded` | `boolean` | `true` | Corners from `--image-radius`. |
| `fallback` | `ReactNode` | a broken-image icon | Shown if the picture fails to load. |
| `viewable` | `boolean` | `false` | Makes the picture a button that opens it full size in a Dialog. |
| `fullSrc` | `string` | the largest `srcSet` candidate, or `src` | A larger version for the viewer. |
| `viewLabel` | `string` | `"View image: <alt>"` | The view button's name. |
| `onRemove` | `() => void` | | Shows a remove button in the top end corner. |
| `removeLabel` | `string` | `"Remove image: <alt>"` | The remove button's name. |
| `darkSrc` | `string` | | A version for a dark color scheme: the page's dark theme, or the screen's preference where the theme follows it. |
| `dim` | `boolean` | `false` | Darkens a loaded photo a shade in a dark color scheme. |
| `sources` | `{ srcSet, media?, type?, sizes?, width?, height? }[]` | | Other versions, each a `<source>` in a `<picture>` ahead of `src`: for a media query (art direction) or a format. `width` and `height` for a version with another shape. |
| `frameProps` | `HTMLAttributes` | | For the frame, such as `style={{ width: 240 }}`. |

`ref`, `className`, `loading`, `width`, `height`, `srcSet`, `sizes`, `onLoad`, `onError` and other `<img>` props go to the `<img>`.

## Component tokens

Each is an optional override: set it on the page, a container or one image. The list lives in `src/components/Image/image.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from image.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--image-bg` | `surface-muted` | The frame's fill while the picture loads, and behind a failed one. |
| `--image-shine` | `surface` | The lighter band that sweeps through the fill while the picture loads (at 60%). |
| `--image-dim` | `black` | With dim, the layer that darkens a photo in a dark color scheme (at 20%). |
| `--image-fallback-color` | `text-muted` | The broken-image icon (3:1 on bg). |
| `--image-focus-ring` | `focus-ring` | A viewable picture's keyboard focus ring. |
| `--image-radius` | `rounded-lg` | The frame's corners with rounded (8px). |
| `--image-min-size` | `spacing-12` | The least width and height of an 'auto' frame before the picture arrives (48px). |
| `--image-fallback-icon` | `spacing-6` | The broken-image icon's size (24px). |
| `--image-remove-offset` | `spacing-2` | The remove button's distance from the corner (8px). |
| `--image-remove-shadow` | `shadow-sm` | The remove button's shadow, so it stands out on any picture. |
<!-- token-table:end -->
