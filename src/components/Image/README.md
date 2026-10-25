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

## Usage

- Write `alt` to say what the picture shows. Use `""` only for a picture that's there for decoration.
- Use `fit="contain"` when the whole picture must show, such as a receipt or a document.
- With `viewable`, pass a larger `fullSrc` when `src` is a small thumbnail.
- Ask for confirmation yourself before `onRemove` removes something for good.

## Behavior

- It loads lazily (`loading="lazy"`) and decodes off the main thread (`decoding="async"`) by default. For the main picture at the top of a page, pass `priority`: it loads at once with `fetchpriority="high"`, so it shows sooner (Largest Contentful Paint).
- With `ratio="auto"`, pass the picture's `width` and `height`: the frame takes their shape before the picture arrives (at most as wide as its container), so the page doesn't jump when it loads. Without them, or a fixed ratio, the frame has no height until then, and Image warns in the console once.
- While loading, the frame shows a pulsing placeholder fill (still with reduced motion). A frame with `ratio="auto"` is at least 48px until the picture arrives, so give it a width and set `width` and `height` on the `<img>` to avoid a jump.
- The viewer is a large Dialog titled with the alt text: Escape, the × or a click on the backdrop close it, and focus goes back to the picture.
- The remove button only calls `onRemove`; ask for confirmation yourself if removing can't be undone.

## Accessibility

- `alt` is required by the types. A failed picture's fallback is a `role="img"` named by the alt text.
- The view button is named "View image: <alt>" and has `aria-haspopup="dialog"`; the remove button is named "Remove image: <alt>". Both work with the keyboard and show a focus ring.
- The fallback icon and the remove button keep 3:1 in all six themes (`Image.test.tsx`).
- **Keyboard:** with `viewable`, the picture is a button: Enter or Space opens it full size in a Dialog, Escape closes it, and focus comes back. With `onRemove`, its × is a Tab stop too. A plain image adds no Tab stop.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string` | | The picture's address. |
| `alt` | `string` | | Required. What the picture shows; `""` only for a decorative picture. |
| `ratio` | `'auto' \| 'square' \| '4:3' \| 'video' \| number` | `'auto'` | The frame's shape. A number is width / height. `auto` keeps the picture's own shape. |
| `fit` | `'cover' \| 'contain'` | `'cover'` | With a fixed ratio: fill and crop, or fit whole. |
| `priority` | `boolean` | `false` | The main picture at the top of a page: `loading="eager"` and `fetchpriority="high"` instead of lazy. |
| `rounded` | `boolean` | `true` | Corners from `--image-radius`. |
| `fallback` | `ReactNode` | a broken-image icon | Shown if the picture fails to load. |
| `viewable` | `boolean` | `false` | Makes the picture a button that opens it full size in a Dialog. |
| `fullSrc` | `string` | `src` | A larger version for the viewer. |
| `viewLabel` | `string` | `"View image: <alt>"` | The view button's name. |
| `onRemove` | `() => void` | | Shows a remove button in the top end corner. |
| `removeLabel` | `string` | `"Remove image: <alt>"` | The remove button's name. |
| `frameProps` | `HTMLAttributes` | | For the frame, such as `style={{ width: 240 }}`. |

`ref`, `className`, `loading`, `width`, `height`, `srcSet`, `sizes`, `onLoad`, `onError` and other `<img>` props go to the `<img>`.

## Component tokens

Each is an optional override: set it on the page, a container or one image. The list lives in `src/components/Image/image.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--image-bg` | `surface-muted` | The frame's fill while the picture loads, and behind a failed one. |
| `--image-fallback-color` | `text-muted` | The broken-image icon (3:1 on bg). |
| `--image-focus-ring` | `focus-ring` | A viewable picture's keyboard focus ring. |
| `--image-radius` | `rounded-lg` | The frame's corners with rounded (8px). |
| `--image-min-size` | `spacing-12` | The least width and height of an 'auto' frame before the picture arrives (48px). |
| `--image-fallback-icon` | `spacing-6` | The broken-image icon's size (24px). |
| `--image-remove-offset` | `spacing-2` | The remove button's distance from the corner (8px). |
| `--image-remove-shadow` | `shadow-sm` | The remove button's shadow, so it stands out on any picture. |
