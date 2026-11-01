# VisuallyHidden

Content that screen readers announce but nobody sees: "(opens in a new tab)", the label of an icon-only control you build yourself, a heading for a section that's obvious by sight. With `focusable` it shows while it has keyboard focus, for a "Skip to content" link.

```jsx
const { VisuallyHidden } = window.Serupa;

<span>3 <VisuallyHidden>unread messages</VisuallyHidden></span>
<VisuallyHidden as="h2">Filters</VisuallyHidden>

// First thing in the page: shown when someone presses Tab
<VisuallyHidden focusable as="div"><a href="#main">Skip to content</a></VisuallyHidden>
```

## When to use

- Words that make something clear to screen reader users when sight already makes it clear: "3 unread messages" shown as "3".
- A heading for a section that's obvious by sight, so screen reader users can jump to it.
- Your own focusable content that shows when someone presses Tab, with `focusable`. For the page's "Skip to content" link, use [SkipLink](../SkipLink/README.md): it has the words in both languages and moves focus to the main content.

## When not to use

- Naming an icon-only button: use [IconButton](../IconButton/README.md) instead; its `label` is required.
- Saying a link opens a new tab: use `external` on [Link](../Link/README.md), which adds "(opens in a new tab)" for you.
- A "Skip to content" link: use [SkipLink](../SkipLink/README.md), which also moves focus to the main content.
- Hiding something from everyone, screen readers included: use the `hidden` attribute or `display: none` instead.

## Usage

- Keep it short and put it where it's read in context, such as right after the number it explains.
- Pick the element with `as`: a heading level that fits the page's outline, or `div` for a skip link.
- Put a skip link first in the page, pointing at the main content's `id`.

## Accessibility

- It's clipped to 1px and taken out of the layout, not `display: none`, so screen readers still read it.
- Don't hide anything someone who can see needs: if it matters, show it.
- A focusable skip link takes its own place in the layout when shown: style it with your page so it doesn't push content around, or put it in a fixed spot.
- **Keyboard:** none of its own. It only hides its content on screen, so anything focusable inside stays in the Tab order: give a skip link `focusable`, so it shows while it has focus.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<span>`. |
| `focusable` | boolean | `false` | Shows it while it, or something inside it, has focus |
| `as` | `'span'` \| `'div'` \| `'h1'`…`'h6'` \| `'p'` \| `'label'` \| `'legend'` | `'span'` | The element |

`className`, `style`, `ref` and everything else go to the element, which has `data-component="visually-hidden"`. The `sr-only` utility class does the same in plain HTML.

## Component tokens

None: it has nothing to see.
