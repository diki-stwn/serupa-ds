# PinInput

A one-time code or PIN, shown as one box per character, such as the 6-digit code texted at sign-in. It's one native field under the boxes, so a phone's "from Messages" suggestion, a paste and a password manager fill every box at once, and forms, labels and screen readers treat it as an Input.

```tsx
import { PinInput, Field } from "serupa-ds";

<Field label="Verification code" hint="We sent a 6-digit code to your phone." error={error}>
  <PinInput value={code} onValueChange={setCode} onComplete={verify} name="code" />
</Field>

// a 4-digit PIN, hidden
<PinInput aria-label="PIN" length={4} mask />

// letters and digits
<PinInput aria-label="Invite code" type="alphanumeric" length={5} />
```

## When to use

- A short code people copy from somewhere else: a verification code from a text or an email, a 2FA code, a device pairing code.
- A short PIN of a fixed length.

## When not to use

- A password, or a code of no fixed length: use [PasswordInput](../PasswordInput/README.md) or [Input](../Input/README.md).
- Long codes such as license keys or recovery codes, which people paste rather than type: use an Input, so they can read and fix the whole text.
- A number people work out, such as an amount: use [NumberInput](../NumberInput/README.md).

## Anatomy

Drawn from the `Alphanumeric` story.

1. **Boxes** (`.dk-pin-input__boxes`): one box per character, so you see how many are left.
2. **Box** (`.dk-pin-input__box`): one character.
3. **Filled box** (`.dk-pin-input__box--filled`): a character already typed.

## Usage

- `length` (default 6) sets the boxes. Characters that don't fit `type` are dropped as people type or paste, so "123-456" and "123 456" both fill six boxes.
- Use `onComplete` to check the code as soon as the last box fills, and show any error with Field's `error`. Don't clear the code on an error, so people can fix one character.
- It submits with a form through `name`, as an Input does. `required` and the built-in `pattern` (exactly `length` characters) take part in form validation.
- `autoComplete="one-time-code"` is set for you, so phones offer a texted code above the keyboard. Pass `autoComplete="off"` for a PIN that shouldn't be filled in.
- The code reads left to right, also on a right-to-left page. Digits typed on an Arabic, Persian or Bengali keyboard, or full-width from a Japanese or Chinese IME (٤٥٦, ４５６), are kept as the ASCII digits they stand for, so the value is always 0–9 (and A–Z with `alphanumeric`).
- In a narrow container the boxes shrink together and stay square, down to 24px each, so six `lg` or eight `md` boxes still fit a 320px screen. A longer code that doesn't fit even at 24px wraps onto a second row instead of making the page scroll sideways (WCAG 1.4.10).

## Accessibility

- **Role and name:** one `<input>` with a text role (a password field with `mask`). Name it with Field's label, `<label htmlFor>`, `aria-label` or `aria-labelledby`. Screen readers read the code, not the boxes, which are `aria-hidden`.
- **Keyboard:** it's one Tab stop. The caret stays at the end, and the box it's in gets the focus color, border and ring, which stay visible in forced colors. Forced colors don't paint the selected code over the boxes either: each box shows only its own digit.

| Key | Does |
| --- | --- |
| A digit (or a letter, with `type="alphanumeric"`) | Fills the next empty box. Other characters are ignored |
| Backspace | Empties the last filled box |
| Arrows, Home, End | Nothing: the caret stays after the last character |
| Ctrl+V / Cmd+V | Pastes a code into every box at once |

- **Contrast:** the characters read 4.5:1 on the boxes, and the borders, focus ring and danger border 3:1 on the surface, in all six themes (`PinInput.test.tsx`).
- **Target size:** the boxes are at least 24px, and the field under them takes a press anywhere on the row (WCAG 2.5.8).
- **What's still yours:** say how many characters the code has, and where it was sent, in the label or hint. Don't put a time limit on it that people can't extend (WCAG 2.2.1).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>`, so a `<label htmlFor>` works. |
| `length` | number | `6` | How many characters, one box each. |
| `value` | string | | Controlled. |
| `defaultValue` | string | | Uncontrolled. |
| `onValueChange` | `(value: string) => void` | | Called with the code as it changes. |
| `onComplete` | `(value: string) => void` | | Called with the code once every box is filled. |
| `type` | `'numeric'` \| `'alphanumeric'` | `'numeric'` | Digits only, with a number keypad, or letters and digits. |
| `mask` | boolean | `false` | A dot in each filled box, and a password field. |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Square boxes, 24, 32 or 44px. |
| `invalid` | boolean | `false` | Danger borders and `aria-invalid`. Field's `error` sets it. |

`ref`, `name`, `required`, `disabled`, `readOnly`, `autoFocus`, `aria-*` and every other input attribute go to the `<input>`. `className` and `style` go to the wrapping `<span>`, which has `data-component="pin-input"` and `data-size`.

## Component tokens

Each is an optional override: set it on the page, a container or one PinInput. The list lives in `src/components/PinInput/pin-input.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from pin-input.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--pin-input-bg` | `field` | A box's background. |
| `--pin-input-text` | `text` | The characters (4.5:1 on bg). |
| `--pin-input-border` | `field-border` | A box's border (3:1 on the surface). |
| `--pin-input-border-hover` | `field-border-hover` | The boxes' border on hover. |
| `--pin-input-focus-ring` | `focus-ring` | The border and ring of the box the caret is in. |
| `--pin-input-invalid` | `danger` | Every box's border when invalid (3:1 on the surface). |
| `--pin-input-bg-readonly` | `field-readonly` | The boxes' background when read-only or disabled. |
| `--pin-input-radius` | `rounded-md` | A box's corners (6px). |
| `--pin-input-box-sm` | `control-height-sm` | A box's width and height, size="sm" (24px). |
| `--pin-input-box-md` | `control-height-md` | A box's width and height, size="md", the default (32px). |
| `--pin-input-box-lg` | `control-height-lg` | A box's width and height, size="lg" (44px). |
| `--pin-input-gap` | `spacing-2` | Space between the boxes (8px). |
| `--pin-input-border-width` | `border-width-1` | A box's border (1px). |
<!-- token-table:end -->
