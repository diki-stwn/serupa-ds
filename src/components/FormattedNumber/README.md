# FormattedNumber

Writes a number the way the reader's language does: `1.234,5` in Indonesian, `1,234.5` in English, `١٬٢٣٤٫٥` in Egyptian Arabic. It also writes short numbers (1.2K), percentages, money, file sizes and units, so a page doesn't mix localized dates with English numbers.

```tsx
import { FormattedNumber, formatNumber } from "serupa-ds";

<FormattedNumber value={1234.5} />                                   // "1,234.5"
<FormattedNumber value={1234567} format="compact" />                 // "1.2M", with "1,234,567" as its tooltip
<FormattedNumber value={0.456} format="percent" />                   // "46%"
<FormattedNumber value={19.99} format="currency" currency="USD" />    // "$19.99" in en, "US$19,99" in id
<FormattedNumber value={1572864} format="bytes" />                   // "1.5 MB"
<FormattedNumber value={50} format="unit" unit="kilometer-per-hour" />  // "50 km/h"
<FormattedNumber value={0.031} format="percent" options={{ signDisplay: "always", maximumFractionDigits: 1 }} />  // "+3.1%"

formatNumber(1234, "id-ID", { format: "compact" })                  // "1,2 rb", outside React or in a Server Component
```

## When to use

- Any number people read: counts, totals, prices, percentages, sizes, measurements, in text or in a table.
- Large counts where the exact figure doesn't matter at a glance (followers, views): `format="compact"`.

## When not to use

- A number people type: use [NumberInput](../NumberInput/README.md), which formats as they type.
- Codes that only look like numbers (an order number, a phone number, a postcode): write them as they are, since grouping would change them.
- A share of a task that's in progress: use [Progress](../Progress/README.md); a level within a range: [Meter](../Meter/README.md).

## Usage

- The words follow the locale from `SerupaProvider` (or the `locale` prop, or the browser's), including its digits.
- `percent` takes a fraction, as `Intl.NumberFormat` does: `0.45` is 45%. Divide by 100 first if your value is already a percentage.
- `currency` needs `currency`, an ISO 4217 code. The amount uses that currency's usual minor units (2 for USD and EUR, 0 for JPY); pass `options={{ maximumFractionDigits: 0 }}` to drop them, or `minimumFractionDigits: 2` to show them. Without a code it writes a plain number.
- `bytes` steps by 1024, like `formatFileSize`, with one decimal under 10 ("1.5 MB") and none above ("820 kB").
- `unit` takes any unit `Intl.NumberFormat` knows (`"celsius"`, `"liter"`, `"kilometer-per-hour"`), written short.
- `options` takes any other `Intl.NumberFormat` option and wins over the format's own: `maximumFractionDigits`, `signDisplay`, `currencyDisplay: "name"`, `compactDisplay: "long"`.
- In a table column, numbers line up on tabular digits; align the column to the end too.

## Accessibility

- It's a `<data>` whose `value` holds the number for machines; screen readers read its words.
- A compact number's full value is in `title`, which shows on hover but isn't reliably read out. Where the exact figure matters, show it as text.
- It doesn't wrap: "Rp 150.000" stays on one line.
- **Keyboard:** none: inline text, not focusable.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number \| bigint` | | The number. `NaN` renders an empty `<data>`. |
| `format` | `'decimal' \| 'compact' \| 'percent' \| 'currency' \| 'bytes' \| 'unit'` | `'decimal'` | How to write it. |
| `currency` | `string` | | With `currency`: the ISO 4217 code, `"IDR"`, `"USD"`. |
| `unit` | `string` | | With `unit`: a unit `Intl.NumberFormat` knows. |
| `options` | `Intl.NumberFormatOptions` | | Any other options; they win. |
| `locale` | `string` | the provider's, else the browser's | |

Every other prop, `className` and `ref` go to the `<data>`, which has `data-component="formatted-number"` and `data-format`. Your own `title` wins over the compact tooltip.

`formatNumber(value, locale?, options?)` gives the same words outside React, and in a Server Component; `options` takes `format` and every `Intl.NumberFormat` option.

## Component tokens

None: it uses the surrounding text's font and color, with tabular digits.
