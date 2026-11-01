# ADR-0013: How overlays share Escape, focus and outside presses

**Status:** Accepted
**Deciders:** Diki (queue item 190, taken on 1 November 2026)

## Context

Queue item 190 asked for "one overlay stack for Dialog, Drawer, Popover, Menu and Toast": Escape, focus and outside presses handled in one place. Before building one, the bugs lane went through what each overlay does today, to see what a stack would fix.

All of them already lean on the browser's top layer, and on three shared pieces:

- `src/internal/layers.ts` keeps the open modal dialogs (Dialog, Drawer), innermost last. Page-wide parts (the live regions, the Toaster) move into the innermost one, because `showModal()` makes the rest of the page inert. It also marks a press that closed a popup (`markDismissal`), so the Dialog under it doesn't also take that press as a backdrop click.
- `src/internal/useAnchoredLayer.ts` shows Popover, Menu, Tooltip and the pickers' panels in the top layer next to their anchor, and gives each the same outside-press rule: a press outside the layer and its trigger closes it, a touch waits for its click (so a scroll doesn't close it), and the `<dialog>` it sits in closing closes it too.
- `src/internal/openChange.ts` gives every overlay the same reasons for asking to close (`escape`, `outside`, `blur`, `close`, `api`, …).

The DOM nesting already orders the layers: a Menu opened from a Popover, or a Popover from a Dialog, is inside it in the DOM. So "is this press outside?" and "who gets this Escape first?" come out right from `contains()` and from event order, without a separate stack.

No open bug traces to the overlays disagreeing about Escape, focus or outside presses. The last ones (L8E22, L8E104, GN3) were fixed in the shared pieces above.

## Decision

Don't add a second registry of open layers. Keep the rules below, which every overlay follows today, and hold new overlays to them:

1. **The innermost overlay takes Escape and stops it.** An overlay that closes on Escape calls `preventDefault()` and `stopPropagation()` on that keydown, from its own element (Menu, Popover, Combobox, DatePicker, TimePicker), so the overlay around it stays open. A modal `<dialog>` closes on the browser's `cancel` event, which the inner overlay's `preventDefault()` already prevents. Tooltip, which shows on hover with focus elsewhere, listens on the document in the capture phase so its Escape comes first (WCAG 1.4.13). One where people type ignores the Escape that ends an input method's composition (`isComposing`).
2. **Outside presses go through `useAnchoredLayer`.** A new anchored overlay passes `onOutside` and, for a trigger, `inside`; it doesn't add its own document listener. A press that closes a popup is marked, and Dialog and Drawer don't count a marked press as a backdrop click.
3. **Modal state goes through `layers.ts`.** A new modal calls `modalOpening()`, `modalOpened()` and `modalClosed()`, so page-wide parts move into it and the page keeps its scrollbar gutter.
4. **Focus goes back to where it came from**, unless the press that closed the overlay put it somewhere else (an outside press leaves focus where it landed).
5. **Closing is asked for, never done behind the parent's back.** Every overlay calls `onOpenChange(false, { reason })` and stays as `open` says.

## Consequences

- Queue item 190 is closed by this record, with no code change.
- If a bug turns up that these rules can't express (two overlays that aren't nested in the DOM but should close as a stack, say), that is the time for a shared stack in `layers.ts`, and a record that supersedes this one.
