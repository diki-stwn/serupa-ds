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

## Anatomy

Drawn from the `LongLabels` story.

1. **Step** (`.dk-stepper__step`): one stage of the task.
2. **Indicator** (`.dk-stepper__indicator`): its number, or a mark when it's done or has a problem.
3. **Title** (`.dk-stepper__title`): the stage's name.
4. **Description** (`.dk-stepper__description`): optional detail under the title.
5. **Connector** (`.dk-stepper__connector`): the line to the next step, filled once this one is done.
6. **Current step** (`.dk-stepper__step--current`): the stage you're on.

## Usage

- Keep step titles to a word or two, and put any detail in `description`.
- Mark a step people can skip with `optional: true` rather than writing it in the title; it shows the "Optional" tag.
- Set `status: 'error'` on a step with a problem, so people can find it from the stepper. Use `status: 'warning'` for a softer problem that doesn't stop people going on, such as photos still to add.
- Pass `onStepClick` only when going back is safe: it makes completed steps buttons that go back to them.
- For a form people can fill in any order, add `clickable="all"`: every step but the current one becomes a button, upcoming ones too.

## Behavior

- Upcoming steps have an outlined circle with their number, in the digits of the locale from `SerupaProvider` (or the browser), as Calendar writes its days: ٣ in Egyptian Arabic. The current step is filled in primary with a ring around it. Completed steps are filled with a check, and the line after them turns primary. Error steps are filled in danger. Warning steps have a warning-subtle circle, ringed and marked in warning text.
- Horizontal lines stretch between steps, level with the middle of the circles.
- When a horizontal Stepper is too narrow for its titles side by side (a phone, or 400% zoom), it keeps the circles and lines and shows one line under them: "Step 2 of 4: Profile". It switches back as soon as the titles fit, and the page never scrolls sideways. With many steps the lines shrink to 4px, and if the circles still don't fit they take the `sm` size, so eight steps fit a 320px screen. For descriptions people need to read on a phone, use `orientation="vertical"`.

## Accessibility

- An `<ol>` inside a `<nav>`. The current step has `aria-current="step"`, and completed, error or warning steps add ", completed", ", has an error" or ", needs attention" for screen readers, so the state isn't shown by color alone.
- Numbers and text keep 4.5:1, and circles, rings and marks keep 3:1, in all six themes (`Stepper.test.tsx`).
- When it's too narrow and shows only the current step, the other titles stay in the list, clipped, so screen readers still read every step. The "Step 2 of 4" line is hidden from them, since the list already says it. This keeps it within reflow (WCAG 1.4.10) at 320px.
- In forced colors (Windows high contrast) the current and completed circles are Highlight with HighlightText, exactly as set, so the browser's text backplate can't hide the number or check.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | With `onStepClick`, to each completed step (every step but the current one with `clickable="all"`); otherwise nothing in it takes focus |
| Enter / Space | On a step button, goes to that step; focus stays on it as it becomes the current step |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<nav>`. |
| `steps` | `{ title, description?, optional?, status? }[]` | | `status: 'error'` marks a step with a problem, `'warning'` one with a softer problem. |
| `current` | `number` | | The current step's index, from 0. Steps before it are complete; `steps.length` marks them all complete. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `size` | `'sm' \| 'md'` | `'md'` | 24px circles with `text-xs`, or 32px with `text-sm`. |
| `onStepClick` | `(index: number) => void` | | Makes completed steps buttons that go back to them. |
| `clickable` | `'completed' \| 'all'` | `'completed'` | Which steps `onStepClick` makes buttons: the completed ones, or every step but the current one. |
| `labels` | `{ completed?, error?, warning?, optional?, stepOf? }` | `'completed'`, `'has an error'`, `'needs attention'`, `'Optional'`, "Step 2 of 4" | Words read out after a step's title, the optional tag, and the line shown when it's too narrow for every title. |

It renders a `<nav>`; name it with `aria-label` (default `'Progress'`). `className`, `ref` and other props go to the `<nav>`.

## Component tokens

Each is an optional override: set it on the page, a container or one stepper. The list lives in `src/components/Stepper/stepper.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from stepper.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-indicator-bg` | `surface` | An upcoming step's circle. |
| `--stepper-indicator-border` | `field-border` | An upcoming step's ring (3:1 on the surface). |
| `--stepper-indicator-text` | `text-muted` | An upcoming step's number. |
| `--stepper-active-bg` | `primary` | The current and completed steps' circle. |
| `--stepper-active-text` | `on-primary` | The number or check on them. |
| `--stepper-error-bg` | `danger` | A step with an error. |
| `--stepper-error-text` | `on-danger` | The mark on it. |
| `--stepper-warning-bg` | `warning-subtle` | A step with a warning. |
| `--stepper-warning-border` | `warning-text` | Its ring. |
| `--stepper-warning-text` | `warning-text` | The mark on it. |
| `--stepper-title-color` | `text` | Step titles. |
| `--stepper-description-color` | `text-muted` | The line under a title, and "Optional". |
| `--stepper-connector` | `field-border` | The line to an upcoming step. |
| `--stepper-connector-complete` | `primary` | The line after a completed step. |
| `--stepper-focus-ring` | `focus-ring` | A clickable step's keyboard focus ring. |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-indicator-size-sm` | `spacing-6` | The circle, size="sm" (24px). |
| `--stepper-indicator-size-md` | `spacing-8` | The circle, size="md", the default (32px). |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-connector-width` | `border-width-2` | The line's thickness (2px). |
| `--stepper-radius` | `rounded-full` | The circle. |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-gap` | `spacing-3` | Space between a circle and its text (12px). |
| `--stepper-connector-gap` | `spacing-2` | Space around a line (8px). |

**Type**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-title-weight` | `font-medium` | Step titles (500). |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--stepper-press-scale` | `scale-95` | Size of a step's indicator while its head is held down (95%). 1 turns it off. |
<!-- token-table:end -->
