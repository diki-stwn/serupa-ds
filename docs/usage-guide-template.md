<!--
Usage guide template for src/components/<Name>/README.md.
tools/test/guides.mjs checks that every guide has the required headings, in this order.

Rules:
- Keep the headings below, in this order, spelled exactly. Required ones are marked; a test can check for them.
- Optional sections go where shown and are left out when they have nothing to say.
- Write for someone choosing and using the component, not someone maintaining it. Short sentences, plain words.
- Name the alternative whenever you say "don't use this": a guide that says "not for X" without saying what to use instead leaves the reader stuck.
- Link other guides as ../<Name>/README.md; Storybook turns those into links to the component's page.
- The page title comes from Storybook, so the "# <Name>" line is dropped there but kept for GitHub.
-->

# <Name>

<One or two sentences: what it is and the job it does for the person using the product.>

```tsx
import { <Name> } from "serupa-ds";

<The smallest realistic example, using Field for labels where it applies.>
```

## When to use

<!-- Required. 2–5 bullets, each a situation, not a feature. -->

- <Situation where this is the right choice.>
- <Another situation.>

## When not to use

<!-- Required. Each bullet names what to use instead. -->

- <Situation>: use [<Alternative>](../<Alternative>/README.md) instead.
- <Situation>: use <native element or pattern> instead.

## Anatomy

<!-- Required when the component has parts (classes like dk-<name>__<part>). The Storybook page draws the story named here with each part outlined and numbered, and tools/test/anatomy.mjs checks that every class is in that story's markup. One line per part, numbered from 1, in reading order: **Name** (`.class`): what it is and does. For a menu or popover that has content only while open, write "Drawn from the `<Story>` story, opened.": the diagram opens it once and copies it. -->

Drawn from the `<Story>` story.

1. **<Part>** (`.dk-<name>__<part>`): <what it is and what it does.>
2. **<Part>** (`.dk-<name>__<part>`): <…>

## Usage

<!-- Required. How to use it well: content and writing guidance, layout, combining it with other components, common mistakes. Replaces the old "Guidelines", "Usage guidelines", "Writing it" and "Standards" sections. -->

- <Guidance.>

### <Variant, size or feature name>

<!-- Optional subsections for variants, sizes, tones or notable features, each with a short example. -->

## States

<!-- Optional. Rest, hover, focus, active, disabled, invalid, loading, read-only, empty: whichever apply, and what each looks like. Every state listed here has a story. -->

## Behavior

<!-- Optional. What happens on interaction: opening and closing, parsing typed input, focus movement, timing, reduced motion. For anything that moves, say which of the Motion foundation's purposes it serves, how often people see it, its role (motion-enter-sm, motion-change-md…), what it does from the keyboard (at once, or as on a click) and under reduced motion. -->

## Accessibility

<!-- Required. -->

- **Role and name:** <the element or role it renders, and how it gets its accessible name (Field, aria-label…).>
- **Keyboard:** <what each key does, in a table. A component that handles keys itself needs one (`tools/test/guides.mjs` checks). One that isn't focusable says so in a line instead: "none: it isn't focusable".>

  | Key | Does |
  | --- | --- |
  | <Tab> | <…> |

- **ARIA states:** <aria-expanded, aria-invalid, aria-selected… that it manages for you.>
- **Contrast:** <which parts are checked, at what ratio, in all six themes, and the test that checks it.>
- **What's still yours:** <what the person using the component must provide, such as a label or alt text.>

## Props

<!-- Required, with an `id` row. -->

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | <Where it goes: the root element, the native field inside (so a `<label htmlFor>` works), or not a prop. Required: guides.mjs checks it.> |
| `<prop>` | `<type>` | `<default>` | <What it does.> |

<Which native attributes pass through, and to which element.>

## Component tokens

<!-- Required unless the component has no visual values (say so in one line, as VisuallyHidden would). -->

Each is an optional override: set it on the page, a container or one instance. The list lives in `src/components/<Name>/<name>.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--<name>-<part>-<property>` | `<semantic token>` | <What it styles.> |

## Related

<!-- Optional. Components often used with this one, and patterns that show it in context. -->

- [<Name>](../<Name>/README.md): <why.>
