---
name: serupa
description: Build React UI with the Serupa design system (serupa-ds). Use when a project depends on serupa-ds, or when asked to add a screen, form or component that should look and behave like the rest of a Serupa app.
---

# Serupa design system

Serupa is a React 19 component library with design tokens, six themes and utility classes. It is accessible to WCAG 2.2 AA in every theme. Use its components and tokens instead of writing your own. They already handle keyboard use, focus, screen readers, dark mode, right-to-left text and reduced motion.

## Install and load

```sh
npm install github:diki-stwn/serupa-ds#v12.0.0
```

Pin a release tag, never `#main`. The tag is prebuilt, so nothing runs on install. Then load the CSS once, in this order, before any of your own CSS:

```js
import 'serupa-ds/tokens.css';   // every token, the themes, the fonts: always first
import 'serupa-ds/base.css';     // page defaults; leave out when adding Serupa to an existing app
import 'serupa-ds/bundle.css';   // components and utility classes (or components.css, plus utilities.css)
// import 'serupa-ds/utilities-extra.css';   // only for masks and gradients: mask-*, bg-linear-*, from-*, via-*, to-*
import { Button, Field, Input } from 'serupa-ds';
```

The styles sit in cascade layers (`dk.tokens`, `dk.base`, `dk.components`, `dk.utilities`). The app's own unlayered CSS always wins over them, so an override never needs `!important`.

For production, trim the CSS in the build: `import { serupaPurge } from 'serupa-ds/purge'` and add `serupaPurge()` to Vite's `plugins` (or `serupaPurgePostcss()` to `postcss.config.mjs` for Next.js and webpack). Without a bundler: `npx serupa-purge src -o public/bundle.min.css --components`. List any class the code builds at runtime with `keep: [...]` (or `--keep`).

## Theme

Put the brand and mode on `<html>`, and load `theme.js` first in `<head>` (or paste its text in an inline script) so the page has no flash of the wrong theme:

```html
<html lang="en" data-brand="blue" data-mode="auto">   <!-- brand: blue | violet | emerald; mode: auto | light | dark -->
```

One theme on one element: `data-theme="violet-dark"`. For locale and the built-in words, wrap the app in `<SerupaProvider locale="id-ID" labels={idLabels}>`. For router links, call `configure({ link: Link })` once at startup.

## Rules

1. **Use a component when one fits.** Pick it from the list below. Don't rebuild a button, field, dialog, menu or table out of `div`s.
2. **Tokens only.** Write no raw colors, pixel sizes, durations or shadows. Use the utility classes (`p-4`, `gap-2`, `bg-surface`, `text-text-muted`, `rounded-md`, `shadow-md`) or `var(--…)` tokens in your CSS (`var(--spacing-4)`, `var(--primary)`).
3. **Colors by role, not hue.** Use the alias tokens, which change per theme: `primary`, `on-primary`, `surface`, `surface-muted`, `text`, `text-muted`, `border`, `danger`, `danger-text`, `success-text`, `warning-text`, `focus-ring`. A palette color like `blue-600` looks the same in every theme. Use one only when no alias fits. For text in a status color, use the `*-text` alias, never the fill.
4. **Restyle through component tokens.** Each component reads its own tokens (`--button-*`, `--input-*`), which default to the aliases. Override them on the page, a container or one instance, rather than overriding its `dk-*` classes.
5. **Shared props.** `size` is `'sm' | 'md' | 'lg'`, at heights of 24, 32 and 44px. Form controls take `invalid` and `disabled`, and get their label, hint and error from `Field`.
6. **Pick feedback by how long it stays.** To confirm that something worked ("Saved", "Invite sent"), call `toast("Saved")`, and render one `<Toaster />` near the app's root. It goes away on its own and screen readers hear it. Use an `Alert` for a message that must stay on the page until it's dealt with, and `SaveStatus` for autosave.

## Accessibility: what the app must do

The components meet their part of WCAG 2.2 AA. The page meets the rest only if you also do these:

- **Page:** set `<html lang>` and a unique `<title>`. Use one `main` (`<Container as="main">`) and add a "Skip to content" link (`<VisuallyHidden focusable>`).
- **Headings:** one `h1` per page and no skipped levels. Heading's `level` sets the element, and its look can differ.
- **Names:**
  - Wrap every form control in `<Field label="…">`. A placeholder is not a label.
  - Give every IconButton a `label` (its accessible name and tooltip). It takes no `aria-label`.
  - Give every meaningful Image `alt` text, and a decorative one `alt=""`.
  - Write link text that says where the link goes.
- **Errors:** say what's wrong and how to fix it, next to the field. On submit, move focus to the first error or to an ErrorSummary.
- **Color:** in your own content, color never carries meaning alone. Add text, an icon or a pattern.
- **Focus:** never use `outline: none` alone (use `outline-hidden` if you must). Keep targets at least 24px, and keep sticky headers off the focused element (`scroll-padding-top`).
- **Route changes:** call `announcePage()` after a client-side route change. Say status changes with `announce("Saved")`, not with a visual change alone.
- **Motion:** use the motion tokens, and don't animate anything that `prefers-reduced-motion` would want still.

## Components

Each component's guide covers when to use it, when not to, its props, its keyboard keys and its tokens. It's on the component's Storybook page and in the repository at `src/components/<Name>/README.md` (https://github.com/diki-stwn/serupa-ds).

<!-- components:start (written by tools/build/registry.mjs) -->

### Actions

- **Button**: Triggers an action: submitting a form, opening a dialog, confirming or cancelling.
- **ButtonGroup**: Related buttons side by side, or stacked: joined into one control with shared borders (the default), or spaced apart.
- **CopyButton**: A button that copies text to the clipboard: an API key, an invite link, a command.
- **Fab**: A floating action button: the one main action of a screen, such as "New project" or "Compose", in a round, raised button fixed to a corner.
- **IconButton**: A button that shows only an icon: a menu trigger, a close button, a toolbar action.
- **Link**: An inline text link: underlined, in the primary color or the surrounding text's.
- **ToggleButton**: A Button that stays on or off, for a setting that applies right away: bold in a text editor, mute, show the grid.
- **ToggleGroup**: A set of ToggleButtons that share one value: one on at a time, such as text alignment or a view mode, or any number, such as bold, italic and underline.
- **Toolbar**: A set of controls, such as an editor's formatting buttons, that takes one Tab stop instead of one per control.

### Content

- **Accordion**: A stack of items whose content shows and hides under a title button: FAQs, settings groups, long forms split into sections.
- **Avatar**: A small picture of a person (a circle) or of a team, project or organisation (a square).
- **AvatarGroup**: Avatars in an overlapping row, such as the people on a project or the assignees of a task.
- **Card**: A surface that groups related content and its actions: a summary, a settings panel, an item in a grid.
- **Carousel**: One slide at a time, with previous and next buttons, a dot per slide and swipe.
- **FormattedNumber**: Writes a number the way the reader's language does: `1.234,5` in Indonesian, `1,234.5` in English, `١٬٢٣٤٫٥` in Egyptian Arabic.
- **Highlight**: Shows text with the parts that match a search marked, ignoring case and accents, for search results, Combobox options and a command palette.
- **Icon**: Shows one icon as an inline SVG: from Material Symbols, always in the **Rounded** style with **Fill** on, or one of your own custom icons.
- **Image**: A picture in a frame: a fixed ratio, rounded corners, a placeholder while it loads and a fallback if it fails.
- **Kbd**: Shows a keyboard key or shortcut as keycaps, in help text, tooltips, menus and empty states.
- **List**: Rows of related things: people, files, notifications, settings.
- **RelativeTime**: Says how long ago, or how far ahead, a moment is, in the reader's language: "3 minutes ago", "yesterday", "in 2 hours".
- **SortableList**: A list people put in their own order: tasks by priority, steps in a flow, columns in a table.
- **Table**: A data table built on native table markup: a header row, body rows and an optional footer, in a bordered frame that scrolls sideways when the table is too wide.

### Data display

- **Timeline**: An ordered list of events, each with a marker on a line that joins them, a title, a time and optional content.

### Feedback

- **Alert**: A message about the page or a task: something saved, something to know, something that went wrong.
- **Badge**: A short label for status, counts and categories, optionally clickable.
- **EmptyState**: What a page or a panel shows when there's nothing in it yet, or nothing matches: an icon, a few words saying what's empty, what it means, and the action that fills it.
- **ErrorBoundary**: Catches an error thrown while rendering anything inside it and shows a message with "Try again" in its place, so one broken widget doesn't blank the whole page.
- **Loader**: Shows that something is loading when you can't say how far along it is.
- **Meter**: Shows a measurement within a known range: storage used, a plan's seats, a password's strength, a battery level.
- **Progress**: Shows how far along a task is when you can tell: an upload, a setup, a quota.
- **SaveStatus**: A small line that says whether autosaved changes are safe: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with a Try again button.
- **Toast**: A short message that confirms something happened ("Changes saved", "Moved to trash") without getting in the way.

### Forms

- **Calendar**: A month of days to pick one from, with full keyboard navigation.
- **Checkbox**: A native checkbox with its label, for turning one option on or off, or picking any number from a list.
- **ColorPicker**: Picks a color from a set of swatches, or any color by its hex code or with the browser's own picker.
- **Combobox**: A text field with a list of options that narrows as you type: pick a country, an assignee, a project.
- **DatePicker**: A date field: people type a date, or pick one from a calendar that opens under the field.
- **DateRangePicker**: Two date fields for the start and end of a range (a stay, a report period, a filter), with a popup of two months to pick both.
- **ErrorSummary**: After a form fails to submit, a box at the top of the form that says what's wrong, with each error a link to its field.
- **Field**: A label, an optional hint and an error message around one form control, wired up for screen readers.
- **FileUpload**: A drop area with a button for choosing files, and the chosen files listed under it with their size and a remove button.
- **InlineEdit**: Text people can change where it is: a project name, a card title, a slug.
- **Input**: A single-line text field: a native `<input>` in a box that can hold icons.
- **NumberInput**: A field for a number, with − and + buttons at the end.
- **PasswordInput**: A password field with a button at the end that shows and hides what was typed, so people can check it before they submit.
- **PhoneInput**: A phone number field with a country menu at the start.
- **PinInput**: A one-time code or PIN, shown as one box per character, such as the 6-digit code texted at sign-in.
- **Radio**: Native radios for one choice from a short list.
- **Rating**: Stars to pick a score (how was your stay, how useful was this article) or to show one (a product's average).
- **SearchInput**: A search field: a search icon at the start, and a × at the end once something is typed.
- **SegmentedControl**: Picks one of a few options shown side by side, such as a view (List, Board) or a period (Day, Week, Month).
- **Select**: A native `<select>` styled like Input: the same three heights (24, 32 and 44px), colors, focus ring and states, with a chevron and an optional left icon.
- **Slider**: Picks a number, or a range with two thumbs, by dragging along a track or with the keyboard.
- **Switch**: An on/off setting that takes effect at once.
- **Textarea**: A multi-line text field, Input's sibling: a native `<textarea>` in a box.
- **TimePicker**: A time-of-day field: people type a time, or pick one from a list.
- **TypeToConfirm**: A field and a destructive button for an action that can't be undone: the button works only once the person types a phrase, usually the name of what's being deleted.

### Layout

- **Splitter**: Two panes with a handle between them that people drag, or move with the keys, to give one pane more room: a list and its detail, a sidebar and an editor, code and its output.

### Layout and type

- **Container**: Centers a page's content with a maximum width, and side padding that grows with the screen: 16px, 24px from 640px and 32px from 1024px wide.
- **Divider**: A 1px line between content, horizontal or vertical, with an optional label in the middle such as "or".
- **Grid**: Cells in equal columns, or as many columns as fit, with the same space between them from the spacing scale.
- **Heading**: A heading, `h1` to `h6`, in the system's type.
- **Stack**: Lays its children out in a column, or a row, with the same space between each, taken from the spacing scale.
- **Text**: Body text in the system's type: a paragraph, a caption, an error line.
- **VisuallyHidden**: Content that screen readers announce but nobody sees: "(opens in a new tab)", the label of an icon-only control you build yourself, a heading for a section that's obvious by sight.

### Navigation

- **Breadcrumb**: Shows where the current page sits: links to the pages above it, from the top level down, with chevrons between them.
- **LoadMore**: The end of a list that loads in pages: "Showing 20 of 134" over a Load more button, or infinite scroll, and an announcement of what each load added.
- **Navbar**: The bar across the top of an app: the brand on the left, the main page links, and actions on the right (search, a user menu, sign in).
- **Pagination**: Moves through pages of results: previous and next arrows around the page numbers, with … where pages are skipped.
- **Sidebar**: A vertical nav for an app's pages: an optional header (a logo, a workspace switcher), sections of items with icons, badges and nested groups, and a footer pinned to the bottom (settings, the signed-in user).
- **Stepper**: Shows where people are in a task split into steps, such as sign-up, checkout or setup.
- **Tabs**: Switches between related panels in one place, such as a project's Overview, Activity and Settings.
- **TreeView**: Nested items that open and close, such as folders and files, a table of contents or categories.

### Overlays

- **Dialog**: A modal window over a dimmed page, for a task or a decision that needs attention before people go on: inviting someone, confirming a delete, editing a few fields.
- **Drawer**: A modal panel that slides in from an edge of the screen: navigation on small screens, filters, or details and edits without leaving the page.
- **KeyboardShortcuts**: Keyboard shortcuts for an app, in one place: `useShortcut` sets one up where it's used, and `<KeyboardShortcuts>` is the help dialog that lists them all, opened with <kbd>?</kbd>.
- **Menu**: A list of actions behind a button: a row's "More" menu, an "Actions" dropdown, a user menu.
- **NotificationCenter**: A drawer of past notifications with read states: newest first, unread ones with a dot and a bolder title, and buttons to mark them read or clear the list.
- **Popover**: A small panel next to its trigger for content people interact with: a short form, filters, details with links.
- **Tooltip**: A short hint about one element, shown while it's hovered or focused: what an icon button does, a keyboard shortcut, why something is unavailable.

<!-- components:end -->
