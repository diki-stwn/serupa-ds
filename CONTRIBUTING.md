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

1. `npm run new-component -- <Name> --group <Storybook group>` writes `src/components/<Name>/` with every file the contract asks for, already wired to the system: the component through `component()`, its CSS in `@layer dk.components` reading its own tokens, its tokens file, stories, a starting test, the Storybook page, the usage guide with its required headings, the preview page and the server-render case.
2. Fill in every `TODO(new-component)`. The contract check fails while one is left.
3. Build it to the standard every component meets, which the checks hold it to:
   - **Accessibility:** WCAG 2.2 AA in all six themes (contrast in its test, axe on every story), keyboard use as the ARIA pattern describes, a visible focus ring (the outline recipe, `focus-ring-width` and `focus-ring-offset`), a forced-colors fallback for any state shown only by background, and nothing floating over the page when printing.
   - **Words** come from its `labels.ts`, in English and Indonesian, never written into the JSX (the `serupa/no-literal-words` lint rule).
   - **Values** read tokens: its own component tokens, falling back to the shared ones (the foundation check).
   - **Tests:** one `test()` per behaviour, found the way people find things (`getByRole`), in random order.
   - **Every option shows:** each value of a prop typed as a short union of strings (`variant`, `size`, `placement`) is rendered by a story or set by a test, unless it is the one the component falls back to (`node tools/test/prop-values.mjs`).
   - **Documented on hover:** every prop has its own doc comment, `@internal` ones stay out of the public types, and the component exports its `…Props` type (`node tools/test/public-docs.mjs`, after a build).
   - **Examples compile:** every `tsx` and `jsx` block in its README type-checks against the built types, imports and all (`node tools/test/doc-snippets.mjs`, after a build). A sketch can leave out its imports, `…` stands for content, and names it never declares (`open`, `setOpen`) count as `any`.
4. `npm run tokens`, `npm run build`, then `node tools/test/api.mjs --update` and `node tools/test/size.mjs --update <Name>` for its baselines.
5. `npx changeset` (minor, "Added: <Name> …"), open the pull request, and add the `update-visual-baselines` label so CI draws its screenshots. Review them.

## API conventions

Every component names the same things the same way, so learning one teaches the rest (the README's [shared conventions](README.md#components) are the short version for people using the package). A new prop follows these; a name that doesn't is deprecated in favour of one that does, never just renamed.

- **A composite's value** (Tabs, Slider, DatePicker, Combobox): `value` (controlled), `defaultValue` (uncontrolled) and `onValueChange(value)`.
- **An overlay's open state** (Menu, Popover, Tooltip): `open`, `defaultOpen` and `onOpenChange(open)`.
- **Any other state people can change:** `x`, `defaultX` and `onXChange(x)`, named for the state: `pressed` and `onPressedChange` on ToggleButton, `page` and `onPageChange` on Pagination, `editing` and `onEditingChange` on InlineEdit.
- **A wrapper of one native element** (Input, Textarea, Select, Checkbox, Switch) keeps the element's own `value`, `checked` and `onChange(event)` from React's types, so it works with form libraries as the element does. Checkbox and Switch also take `onCheckedChange(checked, event)`, the on/off shape MenuCheckboxItem and ToggleButton use.
- **`size`** on controls is `'sm' | 'md' | 'lg'`, at the control heights 24, 32 and 44px. Components on another scale say so in the type: Heading and Text follow the type scale, Container the page widths, Avatar and Icon their own sizes.
- **`tone`** is what a color means (`neutral`, `primary`, `info`, `success`, `warning`, `danger`), and **`variant`** is the visual style (for example `solid`, `subtle`, `outline`, `ghost`). Badge takes both: `tone="danger" variant="outline"`.
- **A console warning** about a mistake goes through `warnOnce()` (`src/internal/warn.ts`), inside `if (process.env.NODE_ENV !== "production" && …)`, so a production build drops it and its text. Its first argument is a code (`"tabs-value"`) with a section in [docs/warnings.md](docs/warnings.md), which the warning links to. `node tools/test/dev-warnings.mjs` fails on a warning that isn't guarded or has no section.

`node tools/test/props.mjs` checks the callbacks: a component's own `on…Change` names a prop it has, and only a native wrapper has a plain `onChange`. The known exceptions are listed in it with their reasons.

## Pull requests

Keep one change per pull request; several small fixes to the same component can share one. CI on a pull request tests only what the change can affect, and the first failing job stops the run. If two pull requests change the same file, the second merges `main` before it can merge, so pick work that doesn't overlap.
