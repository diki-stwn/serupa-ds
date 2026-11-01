# Rating

Stars to pick a score (how was your stay, how useful was this article) or to show one (a product's average). Picking works like any radio group, with a native radio per star, so it's keyboard, form and screen reader ready.

```tsx
import { Rating } from "serupa-ds";

const [stars, setStars] = React.useState<number | null>(null);
<Field label="How was your stay?">
  <Rating value={stars} onValueChange={setStars} clearable name="stay" />
</Field>

<Rating aria-label="Your rating" allowHalf defaultValue={3.5} />

// showing a score: one image named "4.3 out of 5"
<Rating readOnly value={4.3} aria-label="Average" />
```

## When to use

- A quick, familiar score: reviews, feedback after a task, how useful a page was.
- Showing an average or a review's score next to its text (`readOnly`).

## When not to use

- A choice between named options ("Poor", "Fair", "Good"): use a [RadioGroup](../Radio/README.md) or a [SegmentedControl](../SegmentedControl/README.md), so each option says what it means.
- A number on a wide scale, such as 0 to 100: use a [Slider](../Slider/README.md) or a [NumberInput](../NumberInput/README.md).
- A yes or no ("Was this helpful?"): use two [Buttons](../Button/README.md) or [ToggleButtons](../ToggleButton/README.md).

## Anatomy

Drawn from the `Disabled` story.

1. **Star** (`.dk-rating__star`): one point of the score.
2. **Filled** (`.dk-rating__fill`): the part of each star the score covers, half stars too.
3. **Empty** (`.dk-rating__empty`): the part it doesn't.

## Usage

- Label it with [Field](../Field/README.md) or `aria-label`, and say what's being rated.
- Set `clearable` when no rating is a valid answer, so a second pick on the same star clears it.
- Use `allowHalf` only where half stars mean something to people. Each half is half a star wide, so at `sm` a half is a small target: keep `md` or `lg` for pointers and touch.
- For a read-only score, pass the exact average (`value={4.27}`): the stars draw any fraction, and the name rounds it to one decimal ("4.3 out of 5"). Put the number of reviews in text beside it.

## Behavior

- A click (or a tap) on a star picks it; with `allowHalf`, the start half of a star picks the half. The stars up to the pointer light up while it hovers, without picking.
- Form reset brings back `defaultValue`, also for a rating outside the form that `form` names. With `name`, the rating is sent with the form as one value.
- In a right-to-left page the stars run from the right, and halves fill from the right.

## Accessibility

- **Role and name:** interactive, it's a `role="radiogroup"` named by its Field label or `aria-label`, holding a native radio per choice, named by the `ratingStars` label ("1 star", "3.5 stars"; "3,5 bintang" in `idLabels`). `readOnly` is one `role="img"` named by the `ratingValue` label ("4.3 out of 5", after its own `aria-label`: "Average, 4.3 out of 5").
- **Keyboard:** native radio group keys, below. The focused star gets the focus ring.
- **Contrast:** the filled and empty star colors are 3:1 on the page in all six themes (`Rating.test.tsx`). In forced colors, empty stars use the system's gray text and filled ones its text color.
- **What's still yours:** say what the rating is for in the label, and show the count of reviews in text next to a read-only average.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the picked star (or the first, with none picked), then out of the group |
| ArrowRight, ArrowDown | Pick the next star (or half); ArrowLeft in a right-to-left page |
| ArrowLeft, ArrowUp | Pick the one before; ArrowRight in a right-to-left page |
| Space | Pick the focused star; with `clearable`, on the picked one, clear it |
| Backspace, Delete | With `clearable`, clear the rating |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | | Goes to the root (the radio group, or the image when `readOnly`). |
| `value` | `number \| null` | | The rating (controlled). |
| `defaultValue` | `number \| null` | | The rating at first (uncontrolled). |
| `onValueChange` | `(value: number \| null) => void` | | The picked rating, or `null` when it's cleared. |
| `max` | `number` | `5` | How many stars. |
| `allowHalf` | `boolean` | `false` | Half stars can be picked (two choices per star). |
| `clearable` | `boolean` | `false` | Picking the current rating again, Backspace or Delete clears it. |
| `readOnly` | `boolean` | `false` | Shows the rating as one image, with no choices; any fraction is drawn. |
| `disabled` | `boolean` | `false` | Disables every choice. |
| `invalid` | `boolean` | `false` | `aria-invalid` on the group, and the empty stars turn the danger color (`--rating-invalid`). Field sets it from its error. |
| `name` | `string` | a generated one | Sends the rating with a form. |
| `form` | `string` | | The id of a form elsewhere on the page that the radios belong to. |
| `required` | `boolean` | `false` | Marks the radios required. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Stars of 20, 24 or 32px. In a narrower box the stars shrink alike to fit, down to 20px, so ten `lg` stars fit a phone. |

`className`, `style`, `ref` and other props go to the root `<div>`, which has `data-component="rating"` and `data-size`.

## Component tokens

Each is an optional override: set it on the page, a container or one Rating. The list lives in `src/components/Rating/rating.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from rating.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--rating-fill` | `warning` | A star's filled part (3:1 on the page). |
| `--rating-empty` | `field-border` | A star's empty part (3:1 on the page). |
| `--rating-invalid` | `danger` | The empty stars' color when invalid (3:1 on the page), so the error shows on the stars as well as in the Field's message. |
| `--rating-focus-ring` | `focus-ring` | The ring around the focused star. |
| `--rating-size-sm` | `spacing-5` | A star at size sm (20px). |
| `--rating-size-md` | `spacing-6` | A star at size md (24px). |
| `--rating-size-lg` | `spacing-8` | A star at size lg (32px). |
| `--rating-gap` | `spacing-0.5` | The space between stars (2px). |
<!-- token-table:end -->
