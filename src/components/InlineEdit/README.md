# InlineEdit

Text people can change where it is: a project name, a card title, a slug. It shows the text with a pencil on hover; a click, Enter or Space opens a field in the same place, Enter or leaving the field saves, and Escape puts the text back.

```tsx
import { InlineEdit } from "serupa-ds";

<InlineEdit label="Project name" defaultValue="Apollo launch plan" onValueChange={rename} />

const [slug, setSlug] = React.useState("apollo-plan");
<InlineEdit label="Slug" value={slug} onValueChange={setSlug}
  validate={(v) => (/\s/.test(v) ? "Use dashes instead of spaces." : null)} />

<InlineEdit label="Description" placeholder="Add a description" size="sm" />
```

## When to use

- One short value on a page people already look at and change now and then: a name, a title, a label.
- Lists or boards where opening a form for each rename would be slow.

## When not to use

- Several fields that are saved together, or a value people must review before saving: use a form with [Field](../Field/README.md) and a Save button.
- Long text over several lines: use a [Textarea](../Textarea/README.md) in a form.
- Text most people only read: show it as text, and put editing behind an Edit button.

## Anatomy

Drawn from the `States` story.

1. **Value** (`.dk-inline-edit__view`): the text as it reads; activating it starts editing.
2. **Text** (`.dk-inline-edit__text`): the value, or the placeholder when it's empty.
3. **Edit icon** (`.dk-inline-edit__icon`): says the text can be edited.

## Usage

- Give every InlineEdit a `label` that says what the text is ("Project name"). It names the field, and the button is read as "Project name: Apollo, Edit".
- Save in `onValueChange`, which runs only when the text has changed. If saving can fail, keep the old value and tell people, for example with a [Toast](../Toast/README.md).
- Use `validate` for rules the text must meet. Return a message to keep the field open with that message under it; return nothing to save. For a check on the server ("That slug is taken."), return a Promise of the message.
- Set a `placeholder` when the text can be empty, so the empty button still shows something to click.
- Match `size` to what's around it; both modes use Input's heights and padding at every size.

## Behavior

- Opening selects the text, so typing replaces it.
- Enter saves and Escape cancels; both put focus back on the button. Leaving the field (Tab or a click elsewhere) saves too and leaves focus where it went. Switching to another window or browser tab isn't leaving it: the field stays open for when people come back.
- Leaving with a text that `validate` refuses keeps the field open with its message, and the message is said, so people know why it didn't close. Focus isn't pulled back: it stays where they went, and the field is still there to come back to (or Escape there to put the text back).
- While a Promise from `validate` is pending, the field is `aria-busy` and stays open. Only the latest check counts: typing or Escape drops the one running, and a rejected Promise keeps the field open without a message (resolve to a message instead).
- Escape inside a [Dialog](../Dialog/README.md) or [Drawer](../Drawer/README.md) only cancels the edit; the dialog stays open.
- With `editing` and `onEditingChange` you open and close it yourself, for example from a Rename item in a [Menu](../Menu/README.md). Each time it opens, the field starts from the current text.
- `disabled` and `readOnly` show the text without a button; `disabled` also mutes it (`--inline-edit-text-disabled`, still 4.5:1). Inside a `<fieldset disabled>` the button is disabled: the text is muted the same way, with no hover, pointer or pencil.
- While someone types with an input method (Japanese, Chinese, Korean), Enter and Escape confirm or cancel the composition, not the edit.

## Accessibility

- At rest it's a `<button>` whose name is the label, the text and "Edit" (from `SerupaProvider` labels: "Ubah" in Indonesian). The visible text is part of the name, so voice control users can say what they see.
- While editing it's an [Input](../Input/README.md) named by `label`; a validation message makes it `aria-invalid` and describes it. Focus stays in the field, where screen readers don't read the description again, so the message is also said politely on each failed try.
- The pencil shows on hover and keyboard focus, and always on touch screens, which have no hover. It also always shows when the value is empty and there is no `placeholder`, since the button then has no text to find it by (a placeholder such as "Add notes" is better).
- The text and the placeholder keep 4.5:1 on the page and on the hover background in all six themes (`InlineEdit.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Enter / Space | On the text, opens the field with the text selected |
| Enter | In the field, saves (unless `validate` keeps it open with an error) and returns focus to the text |
| Escape | Puts the text back and returns focus, without closing a Dialog or Drawer around it |
| Tab | Leaves the field, which saves |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `label` | `string` | | Required. What the text is. |
| `value` | `string` | | Controlled. |
| `defaultValue` | `string` | `''` | Uncontrolled. |
| `onValueChange` | `(value: string) => void` | | On save, when the text changed. |
| `onCancel` | `() => void` | | On Escape. |
| `validate` | `(value: string) => ReactNode \| Promise<ReactNode>` | | Return a message to keep it open, or nothing to save; a Promise for a check on the server. |
| `placeholder` | `string` | | Shown when the text is empty. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input's sizes. |
| `editing`, `onEditingChange` | `boolean`, `(editing: boolean) => void` | | Open and close it yourself. |
| `defaultEditing` | `boolean` | `false` | Open at first, with the field focused, without controlling it. |
| `disabled`, `readOnly` | `boolean` | `false` | The text without a button. |
| `editLabel` | `string` | `'Edit'` | The last word of the button's name. |
| `inputProps` | `InputProps` | | For the field: `maxLength`, `spellCheck`, `autoComplete`, `inputMode`… |

Every other prop, `className` and `ref` go to the outer `<div>`. `autoFocus` focuses the edit button (or the field, while editing). It has `data-component="inline-edit"`, `data-size` and `data-state` (`viewing` or `editing`).

## Component tokens

Each is an optional override: set it on the page, a container or one InlineEdit. The field and the button's height and padding use Input's tokens. The list lives in `src/components/InlineEdit/inline-edit.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from inline-edit.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--inline-edit-text` | `text` | The text in the button. |
| `--inline-edit-placeholder` | `text-muted` | The placeholder when the text is empty. |
| `--inline-edit-text-disabled` | `text-muted` | The text of a disabled InlineEdit. |
| `--inline-edit-icon` | `text-muted` | The pencil. |
| `--inline-edit-bg-hover` | `surface-muted` | The button's background on hover. |
| `--inline-edit-error` | `danger-text` | The validation message. |
| `--inline-edit-focus-ring` | `focus-ring` | The button's keyboard focus ring. |
| `--inline-edit-radius` | `rounded-md` | The button's corners (6px). |
| `--inline-edit-gap` | `spacing-1` | Space between the field and its message (4px). |
<!-- token-table:end -->
