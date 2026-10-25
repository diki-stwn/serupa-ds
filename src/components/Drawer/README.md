# Drawer

A modal panel that slides in from an edge of the screen: navigation on small screens, filters, or details and edits without leaving the page. For a short question or form, use Dialog; for something people keep open while they work, put it in the page.

```tsx
import { Drawer, Button } from "serupa-ds";

const [open, setOpen] = React.useState(false);
<Button onClick={() => setOpen(true)}>Filters</Button>
<Drawer open={open} onOpenChange={setOpen} title="Filters" description="Narrow the list."
  footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Reset</Button><Button onClick={() => setOpen(false)}>Apply</Button></>}>
  …
</Drawer>
```

## When to use

- Navigation on small screens, where a [Sidebar](../Sidebar/README.md) doesn't fit.
- Filters for a list or a table, which people set and then apply.
- Viewing or editing one item's details without leaving the page, such as a row in a table.

## When not to use

- A short question or form: use a [Dialog](../Dialog/README.md) instead.
- Something people keep open while they work: put it in the page instead, such as a [Sidebar](../Sidebar/README.md) or a side panel.
- A few controls next to the button that opens them: use a [Popover](../Popover/README.md) instead.

## Usage

- Use `side="right"` (the default) for details and filters, and `side="left"` for navigation; use `bottom` for short sheets on small screens. `side` is physical: `right` is the right edge in a right-to-left page too.
- Give it a `title` that names what's inside ("Filters", "Order #1042").
- Put the actions in `footer` so they stay in view, with the main action last.
- Set `closeOnBackdrop={false}` when closing would lose work, such as unsaved edits.

## Behavior

- It's a native `<dialog>` opened with `showModal()`, like Dialog. Focus moves inside and stays there, the page behind can't be reached and doesn't scroll (or shift sideways when a classic scrollbar goes away), and closing moves focus back to where it was. Focus goes to the first thing that takes it; put `data-autofocus` on another to choose. A backdrop press while a popup is open inside closes only the popup.
- Left and right drawers are full height. Top and bottom drawers are full width, as tall as their content up to the screen less 64px, and rounded on the open side.
- The body scrolls on its own, so the header and footer stay in view. While it scrolls it takes Tab focus (with a focus ring), so the arrow keys and Page Down scroll it in every browser, even with nothing focusable inside. It's a region named by the title.
- It slides in over 300ms, and appears at once with `prefers-reduced-motion`.

- On a phone with a notch or a home bar, the panel's padding and the footer clear them. This needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; without `viewport-fit=cover` the browser keeps the page out of those areas itself.
- Scrolling to the end of the body doesn't scroll the page behind it (`overscroll-behavior: contain`).

## Accessibility

- `aria-modal`, named by the title (`aria-labelledby`) and described by the description.
- The title, description and body text keep 4.5:1 on the panel in all six themes (`Drawer.test.tsx`). In forced-colors mode the panel gets a border.
- A Dialog opened from inside it closes on its own: Escape closes the Dialog first, and the next Escape the Drawer.
- On Android, the system back gesture asks to close it, like Escape. Under `<React.StrictMode>`, a Drawer that is open on its first render stays the innermost modal, so toasts and announcements still move into it.
- To keep it open (unsaved changes, say), leave `open` true when `onOpenChange(false)` comes. Chromium closes a modal dialog itself on a second Escape with no click in between; the component shows it again, so `open` stays the truth.

### Keyboard

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Between the controls in the drawer; the page behind is inert, so focus stays inside |
| Escape | Asks to close it (`onOpenChange(false)`); with a Dialog open from it, the Dialog first |
| Enter / Space | On the ×, the same as Escape |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<dialog>`. Point a Button's `commandfor` at it. |
| `open` | `boolean` | | Controlled: close it yourself in `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Open at first, then it closes itself (uncontrolled). Escape, the × or the backdrop close it, and `onOpenChange(false)` still comes. |
| `onOpenChange` | `(open) => void` | | Called with `false` on Escape, the ×, or a click on the backdrop. |
| `side` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | The edge it slides in from. These are physical edges, so they stay put in right-to-left pages. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The width of a left or right drawer: 320, 384 or 512px, never wider than the screen. |
| `title` | `ReactNode` | | The heading; it also names the drawer. Without one, give it an `aria-label`. |
| `description` | `ReactNode` | | A muted line under the title. |
| `footer` | `ReactNode` | | Buttons pinned to the bottom under a line, with the main action last. |
| `closeButton` | `boolean` | `true` | The × in the corner. |
| `closeLabel` | `string` | `'Close'` | The ×'s name. |
| `closeOnBackdrop` | `boolean` | `true` | Whether a click on the backdrop closes it. Turn it off when closing would lose work. |

Every other prop, `className` and `ref` go to the native `<dialog>`.

## Component tokens

Each is an optional override: set it on the page, a container or one drawer. The list lives in `src/components/Drawer/drawer.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--drawer-bg` | `surface-overlay` | The panel's background. |
| `--drawer-text` | `text` | The panel's text: the body and the footer. |
| `--drawer-overlay` | `overlay` | The dimmed backdrop over the page. |
| `--drawer-title-color` | `text` | The title. |
| `--drawer-description-color` | `text-muted` | The description under the title (4.5:1 on surface). |
| `--drawer-border` | `border` | The line above the footer. |
| `--drawer-focus-ring` | `focus-ring` | The keyboard focus ring of a body that scrolls. |
| `--drawer-shadow` | `shadow-xl` | The panel's shadow. |
| `--drawer-width-sm` | `container-xs` | size="sm" (320px). |
| `--drawer-width-md` | `container-sm` | size="md", the default (384px). |
| `--drawer-width-lg` | `container-lg` | size="lg" (512px). |
| `--drawer-padding` | `spacing-6` | Padding inside the panel (24px). |
| `--drawer-gap` | `spacing-4` | Space between the header and the body (16px). |
| `--drawer-border-width` | `border-width-1` | The line above the footer (1px). |
| `--drawer-radius` | `rounded-xl` | The corners on the open side of a top or bottom drawer (12px). |
| `--drawer-title-weight` | `font-semibold` | The title's weight (600). |
| `--drawer-duration` | `duration-300` | Sliding in (300ms). |
