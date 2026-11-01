# Textarea

A multi-line text field, Input's sibling: a native `<textarea>` in a box. Three sizes with Input's text sizes and side padding, a height set in `rows`, a resize handle, and optional auto-resize and a character count. Focus, invalid, read-only and disabled states look like Input's, and field colors come from the same alias tokens (`field`, `field-border`, `placeholder`), so text keeps 4.5:1 and the border 3:1 in all six themes.

```jsx
const { Textarea } = window.Serupa;

<label htmlFor="notes">Notes</label>
<Textarea id="notes" placeholder="Anything the team should know" />

// grows with the text from 2 lines up to 8, then scrolls
<Textarea aria-label="Reply" autoResize rows={2} maxRows={8} value={reply} onChange={(e) => setReply(e.target.value)} />

// a count under the text: "32 / 280"
<Textarea id="bio" maxLength={280} showCount />

// invalid: say what's wrong in text, linked to the field
<Textarea id="desc" invalid aria-describedby="desc-error" />
<p id="desc-error">Write at least 20 characters.</p>
```

## When to use

- Answers that can run past one line: comments, descriptions, notes, messages.
- Text with a length limit people need to plan around, such as a bio (with `maxLength` and `showCount`).

## When not to use

- A name, an email or a search: use [Input](../Input/README.md), or [SearchInput](../SearchInput/README.md) for a search.

## Anatomy

Drawn from the `Count` story.

1. **Field** (`.dk-textarea__field`): where the text is typed; it can grow with it.
2. **Count** (`.dk-textarea__count`): how many characters are left, announced as the limit nears.

## Usage

- Size `rows` to the answer you expect, so people see how much to write: 2 or 3 for a short note, 5 or more for a description.
- Use `autoResize` where the page has room to grow, such as a comment box; give it a `maxRows` so a long text doesn't push the page's buttons out of view.
- Show a count only when there's a limit people need to plan around, and match the textarea's size to the inputs in the same form.

## States

| State | Look |
| --- | --- |
| Rest | `field` background, 1px `field-border`, a resize handle at the bottom corner |
| Hover | `field-border-hover` |
| Focus | The border and a 1px ring hugging it in `focus-ring` (2px in all), like Input; a visible outline in forced-colors mode |
| Invalid | `danger` border, and a `danger` focus ring |
| Read-only | `field-readonly` background, no hover change, no resize handle; still focusable and selectable |
| Disabled | `field-readonly` background at 50%, `not-allowed` cursor, no resize handle |

## Accessibility

- On iOS the field's text is 16px at every size, so Safari doesn't zoom the page when it takes focus; the box keeps its height.
- Every textarea needs a name: a visible `<label htmlFor>` (best) or `aria-label`. A placeholder isn't a label: it disappears as soon as someone types.
- `invalid` sets `aria-invalid`, but color alone doesn't explain the problem: put the message in text and link it with `aria-describedby`.
- Native constraints (`required`, `type="email"`, `pattern`, `min`, `maxLength`…) show too: a field that fails them takes the `invalid` border once people have edited it or tried to send the form (`:user-invalid`), never on first paint. It's only the color: `aria-invalid` and the message stay yours (set `invalid` and Field's `error` when you check it yourself). To keep the browser out of it, leave out the attribute and check the value in your own code.
- The count is linked with `aria-describedby` (after any ids you pass), so screen readers read it when the field gets focus. It isn't announced on every keystroke, which would drown out the typing: with `maxLength` it's read out once when a few characters are left (10, or a fifth of a short limit) and once when the limit is reached, in the `charactersLeft` label's words. A form reset puts it back to the default text's count.
- `maxLength` stops typing at the limit, counted in characters as people see them, the same way as the count: an emoji such as 👨‍👩‍👧 or 🇮🇩 is one, where the browser's own `maxlength` would count it as up to 8. Textarea applies the limit itself, so once the page is hydrated the `<textarea>` has no `maxlength` attribute. Server-rendered HTML keeps it, so the cap holds before the script runs. Text pasted past the limit is cut at the end of the paste (what comes after it stays), and an input method's text is cut once it's confirmed. Say the limit in the label or hint too ("Bio, up to 280 characters"), since the count only shows it visually.
- A press anywhere on the box, such as on the count row, focuses the field with the caret at the end, as Input's box does.
- Text, the placeholder and the count keep 4.5:1 on `field`, and the border 3:1, in all six themes (`Textarea.test.tsx`).
- A native constraint the value fails (`required`, `minLength`) is reported by the browser in its own language. Inside a `SerupaProvider` whose labels set `invalidValue` (`idLabels` does), the message is in the provider's words instead ("Isi kolom ini."). It's set when the browser checks the field and cleared on the next keystroke or value change. A message you set yourself with `setCustomValidity` stays. In English the browser's own message is kept.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Out of the field (it doesn't insert a tab) |
| Enter | A new line |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<textarea>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | `text-xs`, `text-sm` or `text-base`, with 8, 12 or 16px side padding and 4, 6 or 10px top and bottom |
| `rows` | number | `3` | Visible lines: the starting height, and the smallest one with `autoResize` |
| `autoResize` | boolean | `false` | Grows with the text, a line at a time, and shrinks back when text is deleted. No resize handle. Done in CSS (`field-sizing: content`) where the browser has it, so nothing is measured while typing; measured in script elsewhere |
| `maxRows` | number | | With `autoResize`: the most lines it grows to; past that the text scrolls. Unset: no limit |
| `resize` | `'vertical'` \| `'none'` | `'vertical'` | A handle to drag the height, or a fixed height |
| `invalid` | boolean | `false` | A danger border and focus ring, and `aria-invalid` |
| `showCount` | boolean | `false` | A character count under the text, in characters as people see them (an emoji is one): "32 / 280" with `maxLength`, "32" without. It turns from `text-muted` to `text` once `maxLength` is reached. The numbers are in the locale's digits, as Calendar's days are: "٣٢ / ٢٨٠" in Egyptian Arabic |

Everything else (`value`, `defaultValue`, `onChange`, `placeholder`, `disabled`, `readOnly`, `required`, `name`, `id`, `aria-*`) and `ref` go to the `<textarea>`. `className` and `style` go to the box, so `className="w-96"` sets its width (full width by default). The box has `data-component="textarea"` and `data-size`. Inside a `<fieldset disabled>` the box takes the disabled look too, as the native field is disabled with it.

## Component tokens

Each is an optional override: set it on the page, a container or one textarea. The list lives in `src/components/Textarea/textarea.tokens.json` (also in `design-tokens/components/`). The defaults are the same shared tokens Input uses.

<!-- token-table:start (made from textarea.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--textarea-bg` | `field` | Background |
| `--textarea-bg-readonly` | `field-readonly` | Background when read-only or disabled |
| `--textarea-text` | `text` | The typed text |
| `--textarea-border` | `field-border` | Border |
| `--textarea-border-hover` | `field-border-hover` | Border on hover |
| `--textarea-placeholder` | `placeholder` | Placeholder text |
| `--textarea-focus-ring` | `focus-ring` | Border and ring while focused |
| `--textarea-invalid` | `danger` | Border and ring when invalid |
| `--textarea-count` | `text-muted` | The character count |
| `--textarea-count-full` | `text` | The character count once it reaches `maxLength` |
| `--textarea-padding-x-sm` | `spacing-2` | Side padding, sm (8px), like Input sm. |
| `--textarea-padding-x-md` | `spacing-3` | Side padding, md (12px). |
| `--textarea-padding-x-lg` | `spacing-4` | Side padding, lg (16px). |
| `--textarea-padding-y-sm` | `spacing-1` | Top and bottom padding, sm (4px). |
| `--textarea-padding-y-md` | `spacing-1.5` | Top and bottom padding, md (6px). |
| `--textarea-padding-y-lg` | `spacing-2.5` | Top and bottom padding, lg (10px). |
| `--textarea-border-width` | `border-width-1` | Border width (1px) |
| `--textarea-radius` | `rounded-md` | Corner radius (6px), like Input and Button |
<!-- token-table:end -->
