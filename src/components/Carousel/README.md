# Carousel

One slide at a time, with previous and next buttons, a dot per slide and swipe. Use it for a few related pictures or cards, such as product photos. It never moves on its own.

```tsx
import { Carousel, Image } from "serupa-ds";

<Carousel label="Product photos">
  {photos.map((p) => <Image key={p.id} src={p.url} alt={p.alt} ratio="4:3" rounded={false} />)}
</Carousel>

<Carousel label="Featured" index={i} onIndexChange={setI} loop dots={false}>
  <Card>…</Card>
  <Card>…</Card>
</Carousel>
```

## When to use

- A few related pictures or cards of equal weight, such as product photos or the screens of a feature tour, where showing one at a time saves room.
- Content people browse at their own pace and don't need to compare side by side.

## When not to use

- Content people must see, such as key messages, offers or anything that needs action: most people never get past the first slide. Show it on the page, in a [Card](../Card/README.md) or an [Alert](../Alert/README.md).
- Items people compare or scan: use a [Grid](../Grid/README.md) of Cards, or a [List](../List/README.md).
- Steps in a process: use [Stepper](../Stepper/README.md) or [Tabs](../Tabs/README.md), which show where people are and let them jump.
- A single picture: use [Image](../Image/README.md), with `viewable` to open it full size.

## Anatomy

Drawn from the `Controlled` story.

1. **Viewport** (`.dk-carousel__viewport`): the window the slides scroll through.
2. **Slide** (`.dk-carousel__slide`): one item; the ones out of view are hidden from screen readers.
3. **Previous and next** (`.dk-carousel__arrow`): move one slide (or one page of slides) at a time.
4. **Dots** (`.dk-carousel__dots`): one per slide: where you are, and a way to jump to any slide.

## Usage

- Keep it to a handful of slides (about 3 to 7). With more, people lose track and the dots get small to hit.
- Give every slide the same size and ratio (Image's `ratio` helps), so the controls don't jump.
- Put what matters most on the first slide; that's the one everyone sees.
- Write a `label` that says what the slides are ("Product photos"). Pass `slideLabel` when "2 of 5" isn't the best name, such as each photo's subject. The default comes from the `slideOf` label, so `SerupaProvider labels` translates it ("2 dari 5" with `idLabels`).
- Use `loop` for photos with no natural order, and leave it off when the slides have a start and an end.
- For a row of product cards or testimonials, show two or three at once with `perView`. Set it per screen width, such as `perView={{ base: 1, md: 2, lg: 3 }}`, so phones still get one at a time.
- Turn off `dots` for 2 slides or when the arrows are enough, and `arrows` only when swiping or your own controls (`index` and `onIndexChange`) replace them.
- The previous and next buttons sit over the slide's sides, 8px in and 32px wide. A picture can run under them, but give a slide with text at least 40px of inline padding while the arrows are on (`padding-inline: var(--spacing-10)`), or the buttons cover the ends of its lines on a phone. With `--carousel-arrow-offset` changed, that's the offset plus 32px.

## Behavior

- The previous and next buttons move one slide. A click on a dot goes to that slide. On the dots, the arrow keys move to the previous or next slide, and Home and End go to the first and last.
- A swipe of 40px or more, with touch, pen or mouse, moves one slide; a shorter one springs back. A swipe let go of while pulling back, so that it's heading under 40px, springs back too. With `perView`, a hard flick carries on to the slide it's heading for, a whole view at most. Up and down swipes still scroll the page. Swiping works over pictures, and a swipe that starts on a link doesn't follow it.
- Without `loop`, the button for the way you can't go hides; if it had focus, focus moves to the other button.
- Slides slide in over 300ms, and change at once with reduced motion. With one slide there are no buttons or dots.
- With `perView`, the slides share the width, 16px apart (`--carousel-slide-gap`). `index` is the first slide shown, the buttons and a swipe still move one slide, and they stop once the last slide is in view. The dots count pages: with 3 per view and 7 slides, three dots for slides 1–3, 4–6 and 5–7, named "1–3 of 7" (the `slidesOf` label). `{ base, sm, md, lg }` follows the screen width (from 640, 768 and 1024px up) as it changes. With as many slides as fit, or fewer, there are no buttons or dots.
- In RTL (a `dir` attribute or CSS `direction`) the row runs right to left, and the buttons and arrow keys follow it.

## Accessibility

- **Role and name:** the `<section>` is a region named by `label`, with `aria-roledescription` "carousel" (the `carouselRole` label, "korsel" in Indonesian). Each slide is a group named "2 of 5" (`aria-roledescription` from `slideRole`). The slides not shown are `inert` and hidden, so Tab and screen readers only reach the current one (the ones in view, with `perView`).
- **Keyboard:**

  | Key | Does |
  | --- | --- |
  | Tab | Reaches the current slide's content, the previous and next buttons, then the current dot. |
  | Enter, Space | Press a button or a dot. |
  | ←, → (on the dots) | The previous or next slide, following the reading direction. |
  | Home, End (on the dots) | The first or last slide. |

- **ARIA states:** the current dot has `aria-current="true"` and is the only one in the Tab order. The slides are in a polite live region, so a screen reader reads the new slide after a button press.
- **Motion:** it never moves on its own, so nothing needs pausing (WCAG 2.2.2), and slides change at once with reduced motion.
- **Contrast:** the dots and the buttons keep 3:1 in all six themes (`Carousel.test.tsx`).
- **What's still yours:** a `label`, and alt text on every picture in the slides.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<section>`. |
| `children` | `ReactNode` | | One slide per child. |
| `label` | `string` | | What the carousel shows; it names the region. Required unless you give `aria-label`, or `aria-labelledby` pointing at a visible heading. |
| `index` | `number` | | The slide shown (from 0), when you control it. |
| `defaultIndex` | `number` | `0` | The first slide shown when you don't. |
| `onIndexChange` | `(index) => void` | | Called with the new slide's index. |
| `loop` | `boolean` | `false` | Past the last slide comes the first. Without it, the buttons hide at the ends. |
| `arrows` | `boolean` | `true` | The previous and next buttons on the sides. |
| `dots` | `boolean` | `true` | A dot for each slide, under the carousel. |
| `previousLabel` | `string` | `"Previous slide"` | The previous button's name. |
| `nextLabel` | `string` | `"Next slide"` | The next button's name. |
| `slideLabel` | `(index, count) => string` | the `slideOf` label, `"2 of 5"` | Each slide's name, and its dot's. |
| `perView` | `number \| { base?, sm?, md?, lg? }` | `1` | How many slides show side by side, or one count per screen width (640, 768, 1024px up). |

`ref`, `className`, `style` and other props go to the outer `<section>`.

## Component tokens

Each is an optional override: set it on the page, a container or one carousel. The list lives in `src/components/Carousel/carousel.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from carousel.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--carousel-dot` | `field-border` | The dots for the slides not shown (3:1 on surface). |
| `--carousel-dot-hover` | `text-muted` | A dot under the pointer. |
| `--carousel-dot-active` | `primary` | The current slide's dot. |
| `--carousel-focus-ring` | `focus-ring` | A dot's keyboard focus ring. |
| `--carousel-radius` | `rounded-xl` | The slides' corners (12px). |
| `--carousel-dot-size` | `spacing-2` | A dot's size (8px). |
| `--carousel-dot-active-width` | `spacing-6` | The current dot's width (24px). |
| `--carousel-gap` | `spacing-3` | Space between the slides and the dots (12px). |
| `--carousel-slide-gap` | `spacing-4` | Space between slides shown side by side, with `perView` (16px). |
| `--carousel-arrow-offset` | `spacing-2` | The previous and next buttons' distance from the sides (8px). |
| `--carousel-arrow-shadow` | `shadow-sm` | The previous and next buttons' shadow, so they stand out on any slide. |
<!-- token-table:end -->
