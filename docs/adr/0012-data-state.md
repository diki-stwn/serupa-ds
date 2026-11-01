# ADR-0012: One data-state vocabulary across components

**Status:** Accepted
**Deciders:** Diki (queue item G11, taken on 1 November 2026)

## Context

Components mark their state on the DOM with `data-state` so app CSS, tests and the components' own styles can select on it. The values grew one component at a time. Most overlays and disclosures said `open` or `closed`, but Dialog, Drawer, DatePicker, DateRangePicker, TimePicker and TreeView's items said nothing, so an app that styled "every open overlay" had to know which components used which attribute, `[open]`, `aria-expanded` or a class.

## Decision

`data-state` takes one of these sets. A component uses the set for what its element is, and never invents a synonym for one of them.

| Set | Values | For |
|---|---|---|
| Open | `open`, `closed` | Anything that shows and hides content: Accordion items, Combobox, DatePicker, DateRangePicker, Dialog, Drawer, Menu (and its sub-menus and their items), Navbar, Popover, Sidebar groups, TimePicker, Tooltip, TreeView items that have children |
| Selected in a set | `active`, `inactive` | One of several, where one shows at a time: Tabs' tabs and panels |
| Progress | `loading`, `complete`, `indeterminate` (Progress); `upcoming`, `current`, `complete`, `warning`, `error` (Stepper) | How far something has gone |
| Status | the component's own status, as its prop names it | Image (`loading`, `loaded`, `error`), Meter (its zone), SaveStatus (`idle`, `saving`, `saved`, `error`), InlineEdit (`editing`, `viewing`) |
| Transient | one word while it lasts, absent otherwise | Splitter (`collapsed`), SortableList (`dragging`) |

Rules:

- **It is written on the element that changes**, the one with `data-component` for a whole component, or the item for a part (an Accordion item, a tree item, a tab).
- **Both values of a pair are written.** `closed` is there when closed, so a selector doesn't have to be `:not([data-state="open"])`. The transient set is the one exception.
- **Native state stays native.** Checkbox, Radio, Switch and Select are native controls, uncontrolled as often as not; React doesn't see every change, so a `data-state` could be stale. Select on `:checked`, `:indeterminate` and `:open` there.
- **ARIA stays the source for assistive tech.** `data-state` is for styling and tests, and mirrors `aria-expanded`, `aria-selected` or `open` where there is one; it never replaces them.

## Consequences

- Adding `data-state` to a component, or the missing half of a pair, is a minor release: it adds an attribute.
- Renaming or removing a value is a major, with a migration note, since app CSS selects on it.
- A new component picks its set from the table, or adds a row here in the same pull request.
