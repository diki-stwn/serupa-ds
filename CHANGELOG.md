# Changelog

Every change to Serupa (called the Diki Design System up to 4.8.1), newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html); the README's Versioning section says what counts as a breaking change.

## [Unreleased]

## [8.1.0] - 2026-10-24

### Added

- Calendar (and the DatePicker and DateRangePicker calendars): a day held down fills with `pressed`, one step past its hover, so a click shows before it selects. New token `--calendar-day-bg-pressed`.
- Two more theme axes (ADR-0011). `data-contrast="more"` gives 7:1 text, including muted text and placeholders, and stronger borders and field outlines in every theme; it also applies when the system asks for more contrast (`prefers-contrast: more`) unless the page sets `data-contrast="normal"`. `data-density="compact"` makes `md` controls 28px and `lg` 36px (`sm` stays 24px); `data-density="comfortable"` restores the defaults for a section. In `tokens.json`, seven alias colors gain a `contrastMore` pair and the three `control-height` tokens a `compact` value; no token is renamed or removed. `tokens.css` now also sets `color-scheme` for `data-theme`, as `base.css` already did.
- Elevation tokens `surface-raised`, `surface-overlay`, `border-raised` and `border-overlay`. In light themes they match `surface` (and `border` for the overlay edge). In dark themes the surfaces step up to zinc-900 and the edges to zinc-800 and zinc-700, because a shadow doesn't show on zinc-950.
- Docs: an Accessibility foundation page. It names the target, WCAG 2.2 AA, and splits the work: what the components guarantee (contrast, keyboard, focus, names and states, announcements, target size, reflow, motion, forced colors and RTL, dragging alternatives) and what the app must do (page language, title and landmarks, headings, names, errors, color, focus after route changes, media and timeouts, consistent help, testing).
- Docs: a Content and voice foundation page: sentence case, verbs on buttons, labels and hints, errors that say what happened and how to fix it, empty states, and how to write numbers, dates and units. It ends with a table of every word the components say on their own, in English and Indonesian, read from the label set so it can't drift.
- Docs: an Elevation and layers foundation page: the five levels from page to modal with the surface, edge and shadow each uses, drawn in light and dark; why dark themes lift with the surface instead of the shadow; and how the top layer, the named z-index layers and stacking contexts fit together.
- Docs: a Layout foundation page: what changes at each breakpoint, which Container size fits which content, and the spacing rhythm between a page's parts, with a typical app page.
- `focus-ring-width` (2px) and `focus-ring-offset` (2px) tokens, used by every component's focus ring and by the base `:focus-visible` style.
- A contract check fails on a box-shadow focus ring in component CSS. Inset rings are allowed where an outline would be clipped (Tabs).
- A `highlight` color token (zinc-200 light, zinc-700 dark) for the highlighted row in a list.
- Native Select options are drawn by the browser and can't use the token.
- List: a link or button item held down fills with `pressed`, one step past its hover, so a click shows. Pressing the item's trailing action doesn't press the row. New token `--list-bg-pressed`.
- Menu: an item held down fills with `pressed`, one step past its highlight, so a click shows. A destructive item keeps its danger tint. New token `--menu-item-bg-pressed`.
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
- Tabs: an unselected pill tab held down fills with `pressed`, one step past its hover, until the click selects it. New token `--tabs-pill-bg-pressed`. Line tabs, which have no fill, are unchanged.
- Dark mode without JavaScript: `data-brand` and `data-mode` now work on their own, on `<html>` or any element (ADR-0011). Every color that differs between themes is also written as a `light-dark()` pair, and `data-mode` sets `color-scheme` (`auto` is `light dark`), so `<html data-brand="violet" data-mode="auto">` follows the operating system from the first paint with no `theme.js`, a `data-mode="dark"` section works inside a light page, and a `data-brand` section takes its own brand. Badge's tone colors follow too. `data-theme` and `theme.js` work exactly as before, and a page with neither attribute stays light.
- Type roles, text styles named for what they're for: `type-display`, `type-heading-1` to `type-heading-4`, `type-title`, `type-body`, `type-body-sm`, `type-label`, `type-caption`, `type-overline` and `type-code`. Each is a class in `tokens.css`, a `--text-type-*` font shorthand, and a typography token in `design-tokens/`. `<Heading>` levels 1 to 4 render the heading roles exactly, so a class and the component match. `type-display` has a line height of 1.1, so two-line headlines don't touch. The `type-xs` to `type-9xl` size styles are unchanged.

### Changed

- Breadcrumb: the "…" button is named "Show all pages", which says what pressing it does. `expandLabel` still sets your own. In `idLabels` it's "Tampilkan semua halaman".
- Tooling: component CSS can't use physical left and right properties (`padding-left`, `left`, `float: right`…); Stylelint asks for the logical ones (`padding-inline-start`, `inset-inline`, `float: inline-start`…), so every component keeps working in right-to-left text. Navbar's mobile menu, the centered Toast stack and Field's group label move to the logical properties, with no visible change.
- Docs: Storybook's toolbar has a Direction switch (left to right, right to left), so any story can be checked mirrored.
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
- Typing with an input method (Japanese, Chinese, Korean) triggered actions. Enter confirms a composition and Escape cancels it, but the components acted on those keys:
  - Combobox picked the highlighted option while "Ja" was still being composed.
  - SearchInput cleared the field on Escape and searched with half-typed text on Enter.
  - TimePicker, DatePicker, DateRangePicker and NumberInput read the half-typed text.
  - Menu, Popover, Tooltip and Navbar closed on Escape.

  Key handlers now ignore keydowns that belong to a composition (`isComposing`, or keyCode 229).
- DatePicker: in Kyrgyz (`ky`), which writes dates year-day-month, typing the date the field shows read it as year-month-day (2026-05-01 for 5 January became 1 May). A leading 4-digit year now reads as ISO only when the locale doesn't write its year first. DateRangePicker reads dates the same way.
- TimePicker: times that some locales write didn't read back when typed: Bulgarian's 12-hour form (the "ч." after the time), Assamese ("AM ৯.০৫", with AM first), the Japanese calendar's 12-hour clock ("午前0:00", which starts at 0) and Dzongkha (words for "hour" and "minute"). The parser now reads AM and PM before or after the time, drops the locale's own words around a time, and takes 0 as the first hour of a half. A new test checks round trips in 104 locales, in the browser and in Node.
- Menu: typing more than one letter now goes to the item starting with the whole word ("de" finds Delete, past Duplicate), and the same letter again steps through the items starting with it. Accents and case are ignored, so "e" finds "Éditer" and "lo" finds "Łódź".
- Toasts and screen-reader announcements now work while a Dialog or Drawer is open. The Toaster and the shared live regions move into the open modal, since the page behind it is inert, and move back when it closes. Danger toasts are announced assertively. Two announcements in quick succession are both said, instead of the second replacing the first.
- A `<section data-mode="dark">` stayed light unless `<html>` had `data-brand` or `data-mode`, which included every page that uses `data-theme`. Its `color-scheme` turned dark, so native controls and scrollbars went dark on a white background. A nested `data-mode` element now carries the full set of light-dark() colors, keeps the brand of the page or section around it (or takes its own `data-brand`), and keeps `data-contrast="more"` from the page.
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
