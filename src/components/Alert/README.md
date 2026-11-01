# Alert

A message about the page or a task: something saved, something to know, something that went wrong. It's a tinted box with an icon, an optional title, a message, optional actions and an optional close button.

```jsx
const { Alert, Button } = window.Serupa;

<Alert>Your trial ends in 3 days.</Alert>

<Alert tone="danger" title="Payment failed" actions={<Button size="sm" variant="secondary">Update card</Button>}>
  We couldn't charge the card ending 4242.
</Alert>

// dismissible: hide it yourself in onDismiss
{show && <Alert tone="success" onDismiss={() => setShow(false)}>Changes saved.</Alert>}
```

## When to use

- Something about the page or a task that people should see and that stays until it's dealt with: a failed payment, an expiring trial.
- A form or a section couldn't be saved, and people need to know why and what to do.
- A warning before people act, such as "This project is shared with 12 people."

## When not to use

- A quick confirmation that something happened, such as "Link copied": use a [Toast](../Toast/README.md) instead.
- A decision people must make before they go on: use a [Dialog](../Dialog/README.md) with `alert` instead.
- An error on one field: use the error in [Field](../Field/README.md) instead.
- A short status label in a table or a card: use a [Badge](../Badge/README.md) instead.

## Anatomy

Drawn from the `LongText` story.

1. **Icon** (`.dk-alert__icon`): shows the tone (info, success, warning, danger) beside the words, never instead of them.
2. **Title** (`.dk-alert__title`): the short summary, read first.
3. **Message** (`.dk-alert__message`): what happened and what to do next.
4. **Dismiss** (`.dk-alert__dismiss`): closes the alert, when it can be closed.

## Usage

- Pick the `tone` from what happened: `danger` for something that failed, `warning` for a risk, `success` for a done task, `info` or `neutral` for something to know.
- Put the alert near what it's about: at the top of the form or section, not far from it.
- Keep the `title` to a few words and let the message say what happened and what to do. Put the way out in `actions`, such as "Update card".
- Add `onDismiss` only when the message can be safely ignored; leave it out for problems that still need fixing.

## Accessibility

- `role="alert"` (warning, danger) is read out at once when the alert appears; `role="status"` waits for a pause. A screen reader only announces an alert that's added to the page, so render it when the event happens rather than toggling its text.
- The icon is decorative: the title or message must say what happened. Don't rely on the color alone.
- The close button is a real button with a name, 24×24px.
- In forced-colors mode the box gets a visible border and the icon a system color.
- The title and message keep 4.5:1 and the icon 3:1 on every tone, in all six themes (`Alert.test.tsx`).
- **Keyboard:** Tab reaches the buttons and links in `actions`, then, with `onDismiss`, the ×, which Enter or Space presses. The alert itself isn't a Tab stop.
- **Focus after dismissing:** when the × had focus and `onDismiss` removes the alert, focus moves to the next element in the Tab order after where the alert was (the selected tab of a tab list, not the first), or the one before it at the end of the page, so keyboard and screen reader users keep their place. If `onDismiss` moves focus itself, or keeps the alert on screen, focus is left where it is.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `tone` | `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'neutral'` | `'info'` | The background (each tone's `-subtle` color, `surface-muted` for neutral), the border tint and the icon |
| `title` | node | | A short first line in `font-semibold` |
| `children` | node | | The message |
| `icon` | icon name \| element \| `false` | the tone's | `info`, `check_circle`, `warning` or `error` by default; another name or element replaces it, `false` removes it |
| `actions` | node | | Buttons or links in a row under the message |
| `onDismiss` | function | | Shows a close button (a small ghost Button) that calls it |
| `dismissLabel` | string | `'Dismiss'` | The close button's name |

`role` is `"alert"` for warning and danger and `"status"` for the others; pass `role` to change it. `className`, `style`, `ref` and everything else go to the box, which has `data-component="alert"` and `data-tone`.

## Component tokens

Each is an optional override: set it on the page, a container or one alert. The list lives in `src/components/Alert/alert.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from alert.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--alert-bg-info` | `info-subtle` | The background of a info alert. |
| `--alert-icon-info` | `info` | The icon and the border tint of a info alert (3:1 on its background). |
| `--alert-bg-success` | `success-subtle` | The background of a success alert. |
| `--alert-icon-success` | `success` | The icon and the border tint of a success alert (3:1 on its background). |
| `--alert-bg-warning` | `warning-subtle` | The background of a warning alert. |
| `--alert-icon-warning` | `warning` | The icon and the border tint of a warning alert (3:1 on its background). |
| `--alert-bg-danger` | `danger-subtle` | The background of a danger alert. |
| `--alert-icon-danger` | `danger` | The icon and the border tint of a danger alert (3:1 on its background). |
| `--alert-bg-neutral` | `surface-muted` | The background of a neutral alert. |
| `--alert-icon-neutral` | `text-muted` | The icon and the border tint of a neutral alert (3:1 on its background). |
| `--alert-title-color` | `text` | The title. |
| `--alert-text` | `text` | The message (4.5:1 on every tone's background). |
| `--alert-border-strength` | `opacity-30` | How strongly the border shows the tone's color (30%). |
| `--alert-radius` | `rounded-lg` | The corner radius (8px). |
| `--alert-border-width` | `border-width-1` | The border width. |
| `--alert-padding-x` | `spacing-4` | Padding at the start and end (16px). |
| `--alert-padding-y` | `spacing-3` | Padding at the top and bottom (12px). |
| `--alert-gap` | `spacing-3` | Space between the icon, the content and the close button (12px). |
| `--alert-content-gap` | `spacing-1` | Space between the title, the message and the actions (4px). |
| `--alert-title-weight` | `font-semibold` | The title's weight (600). |
<!-- token-table:end -->
