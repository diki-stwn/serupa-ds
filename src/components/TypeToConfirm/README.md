# TypeToConfirm

A field and a destructive button for an action that can't be undone: the button works only once the person types a phrase, usually the name of what's being deleted. It makes them stop and read what's at stake.

```tsx
import { TypeToConfirm } from "serupa-ds";

<TypeToConfirm phrase="acme/web" confirmLabel="Delete this repository" onConfirm={deleteRepository} />
```

## When to use

- Deleting or resetting something big and permanent (a repository, a workspace, an account), usually in a [Dialog](../Dialog/README.md) that says what will be lost.

## When not to use

- Everyday actions that can be undone: do them at once and offer Undo (a [Toast](../Toast/README.md) action).
- Small destructive actions: a [Dialog](../Dialog/README.md) with a clear destructive button is enough. Asking to type for everything trains people to type without reading.

## Anatomy

Drawn from the `Default` story.

1. **Phrase** (`.dk-type-to-confirm__phrase`): the words to type, shown so they can be copied.
2. **Field** (`.dk-input__field`): where they're typed.
3. **Confirm** (`.dk-type-to-confirm__button`): stays unavailable until the words match.

## Usage

- Make the phrase the name of the thing (`acme/web`), not a word like "DELETE", so typing it is a check that it's the right one.
- Say what can't be undone in `hint`, or above it in the Dialog.
- Name the action on the button (`confirmLabel`): "Delete this repository", not "Confirm". A long one wraps onto more lines rather than widening the page on a phone.
- `onConfirm` can return a promise: the button shows loading until it settles and takes no second press.

## Behavior

- The button takes no press until what's typed matches the phrase. Spaces around it don't count. Letter case must match unless `caseSensitive={false}`, which also takes Turkish "İ" and "ı" as "i". An accent typed or pasted as a separate mark ("e" + "´", as in macOS file names) matches the same letter written as one ("é"), but a missing accent doesn't. Full-width letters (an IME left in full-width mode) match the usual ones, and a run of spaces counts as one.
- Enter in the field confirms once it matches.
- Pasting is allowed (WCAG 3.3.8): the point is reading the phrase, not retyping it.
- The field turns off autocomplete, spellcheck, autocapitalize and autocorrect, which would change what's typed.
- `onMatch` is called when it starts or stops matching.

## Accessibility

- **Role and name:** a text field labelled "To confirm, type" and the phrase, then a button named by `confirmLabel`.
- **Contrast:** the label and the destructive button read 4.5:1 in all six themes (Field and Button).
- **What's still yours:** say what will be lost, and put it in a Dialog or a clearly separated danger zone.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the field, then to the button. The button is focusable before it works (`aria-disabled`), and its description says why ("Type “acme/web” first") |
| Enter | In the field: confirms, once the text matches the phrase |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `phrase` | `string` | | Required. What to type, usually the thing's name. |
| `confirmLabel` | `ReactNode` | | Required. The button's label: the action in words. |
| `onConfirm` | `() => unknown` | | Required. Runs on the button or Enter once the phrase matches. Can return a promise. |
| `label` | `ReactNode` | `"To confirm, type"` and the phrase | The field's label. |
| `hint` | `ReactNode` | | Help under the label, such as what can't be undone. |
| `caseSensitive` | `boolean` | `true` | Whether letter case must match too. |
| `onMatch` | `(matched: boolean) => void` | | Called when what's typed starts or stops matching. |
| `disabled` | `boolean` | `false` | Disables the field and the button. |

`className`, `ref` and other props go to the wrapper `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one TypeToConfirm. The list lives in `src/components/TypeToConfirm/type-to-confirm.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from type-to-confirm.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--type-to-confirm-gap` | `spacing-3` | Space between the field and the button (12px). |
| `--type-to-confirm-phrase-weight` | `font-semibold` | The phrase's weight in the label. |
<!-- token-table:end -->
