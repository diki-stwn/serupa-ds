# Working on Serupa

For coding agents, and people, changing this repository. Building an app with Serupa is a different job: [skills/serupa/SKILL.md](skills/serupa/SKILL.md) is for that.

This page is short on purpose and points to the real rules: [CONTRIBUTING.md](CONTRIBUTING.md) is the order to do things in, [tools/README.md](tools/README.md) describes every tool and check, and the README's [Versioning](README.md#versioning) section says what is a patch, a minor or a major.

## Setup

Node 26 (`.nvmrc`), then `npm install` and `npx playwright install chromium`.

## Where things live

- `src/components/<Name>/` holds one component and everything the contract asks for (`node tools/test/contract.mjs` lists it). Start a new one with `npm run new-component`, never by hand.
- `src/internal/` is shared code. A change there reaches every component that uses it, so `node tools/test/run.mjs --since main` tests them all.
- `tokens/serupa.tokens.json` is the source of the design tokens, in the W3C Design Tokens format (ADR-0014). `npm run tokens` makes `tokens.json` from it, then `tokens.css` and `design-tokens/` from `tokens.json`. Never edit `tokens.json` by hand.
- A component's `<name>.tokens.json` is the source of the token table in its README, which `npm run tokens` writes between the `token-table` markers. Change a token's description in the JSON, not the README.
- `dist/` and `src/generated/` are build output: never edit or commit them.
- `docs/adr/` holds the architecture decision records: why tokens, theming, icons, the build and the release work as they do. Read the one behind a part before you change how it works.
- `tools/` never ships. `tools/test/` holds the checks, and their baselines live next to them.

## Fast checks

Run these before every push:

```sh
npm run typecheck
npm run lint
npm run test:unit
node tools/test/run.mjs --since main
```

## Every pull request

- **One change per pull request.** Fixes for the same component go in one pull request. Different components go in different ones.
- **A changeset** (`npx changeset`) when a project using the package gets something different. Otherwise the `no-changeset` label: only tests, tools, docs or workflows changed.
- **Baselines move only on purpose, in the same pull request, with the reason:**
  - Roles, names or structure: `npm run test:aria:update` (`tools/test/baseline-aria/`).
  - Markup: `npm run test:server-html:update` (`tools/test/baseline-server/`).
  - The public API: `node tools/test/api.mjs --update` (`tools/test/baseline-api/`).
  - A component's size: `node tools/test/size.mjs --update <Name>` (`tools/test/baseline-size/`).
  - Shared code (`src/internal/`, the labels) that grows: raise the "All components (index.js)" line of `TOTALS` in `tools/test/size.mjs` by up to 0.5 KiB, with a dated note. A bigger raise needs a reason in the pull request.
  - Looks: add the `update-visual-baselines` label as soon as the pull request opens, so CI draws the new screenshots. Then review them.
- **WCAG 2.2 AA in all six themes.**
- **A failing test is fixed, never skipped.** When it fails in one browser only, find out whether the browser has a real bug (fix the component) or the test assumes too much (fix the test).
