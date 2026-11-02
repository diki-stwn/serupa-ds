# Popover

A small panel next to its trigger for content people interact with: a short form, filters, details with links. It's a non-modal dialog: the rest of the page stays usable, and it closes on Escape, a click outside, or when focus moves elsewhere.

```jsx
const { Popover, Button, Field, Input } = window.Serupa;

<Popover title="Share" trigger={<Button variant="outline" leftIcon="share">Share</Button>}>
  {(close) => (
    <form onSubmit={(e) => { e.preventDefault(); invite(); close(); }}>
      <Field label="Email"><Input type="email" /></Field>
      <Button type="submit">Invite</Button>
    </form>
  )}
</Popover>

<Popover aria-label="About billing" placement="right-start" initialFocus="panel"
  trigger={<IconButton icon="info" label="About billing" />}>
  You're billed on the 1st of each month.
</Popover>
```

## When to use

- A short form tied to one control, such as sharing with an email address or renaming in place.
- Filters or settings people adjust and then close, while the page stays in view.
- Details with links or buttons about one item, such as a person's card or an explanation with a "Learn more" link.

## When not to use

- A short hint: use [Tooltip](../Tooltip/README.md) instead.
- A list of actions: use [Menu](../Menu/README.md) instead.
- Something people must finish or dismiss before going on: use [Dialog](../Dialog/README.md) instead.

## Anatomy

Drawn from the `Bottom` story, opened.

1. **Title** (`.dk-popover__title`): an optional heading that names the popover.
2. **Body** (`.dk-popover__body`): its content.

## Usage

- The trigger is one element that passes its ref and props on to a DOM element: a Button, IconButton or link, or your own component written with `React.forwardRef` (or the `ref` prop in React 19) that spreads what it gets. A text, several elements or a Fragment throws an error that names the component, and a trigger that drops its ref warns once in the console ("Serupa: Menu's trigger doesn't forward its ref to an element.").
- Keep it small: a few fields or a short paragraph. If it needs scrolling, use a [Drawer](../Drawer/README.md) or a [Dialog](../Dialog/README.md).
- Give it a `title`, or an `aria-label` when there's none, so it has a name.
- Use the function form of `children` to close it from a Done, Cancel or submit button.
- When it holds only text, set `initialFocus="panel"`: there's no control inside to focus.

## Accessibility

- The panel is a `role="dialog"` named by its title (or `aria-label`); the trigger has `aria-expanded` and `aria-controls`.
- The title is an `<h2>`, as in Dialog, so screen reader users can jump to it by heading; set `headingLevel` to fit the page's outline.
- Opening moves focus inside; Escape and `close()` return it to the trigger. It sits right after the trigger in the tab order, so Tab moves from the trigger into it.
- A click outside or focus moving elsewhere closes it, without moving focus.
- Text and the title keep 4.5:1 on the panel in all six themes (`Popover.test.tsx`).
- It fades and grows in out of its trigger over 150ms, and fades and shrinks back over 100ms when it closes; with reduced motion it only fades. The motion is a transition, so closing it while it opens turns back from where it is. Its content stays while it fades out, inert, and focus goes back to the trigger at once. One open on arrival (`defaultOpen`, or `open` on the first render) is there from the first frame. Firefox and Safari can't keep a closing popover in the top layer yet, so there it closes at once. From the keyboard there is no motion: opened by Enter or Space it is there at once, and Escape takes it away at once.

### Keyboard

| Key | Does |
| --- | --- |
| Enter / Space | On the trigger, opens it and moves focus inside |
| Tab | From the trigger into the panel, which sits right after it; out of the panel, closes it |
| Escape | Closes it and returns focus to the trigger |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `trigger` | element | required | One element that can take focus; it gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` |
| `children` | node, or `(close) => node` | required | The content. The function form gets `close()` for a Done or Cancel button |
| `title` | node | none | A heading at the top that names it |
| `headingLevel` | `2`–`6` | `2` | The title's heading level, to fit the page outline |
| `placement` | `'bottom'`, `'top'`, `'left'`, `'right'`, each with `-start` or `-end` | `'bottom'` | Where it goes; it flips and shifts to stay on screen, and with no room on either side it takes the roomier one and scrolls inside. On the left or right, a popover wider than the room beside its trigger gets that width and wraps |
| `open`, `onOpenChange` | boolean, function | none | Open it yourself (controlled). onOpenChange(open, { reason }) says why: `'trigger'`, `'escape'`, `'outside'`, `'blur'` or `'close'` |
| `defaultOpen` | boolean | `false` | Open at first (uncontrolled) |
| `aria-label` | string | none | Its name when there's no title |
| `initialFocus` | `'first'` \| `'panel'` | `'first'` | Focus the first control inside that can take it (not a hidden one, or one in a disabled fieldset), or the panel itself (for text only) |
| `className`, `style`, other HTML attributes and a ref | | | Go to the panel, which has `data-component="popover"` and `data-side`: `data-testid`, an `id`, other `aria-*` and a ref reach it, as on Radix's and React Aria's popover content. Its `onKeyDown` runs first and can call `preventDefault()` to keep Escape from closing it |

The panel's id is made for you unless you pass one, and the trigger's `aria-controls` points at it while it's open. An id on the trigger stays on the trigger.

## Component tokens

Each is an optional override: set it on the page, a container or one popover. The list lives in `src/components/Popover/popover.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from popover.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--popover-bg` | `surface-overlay` | The panel's background. |
| `--popover-text` | `text` | The panel's text. |
| `--popover-border` | `border-overlay` | The panel's border. |
| `--popover-title-color` | `text` | The title. |
| `--popover-focus-ring` | `focus-ring` | The panel's focus ring, when it takes focus itself. |
| `--popover-shadow` | `shadow-lg` | The panel's shadow. |
| `--popover-radius` | `rounded-lg` | The panel's corners (8px). |
| `--popover-border-width` | `border-width-1` | The panel's border (1px). |
| `--popover-title-size` | `text-sm` | The title (14px). |
| `--popover-title-weight` | `font-semibold` | The title's weight (600). |
| `--popover-width` | `container-3xs` | The panel's width (256px; it never gets wider than the screen). |
| `--popover-padding` | `spacing-4` | Space inside the panel (16px). |
| `--popover-gap` | `spacing-2` | Space under the title (8px). |
| `--popover-offset` | `spacing-2` | The gap between the panel and its trigger (8px). |
| `--popover-z-index` | `z-popover` | The stacking level where the browser has no top layer (popover). |
<!-- token-table:end -->
