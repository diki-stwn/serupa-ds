// npm run lint: ESLint for the TypeScript, the stories and the tools (Stylelint checks the CSS).
import './tools/typescript/api.mjs';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import noLiteralWords from './tools/lint/no-literal-words.mjs';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import { a11yComponents } from './tools/lint/a11y-components.mjs';

export default tseslint.config(
  { ignores: ['dist/', 'storybook-static/', 'node_modules/', '.test-tmp/', 'tools/test/baseline-api/', '.claude/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // A leading underscore marks a value that is pulled out on purpose and not used.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      // import { type X } keeps a bare import "…" in dist under verbatimModuleSyntax, which bundlers then warn about
      // (FD1); import type { X } leaves nothing.
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      // New in ESLint 10's recommended set; off so the upgrade keeps lint behaving as it did on ESLint 9.
      'no-unassigned-vars': 'off',
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx,js}', 'docs/**/*.tsx', '.storybook/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    // The two classic hook rules only. Plugin 7's recommended set also turns on the React Compiler rules
    // (refs, immutability and others), which flag patterns the components use on purpose.
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  {
    // Type-aware rules for the TypeScript in src/ (typescript-eslint's recommendedTypeChecked, beyond what
    // recommended has): promises left floating, values typed any spreading, an object stringified as
    // "[object Object]", a method passed without its this, assertions that change nothing.
    files: ['src/**/*.{ts,tsx}'],
    // src/generated/ is written by tools/build/registry.mjs: its Object.assign of 25 label sets is typed by annotation.
    ignores: ['src/generated/**'],
    extends: [tseslint.configs.recommendedTypeCheckedOnly],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    // IconName's `(string & {})` keeps editors offering the icon names while taking any string, on purpose.
    rules: { '@typescript-eslint/no-redundant-type-constituents': 'off' },
  },
  {
    // Accessibility on JSX (TF1): an <Image> with no alt, an <IconButton> with no label or a click on something that
    // isn't a control fails here, before any story runs. The settings teach the rules our components: what each one
    // renders (tools/lint/a11y-components.mjs, read from the components themselves), `as` for the polymorphic ones,
    // and `label` as a name, as IconButton and TableSelectCell take it. Not the tests: they render incomplete markup
    // on purpose (a link with no href, autoFocus to set up focus) to see what the component does with it.
    // The hits already there are listed in eslint-suppressions.json, which only shrinks: ESLint fails on a new one
    // and on one that's gone (npx eslint . --prune-suppressions takes it out). Most are patterns kept on purpose:
    // a field's wrapper that forwards a click or mousedown to its input, an option reached by aria-activedescendant,
    // a native dialog closed by a click on its backdrop, a scrolling pane that takes Tab, a group that hands focus
    // to one item (roving tabindex). The queue's TF1 line names the ones to fix in their components.
    files: ['src/components/**/*.tsx', 'docs/**/*.tsx'],
    ignores: ['src/components/**/*.test.tsx'],
    plugins: { 'jsx-a11y-x': jsxA11y },
    settings: { 'jsx-a11y-x': { components: a11yComponents(import.meta.dirname), polymorphicPropName: 'as' } },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y-x/control-has-associated-label': ['error', { labelAttributes: ['label'], ignoreElements: ['input', 'select', 'textarea', 'td', 'th', 'tr'] }],
      // A role prop on one of our components (Tooltip's role="label") is that component's own prop, not ARIA.
      'jsx-a11y-x/aria-role': ['error', { ignoreNonDOM: true }],
      // role="list" on a list with list-style: none, on purpose: Safari's VoiceOver no longer reads it as a list otherwise.
      'jsx-a11y-x/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
    },
  },
  {
    // A component's words come from its labels.ts (English and Indonesian), never written into its JSX (T1).
    files: ['src/components/**/*.tsx'],
    ignores: ['src/components/**/*.{test,stories}.tsx'],
    plugins: { serupa: { rules: { 'no-literal-words': noLiteralWords } } },
    rules: { 'serupa/no-literal-words': 'error' },
  },
  {
    // A test body is async whether it awaits or not, and expect(obj.method) reads a spy without calling it.
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    // Vitest's recommended rules (an expect that never runs its matcher, a test with no expect, a focused or
    // duplicate test), with expect(value, message) allowed and afterEach's no-console-errors guard counted as a test.
    // Conditional expects stay allowed: a test that skips a check where the browser lacks the feature uses them.
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
      'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['afterEach'] }],
      'vitest/no-conditional-expect': 'off',
      '@typescript-eslint/require-await': 'off', '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // The tests are Node scripts, but much of their code runs in the page (page.evaluate), where React,
    // ReactDOM and the system's own globals exist; TypeScript-style undefined checks don't apply there.
    files: ['tools/**/*.mjs', 'bin/**/*.mjs', '.github/**/*.mjs', '*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-undef': 'off' },
  },
);
