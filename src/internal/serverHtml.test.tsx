/// <reference types="vite/client" />
import { describe, expect, inject, test } from 'vitest';
import { serverBaseline, stories } from '../../tools/test/vitest/stories';

// Every component's server HTML, story by story, against its baseline (E4): a change to what a server sends, a lost
// attribute, a moved id, a new wrapper, shows up as a diff of a few lines in the PR, intended or not. When the change
// is intended, write the new baselines with npm run test:server-html:update and commit them.
// The HTML is serverStories.ts's, rendered in Node with the fixed clock, as the hydration check uses.
const html = inject('serverStories');
const files = import.meta.glob<string>('../../tools/test/baseline-server/*.html', { eager: true, query: '?raw', import: 'default' });
const baseline = Object.fromEntries(Object.entries(files).map(([f, text]) => [f.split('/').at(-1)!.replace(/\.html$/, ''), text]));
const update = 'run npm run test:server-html:update and commit tools/test/baseline-server/ if the change is intended';

describe('server HTML', () => {
  for (const [name] of stories) {
    test(`${name} matches tools/test/baseline-server/${name}.html`, () => {
      expect(baseline[name], `no baseline yet: ${update}`).toBeDefined();
      expect(serverBaseline(name, html), update).toBe(baseline[name]);
    });
  }
  test('every baseline belongs to a component with stories', () => {
    const known = new Set(stories.map(([n]) => n));
    expect(Object.keys(baseline).filter((n) => !known.has(n)), update).toEqual([]);
  });
});
