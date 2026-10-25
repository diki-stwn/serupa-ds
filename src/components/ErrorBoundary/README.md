# ErrorBoundary

Catches an error thrown while rendering anything inside it and shows a message with "Try again" in its place, so one broken widget doesn't blank the whole page.

```tsx
import { ErrorBoundary } from "serupa-ds";

<ErrorBoundary onError={(error, info) => report(error, info.componentStack)}>
  <SalesChart />
</ErrorBoundary>

// your own words
<ErrorBoundary title="Couldn't load the chart" description="The rest of the page still works.">…</ErrorBoundary>

// your own fallback, and a reset when the route changes
<ErrorBoundary resetKeys={[pathname]} fallback={({ reset }) => <EmptyState title="Unavailable" actions={<Button onClick={reset}>Retry</Button>} />}>
  <Outlet />
</ErrorBoundary>
```

## When to use

- Around a part of the page that can fail on its own (a chart, a feed, a third-party widget), so the rest keeps working.
- Around each route's content in a single-page app, with `resetKeys` set to the route, so moving on clears the error.

## When not to use

- For an error you expect, such as a failed request: show it where it happens, with an [Alert](../Alert/README.md), a [Toast](../Toast/README.md) or an [EmptyState](../EmptyState/README.md).
- For errors in event handlers, timers or promises: React doesn't send those to boundaries. Catch them in the handler.
- Around the whole app only: a single top-level boundary takes the whole page down for one widget. Use several, close to what can fail.

## Usage

- Pass `onError` to log or report the error; the boundary itself doesn't send it anywhere.
- Say what failed and what still works in `title` and `description` when you know ("Couldn't load the chart"), instead of the general default.
- "Try again" renders the children again. If they fail the same way, the fallback comes back.
- `resetKeys` clears the error when any value in it changes, such as a route or the id being shown.
- `fallback` replaces the default Alert: an element, or a function of `{ error, reset }`. Don't show `error.message` to people: it's written for developers.

## Accessibility

- The default fallback is a danger [Alert](../Alert/README.md) (`role="alert"`), so screen readers read it as soon as it appears, with a "Try again" button.
- When the crash took focus with it (focus fell to `<body>`), focus moves to the fallback, so keyboard users aren't sent back to the top of the page. Focus elsewhere on the page is left alone. The box shows the focus ring when focus came from the keyboard.
- The words come from the `errorTitle`, `errorDescription` and `tryAgain` labels in `SerupaProvider` (English and Indonesian built in).
- A fallback of your own should do the same: say what happened in words and offer a way on.
- **Keyboard:** when a crash leaves focus nowhere, focus moves to the fallback, which isn't a Tab stop, so the next Tab reaches its Try again button. Enter or Space on that button renders the children again.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | | The part of the page to guard. |
| `fallback` | `ReactNode \| ({ error, reset }) => ReactNode` | a danger Alert with Try again | What to show instead. |
| `title` | `ReactNode` | "Something went wrong" | The default fallback's title. |
| `description` | `ReactNode` | "This part of the page couldn't load." | The default fallback's message. |
| `onError` | `(error, info) => void` | | Called with the error and React's `componentStack`. |
| `onReset` | `() => void` | | Called when the error is cleared (Try again, `reset()` or `resetKeys`). |
| `resetKeys` | `unknown[]` | | When a value changes, the error clears. |
| `className` | `string` | | On the default fallback's box, which has `data-component="error-boundary"`. |

A function `fallback` gets `ErrorBoundaryFallbackProps`: `error`, the value that was thrown, and `reset`, which clears it and renders the children again.

## Component tokens

Each is an optional override: set it on the page, a container or one boundary. The fallback is an Alert, so its colors follow the `--alert-*` tokens. The list lives in `src/components/ErrorBoundary/error-boundary.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--error-boundary-focus-ring` | `focus-ring` | The ring when the fallback takes focus. |
| `--error-boundary-radius` | `rounded-lg` | The fallback box's corners, matching the Alert (8px). |
