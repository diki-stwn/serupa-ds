# ErrorSummary

After a form fails to submit, a box at the top of the form that says what's wrong, with each error a link to its field. It takes focus when it appears, so everyone, including people using a screen reader, learns the submit failed and can go straight to each problem.

```tsx
import { ErrorSummary } from "serupa-ds";

<ErrorSummary errors={[
  { field: "email", message: "Enter an email address in the right format, like name@example.com" },
  { field: "start", message: "Start date must be today or in the future" },
]} />
```

## When to use

- A form with more than a couple of fields fails validation on submit: show the summary above the form, and the same messages on each field ([Field](../Field/README.md) `error`).

## When not to use

- One field checked as the person types or leaves it: its own error under the field is enough ([Field](../Field/README.md) `error`).
- A message about the page or a task, not about fields: use [Alert](../Alert/README.md).

## Anatomy

Drawn from the `WithDescription` story.

1. **Title** (`.dk-error-summary__title`): how many problems there are; focus moves here when the form is sent.
2. **Description** (`.dk-error-summary__description`): optional words on what to do.
3. **List** (`.dk-error-summary__list`): one line per problem.
4. **Link** (`.dk-error-summary__link`): takes you to the field to fix.

## Usage

- Render it only after a submit fails, at the top of the form (or the page's main content), with the errors in the order of the fields.
- Use the same words as each field's own error, so the link and the field say the same thing. Say what's wrong and how to fix it ("Enter your full name"), not just "Invalid".
- Each error's `field` is the id of the control to fix: an `<input>`, `<select>` or `<textarea>`, or a group's first radio or checkbox. A RadioGroup's or Rating's own id works too: the link focuses its checked radio, or else its first one that can be picked.
- Clear `errors` (or stop rendering it) once the form is sent. Leave it as it is while the person fixes fields: it updates on the next submit.
- Prefix the page's `<title>` with "Error: " while it shows, so the problem is also said when the page reloads.
- When it takes focus, the Fields in the same form don't also announce their new errors, so the list is read once.

## Behavior

- With no errors it renders nothing.
- It takes focus when it appears, and again when its errors change (another failed submit), so the page scrolls to it and a screen reader reads its heading. `autoFocus={false}` turns this off.
- Clicking an error moves focus to its field and scrolls the field's label to the top, so the question shows above the answer. For a radio or checkbox in a fieldset, the group's legend shows, also when the error names a RadioGroup by its id. A modified click (new tab) or a field that isn't on the page follows the link as usual.

## Accessibility

- **Role and name:** a `<div>` named by its heading (`aria-labelledby`), an `<h2>` by default (`headingLevel`), then a list of links. It takes focus (`tabIndex={-1}`) rather than being a live region, so it's read once, in full, when it appears.
- **Keyboard:** each error is a Tab stop. Enter follows it to its field.
- **Contrast:** its text reads 4.5:1 on its background in all six themes (`ErrorSummary.test.tsx`), and so do its links.
- **What's still yours:** keep each field's own error (Field `error`) so the problem shows next to it too, and write messages that say how to fix it.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `errors` | `{ field, message }[]` | | Required. The errors, in the fields' order: `field` is the control's id, `message` what's wrong. With none, nothing renders. |
| `title` | `ReactNode` | `"There is a problem"`, or `"There are N problems"` | The heading. |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `2` | The heading's level, to fit the page's outline. |
| `description` | `ReactNode` | | Text under the heading, before the list. |
| `autoFocus` | `boolean` | `true` | Moves focus to it when it appears and when its errors change. |

`className`, `ref` and other props go to the `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one ErrorSummary. The list lives in `src/components/ErrorSummary/error-summary.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from error-summary.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--error-summary-bg` | `surface` | The background. |
| `--error-summary-text` | `text` | The heading and description (4.5:1 on bg). |
| `--error-summary-border` | `danger` | The border, which marks it as errors. |
| `--error-summary-link` | `danger-text` | Each error's link (4.5:1 on bg). |
| `--error-summary-focus-ring` | `focus-ring` | The focus ring, on the box when it takes focus and on each link. |
| `--error-summary-border-width` | `border-width-2` | The border's width (2px). |
| `--error-summary-radius` | `rounded-md` | The corners (6px). |
| `--error-summary-padding` | `spacing-4` | Space inside, on every side (16px). |
| `--error-summary-gap` | `spacing-2` | Space between the heading, the description and the list (8px). |
| `--error-summary-title-weight` | `font-semibold` | The heading's weight. |
<!-- token-table:end -->
