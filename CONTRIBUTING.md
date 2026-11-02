# Contributing

How a change gets into Serupa. The tools and every check are described in [tools/README.md](tools/README.md); this page is the order to do things in.

## Every change

Work on the repository with **Node 26**: `nvm use` (or `fnm use`) reads `.nvmrc`. On an older Node, `npm install` and every `npm run` script stop with `EBADDEVENGINES` (package.json's `devEngines`), on purpose. Projects that install the package need only Node 22 or later (`engines`).

1. **A branch and a pull request.** Nothing goes to `main` directly. CI runs on the pull request and it merges only when the `test` check is green; nothing bypasses it.
2. **Run the fast checks first:** `npm run typecheck`, `npm run lint` and `npm run test:unit` (the component tests, a few seconds). `node tools/test/run.mjs --since main` runs everything your change can affect, as CI will.
3. **A changeset** (`npx changeset`) when a project using the package gets something different: patch, minor or major by the rules in the README's [Versioning](README.md#versioning) section, with a line starting Added, Changed, Deprecated, Removed, Fixed or Security ([.changeset/README.md](.changeset/README.md)). A change only to the tests, tools or workflows takes the `no-changeset` label instead.
4. **A breaking change goes in a major,** with a migration note in its changeset: what to change, before and after. Names are deprecated first and removed in the next major.
5. **Baselines move only on purpose.** When a change is meant to change the API, a size or a picture, update that baseline in the same pull request and say why: `node tools/test/api.mjs --update`, `node tools/test/size.mjs --update <Name>`, and the `update-visual-baselines` label for screenshots (CI commits only the pictures that changed).

## A new component

**First, pick a direction by looking.** `npm run new-component -- <Name> --directions` writes one story, Directions/<Name> in `src/directions/`, with two or three takes behind one Storybook switch. The takes should differ in kind, such as layout, density or motion, not in polish. Draw each one just far enough to judge, flip between them, and pick one. Write the pick and the reason in the pull request, then delete the file. The contract check fails while it's there, so it never merges.

1. `npm run new-component -- <Name> --group <Storybook group>` writes `src/components/<Name>/` with every file the contract asks for, already wired to the system: the component through `component()`, its CSS in `@layer dk.components` reading its own tokens, its tokens file, stories, a starting test, the Storybook page, the usage guide with its required headings, the preview page and the server-render case.
2. Fill in every `TODO(new-component)`. The contract check fails while one is left.
3. Build it to the standard every component meets, which the checks hold it to:
   - **Accessibility:** WCAG 2.2 AA in all six themes (contrast in its test, axe on every story), keyboard use as the ARIA pattern describes, a visible focus ring (the outline recipe, `focus-ring-width` and `focus-ring-offset`), a forced-colors fallback for any state shown only by background, and nothing floating over the page when printing.
   - **Words** come from its `labels.ts`, in English and Indonesian, never written into the JSX (the `serupa/no-literal-words` lint rule).
   - **Waits** in JavaScript are named in `src/internal/timing.ts`, never a number in a `setTimeout` or `setInterval` (the `serupa/no-literal-delay` lint rule).
   - **Values** read tokens: its own component tokens, falling back to the shared ones (the foundation check).
   - **Tests:** one `test()` per behaviour, found the way people find things (`getByRole`), in random order.
   - **A field in a form:** a component that takes a `name` must be in `src/internal/formContract.test.tsx` (the typecheck fails until it is), which holds it to what a native field does: it submits under its name, with `form="…"` too, resets, goes quiet in a disabled fieldset, takes focus from `ref.focus()`, and inside a Field is described by the hint and the error and marked invalid.
   - **Every option shows:** each value of a prop typed as a short union of strings (`variant`, `size`, `placement`) is rendered by a story or set by a test, unless it is the one the component falls back to (`node tools/test/prop-values.mjs`).
   - **Documented on hover:** every prop has its own doc comment, `@internal` ones stay out of the public types, and the component exports its `…Props` type (`node tools/test/public-docs.mjs`, after a build).
   - **Examples compile:** every `tsx` and `jsx` block in its README type-checks against the built types, imports and all (`node tools/test/doc-snippets.mjs`, after a build). A sketch can leave out its imports, `…` stands for content, and names it never declares (`open`, `setOpen`) count as `any`.
4. `npm run tokens` (after a change to `tokens/serupa.tokens.json` too), `npm run build`, then `node tools/test/api.mjs --update` and `node tools/test/size.mjs --update <Name>` for its baselines.
5. **Run the reviews below,** the motion review and the worst-case review, and before its first release the bug bash. Put what they found in the pull request.
6. **It starts as beta:** `@beta` in the doc comment on its export (the generator writes it), so editors, its Storybook page and the README's index say so. Take the tag off, with a patch changeset, once it has shipped in a release with its bug bash done and nothing it found is still open.
7. `npx changeset` (minor, "Added: <Name> …"), open the pull request, and add the `update-visual-baselines` label so CI draws its screenshots. Review them.

## Reviews by eye

The checks catch a raw duration, an animation that won't reverse or a page that scrolls sideways at 320px. They can't tell whether a motion is worth having or whether a long name reads well. Run these two before opening a pull request that adds or changes what moves or what a component shows, and every new component runs both.

### Motion review

1. **How often is it seen?** Something used many times a day (a menu, a toggle, a tab, typing) moves little and fast, or not at all. A rare moment (a first success, a finished upload) can take longer. Nothing animates on every keystroke.
2. **Name its purpose in one line:** where a surface came from, that a value changed, that a press landed. If the only answer is "it looks nice", leave it out.
3. **Timing comes from a role,** never a number: `motion-press`, `motion-hover`, `motion-enter-*`, `motion-exit-*`, `motion-change-*` or `motion-loop-*`, with `ease-enter`, `ease-exit`, `ease-move` or `ease-settle`. Pick the size by how far it travels. Exits are shorter than entries (`motion-exit-md` is 150ms to `motion-enter-md`'s 200ms), so a closed surface gets out of the way. `node tools/test/motion-tokens.mjs` fails a raw `250ms` or `cubic-bezier()`.
4. **It reverses from where it is.** A surface closed half way through opening turns back from there, so it enters with a transition, not keyframes. `src/internal/motion.test.tsx` checks this, and that nothing animates layout or runs on mount.
5. **It grows from its origin.** A popup scales from the edge facing its trigger (`data-side`), not from its centre.
6. **Under reduced motion it only fades:** nothing moves, scales or loops (the motion test checks the stories). Look at it once with the system setting on.
7. **Hover waits for a pointer.** Hover styles sit in `@media (hover: hover)`, so a tap on a phone doesn't leave a tint behind (`node tools/test/touch-hover.mjs`).
8. **Watch it slowly.** In Storybook, set the Motion menu to ×10 and watch it frame by frame. Check a swipe or a drag on a real phone too.
9. **Write it down** in the pull request as a table with Before, After and Why for each motion it adds or changes.

### Worst-case review

1. **Our content, not the tidy demo.** In Storybook, switch the Content menu to Worst case, Empty and One item. Stories with people read them from `.storybook/content.ts` (`usePeople()` or `useNames()`), and a new one with people does too. The worst case has long Indonesian names, a single name, a one-letter name, an emoji first, stacked diacritics, Arabic, Chinese, a long address and missing fields.
2. **At 320px wide and with text at 200%.** `node tools/test/storybook.mjs` checks every story for sideways scrolling and cut-off text (WCAG 1.4.10 and 1.4.4). Look at the story at both sizes too.
3. **Right to left, and dark.** Switch the toolbar to `rtl` and to dark. Chevrons, bars and paddings turn with the text, and nothing loses contrast.
4. **Choose for each text that can grow:** wrap it (the default, for names, messages and labels), truncate it with the full text still reachable (one-line cells and tabs), or clamp it to a few lines with a way to read the rest. Say which in the pull request. A word with no place to break still wraps inside its box (`src/internal/longWords.test.tsx` and `overflowWrap.test.tsx`).
5. **Empty and one.** An empty state says what is missing and what to do next. One item looks finished, with no "1 items" and no gap left for a second.

### First-release bug bash

Run once on a new component before the release that first ships it, with the pull request's Storybook build. Each line is a kind of bug that reached a release before (R29 to R35); write each result in the pull request, with what you fixed.

1. **320px wide** and **text at 200%:** nothing scrolls sideways, nothing is cut off, every control can still be reached.
2. **Forced colors** (Windows High Contrast, or Chromium's rendering emulation): every state still shows, selected, checked, current, disabled and focused, without relying on a background.
3. **Right to left** (`dir="rtl"`) with **Arabic digits** (`locale="ar-EG"`): numbers, dates and counts read in the locale's digits, and arrows and keys follow the reading direction.
4. **A long German word** (Donaudampfschifffahrtsgesellschaft) and **an emoji** in every text it shows: wrapped or truncated as the worst-case review chose, with no broken surrogate pairs.
5. **A screen reader pass** (VoiceOver or NVDA): its name, role, state and every change it announces, once with the keyboard and once by touch.
6. **Touch:** on a real phone, every target is at least 24px, a tap does what a click does, and a swipe or drag has a button alternative (`node tools/test/drag-alternatives.mjs`).

## API conventions

Every component names the same things the same way, so learning one teaches the rest (the README's [shared conventions](README.md#components) are the short version for people using the package). A new prop follows these; a name that doesn't is deprecated in favour of one that does, never just renamed.

- **A composite's value** (Tabs, Slider, DatePicker, Combobox): `value` (controlled), `defaultValue` (uncontrolled) and `onValueChange(value)`.
- **An overlay's open state** (Menu, Popover, Tooltip): `open`, `defaultOpen` and `onOpenChange(open)`.
- **Any other state people can change:** `x`, `defaultX` and `onXChange(x)`, named for the state: `pressed` and `onPressedChange` on ToggleButton, `page` and `onPageChange` on Pagination, `editing` and `onEditingChange` on InlineEdit.
- **A wrapper of one native element** (Input, Textarea, Select, Checkbox, Switch) keeps the element's own `value`, `checked` and `onChange(event)` from React's types, so it works with form libraries as the element does. Checkbox and Switch also take `onCheckedChange(checked, event)`, the on/off shape MenuCheckboxItem and ToggleButton use.
- **A callback's second argument**, when it has one, is a details object: `onValueChange(value, details)` and `onOpenChange(open, details)`, with fields such as `event`, `reason` or `iso`. Never a bare event, string or number, so a later release can add a field without a new signature. A callback that only reports its value takes one argument. `node tools/test/props.mjs` holds new callbacks to it; the older ones that pass an event, an ISO string or a number are listed there and move in the next major.
- **A boolean** is named for what it turns on or shows, in the positive: an adjective or a verb phrase (`loading`, `clearable`, `showCount`, `closeOnBackdrop`). To hide a part, `hideX` (`hideOutside`), never `noX` or `xHidden`; and `disabled` everywhere, never `enabled`. A part shown by default may default to `true` and is turned off with `={false}` (`closeButton={false}`, `arrows={false}`). `node tools/test/props.mjs` holds every prop to it; a renamed one keeps its old name only as `@deprecated`, with a warning (13.0.0 removed `noTitle` and `captionHidden`, a release after `hideTitle` and `hideCaption` replaced them).
- **`size`** on controls is `'sm' | 'md' | 'lg'`, at the control heights 24, 32 and 44px. Components on another scale say so in the type: Heading and Text follow the type scale, Container the page widths, Avatar and Icon their own sizes.
- **`tone`** is what a color means (`neutral`, `primary`, `info`, `success`, `warning`, `danger`), and **`variant`** is the visual style (for example `solid`, `subtle`, `outline`, `ghost`). Badge takes both: `tone="danger" variant="outline"`.
- **A console warning** about a mistake goes through `warnOnce()` (`src/internal/warn.ts`), inside `if (process.env.NODE_ENV !== "production" && …)`, so a production build drops it and its text. Its first argument is a code (`"tabs-value"`) with a section in [docs/warnings.md](docs/warnings.md), which the warning links to. `node tools/test/dev-warnings.mjs` fails on a warning that isn't guarded or has no section.

`node tools/test/props.mjs` checks the callbacks: a component's own `on…Change` names a prop it has, and only a native wrapper has a plain `onChange`. The known exceptions are listed in it with their reasons.

## Pull requests

Keep one change per pull request; several small fixes to the same component can share one. CI on a pull request tests only what the change can affect, and the first failing job stops the run. If two pull requests change the same file, the second merges `main` before it can merge, so pick work that doesn't overlap.
