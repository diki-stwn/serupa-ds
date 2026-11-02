# SearchInput

A search field: a search icon at the start, and a × at the end once something is typed. Escape clears it and Enter calls `onSearch`. It uses Input's box, sizes and tokens.

```tsx
import { SearchInput } from "serupa-ds";

<SearchInput aria-label="Search projects" placeholder="Search projects" onSearch={run} />

// filter as people type
const [q, setQ] = React.useState("");
<SearchInput aria-label="Filter" value={q} onChange={(e) => setQ(e.target.value)} loading={fetching} />
```

## When to use

- Searching a site, an app or a large set of records, with `onSearch` on Enter.
- Filtering a list or a table on the page as people type.

## When not to use

- Picking one value from a known list: use [Combobox](../Combobox/README.md).
- A one-line answer in a form that isn't a search: use [Input](../Input/README.md).

## Anatomy

Drawn from the `Invalid` story.

1. **Search icon** (`.dk-search-input__icon`): says the field searches.
2. **Field** (`.dk-input__field`): where the search is typed.
3. **Clear** (`.dk-search-input__clear`): empties the field, as Escape does.

## Usage

- Put it in a `<form role="search">` when it searches the whole site or app.
- Name it with a visible label or `aria-label`, and use the placeholder for what can be searched ("Search projects").
- Set `loading` while results are on their way, so people know the search is running.

## Behavior

- The × shows only when there's text and the field isn't disabled or read-only. Clicking it clears the field and keeps focus there.
- Escape clears a field that has text, and stops there, so a surrounding Dialog or Popover stays open. On an empty field Escape passes through.
- A form reset empties the field, or puts `defaultValue` back, and the × follows it.
- The browser's own clear button is hidden, so there's only one ×.
- A press anywhere else on the box, on the search icon or the side padding, focuses the field with the caret at the end, as Input's box does.

## Accessibility

- The clear button takes presses over at least 24px (WCAG 2.5.8), even at size `sm` where it's 22px: a box behind it reaches past its edges without moving anything.
- `type="search"` (a searchbox) with `enterkeyhint="search"`. Name it with a `<label>` or `aria-label`; a placeholder isn't a name.
- The icon and × keep 3:1 and the text 4.5:1 on the field in all six themes (`SearchInput.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the field, then to the × when there's text |
| Enter | Calls `onSearch` with the text, and submits the form it's in |
| Escape | Clears the field (when it has text and isn't read-only); without text, Escape goes on to what's around it, such as a Dialog |

## Props

Every Input prop works (`size`, `invalid`, `value`, `defaultValue`, `onChange`, `placeholder`, `disabled`…), except `type`, `leftIcon` and `rightIcon`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input type="search">` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `onSearch` | `(value: string) => void` | | Called with the text when Enter is pressed. |
| `onClear` | `() => void` | | Called after the × or Escape clears the field. `onChange` also gets an empty value first, so controlled fields follow. |
| `clearLabel` | `string` | `'Clear search'` | The ×'s name. |
| `loading` | `boolean` | `false` | A small loader in place of the search icon, announced as `loadingLabel`. |
| `loadingLabel` | `string` | `'Searching'` | The loader's name. |

`className` and `style` go to the box; `ref` and every other prop go to the `<input>`.

## Component tokens

Each is an optional override: set it on the page, a container or one field. The box uses Input's tokens. The list lives in `src/components/SearchInput/search-input.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from search-input.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--search-input-icon-color` | `text-muted` | The search icon (3:1 on the field). |
| `--search-input-clear` | `text-muted` | The clear button's icon. |
| `--search-input-clear-hover` | `text` | The clear button's icon on hover. |
| `--search-input-clear-bg-hover` | `secondary` | The clear button's background on hover. |
| `--search-input-focus-ring` | `focus-ring` | The clear button's keyboard focus ring. |
| `--search-input-clear-radius` | `rounded-sm` | The clear button's corners (4px). |
| `--search-input-clear-padding` | `spacing-1` | Space around the clear button's icon (4px). |
<!-- token-table:end -->
