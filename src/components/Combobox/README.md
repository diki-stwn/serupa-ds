# Combobox

A text field with a list of options that narrows as you type: pick a country, an assignee, a project. Only listed options can be picked. For a short list (under about 10), a Select is simpler.

```tsx
import { Combobox } from "serupa-ds";

<Combobox aria-label="Country" placeholder="Pick a country" options={["Argentina", "Brazil", "Canada"]} />

const [owner, setOwner] = React.useState<string | null>(null);
<Combobox aria-label="Owner" value={owner} onValueChange={setOwner} clearable
  options={people.map((p) => ({ value: p.id, label: p.name, description: p.email }))} />

// several picks, each a tag in the field
const [reviewers, setReviewers] = React.useState<string[]>([]);
<Combobox aria-label="Reviewers" multiple value={reviewers} onValueChange={setReviewers} options={people} name="reviewers" />

// options from a server: loaded after typing pauses, each older request aborted
<Combobox aria-label="Person" loadOptions={(text, { signal }) => fetch("/api/people?q=" + encodeURIComponent(text), { signal }).then((r) => r.json())} />
```

## When to use

- One choice from a long list people know the name of: a country, an assignee, a project.
- Several choices from a long list, such as reviewers or tags (`multiple`).
- Options that come from a server as people type (`loadOptions`).

## When not to use

- A short list (under about 10): use [Select](../Select/README.md).
- An answer that may not be in the list: use [Input](../Input/README.md), since only listed options can be picked.
- Picking more than one option from a short list (under about 10): use [checkboxes](../Checkbox/README.md), which show every choice at once.

## Usage

- Label it with [Field](../Field/README.md), a `<label htmlFor>` or `aria-label`; the placeholder isn't a label.
- Add a `description` when options look alike, such as people with the same name (their email).
- Set `clearable` when no selection is a valid answer, so people can clear it in one click.
- Write an `emptyText` that says what to try next, and match the `size` to the fields beside it.
- Long lists are fine: the options are in the page only while the list is open, each label is prepared for matching once per `options` array, and moving the highlight redraws two rows. At most 100 rows are drawn at once, with a muted "Keep typing to narrow N more" line under them (the `moreResults` label); each row's `aria-posinset` and `aria-setsize` still count every match, and the picked option is drawn even when it's further down. Keep `options` the same array between renders (state, a constant or `useMemo`), so that work isn't redone. For tens of thousands of options, load the matches as people type with `loadOptions`.
- With `loadOptions`, Combobox runs the requests: it waits for typing to pause (`debounce`, 250ms), passes an `AbortSignal` that aborts when newer text is typed (hand it to `fetch`), drops any answer that isn't for the latest text, and shows the loading row while it waits and "Couldn't load options. Type to try again." (the `loadFailed` label) when the promise rejects. Opening the list loads what `""` finds. The picked option keeps its label when later answers leave it out. Filter on the server: `filter` is ignored. To run the requests yourself instead, use `filter={false}`, `onInputChange` and `loading`.

## Behavior

- Opening with a click, the chevron or an arrow shows every option; typing narrows them and highlights the first match.
- A press anywhere on the box, on the left icon, the side padding or a tag, focuses the field with the caret at the end, as the text cursor over the box promises (the chevron and × keep their own presses).
- Leaving the field closes the list and puts back the picked label. Leaving it empty clears the selection. Switching to another window or browser tab isn't leaving the field: the text waits until people come back.
- With `multiple`, each picked option is a tag before the text, in the order it was picked, with a remove button. Picking an option toggles it and keeps the list open on it, and the text empties so the next search starts from every option. Backspace in the empty field removes the last tag. Leaving the field empties the text and picks nothing. The box grows a row at a time as tags wrap.
- As the list narrows, the typed text is marked in each option's label (with Highlight), matched the way the filter matches: "lod" marks "Łód" in "Łódź". Not with a `filter` function or `loadOptions`, which may match on something else.
- Text that is exactly one option's label ("brazil" for Brazil: any case, with or without accents) picks that option when focus leaves the field (Tab or a click elsewhere), as Enter would.
- The list opens under the field in the top layer, at least as wide as the field and up to 240px tall, and flips above when there's no room. With no room above or below either, it takes the roomier side and gets shorter, scrolling inside.
- It fades and grows in from the edge facing the field, and fades and shrinks back out a little faster on close, inert while it goes, as Menu, Popover and DatePicker do. Closed mid-way, it turns back from where it is. Under reduced motion it only fades. From the keyboard there is no motion: opened by typing or an arrow the list is there at once, and Escape takes it away at once.

## Accessibility

- The ARIA combobox pattern: `role="combobox"` with `aria-expanded`, `aria-controls` (while the list is open), `aria-autocomplete="list"` and `aria-activedescendant`, and a `role="listbox"` of `role="option"` items with `aria-selected`. The loading message is `role="status"`. Once typing stops, the number of matches ("2 results"), "No results" and "Couldn't load" are said through the shared announcer, since a status row that appears with its text already in it isn't read by every screen reader. A string `emptyText` is said in place of "No results".
- An option is named by its label alone. A text `description` is its `aria-description`, so it's read after a pause instead of run into the name.
- When typing stops, the number of matching options is said ("3 results", `labels.resultsCount`).
- With `multiple`, the listbox has `aria-multiselectable="true"` and each picked option `aria-selected="true"`. Focus stays in the field, so each pick and removal is read out ("Brazil added", "Brazil removed": the `valueAdded` and `valueRemoved` labels). Each tag's remove button is named "Remove" and the label ("Remove Brazil").
- Labels and descriptions keep 4.5:1, even on the highlighted option, and the chevron 3:1, in all six themes (`Combobox.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| ArrowDown, ArrowUp | Open the list, then move through it (skipping disabled options, wrapping) |
| Alt+ArrowDown | Open without moving |
| PageUp, PageDown | Up or down by what the list shows at once, stopping at the first and last option |
| Enter | Pick the highlighted option (with `multiple`, pick or unpick it, keeping the list open) |
| Escape | Close and put back the picked label (and stop there, so a surrounding Dialog stays open) |
| Backspace | With `multiple`, in the empty field: remove the last tag |

Focus stays in the field the whole time.

## Props

Every Input prop works (`size`, `invalid`, `leftIcon`, `placeholder`, `disabled`, `readOnly`…), except `type`, `value`, `defaultValue`, `rightIcon` and `onChange`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `options` | `string[]` or `{ value, label, description?, disabled? }[]` | | The label is what's typed to find an option and shown once it's picked. With `loadOptions`, what shows before the first answer (or leave it out). |
| `loadOptions` | `(text, { signal }) => Promise<options>` | | Loads the options for the typed text (and `""` on opening), after `debounce`; older requests are aborted and their answers dropped. |
| `debounce` | `number` | `250` | With `loadOptions`, how long typing must pause before loading, in ms. |
| `multiple` | `boolean` | `false` | Picks any number of options, shown as tags. `value`, `defaultValue` and `onValueChange` then use `string[]`. |
| `value` | `V \| null` (`V[]` with `multiple`) | | Controlled. `V` is the options' values, a `string` by default: it's inferred from `options`, or given as `Combobox<'red' \| 'green'>`, so `onValueChange` gets that union; given, a value outside it is a type error. |
| `defaultValue` | `V \| null` (`V[]` with `multiple`) | | Uncontrolled. |
| `onValueChange` | `(value: V \| null) => void` (`(value: V[]) => void` with `multiple`) | | When an option is picked, or `null` when the field is emptied or cleared. With `multiple`, every picked value in the order picked. |
| `inputValue` | `string` | | The text in the field (controlled). Use with `onInputChange`. |
| `defaultInputValue` | `string` | the picked label | The text in the field at first (uncontrolled). |
| `onInputChange` | `(text: string) => void` | | Every change to the text: typing, and the label that picking, clearing, Escape or leaving the field puts back. |
| `filter` | `false \| (option, text) => boolean` | contains, ignoring case, accents and width ("lodz" finds "Łódź", "strasse" finds "Straße", "ｔｏｋｙｏ" finds "Tokyo", "こーひー" finds "コーヒー") | `false` shows every option you pass. |
| `clearable` | `boolean` | `false` | A × that clears the selection (every tag, with `multiple`). |
| `loading` | `boolean` | `false` | A loading row in the list. |
| `emptyText` | `ReactNode` | `'No results'` | Shown when nothing matches. A string is also what screen readers hear |
| `loadingText` | `string` | `'Loading…'` | |
| `toggleLabel`, `clearLabel` | `string` | `'Show options'`, `'Clear'` and the field's label | The buttons' names. The × reads "Clear Country" when the field's label is "Country", and "Clear" when it has none. By default they come from the `showOptions` and `clearValue` labels ("Tampilkan pilihan", "Hapus Negara" in `idLabels`). |
| `name` | `string` | | Sends the value with a form, in a hidden input (one per value with `multiple`, so `formData.getAll(name)` lists them). With `form`, the hidden input belongs to that form too. |

`className` and `style` go to the box; `ref` and every other prop go to the `<input>`. `autoComplete` is `off` unless you pass one: for a field about the user, pass its purpose, such as `autoComplete="country-name"` for their country, so browsers can fill it (WCAG 1.3.5).

## Component tokens

Each is an optional override: set it on the page, a container or one combobox. The field uses Input's tokens. The list lives in `src/components/Combobox/combobox.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from combobox.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--combobox-chevron` | `text-muted` | The chevron button's icon (3:1 on the field). |
| `--combobox-chevron-hover` | `text` | The chevron and × buttons' icon on hover. |
| `--combobox-chevron-bg-hover` | `secondary` | The chevron and × buttons' background on hover. |
| `--combobox-listbox-bg` | `surface-overlay` | The list's background. |
| `--combobox-listbox-border` | `border-overlay` | The list's outline. |
| `--combobox-option-color` | `text` | An option's label. |
| `--combobox-option-bg-active` | `highlight` | The highlighted option (hover or arrow keys). Its second line turns to `text` on it. |
| `--combobox-option-indicator` | `primary` | The 2px bar at the highlighted option's start. |
| `--combobox-description-color` | `text-muted` | An option's second line, and the empty and loading messages. |
| `--combobox-check` | `primary` | The check next to the selected option. |
| `--combobox-listbox-shadow` | `shadow-lg` | The list's shadow. |
| `--combobox-listbox-radius` | `rounded-lg` | The list's corners (8px). |
| `--combobox-option-radius` | `rounded-md` | An option's corners (6px). |
| `--combobox-listbox-max-height` | `spacing-60` | The list's height before it scrolls (240px). |
| `--combobox-listbox-max-width` | `container-md` | The list's widest, unless the field is wider (448px). Longer labels wrap. |
| `--combobox-option-height` | `control-height-md` | An option's least height (32px). |
| `--combobox-listbox-padding` | `spacing-1` | Space inside the list (4px). |
| `--combobox-option-padding-x` | `spacing-2` | Space on each side of an option (8px). |
| `--combobox-offset` | `spacing-1` | The gap between the field and the list (4px). |
| `--combobox-z-index` | `z-popover` | The list's stacking order, where the top layer isn't available. |
<!-- token-table:end -->
