# Changelog

Every change to Serupa (called the Diki Design System up to 4.8.1), newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html); the README's Versioning section says what counts as a breaking change.

## [Unreleased]

## [9.4.0] - 2026-10-25

### Added

- `perView` on Carousel, to show two or three slides side by side, 16px apart (`--carousel-slide-gap`). It takes a number or one per screen width, `{ base, sm, md, lg }`. The buttons and swipe still move one slide and stop when the last one is in view, and the dots count pages, named "1–3 of 7" (new `slidesOf` label, in English and Indonesian). All the slides in view are reachable; the rest stay inert (R5).
- `orientation="vertical"` on Tabs. The tabs form a column at the start of the panels, with `aria-orientation="vertical"` and ↑ ↓ between them, and the line variant's line on the column's end side (O4).
- ToggleGroup, a set of ToggleButtons that share one value. With `type="single"` (the default) one is on at a time, and `required` keeps one on. With `"multiple"` any number can be on. `value`, `defaultValue` and `onValueChange` hold the values of the buttons that are on. `size`, `variant` and `disabled` reach every button that doesn't set its own. It looks like a ButtonGroup and has its `attached` and `orientation` props.
- TreeView, nested items that open and close, such as folders and files. It follows the WAI-ARIA tree pattern: one Tab stop, the arrow keys, Home and End, `*`, and typeahead. `selectionMode` is 'single', 'multiple' (with Shift ranges and Ctrl+A) or 'none'. `value` and `expanded` can be controlled or uncontrolled, closed items' children aren't in the page, and every value has its own token.

### Fixed

- A tab row with more tabs than fit gave no sign of the rest, and a selected tab past the edge stayed out of sight. The edge with more tabs past it now fades out over 32px (new `--tabs-fade-size` token), and the selected tab is scrolled into view whenever it changes, without scrolling the page.

## [9.3.0] - 2026-10-25

### Added

- `collapse="menu"` on Breadcrumb. With `maxItems`, "…" opens a Menu of the hidden pages, as links, instead of putting them back in the trail, so a deep trail stays on one line on a phone. The default, `'inline'`, works as before. New `morePages` label ("More pages"), in English and Indonesian (R4).
- ContextMenu, a Menu opened from an area instead of a button.

- A right-click (or a long press on touch) opens it at the pointer. Shift+F10 or the Menu key opens it at the focused element.
- It has Menu's items, keys, top layer and closing. Escape or a choice puts focus back where it was.
- `aria-label` names it, and `disabled` leaves the browser's own menu in place.

`<ContextMenu aria-label="File actions" target={<Card tabIndex={0}>…</Card>}>…</ContextMenu>`

### Changed

- Breadcrumb's separators sit inside the item after them, not in `<li>`s of their own, so the list has one item per page and screen readers count the levels right. A separator now wraps with its item, never ending a line on its own.
- Combobox draws at most 100 option rows at once, so typing into lists of thousands stays quick. A muted "Keep typing to narrow N more" line shows how many more match. It uses the new `moreResults` label, with English and Indonesian text. Every row's `aria-posinset` and `aria-setsize` still count all the matches, and the picked option is drawn even when it's further down.

### Fixed

- DatePicker, DateRangePicker and TimePicker work out the locale's date order, typing pattern and 12-hour clock once per locale instead of on every render and keystroke. NumberInput works out its percent scale once per locale and format.
- Toaster starts empty and reads the toast queue after it mounts, as it already did on a server render. A `toast()` called during a server render can no longer show up in another request's HTML.

## [9.2.0] - 2026-10-25

### Added

- Find-in-page reaches closed Accordion items. Ctrl+F (⌘F) used to skip them; now the browser finds the text and opens the item it's in, through `hidden="until-found"` (idea 186). Closed content is still out of the tab order and hidden from screen readers.
- `showExpandAll` on Accordion with `type="multiple"`: an "Expand all" button above the items, which becomes "Collapse all" once every item is open. New `expandAll` and `collapseAll` labels, in English and Indonesian (idea 52).
- `keepMounted` on AccordionItem, as on TabPanel. `keepMounted={false}` renders an item's content only while it's open (and while it closes), for heavy content such as a chart. By default closed content stays in the page and keeps its state.
- Avatar:
- The picture now loads lazily and decodes async by default, so a long list of people doesn't fetch every avatar at once. A new `imgProps` prop passes props to the `<img>`, such as `loading="eager"` for one above the fold (BJ1).
- A name of only spaces now counts as no name. The avatar is hidden like one with no name, instead of being an image named with spaces (AU1).
- Initials are one character a person sees per word, taken from its first letter, digit or pictograph: "ßen Müller" gives "SM" (it gave "SSM"), a name in quotes no longer gets a quote mark, and a joined or skin-toned emoji stays whole (CD1).
- A `type="submit"` Button inside a `<form action={fn}>` (React 19 form actions) now shows `loading` while that form is being sent, using React's `useFormStatus`. You don't need your own state, and a second click can't send it twice. Set `loading` yourself to override it.
- `disabledReason` on Button. With `disabled`, the button stays focusable (`aria-disabled`) so keyboard and screen reader users can reach it and hear why, and a Tooltip around it now shows on hover and focus, which a disabled button never could (idea 214).
- An `onClick` that returns a promise makes the Button load until it settles, so a slow request can't be sent twice without your own loading state (idea 199).
- `successText` on Button: after that promise resolves, a check replaces the label for 2 seconds and the text ("Saved") is announced (idea 16).
- `CheckboxGroup`, which holds a list of checked values (`value`, `defaultValue`, `onValueChange`) for a set of Checkboxes. It names them and passes `size`, `invalid`, `disabled` and `required` down. Here `required` means at least one box. Add `<Checkbox selectAll>` to check or clear the rest: it's checked when all are, and indeterminate when some are.
- ColorPicker takes `required` and `invalid`. A required picker with no color stops the form submitting, marks the swatches invalid and focuses them (AJ2).
- With `contrastWith`, every swatch says its contrast ratio before it's picked, and one under `minContrast` is struck through and has `data-low-contrast`, so people see which colors are hard to read before choosing (idea 208).
- `onValueCommit` on ColorPicker, called once a color is chosen (a swatch, the browser's picker closing, or leaving the hex field), not on every drag step like `onValueChange` (K7).
- `form` submits the color with a form the picker sits outside of, and that form's reset puts the first color back (U3).
- Combobox:
- PageDown and PageUp move by what the list shows at once (about seven options), as the ARIA pattern describes. Before, they jumped to the last and first option, the same as End and Home (BH1).
- The list is at most 28rem wide unless the field is wider, and long labels wrap. Before, one long label could stretch it to the width of the window. New token `--combobox-listbox-max-width` (BH2).
- When typing stops, the number of matching options is announced ("3 results"). New label `resultsCount`, in English and Indonesian (BE1).
- An option's text `description` is now its `aria-description`, so its name is the label alone. `aria-controls` is set only while the list is open (N8).
- `configure({ link })` now reaches every component that renders a link. Link, NavbarLink, BreadcrumbItem and ListItem use it as their default `as`, and Pagination's page links (with `getHref`) use it too. Before, only Button, IconButton, Badge, Card and MenuItem did, though the README promised it for all of them. An item's own `as` still wins. Pagination has a new `linkAs` prop for one pagination. Nothing changes until `configure({ link })` is called (BL1).
- Menu, Popover and Tooltip take `defaultOpen`, and InlineEdit takes `defaultEditing`: open at first without controlling it, then opened and closed by the person as usual.
- Dialog: `fullScreen` fills the screen, either always (`true`) or only under 640px wide (`"mobile"`), with square corners, the footer at the bottom and padding that clears a phone's notch and home bar. Fixed: under `<React.StrictMode>`, a Dialog or Drawer that was open on its first render dropped off the modal stack, so toasts and announcements stayed behind it on the inert page (A1).
- New component: ErrorBoundary. It catches an error thrown while rendering anything inside it and shows a danger Alert with "Try again" in its place, so one broken widget doesn't take the page down (idea 198). Focus moves to the message when the crash took it away; `onError` reports the error, `resetKeys` clears it on a route change, and `fallback` replaces the message. New `errorTitle`, `errorDescription` and `tryAgain` labels, in English and Indonesian.
- In a Field with an error, the control also points at the message with `aria-errormessage` (J12). This covers a direct child and any Serupa control at any depth, including both inputs of a DateRangePicker and FileUpload's choose button. The message stays in `aria-describedby` too.
- Field warns once in the console when nothing on the page has its control's id, so the label names nothing (A4).
- FileUpload takes `form`, the id of the form its files submit with when it sits outside that form, as a native input does (AJ3).
- `form` on Slider, SegmentedControl and DateRangePicker, which render no input of their own to take it.
- New component: Highlight. It marks the parts of a text that match a search in `<mark>`, ignoring case, accents and width the way Combobox matches ("lodz" marks "Łódź", "strasse" marks "Straße"), for search results, options and command palettes (idea 42). `words` marks each word of a query on its own, and `highlightRanges()` returns the matches as offsets.
- Input: `showCount` adds a character count at the end of the field, and `maxLength` is now counted in characters as people see them (an emoji is one) and applied by Input, as Textarea does. Input and Textarea read the count out only near the limit: once when a few characters are left and once when it's reached (new `charactersLeft` label, English and Indonesian). Email, URL, username and one-time-code inputs turn off autocapitalize, autocorrect and spellcheck unless you set them. Fixed: a form reset now puts Textarea's count back to the default text's.
- A MenuItem's `shortcut` is now given to screen readers as `aria-keyshortcuts` ("⌘⇧K" becomes `Meta+Shift+K`), and the shown keys are left out of the item's name, so it reads "Edit" instead of "Edit command E" (idea 197). Pass `aria-keyshortcuts` to set it yourself.
- Menu: a menu is at most 20rem (320px) wide, and longer labels wrap onto a second line. Before, one long label could stretch a menu under a 70px button to the width of the window. New token `--menu-max-width` (BH2).
- Menu: new `MenuSub`, an item that opens a submenu at its end edge (the left in rtl, flipping when there's no room). → (← in rtl), Enter or Space opens it on its first item; ← (→ in rtl) or Escape closes it back on the item; ↑ ↓ Home End and letters stay inside it. Hovering opens it after 150ms, and it closes 150ms after the pointer settles on another item. Choosing an item in it closes every level. New token `--menu-sub-offset`.
- Meter says the zone out loud. Outside the best zone, screen readers hear "92%, high", "12%, low" or "45%, medium", so the warning the bar's color gives isn't only visual. The words come from the new `meterZone` label (English and Indonesian built in). A meter with `formatValue` reads your words as they are (idea 206).
- Fifteen components now warn in the console, once, when they render with no accessible name: Dialog, Drawer, Slider, Switch, Checkbox, Combobox, Select, Input, SegmentedControl, Progress, Meter, RadioGroup, DatePicker, ColorPicker and Carousel. A screen reader would announce only their role. Each warning says how to name the component. Tabs also warns when its value or defaultValue matches no Tab.
- `--pagination-padding-x-sm` token (4px), the side padding of a page at size sm.
- PasswordInput: while Caps Lock is on, "Caps Lock is on" shows in the field, joins its description and is read out once (new `capsLockOn` label and `--password-input-caps` token; `capsLockHint={false}` turns it off). The README now says pasting is never blocked (WCAG 3.3.8), and a test checks it.
- PhoneInput knows every calling code in the world (244 countries and territories, up from 51). `+94 77…` is Sri Lanka now, where the digits used to be read as a number in the picked country (K2).
- Where countries share a calling code, the area picks one. `+1 416…` is Canada and `+1 684…` American Samoa (both read as the US before), `+7 7…` is Kazakhstan, and `+44 1481…` is Guernsey. `PhoneCountry` has optional `areas` and `patterns`.
- `countries` takes your own `PhoneCountry` rows as well as ISO codes; a row replaces the built-in one with the same code. `parsePhone` takes the list as a third argument.
- A `+` code PhoneInput doesn't know warns once in the console.
- PinInput, for a one-time code or PIN shown as one box per character (`length`, default 6).

- It's one native field under the boxes, so a phone's texted-code suggestion (`autocomplete="one-time-code"`), a paste and a password manager fill every box at once. A form submits the code by `name`, and labels, Field and screen readers treat it as an Input.
- `type="numeric"` (digits and a number keypad, the default) or `"alphanumeric"`. Other characters are dropped, so "123-456" fills six boxes.
- `value`, `defaultValue`, `onValueChange` and `onComplete`, plus `mask`, `size` (24, 32 and 44px boxes) and `invalid`.

Tokens: `--pin-input-*`.
- `headingLevel` on Popover sets the title's level (2–6) to fit the page's outline.
- `announceComplete` on Progress says "Upload: complete" (or your own words) to screen readers when the value reaches max, and `onComplete` is called then. A bar that starts full doesn't speak.
- The `progressComplete` label, in English and Indonesian.
- RadioGroup: `onValueChange(value, event)` is the new name for `onChange`, so every composite (SegmentedControl, Tabs, Slider, Select) uses the same one. `onChange` still works and gets the same arguments after `onValueChange`, but it's deprecated: it warns once in the console and goes in the next major. Migration: rename `onChange` to `onValueChange` on each RadioGroup. Nothing else changes. The `onChange` of a single Radio is the native input event and stays.
- `onInvalidInput(text, reason)` on DatePicker, DateRangePicker and TimePicker. Typed text that isn't a date or time ("unreadable"), or is one that can't be chosen ("unavailable"), used to be put back on blur without a word. Now the app hears why, and screen readers hear that it wasn't accepted (the `inputNotAccepted` label, Indonesian in `idLabels`) (R35, M1).
- The `--dialog-focus-ring` and `--drawer-focus-ring` tokens.
- SegmentedControl: a `size="lg"` (44px), so it lines up with lg Inputs, Selects and Buttons. It has a base-size label, 16px label padding (`--segmented-control-padding-x-lg`) and 20px icons. Its height is `--segmented-control-height-lg`.
- The `--sidebar-dot` token (default `primary`) for that dot's color.
- `MenuItem` takes `as`, a link component of its own in place of the `configure({ link })` one.
- Slider `marks`, with ticks on the track (`true` for every step) and optional labels under them. Also `showValue`, which shows the formatted value over the thumb while it's focused, hovered or dragged. Both are visual only, and come with the tokens `--slider-mark`, `--slider-mark-label`, `--slider-value-bg` and `--slider-value-text`.
- `clickable="all"` on Stepper, for a form people can fill in any order. With `onStepClick`, every step but the current one becomes a button, upcoming ones too; the default, `'completed'`, keeps only the steps before the current one (R6).
- `status: 'warning'` on a Stepper step, for a softer problem than `'error'`: a warning-subtle circle with a warning mark, read as ", needs attention" (new `hasWarning` label, in English and Indonesian). New tokens `--stepper-warning-bg`, `--stepper-warning-border` and `--stepper-warning-text`.
- Switch `pending`, for while a flip is being saved. A small ring turns on the thumb, `aria-busy` is set, and clicks and Space don't flip it again until it's done. It stays focusable and is still submitted.
- Table: a sortable column's new order is read out ("Sorted by Amount, ascending.", new `tableSorted` label in English and Indonesian). In print, Table shows the whole table, repeats its header row on every page and keeps rows whole, and a Card isn't split across pages.
- Tabs: the browser's find-in-page now finds text on other tabs. A kept panel of another tab is `hidden="until-found"`, so a match selects its tab (calling `onValueChange`) and shows it, as Accordion opens an item. Browsers without `until-found` keep it plainly hidden, as before.
- The `toastRepeated` label, in English and Indonesian.
- Toolbar, a `role="toolbar"` around a set of controls (an editor's formatting buttons, the tools beside a canvas) that takes one Tab stop instead of one per control. It follows the WAI-ARIA toolbar pattern:

- The arrow keys move between the controls: Left and Right in a row (mirrored right to left), Up and Down with `orientation="vertical"`. Home and End go to the first and last, and the keys wrap.
- Tab comes back to the control used last.
- Disabled controls, a Menu's items and text editing inside an Input are left alone.

Tokens: `--toolbar-bg`, `--toolbar-text`, `--toolbar-radius`, `--toolbar-padding` and `--toolbar-gap`.
- Input, NumberInput, PasswordInput, PhoneInput, SearchInput, Combobox, DatePicker, TimePicker, Textarea, Image and Divider no longer accept `children` in their types. They render an element that can't hold children (an `<input>`, `<img>` or `<hr>`; a `<textarea>` takes its text from `value`), so `<Input>text</Input>` type-checked and then threw in React. If your code passed children to one of these, move that text to `value`, `defaultValue`, `label` or a wrapper.

### Changed

- DatePicker places its calendar with the same shared code as the other popups (M6). It looks and behaves the same.
- Calendar builds its date formats once per locale, not on every render.
- A ColorPicker swatch given as a bare hex string is now read out by a name from its color ("Dark blue", "Light gray") instead of its code ("#1e3a8a"), with the code as its tooltip. The words come from the new `colorName` label, in English and Indonesian (idea 207).
- `components.css`, `utilities.css`, `bundle.css` and `base.css` ship without the source comments, which made up about 40% of `components.css`. It drops from 42.8 to 26.6 KiB gzipped, and `bundle.css` from 208 to 186 KiB. The rules are the same and keep their layout; the commented source stays in `src/`.
- Popover's title is now an `<h2>`, as in Dialog, so screen reader users can jump to it by heading. It looks the same.
- Textarea's `maxLength` counts the same characters as the count, so typing stops where the count says it's full. Text pasted past it is cut at the end of the paste, and an input method's text once it's confirmed. The `<textarea>` no longer carries the browser's `maxlength`.

### Removed

- `--button-focus-gap-color`, `--checkbox-focus-gap-color`, `--radio-focus-gap-color`, `--switch-focus-gap-color` and `--badge-focus-gap-color`, which 9.0.0 deprecated and said were removed. They have had no effect since 9.0.0 (the focus ring is an outline, so its gap is transparent on any background), but they still shipped in the five usage guides, the components' tokens.json files and `design-tokens/components/`. A project that sets one can delete it: nothing changes on screen. `--tabs-focus-gap-color` stays, because the selected pill's inset ring uses it.

### Fixed

- Tab past an open DatePicker or DateRangePicker calendar left it open over the page. Focus moving past it closes it now (M2).
- On a touch screen, a finger that started a scroll outside an open Menu, Popover, TimePicker list or date picker calendar closed it at once. It now waits for the tap: a scroll leaves it open, a tap outside closes it (O3).
- On a phone, a Combobox list, Menu, Popover or date picker opened from a field near the bottom of the screen went under the on-screen keyboard, and pinch-zoom left it behind. Popups are placed within the visible part of the page (the visual viewport) and follow it as it changes (U1).
- When several announcements came at once, they were joined with an extra period, so SortableList said "position 1 of 3.. Apollo" and screen readers paused oddly. Messages that end in their own stop are now joined with a space (idea 212).
- Added a test over every built-in label in English and Indonesian: none is empty, has doubled punctuation or spaces, or is left in English in the Indonesian set.
- DatePicker, TimePicker and Combobox keep an `autoComplete` you pass, such as `bday` for a date of birth or `country-name` for a country, so browsers can fill them (WCAG 1.3.5). They wrote `off` over it. `off` stays the default.
- `autoFocus` on ColorPicker, InlineEdit and SortableList focuses the control inside (the picked swatch, the edit button, the first handle) instead of landing on the wrapper and doing nothing.
- Badge: a count past `max` still shows "99+", and now screen readers hear the real count ("150") and the tooltip shows it. Before, "99+" was all anyone could learn. Your own `title` wins.
- A loading Button or Badge, or a disabled Button with a `disabledReason`, swallowed the click for everything above it, so a parent's onClick, an analytics wrapper or a Card's stretched link never heard it. It still does nothing itself (no submit, no navigation), and the click now bubbles (A6).
- README.md and the Foundations guide name the oldest browsers that get the whole system (`light-dark()` behind `data-brand` / `data-mode`: Chrome and Edge 123, Safari 17.5, Firefox 120; the `popover` top layer: Chrome and Edge 114, Safari 17, Firefox 125) and what an older browser loses.
- Button: `onClick`'s type accepts a handler that returns a promise (or anything else), matching what the button already does with it: no second click until the promise settles, loading while it takes a while, then `successText`.
- Calendar's arrow keys, Home, End, PageUp and PageDown stop at `min` and `max`, as the native date field does. A Shift+PageUp could leave focus on a day a year outside the range, in a month the buttons wouldn't show.
- Calendar's weekday headers give screen readers the full name ("Monday") as text, not only in `abbr`, which some don't read.
- Carousel: what a screen reader calls the carousel and its slides ("carousel", "slide") was English in every language. It comes from the new `carouselRole` and `slideRole` labels now ("korsel" and "slide" in `idLabels`).
- The README's checklist for a new component now names its size budgets file, `tools/test/baseline-size/<Name>.json` (`node tools/test/size.mjs --update <Name>`).
- A ColorPicker in a Field gave the Field's id to both its outer element and its hex field, and put `aria-describedby` and `aria-required` on an element with no role. The radiogroup now carries the description, `aria-required`, `aria-invalid` and `aria-errormessage`, and the hex field stays a separate field named "Hex code" (AK2).
- A form reset left ColorPicker on the last color and submitted it. It goes back to `defaultValue` now (P2).
- A controlled ColorPicker whose parent turned down a typed color kept the rejected text in its hex field. On blur the field shows the color it kept (AF2).
- Typing an option's full label in Combobox ("Brazil") and then leaving the field emptied it and picked nothing. Text that is exactly one enabled option's label (any case, with or without accents) now picks that option when focus leaves (N1).
- Combobox's chevron and × names ("Show options", "Clear Country") and a range Slider's thumb names ("Minimum", "Maximum") were English in every language. They're labels now (`showOptions`, `clearValue`, `sliderMinimum`, `sliderMaximum`), Indonesian in `idLabels` (A5).
- Combobox handles long option lists. Its options are in the page only while the list is open, so a closed Combobox with 2,000 options has no option nodes. Each label is folded for matching once per `options` array instead of on every render, and the option rows are memoised, so moving the highlight redraws two rows instead of every row.
- Server-rendered pages under a strict Content Security Policy (no `'unsafe-inline'` for style attributes): Progress, Meter, Slider, ColorPicker, AvatarGroup, Icon, Carousel and Image apply their `style` attributes again right after hydration, through the DOM, so a Progress bar, a Slider thumb, and swatch colours show as they should. A render in the browser is unchanged.
- `autoFocus` on a child of a Dialog or Drawer never took effect, because React focuses it while the dialog is still hidden. Focus always landed on the ×. Put `data-autofocus` (or the HTML `autofocus` attribute) on the child, and opening focuses it (BD1).
- A press on the backdrop of a Dialog or Drawer while a Menu or Popover was open inside closed both at once. It now closes only the popup, and the next press closes the dialog (BG1).
- A Dialog or Drawer whose parent kept `open` true after Escape was closed by Chromium on the second Escape (a page can refuse it only once per click), and then stayed closed while `open` was still true, with the page behind no longer inert. It now opens again, so `open` stays the truth (AI1).
- Words some display components say were English in every language. Avatar's status ("online"), AvatarGroup's "N more", an external Link's "(opens in a new tab)" and Kbd's key names ("Up arrow") come from labels now (`avatarStatus`, `avatarMore`, `opensInNewTab`, `keyName`), in Indonesian in `idLabels`. `statusLabel` and `moreLabel` still win, and Link is still a Server Component (T1).
- Divider: a text `label` now names the separator through `aria-label`. A separator's content is presentational, so screen readers skipped the "or". A label that isn't text stays as normal content, and the divider then has no separator role (BQ1).
- Card: in a linked card, body text and the header's description can be selected and copied with the mouse. Before, the link's area covered them. A plain click on that text still follows the link (BO1).
- In a right-to-left page, `side="right"` placed the Drawer on the left while it slid in from the right, crossing the whole screen, and `side="left"` did the opposite. `side` is physical, so each drawer now opens on the edge it names and slides in from. The safe-area padding follows the same edge (AZ2).
- Textarea with `autoResize` and Stepper no longer measure after every render of a parent. Textarea refits when its value, size, row count or text changes, and Stepper measures again only when its steps' text or orientation changes, not each time an inline `steps` array is passed.
- Clicking the label of a Field holding a Slider, SegmentedControl or ColorPicker focused nothing, because a label can't focus their `<div>` root. It now focuses the thumb or the checked option (AK1).
- A native `<select>` as Field's direct child got no id, hint, error or invalid state, and the label pointed at an id nothing had, because its options made Field treat it as a wrapper. Labelable elements (select, button, meter, output, progress, textarea) are always the control now (S1).
- Field's "(optional)" was English in every language. It's the new `fieldOptional` label now ("(opsional)" in `idLabels`) (S2).
- An error that appears on a Field after mount (after a submit, say) wasn't announced, since a description is only read on focus. Field now says it politely when it appears or changes (S3).
- The shared screen reader announcer relied on the `sr-only` utility class, so without `utilities.css` its text showed on the page. It's hidden with inline styles now (A2).
- Textarea, Select, ColorPicker and InlineEdit look disabled inside a `<fieldset disabled>`, as Input does. The native controls were already disabled, but the boxes kept their enabled look and hover border, and InlineEdit kept its pointer and pencil.
- Input and the fields built on it look disabled inside a `<fieldset disabled>`. The native field was already disabled, but the box kept its enabled look and hover border.
- Submitting a form without a required FileUpload focused its hidden input and pointed the browser's bubble at nothing. It now says "Choose a file." in its own alert area, marks the button invalid and focuses it (N2).
- FileUpload's refusal messages were English in every language. They're labels now (`fileWrongType`, `fileTooLarge`, `fileTooMany`, `fileOnlyOne`, `fileMissing`), Indonesian in `idLabels`, with the accepted types joined by `Intl.ListFormat` (N3).
- Dragging text or a link across a FileUpload highlighted it as a drop target. Only drags that carry files do now (N5).
- In forced colors (Windows High Contrast), FileUpload's drag-over state was lost with the primary fill. The area now gets a solid `Highlight` border while files are dragged over it (AM1).
- Clicking a `<label for>` that points at a FileUpload opened the picker but left focus on its hidden input, with no focus ring and a screen reader on a hidden element. Focus now goes to the choose button.
- Docs: every component guide now says where `id` goes in its Props table: the root element, the native field inside (so a `<label htmlFor>` works), or nowhere (Menu, Popover, ErrorBoundary take none; Tooltip passes it to its trigger). The guides check requires the row from now on.
- Combobox, DatePicker, DateRangePicker, PhoneInput, SegmentedControl, Slider and TimePicker placed outside their form with `form="…"` sent nothing, because their hidden inputs didn't carry the form attribute. They do now, and a reset of that form puts their defaults back (U3).
- At size `sm`, the buttons inside a field (SearchInput's clear, PasswordInput's show/hide, NumberInput's steppers) were 22px with nothing around them to press, short of WCAG 2.5.8's 24px. Each now takes presses over 24px, through a box behind it, without changing the layout.
- On iPhone and iPad, focusing a small or medium Input, Textarea or Select (and the fields built on Input) zoomed the page, because Safari zooms into text under 16px. On iOS their text is now 16px at every size, with the box height unchanged.
- DatePicker and DateRangePicker didn't read digits typed without separators, though their fields open a number keypad on phones, where separators are hard to type. Now 6 or 8 digits are read in the locale's order (`11222001` or `112201` in en-US, `22112001` in de-DE), or as ISO `20011122`. When both readings make a date, the one nearer today wins.
- Link: `tone="neutral"` with `underline="hover"` now warns once in the console, since such a link looks like plain text until it's hovered. The guide gives the numbers for why color alone doesn't mark a link in a sentence: the primary color is 3.1–3.4:1 against body text in the light themes and 1.8–2.6:1 in the dark ones.
- In forced colors (Windows high contrast) a skeleton Loader was blank, because the browser drops its background fill. The bones now keep a still `GrayText` fill (AM1).
- Text written in a component's own `locale` (Calendar, DatePicker, DateRangePicker's calendars, TimePicker, NumberInput, FormattedNumber, RelativeTime) carries `lang` when that locale differs from the provider's, so screen readers read "Januari" in an Indonesian voice on an English page. Words from the labels (buttons, names) keep the page's language, and a `lang` you pass wins.
- A long word, URL or id no longer runs out of its box: Checkbox, Radio and Switch labels, Field's label, hint and error, EmptyState, Loader's text, FileUpload's title and hint wrap it anywhere, and Heading, Text and Link wrap it where nothing else fits. Kbd still keeps a key on one line.
- A word longer than the line (a German compound, a URL) pushed Alert, Card, Dialog, Drawer, Menu and Toast wider than their box, and an Alert in a narrow column made the page scroll sideways. It wraps inside them now (R31).
- A Button with a long label grew past its container. It stops at the container's width, and the label ends in an ellipsis.
- Input and Textarea keep the native `maxlength` in server-rendered HTML, so the limit holds before hydration or without JavaScript. It comes off right after hydration, when the components count characters as people see them.
- Menu: `shortcut` spellings that came out wrong as `aria-keyshortcuts` now come out right. "Ctrl++" is `Control+Plus` (the key was lost), "Cmd-K" and "Ctrl-S" are split at the hyphen, and "G then I" is two presses, `G I`.
- Printing a page with `data-mode="dark"` gave light text on white paper, since printers drop backgrounds. `base.css` now prints `data-mode` pages and sections in their light colors, and a flat `*-dark` theme keeps its backgrounds when printed.
- A nested `data-mode`, `data-brand` or `data-theme` section switched the components inside it but its own plain text kept the page's color on a transparent background. With `base.css` it now takes its theme's `text` color and `surface` background, with no specificity, so a class on the section still wins.
- With a sticky Navbar, a field reached with Tab, or the target of a `#link`, could scroll into view under the bar and stay hidden (WCAG 2.4.11 Focus Not Obscured). The page's `scroll-padding-top` now follows the bar's height, so they land just below it.
- On a small screen, a Navbar menu with more links than fit below the bar ran off the bottom of the screen. With a sticky bar, the lower links could not be reached. The panel now ends at the bottom of the screen and scrolls inside, without scrolling the page behind it (AZ1).
- A project on Node 22 or 24 no longer gets an engines warning (`engines.node` is `>=22`; only working on this repository needs Node 26, in `devEngines`), and CommonJS code can `require("serupa-ds")` and `require("serupa-ds/icons")` on Node 22.12+ through new `"default"` export conditions.
- A controlled NumberInput whose parent kept its value (or changed it) after onValueChange still showed the stepped or typed number. After a step, Enter or blur the field now shows the `value` prop. A new `value` from outside also shows while the field has focus, as long as people aren't typing in it (AF1).
- NumberInput submitted the text it shows ("Rp 1.500.000", "1.234,5"), which a server can't read as a number. With `name`, it now submits the number from a hidden input (whole cents with `minorUnits`), and `form` reaches it too (P1, U3).
- A form reset left NumberInput showing and sending the old number. It puts `defaultValue` back now (P2).
- NumberInput: from a typed value between steps, the arrows, buttons and Page keys first go to the nearest step in that direction, as the native field and Slider do. 0.1 and ↑ with `step={0.25}` is now 0.25, not 0.35. Money shown with finer decimals than its step keeps them, so $19.99 and ↑ with a step of $1 is still $20.99.
- NumberInput read an accounting negative, "(Rp 1.500)" from `currencySign: "accounting"`, or a trailing minus ("1234.5-") back as a positive number on blur, a silent sign flip. Both are negative now (AA1).
- With `style: "unit"`, Thai, Nepali and Tamil unit abbreviations hold dots ("กม."), and NumberInput refused the text it had just written. Dots in the text around the number are fine now (AA2).
- Chinese numerals (`zh-u-nu-hanidec`, 二〇二五) typed into number, date and time fields are read (AB1).
- Pagination size sm stays a 24px square in any font. With 8px sides there was 8px left for the number, so a "1" in DejaVu Sans (common on Linux, where Inter isn't installed) made the page 24.36px wide.
- PasswordInput: showing or hiding the password keeps the caret and selection where they were. Before, the caret jumped to the start, so the next letter typed went in front of the password.
- A calling code typed without `+` ("62 812…" with Indonesia picked) was written twice (+6262…). It's dropped once the number is too long to be a national one (R33).
- German numbers are grouped by their area code. "030 123456" is "30 123456", not "301 23456" (R34). Tokyo, Osaka and London group by their area code too.
- A Tooltip, Popover or Menu placed on the left or right that was wider than the room beside its trigger ran off the screen. It now gets a max width of that room, so its text wraps and it stays in view (A3).
- In forced colors (Windows High Contrast), Navbar's current page lost its only cue, the shading. It gets an outline now, like Sidebar's (V1).
- A Fab printed on every page, since it's fixed to the viewport. It's left out of print, like toasts and open menus (V2).
- Navbar's small-screen menu now closes on a press outside the bar, as Popover does (S5).
- After a form reset, a RadioGroup still held the old choice, so the next click on that radio did nothing. It follows the reset now, and a controlled one shows its value again (Q2).
- In DateRangePicker, an end date typed before the start vanished on blur with no word. It's now put back and reported like a date outside `min`..`max`: `onInvalidInput(text, "unavailable")`, and screen readers hear that it wasn't accepted (AS1).
- PhoneInput ignored `form.reset()`, so the form kept sending, and the field kept showing, the changed number. A reset now puts `defaultValue` and `defaultCountry` back (AJ1).
- RelativeTime rendered on a long-running server wrote the time the server started for every request ("5 minutes ago" hours later). Each request now uses the current time, kept the same for every RelativeTime rendered within the same second (K1).
- The README gave components.css as about 90 KB; it is about 250 KB (45 KB gzipped).
- If making the GitHub release failed after the version's tag was pushed, re-running the Release workflow said the version was already released and never made the release. It now makes the release from the tag.
- Dialog and Drawer: a body that scrolls takes Tab focus, with a focus ring, so it can be scrolled from the keyboard in every browser when nothing inside is focusable. It's a region named by the title.
- A fixed Fab no longer covers what the keyboard focuses. While it's in a corner, the page keeps scroll padding at that edge, so a focused link scrolls into view clear of it.
- Table with `stickyHeader` no longer hides focused cells behind its header. The frame measures the header into scroll padding at the top.
- After a form reset, SearchInput emptied but kept showing its × (and pressing it sent another empty change). The × now follows the field: gone when it's empty, kept when the reset puts `defaultValue` back (Q1).
- After a form reset, an uncontrolled Select with a placeholder went back to the placeholder but showed it in the text color, as if it were a choice. It now looks like a placeholder again (O1).
- Sidebar: in the collapsed rail, an item's badge is read again. The tooltip names the item ("Inbox"), which replaced the link's own text, so its count was lost; the badge is now the item's description ("4").
- A collapsed Sidebar dropped items' badges, so screen readers lost "Inbox 4" and nothing on screen showed there was news. The badge now stays for screen readers, hidden on screen like the label, and an 8px dot on the icon's corner shows there is one.
- In a collapsed Sidebar, a group's button now shows its label as a tooltip on hover and focus, as the links do. Before, an icon-only group gave sighted users no name (BA2).
- `ref` on a group SidebarItem was dropped. It now reaches the group's button, both expanded and in the rail, as the guide says (BA1).
- SidebarItem links now use the link component set with `configure({ link })`, as Button and MenuItem already do. `as` still wins for one item (BL1, Sidebar part).
- In a collapsed Sidebar, a group's menu dropped each item's `as` (a router's Link fell back to a full page load), its other link props and the current page. They're kept now, and the current page has `aria-current="page"` (S6).
- A Sidebar group opened, and showed as active, only when a direct child was the current page. A grandchild counts too now (S7).
- Dragging a SortableList row couldn't scroll the list or the page, so a long list couldn't be reordered past the screen. Held near the top or bottom edge of what scrolls, it now scrolls that way, faster nearer the edge (R1).
- SortableList rendered without `items` (from plain JavaScript) threw a TypeError. It renders an empty list now (AD2).
- In an attached ButtonGroup, a button that was a Menu trigger or sat in a Tooltip lost its outer corners, because the popup that follows it made it not the last child. The first and last buttons are now found among the buttons, so a split button's menu button is rounded on its end.
- An `aria-label` in Table's `containerProps` landed on the frame even when the table fit and the frame had no role, which axe reports as a prohibited attribute. The frame is named only while it scrolls and is a region (N6).
- Tabs: a kept panel of another tab (`keepMounted`) is no longer in the Tab order. It's hidden until found, so Tab used to land on an invisible, zero-size panel; only the shown panel takes focus now.
- Tabs whose controlled `value` matches no tab kept every tab out of the Tab order, so keyboard users skipped the whole list. The first enabled tab now takes the Tab stop until a tab is selected.
- Checkbox, Radio and Switch rows, a bare Checkbox, Slider, small SegmentedControl options and Breadcrumb links take a press over at least 24px (WCAG 2.5.8). They were drawn and pressable at 16–20px. Nothing moves or looks different: a box behind each one reaches past its edges.
- Textarea's count counted hidden code units, so 👨‍👩‍👧🇮🇩 showed as "12 / 10". It counts characters as people see them now ("2 / 10") (R32).
- `dist/theme.js` works pasted into an inline `<script>` in `<head>`, the usual way a server-rendered page avoids a flash of the wrong theme. Its usage comment held a closing script tag, which ended an inline script there, so the browser threw "Invalid or unexpected token" and no theme was set. Loading it with `src` always worked. The README says how to inline it (with a nonce under a strict Content Security Policy).
- `dist/serupa-icons.iife.js`'s first line says the file is empty since 6.1 and can be removed from the page, instead of "every Material Symbol by name".
- Theme.js replaced a page's own `data-theme="violet-dark"` with blue-light (or blue-dark) before the first paint. A `data-theme` on `<html>` with no `data-brand` or `data-mode` is now the page default, and `reset()` goes back to it (Z1).
- TimePicker docs: `step` is in minutes, while `<input type="time">` counts its step in seconds, so a native `step={900}` is `step={15}` here.
- The Toaster set the F8 hint while rendering and never cleared it, so after the Toaster unmounted a toast with an action still told screen readers to press F8, which did nothing. The hint is set once the Toaster mounts and cleared when it goes (W3).
- A toast that closed with focus in it (its ×, its action, `toast.dismiss()`) dropped focus on the page body. Focus now goes back where F8 came from, or else to the toast next to it (AO1).
- Toast's repeat count reaches screen readers. When a burst of the same message stops, it's read once more with the count ("Network error. 12 times."), and the count reads as "12 times" with the title, not "×12".
- Toolbar: a comment says why its tab-stop sync runs after every render (the effects check). Behaviour is unchanged.
- Tapping an element with a Tooltip on a touch screen showed the tooltip 400ms later and left it open, because the tap's mouseenter came with no mouseleave. Tooltip listens to pointer events and ignores touch, and a press outside hides an open tooltip (O2).
- A Tooltip used as the `trigger` of a Menu or Popover passes the props and ref they add (`aria-haspopup`, `aria-expanded`, `onClick` and the rest) on to its element, so a tooltipped icon button opens the menu. The element's own handlers run first and its own id is kept.
- Touch and scrolling, everywhere: every control that shows a pointer cursor (checkboxes, switches, tabs, menu items, options, calendar days, pagination and more) now sets `touch-action: manipulation`, so a tap responds without the double-tap-zoom wait. Menu, Popover, the tab list, the table and the Sidebar body no longer scroll the page once you reach their end. Drawer pads for a phone's notch and home bar, and Fab's offset is measured from the safe area. A new test checks both touch and scroll rules for every component. With more contrast (`data-contrast="more"`, or the system's setting), the focus ring is 3px instead of 2px. With base.css, bare native controls (a plain checkbox, range or progress bar) and the text caret take the theme's brand color, a nested theme included.
- DatePicker and DateRangePicker read a typed two-digit year as 20xx, so a birth date typed as 1/2/85 became 2085. A one- or two-digit year is now the one within 50 years of today (in 2026, `85` is 1985 and `30` is 2030). A year typed with four digits, even 0085, stays as typed.
- Menu, Popover, Combobox, DatePicker and TimePicker panels, Toast and Tooltip take their stacking level from the named layers (`z-popover`, `z-toast`, `z-tooltip`) instead of `z-50`. This only matters where the browser has no top layer: there a menu or picker opened inside a dialog now sits above it, and toasts and tooltips stay above both.

## [9.1.1] - 2026-10-24

### Changed

- Each component's words now come from its own folder (`src/components/<Name>/labels.ts`), and the package's export list, CSS imports and label sets are built from the component folders. `SerupaLabels`, `enLabels`, `idLabels`, `window.Serupa` and the CSS order are unchanged, and projects that import only some components still don't ship the Indonesian words.

## [9.1.0] - 2026-10-24

### Added

- ColorPicker, a radio group of named swatches (arrow keys, Home and End move and pick), then a hex field and the browser's color picker for any other color. With `contrastWith` it shows the WCAG contrast ratio against that color, rounded down and in the locale's numbers, and warns below `minContrast` (4.5 by default) in a polite live region. The picked swatch has a ring and a white or black check, whichever stands out. It takes `swatches`, `value`/`defaultValue`/`onValueChange`, `custom`, `size`, `disabled` and `name`, with 12 `--color-picker-*` tokens.
- The labels `customColor`, `hexCode`, `contrast` and `lowContrast`, in English and Indonesian.
- CopyButton, a Button that copies `value` (text, or a function that returns it) to the clipboard. It then shows a check and "Copied" for two seconds without changing width, and says "Copied" to screen readers. If the browser refuses, it says "Couldn't copy…" and calls `onCopyError`. It has `iconOnly`, `copiedLabel`, `timeout` and `onCopy`, falls back to `execCommand("copy")` where the Clipboard API isn't available, and has the token `--copy-button-done-color`. New labels `copy`, `copied` and `copyFailed`, in English and Indonesian.
- FormattedNumber, a `<data value>` that writes a number the way the locale does, with its digits: plain (`1.234,5` in Indonesian), compact (`1.2K`, with the full number as its tooltip), percent, currency, bytes (`1.5 MB`, in steps of 1024 like `formatFileSize`) and units (`50 km/h`). `options` takes any other `Intl.NumberFormat` option, and `formatNumber(value, locale, options)` gives the same words outside React and in Server Components.
- InlineEdit, text that opens into a field in place. A click, Enter or Space opens it with the text selected; Enter or leaving the field saves, Escape cancels (without closing a surrounding Dialog), and keyboard saves and cancels put focus back. It has `value`/`defaultValue`/`onValueChange`, `validate` (a message keeps it open and describes the field), `placeholder`, `size`, `editing`/`onEditingChange`, `disabled`, `readOnly` and `inputProps`, with 8 `--inline-edit-*` tokens. Both modes share Input's height and padding, so opening it moves nothing.
- The `edit` label ("Edit", "Ubah" in `idLabels`).
- `PhoneInput`, a phone number field with a country menu. It groups the number the way the country writes it as people type, drops a typed trunk `0`, picks the country from a pasted `+…` number, and reports E.164 through `onValueChange` (with `complete` for the length check). `name` submits E.164. 51 countries, named in the locale's words.
- `formatPhone` and `parsePhone`, for showing and reading E.164 numbers outside the field.
- The `country` label ("Country" / "Negara").
- RelativeTime, a `<time datetime>` that says how long ago or how far ahead a moment is, in the locale's words ("3 minutes ago", "yesterday", "in 2 hours"), with the exact date as its tooltip. Every RelativeTime on a page updates on one shared 15-second clock, and server-rendered ones hydrate without a mismatch. It has `format`, `numeric`, `titleFormat` and `locale`, and `relativeTime(date, now, locale)` gives the same words outside React.
- SortableList, a list people reorder by dragging a handle or from the keyboard (Space or Enter to pick up, the arrow keys, Home and End to move, Space or Enter to drop, Escape to put back). Each step is announced ("Gemini, position 3 of 4"), focus stays on the handle, and `onReorder(items, { from, to })` is called once, on drop. It takes `items`, `getKey`, `getLabel`, `renderItem`, `disabled` and `reorderLabel`, with 16 `--sortable-list-*` tokens.
- The labels `reorder`, `reorderInstructions`, `reorderGrabbed`, `reorderMoved`, `reorderDropped` and `reorderCancelled`, in English and Indonesian.
- `limit` on Toaster (default 3). The newest toasts show, and older ones wait under a "+2 more" line until there's room (`labels.moreToasts`).

### Changed

- The same message again (same words and tone, with no `id` or `action`) adds a count to the toast that's showing ("Network error ×12") and starts its time over, instead of adding a toast. It isn't announced again.

### Fixed

- With a Dialog or Drawer opened from inside another, Escape also asked the outer one to close, so the page closed underneath the dialog people were looking at. Now only the top one closes, and the next Escape closes the one below (R29).
- A burst of toasts stacked past the edge of the screen, where they couldn't be read or closed (12 in a row put the first at -80px). At most 3 show now (R30).
- The Toaster stays clear of a phone's notch and home indicator (the safe area).

## [9.0.0] - 2026-10-24

### Added

- Calendar (and the DatePicker and DateRangePicker calendars): a day held down fills with `pressed`, one step past its hover, so a click shows before it selects. New token `--calendar-day-bg-pressed`.
- Checkbox: `readOnly` now works. The browser's `readonly` does nothing on a checkbox, so a click or Space used to toggle it anyway; now the box stays as it is, `onChange` doesn't run, and it says `aria-readonly`. It stays focusable, and a checked read-only box is still submitted with a form.
- Two more theme axes (ADR-0011). `data-contrast="more"` gives 7:1 text, including muted text and placeholders, and stronger borders and field outlines in every theme; it also applies when the system asks for more contrast (`prefers-contrast: more`) unless the page sets `data-contrast="normal"`. `data-density="compact"` makes `md` controls 28px and `lg` 36px (`sm` stays 24px); `data-density="comfortable"` restores the defaults for a section. In `tokens.json`, seven alias colors gain a `contrastMore` pair and the three `control-height` tokens a `compact` value; no token is renamed or removed. `tokens.css` now also sets `color-scheme` for `data-theme`, as `base.css` already did.
- Elevation tokens `surface-raised`, `surface-overlay`, `border-raised` and `border-overlay`. In light themes they match `surface` (and `border` for the overlay edge). In dark themes the surfaces step up to zinc-900 and the edges to zinc-800 and zinc-700, because a shadow doesn't show on zinc-950.
- DateRangePicker: `required`. Both fields get `required` and `aria-required`, so a form won't submit until each end has a date, as with a required `<input>`. Before, the prop wasn't typed and went to the root `<span>`, where it did nothing.
- Docs: an Accessibility foundation page. It names the target, WCAG 2.2 AA, and splits the work: what the components guarantee (contrast, keyboard, focus, names and states, announcements, target size, reflow, motion, forced colors and RTL, dragging alternatives) and what the app must do (page language, title and landmarks, headings, names, errors, color, focus after route changes, media and timeouts, consistent help, testing).
- Docs: a Content and voice foundation page: sentence case, verbs on buttons, labels and hints, errors that say what happened and how to fix it, empty states, and how to write numbers, dates and units. It ends with a table of every word the components say on their own, in English and Indonesian, read from the label set so it can't drift.
- Docs: an Elevation and layers foundation page: the five levels from page to modal with the surface, edge and shadow each uses, drawn in light and dark; why dark themes lift with the surface instead of the shadow; and how the top layer, the named z-index layers and stacking contexts fit together.
- Docs: a Layout foundation page: what changes at each breakpoint, which Container size fits which content, and the spacing rhythm between a page's parts, with a typical app page.
- Field now wires up its control at any depth, including one inside a Tooltip, your own wrapper component or a form library's component. The control gets the id the label points to, the hint and error in `aria-describedby`, `aria-required`, `invalid` and `disabled`. Before this change only a direct child was wired, and a wrapped control lost its label silently. A Combobox's list of options is now named by the Field label too. Input is now a client module (`"use client"`), since it reads the Field around it; it still renders on the server.
- FileUpload: `invalid` (a solid danger outline, and `aria-invalid` on the choose button), `required` (on the native input, and a hidden "Required" in the button's description) and `readOnly` (the files are listed and submitted, but the button opens no picker, drops are ignored and there are no remove buttons). New token `--file-upload-zone-border-invalid` and label `required`. Inside a Field with an error or `required`, the button now says so, and Field's `invalid` and `aria-required` no longer reach the wrapper `<div>` (React warned about `invalid`).
- `focus-ring-width` (2px) and `focus-ring-offset` (2px) tokens, used by every component's focus ring and by the base `:focus-visible` style.
- A contract check fails on a box-shadow focus ring in component CSS. Inset rings are allowed where an outline would be clipped (Tabs).
- A `highlight` color token (zinc-200 light, zinc-700 dark) for the highlighted row in a list.
- Native Select options are drawn by the browser and can't use the token.
- Image: `priority`, for the main picture at the top of a page. It loads at once with `fetchpriority="high"` instead of lazily. Images now default to `decoding="async"`.
- List: a link or button item held down fills with `pressed`, one step past its hover, so a click shows. Pressing the item's trailing action doesn't press the row. New token `--list-bg-pressed`.
- Menu: an item held down fills with `pressed`, one step past its highlight, so a click shows. A destructive item keeps its danger tint. New token `--menu-item-bg-pressed`.
- Meter, a measurement within a known range (storage used, a strength, a battery level) with `role="meter"`. `low`, `high` and `optimum` color it by zone as HTML's `<meter>` does: success in the best zone, warning in the next, danger in the worst. It has `min`, `max`, `size`, `label`, `showValue` and `formatValue`, and the value follows the locale. `meterState()` returns the same zone for text that goes with it. Fourteen `--meter-*` tokens for its colors, sizes, spacing and motion.
- NumberInput `currency`, an ISO 4217 code that shows the amount as money with the symbol where the locale puts it ("$19.99", "19,99 €"), short for `formatOptions={{ style: "currency", currency }}`.
- NumberInput `minorUnits`: with `currency`, `value`, `defaultValue`, `onValueChange`, `min`, `max` and `step` are whole minor units from ISO 4217 (1999 is $19.99, 0 decimals for JPY, 3 for KWD), so money can be stored as integers.
- NumberInput `locale`, which sets the marks that are read and written. The default is the nearest `SerupaProvider`'s locale, else the browser's.
- NumberInput `formatOptions`, which takes Intl.NumberFormat options for display, such as currency (`{ style: "currency", currency: "IDR" }` shows "Rp 1.500"), grouping, or percent. It also sets `aria-valuetext`.
- An `opacity-disabled` token (50%) and `opacity-disabled` class. Every disabled control and item uses it, and so does `--pagination-disabled`'s default, instead of writing out `opacity-50` in 20 places, so you can change how disabled looks in one place. It renders the same as before.
- Pagination: a page or arrow held down fills with `pressed`, one step past its hover, so a click shows. New token `--pagination-bg-pressed`.
- A `pressed` color token (zinc-300 light, zinc-600 dark) for the fill while a row, tab, day or page button is held down, one step past its hover. `text` keeps 7:1 or better on it. Components start using it in the following changes.
- Docs: a States section in the foundations that sets one state model (rest, hover, pressed, focus, selected, disabled, invalid) with the tokens for each.
- `serupa-purge --components` also drops the styles of components your code never names, keeping the components they need (IconButton brings Button and Icon). An app that only uses Button gets about 48 KB of CSS instead of 189 KB. The map it reads ships as `serupa-ds/components.json`.
- SegmentedControl: `invalid` (a danger outline and `aria-invalid`), `required` (`aria-required`) and `readOnly` (`aria-readonly`; the arrows move focus so every option can be heard, but nothing changes the selection, and a form still gets the value). New token `--segmented-control-invalid`. Inside a Field with an error the control turns invalid; before, Field's `invalid` reached the root `<div>` and React warned.
- `<SerupaProvider>` sets the locale, the built-in words and extra icons for every component inside it (ADR-0010). It's React context, so it reaches client components from a server layout, stays separate between concurrent server requests, and can change for one part of a page; nested providers change only what they set. `idLabels` has every built-in word in Indonesian, `enLabels` the English defaults, and the `SerupaLabels` type lists the keys. A component's own prop (`dismissLabel`, `locale`, …) still wins. `useSerupa()` reads the settings in your own components. Stepper is now a client component (`"use client"`), since it reads the provider's words; it still renders on the server as before.
- Sidebar: an item held down fills with `pressed`, one step past its hover, so a click shows. New token `--sidebar-item-bg-pressed`.
- Slider: `invalid` (a danger fill and thumb ring, and `aria-invalid` on the thumbs) and `readOnly` (focusable and read out with `aria-readonly`, but keys and presses don't move it, and a form still gets the value). New token `--slider-invalid`. Inside a Field with an error the slider turns invalid, and Field's `invalid` and `aria-required` no longer reach the root `<div>` (React warned about `invalid`; a slider always has a value, so `required` has no effect).
- `success-text`, `warning-text` and `info-text` color tokens, with `text-success-text`, `text-warning-text` and `text-info-text` classes. Each one keeps 4.5:1 or better on `surface`, `surface-muted` and its own `*-subtle` tint in all six themes, like `danger-text`. Use them for status text: `success` (3.30:1) and `warning` (3.19:1) fail AA as text on light surfaces, so they're for icons and fills.
- Switch: `readOnly` now works. The browser's `readonly` does nothing on a checkbox, so a click or Space used to flip it anyway; now it stays as it is, `onChange` doesn't run, and it says `aria-readonly`. It stays focusable, and an on read-only switch is still submitted with a form.
- Table: `TableSelectCell`, a checkbox cell for selecting a row ("Select Ada"), or with `header` all rows (with `indeterminate`). Its checkbox tells screen readers which rows are selected, and a row whose checkbox is checked is shaded like a selected one.
- Tabs: an unselected pill tab held down fills with `pressed`, one step past its hover, until the click selects it. New token `--tabs-pill-bg-pressed`. Line tabs, which have no fill, are unchanged.
- Dark mode without JavaScript: `data-brand` and `data-mode` now work on their own, on `<html>` or any element (ADR-0011). Every color that differs between themes is also written as a `light-dark()` pair, and `data-mode` sets `color-scheme` (`auto` is `light dark`), so `<html data-brand="violet" data-mode="auto">` follows the operating system from the first paint with no `theme.js`, a `data-mode="dark"` section works inside a light page, and a `data-brand` section takes its own brand. Badge's tone colors follow too. `data-theme` and `theme.js` work exactly as before, and a page with neither attribute stays light.
- Type roles, text styles named for what they're for: `type-display`, `type-heading-1` to `type-heading-4`, `type-title`, `type-body`, `type-body-sm`, `type-label`, `type-caption`, `type-overline` and `type-code`. Each is a class in `tokens.css`, a `--text-type-*` font shorthand, and a typography token in `design-tokens/`. `<Heading>` levels 1 to 4 render the heading roles exactly, so a class and the component match. `type-display` has a line height of 1.1, so two-line headlines don't touch. The `type-xs` to `type-9xl` size styles are unchanged.

### Changed

- Breadcrumb: the "…" button is named "Show all pages", which says what pressing it does. `expandLabel` still sets your own. In `idLabels` it's "Tampilkan semua halaman".
- Tooling: component CSS can't use physical left and right properties (`padding-left`, `left`, `float: right`…); Stylelint asks for the logical ones (`padding-inline-start`, `inset-inline`, `float: inline-start`…), so every component keeps working in right-to-left text. Navbar's mobile menu, the centered Toast stack and Field's group label move to the logical properties, with no visible change.
- Docs: Storybook's toolbar has a Direction switch (left to right, right to left), so any story can be checked mirrored.
- **Breaking.** Changed: Card: a linked card (`href`) is no longer one `<a>`. It was invalid HTML with buttons inside (a `<button>` nested in an `<a>`, which also broke hydration), pressing such a button followed the link too, and screen readers read the whole card as one long link. Now the card stays a `<div>` (or `as`, which `href` no longer ignores), and the link wraps the `CardHeader` title, named by it, with its clickable area stretched over the card. Buttons and links inside work on their own. Without a `CardHeader` title, an empty link over the card is named by the card's text. **Migrating:** `ref` now points at the card element, not the link (reach the link with `.querySelector('.dk-card__link')`). `href`, `target`, `rel` and `aria-label` go to the link, and everything else, `onClick` included, stays on the card. CSS for `a.dk-card` or `.dk-card--link:focus-visible` should target `.dk-card--link` and `.dk-card--link:has(.dk-card__link:focus-visible)`.
- Carousel: the default slide and dot names ("2 of 5") come from a new `slideOf` label, so `SerupaProvider labels` translates them. `idLabels` has "2 dari 5". `slideLabel` still wins.
- Combobox: the × button is named after the field, "Clear Country" for a field labelled "Country", so a screen reader says what it clears. A field with no label keeps "Clear", and `clearLabel` still sets your own words.
- Menu, Popover, Dialog, Drawer, Toast and the Combobox, DatePicker and TimePicker lists use `surface-overlay`, and the ones with a border use `border-overlay`, so in dark themes they stand off the page.
- DatePicker: the calendar button and its popup are named "Choose a date", in full words like FileUpload's "Choose a file". `buttonLabel` still sets your own.
- The JavaScript (`dist/index.js`, `serupa.iife.js` and the plain-page React files) is built for ES2022 instead of ES2019, so optional chaining, `??` and class fields ship as written instead of rewritten. Every browser the README supports (current Chrome, Edge, Safari and Firefox), and every browser React 19 runs in, has ES2022, so nothing changes for visitors. The files are slightly smaller.
- FileUpload: a file of the wrong type says what the field takes, in words from `accept`: "photo.heic isn't a PNG or JPG." or "notes.txt isn't an image or PDF." A type with no short name (`application/vnd.ms-excel`) keeps the general message.
- Tooling: component tests can turn on real forced colors with `forcedColors(during)` from `tools/test/vitest/helpers.ts`.
- Menu, Combobox, TimePicker and Sidebar use `highlight` for the hovered, focused, active or current row, so they look the same. Before, Menu and Sidebar used `secondary` and Combobox and TimePicker used `surface-muted`.
- From the keyboard, the highlighted Menu item, Combobox option and TimePicker time also get a 2px primary bar at their start (a danger-colored bar on a destructive Menu item). New tokens: `--menu-item-indicator`, `--combobox-option-indicator`, `--time-picker-option-indicator`.
- On the highlighted Combobox option, the muted second line turns to `text`, which keeps 4.5:1 on `highlight`.
- Icon: each component imports the icons it draws, so a bundle keeps only the icons of the components it uses. Button alone drops from 11.9 to 5.1 KiB gzipped, Dialog alone from 13.0 to 6.2 KiB, and all components from 50.8 to 46.8 KiB. Before, any component that drew an icon shipped all 73 icons the components use.
- Icon: a name drawn as a string (`<Icon name="close" />`, `leftIcon="close"`) now loads in the browser the first time a page draws it: the components' own icons come from a small file (about 14 KB), and any other name from the full set, as before. If you render on the server and draw icons by name, they show an empty box until the page loads. To draw them on the server, pass the imported icon (`icon={Close}` with `import { Close } from "serupa-ds/icons"`) or call `registerIcons(Close)` once before rendering. The components' own icons still draw on the server. `getIcon(name)` returns an icon once it is registered or loaded.
- Loader: the default label is "Loading…", with an ellipsis, like Combobox's loading row. The text variant shows it, and screen readers hear the same word. In `idLabels` it's "Memuat…".
- Button: screen readers hear "Loading…" when a button starts loading, the same words as Loader. `loadingText` still sets your own.
- Badge: screen readers hear "Loading…" when a badge starts loading, the same words as Loader. `loadingText` still sets your own.
- `font-mono` is the system's monospace font (`ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`) instead of Courier New, which was thin, wide and hard to tell 0 from O in. The token keeps its name.
- With `base.css`, a bare `<kbd>` uses `font-sans`, like the `<Kbd>` component. `code`, `samp` and `pre` keep `font-mono`.
- Base.css: print styles. Browsers drop backgrounds when printing, so a primary Button printed as faint text on white and filled Badges lost their color. Now, when printing, filled controls (Button, Badge, Progress, Switch, checked Checkbox and Radio, Avatar, Stepper, SegmentedControl, Alert, Slider, Calendar, Pagination, Tabs) keep their colors. The toast stack, tooltips, menus, popovers and open pickers don't print. Put `data-print-urls` on a container to print each outside link's address after its text.
- An invalid Switch keeps its grey (off) or brand (on) track and gets a 2px danger edge, like Checkbox and Radio's danger border. Before, an off invalid Switch filled its track red, so it looked switched on. The focus ring stays danger. `--switch-invalid` now colors the edge.
- Table: `TableRow`'s `selected` no longer sets `aria-selected`. Browsers ignore it on a plain table's rows, so it told screen readers nothing; use `TableSelectCell` for that.
- TimePicker: the list and the clock button are named "Choose a time", in full words like DatePicker's "Choose a date". `listLabel` still sets your own.
- Tooling: a foundation check fails if a `:hover` rule sits outside `@media (hover: hover)`, and `tools/test/touch-hover.mjs` taps Buttons on an emulated phone and checks they go back to rest. Headless Firefox in the component tests gets a hovering pointer, as the other scripts already did.

### Deprecated

- `--button-focus-gap-color`, `--checkbox-focus-gap-color`, `--radio-focus-gap-color`, `--switch-focus-gap-color` and `--badge-focus-gap-color`. They have no effect now and are removed in 9.0.0.

### Fixed

- Badge: a count is written in the locale's digits, as Calendar writes its days (٧ and ٩٩+ in Egyptian Arabic, ۱۲ in Persian).
- Button: in right-to-left text, a button with an icon puts its extra 4px of padding on the text side, as it does in left-to-right text. Before, it landed next to the icon.
- Combobox: matching "ignoring case and accents" missed letters that don't split into a letter and an accent: "lodz" didn't find Łódź, "da nang" didn't find Đà Nẵng, and "orsted", "aeon", "strasse" and "hal far" didn't find Ørsted, Æon, Straße and Ħal Far. Full-width text typed with Japanese input ("ｔｏｋｙｏ") and half-width kana didn't match either. Labels and typed text are now folded the same way: compatibility decomposition, accents removed, and a short table for ł, đ, ø, æ, œ, ß, ħ, ı, þ and similar letters.
- An `elevated` Card is visible in dark themes. Before, its border was transparent and its shadow black on black, so its text floated on the page. New tokens `--card-bg-elevated` and `--card-border-elevated`. `--card-bg` now sets only the outline card's background; set `--card-bg-elevated` for elevated cards.
- DatePicker and DateRangePicker: in locales with another calendar or other digits (th, ja-u-ca-japanese, fa, ar-EG, bn and others), leaving the field moved the date. Thai wrote the Buddhist year 2568, which read back as the year 2568; Persian and Arabic digits weren't read at all, so the value was lost. The field now always writes Gregorian years with Latin digits, and reads digits typed in any script. Month and weekday names in the calendar stay localized.
- Calendar: in those locales the title and each day's label named the month and year in the locale's own calendar ("พฤศจิกายน 2568", "آبان ۱۴۰۴"), while the grid showed Gregorian days. They now name the Gregorian month shown, still in the locale's language.
- DateRangePicker: `ref.current.focus()` and `autoFocus` focus the start field. Before, they focused nothing, so a form library that focuses the first invalid field after a failed submit (React Hook Form, Formik) left people where they were. The ref is still the `role="group"` box.
- FileUpload: in a Field, the button is named by the label and its own text ("Due date, Choose a file") and described by the Field's hint and error. Before, a screen reader heard only "Choose a file". `aria-describedby` now goes to the button, not the wrapper.
- FileUpload: `ref.current.focus()` and `autoFocus` focus the choose button. Before, they focused nothing, so a form library that focuses the first invalid field after a failed submit (React Hook Form, Formik) left people where they were. The ref is still the root `<div>`.
- The focus ring on Button (and IconButton, Fab), Checkbox, Radio, Switch and clickable Badges painted its 2px gap in `surface`. On a tinted background it showed as a band: white on light Alerts, black on dark ones, and the same on muted Navbar, Sidebar and Card backgrounds. These components now use the recipe every other component uses, an outline with `outline-offset`. Its gap is transparent and it follows the corner radius.
- Calendar, SegmentedControl, Stepper: in Windows high contrast (forced colors), the selected day, the checked segment's label and the current step's number show again. The browser put a Canvas-colored backplate behind the text, the same color as the HighlightText it was drawn in, so it vanished. DatePicker's and DateRangePicker's calendars are fixed with Calendar.
- Combobox, DatePicker, DateRangePicker, TimePicker, Slider and SegmentedControl now go back to their defaultValue when their form is reset. That includes `form.reset()`, a reset button, and React 19 resetting a form after its action. Before this fix they kept submitting and showing the last choice. Controlled ones are left to the app, as with a native field.
- Accordion, AvatarGroup, Breadcrumb, Carousel, Navbar, Sidebar: items wrapped in a Fragment (`<>…</>`, or a list returned from a map inside one) are items of their own, so they get their own separator, slide, list item or count. Before, the Fragment counted as one item.
- DatePicker, DateRangePicker, TimePicker, Calendar and NumberInput no longer break server-rendered pages when no `locale` is set. The server and the first client render agree on `en-US`, so React reports no hydration mismatch, and the components switch to the browser's locale right after hydrating, placeholder included. Before, a server in `en-US` and a browser in `id-ID` gave a mm/dd/yyyy placeholder next to 23/10/2026, and typing 03/04/2026 the way it asked gave 3 April. For the visitor's format from the first paint, set `<SerupaProvider locale>` from the request (see the Localization guide).
- Image: with `ratio="auto"`, `width` and `height` now shape the frame before the picture arrives, so the page no longer jumps when it loads. Without them, Image warns once in the console.
- Typing with an input method (Japanese, Chinese, Korean) triggered actions. Enter confirms a composition and Escape cancels it, but the components acted on those keys:
  - Combobox picked the highlighted option while "Ja" was still being composed.
  - SearchInput cleared the field on Escape and searched with half-typed text on Enter.
  - TimePicker, DatePicker, DateRangePicker and NumberInput read the half-typed text.
  - Menu, Popover, Tooltip and Navbar closed on Escape.

  Key handlers now ignore keydowns that belong to a composition (`isComposing`, or keyCode 229).
- Link: `autoFocus` focuses the link once it mounts, also with `as`. React only autofocuses form controls, so before it did nothing.
- DatePicker: in Kyrgyz (`ky`), which writes dates year-day-month, typing the date the field shows read it as year-month-day (2026-05-01 for 5 January became 1 May). A leading 4-digit year now reads as ISO only when the locale doesn't write its year first. DateRangePicker reads dates the same way.
- TimePicker: times that some locales write didn't read back when typed: Bulgarian's 12-hour form (the "ч." after the time), Assamese ("AM ৯.০৫", with AM first), the Japanese calendar's 12-hour clock ("午前0:00", which starts at 0) and Dzongkha (words for "hour" and "minute"). The parser now reads AM and PM before or after the time, drops the locale's own words around a time, and takes 0 as the first hour of a half. A new test checks round trips in 104 locales, in the browser and in Node.
- Menu: typing more than one letter now goes to the item starting with the whole word ("de" finds Delete, past Duplicate), and the same letter again steps through the items starting with it. Accents and case are ignored, so "e" finds "Éditer" and "lo" finds "Łódź".
- Toasts and screen-reader announcements now work while a Dialog or Drawer is open. The Toaster and the shared live regions move into the open modal, since the page behind it is inert, and move back when it closes. Danger toasts are announced assertively. Two announcements in quick succession are both said, instead of the second replacing the first.
- A `<section data-mode="dark">` stayed light unless `<html>` had `data-brand` or `data-mode`, which included every page that uses `data-theme`. Its `color-scheme` turned dark, so native controls and scrollbars went dark on a white background. A nested `data-mode` element now carries the full set of light-dark() colors, keeps the brand of the page or section around it (or takes its own `data-brand`), and keeps `data-contrast="more"` from the page.
- Navbar: with the small-screen menu open, Tab goes from the menu button into the links. Before, the links came before the button in the DOM, so Tab went on into the page with the menu still open over it (WCAG 2.4.3). Focus leaving the bar now closes the menu.
- NumberInput with a currency format keeps the currency's decimals with a whole-number step: 12.5 stays $12.50 instead of rounding to $13.00.
- NumberInput misread thousands separators. "1,500" became 2 (read as 1.5, then rounded to the step), "1.000" in Indonesian or German became 1, and "1 000" was rejected. It now reads the locale's decimal and group marks. A group mark counts as grouping only when the digits are grouped in threes, so "9.5" and "9,5" are still 9.5 everywhere. Digits in other scripts, a currency symbol and % are accepted.
- NumberInput shows the number with the locale's decimal mark: "9,5" in de-DE and id-ID, where it used to show "9.5".
- Pagination: page numbers are written in the locale's digits, as Calendar writes its days (١ ٢ ٣ in Egyptian Arabic, ۱ ۲ ۳ in Persian).
- Menu, Popover, Combobox, DatePicker, DateRangePicker, TimePicker and Tooltip: when neither side of the trigger has room (a short window, a phone held sideways, a trigger in a sticky header), the pop-up opens on the roomier side, gets as tall as the room it has and scrolls inside, so all of it stays on screen. Before, it kept its side and ran off the screen, and its last items couldn't be reached.
- Progress: the percentage, shown and read out, is written the way the locale writes it, in its own digits, like Calendar's days: "%45" in Turkish, "45 %" in French, "٤٥٪" in Egyptian Arabic. English is still "45%".
- Serupa-purge keeps `sr-only` and the other utility classes the components add at run time; it used to drop them, which made the screen-reader announcer visible.
- Dialog, Drawer: opening one no longer shifts the page behind it 15px sideways with classic scrollbars (Windows, Linux, and macOS set to always show them). While scrolling is locked, a page that had a scrollbar keeps its space (`scrollbar-gutter: stable`); a page without one gets none.
- SegmentedControl: your `onKeyDown` runs before the control's own key handling, so `preventDefault()` in it stops that key, as on the other inputs. `onFocus` and `onBlur` fire only when focus enters or leaves the control, not as the arrow keys move between segments.
- SegmentedControl: in a Field, the label names it. Before, a SegmentedControl in a Field had no name; only the hint and error reached it.
- SegmentedControl: `ref.current.focus()` and `autoFocus` focus the selected segment, or else the first one that isn't disabled. Before, they focused nothing, so a form library that focuses the first invalid field after a failed submit (React Hook Form, Formik) left people where they were. The ref is still the root `<div>`.
- SegmentedControl: in forced colors (Windows high contrast), hovering the selected segment no longer turns its label dark on the Highlight selection. It stays HighlightText.
- SegmentedControl: in `size="sm"`, icon-only segments were 18px wide with their centers 18px apart, which fails WCAG 2.2's target size minimum (2.5.8). They're now at least 24px wide. The control is still 24px tall, and md segments don't change.
- Importing serupa-ds from a React Server Component (the Next.js App Router) failed with "createContext is not a function", because the whole package was one module. Each source file is now its own module under `dist/js/`, and the 44 interactive components start with `"use client"`. Layout and text components still render on the server, and `buttonClass`, `paginationRange`, `formatFileSize` and `initials` can be called there. Imports, exports and types are unchanged, and a bundler still drops the components you don't use.
- Slider: your `onKeyDown` runs before the slider's own key handling, so `preventDefault()` in it stops that key, as on the other inputs. `onFocus` and `onBlur` fire only when focus enters or leaves the slider, not when Tab moves between a range's two thumbs.
- Slider: in a Field, the label names it and the hint and error describe it. Before, a Slider in a Field had no name, so a screen reader said only "slider, 50". A single slider's `aria-describedby` now goes to the thumb, which is what screen readers read.
- Slider: inside a disabled `<fieldset>` it is disabled too, as native inputs are. Before, its thumbs stayed in the Tab order, weren't announced as disabled, and the arrow keys still changed the value and called onValueChange. It follows the fieldset as it is enabled and disabled.
- Slider: `ref.current.focus()` and `autoFocus` focus the first thumb. Before, they focused nothing, so a form library that focuses the first invalid field after a failed submit (React Hook Form, Formik) left people where they were. The ref is still the root `<div>`.
- Slider and NumberInput landed off the grid when `min` had decimals that `step` didn't. With `min={0.5}` and `step={1}`, Slider showed a default of 2.5 as 3, and NumberInput's ArrowUp went from 2.5 to 4. Values now keep the decimals of both `min` and `step`, so they stay on 0.5, 1.5, 2.5 and so on. A step written in exponent form (`1e-7`) no longer rounds every value to a whole number.
- Stepper: step numbers are written in the locale's digits, as Calendar writes its days (٣ in Egyptian Arabic).
- Stepper: a horizontal Stepper too narrow for its titles side by side (below about 560px for four steps, on a phone or at 400% zoom) no longer overlaps itself or scrolls the page sideways. It keeps the circles and lines and shows one line under them, "Step 2 of 4: Profile". Screen readers still read every step. The words come from the new `stepOf` label (`labels.stepOf` on Stepper or SerupaProvider).
- Docs: Combobox's page shows its sizes, its states (empty, chosen and clearable, with an icon, invalid, disabled) and a field with an error as stories, so each is checked in all six themes.
- Docs: Drawer's page shows the top side, the small and large sizes, a drawer without a close button and one that stays open on a backdrop press.
- Docs: IconButton's page shows disabled and loading buttons in each variant, and icon buttons that are links.
- Docs: Breadcrumb's page shows long labels and a two-level trail; Container's shows the full width and no side padding; EmptyState's shows the small size, a text-only state and a small dashed one.
- Tabs: removing the selected tab in uncontrolled Tabs (a closable tab, say) left no tab selected and no panel showing. Every tab had `tabindex="-1"`, so the tab list couldn't be reached with the keyboard. The next enabled tab, or else the previous one, is now selected and `onValueChange` is called. Controlled Tabs warn in the console instead.
- Tabs: a `defaultValue` that matches no tab now selects the first enabled tab.
- Tabs without `defaultValue` now pick their first enabled tab while rendering, so server-rendered HTML already has a selected tab, a visible panel and a tab that can be reached with the keyboard. Before this fix every panel was hidden until JavaScript ran, and then the content jumped in.
- Textarea: the `showCount` numbers are written in the locale's digits, as Calendar writes its days ("١٢ / ٢٠٠" in Egyptian Arabic).
- TimePicker couldn't read the times it writes in some locales. In Korean ("오후 2:05"), Egyptian Arabic ("٢:٠٥ م") and Persian ("۱۴:۰۵"), a typed time, or a blur on the time the field had just written, was rejected and the field put back the last value. It now reads digits in any script and the locale's own words for AM and PM.
- Toast: a toast with an `action` (such as Undo) stays until it's closed, unless you give it a `duration`. Before, it went after 5 seconds, usually before keyboard and screen reader users could reach the button (WCAG 2.2.1). F8 now moves focus to the newest toast and back (Escape goes back too), and the first toast with an action adds "Press F8 to reach it." to its announcement. New label `toastShortcut` (Indonesian in `idLabels`) and component token `--toast-focus-ring` for the focused toast's ring.
- Components: hover colors no longer stick after a tap on phones and tablets. A touch screen keeps hover on the last element tapped, so a tapped secondary Button stayed tinted as if still selected. Every component's hover styles (and base.css's link hover) now apply only on devices that hover, inside `@media (hover: hover)`. Press feedback (`:active`, the ripple) is unchanged.

## [8.0.0] - 2026-10-23

### Added

- `npx serupa-purge src -o public/bundle.min.css` trims `bundle.css` to the classes your code uses, straight from the installed package. It replaces `tools/purge.py`, which only ran from a clone with Python, and gives the same output.

### Changed

- **Breaking.** React 19 is required. The peer dependency is `react` and `react-dom` `^19.0.0` (was `^18.0.0 || ^19.0.0`). To upgrade a project on React 18, move it to React 19 first (`npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19`) and follow React's upgrade guide; the components themselves need no change.
- **Breaking.** Node 26 or later is required (`engines.node` is `>=26`, was `>=20`). It applies to installing the package and running `serupa-purge`. Move the project's Node, its CI and its `.nvmrc` to 26.
- Plain pages get React 19.3.1 instead of 18.3.1. `dist/lib/react.production.min.js` and `dist/lib/react-dom.production.min.js` keep their names and still set `window.React` and `window.ReactDOM`, so a page set up as the README shows needs no change. A page whose own code calls APIs React 19 removed, such as `ReactDOM.render` or `ReactDOM.hydrate`, should switch to `ReactDOM.createRoot(el).render(…)` and `ReactDOM.hydrateRoot(el, …)`. Projects with a bundler use their own React.
- A bundler now keeps only the components a project imports. Before, `import { Divider } from "serupa-ds"` brought every component along (about 48 KB gzipped); now it's under 1 KB, and Button with its icons and loader is about 11 KB. Components are made with a pure-marked helper instead of a separate `displayName` statement, and the icon list, contexts and the toast store no longer run code when the module loads. Display names in React DevTools are unchanged.
- Popover, Menu, Tooltip and Combobox place themselves with the shared anchored-layer helper that TimePicker and DateRangePicker use, so all of them follow the same rules for placing, flipping and closing on an outside press. Nothing changes for people using them, except that changing `placement` while a Popover or Menu is open no longer moves focus back to its first control.
- The utility classes are generated from the tokens. `src/styles/utilities.template.css` (347 KB, 5,900 lines) replaces the 1.8 MB hand-kept `utilities.css`; its `@each` loops repeat each color, spacing and other token-scaled class once per token, and `@responsive` makes the `sm:` … `2xl:` variants from the `screen-*` tokens. A new token now gets its classes without editing the CSS. `dist/utilities.css` has the same 25,560 classes with the same declarations, one rule per line.
- The color tokens `field`, `field-border`, `field-border-hover`, `placeholder` and `overlay` sit after `surface-muted` in `tokens.json`, the order the utility classes already had. No token changed name or value.
- VisuallyHidden, the FileUpload input and Sidebar's hidden label hide with `clip-path: inset(var(--sizing-1-2))` (50%) instead of the deprecated `clip`, as the `sr-only` class already did. Nothing changes on screen or for screen readers.
- Tooling: the custom icon build is `node tools/icons/build.mjs` (it was `python3 tools/icons/build.py`), with the same rules and output; `node tools/icons/builtin.mjs` keeps the built-in icons in step. Building, testing and releasing no longer need Python.
- Tooling: `node tools/test/run.mjs` finds the component suites in `tools/test/` itself, so a new suite runs without a line in `run.mjs`. `--list` prints the steps it would run.
- Tooling: CI runs the visual snapshots as three parallel shards, so they no longer set how long a run takes. `SERUPA_SHARD=2/3 node tools/test/visual.mjs` checks one shard locally.
- Tests: Combobox, Menu, Popover and Tooltip's tests moved next to each component, into `<Name>.test.tsx` (Vitest). Tooltip gained a check that new text while open is placed again.

### Removed

- **Breaking.** `dist/bundle.js` and the `serupa-ds/bundle.js` export, the old name of the browser script. Load `dist/serupa.iife.js` (`serupa-ds/serupa.iife.js`) instead; it is the same file.
- The `.justify-baseline` utility. `justify-content: baseline` does nothing in flex or grid layouts, so no page changes; delete the class where it's used, or use `items-baseline` to line items up on their text.

### Fixed

- Combobox: when the value changes from outside, the field shows the new label in the same frame instead of one frame later.
- Calendar: when the shown month changes, the keyboard focus target moves into the new month in the same render instead of one render later.
- Badge, Button, Loader, TimePicker and Toast: no visible change; their effects now declare everything they read, which clears the last React hook lint warnings. Badge and Button still announce `loadingText` once, when loading starts; Loader still waits the delay it mounted with; a replaced toast still starts its time again.
- Docs: the Checkbox, Field and Input guides named test scripts that no longer exist; they now point to each component's `.test.tsx`. The usage-guide check now fails when a guide names a file that isn't there.

## [7.1.3] - 2026-10-19

### Changed

- the release script is Node (`node tools/release.mjs`), so releasing no longer needs Python.

### Fixed

- the README and Getting Started install line pinned v5.0.0; it now names the latest release, and every release updates it.

## [7.1.2] - 2026-10-18

### Fixed

- Tooling: `eslint`, `@eslint/js` and `eslint-plugin-react-hooks` are pinned to exact versions in package.json, like every other dev dependency. Nothing in the published package changes.

## [7.1.1] - 2026-10-18

### Fixed

- Tooling: ESLint is upgraded from 9 to 10 (with `@eslint/js` 10 and `eslint-plugin-react-hooks` 7), so `npm ci` no longer warns that `eslint@9` is unsupported. Lint reports the same results as before; nothing in the published package changes.

## [7.1.0] - 2026-10-18

### Added

- Performance: the main bundle no longer carries every icon. It's about 58 KB gzipped again (it was about 577 KB in 7.0.0). The icons the components use are built in. The full set is a separate file that loads the first time a page draws another name, and that icon appears once it has loaded. Apps that only use the built-in icons never download it. Every name still works, and nothing changes in how you use icons.
- Server rendering: built-in icons render on the server; other names render their empty box until the page loads in the browser. To render every icon on the server, call `registerIcons(await import("serupa-ds/icons"))` first.
- `getIcon(name)` returns an icon outside the built-in set only once the full set has loaded (or you registered it).
- Docs: Storybook loads the full set up front, so the Icons page and every icon control draw at once.

### Security

- The Release workflow runs `changesets/action` pinned to a commit (v1.9.0) instead of the moving `v1` tag, since it can write to the repository.
- CI runs with read-only access to the repository.
- Link and Button guides say to check `href` values that come from people, because React still renders `javascript:` links.

## [7.0.0] - 2026-10-18

### Changed

- Every Material Symbol (all 3,776) now works by name: `<Icon name="category" />`, `leftIcon="category"`. Names autocomplete in TypeScript through the new `MaterialIconName` type. Imported icons (`icon={Category}`) still work.
- **Breaking.** Removed: the `CommonIconName` type and the "everyday icons" list (`docs/icon-names.json`). Every name works now, so there's nothing to pick from. Migration: use `IconName` or `MaterialIconName` instead of `CommonIconName`.
- Size: the package's main entry now carries every icon, about 520 KB more gzipped.
- `serupa-icons.iife.js` is no longer needed on plain pages; it's kept, empty, so pages that include it keep working.
- Docs: every icon control in Storybook (Button, Badge, Input, Select, EmptyState, Icon) is a list of every icon name instead of a text box, and the Foundations/Icons page shows all of them with search; a click copies the name. The icon test now checks every icon against the 5.x font, not only the everyday ones.

### Security

- tsup and Storybook now build with esbuild 0.28.2, which clears the one low `npm audit` warning (a file read through esbuild's dev server on Windows, GHSA-g7r4-m6w7-qqqr). Vite keeps its own esbuild 0.25, which the warning never covered. The ES module build is byte-for-byte the same; `serupa.iife.js` and `bundle.js` differ only in esbuild's small CommonJS wrapper helper.

## [6.0.1] - 2026-10-18

### Fixed

- Docs: Menu's page shows the bottom-end, top-start, top-end and right-start placements, a menu without icons, one with shortcuts, disabled items, groups with separators, link items and long labels as stories, so each is checked in all six themes.
- Docs: Popover's page shows the bottom, top, right, left, bottom-end and top-start placements, a popover without a title, one with checkboxes and actions, and one with long content as stories, so each is checked in all six themes.
- Docs: Tooltip's page shows the bottom, left, right, top-start and bottom-end placements, a tooltip on a text button, long text, one explaining an unavailable action and a disabled tooltip as stories, so each is checked in all six themes.
- Docs: Fab's page shows the small, extended, extended small, disabled, loading and destructive FABs and the four corner positions (inside a frame) as stories, so each is checked in all six themes.
- Tests: Fab has a preview page, so its sizes, extended look, states and four corner positions are checked in all six themes.
- Tests: The visual check hovers and focuses the element a preview marks with `data-visual-target`, not only the first button. Slider, Switch, Checkbox, Radio, Input, Textarea, Select, Link, Tabs and Accordion now have hover and focus snapshots too.

## [6.0.0] - 2026-10-18

### Added

- Component tokens for the colors that read a shared color directly, so each one can now be overridden per component. Unset, each one uses the same color as before, so nothing looks different. Card: `--card-text`, `--card-focus-ring`. Badge: `--badge-neutral-subtle-bg`, `--badge-neutral-subtle-text`, `--badge-neutral-solid-bg`, `--badge-neutral-solid-text`, `--badge-neutral-outline-text`, `--badge-neutral-outline-border`, `--badge-primary-subtle-bg`, `--badge-primary-subtle-text`, `--badge-primary-solid-bg`, `--badge-primary-solid-text`, `--badge-primary-outline-text`, `--badge-primary-outline-border`, `--badge-indicator-ring-color`, `--badge-focus-gap-color`. Button, Checkbox, Radio and Switch: `--button-focus-gap-color`, `--checkbox-focus-gap-color`, `--radio-focus-gap-color`, `--switch-focus-gap-color` (the 2px gap between the control and its focus ring; set it to the color the control sits on). Combobox: `--combobox-chevron-hover`, `--combobox-chevron-bg-hover`. DatePicker: `--date-picker-button-hover`, `--date-picker-button-bg-hover`, `--date-picker-focus-ring`, `--date-picker-popup-text`. TimePicker: `--time-picker-button-hover`, `--time-picker-button-bg-hover`. Dialog: `--dialog-text`. Drawer: `--drawer-text`. Field: `--field-text`. Input: `--input-text`, `--input-icon-color`. Navbar: `--navbar-brand-text`. Select: `--select-text`. Textarea: `--textarea-text`, `--textarea-count-full`. Tabs: `--tabs-focus-ring`, `--tabs-focus-gap-color`.
- Tests: the foundation audit checks that every width in a media query (the component CSS, the utilities and `matchMedia()` in the components) is a `screen-*` value; a `max-width` may end just below one (`767.98px`). CSS variables don't work inside `@media`, so these values are written out and now can't drift from the tokens.
- Tests: the brand list comes from `tokens.json` (`color.themes`). The foundation audit checks that `theme.js` (`BRANDS`, its default and its header), the `ThemeBrand` type and the theme lists in the tests name the same brands and themes, and that each brand has a light and a dark theme (ADR-0003).
- Icons: `serupa-ds/icons`, one named export per Material Symbol (`add` is `Add`, `arrow_forward` is `ArrowForward`, `10k` is `Icon10k`); Icon's `icon` prop; `registerIcons()` and `getIcon()`; the `IconData`, `IconSource` and `CommonIconName` types. Every icon prop (Button, IconButton, Fab, Input, Select, Menu, Tabs, Alert, Badge, Breadcrumb, Sidebar, List, EmptyState, SegmentedControl…) takes a name, an imported icon or an element.

### Changed

- Docs: Storybook's Brand toolbar reads the brands from `tokens.json` instead of its own list. It shows the same three brands.
- Icons: Material Symbols are now inline SVGs instead of an icon font (ADR-0009). Icons show at once with no font to load, nothing flashes while a file loads, and a page carries only the icons it uses: the icon font (990 KB) is gone. Every icon looks the same as before: each SVG is drawn from the 5.x font's own outlines, and the test suite checks them pixel by pixel.
- Icons by name (`<Icon name="add" />`, `leftIcon="add"`) work for the **everyday icons**, about 270 of them: every icon on the Foundations/Icons page and every icon the components use. Any other Material Symbol is an import: `import { RocketLaunch } from "serupa-ds/icons"`, then `<Icon icon={RocketLaunch} />` or `leftIcon={RocketLaunch}`. Only the icons you import ship. **Migrating:** search your code for icon names outside the everyday set. The console warns about each one (`Icon: "rocket_launch" isn't an everyday icon…`). Either import those icons or register them once at startup with `registerIcons(RocketLaunch, …)`, and then their names keep working. To keep every name working with no changes, call `registerIcons(await import("serupa-ds/icons"))` (this adds about 3 MB), or on a plain page add `serupa-icons.iife.js` after `serupa.iife.js`.
- Icon's `<span>` has no text any more; its name is in `data-icon`. `translate="no"` is gone, because there's no name to protect from translation. All sizes use the 24px design scaled, where the font picked an optical size between 20 and 48.

### Removed

- `fonts/MaterialSymbolsRounded-Filled.woff2`, its `@font-face` in `tokens.css`, and the `--font-icon` token. If your own CSS used `var(--font-icon)` to write icon names as text, use `<Icon>` instead.
- Text's `--text-tone-default`, `--text-tone-muted`, `--text-tone-primary` and `--text-tone-danger`, added in 5.1.0. Text's tokens are named `--text-color`, `--text-color-muted`, `--text-color-primary` and `--text-color-danger` again, in line with the theme's color names. **Migrating:** if you set a `--text-tone-*` variable, rename it to the matching `--text-color*` one; the values are the same.

### Fixed

- Badge's remove button (×) takes its focus ring from `--badge-focus-ring`, like the rest of the badge.
- Dialog and Drawer now call `onOpenChange(false)` when the browser closes the `<dialog>` on its own (`dialog.close()`, a form with `method="dialog"`, or an Escape the browser doesn't let them cancel), so `open` no longer stays true while nothing is on screen, and the button that opened it opens it again.
- Tooltip takes the Escape that hides it, so inside a Dialog, Drawer or Menu one Escape hides only the tooltip and the next one closes the Dialog.
- Dialog, Drawer, Image and SegmentedControl set a forwarded ref through the shared helper, like the other components. Function refs and object refs both keep working.

## [5.1.0] - 2026-10-18

### Added

- Text: new names for its four component tokens, so they no longer read like the shared text tokens (`--text-muted`, `--text-xs`): `--text-tone-default`, `--text-tone-muted`, `--text-tone-primary` and `--text-tone-danger` (one per `tone`). The old names (`--text-color`, `--text-color-muted`, `--text-color-primary`, `--text-color-danger`) keep working; when both are set, the new name wins. The old names will be removed in 6.0.0.

### Changed

- `package.json` lists esbuild and fsevents under `allowScripts` as not needing their install scripts, so npm 11's "install scripts not yet covered by allowScripts" warning goes away. Both already worked without them.
- in `text.tokens.json`, `$extensions["com.serupa"].cssVar` gives the new name and the old one is in `deprecatedCssVar`, so Style Dictionary and Figma exports use the new names.
- The neutral colors in every theme (surfaces, text, borders, fields, the secondary fill and the overlay) now come from the `zinc` palette instead of `gray`, so they read as neutral rather than blue-tinted. The token names don't change; every pair still meets WCAG 2.1 AA in all six themes. If you set a color next to the system's, such as `bg-gray-100` beside a `surface-muted` panel, switch it to `zinc` to match.

### Fixed

- Docs: The AvatarGroup usage guide follows the guide template: when to use it, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The Carousel usage guide follows the guide template: when to use it, when not to (and what to use instead), usage, accessibility with its keys, props and component tokens. Existing content is kept and moved under the new headings. Every guide now follows the template.
- Dialog no longer closes when a press starts inside it and ends on the backdrop, such as when selecting text in a field and letting go outside the panel. Only a press that starts and ends on the backdrop closes it.
- Docs: Dialog's page shows the small and large sizes and a dialog with no close button as stories.
- Drawer no longer closes when a press starts inside it and ends on the backdrop, such as when selecting text in a field and letting go outside the panel. Only a press that starts and ends on the backdrop closes it.
- theme.js moves a theme chosen on 4.x (saved as `diki-theme`) to `serupa-theme` the first time it runs, so `Serupa.theme.reset()` now forgets it for good instead of the old choice coming back on the next page load.

### Security

- Cleared 4 of the 22 `npm audit` warnings (the `sprintf-js` denial-of-service advisory, reached through Changesets' YAML reader) by pointing that old YAML library at a newer `argparse`. These were all in release tooling; nothing in the installed package changed.

## [5.0.2] - 2026-10-18

### Fixed

- A toast no longer closes while keyboard focus is inside it after the mouse passes over and off it, or after switching back from another tab while it's hovered. Hover, focus and a background tab each stop its time on their own.
- Docs: Toast's page shows every tone, a toast with an action and a top-center Toaster as stories, so each is checked in all six themes.

## [5.0.1] - 2026-10-18

### Changed

- Storybook's sidebar groups the components under Components into Actions, Content, Feedback, Forms, Layout and type, Navigation and Overlays, and sorts the groups and the components in them A-Z; the docs and Foundations pages keep their order. Links to a component's page now include its group (`?path=/docs/components-forms-input--docs`), so old bookmarks to component pages land on Storybook's "not found" page.

## [5.0.0] - 2026-10-18

### Added

- React 19 support. CI type-checks, runs the component tests and server-renders every component on React 19 as well as 18. The peer dependency is now `^18.0.0 || ^19.0.0`.

### Changed

- Cleared out what was left from the artifact era. The README no longer carries the generated "Consuming this system" and index sections (the foundations moved to docs/foundations.md, which Storybook's Foundations pages read), the Cover preview page is gone, and serupa.iife.js no longer starts with the `@ds-bundle` manifest comment.
- The styles now sit in cascade layers, declared in this order at the top of every file: `dk.tokens`, `dk.base`, `dk.components`, `dk.utilities`. Your own CSS outside a layer now wins over the system's whatever order the files load in, so overrides need no `!important` or extra specificity. A page rule that used to lose to a component style on specificity now wins; check pages that style `.dk-*` elements. `@property` rules stay outside the layers.
- Components and utilities read shared tokens as `var(--token)` with no fallback value, so `tokens.css` must load (it always had to for themes). The CSS files are smaller.
- `design-tokens/` is generated by Node (`npm run tokens`), so the project no longer needs Python for its tokens. Whole numbers are written as `1` instead of `1.0`; the values are the same.
- `RadioGroup`'s `onChange` and `Slider`'s `onValueChange` and `onValueCommit` are typed instead of `any`. RadioGroup takes the value type from `value` or `onChange` (`string | number` unless you say), and Slider gives `number` for one thumb or `[number, number]` for a range. Code that relied on `any`, such as passing the value straight to a `useState<string>` setter without a typed `value`, may need a type now. `SliderValue` is exported.
- Release tags are prebuilt. Each tag points at a release commit made off `main` that carries `dist/` and a `package.json` without scripts or devDependencies, so `npm install github:diki-stwn/serupa-ds#vX.Y.Z` copies files and builds nothing.
- The system is now **Serupa**, by Diki. The package is `serupa-ds` and the repository is `diki-stwn/serupa-ds`. To update a project:

  | Before (4.x) | Now (5.0) |
  | --- | --- |
  | `npm install github:diki-stwn/design-system#v4.8.0` | `npm install github:diki-stwn/serupa-ds#v5.0.0` |
  | `import { Button } from '@diki/design-system'` and `'@diki/design-system/tokens.css'` | `import { Button } from 'serupa-ds'` and `'serupa-ds/tokens.css'` |
  | `dist/diki.iife.js`, `window.Diki` (`Diki.configure`, `Diki.theme`) | `dist/serupa.iife.js`, `window.Serupa` (`Serupa.configure`, `Serupa.theme`) |
  | `DikiConfig`, `DikiTheme` types | `SerupaConfig`, `SerupaTheme` |
  | `design-tokens/diki.tokens.json`, `$extensions["com.diki"]` | `design-tokens/serupa.tokens.json`, `$extensions["com.serupa"]` |

  Class names (`dk-*`), CSS variables, tokens and the `dk.*` cascade layers keep their names. The saved theme choice moves from `diki-theme` to `serupa-theme` in localStorage, and the old value is read once so visitors keep their theme.

### Removed

- The 23 old component token names that kept working since they were renamed (`--link-color`, `--card-border-color`, `--heading-color` and the rest in the 4.x notes). Use the new names: `--link-text`, `--card-border`, `--heading-text`.

### Fixed

- A Badge whose `count` goes from 0 to a number (or back) no longer crashes with React's "rendered more hooks" error.
- Menu, Popover and Tooltip no longer warn on React 19 when their trigger has a ref (they read it as a prop there).
- The components' own code no longer uses `any`. Props passed through to the DOM keep their real types, so the type checker catches mistakes inside the system. Nothing changes for projects; `List`'s `linkProps` is now typed `Record<string, unknown>` (any object still works).

## [4.8.1] - 2026-10-17

### Changed

- The documentation runs on Storybook 10.6 (from 8.6). Nothing in the package changes; `npm run storybook` and `npm run build-storybook` work as before. The Essentials addon is gone (its parts are now built into Storybook), and the Docs addon takes its place.

### Fixed

- Avatar falls back to initials when its picture fails to load quickly (as in Safari), instead of keeping the broken picture.
- Calendar, DatePicker and DateRangePicker start the week on the locale's day in Firefox too (Monday for de-DE, for example); Firefox has no Intl.Locale week info, so they always started on Sunday.
- Textarea with `autoResize` no longer raises "ResizeObserver loop completed with undelivered notifications" on the window when its width changes.

## [4.8.0] - 2026-10-17

### Added

- Storybook is the documentation: `npm run storybook`. A toolbar switches the brand and light or dark (the six themes), the Accessibility tab checks each story, and there's a page per component (props, every state as a story, and its guidelines) plus introduction, getting started, foundations (colors and the palette, themes and every alias, typography, spacing, radius, effects, motion, utility classes), versioning and the changelog. The pages read `tokens.json` and the guidelines, so they can't drift.
- 55 stories, one per state and variant, and a Storybook test: every page and story renders without errors, and every story passes WCAG 2.1 AA (axe) in all six themes. CI builds Storybook.
- The components install as a package: `import { Button } from '@diki/design-system'` works in Vite, Next.js, Remix and Storybook. ES modules with types (`dist/index.js`, `dist/index.d.ts`); React 18 or later is a peer dependency, so the app and the system share one React; the components render on the server (nothing touches `window` or `document` until they run in the browser, and no React warnings).
- `components.css` (the `dk-*` component styles, about 90 KB) and `utilities.css` (the utility classes), beside `bundle.css`, which is still both in one file.
- `diki.iife.js`: the browser script under its new name. `bundle.js` is the same file.
- `version` is exported from the package, as `Diki.version` is on plain pages.
- `npm run build`, `npm run typecheck`, and a Package test: every export exists, every component renders on the server, the types declare every component, and `bundle.css` is `components.css` + `utilities.css`.
- Accordion and AccordionItem components (single or multiple, collapsible, controlled, plain or card, keyboard navigation), with 15 component tokens.
- Alert component: info, success, warning, danger and neutral tones, a title, actions and a close button, with 20 component tokens.
- AvatarGroup component (avatars in an overlapping row, each in a surface ring, with `max` folding the rest into a "+N" avatar, `total` for counts beyond the avatars passed, and one `size` for all), with 7 component tokens.
- Avatar: a picture with initials or a person icon as fallback (also when the picture fails to load), five sizes, circle or square, and a status dot, with 15 component tokens. `initials(name)` is exported too.
- Breadcrumb and BreadcrumbItem components (chevron or slash separators, icons, router links, `maxItems` to collapse the middle), with 11 component tokens.
- ToggleButton component (a Button with aria-pressed; outline or ghost), with 3 component tokens.
- ButtonGroup component (attached or spaced, horizontal or vertical), with 2 component tokens.
- Card component (`Card`, `CardHeader`, `CardBody`, `CardFooter`): outline, elevated and filled variants, four paddings, and a whole-card link with `href`, with 16 component tokens.
- Carousel component (one slide at a time with previous and next buttons, a dot per slide, swipe, `loop`, controlled or uncontrolled `index`, RTL; slides not shown are inert, and it never moves on its own), with 10 component tokens.
- Combobox component (a text field with a list that narrows as you type; descriptions, clearable, loading, your own filtering for server results), with 16 component tokens.
- Calendar component (a month grid to pick a day from, with arrow, Home/End and PageUp/PageDown keys, min, max, disabled days and the locale's names and first day of the week), with 14 component tokens.
- DatePicker component (a date field people type in the locale's order or fill from a Calendar popup; a hidden yyyy-mm-dd input with `name`), with 8 component tokens.
- DateRangePicker component (start and end date fields with a two-month calendar popup; pick the start then the end, with a preview of the range), with 4 component tokens.
- Calendar tokens `--calendar-range-bg` and `--calendar-range-color` for the days inside a range.
- Dialog: a modal on the native `<dialog>` (focus kept inside and returned, page inert and not scrolling, top layer), with a title, description, footer, three sizes, Escape, × and backdrop closing, and an alert mode for confirmations, with 13 component tokens.
- Drawer component (a modal panel that slides in from the right, left, top or bottom; title, description, a pinned footer, three widths), with 15 component tokens.
- EmptyState component (icon or illustration, title, description, actions; md or sm; plain or dashed), with 17 component tokens.
- FileUpload component (a drop area and a button for choosing files, with type, size and count checks and the chosen files listed with remove buttons), with 15 component tokens, and `formatFileSize()`.
- IconButton (an icon-only Button with a required label, ghost by default, square or round) and Fab (a floating action button: round, raised and fixed to a corner, 56 or 40px, optionally extended with its label), with 1 and 9 component tokens.
- Image component (a picture in a frame with a ratio, cover or contain, rounded corners, lazy loading, a placeholder while loading and a fallback on error; `viewable` opens it full size in a Dialog and `onRemove` adds a remove button), with 8 component tokens.
- Kbd component (keyboard keys and shortcuts as keycaps; named keys like `mod`, `shift` and arrows show as symbols on Apple devices and words elsewhere), with 9 component tokens.
- Stack, Grid, Container and Divider layout components, with 11 component tokens. Stack and Grid take `gap` as a step of the spacing scale.
- Link component (inline text link; primary or neutral; external links open a new tab and say so; `as` for router links), with 8 component tokens.
- VisuallyHidden component (screen-reader-only content; `focusable` for skip links).
- List and ListItem components (plain or card, dividers, leading and trailing slots, link and button rows, selected and disabled), with 17 component tokens.
- Menu (`Menu`, `MenuItem`, `MenuGroup`, `MenuSeparator`): the WAI-ARIA menu button with arrow, Home, End, letter and Escape keys, icons, shortcuts, disabled, destructive and link items, and groups, in the top layer, with 19 component tokens.
- Navbar and NavbarLink components (brand, links, actions; sticky; folds into a menu button below 768px), with 18 component tokens.
- NumberInput component (a number field with − and + buttons, arrow keys, min, max and step; clamps and rounds on blur), with 6 component tokens.
- Pagination component (buttons or links, siblings and boundaries, md or sm) and `paginationRange()`, with 14 component tokens.
- PasswordInput component (Input with a show/hide button; controlled or not; sizes and states like Input), with 6 component tokens.
- Popover component (a non-modal dialog next to its trigger; title, placement, close() for buttons inside, controlled or not), with 15 component tokens.
- Progress component (a bar or a ring showing how far along a task is; label, value, four tones, three sizes, indeterminate), with 18 component tokens.
- SearchInput component (a search field with a clear button, Escape to clear, Enter to search, and a loading state), with 7 component tokens.
- SegmentedControl component (picks one of a few options shown side by side; a radio group with a sliding selection, icons, full width, two sizes), with 18 component tokens.
- Sidebar, SidebarSection and SidebarItem components (header and footer, sections, icons, badges, nested groups, a collapsed icon rail with tooltips), with 23 component tokens.
- Slider component (one value or a range with two thumbs; drag, press or keys; step, commit events, form inputs), with 12 component tokens.
- Stepper component (numbered steps joined by lines, horizontal or vertical; complete, current, upcoming and error states; completed steps can be clickable), with 19 component tokens.
- Releases with Changesets. Each pull request carries a short note (`npx changeset`); on `main` a Release pull request gathers them into the next version and `CHANGELOG.md`, and merging it tags the version and makes a GitHub release with the package attached.
- Projects can install a released version straight from GitHub (`npm install github:diki-stwn/design-system#v4.8.0`); the package builds itself on install.
- Table, TableHead, TableBody, TableFoot, TableRow, TableHeaderCell and TableCell components (sizes, stripes, selected rows, sortable columns, sticky header, a scrolling frame), with 17 component tokens.
- Tabs (`Tabs`, `TabList`, `Tab`, `TabPanel`): the WAI-ARIA tabs pattern with arrow, Home and End keys (right-to-left aware), automatic or manual activation, line and pill variants and two sizes, with 17 component tokens.
- Heading (h1 to h6, with the look set apart from the level) and Text (size, tone and weight, each inherited when unset, and truncate), with 8 and 4 component tokens.
- TimePicker component (a time field people type in, such as "2:30 pm" or "1430", or fill from a list every `step` minutes between `min` and `max`; values are "HH:mm"), with 14 component tokens.
- Toast: `toast()` messages in a `<Toaster>` (six positions), with tones, an action, a close button, replacing by id, auto-dismiss that pauses on hover, focus and in the background, and polite announcements, with 18 component tokens.
- consistent names for 23 component tokens, so one pattern works everywhere: a component's text color is `-text`, a part's color is `-<part>-color`, and a border color is `-border`. The old names keep working (when both are set, the new name wins) and will be removed in 5.0.0. Rename any you override:

  | Old name | New name |
  | --- | --- |
  | `--accordion-title`, `--accordion-content`, `--accordion-icon` | `--accordion-title-color`, `--accordion-content-color`, `--accordion-icon-color` |
  | `--alert-text-color` | `--alert-text` |
  | `--avatar-color` | `--avatar-text` |
  | `--card-border-color`, `--card-hover-border-color` | `--card-border`, `--card-border-hover` |
  | `--empty-state-icon`, `--empty-state-title`, `--empty-state-description` | `--empty-state-icon-color`, `--empty-state-title-color`, `--empty-state-description-color` |
  | `--file-upload-icon` | `--file-upload-icon-color` |
  | `--heading-color` | `--heading-text` |
  | `--link-color`, `--link-color-hover` | `--link-text`, `--link-text-hover` |
  | `--list-title`, `--list-description` | `--list-title-color`, `--list-description-color` |
  | `--menu-border-color`, `--menu-item-color` | `--menu-border`, `--menu-item-text` |
  | `--popover-title` | `--popover-title-color` |
  | `--search-input-icon` | `--search-input-icon-color` |
  | `--sidebar-section-title` | `--sidebar-section-title-color` |
  | `--toast-border-color` | `--toast-border` |
  | `--tooltip-color` | `--tooltip-text` |

- Tooltip: a short hint shown on hover (after a delay) and keyboard focus, in the top layer, with 12 placements that flip and stay on screen, Escape to dismiss and a hoverable body (WCAG 1.4.13), with 9 component tokens.

### Changed

- The source moved to `src/`: each component is a folder in `src/components/<Name>/` with its TypeScript source, its CSS, its component tokens, its guidelines and its preview. The types are generated from the code, so they can't drift from it. Every component behaves and looks exactly as before (all 90 screenshots and 25,561 utility classes match 4.7.0).
- The built files are in `dist/` (not committed): `bundle.css`, `bundle.js`, `base.css`, `theme.js` and React (`dist/lib/`). Package imports such as `@diki/design-system/bundle.css` keep working; only direct file paths change (`components/bundle.css` is now `dist/bundle.css`).
- The browser script is built for ES2019 browsers (all current ones) instead of being hand-written ES5.
- `tools/icons/build.py` writes custom icons into `src/icons.ts`; `npm run build` puts them in the components.
- in the token files, `$extensions["com.diki"].cssVar` now gives the new name, and the old one is in `deprecatedCssVar`. Style Dictionary and Figma exports use the new names.

### Removed

- The generated docs site (`tools/docs/`, `npm run docs` and its test): Storybook replaces it.

### Fixed

- `window.Diki`'s TypeScript type now lists every component on it (Accordion, ButtonGroup, Drawer, EmptyState, List, Navbar, Pagination, PasswordInput, Popover, Sidebar, ToggleButton and their parts were missing).
- Docs: The usage guides for Button, IconButton, Fab, ButtonGroup, ToggleButton, Link now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The usage guides for Card, Table, List, Accordion, Avatar, Image, Icon, Kbd, Stack, Grid, Container, Divider, Heading, Text, VisuallyHidden now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The usage guides for Alert, Toast, Loader, Progress, Badge, EmptyState now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The usage guides for Field, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The usage guides for NumberInput, PasswordInput, SearchInput, SegmentedControl, DatePicker, DateRangePicker, TimePicker, Calendar, FileUpload now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The usage guides for Dialog, Drawer, Popover, Tooltip, Menu, Navbar, Sidebar, Tabs, Breadcrumb, Pagination, Stepper now follow the guide template: when to use each one, when not to (and what to use instead), usage, accessibility, props and component tokens. Existing content is kept and moved under the new headings.
- Docs: The README now opens with what the system is, how to install a pinned version from GitHub, how to pick a theme and what to do before shipping, and lists every component by group. The Getting started page adds the install, update and before-you-ship steps.
- Docs: One outline for every component's usage guide (`docs/usage-guide-template.md`): When to use, When not to use, Usage, Accessibility, Props and Component tokens. A new test (`tools/test/guides.mjs`) checks the headings; guides still in the old outline are listed in it and move over in the next docs releases.
- TimePicker keeps typed text on Enter while the list is open (the highlight follows the typing), the clock button no longer blurs the field, the list is at least as wide as the field, steps count from `min` like `<input type="time">`, a step under one minute falls back to 30, and a new `locale` or `hour12` rewrites the field.
- `tokens.css` is now generated from `tokens.json` in the repository (`npm run tokens`, also run by `npm run build`) instead of by the frozen design system page, so token changes can pass CI again. The file's contents are unchanged.

## [4.7.0] - 2026-10-16

### Added

- Switch component: an on/off setting that applies at once, a native checkbox with `role="switch"` drawn as a track and thumb. Sizes `sm`, `md` and `lg` (28×16, 36×20 and 44×24 tracks on the label's first line), a `description`, `labelPosition` `end` or `start`, `invalid` and disabled. The thumb slides in 150ms (not with reduced motion), follows the text direction and uses system colors in forced-colors mode. 21 component tokens (`--switch-*`), its own docs page and `tools/test/switch.mjs`.

## [4.6.0] - 2026-10-16

### Added

- Radio and RadioGroup components: native radios with labels, in a `RadioGroup` (`role="radiogroup"`) that gives them a name, holds `value` or `defaultValue`, calls `onChange(value, event)`, lays them out `vertical` or `horizontal`, and passes `size`, `invalid`, `disabled` and `required` down. Sizes `sm`, `md` and `lg` (14, 16 and 20px circles on the label's first line) and a `description`. Arrow keys move the choice natively; Field group labels it and sets `invalid` from its error. 21 component tokens (`--radio-*`), its own docs page and `tools/test/radio.mjs`.

### Changed

- Field's preview and docs show a group of radios.

## [4.5.0] - 2026-10-16

### Added

- Checkbox component: a native checkbox and its label, with sizes `sm`, `md` and `lg` (14, 16 and 20px boxes on the label's first line), a `description` linked with `aria-describedby`, `indeterminate` (a dash, announced as mixed), `invalid` and disabled (also inside a disabled `Field group`). The whole label toggles it. 20 component tokens (`--checkbox-*`), its own docs page and `tools/test/checkbox.mjs`.

## [4.4.0] - 2026-10-16

### Added

- Select component: a native `<select>` styled like Input, with sizes `sm`, `md` and `lg` at the control heights, a chevron, an optional `leftIcon`, a `placeholder` (an empty first option in the placeholder color until something is picked), `options` as strings, `{ value, label, disabled }` or groups (or `<option>` children), and focus, `invalid` and disabled states. It keeps the browser's picker, keyboard and screen-reader support. `multiple` isn't supported and is ignored with a warning. 20 component tokens (`--select-*`), its own docs page and `tools/test/select.mjs`.

## [4.3.0] - 2026-10-16

### Added

- Field component: a label, an optional `hint` and an `error` message around one form control, wired up for screen readers. It links the label to the control (its own `id` or a generated one), adds the hint and error to the control's `aria-describedby`, makes it invalid with an error, marks `required` (a hidden `*` and `aria-required`) or `optional`, and passes `disabled`. `group` renders a `<fieldset>` and `<legend>` for a set of choices. 8 component tokens (`--field-*`), its own docs page and `tools/test/field.mjs`.

## [4.2.0] - 2026-10-16

### Added

- Textarea component: a multi-line text field, Input's sibling (a native `<textarea>` in a box). Sizes `sm`, `md` and `lg` with Input's text sizes and side padding; `rows` (default 3); a vertical resize handle, or `resize="none"`; `autoResize`, which grows with the text from `rows` up to `maxRows` and then scrolls; `showCount`, a character count under the text ("32 / 280" with `maxLength`, linked by `aria-describedby`); focus, `invalid`, read-only and disabled like Input. 16 component tokens (`--textarea-*`), its own docs page and `tools/test/textarea.mjs`.

## [4.1.1] - 2026-10-11

### Fixed

- Docs: the Button page's hand-written loading spinners (the playground and the loading demo) were missing the Loader's inner wrapper, so the ring only grew and shrank without turning and looked laggy. The Button component itself was never affected. The docs test now checks that every ring on the docs pages turns.

## [4.1.0] - 2026-10-11

### Added

- Input component: a single-line text field (a native `<input>` in a box) with sizes `sm`, `md` and `lg` at the control heights (24, 32, 44px, like Button), optional `leftIcon` and `rightIcon`, a focus ring, and `invalid`, read-only and disabled states. Field colors come from the `field`, `field-border` and `placeholder` aliases. 19 component tokens (`--input-*`), its own docs page and `tools/test/input.mjs`.

## [4.0.0] - 2026-10-10

### Removed

- **Badge sizes.** Badges now come in one size: 20px tall, `text-xs`, 12px icons (the old `sm`). The `size` prop is gone: it's ignored, with a console warning, and never reaches the DOM. Badges that used the old default (`md`, 24px, `text-sm`, 14px icons) are now smaller. The indicator dot is 8px.
  - Component tokens renamed: `--badge-height-sm` / `-md` → `--badge-height`; `--badge-icon-size-sm` / `-md` → `--badge-icon-size`; `--badge-padding-x-sm` / `-md` → `--badge-padding-x`; `--badge-indicator-size-sm` / `-md` → `--badge-indicator-size`.
  - The `dk-badge--size-sm` / `dk-badge--size-md` classes and the `data-size` attribute are gone.
  - To migrate: remove `size` from your badges. To keep the old 24px look somewhere, set `--badge-height: var(--spacing-6)`, `--badge-padding-x: var(--spacing-2)` and `--badge-icon-size: var(--spacing-3\.5)` on a container, plus `text-sm` for the type.
- **Loader `tone="current"`**, deprecated in 3.8.0, is removed as announced. It now falls back to `neutral` (the same look) like any unknown tone, without the warning. Use `tone="neutral"`.

### Changed

- Badge's remove × keeps a 24×24 target (the WCAG 2.2 minimum, as on a small Button): its hit area reaches 2px past the badge's top and bottom, and its focus ring goes round all of it.

## [3.17.0] - 2026-10-10

### Added

- Badge `ping` (off by default): with `dot`, in a label or as the indicator, the dot pings with the system's `ping` animation (the `--animate-ping` token behind `animate-ping`): a copy grows to twice its size and fades every second, for live states. Off under reduced motion and in forced-colors mode.

## [3.16.1] - 2026-10-10

### Changed

- Badge: the status dot's box is 2px narrower than an icon box, 12×14px at md and 10×12px at sm (was 14×14 and 12×12), so the dot gets a little less room than an icon. Dot badges are 2px narrower.

## [3.16.0] - 2026-10-10

### Added

- Badge indicator: `<Badge dot />` with no label, icon or count renders a lone dot for "something new" without a number, on the corner of an icon or avatar. A solid circle in the tone (10px md, 8px sm) with a 2px ring in the surface color; decorative unless given `aria-label`; not clickable or removable. New component tokens `--badge-indicator-size-sm`, `--badge-indicator-size-md` and `--badge-indicator-ring`.

## [3.15.1] - 2026-10-10

### Changed

- Badge: the status dot sits centered in an icon-sized box (14px at md, 12px at sm), so it takes the same space as a leading icon and dot badges line up with icon badges. Dot badges are 8px (md) or 6px (sm) wider.

## [3.15.0] - 2026-10-10

### Changed

- Badge: optical balance like Button's. With an icon on one side only, the text side gets 2px more padding: a leading icon or dot pads the end, a remove × pads the start; icons on both sides, or none, stay even. New component token `--badge-icon-offset` (`spacing-0.5`); right-to-left mirrors it.

## [3.14.3] - 2026-10-10

### Fixed

- Badge: the remove × now mirrors a leading icon, so a badge with an icon, a label and a × is balanced (about 11 / 6 / 6 / 11px of visible space at md, 9 / 6 / 6 / 9 at sm; before, the × side was looser). The × sits in an icon-sized box with the badge's gap and end padding, nudged 2px in to make up for the glyph's built-in space; the button keeps a 24×24 target and its focus ring goes round all of it. Removable badges are 2px narrower.

## [3.14.2] - 2026-10-10

### Fixed

- Badge: the remove × sat too far from the label (about 14px, versus 10px at the badge's start). The × button now sits right against the label and the badge's end, so the × is about 10px from both at md, matching the start; removable badges are 6px narrower. The button keeps its 24×24 target.

## [3.14.1] - 2026-10-10

### Fixed

- Docs: the Badge page shows the disabled state (in States, the props table and a playground toggle); before, it was only in the Badge README.

## [3.14.0] - 2026-10-10

### Added

- Badge micro-interactions, the same as Button's: clickable badges shrink to 97% while held (pointer, Space or Enter) and ripple from the press point in the text color; loading cross-fades the content into a ring that grows in. New component tokens `--badge-press-scale`, `--badge-press-duration`, `--badge-ripple-opacity`, `--badge-ripple-duration`, `--badge-ripple-fade-duration` and `--badge-loading-duration`; reduced motion turns press and ripple off.

## [3.13.0] - 2026-10-10

### Added

- Badge states. With `onClick` a badge renders a `<button>`, and with `href` a link (through `Diki.configure`), with hover (a 10% layer), active (15%) and focus (the 2px focus ring) states; the layer always moves away from the text, so every tone and style keeps 4.5:1. `loading` (any badge) puts a ring over the hidden content, keeps the width, sets `aria-busy`, announces `loadingText` and, on a clickable badge, blocks clicks while keeping focus. `disabled` works on clickable badges. New component tokens `--badge-hover-layer`, `--badge-active-layer`, `--badge-state-text` and `--badge-focus-ring`.

## [3.12.0] - 2026-10-10

### Changed

- Badge: the subtle style has a 1px outline in its text color at 20%, so it follows every tone and theme. New component token `--badge-subtle-border` (`opacity-20`); set it to `0%` for the previous borderless look.

## [3.11.0] - 2026-10-10

### Added

- **Badge** component: a short label for status, counts and categories. Styles `subtle` (default), `solid` and `outline`; tones `neutral` and `primary` (alias colors), `success` (green), `warning` (amber), `danger` (red), `info` (sky) and the 17 chromatic palette families for categories and tags. Palette and status tones use fixed steps per style (light: 100 fill and 700 text, 600 or 700 solid with white, 700 outline; dark: 950 fill and 300 text, 400 solid with 950, 300 outline on a 400 border), each keeping 4.5:1 text in all six themes and following the nearest theme. Sizes `sm` (20px) and `md` (24px). Extras: a status `dot`, a `leftIcon`, a `count` (a round pill, with `max` and `showZero`) and `onRemove` (a real × button named "Remove" + the label). Component tokens in `components/Badge/badge.tokens.json`.
- Docs site: a Badge page with a playground, all tones and styles, the extras, props, accessibility notes and component tokens.
- Tests: `tools/test/badge.mjs`, including contrast for all 69 tone and style combinations in every theme.

## [3.10.0] - 2026-10-10

### Changed

- Button `variant="secondary"` is now an outline in the brand color: `primary` border and text on `surface`, with a `primary-subtle` tint on hover as the text and border darken to `primary-hover` (was a solid `secondary` gray fill with `text`). Destructive secondary matches: a solid `danger` border with `danger-text` on `surface` and a `danger-subtle` tint on hover (was a `danger-subtle` fill). Component tokens: `--button-secondary-bg`, `-bg-hover` and `-text` take new defaults; new `--button-secondary-text-hover`, `--button-secondary-border`, `--button-secondary-border-hover` and `--button-destructive-secondary-border`.
- The contrast audit checks the new pairs: `primary` text on `surface` (4.5:1), `primary-hover` on `primary-subtle` (4.5:1) and the `danger` border on `surface` (3:1), in all six themes.

## [3.9.1] - 2026-10-10

### Changed

- Loader `variant="spokes"`: closer to iOS proportions. Spokes are thicker and shorter, about 10% of the loader's size wide (was 8%) and 25% long (was 27%), round a larger empty middle, about 40% across (was 33%). `--loader-spokes-width` now defaults to `stroke-width-4` in a drawing at 5/8 scale (2.5 of the 24 units).

## [3.9.0] - 2026-10-10

### Added

- Loader `variant="spokes"`, like the current iOS activity indicator: eight rounded spokes round a circle, the lead one at full strength and the rest fading behind it to 25%, ticking a spoke at a time (45°, every 125ms: a turn a second). Same sizes, tones and delay as the ring; half speed under reduced motion. Component tokens `--loader-spokes-width` (`stroke-width-2`) and `--loader-spokes-duration` (`duration-1000`).
- Docs site: spokes in the Loader playground, demos and props.

## [3.8.0] - 2026-10-10

### Changed

- Loader: the default tone is now called `neutral` (was `current`). It looks the same: the text color around it. The docs, playground and types use the new name.

### Deprecated

- Loader `tone="current"`: use `tone="neutral"`. It still works, the same as `neutral`, with a console warning, and will be removed in 4.0.0.

## [3.7.2] - 2026-10-10

### Changed

- Pixel loader `pattern="random"`: calmer, with each square's clock now 1.5s to 2.2s (was 1.2s to 1.9s), so it reads as thinking rather than flicker. Under reduced motion its squares share a 4s clock and keep their scattered starts.

## [3.7.1] - 2026-10-10

### Changed

- Pixel loader loop lengths per pattern: `snake` and `spiral` now loop in 1.5s and `cross` and `checker` in 1s (all were 1.2s). `wave`, `sweep`, `fall` and `rise` stay at 1.2s (`--loader-pixel-duration`). Under reduced motion each runs at half speed (3s, 2s, 2.4s).

## [3.7.0] - 2026-10-10

### Added

- Token `duration-1200` (1200ms) and its `duration-1200` class, for long decorative loops.

### Changed

- Pixel loader: one loop now takes 1.2s in every pattern (was 1s): `--loader-pixel-duration` now defaults to `duration-1200`. Steps stay 75ms apart; `random`'s clocks run 1.2s to 1.9s; under reduced motion every pattern runs at half speed (2.4s).

## [3.6.0] - 2026-10-10

### Changed

- Pixel loader: one loop now takes 1s in every pattern (was 1.5s to 2.4s), set by the new component token `--loader-pixel-duration` (`duration-1000`). Steps are 75ms apart (`--loader-pixel-stagger`, now `delay-75`, was `delay-100`); `cross` and `checker` light their second group half a loop later; `random`'s clocks run 1s to 1.7s. The rise and fade keep the wave's smooth curve. Under reduced motion every pattern runs at half speed (2s, was 3s).

## [3.5.1] - 2026-10-10

### Changed

- Pixel loader patterns `random`, `sweep`, `fall`, `rise`, `snake`, `spiral`, `cross` and `checker` now move as smoothly as `wave`: each square rises, holds and fades with the wave's curve (30% of its cycle to rise, 30% to fade, `ease-in-out`), not the quick snap of before. `random`'s clocks are longer to match (1.5s to 2.4s, were 1s to 1.9s). Orders and cycle lengths are unchanged otherwise.

## [3.5.0] - 2026-10-10

### Added

- Seven more pixel loader patterns: `sweep` (columns, left to right), `fall` (rows, top to bottom), `rise` (rows, bottom to top), `snake` (square by square, left to right then back), `spiral` (clockwise round the edge, then the center), `cross` (the corners, then the plus) and `checker` (the X, then the edges). Each fills the grid and empties it in the same order (`ease-in-out`, steps of `--loader-pixel-stagger`), and slows to 3s under reduced motion.
- Loader `glow` prop (pixel only): a soft halo of the loader's color round the lit squares, off by default. Its size is the new component token `--loader-pixel-glow-size` (`spacing-0.5`, 2px). Setting `--loader-pixel-glow` yourself still works.
- Docs site: a Pixel patterns gallery and table, all nine patterns and a glow toggle in the Loader playground.

### Changed

- Under reduced motion every pixel pattern now slows to 3s (the wave and random did already).

## [3.4.0] - 2026-10-10

### Added

- Loader `pattern="random"` for `variant="pixel"`: the squares light up at random instead of in a diagonal wave. Each twinkles on its own clock (1s to 1.9s, sums of the duration tokens, starting 0 to 1s in), so they drift apart and the grid shows an ever-changing order with no visible loop. Same dim, divider, tone and glow as the wave; under reduced motion each square slows to 3s. `pattern="wave"` stays the default.
- Docs site: a pattern control in the Loader playground (for pixel), a random demo and the prop in the table.

## [3.3.2] - 2026-10-10

### Changed

- Loader `variant="pixel"`: lighter, thinner dividers. They're now hairlines, half a unit of the 24-unit grid (0.5px at 24px, was 1px), at 10% of the loader's color (`--loader-pixel-divider`, was `opacity-30`). They still look the same next to lit and dim squares.

## [3.3.1] - 2026-10-10

### Changed

- Loader `variant="pixel"`: the dividers now look the same whether the squares beside them are lit or dim. They're cut out of the squares and drawn in the loader's color at a fixed strength, `--loader-pixel-divider` (now `opacity-30`, was a 50% cut that faded with the squares).

## [3.3.0] - 2026-10-10

### Changed

- Loader `variant="pixel"`: the squares are now square pixels, edge to edge with no rounded corners and no gaps, split by subtle dividers (1 unit of the 24-unit drawing, letting half of the background through). New component tokens `--loader-pixel-divider` (`opacity-50`; 0 hides the dividers) and `--loader-pixel-divider-width` (`stroke-width-1`).

## [3.2.0] - 2026-10-10

### Added

- Loader `variant="pixel"`: a 3×3 grid of rounded squares in one color (the loader's tone) with a wave of light running along the diagonals from the top-left corner: each square rises from 15% to full and fades again, 100ms after the diagonal before it, every 1.5s with `ease-in-out`. Sizes 16, 24 and 40px like the ring; `primary`, `muted` and `inverse` tones. Opacity only, so it keeps running under reduced motion, at half speed.
- Loader component tokens `--loader-pixel-dim` (`opacity-15`), `--loader-pixel-stagger` (`delay-100`) and `--loader-pixel-glow` (`spacing-0`: off; a small spacing step adds a soft halo of the same color, for dark surfaces).
- Docs site: pixel in the Loader playground, demos and props.

## [3.1.0] - 2026-10-10

### Changed

- The neutral aliases in all six themes now use `gray` instead of `slate`, the same steps as before: `secondary`, `secondary-hover`, `surface` (dark), `surface-muted`, `surface-inverse`, `text`, `text-muted`, `text-inverse`, `border`, `border-strong`, `field` (dark), `field-border`, `field-border-hover` and `placeholder`. `overlay` is now `gray-900` at 50% (light) and `gray-950` at 70% (dark). Every contrast pair still passes. The `slate` palette is unchanged and still available.

## [3.0.0] - 2026-10-10

### Changed (breaking)

- Spinner is now **Loader**, as it covers more than spinners. Everything named after it moved; nothing else about the ring, dots or text changed.

  | Before (2.x) | Now (3.0.0) |
  | --- | --- |
  | `<Spinner>`, `Diki.Spinner` | `<Loader>`, `Diki.Loader` |
  | `SpinnerProps`, `SpinnerVariant`, `SpinnerTone` (TypeScript) | `LoaderProps`, `LoaderVariant`, `LoaderTone` |
  | `--spinner-*` component tokens | `--loader-*` (same names after the prefix) |
  | `dk-spinner`, `dk-spinner--*`, `dk-spinner__*` classes | `dk-loader`, `dk-loader--*`, `dk-loader__*` |
  | `data-component="spinner"` | `data-component="loader"` |
  | `components/Spinner/`, `design-tokens/components/spinner.tokens.json` | `components/Loader/`, `design-tokens/components/loader.tokens.json` |
  | `showLabel` (deprecated in 2.8.0) | removed: use `variant="text"`, or a Text loader beside a decorative ring |

  To upgrade, rename `Spinner` to `Loader` and `--spinner-` to `--loader-` in your code. Button's `loading` already uses the Loader; its `dk-btn__spinner` class keeps its name.

### Added

- Loader `variant="skeleton"`: gray placeholder shapes where the content will be, so nothing jumps when it arrives. `shape="text"` (default) draws `lines` (1 to 20) as tall as the size's text line, the last of several 60% wide; `"circle"` is an avatar at the loader's size; `"rect"` is an image or card, full width and 96px tall. Set other sizes with `className` (`size-12`, `h-40`, `w-48 h-32`). The fill is the text color at 10%, with a lighter band sweeping through it every 2s (`ease-in-out`, like the text variant); a still fill under reduced motion. Lines and rects shrink beside an avatar in a row. While it waits out the delay its shapes keep their space.
- Loader component tokens `--loader-skeleton-fill` (`opacity-10`), `--loader-skeleton-shine` (`opacity-5`), `--loader-skeleton-rect-height` (`spacing-24`), `--loader-skeleton-radius` (`rounded-md`) and `--loader-skeleton-text-radius` (`rounded-sm`).
- Docs site: the Loader page (was Spinner) with skeleton demos, and `shape` and `lines` in the playground. The old `spinner.html` link takes you there.

## [2.8.3] - 2026-10-10

### Changed

- Spinner text variant: the shine now uses `ease-in-out` (was `ease-in` in 2.8.1), easing in at the start of the words and out at the end. Same 2s cycle.

## [2.8.2] - 2026-10-10

### Added

- Docs site: a Spinner playground, like Button's. Pick the variant, size, tone, delay and label, see it live in the sidebar's theme (on a dark stage for `inverse`), copy the code, and press Replay to watch the show-after delay. Notes explain decorative spinners and why the text variant keeps the text color. The docs test drives it.

## [2.8.1] - 2026-10-10

### Changed

- Spinner text variant: the shine now uses `ease-in` instead of `linear`, so it starts slow and speeds through the words. Same 2s cycle.

## [2.8.0] - 2026-10-10

### Added

- Spinner `variant="text"`: a loader made of words, the label with a shine sweeping through it every 2s. It rests at 65% of the text color (4.5:1 on `surface` in every theme), stays in the text color (only `inverse` changes it), sizes with the type scale (`text-xs`, `text-sm`, `text-base`), is named and announced by its label, and is plain text under reduced motion.

### Deprecated

- Spinner `showLabel`: use `variant="text"` instead. It still writes the label beside a ring or dots, with a console warning, and will be removed in 3.0.0.

## [2.7.0] - 2026-10-10

### Added

- Spinner `showLabel` (off by default): writes the label beside the spinner, with a shine sweeping through the words every 2s. The words rest at 65% of the text color (`--spinner-label-dim`, `opacity-65`), which keeps 4.5:1 on `surface` in every theme; the visible text is hidden from screen readers, which already hear it as the spinner's name; plain text under reduced motion. The label follows the spinner's size.
- Spinner `tone="inverse"`: a white ring or dots and label in every theme, for dark scrims, overlays and media (`--spinner-inverse`, `white`).
- Tests for both, including the label's contrast in all six themes.

### Changed

- Spinner tones `primary` and `muted` now color the ring or dots only, so a visible label stays in the text color around it. A spinner without a label looks the same as before. Its markup gains an inner `.dk-spinner__art` element around the drawing.

## [2.6.0] - 2026-10-10

### Changed

- The Spinner's ring is livelier: while it turns (now 2s a turn), its arc stretches from a dot to most of the ring and shrinks again every 1.5s, its tail chasing its head, so each stretch starts somewhere new. Colors, sizes and tokens are unchanged. Under reduced motion the arc stays a steady quarter and turns at `animate-spin-reduced` (3s). Button's loading spinner follows.

## [2.5.0] - 2026-10-10

### Added

- `Spinner` component: shows that something is loading when progress is unknown. Two variants, `ring` (an arc turning on a faint track) and `dots` (three pulsing dots); sizes `sm` 16px, `md` 24px, `lg` 40px; `tone` `current` (the text color), `primary` or `muted`. It waits `delay` ms (300) before showing, so fast requests don't flash it, keeping its space meanwhile; then it is a `role="progressbar"` named by `label` ("Loading") and announced once through the shared status region. `label=""` makes it decorative. Ring turns with `animate-spin`; under reduced motion it turns slower and the dots only fade.
- Spinner component tokens (`components/Spinner/spinner.tokens.json`, also in `design-tokens/components/`): colors, sizes, ring thickness, track and dot strength, dot timing.
- Docs site: a Spinner page with every variant, size and tone, a live demo of the show-after delay, props, accessibility and tokens.
- Tests: `tools/test/spinner.mjs`, and a Button test that unmounts Buttons and Spinners.

### Changed

- Button's loading spinner is now the Spinner ring (decorative, at the button's icon size) instead of the `progress_activity` icon, so there's one spinner across the system.

### Fixed

- Removing a Button from the page (unmounting it) threw an error in React: an effect returned the shared status region instead of a cleanup function. Buttons and Spinners now unmount cleanly.

## [2.4.0] - 2026-10-10

### Changed

- Button's icon nudge is off by default: a right icon no longer slides on hover unless you turn it on with `--button-icon-nudge: var(--spacing-0\.5)` (2px), on the page, a container or one button. It suits forward arrows, but every right icon moved, including chevrons and "open in new" icons. The token's default is now `spacing-0`.

## [2.3.3] - 2026-10-10

### Added

- Docs site: a Changelog page (under Start) built from `CHANGELOG.md`, with a link to each release. It shows released versions only; changes waiting for the next release stay under Unreleased in `CHANGELOG.md`.

### Fixed

- Docs site: the Button playground and the hand-written demo buttons had no ripple, because they're plain HTML without the ripple layer the Button component renders. They now get it, and the docs test presses them to check.

## [2.3.2] - 2026-10-10

### Fixed

- Button's ripple still didn't show on a normal click: a click lasts about a tenth of a second, so the ripple started fading while it was a small circle under the mouse pointer. It now always spreads across the whole button before it fades, over `duration-500` (was 700ms in 2.3.1), so every click shows the full wave.

## [2.3.1] - 2026-10-10

### Fixed

- Button's ripple was hard to see: on a button-sized area it spread almost instantly (front-loaded `ease-out` over 500ms) at 15%, so a click read as a brief flash rather than a ripple. It now spreads evenly (`ease-in-out`) over `duration-700` at `opacity-20`, so the wave from the press point is visible on a normal click. `--button-ripple-opacity` and `--button-ripple-duration` default to the new values.

## [2.3.0] - 2026-10-10

### Added

- Button micro-interactions: press feedback (shrinks to 97% while held by pointer, Space or Enter), a ripple from the press point in the text color, a 2px nudge of a right icon on hover (mirrored in right-to-left text), and a cross-fade between the content and the loading spinner. They move only `scale`, `translate` and `opacity`, skip disabled, loading and `link`-variant buttons, and turn off under reduced motion (loading keeps its fade).
- Eight motion component tokens to tune or turn them off: `--button-press-scale`, `--button-press-duration`, `--button-icon-nudge`, `--button-icon-nudge-duration`, `--button-loading-duration`, `--button-ripple-opacity`, `--button-ripple-duration`, `--button-ripple-fade-duration`.
- Token `scale-97` (pressed buttons and small controls) with its utility classes (`scale-97`, `scale-x-97`, `scale-y-97`, `scale-z-97` and negatives): 25,560 classes.
- Tests: `tools/test/button-motion.mjs` (38 checks).

### Changed

- Button transitions name the properties it changes (background, text and border color, text decoration, the focus ring, and scale) instead of the whole `transition-colors` set, so the press can run at its own speed. Nothing changes visually.
- `scale-95` is now described for pressed cards and large surfaces; buttons use `scale-97`.

## [2.2.0] - 2026-10-10

### Added

- Custom icons: draw your own SVGs on the 24×24 grid, put them in `assets/Icons/` and run `python3 tools/icons/build.py`. `<Icon name="…">` and Button's `leftIcon`, `rightIcon` and `icon` take their names, with the same sizes, colors, alignment and accessibility as Material Symbols. The build keeps only shapes in `currentColor` and refuses anything unsafe or off-system with the reason.
- `Diki.customIcons` lists the custom icons; TypeScript gets `CustomIconName` and `IconName`, so custom names autocomplete.
- Tests: `tools/test/icons.py` (the build) and `tools/test/icons.mjs` (custom icons in Icon and Button).

## [2.1.0] - 2026-10-10

### Added

- Button component tokens: 44 `--button-*` tokens for its colors, spacing, sizes and borders (`components/Button/button.tokens.json`). Each is an optional override, set on the page, a container or one button; unset, Button looks exactly as before. Also in the W3C Design Tokens files as `design-tokens/components/button.tokens.json`.
- Tests: every component token refers to a shared token, the CSS uses exactly the defaults in the tokens file, and overrides and nested themes work.

## [2.0.0] - 2026-10-10

Button's API is now the system's own: the names that came from shadcn/ui and Radix are gone.

### Added

- `<Button href="…">` renders a link (`<a>`) that looks like a button, for navigation. With `target="_blank"` it adds `rel="noopener noreferrer"`. A disabled link Button renders without `href` (with `role="link"` and `aria-disabled`), so it can't be focused or followed and isn't listed as a link.
- `Diki.configure({ link })` registers a router's link component (Next.js `Link`, React Router `Link`…) for every Button with `href`.
- TypeScript: a Button with `href` takes link attributes, one without takes button attributes; mixing them (a link with `type="submit"`) is a type error.

### Changed

- Variant `default` is now `primary`, and size `default` is now `md`. Their classes are `dk-btn--primary` and `dk-btn--size-md`.
- `buttonVariants()` is now `buttonClass()`.
- The `data-slot="button"` attribute is now `data-component="button"`.

### Removed

- `asChild`: use `href` for links, or `buttonClass()` to style any other element as a button.
- The names deprecated in 1.0.0: `window.TailwindPalette` (use `window.Diki`), `variant="destructive"` (use `destructive`), `size="icon"` (use `icon`).

### Upgrading from 1.x

| 1.x | 2.0 |
| --- | --- |
| `<Button asChild><a href="/x">Go</a></Button>` | `<Button href="/x">Go</Button>` |
| `<Button asChild><Link to="/x">Go</Link></Button>` | `Diki.configure({ link: … })` once, then `<Button href="/x">Go</Button>` |
| `<Button>` (variant `default`) | unchanged: `primary` is the default |
| `variant="default"` | `variant="primary"` |
| `size="default"` | `size="md"`, or leave it out |
| `buttonVariants({ … })` | `buttonClass({ … })` |
| `[data-slot="button"]` | `[data-component="button"]` |
| `.dk-btn--default`, `.dk-btn--size-default` | `.dk-btn--primary`, `.dk-btn--size-md` |
| `window.TailwindPalette` | `window.Diki` |
| `variant="destructive"` / `size="icon"` | `destructive` / `icon="…"` |

## [1.0.0] - 2026-10-10

The first versioned release. It collects everything built before versioning started; the "Changed" and "Deprecated" sections list what differs from the earlier unversioned builds, for anyone who used them.

### Added

- **Color.** 22 palette families with 11 shades each (`50`–`950`) plus `white` and `black`: 244 colors. 33 role-based alias colors (`primary`, `surface`, `text`, `border`, `focus-ring`, status colors, `field`, `field-border`, `field-border-hover`, `placeholder`, `overlay`…) in six themes: Blue, Violet and Emerald, each light and dark. Contrast checked for 21 text, control and focus pairs in every theme (WCAG 2.2).
- **Tokens.** Spacing (35 steps on a 4px grid), radius, shadows, borders and outlines, typography (families, weights, tracking, leading), font sizes with line heights (`fontSize`), type styles (`type-xs` … `type-9xl`), transitions (durations, delays, easings, transition properties, animations, `animate-spin-reduced`), layout (breakpoints, numbered and named z-index layers, aspect ratios, column widths), sizing (containers, fractions, viewport units, `control-height-sm/md/lg`), flexbox and grid, filters, transforms and opacity.
- **Utility classes.** 25,552 classes in `components/bundle.css`, every value read from its token. Responsive versions (`sm:` `md:` `lg:` `xl:` `2xl:`) of the 524 classes that shape a layout.
- **Components.** `Button` (five variants plus `destructive`, three sizes, left, right and icon-only icons, `loading` with a centered spinner and a screen-reader announcement, `asChild`, `type="button"` by default, data attributes for tests) and `Icon` (Material Symbols Rounded, filled, the font's own optical sizing), with TypeScript types in `components/index.d.ts`.
- **Pages.** `components/base.css` (optional page defaults from tokens), `components/theme.js` (automatic dark mode that follows the system setting and remembers a visitor's choice; `Diki.theme`).
- **Self-contained.** Inter, Material Symbols Rounded and React 18.3.1 ship with the system; nothing loads from another server. Licenses in `licenses/`, credits in the README.
- **Design tokens export.** `design-tokens/` holds the tokens in the W3C Design Tokens format (2025.10) for design tools and token pipelines, kept in step with `tokens.json` by the tests.
- **Tools.** `tools/test/` (foundation audit, all utility classes against a baseline, Button behaviour, visual snapshots, page groundwork, docs site, cross-browser comparison through WebDriver for Safari, Firefox and WebKit), `tools/docs/` (documentation site generator), `tools/purge.py` (trims `bundle.css` to the classes a product uses), `tools/tokens/export.py`, `tools/release.py`.

### Changed

- The namespace is `window.Diki` (was `window.TailwindPalette`), and component classes and internal variables use the `dk-` prefix (were `tw-`).
- Type styles are named `type-*` (were `text-*`), so the classes `tokens.css` generates never clash with the `text-*` utilities.
- Motion tokens are one `transitions` group (were `duration`, `easing`, `transitionProperty` and `animation`).
- Shadow names follow the current scale: `shadow-2xs`, `shadow-xs`, `shadow-sm`…; `shadow` and `shadow-inner` still work.
- Numbered z-index steps (`z-0` … `z-50`) are for local stacking inside a component; page layers use the named layers (`z-sticky` … `z-tooltip`).
- `border-strong` is for emphasised dividers; form fields use `field-border`, which meets the 3:1 a control's boundary needs.

### Deprecated

These still work and will be removed in 2.0.0:

- `window.TailwindPalette`: use `window.Diki`.
- `<Button variant="destructive">`: use `<Button destructive>`.
- `<Button size="icon">`: use `<Button icon="…" aria-label="…">`.
