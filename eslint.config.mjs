// npm run lint: ESLint for the TypeScript, the stories and the tools (Stylelint checks the CSS).
import './tools/typescript/api.mjs';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import noLiteralWords from './tools/lint/no-literal-words.mjs';

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
