# Highlight

Shows text with the parts that match a search marked, ignoring case and accents, for search results, [Combobox](../Combobox/README.md) options and a command palette.

```tsx
import { Highlight, highlightRanges } from "serupa-ds";

<Highlight query="lodz">Łódź, Poland</Highlight>              // marks "Łódź"
<Highlight query="strasse">Straße des 17. Juni</Highlight>     // marks "Straße"
<Highlight query="york new" words>New York, United States</Highlight>
highlightRanges("Łódź, Poland", "lodz")                        // [[0, 4]]
```

## When to use

- Showing why a search result, an option or a command matched what was typed.
- Pointing at a word or phrase inside a longer text that people searched for.

## When not to use

- Emphasis that doesn't come from a search: use `<strong>` or `<em>` in [Text](../Text/README.md).
- A label or count next to text: use a [Badge](../Badge/README.md).
- Long rich content: Highlight takes plain text, not elements.

## Anatomy

Drawn from the `InOptions` story.

1. **Text** (`.dk-highlight`): the whole text, read as one string.
2. **Match** (`.dk-highlight__mark`): the part that matches what was typed.

## Usage

- Pass the same query the list was filtered with, so what's marked is what matched.
- Matching ignores case, accents, width and hiragana versus katakana, as Combobox does: "lodz" marks "Łódź", "sao" marks "São", and "strasse" marks "Straße". The marks cover the text as written.
- `words` marks each word of the query wherever it is ("york new" marks "New" and "York"). Without it, the query is one phrase.
- A query can also be a list of terms. Overlapping or touching matches become one mark.
- `highlightRanges(text, query, words)` returns the same matches as `[start, end)` offsets, for drawing them yourself.

## Accessibility

- Matches are `<mark>` elements, which assistive tech exposes as highlighted text; the words themselves are unchanged, so the text reads as written.
- A match isn't marked by color alone: it's also semibold. Inside an option or menu item (`role="option"`, `"menuitem"`, `"menuitemradio"`, `"menuitemcheckbox"`), which is filtered as people type, it keeps the text's weight and is underlined instead, so the letters don't widen on each keystroke and the text and its ellipsis stay put. The text keeps 4.5:1 on the tint in all six themes (`Highlight.test.tsx`).
- In forced-colors mode marks use the system's Mark and MarkText colors.
- **Keyboard:** none: inline text, not focusable.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<span>`. |
| `children` | `string` | | The text to show. |
| `query` | `string \| string[]` | | What to mark. Empty marks nothing. |
| `words` | `boolean` | `false` | Mark each word of the query on its own. |

Every other prop, `className` and `ref` go to the `<span>`, which has `data-component="highlight"`; each match is `<mark class="dk-highlight__mark">`.

## Component tokens

Each is an optional override: set it on the page, a container or one highlight. The list lives in `src/components/Highlight/highlight.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from highlight.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--highlight-bg` | `warning-subtle` | Behind a match. |
| `--highlight-text` | `text` | A match's text (4.5:1 on bg). |
| `--highlight-weight` | `font-semibold` | A match's weight, so it isn't marked by color alone (not in an option or menu item, where it's underlined instead). |
| `--highlight-radius` | `rounded-xs` | A match's corners (2px). |
<!-- token-table:end -->
