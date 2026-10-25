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
4. `npm run tokens`, `npm run build`, then `node tools/test/api.mjs --update` and `node tools/test/size.mjs --update <Name>` for its baselines.
5. `npx changeset` (minor, "Added: <Name> …"), open the pull request, and add the `update-visual-baselines` label so CI draws its screenshots. Review them.

## Pull requests

Keep one change per pull request; several small fixes to the same component can share one. CI on a pull request tests only what the change can affect, and the first failing job stops the run. If two pull requests change the same file, the second merges `main` before it can merge, so pick work that doesn't overlap.
