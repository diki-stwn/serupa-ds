# PasswordInput

A password field with a button at the end that shows and hides what was typed, so people can check it before they submit. It's Input's box, so it has the same sizes, states and tokens.

```jsx
const { PasswordInput, Field } = window.Serupa;

<Field label="Password"><PasswordInput /></Field>

// Sign-up: let the password manager suggest one
<Field label="New password" hint="At least 12 characters"><PasswordInput autoComplete="new-password" /></Field>

<PasswordInput visible={shown} onVisibleChange={setShown} />
```

## When to use

- Signing in, signing up, and changing a password.
- Any secret people type and may want to check before they submit, such as a PIN.

## When not to use

- Text that isn't secret: use [Input](../Input/README.md).

## Anatomy

Drawn from the `CapsLockOn` story.

1. **Field** (`.dk-input__field`): where the password is typed, hidden as dots.
2. **Show password** (`.dk-password-input__toggle`): shows and hides what was typed.

## Usage

- Label it with [Field](../Field/README.md), and put the password rules in the hint ("At least 12 characters"), not only in an error.
- Set `autoComplete="new-password"` when people create a password, so password managers suggest one; the default suits sign-in.
- Match the `size` to the other fields in the form.
- A press anywhere on the box other than the reveal button, such as on the icon or the side padding, focuses the field with the caret at the end, as Input's box does.

## Accessibility

- The show/hide button takes presses over at least 24px (WCAG 2.5.8), even at size `sm` where it's 22px: a box behind it reaches past its edges without moving anything.
- The button is named "Show password" and has `aria-pressed`, so screen readers say whether the password is shown. Its `aria-controls` points at the field when the field has an `id` (Field gives it one).
- Clicking it keeps focus in the field, so typing carries on. It's also reachable with Tab, and Enter or Space press it.
- Spell check and auto-capitalization are off, so a shown password isn't underlined or changed.
- Showing or hiding the password keeps the caret and any selection where they were (changing the field's type would put the caret at the start), so typing goes on where it stopped. In a long password the field also stays scrolled to the caret, rather than jumping back to the start.
- While Caps Lock is on and the field has focus, "Caps Lock is on" shows before the eye, joins the field's description and is read out once (the `capsLockOn` label). It goes away when Caps Lock is turned off or focus leaves. `capsLockHint={false}` turns it off.
- Pasting is never blocked, so a password manager or a copied password can fill the field (WCAG 3.3.8, accessible authentication). Don't add an `onPaste` that prevents it.
- The text keeps 4.5:1 and the eye icon 3:1 on the field in all six themes (`PasswordInput.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the field, then to the show and hide button |
| Enter, Space | On the button: show or hide the password; focus stays on the button |
| Caps Lock | While the field has focus: shows and reads out "Caps Lock is on" |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `visible` | boolean | none | Shows the password as text (controlled) |
| `defaultVisible` | boolean | `false` | Shows it at first (uncontrolled) |
| `onVisibleChange` | `(visible) => void` | none | Called when the button is pressed |
| `toggleLabel` | string | `"Show password"` | The button's name |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | 24, 32 or 44px, like Input |
| `invalid` | boolean | `false` | A danger border and `aria-invalid` |
| `leftIcon` | an icon name or element | none | A decorative icon before the text |
| `capsLockHint` | boolean | `true` | Shows and reads out "Caps Lock is on" while it is |

`autoComplete` defaults to `"current-password"`; use `"new-password"` when creating one. `ref`, `value`, `onChange` and every other input attribute go to the `<input>`; `className` and `style` go to the box, which has `data-component="password-input"`.

## Component tokens

The field uses Input's tokens. These style the show/hide button; each is an optional override. The list lives in `src/components/PasswordInput/password-input.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from password-input.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--password-input-toggle` | `text-muted` | The show/hide button's icon (3:1 on the field). |
| `--password-input-toggle-hover` | `text` | The icon on hover. |
| `--password-input-toggle-bg-hover` | `secondary` | The button's background on hover. |
| `--password-input-focus-ring` | `focus-ring` | The button's keyboard focus ring. |
| `--password-input-caps` | `text-muted` | The Caps Lock hint (4.5:1 on the field). |
| `--password-input-toggle-radius` | `rounded-sm` | The button's corners (4px). |
| `--password-input-toggle-padding` | `spacing-1` | Space around the button's icon (4px). |
<!-- token-table:end -->
