# Button

Triggers an action: submitting a form, opening a dialog, confirming or cancelling. With `href` it becomes a link that looks like a button, for navigation. Every variant also has a destructive version; every value comes from this system's tokens.

```jsx
const { Button, buttonClass } = window.Serupa;

<Button>Save changes</Button>
<Button variant="outline">Cancel</Button>
<Button destructive>Delete project</Button>
<Button variant="outline" destructive>Delete</Button>
<Button leftIcon="add">New project</Button>
<Button variant="outline" rightIcon="arrow_forward">Continue</Button>
<Button variant="ghost" icon="settings" aria-label="Settings" />
<Button loading={saving} leftIcon="save">Save changes</Button>
<Button variant="ghost" size="sm" destructive icon="delete" aria-label="Remove" />
<Button href="/signup" rightIcon="arrow_forward">Get started</Button>
<Button href="https://example.com" target="_blank" variant="link">Help</Button>
<label className={buttonClass({ variant: 'outline' })}>Upload <input type="file" hidden /></label>
```

## When to use

- Someone starts an action on the page: submitting a form, saving, opening a dialog, confirming or cancelling.
- A call to action that goes to another page and should stand out more than a text link, such as "Get started" (give it an `href`).
- The confirming step of an action that deletes something or can't be undone (with `destructive`).

## When not to use

- A link inside a sentence, or a list of links: use [Link](../Link/README.md) instead.
- An icon on its own: use [IconButton](../IconButton/README.md), which makes the label required.
- A setting that stays on or off, such as bold or mute: use [ToggleButton](../ToggleButton/README.md).
- One choice out of a few options shown side by side: use [SegmentedControl](../SegmentedControl/README.md).
- A list of actions behind one button: use [Menu](../Menu/README.md).

## Usage

- A button is never wider than its container. A text label that doesn't fit ends in an ellipsis and shows in full as the button's `title` on hover (the same words as its name, so screen readers don't hear it twice). Keyboard focus and touch don't show a title, so where a label may not fit (a narrow column, a long translation, 400% zoom) pass `wrap`: the label takes as many lines as it needs and the button grows from its size's height. Short labels are still best. In a flex row the long-labelled button is the one that gives way: it shrinks to its ellipsis rather than pushing the buttons next to it out of the row, and icon-only buttons keep their square. In a grid, give the column `minmax(0, 1fr)` rather than `auto`, or the row widens the column instead.
- One `primary` button per view or dialog; everything else is `secondary`, `outline` or `ghost`.
- Label with a verb: "Save changes", not "OK".
- Use `destructive` only for actions that delete or can't be undone, and only one solid (`primary`) destructive button per view, usually in the confirmation step.
- An icon-only button needs an `aria-label`. Prefer a label with an icon unless the icon is universally understood (close, search, settings).
- Use a left icon to reinforce the action (`add` for create) and a right icon for direction (`arrow_forward` for next, `expand_more` for menus). Don't use both.
- Prefer `disabledReason` to a bare `disabled`: people can find out what to do instead of guessing.
- Use `loading` (or return a promise from `onClick`) for actions that take longer than about a second, and keep the label as it was ("Save changes", not "Saving…") so the width doesn't jump.
- Navigation is a link: give the Button an `href`, not an `onClick` that changes the URL.
- Icons come from Material Symbols Rounded (filled), drawn as SVG. The consumer provides the click handler.

### Variants

| `variant` | Looks | Use for |
| --- | --- | --- |
| `primary` *(default)* | Solid `primary`, `on-primary` text | The one main action in a view. |
| `secondary` | `primary` outline and text on `surface-raised`; `primary-subtle` tint on hover | Alternative actions beside a primary: on-brand, a step quieter. |
| `outline` | `surface-raised` with a `border` | Neutral actions, toolbars, "Cancel". |
| `ghost` | No fill until hover | Low-emphasis actions, icon buttons in dense UI. |
| `link` | `primary` text, underline on hover | Inline actions that read like a link. |

### Destructive

Add `destructive` to any variant to give it danger colors. Pick the variant by emphasis, exactly as for a normal action:

| `variant` + `destructive` | Looks | Use for |
| --- | --- | --- |
| `primary` | Solid `danger`, `on-danger` text | The confirming button in a delete dialog. |
| `secondary` | Solid `danger` outline, `danger-text`; `danger-subtle` tint on hover | A destructive action beside a primary one. |
| `outline` | Softer `danger-border`, `danger-text` | "Delete" in a toolbar or settings row. |
| `ghost` | `danger-text`, tint on hover | "Remove" on list rows and in dense UI. |
| `link` | `danger-text`, underline on hover | Inline "Remove" or "Revoke" links. |

Hover fills use `danger-hover`, `danger-subtle-hover` and `danger-subtle`; keyboard focus shows a `danger` ring.

### Sizes

| `size` | Height | Side padding | Text | Icon | Gap |
| --- | --- | --- | --- | --- | --- |
| `sm` | 24px (`control-height-sm`) | 8px | `text-xs` (12px) | 14px | 4px |
| `md` *(default)* | 32px (`control-height-md`) | 12px | `text-sm` (14px) | 16px | 6px |
| `lg` | 44px (`control-height-lg`) | 20px | `text-base` (16px) | 20px | 8px |

All sizes use `font-medium` and `rounded-md`. `primary`, `secondary` and `outline` buttons (and their destructive versions) carry `shadow-xs` (a 1px, 5% black shadow); `ghost` and `link` stay flat, and disabled buttons drop the shadow. Use `lg` where touch matters: 44px is the minimum comfortable tap target. `sm` belongs in dense desktop UI like tables and toolbars.

### Content

A button holds a label, an icon beside a label, or an icon alone:

| Content | Props | Looks |
| --- | --- | --- |
| Label only | `children` | Text |
| Left icon | `leftIcon` + `children` | Icon, then text |
| Right icon | `rightIcon` + `children` | Text, then icon |
| Icon only | `icon` + `aria-label` | A square: 24, 32 or 44px |

**Optical balance.** An icon reads lighter than text, so a button with one icon adds 4px of padding on the text side:

| `size` | Label only | Left icon (left / right) | Right icon (left / right) |
| --- | --- | --- | --- |
| `sm` | 8 / 8px | 8 / 12px | 12 / 8px |
| `md` | 12 / 12px | 12 / 16px | 16 / 12px |
| `lg` | 20 / 20px | 20 / 24px | 24 / 20px |

Button applies this automatically. With `buttonClass`, pass `iconPosition: 'left'` or `'right'`.

Pass any Material Symbols name (see the Icon guidelines) as a string (`leftIcon="add"`), or an icon imported from `serupa-ds/icons` (`leftIcon={Add}`), and Button renders it as an `Icon` in the Rounded, filled style at the right size. You can also pass an element. An icon-only button logs a warning if it has no `aria-label`.

### Links

A Button with `href` renders a link (`<a>`) with the button's look, because navigation belongs in a link: it opens in a new tab, shows its address and is listed among the page's links by screen readers.

- **Router links.** Register your router's link component once, at startup, and every Button with `href` uses it:

  ```jsx
  // Next.js
  import Link from 'next/link';
  Serupa.configure({ link: Link });

  // React Router: its Link takes `to`, so map href to it
  import { Link } from 'react-router-dom';
  Serupa.configure({ link: React.forwardRef(({ href, ...p }, ref) => <Link ref={ref} to={href} {...p} />) });
  ```

- **New tabs.** `target="_blank"` gets `rel="noopener noreferrer"` unless you pass `rel`.
- **Addresses from people.** Check any `href` that comes from people, such as a profile's website: allow only `https:`, `http:`, `mailto:` or your own paths. React still renders a `javascript:` link, which runs code when clicked.
- **Disabled.** Links have no disabled state in HTML, so a disabled link Button renders without `href`, with `role="link"` and `aria-disabled`: it can't be followed or focused and isn't listed as a link.
- **Loading** works as on a button: clicks do nothing until it ends.
- **Anything else** (a `<label>` for a file input, a `<summary>`): style it with `buttonClass({ variant, size, destructive })`.

### Forms and backend calls

The button is a plain `<button>`, so it works with any form library, router or data layer.

- **`type` defaults to `"button"`**, so a button inside a `<form>` never submits by accident. Pass `type="submit"` for the form's submit button; `name`, `value`, `form`, `formAction` and every other `<button>` attribute pass through.
- **Every native `<button>` attribute works**, checked in a browser: `autoFocus`, `disabled`, `form`, `formAction`, `formEncType`, `formMethod`, `formNoValidate`, `formTarget`, `name`, `value`, `type`, `popoverTarget` / `popoverTargetAction` (opens a `popover` element with no JavaScript) and `commandfor` / `command` (opens a `<dialog>` with `command="show-modal"`), plus global and event attributes. `name` and `value` are sent with the form when this button submits it, so one form can have Save and Publish buttons (`name="intent"`).
- **`loading` blocks repeat requests.** While it's true, clicks, Space and Enter on the button, and Enter in a form field (implicit submission) do nothing, so a slow request can't be sent twice. The click still bubbles, so a parent's handler hears it. The button keeps keyboard focus (unlike `disabled`, which would drop it mid-request) and sets `aria-busy` and `aria-disabled`.
- **`disabled`** is the native attribute: the button leaves the tab order and ignores clicks.
- **`disabledReason` says why.** With `disabled`, the button uses `aria-disabled` instead, so it stays in the tab order: keyboard and screen reader users can reach it and hear the reason as its description (`aria-describedby`), and it still looks disabled and ignores clicks, Enter and form submission. To show the reason on hover and focus as well, wrap it in a [Tooltip](../Tooltip/README.md) with the same words; the button then lets the tooltip describe it, so the reason is read once. A disabled link Button with a reason gets `tabIndex={0}`. Without `disabled`, `disabledReason` does nothing.
- **An `onClick` that returns a promise loads by itself.** The button shows `loading` until the promise settles, so a second click can't send the request twice, and you don't need your own loading state. A promise that settles within 300ms shows no spinner at all. Once the spinner shows, it stays at least 500ms, so one that ends just after 300ms doesn't flash it for a frame. With `successText` ("Saved"), a resolved promise shows a check (after the spinner, if one showed) in place of the label for 2 seconds (the button keeps its width and name) and announces the text politely. A rejected promise just ends the loading; show the error yourself. The rejection isn't swallowed: it still reaches `window`'s `unhandledrejection` (and Sentry or any other error reporting) once, as it would without Button.
- **A submit button in a form with an `action` loads by itself.** With `<form action={save}>` (React 19 form actions), a `type="submit"` Button shows `loading` while the form is being sent, from React's `useFormStatus`, so you don't need your own state. Set `loading` yourself to override it.
- **`ref`** reaches the DOM element (the `<button>`, or the `<a>` with `href`), for focusing after an error.

```jsx
function SaveForm() {
  const [saving, setSaving] = React.useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try { await fetch('/api/projects', { method: 'POST', body: new FormData(e.currentTarget) }); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={onSubmit}>
      <input name="title" />
      <Button type="submit" loading={saving} leftIcon="save">Save changes</Button>
    </form>
  );
}
```

**Data attributes** for tests, analytics and styling: every button has `data-component="button"`, `data-variant` and `data-size`, plus `data-destructive`, `data-icon-only`, `data-loading`, `data-success` and `data-disabled` when they apply. Select with `[data-component="button"][data-loading]`, for example; don't select by the `dk-btn` class names.

### Micro-interactions

Small motion that confirms what happened, all built in:

| Interaction | What it does | Turn off or tune |
| --- | --- | --- |
| Press | While held (pointer, Space or Enter) the button shrinks to 97% in 100ms and comes back on release over 300ms (`motion-release`) with `ease-enter`, settling at full size with no overshoot | `--button-press-scale: 1` |
| Icon nudge (off by default) | When turned on, a right icon slides in its direction on hover (on devices that hover), mirrored in right-to-left text. Left icons stay still. It suits forward arrows ("Continue →"), not chevrons or other icons, so it's off unless you turn it on | On: `--button-icon-nudge: var(--spacing-0\.5)` (2px) |
| Loading | The label and icons fade out while the spinner fades and grows in, in 150ms; both blur a little (`blur-xs`) as they cross, so it reads as one change; they fade back when done | `--button-loading-duration: 0ms` |

- They animate only `scale`, `translate`, `opacity` and the loading blur (`filter`), so nothing around the button reflows, and they never change its size, name or behaviour: clicks, keys, forms and your own `onPointerDown`, `onKeyDown` and `onKeyUp` work as before.
- No press on disabled, loading or `link`-variant buttons (the link variant reads as text).
- Hover colors apply only on devices that hover (a mouse or trackpad). A phone keeps hover on the last button tapped, so on touch screens a tapped button goes straight back to its resting color, and the press is the feedback. This holds for every component's hover styles (`tools/test/touch-hover.mjs`).
- With reduced motion turned on (an operating-system setting), there's no press or nudge, and loading only fades (no blur).
- `buttonClass()` on another element gets the press, nudge and loading fade (they're all CSS).
- To turn the icon nudge on for a flow of "next" buttons:

  ```css
  .wizard-footer { --button-icon-nudge: var(--spacing-0\.5); }
  ```

- Set the tokens on the page, a container or one button, like any component token (see the Motion table below).

## States

| State | Looks | Cursor |
| --- | --- | --- |
| Default | Variant colors, `shadow-xs` on filled and outline buttons | `pointer` |
| Hover | `primary` darkens one step (`primary-hover`); secondary gains a `primary-subtle` tint and its text and border darken to `primary-hover`; outline and ghost gain a `secondary` fill; link underlines; a right icon slides 2px forward | `pointer` |
| Pressed | Hover colors, shrinks to 97% (`scale-97`) | `pointer` |
| Focus (keyboard) | A 2px `focus-ring` outline 2px out (`danger` when destructive). The gap is transparent, so it reads on tinted backgrounds; forced-colors (high-contrast) mode draws it in the system color | `pointer` |
| Disabled | 50% opacity, no shadow, no hover change, ignores clicks | `not-allowed` |
| Loading | Full color, the content fades into a spinner, no hover change, no press, ignores clicks, keeps focus | `progress` |

**Loading details.** `loading` shows the [Loader](../Loader/README.md) (ring, decorative, at the button's icon size) while an action runs. The spinner sits in the center of every loading button — label only, with a left or right icon, or icon only — over the hidden content, so the button keeps its width and nothing around it shifts. The button sets `aria-busy` and `aria-disabled` so screen readers announce it as busy. Under reduced motion the ring's arc holds still and it turns slower.

## Accessibility

Button's behaviour follows web standards; its look comes only from this design system's tokens.

| Behaviour | Source |
| --- | --- |
| Renders a real `<button>` (Space and Enter press it, it's in the tab order, `disabled` works); `type` defaults to `"button"` because a `<button>` in a form otherwise submits it | [HTML Standard: the button element](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element), [MDN: `<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) |
| Actions use `<button>`; navigation uses a real link (`href`), never an `onClick` that changes the URL | [WAI-ARIA APG: Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [MDN: button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role) |
| Loading blocks clicks and Enter-key implicit submission, but keeps focus (`aria-disabled`, not `disabled`), keeps the button's accessible name, and announces "Loading…" (`loadingText`) through a polite `role="status"` region | [HTML Standard: implicit submission](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission), [APG: focusability of disabled controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols), [WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) |
| A disabled link has no `href` (so it isn't a link, can't be focused or followed), with `role="link"` and `aria-disabled`; `target="_blank"` gets `rel="noopener noreferrer"` | [HTML Standard: the a element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element), [MDN: aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled), [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener) |
| Icon-only buttons need an `aria-label` (warns without one); icons are `aria-hidden` | [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html), [WCAG 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) |
| An `aria-label` on a button with visible text should start with that text ("Delete project", not "Remove") | [WCAG 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) |
| Visible keyboard focus, also in forced-colors (high-contrast) mode | [WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [WCAG 2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) |
| Every size is at least 24×24px; use `lg` (44px) on touch-first screens | [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [WCAG 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) |
| Under reduced motion the spinner turns slower with a steady arc, and press and nudge are off | [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) |
| Toggle buttons pass `aria-pressed`; menu buttons pass `aria-haspopup`, `aria-expanded` and `aria-controls` | [APG: Button pattern (toggle)](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [APG: Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) |

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the button (also when it's loading or has a `disabledReason`; a plain `disabled` button is skipped) |
| Enter, Space | Press it; Enter shows the press as Space does. While loading, or disabled with a reason, nothing happens |
| Enter in a form field | Submits the form through a `type="submit"` button, unless that button is loading |

## Props

Button's own props are `variant` (`primary`), `destructive`, `size` (`md`), `leftIcon`, `rightIcon`, `icon`, `loading` (default: on while a `type="submit"` button's `<form action>` is being sent), `loadingText` (what screen readers hear when loading starts; default "Loading…", `""` for silence), `disabledReason` (why it's disabled: keeps it focusable and describes it), `successText` (shown with a check and announced after a promise from `onClick` resolves) and `wrap` (a long label takes more lines instead of an ellipsis; default `false`). With `href` it renders a link and takes link attributes (`target`, `rel`, `download`…); without, it's a `<button>` and takes button attributes (`type`, which defaults to `"button"`, `form`, `name`…). Everything else (`onClick`, `disabled`, `aria-label`…) passes straight through, and `id` goes to the `<button>` or `<a>` itself. That includes the native popover and invoker attributes, typed here because React's types don't list them yet: `popoverTarget` with `popoverTargetAction` (`show`, `hide` or `toggle`) works a `[popover]` element by id, and `commandfor` with `command` (such as `show-modal` for a `<dialog>`) sends it an invoker command.

`buttonClass({ variant, size, destructive, iconOnly, iconPosition, className })` returns the class names, to style any other element as a button. `Serupa.configure({ link })` sets the component that renders link Buttons.

## Component tokens

Button's colors, spacing, sizes, borders and micro-interactions go through its own tokens. Each is an optional override: set the CSS variable on the page, on a container or on one button, and every Button inside follows. Unset, it uses the shared token below, in the button's own theme, so themes (including nested ones) keep working. The list lives in `src/components/Button/button.tokens.json` (W3C Design Tokens format, also published in `design-tokens/components/`), and the tests check that the CSS uses exactly these defaults.

```css
/* pill-shaped buttons everywhere */
:root { --button-radius: var(--rounded-full); }

/* compact buttons in one toolbar */
.toolbar { --button-height-md: var(--control-height-sm); --button-padding-x-md: var(--spacing-2); }

/* a one-off brand color, only on this button */
<Button style={{ '--button-primary-bg': 'var(--emerald-600)', '--button-primary-bg-hover': 'var(--emerald-700)' }}>Upgrade</Button>
```

Override with tokens (`var(--rounded-full)`), not raw values, so the result still follows the system. If you change a color, check its contrast: the tests only check the defaults.

<!-- token-table:start (made from button.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--button-primary-bg` | `primary` | Primary background. |
| `--button-primary-bg-hover` | `primary-hover` | Primary background on hover. |
| `--button-primary-text` | `on-primary` | Primary text and icons. |
| `--button-secondary-bg` | `surface-raised` | Secondary background. |
| `--button-secondary-bg-hover` | `primary-subtle` | Secondary background on hover. |
| `--button-secondary-text` | `primary` | Secondary text and icons. |
| `--button-secondary-text-hover` | `primary-hover` | Secondary text and icons on hover. |
| `--button-secondary-border` | `primary` | Secondary border. |
| `--button-secondary-border-hover` | `primary-hover` | Secondary border on hover. |
| `--button-outline-bg` | `surface-raised` | Outline background. |
| `--button-outline-bg-hover` | `secondary` | Outline background on hover. |
| `--button-outline-text` | `text` | Outline text and icons. |
| `--button-outline-border` | `border` | Outline border. |
| `--button-ghost-bg` | `transparent` | Ghost background (transparent). |
| `--button-ghost-bg-hover` | `secondary` | Ghost background on hover. |
| `--button-ghost-text` | `text` | Ghost text and icons. |
| `--button-link-text` | `primary` | Link text. |
| `--button-destructive-primary-bg` | `danger` | Destructive primary background. |
| `--button-destructive-primary-bg-hover` | `danger-hover` | Destructive primary background on hover. |
| `--button-destructive-primary-text` | `on-danger` | Destructive primary text and icons. |
| `--button-destructive-secondary-bg` | `surface-raised` | Destructive secondary background. |
| `--button-destructive-secondary-bg-hover` | `danger-subtle` | Destructive secondary background on hover. |
| `--button-destructive-secondary-text` | `danger-text` | Destructive secondary text and icons. |
| `--button-destructive-secondary-border` | `danger` | Destructive secondary border (solid red, stronger than the outline's). |
| `--button-destructive-outline-bg` | `surface-raised` | Destructive outline background. |
| `--button-destructive-outline-bg-hover` | `danger-subtle` | Destructive outline background on hover. |
| `--button-destructive-outline-text` | `danger-text` | Destructive outline text and icons. |
| `--button-destructive-outline-border` | `danger-border` | Destructive outline border. |
| `--button-destructive-ghost-bg-hover` | `danger-subtle` | Destructive ghost background on hover. |
| `--button-destructive-ghost-text` | `danger-text` | Destructive ghost text and icons. |
| `--button-destructive-link-text` | `danger-text` | Destructive link text. |
| `--button-focus-ring` | `focus-ring` | Keyboard focus ring. |
| `--button-destructive-focus-ring` | `danger` | Keyboard focus ring on a destructive button. |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--button-padding-x-sm` | `spacing-2` | Side padding, sm (8px). |
| `--button-padding-x-md` | `spacing-3` | Side padding, md (12px). |
| `--button-padding-x-lg` | `spacing-5` | Side padding, lg (20px). |
| `--button-gap-sm` | `spacing-1` | Gap between icon and label, sm (4px). |
| `--button-gap-md` | `spacing-1.5` | Gap between icon and label, md (6px). |
| `--button-gap-lg` | `spacing-2` | Gap between icon and label, lg (8px). |
| `--button-icon-offset` | `spacing-1` | Extra padding on the text side of a button with one icon, which reads lighter than text (4px). |
| `--button-padding-y-wrap` | `spacing-1` | Top and bottom padding of a `wrap` button, md and lg (4px). |
| `--button-padding-y-wrap-sm` | `spacing-0.5` | Top and bottom padding of a `wrap` button, sm (2px). |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--button-height-sm` | `control-height-sm` | Height, sm (24px); also the width of an icon-only sm button. |
| `--button-height-md` | `control-height-md` | Height, md (32px); also the width of an icon-only md button. |
| `--button-height-lg` | `control-height-lg` | Height, lg (44px); also the width of an icon-only lg button. |
| `--button-icon-size-sm` | `spacing-3.5` | Icon size, sm (14px). |
| `--button-icon-size-md` | `spacing-4` | Icon size, md (16px). |
| `--button-icon-size-lg` | `spacing-5` | Icon size, lg (20px). |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--button-border-width` | `border-width-1` | Border width (1px; drawn on outline buttons, invisible on the others but shown in forced-colors mode). |
| `--button-radius` | `rounded-md` | Corner radius (6px). |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--button-press-scale` | `scale-97` | Size while pressed (97%). 1 turns press feedback off. |
| `--button-press-duration` | `motion-press` | How fast the press scales down (100ms). The release comes back over `motion-release`. |
| `--button-icon-nudge` | `spacing-0` | How far a right icon slides on hover. Off by default (0); set it to `var(--spacing-0\.5)` (2px) where right icons are forward arrows. |
| `--button-icon-nudge-duration` | `motion-change-sm` | How fast the right icon slides (150ms). |
| `--button-loading-duration` | `motion-enter-sm` | Cross-fade between the content and the loading spinner (150ms). |
<!-- token-table:end -->

### All tokens Button reads

Every value comes from a token. Colors, spacing, sizes, borders and micro-interactions go through the component tokens above; the rest reads the shared tokens directly.

| Part | Tokens |
| --- | --- |
| Colors | `primary`, `primary-hover`, `on-primary`, `secondary`, `secondary-hover`, `surface-raised`, `text`, `border`, `danger`, `danger-hover`, `on-danger`, `danger-subtle`, `danger-subtle-hover`, `danger-text`, `danger-border`, `focus-ring` |
| Height | `control-height-sm` / `control-height-md` / `control-height-lg` (shared with every control, so a Button lines up with an Input) |
| Padding, gap, icon size | `spacing-2` / `spacing-3` / `spacing-5`; `spacing-1`, `spacing-1.5`, `spacing-2`; `spacing-3.5`, `spacing-4`, `spacing-5` |
| Type | `font-sans`, `font-medium`, `tracking-normal`, `text-xs`, `text-sm`, `text-base` (each with its `--line-height`) |
| Shape | `rounded-md`, `border-width-1`, `shadow-xs`, `shadow-none` |
| Focus ring | `focus-ring-width` (the ring), `focus-ring-offset` (the gap), `focus-ring` (the color) |
| States | `opacity-disabled` (disabled), `opacity-0` (content hidden while loading), `underline-offset-4` (link) |
| Motion | `duration-150` and `ease-in-out` for colors and the focus ring; `scale-97`, `duration-100`, `spacing-0.5`, `duration-150`, `opacity-20`, `duration-500`, `duration-300`, `ease-out` for the micro-interactions; `scale-50`, `scale-100`, `scale-0`, `spacing-0` and `rounded-full` inside them |
| Components and utilities it reuses | the Loader (ring) while loading, `sr-only` on the loading announcement |
| Icons | `leading-none`, `spacing-6` (Icon's default size) |
