# Stepper

Shows where people are in a task split into steps, such as sign-up, checkout or setup. Each step has a numbered circle and a title; completed steps show a check. Use it for 3 to about 7 steps. For switching between views use Tabs, and for a single value use Progress.

```tsx
import { Stepper } from "serupa-ds";

<Stepper current={1} steps={[
  { title: "Account", description: "Email and password" },
  { title: "Profile", optional: true },
  { title: "Billing" },
  { title: "Review" },
]} />

// let people go back to finished steps
<Stepper current={step} onStepClick={setStep} steps={steps} />

// stacked, for narrow spaces
<Stepper orientation="vertical" current={2} steps={steps} />
```

## When to use

- A task split into 3 to about 7 steps done in order, such as sign-up, checkout or setup.
- People need to see which steps are done and how many are left.
- People may go back to a finished step to change it.

## When not to use

- Views people can open in any order: use [Tabs](../Tabs/README.md) instead.
- How far along one thing is, such as an upload: use [Progress](../Progress/README.md) instead.
- Where a page sits in the site: use [Breadcrumb](../Breadcrumb/README.md) instead.

## Usage

- Keep step titles to a word or two, and put any detail in `description`.
- Mark a step people can skip with `optional: true` rather than writing it in the title; it shows the "Optional" tag.
- Set `status: 'error'` on a step with a problem, so people can find it from the stepper.
- Pass `onStepClick` only when going back is safe: it makes completed steps buttons that go back to them.

## Behavior

- Upcoming steps have an outlined circle with their number, in the digits of the locale from `SerupaProvider` (or the browser), as Calendar writes its days: ٣ in Egyptian Arabic. The current step is filled in primary with a ring around it. Completed steps are filled with a check, and the line after them turns primary. Error steps are filled in danger.
- Horizontal lines stretch between steps, level with the middle of the circles.
- When a horizontal Stepper is too narrow for its titles side by side (a phone, or 400% zoom), it keeps the circles and lines and shows one line under them: "Step 2 of 4: Profile". It switches back as soon as the titles fit, and the page never scrolls sideways. For descriptions people need to read on a phone, use `orientation="vertical"`.

## Accessibility

- An `<ol>` inside a `<nav>`. The current step has `aria-current="step"`, and completed or error steps add ", completed" or ", has an error" for screen readers, so the state isn't shown by color alone.
- Numbers and text keep 4.5:1, and circles, rings and marks keep 3:1, in all six themes (`Stepper.test.tsx`).
- When it's too narrow and shows only the current step, the other titles stay in the list, clipped, so screen readers still read every step. The "Step 2 of 4" line is hidden from them, since the list already says it. This keeps it within reflow (WCAG 1.4.10) at 320px.
- In forced colors (Windows high contrast) the current and completed circles are Highlight with HighlightText, exactly as set, so the browser's text backplate can't hide the number or check.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | With `onStepClick`, to each completed step; otherwise nothing in it takes focus |
| Enter / Space | On a completed step, goes back to it |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<nav>`. |
| `steps` | `{ title, description?, optional?, status? }[]` | | `status: 'error'` marks a step with a problem. |
| `current` | `number` | | The current step's index, from 0. Steps before it are complete; `steps.length` marks them all complete. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `size` | `'sm' \| 'md'` | `'md'` | 24px circles with `text-xs`, or 32px with `text-sm`. |
| `onStepClick` | `(index: number) => void` | | Makes completed steps buttons that go back to them. |
| `labels` | `{ completed?, error?, optional?, stepOf? }` | `'completed'`, `'has an error'`, `'Optional'`, "Step 2 of 4" | Words read out after a step's title, the optional tag, and the line shown when it's too narrow for every title. |

It renders a `<nav>`; name it with `aria-label` (default `'Progress'`). `className`, `ref` and other props go to the `<nav>`.

## Component tokens

Each is an optional override: set it on the page, a container or one stepper. The list lives in `src/components/Stepper/stepper.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-indicator-bg` | `surface` | An upcoming step's circle. |
| `--stepper-indicator-border` | `field-border` | An upcoming step's ring (3:1 on the surface). |
| `--stepper-indicator-text` | `text-muted` | An upcoming step's number. |
| `--stepper-active-bg` | `primary` | The current and completed steps' circle. |
| `--stepper-active-text` | `on-primary` | The number or check on them. |
| `--stepper-error-bg` | `danger` | A step with an error. |
| `--stepper-error-text` | `on-danger` | The mark on it. |
| `--stepper-title-color` | `text` | Step titles. |
| `--stepper-description-color` | `text-muted` | The line under a title, and "Optional". |
| `--stepper-connector` | `field-border` | The line to an upcoming step. |
| `--stepper-connector-complete` | `primary` | The line after a completed step. |
| `--stepper-focus-ring` | `focus-ring` | A clickable step's keyboard focus ring. |
| `--stepper-indicator-size-sm` | `spacing-6` | The circle, size="sm" (24px). |
| `--stepper-indicator-size-md` | `spacing-8` | The circle, size="md", the default (32px). |
| `--stepper-connector-width` | `border-width-2` | The line's thickness (2px). |
| `--stepper-radius` | `rounded-full` | The circle. |
| `--stepper-gap` | `spacing-3` | Space between a circle and its text (12px). |
| `--stepper-connector-gap` | `spacing-2` | Space around a line (8px). |
| `--stepper-title-weight` | `font-medium` | Step titles (500). |
