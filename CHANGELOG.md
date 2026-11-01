# Changelog

Every change to Serupa (called the Diki Design System up to 4.8.1), newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html); the README's Versioning section says what counts as a breaking change.

## [Unreleased]

## [13.0.0] - 2026-11-01

### Added

- Tokens: `data-shadow="brand"` on any element tints the box shadows (`--shadow-2xs` to `--shadow-2xl`) with a deep shade of the brand color, at the same opacity, using CSS relative color syntax. `data-shadow="neutral"` puts the black back for a section. Shadows without the attribute are unchanged.
- Button: a primary button given its own `--button-primary-bg` and no `--button-primary-bg-hover` now gets a hover color worked out from its background, with CSS relative color syntax: a step darker in light themes and lighter in dark ones, in the same hue. Before, it hovered in the theme's brand color. A hover color you set, and buttons with no background of their own, are unchanged.
- `dist/debug.js` now checks contrast too. It tests the color pairs Serupa draws (text on each surface, button text, field borders, the focus ring) against WCAG 2.2 where they appear on the page, so a color token your app overrides can't quietly fail. When it turns on, the console lists the pairs that fail on the page. The panel adds the ones that fail on the component you point at, from a token set on it or around it. `Serupa.debug.contrast(el)` returns every pair with its ratio.
- More contrast now raises the brand color too, in each brand's own hue: under `data-contrast="more"` (or the system's more-contrast setting), `primary` takes brand 800 in light themes and brand 300 in dark, `primary-hover` brand 900 / 200, and `focus-ring` brand 700 / 300. Links, secondary button labels and the text on a primary fill reach 7:1 in all six themes, from `data-theme`, from the `data-brand` / `data-mode` axes and in nested brand sections. A `contrastMore` in tokens.json can now hold a value per theme, which the token build writes as an internal `--dk-more-*` token beside each theme's colors.
- **Changed:** `data-contrast="more"` (and `prefers-contrast: more`) now raises the status colors. `success-text`, `warning-text`, `danger-text` and `info-text` move to hue-900 in light themes and hue-200 in dark ones. That gives 7:1 on `surface`, `surface-raised` and the status's own subtle fill, so error messages and alert text meet WCAG AAA like body text. The `success`, `warning` and `info` icon colors move to hue-700 (info sky-800) in light and hue-300 in dark. `danger` keeps its fill, because white `on-danger` text sits on it. Normal contrast doesn't change. Brand-colored text and subtle badge labels are not raised yet.
- `dist/debug.js` (`serupa-ds/debug.js`), an opt-in debug overlay. Load it on a page and add `?serupa-debug` to the address: every Serupa component gets a dashed outline, and pointing at one shows its name, its variant and size classes, its state (`data-state`, `aria-expanded`, disabled and the like), its size in px, and the component tokens that have a value on it, so an override your app sets shows up. It stays on for the tab until Escape or `Serupa.debug.off()`. `Serupa.debug.inspect(element)` returns the same as an object. It is standalone and not part of `serupa.iife.js` or the ES modules, so nothing else pays for it.
- `serupa-ds/eslint`, an ESLint flat-config object that tells eslint-plugin-jsx-a11y (and its fork eslint-plugin-jsx-a11y-x) what each component renders, so a project's lint checks `<Image>`, `<Link>` and `<IconButton>` as it checks `img`, `a` and `button`. Add it after the plugin's config in `eslint.config.js`. Getting started shows how, and how to use the same settings with Oxlint.
- The `field-readonly` color token, the background of read-only and disabled form fields (`zinc-50` in light, `zinc-900` in dark). Input, Textarea, PinInput and Select use it by default for `--input-bg-readonly`, `--textarea-bg-readonly`, `--pin-input-bg-readonly` and `--select-bg-disabled` (was `surface-muted`). Light themes look the same. In dark, now that `field` is `zinc-800`, a read-only field sits a step flatter than an editable one instead of matching it.
- New `data-type-scale="fluid"` theme axis: the heading sizes (`text-2xl` to `text-9xl`, and the `type-*` styles that use them) scale with the window, from 70% of their size on a 320px phone to their full size at 1280px. Body sizes don't change, browser zoom still enlarges the headings (at least double by 300%, since zooming also narrows the window), and `data-type-scale="fixed"` puts the fixed sizes back for one section. The `type-*` classes from `type-2xl` up now read their size from the matching `--text-*` token, so a theme that changes `--text-3xl` changes `type-heading-1` too.
- Inter is now split by script. `tokens.css` points at `fonts/InterVariable-latin.woff2`, `-latin-ext`, `-cyrillic`, `-cyrillic-ext`, `-greek`, `-greek-ext`, `-vietnamese` and `-symbols` (and the same for italic), each with its `unicode-range`. A page downloads only the scripts its text uses, so an English page fetches 103 KiB of upright Inter instead of 344. Every weight, feature and glyph is still there. One thing changes: a word that mixes letters from two files, such as Polish "Łódź" (Ł and ź are in latin-ext, ó and d in latin), loses the kerning between those letters, because a font only kerns its own glyphs. Google Fonts' Inter works the same way. On Linux with font hinting on, such a mixed line can also come out a pixel wider or narrower, because the hinter measures each file on its own. If you preload the font, point the preload at the subset your page uses: ```html <link rel="preload" href="fonts/InterVariable-latin.woff2" as="font" type="font/woff2" crossorigin> ``` A preload of `fonts/InterVariable.woff2` still works, but `tokens.css` no longer uses that file, so the browser downloads it for nothing. The whole-font files still ship, for a page that writes its own `@font-face`.
- HoverCard, a preview of what a link points to (a person, a page, a record), shown when the pointer rests on the link or keyboard focus stays on it. Unlike a Tooltip it may hold links and buttons: the pointer can move onto it, and Tab goes from the link into it. It opens after 500ms (`openDelay`) and closes 300ms after the pointer and focus leave both (`closeDelay`); Escape closes it and, from inside, returns focus to the link. It fades and grows in like Popover, with ten component tokens. A touch screen has no hover, so it never opens there: the link goes to its page.
- IconButton: `noTitle` is now `hideTitle`, named in the positive like every other boolean. `noTitle` still works, with a development warning (`icon-button-no-title`), until the next major version.
- An icon drawn by name (`<Icon name="rocket_launch" />`) that isn't one of the components' own now downloads only the part of the Material Symbols that holds it, about 86 KB (9 to 20 KB gzipped), instead of the whole 2.7 MB set. The set is cut into 32 parts in name order, and a page downloads only the parts its names are in. Nothing changes in how you write it, and `serupa-ds/icons` still exports every icon. On a plain page, `serupa-icons.iife.js` is still one file.
- Text no longer jumps when Inter loads. `--font-sans` is now `Inter, "Inter Fallback", ui-sans-serif, system-ui, sans-serif`, and `tokens.css` defines "Inter Fallback" as Arial (or Helvetica, Liberation Sans, Arimo, whichever the device has), sized with `size-adjust` so a line of English is within about 1% of its width in Inter, and with Inter's ascent and descent. Until Inter arrives (`font-display: swap`), text draws in that font. When Inter swaps in, lines keep almost the same width and height, so the page below them doesn't move. It covers the latin range only, so other scripts fall back to the system font as before. Nothing changes once Inter has loaded.
- Menus, popovers, combobox lists and the date and time pickers no longer animate when the keyboard opens or closes them. Opened by Enter, Space or an arrow key, they are there in the first frame, and closed by Escape they are gone in the same frame. A pointer or a tap keeps the fade and scale. This covers Menu (its submenus and ContextMenu too), Popover, Combobox, DatePicker, DateRangePicker and TimePicker. Nothing to change in your code.
- Menu: the type declarations keep MenuItem's internal props type with Menu, instead of in the shared chunk where it clashed with a SidebarItem type of the same name.
- Dialog, Drawer, DatePicker, DateRangePicker, TimePicker and TreeView's items with children now carry `data-state="open"` or `"closed"`, like Accordion, Combobox, Menu, Navbar, Popover, Sidebar and Tooltip already did, so one selector styles every open overlay. ADR 0012 lists the `data-state` values every component uses.
- New CommandPalette (beta): a ⌘K (Ctrl+K) search over the app's commands and pages in a dialog. Typing filters the list, ignoring case and accents, best matches first; the arrows move through it and Enter runs a command's `onSelect` or goes to its `href`. Commands can have groups, keywords, icons and shown shortcuts. It is a combobox over a listbox, says how many match once typing stops, and reads 4.5:1 in all six themes.
- New VirtualList (beta): a List of any length that draws only the rows in view, plus a few either side. Rows are ListItems, measured once drawn, so rows of different heights work; the scroll stays still when rows above the view turn out taller or shorter. Each drawn row has `aria-posinset` and `aria-setsize`, the list scrolls from the keyboard, and the row with focus stays drawn while scrolled away. Its windowing (`useVirtual`, internal for now) is shared, so Combobox and Table can use it next.
- Dialog: `unsaved`. While there are changes that would be lost, Escape, the ×, the backdrop or the browser closing it first ask "Discard changes?" in a small alert dialog (Keep editing focused); `onOpenChange(false)` comes only after Discard. Leaving the page while it's open asks too (`beforeunload`). The words are new labels (`discardTitle`, `discardDescription`, `discard`, `keepEditing`), in English and Indonesian.
- FileUpload: pasting files (Ctrl+V, ⌘V) while focus is on its choose button or a remove button adds them, checked like dropped files, so a copied screenshot can be added from the keyboard alone. A paste with no files does nothing; `readOnly` and `disabled` ignore it.
- Drawer: new `unsaved` prop. With it, Escape, the ×, the backdrop, a swipe or the browser closing the drawer first ask "Discard changes?" (Keep editing or Discard), like Dialog's, and leaving the page asks too. `onOpenChange(false)` comes only after Discard.
- Navbar: a `sticky` bar now lifts once the page scrolls under it. A shadow fades in over the first bar height of scroll, driven by the scroll itself (a scroll-driven animation) rather than a timer, so it follows the page exactly and never runs on its own. Set `--navbar-shadow-scrolled` to change it (default `shadow-md`), or `none` to keep the flat bar. Where scroll-driven animations aren't supported (Firefox), the bar keeps its line alone, as before.
- NumberInput: the value is written in the locale's own digits, as Meter, Pagination and Calendar write numbers (`١٢٥٠٫٥` in ar-EG), instead of always in Latin digits. Typed digits are still read in any script, and the form still gets Latin digits. The new `numberingSystem` prop (or `formatOptions.numberingSystem`) picks the digits, for example `"latn"` to keep Latin. Migration: in a locale with its own digits (ar-EG, fa-IR, and others), pass `numberingSystem="latn"` to keep the old display.
- Pagination: `pageSizeOptions` adds an "Items per page" select after the summary. Picking a size calls the new `onPageSizeChange(pageSize, page)` with the page that keeps the first item shown in view. A new `perPage` label names the select ("Item per halaman" in Indonesian). Nothing changes without `pageSizeOptions`.
- New `plural(locale, count, forms)` export: picks the words for a count with `Intl.PluralRules` (`one`, `few`, `many`, … and `other`) and writes the count the locale's way where the words have `#`, for count labels in languages with more than two plural forms, such as Russian and Arabic. Localization docs show it with a Russian `resultsCount`.
- Prose: a new component for Markdown, CMS and rich-text content. Inside it, each block is spaced from the one before (more before a heading, none before the first), lists get their markers and logical indents back, and quotes, code, tables, rules and images are styled. A wide table or code block scrolls in its own box, and a visited link takes the new `link-visited` color (4.5:1 on `surface` and `surface-muted` in all six themes), with its utility classes. A code block or table that scrolls takes keyboard focus (tabindex 0, added only while it overflows), so the keyboard can reach what's past its edge.
- Text in Arabic, Devanagari, Thai, Japanese, Korean and Chinese gets taller lines and the right font. `--font-sans` now names Noto Sans Arabic, Hebrew, Devanagari and Thai after Inter, used where the device has them. Under `lang="ja"`, `"ko"`, `"zh"` and `"zh-TW"`, the stack puts that language's Noto Sans CJK first, because Han characters are drawn differently in each. Under those languages, and Arabic, Devanagari and Thai, every `--text-*--line-height` is at least 1.5 times the font size (1.6 for Arabic), so marks above and below the letters don't touch the next line. English and Hebrew are unchanged.
- SkipLink: a new component for the "Skip to content" link every page needs (WCAG 2.4.1). It's hidden until Tab reaches it, then shown at the top of the page above a sticky Navbar. Following it moves focus to `#main` (or `target`), even when that isn't focusable, so the next Tab goes on from the main content. Its text comes from `labels.skipToContent`, with the Indonesian included.
- SortableList: new `orientation="horizontal"` lays the items out in a row. Dragging, the gliding moves and edge auto-scroll work sideways, and in a right-to-left row ArrowLeft moves an item later.
- Spinners turn faster: `--motion-loop-spinner` goes from 1000ms to 700ms a turn, so a wait feels shorter. This covers Loader's ring and everything built on it (Button, Badge, SearchInput), Switch's pending ring and the circular Progress. Under reduced motion they still stand still and breathe, now over 1.4s (twice the turn) instead of 2s. To keep the old speed, set `--motion-loop-spinner: var(--duration-1000)`.
- Stronger easing, and large type styles set tighter.

- `--ease-exit` is now the strong ease-out `ease-out-quart`, not `ease-in`. Menus, popovers, dialogs, drawers, tooltips and toasts are mostly gone in the first frames of a close, so closing feels quicker in the same duration.
- `--ease-out` now points at `ease-out-quart`, and `--ease-in-out` at `ease-in-out-cubic`, in place of the softer `cubic-bezier(0, 0, 0.2, 1)` and `cubic-bezier(0.4, 0, 0.2, 1)`. This also changes the default curve of the `transition` and `ease-out` / `ease-in-out` utility classes, and the Loader's dots, pixels, shine and placeholder sweep.
- `type-2xl` to `type-5xl` carry `tracking-tight` (-0.025em), and `type-6xl` to `type-9xl` `tracking-tighter` (-0.05em), so a large text style matches a Heading of the same size.

To keep an old curve, set it in your theme: `--ease-exit: var(--ease-in);`, `--ease-out: cubic-bezier(0, 0, 0.2, 1);` or `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);`. To keep the old tracking, set `letter-spacing: 0` next to the `type-*` class.
- **Added:** `serupa-ds/stylelint`, a Stylelint config for an app's own CSS. Extend it with `extends: ["serupa-ds/stylelint"]`. It turns on three rules: `serupa/no-raw-color` flags a color written out (`#333`, `rgb()`, `oklch()`, a named color), `serupa/no-raw-spacing` flags a length in margin, padding, gap or inset, and `serupa/no-raw-radius` flags a length in border-radius. Each message names the token family to use. Values inside `var()`, `calc()` over tokens, `0`, `transparent`, `currentcolor` and custom properties pass. `stylelint` 16 or later is an optional peer dependency, needed only when you use the config.
- Switch carries the native `switch` attribute, so Safari 18 on iPhone gives its haptic tick when it flips. Its look and behavior are unchanged.
- Table: a sticky header lifts once rows scroll under it (KW16). The header cells take a soft shadow (`--table-head-shadow-scrolled`, default `shadow-sm`) while the frame can scroll back up, so nothing shows at the top. It's a scroll-state container query, not an animation, so nothing runs on its own. Where scroll-state queries aren't supported, the header stays flat, as before.
- Table: `captionHidden` is now `hideCaption`, named in the positive like every other boolean. `captionHidden` still works, with a development warning (`table-caption-hidden`), until the next major version.
- TableRow: `href` (with `target` and `rel`) makes the whole row a link. One real `<a>` sits in the row's first `TableCell` (or the one marked with the new `link` prop) and its area covers the row, so a click anywhere follows it, Ctrl/Cmd-click and middle-click open a new tab, and the keyboard tabs to it. Buttons and checkboxes in other cells still work on their own. `onClick` on a row without `href` now warns in development, since it reaches mouse users only.
- New `serupa-ds/testing`: `forEachTheme(page, fn)` draws your page in each of the six themes, for screenshots in your own CI. It sets `data-theme`, matches the emulated color scheme, turns off transitions and waits for fonts, then puts the page back. ```js import { forEachTheme } from "serupa-ds/testing"; await forEachTheme(page, (theme) => expect(page).toHaveScreenshot(`checkout-${theme}.png`)); ```

### Changed

- In the dark themes, Button's `secondary` and `outline` variants (destructive ones included) sit on `surface-raised` (`zinc-800`), one step lighter than the `zinc-900` page, instead of on `surface`. Light themes don't change: `surface-raised` is white there too. Text keeps WCAG 2.2 AA in all three dark themes (lowest is violet `primary` at 5.5:1), and hover keeps its colors. The new defaults are `--button-secondary-bg`, `--button-outline-bg`, `--button-destructive-secondary-bg` and `--button-destructive-outline-bg`: `surface-raised` (was `surface`). Set them back to `var(--surface)` to keep the old look.
- **Breaking.** Changed: the three dark themes are lighter. The page (`surface`) is `zinc-900` instead of the near-black `zinc-950`, and every layer above it moves up one step so they stay apart: `surface-muted`, `surface-raised`, `surface-overlay` and `field` are `zinc-800` (were `zinc-900`), so a field stays one step lighter than the page, with `field-border` at `zinc-400` (was `zinc-500`) and `field-border-hover` at `zinc-300` (was `zinc-400`); `border` and `border-raised` are `zinc-700` (were `zinc-800`); `border-strong` and `border-overlay` are `zinc-600` (were `zinc-700`); `secondary` is `zinc-700` (was `zinc-800`) and `secondary-hover` is `zinc-600` (was `zinc-700`). `highlight` and `pressed` keep their values, which are already one step past the `surface-overlay` and `secondary` they sit on (one step lighter would drop the violet `primary` bar on `highlight` to 2.8:1, and `text` on `pressed` to 4.6:1, below the 7:1 of more contrast); text, brand and status colors don't change, and the light themes don't change. `highlight` now shares `secondary`'s `zinc-700` in dark, so a `primary` bar on it keeps 3:1 in the violet brand. Text keeps WCAG 2.2 AA (and the stronger `data-contrast="more"` pairs) on every surface, and `field-border` keeps 5.8:1 on fields and cards. `theme.js` writes `#18181b` (was `#09090b`) to `<meta name="theme-color">` before the stylesheets arrive. **Migration:** nothing to do if you use the tokens; your app gets the lighter dark mode. Check anything you colored with raw `zinc-950`, `zinc-900` or `zinc-800` next to Serupa surfaces in dark, since those now sit one step off: replace them with the token (`surface`, `surface-raised`, `field`, `border`) or move them up a step. A custom dark `theme-color` or a hardcoded `#09090b` page background should become `#18181b`. To keep the old near-black look, set `--surface: var(--zinc-950)` and the other tokens above back to their old steps in your dark theme.
- NavbarLink's `as` is typed, as Link's and BreadcrumbItem's are. Its props and `ref` are those of the element `as` names, so `<NavbarLink as={RouterLink} to="/team">` type-checks with RouterLink's own props, and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s, as before. `NavbarLinkProps` is now a generic type (`NavbarLinkProps<typeof RouterLink>`), and its own props are in the new `NavbarLinkOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<NavbarLink as={RouterLink} {...{ to: "/x" }}>`. After: `<NavbarLink as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - `interface MyNavLinkProps extends NavbarLinkProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyNavLinkProps = NavbarLinkProps<typeof RouterLink> & { … }`.
- SidebarItem's `as` is typed, as Link's and BreadcrumbItem's are. Its props are those of the element `as` names, so `<SidebarItem as={RouterLink} to="/inbox" label="Inbox">` type-checks with RouterLink's own props, and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s, as before. The `ref` stays an `HTMLElement`, because a group item renders a button. `SidebarItemProps` is now a generic type (`SidebarItemProps<typeof RouterLink>`), and its own props are in the new `SidebarItemOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<SidebarItem as={RouterLink} {...{ to: "/x" }} label="X">`. After: `<SidebarItem as={RouterLink} to="/x" label="X">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - Handlers without `as` are typed for an `<a>` (`MouseEvent<HTMLAnchorElement>`), not `HTMLElement`. A handler that takes `MouseEvent<HTMLElement>` still fits.
  - `interface MyItemProps extends SidebarItemProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyItemProps = SidebarItemProps<typeof RouterLink> & { … }`.
- MenuItem's `as` is typed, as Link's, NavbarLink's and SidebarItem's are. Its props are those of the element `as` names, so `<MenuItem as={RouterLink} to="/settings">` type-checks with RouterLink's own props (its README promised that, but `to` was a type error), and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s (`href`, `target`, `rel` and the rest), whether the item is a link or an action. The `ref` stays an `HTMLElement`. `MenuItemProps` is now a generic type (`MenuItemProps<typeof RouterLink>`), and its own props are in the new `MenuItemOwnProps`. MenuCheckboxItem and MenuRadioItem are unchanged.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<MenuItem as={RouterLink} {...{ to: "/x" }}>`. After: `<MenuItem as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors.
  - Handlers on an item are typed for an `<a>` (`MouseEvent<HTMLAnchorElement>`). A handler that takes `MouseEvent<HTMLElement>` still fits; one written for `HTMLDivElement` needs `HTMLElement`.
  - `interface MyItemProps extends MenuItemProps` still works. To extend a router link's props, use a type: `type MyItemProps = MenuItemProps<typeof RouterLink> & { … }`.
- **Breaking.** Removed: IconButton's `noTitle` and Table's `captionHidden`, the old names of `hideTitle` and `hideCaption`, deprecated with a development warning and due in this major. Their development warnings (`icon-button-no-title`, `table-caption-hidden`) go with them. **Migration:** rename `noTitle` to `hideTitle` and `captionHidden` to `hideCaption`; both do the same as before. TypeScript flags any you missed.

### Fixed

- Accordion: closed content is hidden in the server's HTML too, so a page whose stylesheet is slow or blocked no longer shows every closed answer. Once the script runs it's `hidden="until-found"` as before, so find-in-page still opens it.
- Alert: a long action button label wraps onto more lines in a narrow alert instead of ending in an ellipsis.
- Alert: only words of 10 letters or more hyphenate, so ordinary words in a narrow alert still wrap whole.
- Alert: a long word in the title or message breaks where its language hyphenates it, with a hyphen, before it's cut anywhere. It follows the nearest `lang`.
- After a Badge is removed, focus skips the × of a hidden badge (in a filtered list) and goes to the next one that can take focus, instead of dropping to the page (L8E33).
- Components that follow the browser's locale (no `locale` prop or SerupaProvider locale) built a new `Intl.DateTimeFormat` to ask for it at least twice on every render, which made a 1,000-row Table take 2.4 s to tick one row on a slow phone. The locale is now read once and read again when the browser fires `languagechange`.
- Calendar: with `monthYearPicker` inside a form, a form reset no longer turns the Month and Year menus to January and the first year while the grid stays on its month. The menus choose what the grid shows and aren't form data, so they now stay out of the form around them.
- Calendar: on a 320px screen with the browser's text at 125%, the days shrink a little so the week fits the screen instead of running past it. They never grow past their size, and stay well over 24px.
- Calendar: in Thai (and other languages whose short weekday names run to five or more characters), the weekday headers use the narrow names, so the week fits a 320px screen with 125% text instead of widening past it. Screen readers still hear the full names.
- Calendar: on a narrow screen, where a day shrinks to fit the week, its size snaps down to a whole pixel (37px instead of 37.14px at 320px), so the day circles and the range band keep sharp edges. Browsers without `round()` keep the unrounded size.
- Card: a long word in the title or description breaks where its language hyphenates it, with a hyphen, before it's cut anywhere. It follows the nearest `lang`. The body is left as it is.
- Card: in a narrow card (its footer under 20rem, as on a phone), each footer action now takes the full row, one under the other, instead of squeezing side by side. It follows the footer's own width like a container query, without making Card a size container, so a card sized by its content keeps its size. Wider cards are unchanged.
- Carousel: `perView` with a breakpoint map (`{ base: 1, md: 2, lg: 3 }`) now lays out the right number of slides from CSS, so a server-rendered page shows two or three slides from the start instead of one that jumps to the count for the width when the page hydrates. The dots past the last page at that width are hidden until then too.
- Carousel: inside a shadow root, reaching the last slide moves focus to Previous (and the first, to Next), as it does on the page. Before, focus fell to the body when the button that had it hid, because Carousel read `document.activeElement`, which is the shadow host there.
- CheckboxGroup: `invalid` now puts `aria-invalid` on each box instead of the `role="group"` wrapper, and the wrapper drops `aria-required`, since a group supports neither. `required` is still each box's native `required` while none is checked, and Field `group` still says "Required" in the legend.
- Combobox: "No results" and "Couldn't load" are said through the shared announcer once typing stops, as the result counts are. Before, they relied on a status row inserted with its text already in it, which VoiceOver and JAWS don't read. Those rows are now plain text, so nothing is said twice.
- Input, Textarea and the shared hooks behind popovers, exits and scrolling no longer change their props or refs while rendering, so they keep working the same under the React Compiler.
- TypeToConfirm no longer runs the destructive action on the Enter that ends an input method's composition in Safari (keyCode 229) once the phrase matches (L8E34).
- CopyButton: inside a shadow root, the `execCommand("copy")` fallback (for browsers without the Clipboard API) puts focus back on the button, as on the page. Before, focus was left on the page, because CopyButton read `document.activeElement`, which is the shadow host there.
- DateRangePicker: in a narrow box (a 320px screen with large text, a slim column) the two date fields shrink so the calendar button stays inside the box instead of spilling past its edge.
- DateRangePicker: in a box too narrow for both dates, the end date now wraps onto a second line instead of both fields shrinking until the year was cut off ("12/28/202"). With room for both, it looks as before.
- IconButton `noTitle` and Table `captionHidden` stay deprecated, but their removal moves from 12.0.0 to 13.0.0: 12.0.0 shipped with them still in, so their docs and development warnings now name the next major. Both still work as before. Rename them to `hideTitle` and `hideCaption` before 13.0.0.
- The two deprecated props now say when they go: IconButton's `noTitle` and Table's `captionHidden` are removed in 12.0.0. Their development warnings, their type hints and the warnings reference all say so. Use `hideTitle` and `hideCaption` instead.
- Dialog: a long footer button label wraps onto more lines on a narrow screen instead of ending in an ellipsis.
- Dialog: on a screen under 480px tall (a laptop at 400% zoom), the whole panel scrolls instead of the body. The header and footer no longer squeeze the body to nothing or push the footer's buttons off screen, where nothing scrolled to them.
- Drawer: a long footer button label wraps onto more lines on a narrow screen instead of ending in an ellipsis.
- Drawer: on a screen under 480px tall (such as 400% zoom), the whole panel scrolls instead of the body, so the footer buttons can always be reached and are in view when focused.
- EmptyState: a long "Did you mean" suggestion now wraps inside a narrow state instead of running past its edge.
- EmptyState: a Button in `actions` with a long label wraps onto more lines in a narrow box (a 320px screen with large text) instead of widening the whole state, its title and description with it, past the screen.
- ErrorBoundary: inside a shadow root, Try again (or a custom fallback's `reset()`, or `resetKeys`) with focus in the fallback moves focus to what came back, as on the page. Before, focus fell to the body, because ErrorBoundary read `document.activeElement`, which is the shadow host there. Focus is now read through open shadow roots.
- Field: inside a shadow root, clicking the label of a Slider, SegmentedControl or ColorPicker now focuses it. It also no longer warns in development that the label names nothing. The accessible-name check behind the "has no accessible name" warning (Slider, Dialog and others) now finds an `aria-labelledby` target in the shadow root as well, so it no longer warns there by mistake.
- FileUpload: a refused file (too large, wrong type, a duplicate) no longer goes with the form in place of the files the list shows.
- FileUpload: the choose button no longer carries `aria-invalid` or `aria-errormessage`, which a button doesn't support. The error is still in the button's description: Field's `error` already was, and your own `aria-errormessage` now joins it. `aria-invalid` moves to the native file input. The drop area is now `role="presentation"`, since the button is how the keyboard and screen readers reach the picker, and a disabled FileUpload puts `aria-disabled` on its root instead of the drop area.
- Utilities: inside `bg-primary`, `bg-danger` and `bg-surface-inverse`, the focus ring of links, buttons and fields takes the fill's text color (`on-primary`, `on-danger`, `text-inverse`). The brand-colored ring was as low as 1:1 against the brand fill; it now reaches 3:1 in every theme. Focus rings elsewhere are unchanged.
- Utilities: a Card, menu, table or light bg- box inside .bg-primary, .bg-danger or .bg-surface-inverse gives the controls in it the page's focus ring back, so it no longer disappears against the card.
- After a failed submit, the errors are read once. When an ErrorSummary takes focus, the Fields in its form no longer also announce their new errors (GR54).
- TableActionBar now reads out its first count when it is rendered only while rows are selected (GR55).
- Splitter, Carousel, Calendar and ColorPicker run your onKeyDown as keys bubble up again, after the controls inside them. An onKeyDown that stops propagation no longer stops a Combobox, Input or other control inside from getting its keys (GR57; undoes L8E32).
- HoverCard: Escape pressed during the open delay now cancels the open, so the card no longer appears after it was dismissed. It stays shut until the pointer or focus leaves the link and comes back.
- InlineEdit: inside a shadow root, switching to another window mid-edit keeps the field open, and an Enter whose `validate` promise settles later puts focus back on the text, as on the page. Before, InlineEdit read `document.activeElement`, which is the shadow host there, so the window switch saved the edit, and focus wasn't given back. Focus is now read through open shadow roots.
- Input: with `mask`, inside a shadow root, an edit in the middle keeps the caret after the same character, as on the page. Before, it jumped to the end, because Input read `document.activeElement`, which is the shadow host there.
- `base.css`: headings inside `lang="ja"` break between phrases (`word-break: auto-phrase`) instead of between any two characters, so a Japanese word isn't split across lines. Chrome and Edge 119 and later; other browsers break as before.
- The Tabs line or fill and the SegmentedControl selection now jump when an arrow key (or Home or End) picks the tab or segment, and still slide when it is clicked or tapped. Menus, popovers and pickers already work this way from the keyboard.
- A required field on a tab that isn't selected stopped the form's submit with nothing shown. Its tab is now selected, the field takes focus and the browser says what's missing.
- TypeToConfirm kept what was typed when the Dialog or Drawer around it closed (it stays mounted) or its form reset, so on reopening the destructive button already worked. It now clears.
- A Breadcrumb trail expanded with its "…" button stayed expanded on every later page when the layout (and the Breadcrumb) stayed mounted, as with a router. A new trail starts collapsed.
- A Calendar whose value was changed from outside (a typed date, a "Today" button) kept showing the old month, and another day kept the Tab stop. It now shows the new value's month (unless month is controlled) and puts the Tab stop on it.
- A Popover, Menu, ContextMenu, Tooltip, DatePicker, DateRangePicker or TimePicker left open inside a Dialog or Drawer that closed from code is now closed with it, instead of being open again the next time the Dialog opens.
- PinInput, a whole code pasted after a few characters were typed now replaces them, instead of being added after them and cut off (typing 12 and pasting 483 921 gave 124839, and onComplete got that).
- Tooltip's onOpenChange is called only when it would show or hide. A press, a blur or the pointer passing over before the delay, while it was hidden, called onOpenChange(false), and a disabled Tooltip called onOpenChange(true) on hover and focus.
- Tabs, pressing the tab that's already selected (a click, Enter or Space) no longer calls onValueChange with the same value, which pushed the same page into the history again in an app that keeps the tab in the URL.
- SidebarItem, a group opens when the page moves to one of its items (a link elsewhere on the page, the browser's Back), as it does when the page loads there, so the current page isn't left hidden in a closed group. A group with defaultOpen or open set is left to you.
- Slider, a press on a thumb let go where it was, or a drag that ends back where it began, no longer calls onValueCommit with the value it already had (a save on every click). A key press at the end already didn't.
- FileUpload with multiple, adding files that are all refused (a duplicate, a wrong type, one too large) no longer calls onFilesChange with a copy of the same list, which an app that uploads on change took as new files.
- TreeView no longer calls `onValueChange` when Ctrl+A or a Shift range picks only items that were picked already.
- `MenuRadioGroup` no longer calls `onValueChange` when the item that is chosen already is chosen again.
- Popover no longer calls `onOpenChange(false)` when the `close()` its content keeps is called after the popover has closed already.
- A `toast.undo` toast is closed when the page comes back from the back/forward cache. Leaving the page had already committed the action, so its Undo button could no longer undo anything.
- Each toast's Dismiss button is described by that toast's title, so a screen reader tells several toasts' Dismiss buttons apart ("Dismiss, button, Saved").
- Toast writes its repeat count in the locale's digits ("×١٢" in ar-EG), as Badge writes its count.
- Pagination measures its row again once web fonts load, so a row first cut to fit a wider fallback font gets its pages back.
- PhoneInput keeps a calling code typed key by key ("+44 …", or "0044 …" in Germany) in the field until it names a country, then picks that country, as a pasted number does. Before, the lone "+" was dropped, so "+44 20 7946 0958" was sent as a wrong US number.
- PhoneInput reads "0044 20 7946 0958", typed one key at a time in a US (or any +1) field, as a UK number, as a paste of the same text already did. The first 0 used to be formatted as "(0", so the "00" never came together and the number went out as +10044207946 (GR85). A lone 0 now waits as typed in every country, so in Italy "06 1234 5678" still starts with its 0.
- PhoneInput: after a form reset the country menu shows the country again. It showed Afghanistan, the first option, beside a number that was still British, and ArrowDown on it then picked Åland and sent a +358 number.
- VirtualList: End on a very long list (500,000 rows and more) no longer sometimes ends in an update loop that emptied the list (GR91), and past the browser's maximum element height the scroll range is scaled, so the last of 1,000,000 rows can be reached (GR92).
- VirtualList: after a jump to the middle of a long list, a small scroll no longer moves the view dozens of rows; the row at the top of the view stays put while the rows around it are measured (GR93). Past the browser's height limit (about 270,000 rows), the arrow and Page keys and the wheel step through the rows as in a short list instead of skipping 20 or more rows at a time (GR94). Tabbing through rows of links scrolls each into view again; it used to be pulled back to the top.
- Dialog: when the app closes an `unsaved` Dialog while "Discard changes?" is showing, the question closes too. Before, it came back behind the Dialog the next time it opened, and Escape, the × and the backdrop did nothing.
- Combobox, Menu, TimePicker and CommandPalette lists use `contain: layout paint`, so a row changing (the highlight moving, a row being added) doesn't make the browser lay out the rest of the page again. They already scroll and clip, so nothing looks different.
- CommandPalette: a chosen command now runs after the palette has closed and given focus back, as documented, so its `onSelect` can move focus on the page and its `href` leaves from the page as it was. In forced colors (Windows high contrast) the active row has an outline, so you can see which command Enter runs.
- LoadMore with `endText={null}` no longer drops focus to the page when the last page removes the focused button; it moves to the "Showing N of N" line.
- SaveStatus now says the error when it first renders with status="error", as when it is shown only once a save fails.
- TypeToConfirm with `caseSensitive={false}` now matches "istanbul" to "İSTANBUL", and "invoice" to "INVOICE" in a Turkish browser.
- A letter typed in an open Menu or ContextMenu to find an item no longer also runs a page shortcut on the same letter (`useShortcut("g")`).
- A plain-key shortcut (`useShortcut("g")`) no longer runs, or eats the letter, while someone types in a text field inside a web component's shadow root.
- An Avatar rendered on the server whose picture failed before the page hydrated now falls back to initials instead of keeping the broken picture.
- Image no longer throws "matchMedia is not a function" where there is no matchMedia (jsdom, where apps run their unit tests).
- An ErrorSummary link no longer throws where there is no scrollIntoView (jsdom, where apps run their unit tests); it still moves focus to the field.
- A Rating placed outside its form with `form="…"` kept the picked stars when that form was reset; it now goes back to `defaultValue`.
- A ColorPicker with `form="…"` and no `name`, placed outside that form, kept its color when the form was reset; it now goes back to `defaultValue`.
- In a TreeView, focus dropped to the page when the focused item was taken out of `items` or its parent was closed through a controlled `expanded`. It now goes to the nearest parent in view, or else the item now in its place.
- In a NotificationCenter whose app removes a notification once it is read, "Mark as read" dropped focus to the page. Focus now goes to the next notification, else the last, else the empty line.
- Removing an Image with its × dropped focus to the page. Focus now moves to the next picture's × in the same list, else the one before, as Badge does for tags.
- Closing the focused tab in uncontrolled Tabs selected the next tab but dropped focus to the page. Focus now moves to the tab now selected.
- InlineEdit opened with the `editing` prop now starts from the current text, not a draft or error left from when it was last closed from outside, or the text it first had.
- CheckboxGroup and RadioGroup outside the form their boxes name with a `form` attribute now follow that form's reset, so select-all no longer shows the old choice.
- SaveStatus keeps focus on the status line when Try again is pressed from the keyboard. Before, it fell to the page as the error went.
- An ErrorSummary link to a RadioGroup by its id now scrolls the fieldset's legend (the question) into view, as a link to one of its radios does, instead of the radios alone.
- Kbd shows `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` and `" "` (the names useShortcut and `KeyboardEvent.key` use) as the arrow and Space keys, with their names read out, instead of the raw text or an empty keycap, so they also list properly in KeyboardShortcuts.
- LoadMore with `endText={null}` and no count and total keeps focus on itself when the last page takes the focused button away, instead of dropping it to the page.
- TimelineItem writes its time in a `<time>` only with `dateTime`; without it the shown text ("13 Mar", "2 hours ago") is a `<span>`, since a `<time>` needs a value machines can read, and a `<RelativeTime>` passed as `time` is no longer nested in another `<time>`.
- CopyButton takes the check and "Copied" away when a copy fails while the last one's "Copied" still shows, so it no longer claims the failed copy worked.
- Rating with a value between its choices (3.3, or 3.7 with `allowHalf`) now checks the radio of the star it draws, so screen readers, the arrow keys and a form agree with the stars.
- EmptyState with `announce` and `suggestions` now says the suggested searches apart ("Did you mean: mars, maze."), instead of running them into one word ("Did you mean:marsmaze.").
- Link `external` with your `target="_self"` (or `_parent`, `_top`) no longer shows the new-tab icon or says "(opens in a new tab)", since it stays in the tab.
- Breadcrumb with `collapse="menu"` now passes each hidden page's own props to its menu item (a router link's `to`, `target`, `data-*`, `onClick`), so a page given as `as={RouterLink} to="/org"` still goes there from the menu.
- A plain Card inside a link Card no longer turns its own CardHeader title into a second link to the outer card's href.
- Space on a link MenuItem (`href` or `as`) now follows the link, as Enter does, instead of closing the menu without going anywhere.
- A disabled ListItem given as a router link (`as` with `linkProps.to`) no longer renders the router's href, so a middle or Ctrl click can't open it. It is a plain `<a>` without an address, keeping the aria-*, data-*, id, title and styling from `linkProps`.
- In a collapsed Sidebar, a nested group inside a group is a submenu in the rail's menu, so its items can still be reached. Before, it was a menu item that did nothing and its items were unreachable.
- A readOnly PhoneInput no longer changes its number (or calls onValueChange) when Backspace or Delete is pressed next to a separator.
- A circle Progress given a `label` is named by it. Before, the ring ignored `label`, so it had no accessible name. Text becomes its aria-label, and other content names it through a hidden copy. `aria-label` and `aria-labelledby` still win.
- Rating: a disabled Rating, or one in a disabled <fieldset>, no longer lights up its stars on hover as if a rating could be picked. In a disabled fieldset it now also looks disabled and has aria-disabled, as Slider does.
- SegmentedControl: with nothing checked that can be chosen (no value, or a disabled one), the arrow keys go from the focused segment, as in a native radio group. Before, the first arrow picked the focused segment itself and ArrowLeft skipped the last one.
- Badge: a link badge (href) with disabled could still be followed, focused and clicked, since a link has no disabled state. It now renders without href, with role="link" and aria-disabled, as a disabled link Button does.
- Switch: a controlled Switch (checked and onChange) no longer logs the React warning "You provided a checked prop to a form field without an onChange handler" while it is pending.
- Alert: dismissing with the focused × no longer drops focus on the page when the next control after the alert is in a disabled <fieldset>. Focus goes to the next control that can take it.
- ErrorBoundary: after Try again, focus no longer falls to the page when the first control in the recovered content is in a disabled <fieldset>. It goes to the first control that can take focus.
- Toolbar skips a control hidden by CSS (display: none). The arrow keys no longer stop on it, and it no longer takes the Tab stop, which had left the whole toolbar out of the Tab order.
- Calendar (and DatePicker) with no value opens on the month of min or max when today is outside them, with focus on that day. Before, it opened on today's month, where nothing could be picked.
- DateRangePicker with no start date opens its popup on the month of min or max when today is outside them. Before, it opened on today's month, where nothing could be picked.
- Menu and ContextMenu skip an item hidden by CSS or the `hidden` attribute. Before, opening the menu or pressing an arrow, Home or End could aim focus at it, and focus stayed stuck where it was.
- Tabs skips a tab hidden by CSS or the `hidden` attribute when the arrows, Home or End move between tabs. Before, it selected the hidden tab (showing its panel) while focus stayed where it was.
- RadioGroup's arrow keys no longer wrap to a radio hidden by CSS. Before, they checked the hidden radio while focus stayed where it was.
- Accordion's Down, Up, Home and End skip an item hidden by the `hidden` attribute or CSS, such as an FAQ filtered by a search. Before, focus stuck on the title it was on.
- A Slider a level down in a Field (in a row with its unit after it) gets the Field's label, hint, error and disabled, as other controls do; it was unnamed and stayed enabled.
- A SegmentedControl a level down in a Field (in a row with a note after it) gets the Field's label, hint, error, required and disabled, as other controls do; it was unnamed and stayed enabled.
- A ColorPicker a level down in a Field (in a row with a note after it) gets the Field's label, hint, error, required and disabled, as other controls do; it was unnamed and stayed enabled.
- A Slider in a Field with an error puts aria-errormessage on its thumbs, where aria-invalid is, instead of on its root <div>, where screen readers never looked for it.
- A Rating in a required Field, or given aria-required, says it is required (aria-required on its radiogroup); the attribute was dropped.
- A click on a Field's label, or ref.current.focus() (a form library focusing the first invalid field), focuses the Rating's picked star, or else the first; nothing was focused.
- Ref.current.focus() on a RadioGroup (a form library focusing the first invalid field) focuses its checked radio, or else the first that can be picked; nothing was focused. aria-required given to the group is kept.
- Ref.current.focus() on a CheckboxGroup (a form library focusing the first invalid field) focuses its first box that can be checked; nothing was focused.
- AutoFocus on a CheckboxGroup focuses its first box; it did nothing.
- AutoFocus on a Rating focuses the picked star, else the first; it did nothing.
- AutoFocus on a RadioGroup focuses the checked radio, else the first; it did nothing.
- AutoFocus on a TypeToConfirm focuses its field; it went to the wrapper <div> and did nothing.
- CopyButton in a Dialog or Drawer on a page without the Clipboard API (plain http) copied nothing while it said "Copied": its fallback put the text behind the modal, where it can't be selected. It now puts it inside the dialog.
- RelativeTime with a day on its own ("2026-10-24") showed the date instead of "7 days ago" a day early: absoluteAfter now counts calendar days, as the words do, so 7 days ago and in 7 days both stay words.
- An ErrorSummary link to a field in a closed AccordionItem, or on a tab that isn't selected, did nothing. It now opens the item (or selects the tab), as the browser does for find-in-page, and focuses the field.
- A required field in a closed AccordionItem stopped the form's submit with nothing shown, since the browser can't point at a hidden field. The item now opens, the field takes focus and the browser says what's missing.
- Link: with `external`, a last word longer than the line (a long name, a URL) now breaks inside the word instead of running past a narrow screen. The new-tab icon still never starts a line on its own.
- Combobox and TimePicker leave Ctrl or ⌘ with the arrows and Page keys to the system and the browser (⌘+↓ to the end of the text, Ctrl+PageDown to the next tab) instead of opening or moving through the list. Alt+↓ still opens it (L8E35).
- LoadMore: inside a shadow root, loading the last page from the button moves focus to the end text, and a load keeps the focused button in view, as on the page. Before, focus fell to the body, because LoadMore read `document.activeElement`, which is the shadow host there.
- A masked Input now runs your onKeyDown before its Backspace and Delete caret skip, so preventing the key there leaves the caret alone. The skip also waits while an input method is composing (L8E31).
- Menu and ContextMenu leave Alt, Ctrl or ⌘ with the arrows, Home or End to the browser, on the trigger and in the open menu, so shortcuts such as ⌘+↓ (to the page's end) work with focus there (L8E36).
- Menu: inside a shadow root, ArrowDown and ArrowUp now move from the item that has focus. Before, every press went back to the first item, because Menu read `document.activeElement`, which is the shadow host there. Hovering an item, choosing one, and where a ContextMenu returns focus also read the menu's own root now.
- Navbar: in the dark themes, a sticky bar now shows that it has lifted. Once the page scrolls under it, the bar also turns the lighter raised surface (the new `--navbar-bg-scrolled`, default `surface-raised`), since its shadow barely shows on a near-black page. The light themes look the same as before.
- Navbar: a brand given as plain text ends in an ellipsis on a small screen instead of running under the actions.
- Navbar: a brand given as plain text is wrapped in a span, so on a small screen it really ends in an ellipsis instead of being cut off mid-word.
- FormattedNumber, formatNumber and TableCell no longer show a negative zero: a small negative value that rounds to zero is written as zero ("$0.00", not "-$0.00"; "0%", not "-0%"), and -0 is "0". A real negative keeps its minus, and a signDisplay of your own is kept.
- A page with two copies of serupa-ds (two versions installed by different packages, or two apps built apart) keeps one list of open modals and one pair of live regions. A Dialog from one copy now takes the other copy's live regions inside it, so what that copy announces is heard while the dialog is open.
- Pagination: before the script runs (server HTML ahead of hydration, or with JavaScript off), a long row now wraps onto more lines instead of running off a narrow page, and a page number never breaks across lines. Once mounted, the row stays on one line and steps its siblings and boundaries down to fit, as before.
- Pagination: with `total` and `pageSize`, pages that don't fit are cut down again instead of spilling past the start edge, off screen and out of reach.
- PhoneInput: inside a shadow root, an edit in the middle of the number keeps the caret where you typed, as on the page. Before, it jumped to the end, because PhoneInput read `document.activeElement`, which is the shadow host there.
- Popover: inside a shadow root, opening it now focuses its first control, as it does on the page. Before, it found no control that took focus and focused the panel instead, because it compared `document.activeElement`, which is the shadow host there.
- Prose: an iframe, svg, canvas or embed with a width attribute is held to the column, so a video embed no longer makes the page scroll sideways. Code blocks read left to right on a right-to-left page.
- Alert: dismissing it with the focused × inside a shadow root moves focus to the next control in the same shadow root, as it already did on the page (GR60). Before, it read `document.activeElement`, which inside a shadow root is the host, so focus fell to the page once the alert was removed.
- Inside a shadow root, the shared focus helpers now read focus and ids from the element's own root rather than the page's. A control that disables itself hands focus on, as Pagination's and Carousel's arrows do at the ends. Pressing a Textarea's padding focuses the field. A form named by a `form` attribute resets the controls in it. A clear button reads its field's `aria-labelledby` name.
- Sidebar: inside a shadow root, collapsing or expanding keeps focus in the item it was in, as it does on the page. Before, focus fell to the body, because Sidebar read `document.activeElement`, which is the shadow host there.
- The Serupa skill for coding agents and the accessibility checklist in the foundations guide said to give every IconButton an `aria-label`. IconButton's name is its required `label` prop, and its type leaves out `aria-label`, so an agent that followed the skill wrote code that didn't type-check. Both now say `label`.
- The Serupa skill for coding agents now says which feedback to use: `toast()` (with one `<Toaster />`) to confirm that something worked, `Alert` for a message that stays until it's dealt with, and `SaveStatus` for autosave. In the skill eval, an agent with the skill used an inline Alert for "saved"; with this rule it calls `toast()`.
- Slider: a mark label or the value chip near an end is fitted inside the slider again when its text changes width on its own, such as when a web font loads after the first render. Before, it kept the nudge measured with the fallback font and could hang past the slider or sit off its point.
- SortableList: with an item picked up, pressing another row's handle drops the item in that row's place again, as it is meant to. Before, an ordinary press (held for more than a frame) moved focus to the other handle first, which cancelled the pick-up, and the click then picked up the other row instead.
- SortableList: an item moved with the arrow keys is scrolled into view as it moves, so in a list or row longer than its box (or the screen), the focused item no longer travels out of sight and stays there after the drop (GR69, WCAG 2.4.11). It scrolls only as far as needed, and only once the item has moved.
- Splitter: printed, the panes show their whole content instead of their scrolled windows. The Splitter drops its height, the panes grow to fit, and the separator isn't printed, so a Table in a pane prints every row.
- Splitter: inside a shadow root, when a parent collapses the first pane while focus is in it, focus now moves to the handle, as it does on the page. Before, focus dropped out of the Splitter.
- Stepper: before the script runs (server HTML ahead of hydration, or with JavaScript off), a horizontal Stepper on a narrow screen no longer squeezes its titles to one letter a line. Until it can measure, a title on a phone is never narrower than its longest word, and a row that still doesn't fit scrolls in its own box. Once mounted, it switches to compact as before. Wider screens are unchanged, so nothing moves when the script takes over. Stepper also fits its titles again when web fonts finish loading. Titles drawn first in the fallback font change width when Inter arrives, and the row stayed full with titles broken mid-word, since its own width never changed (GR65).
- Stepper: on a narrow screen before its script runs, the horizontal step list scrolls sideways without dragging the page along with it (`overscroll-behavior-x: contain`), like every other scrolling area.
- `serupa-ds/stylelint` no longer flags names that happen to be colors, or lengths no token can express. `serupa/no-raw-color` now counts a named color only in a property that takes a color, so `grid-area: tan`, `animation-name: orange` and `font-family: Gold` pass. `serupa/no-raw-spacing` now passes percentages and viewport or container units, such as `inset: 50%` or `padding: max(var(--spacing-2), 1vw)`. Hex colors and color functions are flagged as before.
- Table: with `stickyHeader`, a row with `href` scrolled under the header no longer paints its checkbox and buttons over the header, or takes the header's clicks.
- Tabs: the fade at an overflowing tab row's edge follows an eased curve instead of a straight line, so there is no visible edge where it starts.
- Tabs: when the tab row overflows, the fade at an edge now eases in as tabs scroll past it and eases away as the row reaches it, instead of appearing and disappearing at once. A fade that is there when the tabs first show is simply there. Its widths are registered with `@property`, so they can transition. With reduced motion, it still changes at once.
- Tabs: when the selected tab is hidden by CSS or the `hidden` attribute (a responsive class that hides it on a phone, at load or after a resize), the first shown, enabled tab takes the Tab stop, so the tab list stays reachable from the keyboard. Before, Tab went from the control before straight to the panel (GR67, WCAG 2.1.1). The stop goes back to the selected tab once it shows again.
- Tabs: after an arrow, Home or End picked a tab, a controlled value set by a mouse click elsewhere (a Next button, say) made the line or fill jump instead of slide. Tabs now works out whether the last input was a key each time the value changes, as SegmentedControl does, so only a keyboard pick moves it at once.
- Tabs: inside a shadow root, the arrow keys, Home and End now move focus and the selection. Tabs compared `document.activeElement`, which is the shadow host there, so the keys did nothing. A new internal helper reads focus and ids from the element's own document or shadow root. Other components move to it next.
- The components' JavaScript waits are named once, in one place, so waits that must agree can't drift apart. For example, Button's busy wait is the same value as Loader's default delay. No wait changes.
- Toast: on a phone, a long action label wraps onto more lines under the text instead of ending in an ellipsis.
- Toast: only words of 10 letters or more hyphenate, so ordinary words in a narrow toast still wrap whole.
- Toast: with two copies of serupa-ds on one page, a toast() from either copy shows in the one Toaster, and the newest Toaster of either copy shows them all, as one Toaster does today.
- Toast: inside a shadow root, F8 again (or Escape) now takes focus back to the field it came from. Before, it stayed on the toast, because Toaster read `document.activeElement`, which is the shadow host there. Focus is now read through open shadow roots, both for the field F8 leaves and for where focus goes when a focused toast closes.
- Component token descriptions in `design-tokens/components/` now match the component guides. Each README's token table is now made from the component's `<name>.tokens.json`, so it lists every token the package publishes (64 were missing from the guides) with the published default and description.
- Toolbar: when the window narrows after load and a breakpoint hides the control holding the toolbar's Tab stop (`display: none`), the stop now moves to a control that's still shown. Before, nothing re-rendered, and Tab skipped the whole toolbar (WCAG 2.1.1).
- Tooltip: Escape pressed while the pointer rests on its element, before the delay is up, now cancels the show, so the tooltip no longer appears after it was dismissed.
- Tooltip: a link, button or field in `content` now warns once in development (`tooltip-interactive`). Nobody can use it: focus leaving the element hides the tooltip, touch screens never show it, and a link on the tooltip's fill reads under 4.5:1. The guide points to Popover for anything people press.

## [12.0.0] - 2026-10-31

### Added

- Base.css: a bare link (an `<a href>` from Markdown, a CMS or plain HTML, with no class) now looks and behaves like `<Link>`. It wraps a long URL instead of widening the page at 320px (WCAG 1.4.10), draws Link's 1px underline that thickens to 2px on hover (so hover isn't shown by color alone), and reads the `--link-text`, `--link-text-hover`, `--link-thickness`, `--link-thickness-hover` and `--link-offset` tokens, so setting `--link-text` on a section recolors its plain links too. An `<a>` with no href (an anchor target, a router link before it hydrates) now reads as text: the surrounding color, no underline. On iOS Safari a bare input, select or textarea gets 16px text, as Input already does, so focusing it no longer zooms the page. Every rule stays at zero specificity, so any class still wins.
- Combobox takes the type of its values: `Combobox<'red' | 'green'>`, or inferred from `options`, so `onValueChange` gets that union (a list of it with `multiple`); given, a `value` or `defaultValue` outside it is a type error. `options`, `value` and `defaultValue` also accept readonly arrays. Untyped use is unchanged (`string`).
- Dialog's `finalFocus`, where focus goes when it closes. A confirmation that deletes the row it was opened from took away the button focus went back to, so focus fell to the top of the page; point `finalFocus` at the next row or the list's heading instead.
- Drawer's `initialFocus` and `finalFocus`, as Dialog has: where focus lands when it opens, and where it goes when it closes (the next row, when the drawer deleted the one it was opened from).
- The plain-page script is about a fifth of its size: `serupa.iife.js` goes from 610 KiB to 119 KiB gzipped (3.1 MB to 372 KB raw), because the full Material Symbols table moved back into `serupa-icons.iife.js`. The components' own icons and the everyday ones stay in `serupa.iife.js`. The first time an Icon names any other icon, `serupa.iife.js` adds `serupa-icons.iife.js` to the page from its own folder (same origin, so `script-src 'self'` still covers it), so pages need no change as long as the two files sit side by side. A page that names many icons can include `serupa-icons.iife.js` after `serupa.iife.js` to draw them on the first try. Pages with Trusted Types enforced should include it that way, since a script added at run time needs a policy there.
- Pagination: `total` and `pageSize` show a summary before the pages, such as "21–30 of 245", in the locale's digits and grouping. The pages sit at the end of the row and wrap under the summary when both don't fit. New label `itemsOf`, and tokens `--pagination-summary` and `--pagination-summary-gap`.
- SegmentedControl takes the type of its values: `SegmentedControl<'list' | 'board'>`, or inferred from `options`, so `onValueChange` gets that union; given, a `value` or `defaultValue` outside it is a type error. Untyped use is unchanged (`string`).
- Text: `measure` caps a line at about 65 characters (`container-prose`, 65ch in the text's own size), for running text on a wide page: an article's paragraphs, a long description, help text. It's the width `max-w-prose` and Container's `size="prose"` give, without needing the utility classes.

### Changed

- **Breaking.** Removed (Badge): the press ripple on clickable badges, with its `.dk-badge__ripples` layer and the `--badge-ripple-opacity`, `--badge-ripple-duration` and `--badge-ripple-fade-duration` component tokens. **Migration:** there is no replacement; remove any of those tokens you set, and any styles aimed at `.dk-badge__ripple`. The press (shrink to 97%) stays as it was. The `motion-ripple` and `motion-ripple-fade` tokens stay, for ripples of your own.
- Badge: letting go of a press now comes back to size on `ease-enter` over `motion-release` (300ms), with no overshoot, as on Button.
- Badge: when loading starts, the content blurs a little (`blur-xs`) as it fades out and the ring sharpens from the same blur as it fades in, as on Button. Not under reduced motion.
- RelativeTime shows the date, not words, for a moment more than 7 days away, ago or ahead: "Oct 24, 2026" rather than "340 days ago" (KW8). The exact date and time stay in the tooltip. The new `absoluteAfter` prop sets the number of days, and `absoluteFormat` how the date is written (default `{ dateStyle: "medium" }`). `relativeTime()` is unchanged and always gives words. **Migration:** to keep words however far away, as before, pass `absoluteAfter={false}`. A NotificationCenter or SaveStatus time older than a week now shows its date too.

### Fixed

- Dismissing an Alert from its × moved focus to the next focusable element even when it was out of the Tab order, such as the first tab of a tab list whose selected tab is another. Focus now goes to the next element in the Tab order.
- Tabs, SegmentedControl, ColorPicker swatches, Calendar, Slider, Splitter and Carousel's dots took the arrow keys even with Alt, Ctrl or ⌘ held, so Alt+← (back a page on Windows and Linux), ⌘+← and other browser and system shortcuts did nothing while one of them had focus. With a modifier held (Shift still counts as before), the keys are now left to the browser, as Toolbar and Radio already did.
- Accordion, NumberInput and PinInput no longer take the arrow keys, Page keys, Home or End when Alt, Ctrl or ⌘ is held, so browser and system shortcuts such as Alt+← (back) work with focus there (L8E29).
- Docs: a "Build a page" guide lists what the page around the components sets (doctype and charset, `lang` and `dir`, a viewport that lets people zoom, a title per route, one `h1` and the landmarks, a skip link, focus after a route change, `theme.js` first, and preloading Inter's one variable file), with where each is shown. Getting started's plain-page sample now has a doctype, `<meta charset>`, a `<title>` and a `main`, links `components.css` instead of the 2 MB `bundle.css`, and preloads the font. Before you ship says to compress the files and serve them from a folder named for the version, cached for a year.
- Carousel: a swipe follows where the release is heading. Let go while pulling back and it springs back; with `perView`, a hard flick moves to the slide it heads for, a whole view at most (KW11).
- ColorPicker: a phone keyboard no longer autocorrects or capitalises the hex field ("fade00" stays as typed) (QA2).
- ColorPicker reads an opaque color written with its alpha, as design tools and token files export it ("#1D4ED8FF", "#14df"), and rgb() as browser devtools copy it ("rgb(29, 78, 216)"), in `value`, swatches and the hex field; a see-through color is still refused (L8E11).
- Combobox: autocapitalize is off on the field, so a phone doesn't capitalize the first letter typed. Pass `autoCapitalize` to set your own.
- A required Combobox with `multiple` blocked its form even with tags picked, since the native check looked at the empty text field. It now passes once a tag is picked, and is still announced as required.
- DatePicker, DateRangePicker and Calendar read an ISO date and time as an API sends it ("2026-10-24T00:00:00Z", "2026-10-24 09:30:00") as the day it writes, instead of showing nothing; a development warning (`datetime-string`) says to pass the "yyyy-mm-dd" day (L8E10).
- DatePicker and DateRangePicker read a date pasted with its month as a word, in the locale or in English, in full or cut short ("12 Mei 2025", "May 12, 2025", "12. März 2025"), instead of rejecting it (L8E8).
- A `modal={false}` Drawer taken off the page moved focus back to its opener even when people had moved on to the page; it now does that only when focus was inside it.
- Drawer: a gentle flick toward the edge now closes it. The swipe speed needed is 0.2px per ms over the last 100ms, down from 0.5, so a light flick no longer springs back (KW5a). A drag away from the edge now gives a little against growing resistance, up to 24px, instead of stopping dead. The panel's background extends past its edge so no gap opens. The panel is now `position: relative`, so absolutely positioned content inside it is placed against the panel. Carousel's rubber band moves to a shared helper, with no change to how it behaves.
- Drawer: a swipe let go short of a third, but still moving toward the edge, now closes the drawer if its momentum would carry it past a third, as a scroll would (keeping 0.99 of its speed each ms, so 0.15 px/ms carries on about 15px). Before, it sprang back from its last position unless it was a flick. A drag that has stopped still springs back.
- After Try again (or `reset()`, or a `resetKeys` change) in an ErrorBoundary, focus went to the first focusable element of the content that came back even when it was hidden (`display: none`), so focus fell to the top of the page, or out of the Tab order, such as a tab that isn't the selected one. It now goes to the first part that is shown and in the Tab order.
- FormatFileSize: a size just under the next unit is written in it, as FormattedNumber `format="bytes"` already does: 1,048,575 bytes is "1 MB", not "1024 KB".
- FileUpload's `accept` takes the names a file picker treats as one, so `.jpg` lets photo.jpeg in (and .jpe, .jfif), `.tiff` a .tif, `.html` a .htm, and `image/jpg` (often written for image/jpeg) a JPEG, instead of refusing a file the picker offered (L8E12).
- Combobox and Highlight matched Greek words ending in sigma only one way: a search typed in capitals ("ΑΣ") found nothing, because lowercasing writes a final ς there, and Highlight didn't mark "ΟΔΟΣ" for "οδος". ς now matches σ. Highlight also reads a decomposed letter (macOS file names write й as и plus a mark) as the letter it is.
- Combobox, Highlight and Menu/TreeView typeahead treated hiragana and katakana as different, so "こーひー", as a Japanese IME types it before conversion, didn't find "コーヒー". They now match, as Japanese search does; a voicing mark still makes another word ("カス" isn't "ガス").
- Switching to another window or browser tab while editing an InlineEdit (to copy something, say) saved the half-typed text and closed the field, because the window losing focus blurs the field. The field now stays open until people actually leave it.
- Input: in a box too narrow for its prefix, suffix and count (a 156px grid column with "Rp", "per bulan" and a count, or a wider font before Inter loads), the prefix and suffix now give way with an ellipsis instead of pushing the count out of the box and the row sideways. With room, nothing changes. The full prefix and suffix are still read to screen readers through the field's description.
- A MenuItem's `onSelect` that moved focus itself (to the next row, after deleting the one the menu belongs to) had focus taken back to the menu's button, which the delete then removed, so focus fell to the top of the page. Focus now stays where `onSelect` put it.
- Docs: the Motion foundation starts with "Should it animate?": the four purposes motion may serve, a table of how often something is seen and how much it may move, a keyboard rule (a key repeated from the keyboard answers at once), examples the system turns down, and a Before / After / Why table for reviewing motion. Stagger is for groups seen now and then, never menus or toasts; the `motion-stagger` token's description says so too.
- Navbar: in Firefox, the small-screen menu panel now fades out when it closes instead of vanishing at once.
- NumberInput: a `value` or `defaultValue` with more decimals than the format shows (19.995 USD shown as US$20.00, 1250000000.5 IDR as Rp 1.250.000.001) is now taken as shown. The form sends what people see, and focusing the field and leaving it without an edit no longer changes the value or calls `onValueChange`.
- PasswordInput: autocorrect is off on the field, so a shown password isn't corrected word by word or offered as a suggestion on iOS.
- PasswordInput: in Safari, showing or hiding the password with a click now keeps a selected part of it selected, as it already did for the caret and in other browsers. Safari collapsed the selection to the end on the way to the click, before the toggle read it; the toggle now reads it when the button is pressed.
- PasswordInput: in Safari, typing or selecting straight after showing or hiding the password is no longer undone by the caret being put back a frame later.
- PasswordInput: in Safari, showing or hiding the password keeps a selection that was set by script, instead of collapsing it to its end.
- PhoneInput: in a right-to-left page the calling code now reads "+20", not "20+", both in the prefix and in each country's option ("مصر (+20)"). The prefix is isolated left to right, and the options carry the code in a left-to-right isolate (U+2066 … U+2069).
- PhoneInput no longer turns Alt, Ctrl or ⌘ with Backspace or Delete next to a separator into a single-digit delete, so the browser's word and line deletion works there (L8E30).
- A Popover whose first control was hidden (`display: none`, in a closed `<details>`) or in a disabled `<fieldset>` left focus on its trigger when it opened, so Escape and Tab didn't work inside it. Focus now goes to the first control that can take it, else the panel.
- RelativeTime read a day on its own ("2026-10-24") as UTC midnight, so west of Greenwich yesterday showed as "2 days ago", and a day from this morning as "14 hours ago". It's now that local day, counted in days ("today", "yesterday"), with the date alone as its tooltip and the day as its `datetime`.
- SegmentedControl: with `fullWidth`, when a label is too long for its equal share, the segments share the width by content instead (still filling it), so a short label gives its spare room to a long one rather than both being cut (GR50).
- UseShortcut matched a letter by its key's position even when the key typed another Latin letter, so on AZERTY Ctrl+A (the key in Q's place) could run a Ctrl+Q shortcut, and on Dvorak most letter shortcuts collided. A letter now matches by position only when the key types no Latin letter (Option on a Mac, a Cyrillic or Greek layout).
- Sidebar: collapsed, the header and footer stay inside the 64px rail. A long name ends in an ellipsis instead of spilling over the page.
- SortableList: a long single word wraps inside its row, so a narrow list no longer makes the page scroll sideways (RF1, WCAG 1.4.10).
- Splitter: pressing Enter (or double-clicking) again while the collapse or expand slide is still running now turns it back from where the handle is, with the first pane's clip at the same place. Before, the handle jumped to the far end and slid from there.
- Stepper: a long single word in a step title wraps, in the line under the circles on a narrow screen and in a vertical stepper, so the page no longer scrolls sideways at 320px (RF1, WCAG 1.4.10).
- `theme.js` reads the saved theme again when a page comes back from the back/forward cache, so a theme picked in another tab while the page sat there is applied on return, also in a browser that doesn't deliver that storage event to a cached page.
- TimePicker: a phone keyboard no longer autocorrects or capitalises a typed time, and spellcheck no longer underlines "9:30pm" (spellCheck, autoCorrect and autoCapitalize are off unless you set them) (QA1).
- TimePicker reads a `value`, `defaultValue`, `min` or `max` with seconds ("09:30:00", as a database's time column and `<input type="time">` can give it) instead of showing nothing, and a typed or pasted "14:05:30" reads as 14:05 (L8E9).
- Toast: a long word in the title or description breaks where its language hyphenates it, with a hyphen, before it's cut anywhere. It follows the nearest `lang`.
- Tokens.css is less than half its size (95 KB to 41 KB, 18.7 to 7.4 KiB gzipped): it no longer carries a comment with each token's description. It is the first stylesheet every page waits for, and the comments were 58% of it. The descriptions are still in tokens.json, design-tokens/, the Foundations pages and the editor hover text (serupa-ds/vscode/*), which now reads them from tokens.json. The variables and their values are unchanged.
- TypeToConfirm didn't match a phrase typed with a Japanese or Chinese IME left in full-width mode ("ｍｙ－ｒｅｐｏ"), or with a no-break or doubled space from a copied name. Both now match; other differences still don't.
- Switching to another window or browser tab while typing in ColorPicker's hex field or a DateRangePicker field treated the half-typed text as finished: the hex went back to the current color, and a partial date was rejected with `onInvalidInput` and cleared. The text now waits until people actually leave the field, as in Combobox, DatePicker, TimePicker and NumberInput.
- Switching to another window or browser tab while typing in a Combobox, DatePicker, TimePicker or NumberInput (to copy something, say) treated the half-typed text as finished: the window losing focus blurs the field, so a partial date, time or number was rejected with `onInvalidInput` and put back, and Combobox put back the picked label. The text now waits until people actually leave the field.

## [11.0.0] - 2026-10-30

### Added

- A skill for coding agents, `skills/serupa/SKILL.md`, shipped in the package: how to install and theme Serupa, which component fits which job, tokens only, and the accessibility rules the app must follow. Add it with `npx skills add diki-stwn/serupa-ds`, or copy it from `node_modules/serupa-ds/skills/serupa/`.
- `start-` and `end-` utilities for every spacing step and fraction, with negatives (`start-4`, `end-1/2`, `-start-2`), the same as `inset-s-` and `inset-e-`. The docs already listed them, but only `start-auto`, `-full` and `-px` existed, so `start-4` did nothing.
- `theme.js` keeps `<meta name="theme-color">` on the page's surface, so on phones the status bar and the browser's address bar change with light and dark mode in all six themes. Before the stylesheets arrive it uses the token values (white, zinc-950); after, the body's own background, so a page that changes `--surface` gets its own colour. A `theme-color` meta the page writes itself is left as it is.

### Changed

- **Breaking.** Removed (Badge): the last of the `size` prop, which 4.0.0 removed. Badge no longer holds it back or warns about it (the `badge-size` warning is gone), so a `size` still passed from plain JavaScript now reaches the `<span>` as an ordinary attribute. TypeScript already rejected it. **Migration:** remove `size` from your badges; badges have one size (20px, `text-xs`). Nothing else changes.
- **Breaking.** Removed (Button): the press ripple, with its `.dk-btn__ripples` layer and the `--button-ripple-opacity`, `--button-ripple-duration` and `--button-ripple-fade-duration` component tokens. **Migration:** there is no replacement; remove any of those tokens you set, and any styles aimed at `.dk-btn__ripple`. The press (shrink to 97%) stays as it was.
- Button: letting go of a press now comes back to size on `ease-enter` over `motion-release` (300ms), with no overshoot; before, it sprang back on `ease-spring` and went about 9% past full size.
- Button: when loading starts, the label and icons blur a little (`blur-xs`) as they fade out and the spinner sharpens from the same blur as it fades in, so the two read as one change. Not under reduced motion.
- **Breaking.** Removed (RadioGroup): the `onChange(value, event)` alias, deprecated in 9.2.0, and its `radio-group-onchange` warning. TypeScript now rejects `onChange` on a RadioGroup; from plain JavaScript it reaches the group `<div>` as an ordinary change handler and gets the radios' bubbling change event, not `(value, event)`. **Migration:** rename `onChange` to `onValueChange` on each RadioGroup; it takes the same `(value, event)`. A single Radio's `onChange` is the native input event, as before.
- **Breaking (TypeScript only).** Changed (SidebarItem): its ref and event handlers are typed for `HTMLElement` instead of `HTMLAnchorElement`, because a group item renders a `<button>`, not a link: the old types promised an anchor that a group's ref and `onClick` never got. Nothing changes at run time. Handlers and refs you typed for `HTMLAnchorElement` still compile; what no longer compiles is reading an anchor-only property, such as `e.currentTarget.href`, from an inferred event, or `React.ComponentRef<typeof SidebarItem>` used as an anchor. **Migration:** on a link item, narrow first (`if (e.currentTarget instanceof HTMLAnchorElement) …`) or read the value from your own props; for a ref, type it `React.Ref<HTMLElement>`.

### Fixed

- AvatarGroup: a group too long for its box wraps onto more lines, each starting at the same edge, instead of widening the page on a phone (GR4).
- Avatar's initials in Arabic and other scripts whose letters join no longer join into a word. "محمد عبد الله" showed "ما" (the word "what"). The two initials are now kept apart with a zero-width non-joiner, so they show as two letters. This also applies to `initials()` and AvatarGroup (GR28).
- AvatarGroup's "+N" avatar is written in the locale's digits, as Badge's count already is: "+٣" and "٩٩+" in Arabic instead of "+3" and "99+" (GR22).
- Button: in a flex row, a button with a long label now shrinks to its ellipsis instead of pushing the buttons beside it out of the row. Icon-only buttons and IconButton keep their square (GR5).
- Calendar: in Arabic, Persian, Hebrew and Vietnamese the weekday headers use the locale's narrow names, because the short name there is the full word or two words. They no longer run together or widen the grid. Screen readers still hear the full name (GR6).
- Card: in Safari, pressing a linked card near its edge no longer makes it spring back while the button is still held. The card shrinks as it's pressed, which left the pointer outside it, and Safari then dropped the press. The link now reaches a little past the edge while the card is pressed.
- CardHeader: in a narrow card the action drops under the title instead of squeezing it until words break mid-word (GR7).
- A Ctrl, Cmd, Shift or middle click on a linked Card opens another tab only for a web, `mailto:` or `tel:` link; a `javascript:` URL no longer opens a blank tab.
- Carousel docs: slides with text need at least 40px of inline padding while the previous and next buttons are on, so the buttons don't cover the ends of their lines on a phone (GR8).
- ColorPicker's hex field reads a code typed in full width by a Japanese or Chinese IME ("＃１Ｄ４ＥＤ８"). Before, it was refused as not a color (L8E2).
- In ColorPicker's hex field, the Enter that confirms an input method's text (a Japanese or Chinese IME) no longer picks or rejects the code mid-typing; the next Enter does (L8E5).
- ColorPicker's README lists the `--color-picker-invalid` token, which colors the swatches' border while invalid. It was in the tokens file and the CSS but missing from the table, so a theme couldn't find how to restyle the invalid state (GR19).
- CopyButton: the copy icon now cross-fades into the check instead of swapping instantly (KW18). Under `prefers-reduced-motion` it's a plain fade.
- DateRangePicker: on a phone, where the two months stack, the popup is one month wide and keeps 8px from both sides of the screen instead of running to its right edge (GR9).
- Divider: a label word longer than the line (a German compound, a URL) wraps between two short lines, so the page no longer scrolls sideways at 320px (WCAG 1.4.10).
- ErrorSummary: a link to a RadioGroup or a Rating by its id focuses the checked radio, or else the first one that can be picked, instead of leaving focus on the link (GR15).
- Fab: an extended FAB in a corner is never wider than the screen less its offset on both sides, so on a phone a long label ends in an ellipsis instead of pushing the icon off the screen (GR14).
- FileUpload: as the direct child of a grid or flex container, a long file name now gets its middle cut as it does elsewhere. Before, the name widened the FileUpload, in one case to 459px at a 320px width, and the page scrolled sideways, in RTL off the left edge (GR30).
- Resetting the form empties an uncontrolled FileUpload's list along with its input, instead of showing files the form no longer sends; a controlled list keeps its files on the input (L8E6).
- FileUpload cuts a long file name in the middle, as Finder and Drive do. The last few characters and the extension stay visible, so "report-2025.pdf" and "report-2026.pdf" no longer look the same. The full name is the row's title, and screen readers read it once. The name is laid out in its own direction, so a Latin name in a right-to-left page isn't cut at its end (GR17).
- FileUpload writes file sizes in the reader's locale, the same way FormattedNumber `format="bytes"` does: "4,8 MB" in Indonesian and German, "2 kB" in English, Arabic digits in Arabic. This covers each listed size and the size in a "larger than" refusal. Each size is isolated with `dir="auto"`, so an English size in an RTL page no longer shows as "KB 2". `formatFileSize(bytes, locale?)` takes an optional locale and is unchanged without one (GR20).
- Combobox filtering, Highlight and typeahead keep Cyrillic й, ў and ї apart from и, у and і. Matching dropped their marks as if they were accents, so typing "мои" also found "мой" and "Киів" found "Київ". "ё" still finds "е", the way people type it (GR41).
- Combobox filtering, Highlight and typeahead no longer treat different words in Hindi, Bengali, Tamil, Thai or Japanese as the same. Matching dropped every combining mark, so typing "कम" also matched "काम", "ไข่" matched "ไข้" and "カス" matched "ガス". Now only accents are ignored, the same as before for Latin, Greek, Vietnamese, Arabic and Hebrew. Vowel signs, tone marks and Japanese voicing marks are kept (GR29).
- NumberInput and TimePicker read what a Japanese or Chinese IME types in full-width mode. "１４：０５" and "午後２：０５" were refused as times. "１，５００．５" was not read as a number, and "－５" became 5, losing its minus sign. Typed text is now normalized (NFKC) first, so it reads the same as half width (L8E1).
- Heading breaks one long word or URL inside a flex row or grid column instead of widening it (`overflow-wrap: anywhere` in place of `break-word`); in a plain block it wraps as before.
- Highlight breaks a word longer than its box (a URL, a German compound), so at 320px the page no longer scrolls sideways (WCAG 1.4.10 Reflow).
- Icons, loaders, the Progress ring and Rating's stars no longer stretch to the width of their container before the stylesheet arrives. Each inline svg now carries `width="1em" height="1em"`, so on a slow page, or when bundle.css fails to load, an icon stays the size of the text around it instead of drawing a giant icon and then jumping when the CSS lands. The CSS still sets the size (FEC7).
- Image: with a fixed `ratio` and no size of its own, the frame now takes its container's width, so it has its shape while the picture loads and keeps it if the picture fails. Before, it was 0x0 while loading and a 62px stub when broken, and the page jumped when the picture arrived (GR21). Give the frame (or the picture) a width for a smaller one.
- Image: in Firefox, a new `src` shows as loading until it arrives, instead of briefly as loaded with the old picture.
- Image: in Safari, a picture with `srcSet` no longer shows as broken for a moment as it mounts, which also hid the `viewable` button until the picture arrived. Safari says such an image is complete before it has picked a candidate. That no longer counts as a failure, and its load or error event decides.
- An Input with a mask keeps digits typed on an Arabic-Indic or full-width keyboard as 0-9 in its value, so a card number typed as ٤٢٤٢ or ４２４２ submits 4242 (L8E3).
- A masked Input with a leading prefix ("+62 999-9999-9999") reads an autofilled or pasted "+6281234567890" or "+62-812…" as 812…, instead of taking the prefix's 6 and 2 as typed digits (L8E7).
- Input: the box can now be narrower than the native field's own width (about 244px, more with a prefix, suffix or count), so in a grid cell or a flex row it takes the room it's given instead of pushing the page sideways (GR23). The same holds for the fields built on it: Combobox, NumberInput, SearchInput, PasswordInput, PhoneInput, DatePicker and TimePicker. Beside a button in a flex row, give it `className="flex-1"` so it takes what the button leaves.
- Link breaks a long URL used as its text inside a flex row or grid column instead of widening it (`overflow-wrap: anywhere` in place of `break-word`); in a sentence it wraps as before.
- List's guide and its example now give an Avatar beside a written name `alt=""`. Each row link was read with the name twice ("Ada Lovelace Ada Lovelace ada@example.com"), and apps copy the example (TF4).
- LoadMore: after a load from the focused button, the button (pushed down by the new items) is scrolled back into view, so keyboard users see where they are instead of pressing again off screen. The README now says that a rejected `onLoadMore` promise is the caller's to show (GR2).
- LoadMore: a long `label` wraps onto more lines on a phone instead of being cut off with an ellipsis (GR1).
- On a narrow screen, a Menu submenu with no room on either side no longer runs off the edge of the screen; it slides back over its parent menu (WCAG 1.4.10). The same applies to any anchored layer whose min-width is wider than the room beside its anchor.
- Navbar: the small-screen links panel fades in and unrolls from the bar when it opens, and fades out when it closes, instead of appearing and vanishing at once. Reduced motion keeps only the fade (GH2).
- Navbar's small-screen menu panel wraps a long link label, and breaks an unbroken word, instead of scrolling sideways or cutting it off at 320px (WCAG 1.4.10).
- NotificationCenter's unread dot no longer disappears in forced colors (Windows high contrast). It had only a background, which forced colors painted as Canvas, the same as the drawer. It's now drawn in CanvasText, as Badge's indicator is (GR27).
- NotificationCenter's "Mark as read" buttons are each described by their row's title, so a screen reader hears "Mark as read, button, Invoice paid" rather than the same bare "Mark as read" on every unread row. The hover tooltip stays (TF4).
- PhoneInput reads digits typed on an Arabic, Persian or Bengali keyboard, or full width from a Japanese or Chinese IME (and a full-width "＋"). It dropped them, so someone in Egypt typing ٠١٠… saw nothing entered. They're now read as the ASCII digits they stand for, and the E.164 value is unchanged (GR43).
- PinInput keeps digits typed on an Arabic, Persian or Bengali keyboard, or full width from a Japanese or Chinese IME. It dropped them as "not a digit", so someone typing ٤٥٦٧ saw nothing happen. They're now read as the ASCII digits they stand for, so the value is still 0–9 (GR42).
- PinInput size `sm` no longer zooms the page on iPhone when focused. Its hidden field took the 14px text, under the 16px at which iOS Safari zooms into a field. On iOS it now takes 16px, as Input, Select and Textarea do. The field is transparent, so nothing changes on screen (PT2).
- PinInput wraps a code that doesn't fit on one row even at 24px boxes onto a second row, so at 320px the page no longer scrolls sideways (WCAG 1.4.10 Reflow).
- Progress breaks a label word longer than the bar (a file name, a URL) and keeps the value's width, so at 320px the page no longer scrolls sideways (WCAG 1.4.10 Reflow).
- NumberInput and the other number fields read typed numbers in Pashto and Uzbek (Arabic script) correctly. With Latin digits these locales write 1.234,5, but the fields took the marks from their Arabic-Indic digits and read "1.234" as not a number.
- Serupa-purge: a mistake on the command line (`-o` or `--css` with no file name, an unknown option, a source or `--keep @file` that isn't there) now ends with a one-line message and the usage, exit code 2, instead of a stack trace or a file written to `undefined`.
- Serupa-purge: a symbolic link to a folder inside a source folder no longer crashes the scan when its name ends like a source file (`lib.js`); linked source files are still read, linked folders are skipped.
- Serupa-purge: a CSS escape for no character (`\0`, a surrogate, past U+10FFFF) in the stylesheet passed with `--css` reads as U+FFFD, as CSS defines, instead of stopping the run.
- Radio warns in development when it has no accessible name (no label and no aria-label), like Checkbox and Switch already did (GR18).
- Radio, Checkbox and Switch warn in development when given `label`. It isn't one of their props, so it landed on the `<input>` as an attribute and named nothing. Put the text in `children` (GR18).
- Rating: server HTML hydrated under a strict Content Security Policy (`style-src-attr 'none'`) shows each star's share again, so a read-only 4.3 no longer shows five full stars (GR10).
- SaveStatus: a new status ("Saving…", "Saved", "Couldn't save") now cross-fades with the one before it instead of swapping at once (KW19). Under `prefers-reduced-motion` it's a plain fade.
- SegmentedControl's `onKeyDown` now gets the root element as `event.currentTarget`, as its type says, instead of the segment button that had focus. It still runs before the control's own arrow-key handling, so `preventDefault()` there still stops it.
- Slider's `onKeyDown` now gets the root element as `event.currentTarget`, as its type says, instead of the thumb that had focus. It still runs before the slider's own key handling, so `preventDefault()` there still stops it.
- Slider: the value chip and the end mark labels move inward near the ends, so they stay inside the slider instead of hanging past it and widening the page on a phone.
- Slider's `showValue` chip writes the number in the locale's digits and marks when there's no `formatValue`, as Badge and Pagination do: "٤٠" in Arabic and "1.500" in Indonesian, instead of "40" and "1500" (GR24).
- Splitter: collapsing the first pane with Enter or a double-click, and bringing it back, now slides instead of snapping (GN3b). The handle and second pane glide on `translate` while the first pane's clip opens or closes with them. Dragging, the arrow keys and a controlled `size` still move at once, and reduced motion snaps.
- Splitter: server HTML hydrated under a strict Content Security Policy (`style-src-attr 'none'`) gives the first pane its size again, so `defaultSize={30}` no longer shows a 4% pane until the separator moves (GR12).
- Stepper: going back to a step with `onStepClick` keeps focus on that step instead of dropping it to the page.
- Stepper: in a grid or flex item it takes the width it's given instead of its circles' width, so eight steps fit a 320px screen in compact mode there too (GN2b).
- Stepper: with many steps on a narrow screen, the lines shrink to 4px and the circles take the `sm` size, so eight steps fit 320px without scrolling sideways (GN2).
- A number given to `TableCell` as its child is written in the locale's digits, so `<TableCell>{318}</TableCell>` shows ٣١٨ under an ar-EG provider, as Badge and Pagination already do. It stays ungrouped, as given (1204 is still 1204 in en-US); for grouping, currency or units, pass `FormattedNumber`.
- Tabs: picking another tab while the line or the pill fill is still sliding starts the new slide from where it has got to, instead of jumping back to the last tab first (GQ8).
- Text breaks one long word or URL inside a flex row or grid column instead of widening it (`overflow-wrap: anywhere` in place of `break-word`); in a plain block it wraps as before.
- Textarea: with `autoResize`, a server-rendered Textarea keeps its rows height after hydration under a strict Content Security Policy (`style-src-attr` without `'unsafe-inline'`).
- Timeline breaks a word longer than its body (a URL, a German compound) in the title, time and content, so at 320px the page no longer scrolls sideways (WCAG 1.4.10 Reflow).
- Toast: a gentle sideways flick (faster than 0.2 px/ms, the same as Drawer) now dismisses a toast; before, a flick had to be faster than 0.5 px/ms.
- Toast: on a phone, a toast's action goes under the text instead of squeezing it to about 90px, where words broke mid-word.
- Toaster: on a short screen, such as a phone in landscape, only as many toasts as fit show, and the rest wait under the "+N more" line, so the oldest no longer runs off the edge out of reach (GQ1b).
- TreeView: the chevron that opens and closes an item is a 24px target (WCAG 2.5.8) instead of 20px, with no change to the layout.
- TreeView: server HTML hydrated under a strict Content Security Policy (`style-src-attr 'none'`) keeps each row's indent, so the hierarchy shows instead of every row sitting at the same level (GR11).
- Ctrl+A (⌘A) in a multiple-selection TreeView picks every item on keyboard layouts whose A key types another script, such as Russian, Greek or Arabic (L8E4).
- TypeToConfirm: a long `confirmLabel` wraps onto more lines instead of making the page scroll sideways on a phone or widening a grid column.
- TypeToConfirm accepts a phrase whose accents were typed or pasted as separate marks. "Café" pasted from a macOS file name, or typed by some Vietnamese input methods, is "e" plus an accent, and it never matched the "é" in the phrase, so the button stayed disabled. Both are now compared in the same Unicode form (NFC). A missing accent still doesn't match (GR40).

## [10.1.0] - 2026-10-27

### Added

- `announcePage()` for single-page apps: after a client-side route change it focuses the new page's main heading and says its title to screen readers, as a full page load would.
- EmptyState `suggestions` and `onSuggestion` show other searches to try after a search that found nothing ("Did you mean: quarterly"), and `onClearFilters` adds a "Clear filters" button. The words are the new labels `didYouMean` and `clearFilters`.
- Input `mask` keeps text in a pattern such as `"9999 9999 9999 9999"`, `"99/99/9999"` or `"AA99 **** **** ****"` as people type, paste or delete. The caret stays after the character it was after, and Backspace or Delete next to the pattern's own text removes the typed character beyond it. A digits-only mask gets the number keyboard on phones.
- `useShortcut(keys, handler, { description, group })` sets up a keyboard shortcut anywhere on the page while a component is mounted. It skips text fields (unless the shortcut has mod), open modals and IME composition, and the newest shortcut wins.
- `<KeyboardShortcuts />` is a help dialog, opened with "?", that lists every described shortcut by group with its keys in Kbd. It also takes `shortcuts` that aren't set up with `useShortcut`.
- LoadMore, the end of a paged list: "Showing 20 of 134" over a Load more button or infinite scroll. Each load says what it added to screen readers ("20 more loaded"), and focus goes to "You've reached the end" after the last page.
- Menu: the other HTML attributes (`id`, `data-*`, `aria-*`) and a ref now reach the menu panel, and the panel's `onKeyDown` runs before the menu's keys.
- NotificationCenter, a drawer of past notifications with read states (an unread dot, "Mark as read", "Mark all as read" and "Clear all"), and useToastHistory, which keeps the toasts shown for it.
- SaveStatus, the status line for autosave: "Saving…", "Saved 2 minutes ago" (kept current), or "Couldn't save" with Try again. "Saved" and errors are announced politely once, and it has Indonesian labels.
- TableActionBar, the bar above a table while rows are selected: "3 selected", your actions for them and "Clear selection". It's a group named by the count, reads a new count out, and when it hides with focus in it, focus moves to the table's "Select all" checkbox.
- `toast.undo({ title, commit, onUndo })` for the undo pattern. It shows a toast with an Undo button and runs `commit` once, when the toast closes without Undo (its time runs out, it's closed, or the page is left), or `onUndo` if Undo is chosen. There is a new `undo` label.

### Fixed

- Accordion: a word longer than the line (a German compound, a URL) wraps in the title and the content, so the page no longer scrolls sideways at 320px (WCAG 1.4.10).
- The shipped CSS drops leading indentation (about 7.5 KB off dist/bundle.css). Rules, banners and line breaks stay as they were.
- Loader and Switch drop their fallbacks for browsers without `color-mix()`. Every supported browser has it, so nothing changes on screen, and the CSS is slightly smaller.
- An Icon name in another spelling, such as `name="Home"` (the export's name) or `"arrow-forward"`, now warns with the name to use ("Did you mean "home"?") instead of only saying the icon is unknown.
- An IconButton given `aria-label` instead of `label` had no accessible name, because it set `aria-label={label}` over it, and the warning said the button needed an aria-label it had been given. `aria-label` now names it, and its title too, when `label` is missing.
- Image: a picture that fails to load stays in the frame, hidden under the fallback, so its className, style, id, data-* and ref keep working and a fixed-ratio frame keeps its size instead of collapsing to 0x0 (GJ1). A failed frame with no size of its own is at least --image-min-size wide.
- List: in right-to-left text, a row's text keeps its start padding on the right instead of sitting flush against the edge.
- The mask utilities' internal variables have shorter names (for example `--dk-mask-bottom-from-color` is now `--dk-mask-b-from-c`), so utilities.css and bundle.css are about 54 KB smaller. The classes and how they render are unchanged. These variables were never documented, but if you set one directly, use the new name.
- Menu: the items arrive with the menu as one, instead of one after another. The same goes for ContextMenu and a MenuSub's submenu.
- Rating: the stars shrink to fit a narrow grid column too, instead of holding the column at the full row's width.
- RelativeTime: with numeric "auto", "yesterday", "last month" and "last year" follow the reader's calendar instead of elapsed time (01:00 seen at 23:00 the same day now reads "22 hours ago"), and an invalid date warns once in development.
- Safari now honours the components' `user-select: none`. Safari reads only `-webkit-user-select`, so the text in Button, Menu, Combobox options, Avatar initials, Breadcrumb separators, Pagination ellipses, Input affixes, icons and the other spots that opt out of selection could still be selected there by a double-click or long-press.
- KeyboardShortcuts: `useShortcut(["G", "I"])` ran on a lone I, since only its last key was matched, and the help dialog listed it as G + I. Keys that aren't one key plus its modifiers are now not set up or listed, with a development warning.
- Sidebar: a group's nested items unfold and fold with its chevron (a fade and a clip from the top, as Accordion does) instead of appearing and vanishing at once.
- Sidebar: in the collapsed rail, an item whose label is an element (a span with a count, a translated node) gets its tooltip too, not only a string label.
- Splitter: when a parent collapses the first pane while focus is in it, focus moves to the handle instead of dropping to the page.
- Tabs: the pill fill slides to a new tab by clip-path instead of scale, so its round corners stay round mid-slide.
- Tabs: the tab list's scrollbar is hidden in Safari before 18.2 as well, which ignores `scrollbar-width`.
- Tabs: a long tab row in a CSS grid track or a flex row scrolls in its box instead of widening the page.
- ToggleGroup: an attached row too wide for its container wraps as separate toggles, as ButtonGroup does, instead of widening the page on a phone.
- ButtonGroup: an attached row in a CSS grid column wraps too, instead of widening the column.
- In TreeView and Menu, a Space typed within half a second of a letter is part of the typeahead word ("my files", "save as"), as in native lists, instead of picking or choosing the focused item.

## [10.0.0] - 2026-10-26

### Added

- `--button-group-divider`, the edge between two attached primary buttons in their text color, which keeps 3:1 on the button in all six themes.
- Calendar `monthYearPicker` shows native Month and Year menus in the header, so people can jump straight to a far month (a date of birth, an expiry) instead of paging month by month. Years and months stay inside `min` and `max`.
- CheckboxGroup with `required`: when the form is sent with no box checked, the browser now says "Select at least one option." Before, it showed its one-box message, "Please check this box if you want to proceed.", which reads as if every box were mandatory. The message is the new `selectAtLeastOne` label, in English and Indonesian (EW1).
- ContextMenu: the other HTML attributes (`id`, `data-*`, `aria-*`) and a ref now reach the menu panel, and the panel's `onKeyDown` runs before the menu's keys.
- EmptyState `announce` says its title and description to screen readers, politely, as it appears. A "No results" shown after a search or a filter was silent for screen reader users (WCAG 4.1.3).
- ErrorSummary, a box shown after a failed submit that lists the form's errors. Each error is a link that moves focus to its field and shows that field's label. The box takes focus when it appears and is named by its heading ("There is a problem" / "There are N problems", with Indonesian labels).
- Field `layout="horizontal"` for dense settings forms. The label sits in a 192px column (`--field-label-width`) on the control's first line, with the hint and error under the control, and the field stacks again on its own when it's too narrow. New tokens: `--field-column-gap`, `--field-label-width`, `--field-control-min-width`.
- Adding and removing files are announced politely ("report.pdf added.", "3 files added.", "report.pdf removed."), with new labels `filesAdded` and `fileRemoved`, in English and Indonesian.
- A dropped folder is refused with the new reason `'folder'` and a message (`fileFolder`), instead of being added as an empty file.
- A file that's already in the list is skipped with a message ("report.pdf is already added.", `fileAlreadyAdded`) and the new reason `'duplicate'`, instead of silently.
- Grid `columns` with `minColumnWidth` is "up to": `columns={3} minColumnWidth="240px"` shows three columns on a wide screen and fewer as they would get narrower than 240px, with no breakpoints. Before, `minColumnWidth` was ignored with a number.
- Grid `fill` stretches a short row's cells across the empty columns (auto-fit), so two cards on a wide screen share the width.
- Heading's `--heading-line-height-1` to `--heading-line-height-6` tokens, to set with a `--heading-size-*` override so a larger size gets its own line height.
- Icon's `mirror` prop. `'auto'` is the default and flips Material Symbols' directional icons (`arrow_forward`, `chevron_right`, `send`, `undo`…) in right-to-left text. `true` flips any icon and `false` flips none.
- Image `darkSrc`, a version for a dark color scheme. It follows the page's theme (`data-theme`, `data-mode`) and swaps when the theme changes, or the screen's preference where the theme follows it.
- Image `dim`, which darkens a loaded photo a shade in a dark color scheme (`--image-dim`).
- Image `sources` puts the picture in a `<picture>` with one `<source>` per version, for another crop on some screens (`media`) or a lighter format (`type`).
- A lazy Image whose `srcSet` lists widths gets `sizes="auto"` (before any `sizes` you give), so the browser loads the file that fits the frame's laid-out width.
- Motion roles for things that change in place and for loops. `motion-change-sm`, `motion-change-md` and `motion-change-lg` (150, 200 and 300ms) time a chevron turning, a panel opening and a fill moving to its value; `motion-loop-blink`, `motion-loop-progress`, `motion-ripple` and `motion-ripple-fade` time the caret, the indeterminate bar and the press ripple; `ease-settle` eases a press or a value arriving. Accordion, Badge, Button, Card, Carousel, Checkbox, Combobox, Drawer, Image, Meter, PinInput, Progress, Radio, SegmentedControl, Sidebar, Slider, SortableList, Stepper, Switch, Tabs and TreeView now use them, with the same timings as before, so changing a role reaches every component that moves that way. The component tokens that time these (`--accordion-duration`, `--progress-duration` and the rest) default to the roles.
- Smoother motion curves. New easings in three strengths, `ease-out-cubic`, `-quart` and `-expo`, `ease-in-cubic`, `-quart` and `-expo`, and `ease-in-out-cubic`, `-quart` and `-expo`; `ease-out-back`, which passes the end by about 4% and comes back; three real springs written as CSS `linear()`, `ease-spring-soft`, `ease-spring-snappy` and the wobbling `ease-elastic`, generated by `tools/tokens/spring.mjs`. Three new easing roles use them: `ease-pop` for something small popping into place, `ease-spring` for a press let go springing back, and `ease-celebrate` (elastic) for small, rare moments such as a success check landing, with rules on the Motion page for where it belongs. Each has a utility class (`.ease-out-expo`, `.ease-spring` and the rest). Added: stagger. `motion-stagger` (50ms, the new `delay-50`) is the gap between items of a group arriving one after another and `motion-stagger-limit` (300ms) the longest any item waits. The `stagger` utility class gives each child of its element that delay from its place, as `animation-delay` and as `--dk-stagger-delay` for your own transitions, and the new `animate-enter` class fades content in as it rises 8px into place, so `<ul class="stagger">` with `animate-enter` items lands them one after another. Under reduced motion `animate-enter` only fades and the stagger delays are dropped. Changed: the easing roles take the smoother curves, so every component's motion feels more polished with the same durations. `ease-enter` is now `ease-out-quart` (was `ease-out`), `ease-move` `ease-in-out-cubic` (was `ease-in-out`) and `ease-settle` `ease-out-expo` (was `ease-out`). `ease-exit` stays `ease-in`, which moves from the first frame, so closing never feels sluggish. Nothing to change in your code; set the role back on `:root` (for example `--ease-enter: var(--ease-out)`) to keep the old feel.
- `ease-fling` (`ease-out-cubic`), the curve for something the hand let go of mid-motion carrying on to rest. Changed: a flicked Drawer or Carousel now carries on at the finger's speed. Before, it switched to a speed of its own the moment you let go. The settle runs on `ease-fling` for three times the distance left divided by the finger's speed (between 150 and 400ms), so it starts exactly as fast as the finger was moving and slows to rest. A release from a standstill, or a flick back, returns briskly. Drawer and Carousel now share one gesture-speed helper, so a flick reads the same in both.
- `motion-release` (300ms), the time a press let go takes to spring back. Changed: a press now springs back. Button, Badge, Card, Checkbox, Radio, Switch, SegmentedControl and Stepper still shrink in 100ms while held (`motion-press` with `ease-settle`), and on release they spring back to size with a real spring (`ease-spring`, over `motion-release`) that overshoots a touch and settles, instead of easing straight back. Nothing to change in your code; `--button-press-duration` and `--badge-press-duration` still time the press itself. Under reduced motion nothing scales, as before.
- `motion-sequence` (50ms), the offset between the steps of one entrance. Changed: Dialog and a modal Drawer enter as a sequence. The backdrop starts fading in, and the panel follows `motion-sequence` later, so the page dims and the panel arrives on it. They still leave together. Changed: Menu's items arrive one after another as it opens. Each fades and drops 4px into place `motion-stagger` (50ms) after the one before, counted across groups and capped at `motion-enter-sm`, so a menu of any length is in within 300ms. Closing still fades the menu as one. ContextMenu and submenus do the same. Under reduced motion the items arrive with the menu.
- Toast: swipe to dismiss on touch screens. A toast dragged sideways follows the finger and fades as it goes. Let go past a third of its width, or flicked, it carries on at the finger's speed on `ease-fling` and closes. Otherwise it slides back. Its time stops while it's under the finger. Vertical drags still scroll the page, mouse drags do nothing, and the close button stays for everyone else. Under reduced motion a swiped-away toast fades instead of flying off.
- `withViewTransition(update, { types? })` runs a state change as a View Transition, so what it moves glides to its new place instead of jumping, like a list reordered or filtered, a card expanded, or a layout switched. React state set inside it is flushed before the browser takes its "after" picture. Where View Transitions are missing, the change just happens. Added: `base.css` times every View Transition with `motion-change-md` and `ease-move`, and under reduced motion only crossfades, so nothing travels. That covers your own `document.startViewTransition()` calls too. Added: the utility classes `view-transition-match` (`view-transition-name: match-element`, so each element travels as itself) and `view-transition-none`.
- Popover: the other HTML attributes (`id`, `data-*`, `aria-*`) and a ref now reach the panel, and the panel's `onKeyDown` runs first and can keep Escape from closing it.
- Public types: every component prop has its own description on hover (40 props had none, mostly the second of a pair such as `nextLabel`, `max` and `endLabel`, and pass-throughs such as `href`, `target` and `disabled`). Calendar's four props for DateRangePicker are no longer in the public types, so they don't autocomplete. `TabListProps`, `TableHeadProps`, `TableBodyProps`, `TableFootProps` and `MenuSeparatorProps` are exported like every other part's props. A new check, `tools/test/public-docs.mjs`, keeps all three that way.
- SortableList: a press on a handle without moving picks the row up, as Space does, and a press on another row's handle drops it in that row's place, so a row can be moved without dragging (WCAG 2.5.7).
- Splitter: a press on the handle without dragging, then a press anywhere else in the Splitter, puts the handle there, so the panes resize without dragging (WCAG 2.5.7). Pressing the handle again, Escape or leaving it cancels. New label `splitterPlace`, said after the first press.
- `withoutTransitions(change, element?)` does the same for apps that set `data-theme` on a section themselves.
- TimePicker: the list now enters like Menu, Popover and Combobox. It fades in and grows from the edge facing the field over `motion-enter-sm`, as a transition from `@starting-style`, so closing it mid-way never restarts the motion. Under reduced motion it only fades. The motion gate now opens a TimePicker too.
- Toast `autoDismiss` option. Every toast goes by itself after its duration unless `autoDismiss: false`, which keeps it until it's closed, for a message someone has to act on. `duration: 0` still keeps a toast up too.
- `<Toaster duration autoDismiss>` set the time and whether toasts go by themselves for the whole app; a toast's own options win.
- TypeToConfirm, a field and a destructive button for actions that can't be undone. The button works only once the person types the phrase (usually the name of what's deleted). Enter confirms, paste is allowed, case-insensitive matching is optional, and it has Indonesian labels.
- Input (and the fields built on it), Textarea, Select, Checkbox and Radio show the `invalid` border for a native constraint they fail (`required`, `type="email"`, `pattern`…), once people have edited the field or tried to send the form (`:user-invalid`), never on first paint.
- Input and Textarea can report a failed native constraint (`required`, `type`, `minLength`, `min`, `max`, `step`, `pattern`) in the provider's language rather than the browser's, through a new `invalidValue` label. `idLabels` has Indonesian messages. English keeps the browser's own, and a message set with `setCustomValidity` still wins.

### Changed

- Accordion no longer animates its height (grid-template-rows), which laid the page out on every frame. Opening, the content takes its height at once and unfolds over it with a fade and an opening clip (200ms, ease-enter); closing, it keeps its height while it fades and folds back (150ms, ease-exit), then gives it up. Both are transitions, so a quick second press turns back from where it is. With reduced motion it fades instead of opening at once.
- The README sends sets of ToggleButtons, such as text formatting, to Toolbar.
- Carousel's `label` is optional when the carousel is named another way, by `aria-label` or by `aria-labelledby` pointing at a visible heading.
- DatePicker's and DateRangePicker's calendar popup fades and shrinks back over 100ms when it closes, instead of vanishing (where the browser can keep it in the top layer: Chromium today), with the calendar kept, inert, until the fade ends. It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is. Reduced motion: the fade alone.
- Dialog fades and shrinks out over 150ms when it closes, with its backdrop, instead of vanishing (where the browser can keep it in the top layer: Chromium today). It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is, and a Dialog open on arrival is shown from the first frame instead of fading in. Reduced motion: the fade alone.
- Drawer slides back out to its edge over 200ms when it closes, with its backdrop fading, instead of vanishing (a modal drawer where the browser can keep it in the top layer, Chromium today; a non-modal one everywhere). It slides in with a transition rather than keyframes, so closing it mid-way turns back from where it is, and a Drawer open on arrival is shown from the first frame. Reduced motion: the panel fades instead of sliding.
- The focus ring of Input, Textarea, Select and PinInput now shows at once instead of fading in over 100ms, and still fades out on blur. Focus is never late, PinInput's ring moves straight to the next box as you type, and a field focused as a Popover opens no longer animates on its first frame. That was the last mount motion the motion gate knew of.
- Each locale and set of options builds its Intl.NumberFormat once, so a table of 1,000 numbers re-renders in a fraction of the time.
- Pagination, Breadcrumb, Calendar and Menu draw one chevron that flips, instead of a hidden pair for each direction.
- The generated icon table (`dist/js/material/icons.js`) ships without a source map. The map was 3 MB of the package and had nothing to step through.
- Image's loading placeholder no longer pulses the whole frame's opacity (which also faded the remove button). A lighter band sweeps through the placeholder fill every 2s with `ease-move` (ease-in-out), the same look and timing as Loader's skeleton, on `translate`, which the compositor runs. Right to left it sweeps from the right. With reduced motion or forced colors the fill is still. New token: `--image-shine` (default `surface`).
- Image respects a reader who is saving data (Data Saver or `prefers-reduced-data: reduce`). Only `priority` pictures load at once, and each `srcSet` loads its smallest version.
- With no `fullSrc`, the viewer shows the largest `srcSet` candidate instead of `src`, which is often the smallest.
- The package now says it is not open source: package.json has "license": "UNLICENSED", and a LICENSE file (all rights reserved) ships with it. The open-source works it includes keep their own licenses, in licenses/.
- Loader's text shine and skeleton shimmer now move on `translate`, which the compositor runs, instead of `background-position`, which repainted every frame. They look the same: the same 2s `ease-in-out` sweep, the same stops and colors, and plain text or a still fill under reduced motion and forced colors. The skeleton's bone gets `overflow: hidden` and a `::after` layer three bones wide that slides through it. The text variant's label gets a `.dk-loader__glint` child: a window holding a full-color copy of the words (generated content, so it isn't read and `textContent` is unchanged). In browsers without `color-mix()` the words are plain text, as before. Right to left, both sweep from right to left.
- Menu, ContextMenu and MenuSub's submenus fade and shrink back over 100ms when they close, instead of vanishing (where the browser can keep them in the top layer: Chromium today), with their items kept, inert, until the fade ends; a submenu open when its menu closes now closes with it. They enter with a transition rather than keyframes, so closing one mid-way turns back from where it is, and a Menu open on arrival is shown from the first frame. Reduced motion: the fade alone.
- A Menu opens as its button is pressed with a mouse, so the pointer can be dragged onto an item and let go there to choose it. A quick click still opens it and leaves it open; touch, pen and keys are as before, and a trigger with its own `onClick` still opens on the click.
- One spinner across the library (EE1). Loader's ring is now a quarter arc on its track that turns once a second (`motion-loop-spinner`, `ease-linear`), instead of an arc that grew and shrank as it turned every 2s. Only the drawing turns, so nothing is repainted on each frame. Button, IconButton, Fab, Badge and SearchInput use it. Switch's pending ring now looks the same (a quarter arc on a faint track of its color) and turns at the same speed, as the indeterminate circular Progress already did.
- Under reduced motion, spinners no longer turn. Loader's ring and spokes, Switch's pending ring and the indeterminate circular Progress stand still and breathe between full and half strength over 2s. Button's and Badge's spinner only fades in, without growing.
- Popover fades and shrinks back over 100ms when it closes, instead of vanishing (where the browser can keep it in the top layer: Chromium today), with its content kept, inert, until the fade ends. It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is, and a Popover open on arrival is shown from the first frame. Reduced motion: the fade alone.
- A toast with an action now goes after 5 seconds like any other, rather than staying until closed. Its time still stops while it's hovered or focused (F8 reaches it). Pass `autoDismiss: false` to keep the old behaviour.
- A closing toast fades and slides back toward its edge over 150ms instead of vanishing, inert while it goes, and the toasts left glide to their new place over 200ms instead of jumping (FLIP, on translate; at once with reduced motion). Toasts enter with a transition rather than keyframes, and ones there as the Toaster arrives are shown from the first frame. Reduced motion: toasts only fade.
- A toast pushed into the waiting line shrinks and fades toward the "+N more" line instead of sliding off like a closed one. That line now fades in and out and glides with the toasts, rather than appearing at once and jumping when the pushed-out toast goes.
- Tooltip fades and slides back toward its element over 100ms as it hides, instead of vanishing (where the browser can keep it in the top layer: Chromium today). One handed over to the next tooltip during the warm-up still goes at once, so two never show together. Reduced motion: the fade alone.
- On touch screens (`pointer: coarse`), Checkbox, Radio, Switch, Slider, SegmentedControl and Breadcrumb take a press 44px high, as Apple and Material ask, without moving anything. In a CheckboxGroup or RadioGroup the press area stops halfway into the gap, so two never overlap. The Splitter's 8px handle takes a 24px-wide press. With a mouse they keep the 24px of WCAG 2.5.8.
- Link's and BreadcrumbItem's `as` is typed. Their props and `ref` are those of the element `as` names, so `<Link as={RouterLink} to="/settings">` type-checks with RouterLink's own props (a missing or misspelled `to` is an error). Without `as`, they are an `<a>`'s, as before. `LinkProps` and `BreadcrumbItemProps` are now generic types (`LinkProps<typeof RouterLink>`), with the own props in the new `LinkOwnProps` and `BreadcrumbItemOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<Link as={RouterLink} {...{ to: "/x" }}>`. After: `<Link as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - `interface MyLinkProps extends LinkProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyLinkProps = LinkProps<typeof RouterLink> & { … }`.
- `@types/react` (19) is an optional peer dependency. The package's types import React's, so npm now tells a TypeScript project with the wrong major, while a JavaScript project still installs nothing extra.

### Fixed

- In Safari, a closing Accordion item could lose its height as the fold began. It now keeps its height until the fold ends, as in Chrome and Firefox.
- Accordion: opening or closing an item no longer makes everything below it jump. The panel's height now grows and shrinks over the same 200ms (150ms closing) as its fade and unfold, so the content below slides. A second press mid-way turns back from where it is. Under reduced motion the height still changes at once, with the fade alone.
- Announcements from Button, Badge, Loader and toasts are no longer held back for as long as the system clock was set back; the wait before the next message is at most 500ms.
- Pressing Pagination's next arrow on the second-to-last page, or Calendar's month arrow into the month holding `min` or `max` (in DatePicker and DateRangePicker too), disabled the arrow under focus, so focus fell to the top of the page and keyboard and screen reader users lost their place. Focus now moves to the other arrow, as Carousel's arrows do.
- Badge's cut label is now readable. When a text label is cut with an ellipsis, the full label shows as the badge's `title` on hover, as Button's does. It updates when the badge is resized. A badge with its own `title`, `aria-label` or `aria-labelledby`, and a count badge, get none.
- Base.css: under reduced motion, the page-wide rule that makes transitions instant now leaves components alone, so their own short reduced-motion fades (a Combobox or TimePicker popup appearing) work with base.css loaded too. Before, it turned them into a hard pop.
- A rejected promise from Button's `onClick` was marked handled by Button, so it never reached `window`'s `unhandledrejection`, Sentry or other error reporting. Button now rethrows it after ending the loading, so it's reported once, as it would be without Button.
- In an attached ButtonGroup or ToggleGroup, a small icon-only button showed less than its 24px target, under the WCAG 2.2 minimum (2.5.8). The buttons on either side overlap it by 1px, the one before it too when it's pressed, hovered or focused. It's now wider by both overlaps in a row, and a small button is taller by them in a column.
- An attached ButtonGroup wider than its container wraps as separate buttons (with `data-wrapped`) instead of scrolling the page sideways, and joins again once there's room. ButtonGroup is now a client component.
- A Calendar left open past midnight now moves today to the new day by itself.
- Card with `href`: a Ctrl, Cmd or Shift click, or a middle click, on the card's body text now opens the link in a new tab. Before, a modified click navigated the current tab away, and a middle click did nothing.
- Carousel kept no name when given `aria-label` instead of `label`, because its own `label` overwrote it with nothing; the region was read with only its role and the missing-name warning fired. `aria-label` now names it when there's no `label`.
- Carousel: the current dot widens by letting go of a clip instead of growing its width, so it moves on the compositor, keeps its round ends, and the other dots no longer shift when it changes (FB1).
- Carousel: a flick changes the slide though it's short of 40px, a drag past the first or last slide (without loop) meets resistance, the slide settles at the finger's speed, and a loop carries on past the last slide to the first (and back) instead of rewinding across every slide (EN1).
- Checkbox: an indeterminate box, and a select-all box with some boxes checked, show their dash in server-rendered markup before the script runs (data-indeterminate), instead of a plain empty box (GI3).
- ColorPicker's hex field no longer flashes invalid while a code is typed (only a code that can't be a color, or a short one on Enter), and a pasted code with spaces round it is trimmed before it's cut to length.
- ColorPicker's browser color well shows empty with nothing picked, and picking black there now chooses it.
- An invalid ColorPicker (in a Field with an error, with `invalid`, or a required one submitted with nothing picked) now shows it on the swatches: their border takes the danger color, overridable with the new `--color-picker-invalid` token. Before, only the Field's message said so.
- A press on Combobox's box outside the text field (the left icon, the side padding, a tag) left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does.
- Combobox: the list fades and shrinks out on close, as Menu, Popover and DatePicker do, instead of vanishing in one frame.
- Container: the maximum width is the content's, with the side padding outside it, so `size="prose"` keeps a 672px line at every screen width (each size's box is now up to 64px wider on large screens). The side padding is never less than the screen's safe area, so content stays clear of a notch in landscape (FF1).
- CopyButton with a `value` that returns a promise hands the copy to the clipboard within the press (a ClipboardItem holding the promise), so Safari no longer refuses it once a fetch outlasts the press. Browsers without ClipboardItem write the text once it's there, as before.
- FormattedNumber and NumberInput write a currency with the same decimals in every browser. Safari and Firefox ship older CLDR data than Node and Chromium, so "Rp 150.000" from the server became "Rp 150.000,00" in the browser and failed hydration. The decimals now come from a table, unless your options set the rounding.
- A press on DatePicker's box outside the text field (its side padding, past the calendar button) left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does. A press inside an open calendar is still the calendar's.
- DatePicker and DateRangePicker: the calendar scales in from the point facing the field instead of its centre (EO1).
- Dialog no longer jumps to the top-left corner as it closes. It was centered only while open, so for the 150ms fade out the panel sat in the corner; it now shrinks and fades where it stood. The dialog also clips rather than hides its overflow, so focusing the panel's first control can't scroll it.
- Breadcrumb, Calendar, Pagination, Progress, List and Table follow the nearest `dir`, so a `dir="ltr"` block on a right-to-left page no longer shows backwards chevrons, an indeterminate bar running the wrong way, or the selected bar on the wrong edge.
- Drawer slides in and out smoothly from every side. A right or bottom drawer was placed against its edge only while open, so as it began to close the panel jumped to the opposite edge and slid from there. Opening, focusing the first control while the panel was still off-screen scrolled the drawer, so the panel appeared most of the way in on the first frame and the slide played out of view; the drawer now clips rather than scrolls its overflow.
- Drawer: swipe to close reads the finger's speed over the last 100ms, so a slow drag that ends in a flick closes it and a flick back keeps it open; let go, the panel carries on from under the finger (back into place, or out past its edge before it closes) instead of jumping (EN1).
- After ErrorBoundary's Try again (or a custom fallback's `reset()`, or a `resetKeys` change while focus was in the fallback), the fallback went with focus in it and focus fell to `<body>`, so keyboard and screen reader users were sent back to the top of the page. Focus now moves to the first focusable part of the recovered content, or, when it has none, to its first element for that one move.
- A required Field group was not read as required. The `*` is hidden from screen readers and a fieldset can't carry `aria-required`, so `<Field group required label="Contact by">` was announced with no mention of it. The legend now says "Required" in words, hidden from sight (the `required` label), so the set is read as "Contact by, Required" whatever it holds.
- A file dropped just outside a FileUpload no longer opens in the tab, replacing the page and losing the form. While a FileUpload can take files, a file drop that nothing else handled is stopped on the document.
- Removing a file moves focus to the next file's remove button, or the one before it, rather than back to the choose button. A keyboard user clearing several files stays in the list.
- FormattedNumber and `formatNumber` no longer throw on options Intl rejects (a currency like "US", a unit like "km/h", or minimumFractionDigits above maximumFractionDigits), which unmounted the page. They write the plain number, with a `number-options` warning in development.
- `bytes` sizes that round up to 1024 take the next unit: 1,048,575 is "1 MB", not "1,024 kB", and 1023.9 is "1 kB". Fractional bytes round to whole ones.
- A Grid inside another took the outer Grid's `gap` and `minColumnWidth` when it had none of its own. It now starts from its own defaults.
- Highlight no longer shifts option text as you type. Inside an option or menu item a match keeps the text's weight and is underlined instead of turning semibold, so the letters don't widen on each keystroke and the ellipsis stays put. Elsewhere it's still semibold.
- Icons drawn by name now recover from a failed load. Before, if the icon chunk failed once (a network blip, or a deploy that removed the old chunk), every Icon given a `name` stayed empty for the rest of the visit, with no message. Now the failure is forgotten, so the next Icon loads again. An Icon left empty tries again when the browser is back online. In development, it warns once with the reason (`icon-load`).
- `<Icon name="arrow_forward">` and `<Button rightIcon="arrow_forward">Next</Button>` pointed the wrong way on a right-to-left page.
- Icon's `size` given as a number in a string (`size="20"`) is now 20px. It used to set an invalid font size, so the icon silently stayed 24px.
- IconButton inside a Tooltip no longer sets its own `title`, so the native tooltip doesn't show on top of the Tooltip. IconButton now leaves out the title whenever the button has `aria-describedby` or `aria-labelledby`, which is what a wrapping Tooltip adds, so `noTitle` isn't needed there. The README now points to `role="label"` for a Tooltip that repeats the label, so the name isn't read twice.
- A server-rendered Image still loading when the page hydrated was hidden and then faded in. A large picture that had already painted in part disappeared and came back. Pictures that hydrate from server HTML now stay shown; only ones that mount on the client fade in.
- A server-rendered Image was invisible until React hydrated, and never appeared without JavaScript, so a hero picture's Largest Contentful Paint waited for the script. Server HTML now shows the picture as soon as it arrives. Once the script runs, a lazy picture still loading fades in when it arrives, and a `priority` one is never hidden.
- Image's viewer had no loading state and no fallback. A large full-size picture showed an empty dialog while it loaded, and the browser's broken-image icon if it failed. It now has the frame's placeholder, in the picture's shape, and the frame's fallback.
- The viewer's picture has `alt=""`, since the Dialog's title already names it, so screen readers don't read the alt text twice.
- Bundling serupa-ds with esbuild (and the tools built on it) no longer prints ten "Ignoring this import because … marked as having no side effects" warnings. Ten modules imported only types as `import { type X }`, which left a bare `import "…"` in the build. They now use `import type`, and lint keeps it that way (FD1).
- InlineEdit no longer pulls focus back after an async `validate`. If you press Enter and then Tab away while the check runs, focus stays where you went when it settles. Focus returns to the button only if it was still in the field, or nowhere.
- An InlineEdit with an empty value and no `placeholder` now always shows its pencil, so the button can be found on devices with hover. Before, it was an empty, invisible button until hovered or focused.
- Input: a press anywhere on the box (an icon, the side padding, the count or the gap by a prefix) focuses the field with the caret at the end. Before, about 40px on each side of a large Input with icons showed a text cursor but did nothing.
- Kbd: Home, End, Page Up, Page Down, Caps Lock, Insert and Fn are named keys, with symbols on Apple devices (↖ ↘ ⇞ ⇟ ⇪) and spoken names everywhere. A name can be written with spaces, `_` or `-`, so `page_up` and `Page Up` both work.
- A component's bundle now carries only its own built-in words and the shared ones, not every component's: importing only Button ships about 1.9 KiB gzipped less. `useSerupa().labels` and `enLabels` still hold every word.
- Link: an external link's new-tab icon stays on the line of the last word. In a narrow column the icon could wrap onto a line of its own; now the last word of a text label and the icon sit in a `white-space: nowrap` span.
- List: an `aria-current` in a ListItem's `linkProps` is kept. Before, the item always set its own (`"true"` when `selected`, none otherwise), so `linkProps={{ 'aria-current': 'page' }}` never reached the link.
- Lists without bullets keep their list role in Safari. WebKit drops list semantics from a `<ul>` or `<ol>` styled `list-style: none` outside a `<nav>`, so VoiceOver stopped saying "list, 6 items". List, SortableList, Timeline, Grid and Stack as `ul`/`ol`, the Toaster, FileUpload's chosen files and AvatarGroup's "more" popover now set `role="list"`; your own `role` still wins on Grid, Stack and List.
- A link or button row in List shaded as a whole on hover, but a press on its trailing meta ("3 days ago") did nothing. The row's link or button now covers the whole row; trailing actions still take their own presses.
- Loader: right to left, the pixel grid is mirrored, so its patterns start from the inline start like the glint and the skeleton sweep (GI2). The drawing also sets max-width: none, so base.css's svg rule no longer takes a pixel off a Button's loading ring.
- A malformed locale no longer unmounts the page. Intl throws on a tag like `en_US` (common from a server's `LANG` or Java), so `<SerupaProvider locale="en_US">` broke every component that writes a date, number or relative time. Underscores are now read as hyphens, and a tag Intl can't read at all is skipped for the provider's or the browser's locale, with a `bad-locale` warning in development. `formatNumber`, `relativeTime` and `useLocale` mend the locale the same way.
- Meter: the fill is the track's full length and slides on translate to a new value, instead of growing its width, so it moves on the compositor and its rounded end keeps its shape; right to left it fills from the right (FB1).
- Meter: with showValue and the default words, the shown value now says the zone outside the best one ("92%, high"), the same words as the read-out, so the warning isn't only the bar's color (WCAG 1.4.1).
- Motion roles in components (FI1): hover and focus color changes use `motion-hover` with `ease-move`, and popups, toasts and drawers use the enter roles with `ease-enter`, at the same speeds as before, so changing a role now moves them. Switch, Checkbox and Radio answer a toggle in 100ms (`motion-press`) instead of 150ms, as the Motion page asks for feedback.
- Navbar: on small screens the brand shrinks and ends in an ellipsis when the actions are wide, so the menu button always stays on screen and the page never scrolls sideways (WCAG 1.4.10). The README lists the 'prose' size and says to keep actions compact below 768px.
- Navbar: with `sticky`, a field reached with Tab is no longer left a few pixels under the bar in Safari (WCAG 2.4.11).
- NumberInput: a press anywhere on the box (the icon, the side padding, the gap by a prefix) focuses the field with the caret at the end, as Input's box does. The − and + buttons work as before.
- Pagination: the row stays on one line. When it's wider than its box (the defaults need about 340px, so a 320px phone column wrapped the next arrow onto its own line), it shows fewer siblings and then fewer boundaries until it fits, and goes back to what you asked when there's room again.
- PasswordInput: a press anywhere on the box (the icon, the side padding) focuses the field with the caret at the end, as Input's box does. The reveal button works as before.
- PasswordInput: showing or hiding a long password keeps the caret in view, instead of scrolling the field back to its start (GI4).
- PhoneInput: a country picked from the menu cuts the number to its length from the digits as typed, not from what the last country left. Before, arrowing through the menu (each arrow is a change) left the number cut to the shortest country passed on the way.
- A press on PhoneInput's box past the number field left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does.
- In forced-colors mode (Windows high contrast), focusing a PinInput painted the whole selected code in HighlightText over the first box and hid its digit. The hidden field now stays transparent there too.
- PinInput: in a narrow container the boxes shrink together and stay square, down to 24px each, so six lg or eight md boxes fit a 320px screen instead of running into the gutter (GJ3).
- Popover: scales in from the point facing its trigger instead of its centre (EO1).
- Menus, popovers, tooltips and other anchored layers read fewer styles while they follow their trigger: a scroll re-places an open layer with one style read instead of four, since the gap and the page's direction are read when it opens or resizes.
- Menu, Select and other anchored layers line up with their trigger at rest when it opens them while pressed (a Button shrinks on press), so a menu opened by a mouse press in Firefox no longer sits a few pixels off once the button is let go.
- Progress: the fill is the track's full length and slides on translate to a new value, instead of growing its width, so it moves on the compositor and its rounded end keeps its shape; right to left it fills from the right (FB1).
- Progress: in forced colors the ring's track is GrayText, so the Highlight arc stands apart from it in every high-contrast theme.
- A bundler that doesn't read the package's `"sideEffects"` now leaves out every part of Serupa a project doesn't import. Before this, an empty `import "serupa-ds"` kept about 48 modules: the label text, the phone country table and the currency table. The cause was top-level calls without `/*#__PURE__*/`. Webpack, Rollup with its resolve plugin, Vite and esbuild already left them out.
- RadioGroup: the arrow keys now wrap from the last radio to the first and back in Safari too, as the radio group pattern asks. Safari stopped at the ends.
- Rating: in a box narrower than the row, the stars shrink alike to fit, down to the sm size, so ten lg stars no longer push a phone screen sideways.
- Rating: with base.css loaded, a fractional or half star is drawn whole and clipped to its share, instead of shrunk to a tiny star by base.css's svg max-width (GI1).
- An invalid Rating (in a Field with an error, or with `invalid`) now shows it on the stars: the empty ones take the danger color, overridable with the new `--rating-invalid` token. Before, only the Field's message said so.
- Rating: with `clearable`, Space on the picked star clears the rating, as its keyboard table says. A browser clicks a radio on Space only when it isn't checked yet, so this did nothing before.
- SearchInput: a press anywhere on the box (the search icon, the side padding) focuses the field with the caret at the end, as Input's box does. The clear button works as before.
- SegmentedControl: the selection no longer stretches while it slides between segments of different widths. Its border used to grow up to 2.5 times thicker and its corners went oval, because it changed size by `scale`. It now slides by `clip-path`, which the compositor still runs, cut to the selection's shape with its 1px border and round corners all the way. At rest it looks exactly as before.
- SegmentedControl: the indicator slides on translate and scale instead of left and width, so the move runs on the compositor (EG1). Before the script runs, the selected segment shows the indicator's surface itself, so a server-rendered page shows the choice from the first paint (FC1).
- SegmentedControl: when the segments don't all fit, they share the width by content, so short labels stay whole and only the long ones end in an ellipsis; a cut label shows in full as its segment's title on hover (EU1).
- Under a strict Content Security Policy (no `'unsafe-inline'` in `style-src-attr`), server-rendered Progress, Meter, Slider, ColorPicker and the other style-setting components now show their values after hydration in Firefox too. Firefox empties a style attribute it blocks, so there was nothing to apply again; the styles now come from what React hydrated the element with.
- In Firefox, on a page whose Content Security Policy blocks style attributes, server-rendered Progress and Meter fills, Slider thumbs and the other styles set on the server now apply once the page hydrates. Before, they stayed ignored until the value changed.
- Sidebar: collapsing or expanding keeps focus in the item it was in, such as a nested link's group button in the rail, instead of dropping it to the page.
- SortableList drops a dragged row where the pointer is let go. A release that came right after a move, before that move had rendered, dropped it at the earlier place, or not at all.
- SortableList: rows that change place while you drag or move one with the keyboard glide to their new slot, and a dropped row settles into its slot, instead of jumping. Reduced motion moves them at once (EP1).
- Splitter: a press whose pointer has already ended (Firefox throws on capturing it) no longer throws from the handler, and the drag still follows the pointer.
- A Splitter pane whose content overflows takes Tab focus, so it can be scrolled from the keyboard when nothing inside it is focusable (WCAG 2.1.1), as Dialog's and Drawer's bodies already do. It shows the focus ring while focused.
- Switch: the thumb slides on translate instead of inset-inline-start, so it moves on the compositor without laying out the row each frame; right to left still ends on the left (EG1).
- Table: with `stickyHeader`, a link or control reached with Shift+Tab is no longer left partly under the header in Firefox (WCAG 2.4.11).
- Tabs: the selected tab's line (and the pill's fill) slides and stretches from the tab selected before instead of jumping, over 200ms; at once with reduced motion (EG1).
- Textarea: a press anywhere on the box (the count row, the border) focuses the field with the caret at the end, as Input's box does.
- Switching theme with theme.js no longer starts a transition on every control. A page of 20 rows started about 200 of them while the page surface switched at once, so the page changed color unevenly. The switch now finishes each color transition at once, so every color changes together, while motion runs on: a menu picked from fades out and a dark-mode Switch slides.
- A press on TimePicker's box outside the text field (its start padding, past the clock button) left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does.
- TimePicker: the list fades and shrinks out on close, as Menu, Popover and DatePicker do, instead of vanishing in one frame.
- Toast stacks no longer jump when a toast is pushed into the waiting line. At the top of the screen, the toast that was pushed out was put back at its old place in the list, ahead of the one it had been under; that toast faded in again and dropped below it, then jumped back. Each leaving toast now stays after the one it followed.
- Toasts close in the order they came. A toast that had been shown and was pushed into the waiting line started its whole duration again when it came back, so the oldest closed last. Its time now keeps running while it waits; one that was never shown still waits with its time stopped.
- Closing a toast with the mouse no longer moves focus to the toast next to it. That focus stopped the other toast's time, so it stayed until you clicked elsewhere. Closing with the keyboard still hands focus on.
- Toast: a new toast arriving in a full stack no longer stutters. The toasts below now make room on the same curve and time as the arriving toast (`ease-enter`, not the slow-starting `ease-move`), so it no longer sits over the next one before that one has moved. A closing toast, or one pushed into the waiting line, leaves the flow at once, so the rest and the "+N more" line close up in the same glide, rather than in a second one after its fade.
- Tooltip: fades in and slides 4px away from its trigger with a transition instead of a keyframe fade; reduced motion keeps only the fade (EO1).

## [9.7.0] - 2026-10-25

### Added

- Accordion: a title held down fills with the `pressed` color, as rows, tabs and days do, so a press registers at once. New token `--accordion-trigger-bg-pressed`.
- A development warning when a controlled `value` holds several items under `type="single"`.
- AvatarGroup `showMore` makes "+N" a button that opens a popover listing the people not shown, and `onMore` makes it a button that calls your handler. Before, "+N" couldn't be reached by keyboard or touch, so those users could never see who was behind it.
- The `--avatar-group-more-hover-bg` and `--avatar-group-focus-ring` component tokens, for the "+N" button's hover background and focus ring.
- An icon-only BreadcrumbItem with no `aria-label` warns once in development.
- Button: a new `wrap` prop lets a long label take more than one line, and the button grows from its size's height instead of cutting the label with an ellipsis. Without `wrap`, a text label that's cut now shows in full as the button's `title` on hover. Two new tokens, `--button-padding-y-wrap` and `--button-padding-y-wrap-sm`.
- Card: a card with `href` shrinks to 97% while held and springs back (scale, `motion-press` with ease-out), like a Button, so a press registers at once. Not while a button or link inside it is the thing pressed, and off under reduced motion. New token `--card-press-scale`.
- Checkbox: `onCheckedChange(checked, event)`, called after `onChange` with the new state, so an on/off setting has the same shape as ToggleButton's `onPressedChange` and MenuCheckboxItem's `onCheckedChange`. `onChange` stays as it was.
- Checkbox: while the row is held down (pointer, or Space on the box), the box shrinks to 90% and springs back (scale only, `motion-press` with ease-out), so a press registers at once. Not when read-only or disabled, and off under reduced motion. New token `--checkbox-press-scale`.
- Combobox: the list now enters like Menu and Popover. It fades in and grows from the edge facing the field over `motion-enter-sm`, as a transition from `@starting-style` (not keyframes), so closing it mid-way never restarts the motion. Under reduced motion it only fades. The motion gate now opens a Combobox too.
- Combobox: `loadOptions(text, { signal })` loads options from a server as people type. It waits for typing to pause (`debounce`, 250ms by default), aborts the request before each new one and drops any answer that isn't for the latest text, so a slow answer for "ca" can't replace the one for "can". The list shows the loading row while it waits and the new `loadFailed` label when the promise rejects. A picked option keeps its label when later answers leave it out. `options` is now optional.
- Combobox: `multiple` picks any number of options. Each picked option is a removable tag (a Badge) before the text, the listbox is `aria-multiselectable`, picking toggles an option and keeps the list open, Backspace in the empty field removes the last tag, each pick and removal is read out (the new `valueAdded` and `valueRemoved` labels), and `name` sends one hidden input per value. `value`, `defaultValue` and `onValueChange` use `string[]` with `multiple`. `ComboboxProps` is now `ComboboxSingleProps | ComboboxMultipleProps`; for Storybook's `Meta`, type the component as `ComboboxSingleProps` (as Button's stories do).
- DatePicker's `value`, `defaultValue`, `min` and `max` take plain `"yyyy-mm-dd"` strings as that local day, and `onValueChange` gets the day as `"yyyy-mm-dd"` too, as its second argument. A Date at UTC midnight west of Greenwich, such as `new Date("2026-10-24")`, which shows the day before there, gives a console warning to pass the string instead.
- DatePicker, DateRangePicker and TimePicker describe their fields with the format to type ("Format: mm/dd/yyyy"), after a Field hint, so screen readers say it even once the placeholder is gone. The words are a new `formatHint` label, in English and Indonesian.
- Dialog: onOpenChange gets `{ reason }` as its second argument: `'escape'`, `'close'` (the ×), `'outside'` (the backdrop) or `'api'` (the browser closed it, as `dialog.close()` or a `method="dialog"` form do). `OpenChangeReason` gains `'api'`.
- Drawer: `modal={false}` opens it as a side panel beside the page (`show()` instead of `showModal()`): no backdrop, the page stays usable and scrolls, and focus can leave it. Escape inside it and the × still close it.
- Drawer: onOpenChange gets `{ reason }` as its second argument, as Dialog's does: `'escape'`, `'close'` (the ×), `'outside'` (the backdrop) or `'api'` (the browser closed it).
- Drawer: swipe to close. On a touch screen, dragging it toward its edge past a third of its size (or flicking it) asks to close with `reason: 'swipe'`; a shorter drag springs back. Top and bottom drawers are dragged by the header or footer so the body still scrolls. `swipeToClose={false}` turns it off. `OpenChangeReason` gains `'swipe'`.
- Editor autocomplete: the package now carries VS Code custom data, `serupa-ds/vscode/serupa.html-data.json` and `serupa-ds/vscode/serupa.css-data.json`. Point `html.customData` and `css.customData` at them, and VS Code offers every utility class in `class="…"` with what it sets, the themes in `data-theme`, and every token where a stylesheet sets one. The README's "Editor autocomplete" section has the settings.
- `TreeViewItem`, `SliderMark` and `CarouselPerView`, the types of TreeView's `items`, Slider's `marks` and Carousel's `perView`, are exported from the package (TreeView's README already imported `TreeViewItem` from it).
- InlineEdit's `validate` can return a Promise, for a check on the server. The field stays open and `aria-busy` until it settles, and only the latest check counts: typing or Escape drops the one running.
- `prefix` and `suffix` on Input and NumberInput, for fixed text around what's typed ("https://", "@", "kg"). The text sits in the box in `text-muted`, is added to the field's `aria-describedby` so screen readers say it, and a press on it focuses the field.
- SerupaProvider: `platform` (`"apple"` or `"other"`). Set it on the server from the User-Agent or `Sec-CH-UA-Platform` and Kbd shows ⌘ or Ctrl from the first render, so server-rendered pages no longer flash the wrong keys. Without it, Kbd still reads the device after mount.
- Loader `loading`. Keep the Loader mounted and pass `loading={false}` when the work ends. Once shown, it now stays at least 500ms, then renders nothing.
- Menu and ContextMenu: onOpenChange gets `{ reason }` as its second argument: `'trigger'` (the button, its arrow keys, a right-click, Shift+F10 or the Menu key), `'select'` (an item chosen), `'escape'`, `'blur'` (Tab) or `'outside'`. `OpenChangeReason` gains `'select'`.
- Textarea, NumberInput, PasswordInput, SearchInput, PhoneInput, PinInput, TimePicker, Popover (without a `title`) and TreeView warn once in the console when they mount with no accessible name, as Input, Slider and Dialog already do.
- Motion role tokens. They name what moves rather than how long it takes: `--motion-press`, `--motion-hover`, `--motion-enter-sm`/`-md`/`-lg`, `--motion-exit-sm`/`-md`/`-lg`, `--motion-loop-spinner` and `--motion-loop-placeholder`, plus the easings `--ease-enter`, `--ease-exit` and `--ease-move`. Each points at a step of the duration or easing scale and starts at the values the components use today. They're also in the W3C Design Tokens export, as references.
- Navbar: a link held down fills with the `pressed` color at once, one step past hover, so a press registers within a frame; letting go fades back. New token `--navbar-link-bg-pressed`.
- NumberInput's − and + repeat while held (one step, then after 400ms one every 50ms), stopping on release, on leaving the button, on Escape or at the limit.
- NumberInput `onInvalidInput(text, reason)`: "range" when a typed number is brought back within min and max, "unreadable" when typed text isn't a number.
- `useLocale(own?)` and `announce(text, { assertive })` are exported, so your own components use the same locale and live regions as Serupa's. README has a "For your own components" section for them and `useSerupa`.
- Radio: while the row is held down (pointer, or Space on it), the circle shrinks to 90% and springs back (scale only, `motion-press` with ease-out), as Checkbox's box does. Not when disabled, and off under reduced motion. New token `--radio-press-scale`.
- DateRangePicker and Calendar take plain `"yyyy-mm-dd"` strings for their value, default value, min and max, as DatePicker does. `onValueChange` also gets the day or range as `"yyyy-mm-dd"` in its second argument. A new type, `DateRangeInput`, is the range they take.
- Rating, stars to pick a score or to show one. Interactive, it's a `role="radiogroup"` of native radios (one per star, or two with `allowHalf`) named "3 stars", so arrow keys, forms and screen readers work as in any radio group. `clearable` clears on a second pick, Backspace or Delete. `readOnly` draws any fraction as one image named "4.3 out of 5". It takes `value`/`defaultValue`/`onValueChange`, `max`, `size`, `name`, `required`, `disabled`, `invalid`, works in a Field, and supports right to left. New labels: `ratingStars` and `ratingValue`.
- SegmentedControl: a held segment shrinks to 95% and springs back (scale, `motion-press` with ease-out), like a Button, so a press registers at once. Not when read-only or disabled, and off under reduced motion. New token `--segmented-control-press-scale`.
- A warning, once on the server, when a component that writes dates, times or numbers renders without a locale from its prop or a `SerupaProvider`: its HTML is en-US and changes to the browser's locale after hydration.
- SidebarItem: a group's open state can be controlled with `open` and `onOpenChange(open, { reason })`, like every other component that opens and closes. `defaultOpen` still works, and a group holding the active page still starts open.
- Splitter, two panes with a handle between them that resizes the first, following the WAI-ARIA window splitter pattern (a focusable `role="separator"` with `aria-valuenow`, arrow keys, Home and End, and Enter to collapse with `collapsible`). Sizes are percent, with `min`, `max`, `step`, `size`/`defaultSize`/`onSizeChange`, `direction="vertical"`, right-to-left support and an optional `storageKey` that keeps the layout for the next visit. New label: `resizePanes`.
- Stepper: while a clickable step's head is held down, its indicator shrinks to 95% (scale only, `motion-press` with ease-out) and springs back, so a press registers at once; off under reduced motion. New token `--stepper-press-scale`.
- Switch: `onCheckedChange(checked, event)`, called after `onChange` with the new state, as Checkbox's is. Not while read-only or pending. `onChange` stays as it was.
- Switch: while the row is held down (pointer, or Space on the switch), the thumb shrinks to 90% and springs back (scale, `motion-press` with ease-out), so a press registers at once. Not when read-only, pending or disabled, and off under reduced motion. New token `--switch-press-scale`.
- Table: a sortable header held down fills with the `pressed` color, so a press registers at once. New token `--table-sort-bg-pressed`.
- Timeline and TimelineItem, an ordered list of events (a dot or icon marker on a joining line, a title, a `<time>` and content) for activity feeds and order history. `align="alternate"` puts events on both sides of a centered line from 768px up.
- `toast.promise(work, { loading, success, error })` shows a loading toast while the work runs and replaces it with the success or error message when it settles, each a title, options, or a function of the result or error.
- Tooltip: onOpenChange gets `{ reason }` as its second argument: `'hover'`, `'focus'`, `'blur'`, `'trigger'` (a press on the element), `'escape'` or `'outside'`. `OpenChangeReason` gains `'hover'` and `'focus'`.
- Tooltip: a shared warm-up. Once a tooltip has shown, the next one opens at once and without a fade, and the open one closes, until the pointer has been off every tooltip for 300ms. Scanning a toolbar of icon buttons no longer waits 400ms per button. The `delay` prop still sets the cold start.
- TreeView: a row held down fills with the `pressed` color, one step past hover, so a press registers at once. Not on the picked row or a disabled one. New token `--tree-view-item-bg-pressed`.
- `useCollator(options?)`: an `Intl.Collator` for the locale the components use (its own `locale` option, else SerupaProvider's, else the browser's), made once per locale and options. Sorting options and table rows with its `compare` puts "Äpfel" beside "Apfel" in German and "Item 2" before "Item 10". PhoneInput's country list now sorts with the same Collator.

### Changed

- TimePicker's placeholder follows the locale's order, separator and AM/PM words, worked out with formatToParts: "hh:mm AM/PM" in en-US, "hh.mm" in id-ID, "오전/오후 hh:mm" in ko. It was "hh:mm am" or "hh:mm" everywhere.
- The Motion foundations page covers when to animate, the roles, timing, easing, sequencing, performance and reduced motion.
- Textarea's `autoResize` uses CSS `field-sizing: content` where the browser has it (Chromium 123+, Safari 26+), with `rows` and `maxRows` as its least and most height. Nothing is measured while typing, and there's no frame at `height: auto` that could jump the page. Other browsers keep the measuring path.
- Popover, Menu, ContextMenu and Tooltip given a text, several elements or a Fragment as the trigger throw an error that names the component, instead of React's "expected to receive a single React element child". A trigger that doesn't forward its ref warns once.

### Fixed

- Closed Accordion items are no longer empty region landmarks: only an open item's content is a region, and none is with `type="multiple"` and more than six items.
- Dismissing an Alert with its focused × moves focus to the next focusable element after the alert, or the one before it, instead of dropping it on the page.
- Avatar's four statuses differed only by color, and looked the same in forced-colors mode. Each now has its own shape: online a filled dot, busy a dot with a bar, away a ring with a dot, offline an empty ring.
- An Avatar with `alt=""` and a status hid the status from screen readers. The dot is now read on its own ("online").
- A Badge whose `loading` ended a moment after it started flashed the ring for a frame or two. Once shown, the ring now stays at least 500ms.
- A Loader with `delay={0}` now shows in the same render that turns `loading` on, not one frame later.
- Removing a tag with its × (Badge `onRemove`) moves focus to the next tag's ×, or the one before it, instead of dropping it on the page.
- A long unbroken Breadcrumb label ran past a 320px screen (WCAG 1.4.10). It now wraps inside the trail.
- The "…" button now takes a press over 24×24px, like the links.
- A Breadcrumb with no items rendered an empty nav landmark. It now renders nothing.
- A Button whose `onClick` promise settled just after 300ms flashed its spinner for a frame or two, cut off mid fade-in. Once shown, the spinner now stays at least 500ms, and the `successText` check follows it.
- Carousel: the slides not shown are inert from the first paint, server HTML included, instead of once an effect ran after hydration. React 19 takes `inert` as a prop, so the workaround for React 18 is gone.
- ColorPicker's swatch edge and native color well used `border`, at 1.27:1 on the page, so a white swatch on a white page (or a black one on a dark page) had no visible edge. The `--color-picker-swatch-border` default is now `field-border`, which keeps 3:1 in all six themes (WCAG 1.4.11).
- Console warnings are for development only. Every warning a component gives (an icon-only Button with no label, a Tabs value that matches no tab, a Field label with no control, and the rest) now sits behind `process.env.NODE_ENV !== "production"`, so your bundler's production build drops the warnings and their text. `serupa.iife.js` keeps them, since a plain page has no build step.
- Icon: hydrating draws only the icons the server could draw (passed or registered). An icon this page had already loaded by name, for example in an island hydrated after another, used to show during hydration, which React reported as a mismatch and rendered again. It now appears right after hydration.
- Icon draws your custom icons as elements instead of writing their markup as HTML, so a page with Trusted Types on (`require-trusted-types-for 'script'`) needs no policy for Serupa. Nothing else in the package writes HTML either, and a new story-wide test keeps it that way.
- Serupa.iife.js is minified (3.4 MB to 3.0 MB) and ships with serupa.iife.js.map, so a stack trace on a plain page points to the source files.
- InlineEdit said nothing when `validate` kept the field open. Focus stays in the field, and screen readers don't read a focused field's description again, so the message was only shown. It's now announced politely on each failed try, as Field announces its errors.
- Work that ended just after the 300ms delay flashed the loader for a frame or two, cut off mid fade-in.
- Menu: scales in from the point facing its trigger instead of its centre. `placeLayer` now sets `--dk-layer-origin` on every positioned layer (EO1).
- The duration tokens' descriptions now match how the components use them. Tooltips, popovers and menus enter in 150ms, dialogs and toasts in 200ms, and drawers in 300ms.
- The focus ring's width and offset tokens are exported to design-tokens/ as references to the outline scale. They used to be CSS-only values that held a literal `{…}`.
- NumberInput tells screen readers when typed text that isn't a number is replaced by the previous number, as the date and time pickers do.
- With two Toasters mounted at once, each toast showed twice. Now only the newest Toaster shows toasts, with a console warning once, and the older one takes over when it unmounts.
- Pagination size sm keeps the current page a 24px square with two digits in any font. Its semibold "88" in DejaVu Sans (common on Linux, where Inter isn't installed) is 16.7px, and with 4px sides the page was 24.7px wide. The sides are 2px now (`--pagination-padding-x-sm`, `spacing-0.5`); a one-digit page looks the same, since the square's 24px minimum still sets its width.
- PhoneInput no longer rebuilds its 244 country options on every keystroke; a keystroke's render goes from about 5.5 ms to under 1 ms.
- PhoneInput: hydrating no longer fails when the server words a country name differently from the browser, for example Node's "Falkland Islands (Islas Malvinas)". The server's options stay in place during hydration and are drawn again in the browser's words right after.
- `SerupaProvider` with `labels` or `icons` written inline no longer re-renders every component under it each time its parent renders; only new contents do.
- Collapsing or expanding Sidebar animated its width, so the page beside it was laid out again on every frame and stuttered on heavy pages. Now the width changes once, and only a clip and the edge line slide, which the compositor runs alone. Toggling again mid-way turns back from where it is.
- Tabs: the selected tab is scrolled into view again once the web fonts load. Tabs that widen when the real font arrives no longer leave it part way past the end of an overflowing list.
- `theme.js` loaded twice (an inline copy plus the file, or two bundles) made two independent copies. The first one's `onChange` subscribers missed later changes, its `get()` went stale, and on a system light/dark switch it could write its own theme over the visitor's choice. A second copy now does nothing.
- `localStorage.clear()` in another tab left this tab on the old choice until a reload. It now goes back to the page default, as with `reset()`.
- TreeView: a focus move, a pick or opening and closing one item now redraws only the rows it changes. With 3,060 items in view, an arrow key used to redraw all of them. Open and picked ids are kept in Sets, so Ctrl+A on a big tree is no longer quadratic, and focus finds its item by id.
- Every console warning now ends with a code and a link to its section in docs/warnings.md, which says why it shows and how to fix it, such as `(Serupa warning tabs-value: https://github.com/diki-stwn/serupa-ds/blob/main/docs/warnings.md#tabs-value)`. Button's icon-only warning is now `button-icon-label`.

## [9.6.0] - 2026-10-25

### Added

- `initialFocus` on Dialog, a ref to the element that takes focus when the dialog opens, such as Cancel in a confirmation. It wins over `data-autofocus`. A ref to something outside the dialog is ignored, so focus never leaves the modal.
- `MenuCheckboxItem` (role `menuitemcheckbox`) for on/off settings in a Menu, and `MenuRadioGroup` with `MenuRadioItem` (role `menuitemradio`) for one of a set, each with `aria-checked` and a check before the label. You hold the state (`checked` with `onCheckedChange`, `value` with `onValueChange`). The arrow keys, Home, End and typeahead reach them like any item.
- Popover: onOpenChange gets a second argument, `{ reason }`, saying why it opened or closed: `'trigger'`, `'escape'`, `'outside'`, `'blur'` or `'close'` (the close() its children function gets). The `OpenChangeReason` and `OpenChangeDetails` types are exported for the other overlays to use next.

## [9.5.0] - 2026-10-25

### Added

- `defaultOpen` on Dialog and Drawer, so they can be open on arrival without a state of their own. `open` is now optional: without it, Escape, the × and the backdrop close them by themselves, and `onOpenChange(false)` still comes. Menu, Popover and Tooltip already had `defaultOpen`; their tests now cover it.

### Changed

- IconButton's ref type is now declared as `IconButtonElement` (`HTMLButtonElement | HTMLAnchorElement`, the same type as before). The type declarations then print it the same way on every build, so index.d.ts no longer changes from one build to the next.

### Fixed

- CheckboxGroup's `selectAll` box rendered disabled and unchecked on the server, and so until hydration, even when `defaultValue` checked some or all boxes. It now counts the Checkboxes among the group's children until they register, so it is enabled and checked or mixed from the first paint.

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

## 7.1.0 - 2026-10-18

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

## 6.0.0 - 2026-10-18

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

## 4.8.1 - 2026-10-17

### Changed

- The documentation runs on Storybook 10.6 (from 8.6). Nothing in the package changes; `npm run storybook` and `npm run build-storybook` work as before. The Essentials addon is gone (its parts are now built into Storybook), and the Docs addon takes its place.

### Fixed

- Avatar falls back to initials when its picture fails to load quickly (as in Safari), instead of keeping the broken picture.
- Calendar, DatePicker and DateRangePicker start the week on the locale's day in Firefox too (Monday for de-DE, for example); Firefox has no Intl.Locale week info, so they always started on Sunday.
- Textarea with `autoResize` no longer raises "ResizeObserver loop completed with undelivered notifications" on the window when its width changes.

## 4.8.0 - 2026-10-17

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

## 4.7.0 - 2026-10-16

### Added

- Switch component: an on/off setting that applies at once, a native checkbox with `role="switch"` drawn as a track and thumb. Sizes `sm`, `md` and `lg` (28×16, 36×20 and 44×24 tracks on the label's first line), a `description`, `labelPosition` `end` or `start`, `invalid` and disabled. The thumb slides in 150ms (not with reduced motion), follows the text direction and uses system colors in forced-colors mode. 21 component tokens (`--switch-*`), its own docs page and `tools/test/switch.mjs`.

## 4.6.0 - 2026-10-16

### Added

- Radio and RadioGroup components: native radios with labels, in a `RadioGroup` (`role="radiogroup"`) that gives them a name, holds `value` or `defaultValue`, calls `onChange(value, event)`, lays them out `vertical` or `horizontal`, and passes `size`, `invalid`, `disabled` and `required` down. Sizes `sm`, `md` and `lg` (14, 16 and 20px circles on the label's first line) and a `description`. Arrow keys move the choice natively; Field group labels it and sets `invalid` from its error. 21 component tokens (`--radio-*`), its own docs page and `tools/test/radio.mjs`.

### Changed

- Field's preview and docs show a group of radios.

## 4.5.0 - 2026-10-16

### Added

- Checkbox component: a native checkbox and its label, with sizes `sm`, `md` and `lg` (14, 16 and 20px boxes on the label's first line), a `description` linked with `aria-describedby`, `indeterminate` (a dash, announced as mixed), `invalid` and disabled (also inside a disabled `Field group`). The whole label toggles it. 20 component tokens (`--checkbox-*`), its own docs page and `tools/test/checkbox.mjs`.

## 4.4.0 - 2026-10-16

### Added

- Select component: a native `<select>` styled like Input, with sizes `sm`, `md` and `lg` at the control heights, a chevron, an optional `leftIcon`, a `placeholder` (an empty first option in the placeholder color until something is picked), `options` as strings, `{ value, label, disabled }` or groups (or `<option>` children), and focus, `invalid` and disabled states. It keeps the browser's picker, keyboard and screen-reader support. `multiple` isn't supported and is ignored with a warning. 20 component tokens (`--select-*`), its own docs page and `tools/test/select.mjs`.

## 4.3.0 - 2026-10-16

### Added

- Field component: a label, an optional `hint` and an `error` message around one form control, wired up for screen readers. It links the label to the control (its own `id` or a generated one), adds the hint and error to the control's `aria-describedby`, makes it invalid with an error, marks `required` (a hidden `*` and `aria-required`) or `optional`, and passes `disabled`. `group` renders a `<fieldset>` and `<legend>` for a set of choices. 8 component tokens (`--field-*`), its own docs page and `tools/test/field.mjs`.

## 4.2.0 - 2026-10-16

### Added

- Textarea component: a multi-line text field, Input's sibling (a native `<textarea>` in a box). Sizes `sm`, `md` and `lg` with Input's text sizes and side padding; `rows` (default 3); a vertical resize handle, or `resize="none"`; `autoResize`, which grows with the text from `rows` up to `maxRows` and then scrolls; `showCount`, a character count under the text ("32 / 280" with `maxLength`, linked by `aria-describedby`); focus, `invalid`, read-only and disabled like Input. 16 component tokens (`--textarea-*`), its own docs page and `tools/test/textarea.mjs`.

## 4.1.1 - 2026-10-11

### Fixed

- Docs: the Button page's hand-written loading spinners (the playground and the loading demo) were missing the Loader's inner wrapper, so the ring only grew and shrank without turning and looked laggy. The Button component itself was never affected. The docs test now checks that every ring on the docs pages turns.

## 4.1.0 - 2026-10-11

### Added

- Input component: a single-line text field (a native `<input>` in a box) with sizes `sm`, `md` and `lg` at the control heights (24, 32, 44px, like Button), optional `leftIcon` and `rightIcon`, a focus ring, and `invalid`, read-only and disabled states. Field colors come from the `field`, `field-border` and `placeholder` aliases. 19 component tokens (`--input-*`), its own docs page and `tools/test/input.mjs`.

## 4.0.0 - 2026-10-10

### Removed

- **Badge sizes.** Badges now come in one size: 20px tall, `text-xs`, 12px icons (the old `sm`). The `size` prop is gone: it's ignored, with a console warning, and never reaches the DOM. Badges that used the old default (`md`, 24px, `text-sm`, 14px icons) are now smaller. The indicator dot is 8px.
  - Component tokens renamed: `--badge-height-sm` / `-md` → `--badge-height`; `--badge-icon-size-sm` / `-md` → `--badge-icon-size`; `--badge-padding-x-sm` / `-md` → `--badge-padding-x`; `--badge-indicator-size-sm` / `-md` → `--badge-indicator-size`.
  - The `dk-badge--size-sm` / `dk-badge--size-md` classes and the `data-size` attribute are gone.
  - To migrate: remove `size` from your badges. To keep the old 24px look somewhere, set `--badge-height: var(--spacing-6)`, `--badge-padding-x: var(--spacing-2)` and `--badge-icon-size: var(--spacing-3\.5)` on a container, plus `text-sm` for the type.
- **Loader `tone="current"`**, deprecated in 3.8.0, is removed as announced. It now falls back to `neutral` (the same look) like any unknown tone, without the warning. Use `tone="neutral"`.

### Changed

- Badge's remove × keeps a 24×24 target (the WCAG 2.2 minimum, as on a small Button): its hit area reaches 2px past the badge's top and bottom, and its focus ring goes round all of it.

## 3.17.0 - 2026-10-10

### Added

- Badge `ping` (off by default): with `dot`, in a label or as the indicator, the dot pings with the system's `ping` animation (the `--animate-ping` token behind `animate-ping`): a copy grows to twice its size and fades every second, for live states. Off under reduced motion and in forced-colors mode.

## 3.16.1 - 2026-10-10

### Changed

- Badge: the status dot's box is 2px narrower than an icon box, 12×14px at md and 10×12px at sm (was 14×14 and 12×12), so the dot gets a little less room than an icon. Dot badges are 2px narrower.

## 3.16.0 - 2026-10-10

### Added

- Badge indicator: `<Badge dot />` with no label, icon or count renders a lone dot for "something new" without a number, on the corner of an icon or avatar. A solid circle in the tone (10px md, 8px sm) with a 2px ring in the surface color; decorative unless given `aria-label`; not clickable or removable. New component tokens `--badge-indicator-size-sm`, `--badge-indicator-size-md` and `--badge-indicator-ring`.

## 3.15.1 - 2026-10-10

### Changed

- Badge: the status dot sits centered in an icon-sized box (14px at md, 12px at sm), so it takes the same space as a leading icon and dot badges line up with icon badges. Dot badges are 8px (md) or 6px (sm) wider.

## 3.15.0 - 2026-10-10

### Changed

- Badge: optical balance like Button's. With an icon on one side only, the text side gets 2px more padding: a leading icon or dot pads the end, a remove × pads the start; icons on both sides, or none, stay even. New component token `--badge-icon-offset` (`spacing-0.5`); right-to-left mirrors it.

## 3.14.3 - 2026-10-10

### Fixed

- Badge: the remove × now mirrors a leading icon, so a badge with an icon, a label and a × is balanced (about 11 / 6 / 6 / 11px of visible space at md, 9 / 6 / 6 / 9 at sm; before, the × side was looser). The × sits in an icon-sized box with the badge's gap and end padding, nudged 2px in to make up for the glyph's built-in space; the button keeps a 24×24 target and its focus ring goes round all of it. Removable badges are 2px narrower.

## 3.14.2 - 2026-10-10

### Fixed

- Badge: the remove × sat too far from the label (about 14px, versus 10px at the badge's start). The × button now sits right against the label and the badge's end, so the × is about 10px from both at md, matching the start; removable badges are 6px narrower. The button keeps its 24×24 target.

## 3.14.1 - 2026-10-10

### Fixed

- Docs: the Badge page shows the disabled state (in States, the props table and a playground toggle); before, it was only in the Badge README.

## 3.14.0 - 2026-10-10

### Added

- Badge micro-interactions, the same as Button's: clickable badges shrink to 97% while held (pointer, Space or Enter) and ripple from the press point in the text color; loading cross-fades the content into a ring that grows in. New component tokens `--badge-press-scale`, `--badge-press-duration`, `--badge-ripple-opacity`, `--badge-ripple-duration`, `--badge-ripple-fade-duration` and `--badge-loading-duration`; reduced motion turns press and ripple off.

## 3.13.0 - 2026-10-10

### Added

- Badge states. With `onClick` a badge renders a `<button>`, and with `href` a link (through `Diki.configure`), with hover (a 10% layer), active (15%) and focus (the 2px focus ring) states; the layer always moves away from the text, so every tone and style keeps 4.5:1. `loading` (any badge) puts a ring over the hidden content, keeps the width, sets `aria-busy`, announces `loadingText` and, on a clickable badge, blocks clicks while keeping focus. `disabled` works on clickable badges. New component tokens `--badge-hover-layer`, `--badge-active-layer`, `--badge-state-text` and `--badge-focus-ring`.

## 3.12.0 - 2026-10-10

### Changed

- Badge: the subtle style has a 1px outline in its text color at 20%, so it follows every tone and theme. New component token `--badge-subtle-border` (`opacity-20`); set it to `0%` for the previous borderless look.

## 3.11.0 - 2026-10-10

### Added

- **Badge** component: a short label for status, counts and categories. Styles `subtle` (default), `solid` and `outline`; tones `neutral` and `primary` (alias colors), `success` (green), `warning` (amber), `danger` (red), `info` (sky) and the 17 chromatic palette families for categories and tags. Palette and status tones use fixed steps per style (light: 100 fill and 700 text, 600 or 700 solid with white, 700 outline; dark: 950 fill and 300 text, 400 solid with 950, 300 outline on a 400 border), each keeping 4.5:1 text in all six themes and following the nearest theme. Sizes `sm` (20px) and `md` (24px). Extras: a status `dot`, a `leftIcon`, a `count` (a round pill, with `max` and `showZero`) and `onRemove` (a real × button named "Remove" + the label). Component tokens in `components/Badge/badge.tokens.json`.
- Docs site: a Badge page with a playground, all tones and styles, the extras, props, accessibility notes and component tokens.
- Tests: `tools/test/badge.mjs`, including contrast for all 69 tone and style combinations in every theme.

## 3.10.0 - 2026-10-10

### Changed

- Button `variant="secondary"` is now an outline in the brand color: `primary` border and text on `surface`, with a `primary-subtle` tint on hover as the text and border darken to `primary-hover` (was a solid `secondary` gray fill with `text`). Destructive secondary matches: a solid `danger` border with `danger-text` on `surface` and a `danger-subtle` tint on hover (was a `danger-subtle` fill). Component tokens: `--button-secondary-bg`, `-bg-hover` and `-text` take new defaults; new `--button-secondary-text-hover`, `--button-secondary-border`, `--button-secondary-border-hover` and `--button-destructive-secondary-border`.
- The contrast audit checks the new pairs: `primary` text on `surface` (4.5:1), `primary-hover` on `primary-subtle` (4.5:1) and the `danger` border on `surface` (3:1), in all six themes.

## 3.9.1 - 2026-10-10

### Changed

- Loader `variant="spokes"`: closer to iOS proportions. Spokes are thicker and shorter, about 10% of the loader's size wide (was 8%) and 25% long (was 27%), round a larger empty middle, about 40% across (was 33%). `--loader-spokes-width` now defaults to `stroke-width-4` in a drawing at 5/8 scale (2.5 of the 24 units).

## 3.9.0 - 2026-10-10

### Added

- Loader `variant="spokes"`, like the current iOS activity indicator: eight rounded spokes round a circle, the lead one at full strength and the rest fading behind it to 25%, ticking a spoke at a time (45°, every 125ms: a turn a second). Same sizes, tones and delay as the ring; half speed under reduced motion. Component tokens `--loader-spokes-width` (`stroke-width-2`) and `--loader-spokes-duration` (`duration-1000`).
- Docs site: spokes in the Loader playground, demos and props.

## 3.8.0 - 2026-10-10

### Changed

- Loader: the default tone is now called `neutral` (was `current`). It looks the same: the text color around it. The docs, playground and types use the new name.

### Deprecated

- Loader `tone="current"`: use `tone="neutral"`. It still works, the same as `neutral`, with a console warning, and will be removed in 4.0.0.

## 3.7.2 - 2026-10-10

### Changed

- Pixel loader `pattern="random"`: calmer, with each square's clock now 1.5s to 2.2s (was 1.2s to 1.9s), so it reads as thinking rather than flicker. Under reduced motion its squares share a 4s clock and keep their scattered starts.

## 3.7.1 - 2026-10-10

### Changed

- Pixel loader loop lengths per pattern: `snake` and `spiral` now loop in 1.5s and `cross` and `checker` in 1s (all were 1.2s). `wave`, `sweep`, `fall` and `rise` stay at 1.2s (`--loader-pixel-duration`). Under reduced motion each runs at half speed (3s, 2s, 2.4s).

## 3.7.0 - 2026-10-10

### Added

- Token `duration-1200` (1200ms) and its `duration-1200` class, for long decorative loops.

### Changed

- Pixel loader: one loop now takes 1.2s in every pattern (was 1s): `--loader-pixel-duration` now defaults to `duration-1200`. Steps stay 75ms apart; `random`'s clocks run 1.2s to 1.9s; under reduced motion every pattern runs at half speed (2.4s).

## 3.6.0 - 2026-10-10

### Changed

- Pixel loader: one loop now takes 1s in every pattern (was 1.5s to 2.4s), set by the new component token `--loader-pixel-duration` (`duration-1000`). Steps are 75ms apart (`--loader-pixel-stagger`, now `delay-75`, was `delay-100`); `cross` and `checker` light their second group half a loop later; `random`'s clocks run 1s to 1.7s. The rise and fade keep the wave's smooth curve. Under reduced motion every pattern runs at half speed (2s, was 3s).

## 3.5.1 - 2026-10-10

### Changed

- Pixel loader patterns `random`, `sweep`, `fall`, `rise`, `snake`, `spiral`, `cross` and `checker` now move as smoothly as `wave`: each square rises, holds and fades with the wave's curve (30% of its cycle to rise, 30% to fade, `ease-in-out`), not the quick snap of before. `random`'s clocks are longer to match (1.5s to 2.4s, were 1s to 1.9s). Orders and cycle lengths are unchanged otherwise.

## 3.5.0 - 2026-10-10

### Added

- Seven more pixel loader patterns: `sweep` (columns, left to right), `fall` (rows, top to bottom), `rise` (rows, bottom to top), `snake` (square by square, left to right then back), `spiral` (clockwise round the edge, then the center), `cross` (the corners, then the plus) and `checker` (the X, then the edges). Each fills the grid and empties it in the same order (`ease-in-out`, steps of `--loader-pixel-stagger`), and slows to 3s under reduced motion.
- Loader `glow` prop (pixel only): a soft halo of the loader's color round the lit squares, off by default. Its size is the new component token `--loader-pixel-glow-size` (`spacing-0.5`, 2px). Setting `--loader-pixel-glow` yourself still works.
- Docs site: a Pixel patterns gallery and table, all nine patterns and a glow toggle in the Loader playground.

### Changed

- Under reduced motion every pixel pattern now slows to 3s (the wave and random did already).

## 3.4.0 - 2026-10-10

### Added

- Loader `pattern="random"` for `variant="pixel"`: the squares light up at random instead of in a diagonal wave. Each twinkles on its own clock (1s to 1.9s, sums of the duration tokens, starting 0 to 1s in), so they drift apart and the grid shows an ever-changing order with no visible loop. Same dim, divider, tone and glow as the wave; under reduced motion each square slows to 3s. `pattern="wave"` stays the default.
- Docs site: a pattern control in the Loader playground (for pixel), a random demo and the prop in the table.

## 3.3.2 - 2026-10-10

### Changed

- Loader `variant="pixel"`: lighter, thinner dividers. They're now hairlines, half a unit of the 24-unit grid (0.5px at 24px, was 1px), at 10% of the loader's color (`--loader-pixel-divider`, was `opacity-30`). They still look the same next to lit and dim squares.

## 3.3.1 - 2026-10-10

### Changed

- Loader `variant="pixel"`: the dividers now look the same whether the squares beside them are lit or dim. They're cut out of the squares and drawn in the loader's color at a fixed strength, `--loader-pixel-divider` (now `opacity-30`, was a 50% cut that faded with the squares).

## 3.3.0 - 2026-10-10

### Changed

- Loader `variant="pixel"`: the squares are now square pixels, edge to edge with no rounded corners and no gaps, split by subtle dividers (1 unit of the 24-unit drawing, letting half of the background through). New component tokens `--loader-pixel-divider` (`opacity-50`; 0 hides the dividers) and `--loader-pixel-divider-width` (`stroke-width-1`).

## 3.2.0 - 2026-10-10

### Added

- Loader `variant="pixel"`: a 3×3 grid of rounded squares in one color (the loader's tone) with a wave of light running along the diagonals from the top-left corner: each square rises from 15% to full and fades again, 100ms after the diagonal before it, every 1.5s with `ease-in-out`. Sizes 16, 24 and 40px like the ring; `primary`, `muted` and `inverse` tones. Opacity only, so it keeps running under reduced motion, at half speed.
- Loader component tokens `--loader-pixel-dim` (`opacity-15`), `--loader-pixel-stagger` (`delay-100`) and `--loader-pixel-glow` (`spacing-0`: off; a small spacing step adds a soft halo of the same color, for dark surfaces).
- Docs site: pixel in the Loader playground, demos and props.

## 3.1.0 - 2026-10-10

### Changed

- The neutral aliases in all six themes now use `gray` instead of `slate`, the same steps as before: `secondary`, `secondary-hover`, `surface` (dark), `surface-muted`, `surface-inverse`, `text`, `text-muted`, `text-inverse`, `border`, `border-strong`, `field` (dark), `field-border`, `field-border-hover` and `placeholder`. `overlay` is now `gray-900` at 50% (light) and `gray-950` at 70% (dark). Every contrast pair still passes. The `slate` palette is unchanged and still available.

## 3.0.0 - 2026-10-10

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

## 2.8.3 - 2026-10-10

### Changed

- Spinner text variant: the shine now uses `ease-in-out` (was `ease-in` in 2.8.1), easing in at the start of the words and out at the end. Same 2s cycle.

## 2.8.2 - 2026-10-10

### Added

- Docs site: a Spinner playground, like Button's. Pick the variant, size, tone, delay and label, see it live in the sidebar's theme (on a dark stage for `inverse`), copy the code, and press Replay to watch the show-after delay. Notes explain decorative spinners and why the text variant keeps the text color. The docs test drives it.

## 2.8.1 - 2026-10-10

### Changed

- Spinner text variant: the shine now uses `ease-in` instead of `linear`, so it starts slow and speeds through the words. Same 2s cycle.

## 2.8.0 - 2026-10-10

### Added

- Spinner `variant="text"`: a loader made of words, the label with a shine sweeping through it every 2s. It rests at 65% of the text color (4.5:1 on `surface` in every theme), stays in the text color (only `inverse` changes it), sizes with the type scale (`text-xs`, `text-sm`, `text-base`), is named and announced by its label, and is plain text under reduced motion.

### Deprecated

- Spinner `showLabel`: use `variant="text"` instead. It still writes the label beside a ring or dots, with a console warning, and will be removed in 3.0.0.

## 2.7.0 - 2026-10-10

### Added

- Spinner `showLabel` (off by default): writes the label beside the spinner, with a shine sweeping through the words every 2s. The words rest at 65% of the text color (`--spinner-label-dim`, `opacity-65`), which keeps 4.5:1 on `surface` in every theme; the visible text is hidden from screen readers, which already hear it as the spinner's name; plain text under reduced motion. The label follows the spinner's size.
- Spinner `tone="inverse"`: a white ring or dots and label in every theme, for dark scrims, overlays and media (`--spinner-inverse`, `white`).
- Tests for both, including the label's contrast in all six themes.

### Changed

- Spinner tones `primary` and `muted` now color the ring or dots only, so a visible label stays in the text color around it. A spinner without a label looks the same as before. Its markup gains an inner `.dk-spinner__art` element around the drawing.

## 2.6.0 - 2026-10-10

### Changed

- The Spinner's ring is livelier: while it turns (now 2s a turn), its arc stretches from a dot to most of the ring and shrinks again every 1.5s, its tail chasing its head, so each stretch starts somewhere new. Colors, sizes and tokens are unchanged. Under reduced motion the arc stays a steady quarter and turns at `animate-spin-reduced` (3s). Button's loading spinner follows.

## 2.5.0 - 2026-10-10

### Added

- `Spinner` component: shows that something is loading when progress is unknown. Two variants, `ring` (an arc turning on a faint track) and `dots` (three pulsing dots); sizes `sm` 16px, `md` 24px, `lg` 40px; `tone` `current` (the text color), `primary` or `muted`. It waits `delay` ms (300) before showing, so fast requests don't flash it, keeping its space meanwhile; then it is a `role="progressbar"` named by `label` ("Loading") and announced once through the shared status region. `label=""` makes it decorative. Ring turns with `animate-spin`; under reduced motion it turns slower and the dots only fade.
- Spinner component tokens (`components/Spinner/spinner.tokens.json`, also in `design-tokens/components/`): colors, sizes, ring thickness, track and dot strength, dot timing.
- Docs site: a Spinner page with every variant, size and tone, a live demo of the show-after delay, props, accessibility and tokens.
- Tests: `tools/test/spinner.mjs`, and a Button test that unmounts Buttons and Spinners.

### Changed

- Button's loading spinner is now the Spinner ring (decorative, at the button's icon size) instead of the `progress_activity` icon, so there's one spinner across the system.

### Fixed

- Removing a Button from the page (unmounting it) threw an error in React: an effect returned the shared status region instead of a cleanup function. Buttons and Spinners now unmount cleanly.

## 2.4.0 - 2026-10-10

### Changed

- Button's icon nudge is off by default: a right icon no longer slides on hover unless you turn it on with `--button-icon-nudge: var(--spacing-0\.5)` (2px), on the page, a container or one button. It suits forward arrows, but every right icon moved, including chevrons and "open in new" icons. The token's default is now `spacing-0`.

## 2.3.3 - 2026-10-10

### Added

- Docs site: a Changelog page (under Start) built from `CHANGELOG.md`, with a link to each release. It shows released versions only; changes waiting for the next release stay under Unreleased in `CHANGELOG.md`.

### Fixed

- Docs site: the Button playground and the hand-written demo buttons had no ripple, because they're plain HTML without the ripple layer the Button component renders. They now get it, and the docs test presses them to check.

## 2.3.2 - 2026-10-10

### Fixed

- Button's ripple still didn't show on a normal click: a click lasts about a tenth of a second, so the ripple started fading while it was a small circle under the mouse pointer. It now always spreads across the whole button before it fades, over `duration-500` (was 700ms in 2.3.1), so every click shows the full wave.

## 2.3.1 - 2026-10-10

### Fixed

- Button's ripple was hard to see: on a button-sized area it spread almost instantly (front-loaded `ease-out` over 500ms) at 15%, so a click read as a brief flash rather than a ripple. It now spreads evenly (`ease-in-out`) over `duration-700` at `opacity-20`, so the wave from the press point is visible on a normal click. `--button-ripple-opacity` and `--button-ripple-duration` default to the new values.

## 2.3.0 - 2026-10-10

### Added

- Button micro-interactions: press feedback (shrinks to 97% while held by pointer, Space or Enter), a ripple from the press point in the text color, a 2px nudge of a right icon on hover (mirrored in right-to-left text), and a cross-fade between the content and the loading spinner. They move only `scale`, `translate` and `opacity`, skip disabled, loading and `link`-variant buttons, and turn off under reduced motion (loading keeps its fade).
- Eight motion component tokens to tune or turn them off: `--button-press-scale`, `--button-press-duration`, `--button-icon-nudge`, `--button-icon-nudge-duration`, `--button-loading-duration`, `--button-ripple-opacity`, `--button-ripple-duration`, `--button-ripple-fade-duration`.
- Token `scale-97` (pressed buttons and small controls) with its utility classes (`scale-97`, `scale-x-97`, `scale-y-97`, `scale-z-97` and negatives): 25,560 classes.
- Tests: `tools/test/button-motion.mjs` (38 checks).

### Changed

- Button transitions name the properties it changes (background, text and border color, text decoration, the focus ring, and scale) instead of the whole `transition-colors` set, so the press can run at its own speed. Nothing changes visually.
- `scale-95` is now described for pressed cards and large surfaces; buttons use `scale-97`.

## 2.2.0 - 2026-10-10

### Added

- Custom icons: draw your own SVGs on the 24×24 grid, put them in `assets/Icons/` and run `python3 tools/icons/build.py`. `<Icon name="…">` and Button's `leftIcon`, `rightIcon` and `icon` take their names, with the same sizes, colors, alignment and accessibility as Material Symbols. The build keeps only shapes in `currentColor` and refuses anything unsafe or off-system with the reason.
- `Diki.customIcons` lists the custom icons; TypeScript gets `CustomIconName` and `IconName`, so custom names autocomplete.
- Tests: `tools/test/icons.py` (the build) and `tools/test/icons.mjs` (custom icons in Icon and Button).

## 2.1.0 - 2026-10-10

### Added

- Button component tokens: 44 `--button-*` tokens for its colors, spacing, sizes and borders (`components/Button/button.tokens.json`). Each is an optional override, set on the page, a container or one button; unset, Button looks exactly as before. Also in the W3C Design Tokens files as `design-tokens/components/button.tokens.json`.
- Tests: every component token refers to a shared token, the CSS uses exactly the defaults in the tokens file, and overrides and nested themes work.

## 2.0.0 - 2026-10-10

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

## 1.0.0 - 2026-10-10

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

[Unreleased]: https://github.com/diki-stwn/serupa-ds/compare/v13.0.0...HEAD
[13.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v12.0.0...v13.0.0
[12.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v11.0.0...v12.0.0
[11.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v10.1.0...v11.0.0
[10.1.0]: https://github.com/diki-stwn/serupa-ds/compare/v10.0.0...v10.1.0
[10.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.7.0...v10.0.0
[9.7.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.6.0...v9.7.0
[9.6.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.5.0...v9.6.0
[9.5.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.4.0...v9.5.0
[9.4.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.3.0...v9.4.0
[9.3.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.2.0...v9.3.0
[9.2.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.1.1...v9.2.0
[9.1.1]: https://github.com/diki-stwn/serupa-ds/compare/v9.1.0...v9.1.1
[9.1.0]: https://github.com/diki-stwn/serupa-ds/compare/v9.0.0...v9.1.0
[9.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v8.0.0...v9.0.0
[8.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v7.1.3...v8.0.0
[7.1.3]: https://github.com/diki-stwn/serupa-ds/compare/v7.1.2...v7.1.3
[7.1.2]: https://github.com/diki-stwn/serupa-ds/compare/v7.1.1...v7.1.2
[7.1.1]: https://github.com/diki-stwn/serupa-ds/compare/v7.0.0...v7.1.1
[7.0.0]: https://github.com/diki-stwn/serupa-ds/compare/v6.0.1...v7.0.0
[6.0.1]: https://github.com/diki-stwn/serupa-ds/compare/v5.1.0...v6.0.1
[5.1.0]: https://github.com/diki-stwn/serupa-ds/compare/v5.0.2...v5.1.0
[5.0.2]: https://github.com/diki-stwn/serupa-ds/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/diki-stwn/serupa-ds/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/diki-stwn/serupa-ds/releases/tag/v5.0.0
