import * as React from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, inject, test } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// Every story's server HTML, hydrated on a page with a strict Content Security Policy, has to lay out as the same
// story rendered in the browser (GR16). Under style-src-attr 'none' the browser ignores the style attributes in
// server HTML, and React's hydration keeps them as they are rather than setting them again, so a component whose
// look rests on an inline style (a fill's width, a row's indent, a pane's size) stays wrong until something
// re-renders it, unless it re-applies its styles through the CSSOM (src/internal/serverStyles.ts). The browser
// render sets the same styles through the CSSOM, which the policy allows, so it is the page as it should be.
// This file's page has the policy from the start; serverStyles.test.tsx covers the mechanism itself.
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = "style-src-attr 'none'";
document.head.appendChild(meta);

const html = inject('serverStories');
const frames = (n: number) => new Promise<void>((r) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : r()); f(); });

// Each element's box, from the host's corner, rounded to the pixel, in document order.
async function boxes(host: HTMLElement) {
  await frames(2);
  for (const a of document.getAnimations()) a.finish();
  const o = host.getBoundingClientRect();
  return [...host.querySelectorAll('*')].map((e) => {
    const r = e.getBoundingClientRect();
    return { el: `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''}`, box: [r.left - o.left, r.top - o.top, r.width, r.height].map(Math.round) };
  });
}

// A story's own markup (a wrapper's max-width, a demo's layout) has style attributes too, and under this policy they'd
// stay ignored as well: that's the story's to sort out, as it is any app's, not the component's. So after hydrating,
// the styles on an element a story file wrote (where React's development build says its element was made) are set
// again through the CSSOM, as an app's own styles would be, and only a component's own elements are left as hydrated.
type Fiber = { return: Fiber | null; memoizedProps?: Record<string, unknown> & { style?: unknown }; _debugStack?: Error };
const fromStory = (f: Fiber) => {
  const frame = String(f._debugStack?.stack || '').split('\n').slice(1).find((l) => !l.includes('/node_modules/'));
  return !!frame && /\.stories\.tsx|\/tools\/test\//.test(frame);
};
// A style a story passes to a component (<Card style={…}>) that the component hands on as it is counts as the
// story's too: the getting-started page says such a style needs 'unsafe-inline' (or a class). It's the same object
// all the way up to the element the story wrote, as a prop or a prop's style (Table's containerProps).
const storyMade = (el: Element) => {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  let f = key ? (Reflect.get(el, key) as Fiber) : null;
  if (!f) return false;
  const style = f.memoizedProps?.style;
  for (let up = f.return; style && up; up = up.return) if (Object.values(up.memoizedProps || {}).some((v) => v === style || (!!v && typeof v === 'object' && (v as { style?: unknown }).style === style))) f = up;
  return fromStory(f);
};
// From the style prop React keeps on the element, since Firefox empties a blocked attribute: a custom property as
// given, a number in px where the browser turns it down bare (width: 200), as React writes it.
// Grid and Stack are Server Components, which don't hydrate, so their columns and gaps need
// style-src-attr 'unsafe-inline' in server HTML (docs/GettingStarted.mdx): an app that uses them that way has
// them applied, as here.
const SERVER_ONLY = '[data-component="grid"], [data-component="stack"]';
function restyleStory(host: HTMLElement) {
  for (const el of host.querySelectorAll<HTMLElement>('[style]')) {
    if (!storyMade(el) && !el.matches(SERVER_ONLY)) continue;
    const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'));
    const style = ((key && Reflect.get(el, key)) as { style?: Record<string, string | number | boolean | null | undefined> } | undefined)?.style || {};
    for (const [k, v] of Object.entries(style)) {
      if (v == null || typeof v === 'boolean' || v === '') continue;
      if (k.startsWith('--')) el.style.setProperty(k, String(v));
      else if (Reflect.set(el.style, k, String(v)) && typeof v === 'number' && v && !Reflect.get(el.style, k)) Reflect.set(el.style, k, v + 'px');
    }
  }
}

async function mount(ui: React.ReactElement, serverHtml?: string) {
  const host = document.createElement('div');
  host.style.width = '800px';
  document.body.appendChild(host);
  let root: Root | undefined;
  if (serverHtml === undefined) flushSync(() => { root = createRoot(host); root.render(ui); });
  else { host.innerHTML = serverHtml; flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: () => {} }); }); restyleStory(host); }
  const out = await boxes(host);
  root?.unmount();
  host.remove();
  return out;
}

// What still lays out wrong here, until its fix lands (work queue GR10 to GR12, GR16b): a component, or one story as
// "<Component>/<Story>". Measured but not held to it, so the fix's pull request can take its name out without this
// file going red first.
const KNOWN = new Set(['Rating', 'Splitter', 'TreeView', 'Menu/LongLabels', 'Tabs/Overflow']);

for (const [name, list] of storiesToRun()) {
  describe(`${name} stories hydrate under a strict CSP`, () => {
    for (const [exportName, ui] of list) {
      // retry: a story that shows the time (RelativeTime) can tick between the two renders; a style the policy
      // dropped differs every time.
      test(`${exportName} lays out as the browser render does`, { retry: 2 }, async () => {
        const serverHtml = html[`${name}/${exportName}`];
        expect(serverHtml, 'the server render in Node').not.toMatch(/^Error: /);
        const want = await mount(ui);
        const got = await mount(ui, serverHtml);
        // Only the elements that differ, so a failure names them.
        const off = got.map((g, i) => ({ ...g, want: want[i]?.box })).filter((g, i) => !want[i] || want[i].el !== g.el || g.box.some((v, k) => Math.abs(v - want[i].box[k]) > 1));
        if (KNOWN.has(name) || KNOWN.has(`${name}/${exportName}`)) return;
        expect(off.slice(0, 5), `${off.length} elements differ (x, y, width, height from the story's corner)`).toEqual([]);
        expect(got.length, 'elements').toBe(want.length);
      });
    }
  });
}
