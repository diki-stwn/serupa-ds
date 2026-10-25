/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { commands } from 'vitest/browser';

// Every story's accessibility tree, as a screen reader gets it (Playwright's ariaSnapshot: roles, names, states,
// nesting), against tools/test/baseline-aria/<Component>.yml (E3). A lost name, a role that changed, a list that is no
// longer a list shows in the pull request as a diff of a few lines, intended or not, where a picture can look the same.
// When the change is intended, run npm run test:aria:update and commit the new baselines with it.

// The clock stands still at the moment setup.ts starts it from (CLOCK in tools/test/lib.mjs), from before the stories
// are loaded: RelativeTime's tooltip says the minute, so a ticking clock gave another tree whenever a run reached it
// in a later minute. The stories are imported after, so the times they work out when they load are the same too.
const RealDate = Date, now = new RealDate('2025-03-12T10:00:00').getTime();
function StillDate(this: unknown, ...a: unknown[]) {
  if (!new.target) return new RealDate(now).toString();
  return Reflect.construct(RealDate, a.length ? a : [now], new.target) as Date;
}
StillDate.prototype = RealDate.prototype;
Object.setPrototypeOf(StillDate, RealDate);
StillDate.now = () => now;
Object.defineProperty(globalThis, 'Date', { value: StillDate, writable: true, configurable: true });
const { stories } = await import('../../tools/test/vitest/stories');

const files = import.meta.glob<string>('../../tools/test/baseline-aria/*.yml', { eager: true, query: '?raw', import: 'default' });
const baseline = Object.fromEntries(Object.entries(files).map(([f, text]) => [f.split('/').at(-1)!.replace(/\.yml$/, ''), text]));
const mode = await commands.ariaMode();
const update = 'run npm run test:aria:update and commit tools/test/baseline-aria/ if the change is intended';
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// The tree of the whole page while the story is drawn, so what it portals (an open Dialog, a Toaster) is in it too.
// The shared live regions (internal/announce) are left out: whether they exist yet, where they sit and what they
// are saying depends on the stories before, not on this one.
async function tree(ui: React.ReactElement) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    flushSync(() => root.render(ui));
    await frame();
    await new Promise((r) => setTimeout(r, 50));
    const live = [...document.querySelectorAll<HTMLElement>('[data-dk-announcer], [data-dk-announcer-assertive]')];
    for (const el of live) el.hidden = true;
    try { return await commands.ariaSnapshot('body'); } finally { for (const el of live) el.hidden = false; }
  } finally {
    root.unmount();
    host.remove();
  }
}

describe.skipIf(mode === 'off')('accessibility tree', () => {
  for (const [name, list] of stories) {
    test(`${name} matches tools/test/baseline-aria/${name}.yml`, async () => {
      let text = '';
      for (const [exportName, ui] of [...list].sort(([a], [b]) => (a < b ? -1 : 1))) text += `# ${exportName}\n${await tree(ui)}\n\n`;
      if (mode === 'update') return commands.writeAriaBaseline(name, text);
      expect(baseline[name], `no baseline yet: ${update}`).toBeDefined();
      expect(text, update).toBe(baseline[name]);
    });
  }
  test('every baseline belongs to a component with stories', () => {
    const known = new Set(stories.map(([n]) => n));
    expect(Object.keys(baseline).filter((n) => !known.has(n)), update).toEqual([]);
  });
});
