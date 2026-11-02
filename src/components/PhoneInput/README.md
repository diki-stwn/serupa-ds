# PhoneInput

A phone number field with a country menu at the start. It groups the number the way that country writes it as people type ("812-3456-7890"), and reports it in E.164 ("+6281234567890"), the form to store and send to an SMS service. It's Input's box, so it has the same sizes, states and tokens.

```jsx
const { PhoneInput, Field, formatPhone } = window.Serupa;

<Field label="Mobile number"><PhoneInput defaultCountry="ID" name="phone" /></Field>

// Controlled, in E.164
<PhoneInput value={phone} onValueChange={(value, { complete }) => { setPhone(value); setDone(complete); }} />

// Only the countries you serve
<PhoneInput countries={["ID", "SG", "MY"]} />

formatPhone("+6281234567890");   // "+62 812-3456-7890"
```

## When to use

- Sign-up, checkout and contact forms that ask for a phone number, above all when people from more than one country fill them in.

## When not to use

- A number you only show: write it with `formatPhone`, in a `<a href="tel:+6281234567890">`.
- Extensions or short codes: use [Input](../Input/README.md) with `type="tel"`.

## Anatomy

Drawn from the `ByArea` story.

1. **Country** (`.dk-phone-input__country`): chooses the country, which sets the dialing code and the format.
2. **Dialing code** (`.dk-phone-input__dial`): the country's code, before the number.
3. **Number** (`.dk-input__field`): where the rest of the number is typed.

## Usage

- Label it with [Field](../Field/README.md). Say in the hint what the number is for ("We'll text you a code").
- Store the E.164 value, not the text in the field. `onValueChange` gives it, and `name` submits it.
- Digits typed on an Arabic, Persian or Bengali keyboard, or full width from a Japanese or Chinese IME (٠١٠, ０９０, ＋８１), are read as the same number, so the field and the value are always in ASCII digits. The calling codes are written in ASCII digits too, in the prefix (+20) and the country list (Egypt (+20)), even where the locale has its own digits (`ar-EG`), so they match the number beside them and what people dial.
- **Form reset** puts `defaultValue` and `defaultCountry` back, in the field and in what the form sends. A controlled field shows its `value` again.
- `complete` says whether the number has a length the country uses. Use it to enable submit or to show an error after blur. It doesn't check that the number exists.
- Set `defaultCountry` to where most of your users are. Without it, the country comes from the locale's region (`id-ID` gives Indonesia), else the US.
- Pasting or typing a number that starts with `+` or `00` picks the country from its calling code. Where countries share one, the area decides: `+1 416…` is Canada, `+1 684…` American Samoa, `+7 7…` Kazakhstan, `+44 1481…` Guernsey.
- A trunk prefix typed at the start (the `0` of `0812…`) is dropped, since the calling code replaces it. So is a calling code typed without `+` ("62 812…" with Indonesia picked), once the number is too long to be a national one.
- A `+` code PhoneInput doesn't know warns once in the console; its digits are read as a number in the picked country.
- A press on the box past the number field focuses the field with the caret at the end, as the text cursor over the box promises; the country menu keeps its own press.

## Accessibility

- The country menu is a native `<select>` named "Country", under the visible calling code. Phones open their own picker, and screen readers announce it as a menu with its value. Each option says the country's name in the locale's words and its calling code ("Indonesia (+62)").
- In a right-to-left page the calling code still reads left to right, "+20" and "مصر (+20)", in the prefix and in each option.
- The menu draws its own focus ring inside the box, so it's clear whether the menu or the number has focus.
- The number is `type="tel"` with `inputmode="tel"` and `autocomplete="tel-national"`, so phones show the dial pad and browsers can fill it in.
- Backspace next to a space or dash removes the digit before it, so deleting never gets stuck on the grouping.
- The calling code keeps 4.5:1 and the chevron 3:1 on the field in all six themes (`PhoneInput.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | The country select, then the number field |
| Up / Down | In the country select, the browser's own keys pick a country |
| Backspace / Delete | Next to a space, dash or bracket in the number, removes the digit beyond it rather than the punctuation |

## Countries

Every calling code in the world: 244 countries and territories, one row each in `PHONE_COUNTRIES` (`phone.ts`).

- About 120 have their usual grouping and the national number's shortest and longest lengths. The rest keep their digits ungrouped and accept 4 digits up to E.164's 15 in all.
- Germany groups by its area code, which is 2 to 5 digits: Berlin is "30 123456", a mobile "151 23456789", Cologne "221 1234567", and the rest "4621 1234567". Tokyo and Osaka (one digit) and London (two) group the same way.
- The North American Numbering Plan (+1) tells Canada and the Caribbean and Pacific territories from the US by the area code.
- A row you pass in `countries` replaces the built-in one with the same code, or adds a country: `{ code: "SG", dial: "65", trunk: "", pattern: "## ## ## ##", min: 8, max: 8 }`. The row can also have `patterns` (groupings by the number's start) and `areas` (for a shared calling code).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input type="tel">` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `value` | string | none | The number in E.164 (controlled) |
| `defaultValue` | string | none | The number at first (uncontrolled), in E.164 |
| `onValueChange` | `(value, { country, national, complete }) => void` | none | Called with E.164 (`""` when empty) as the number or country changes |
| `country` | string | none | The picked country's ISO code (controlled) |
| `defaultCountry` | string | the locale's region, else `"US"` | The country at first |
| `onCountryChange` | `(country) => void` | none | Called when the country changes, from the menu or a pasted number |
| `countries` | `Array<string \| PhoneCountry>` | every country | The countries in the menu, as ISO codes or your own rows, sorted by name |
| `countryLabel` | string | `"Country"` | The menu's name |
| `name` | string | none | Submits the E.164 number in a hidden input. With `form`, the hidden input belongs to that form too |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | 24, 32 or 44px, like Input |
| `invalid` | boolean | `false` | A danger border and `aria-invalid` |

`ref`, `placeholder`, `disabled`, `readOnly`, `onBlur` and the other input attributes go to the tel `<input>`; `className` and `style` go to the box, which has `data-component="phone-input"`.

### Helpers

- `formatPhone(e164, preferCountry?)`: "+62 812-3456-7890". A number with no known calling code comes back as it was.
- `parsePhone(text, preferCountry?, countries?)`: `{ country, national }` from "+62 0812…" or "0062…", or `undefined`. `preferCountry` decides a shared calling code while the area isn't typed yet.

## Component tokens

The box and the number use Input's tokens. These style the country part; each is an optional override. The list lives in `src/components/PhoneInput/phone-input.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from phone-input.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--phone-input-dial` | `text` | The calling code (4.5:1 on the field). |
| `--phone-input-chevron` | `text-muted` | The chevron (3:1 on the field). |
| `--phone-input-divider` | `border` | The line between the country part and the number. |
| `--phone-input-bg-hover` | `surface-muted` | The country part's background on hover. |
| `--phone-input-focus-ring` | `focus-ring` | The menu's keyboard focus ring. |
| `--phone-input-gap` | `spacing-1` | Space around the chevron (4px). |
<!-- token-table:end -->
