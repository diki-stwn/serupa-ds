import * as React from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, inject, test, vi } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// Every story's server HTML, hydrated on a page with a strict Content Security Policy, has to lay out as the same
// HTML hydrated on a page without one (GR16). Under style-src-attr 'none' the browser ignores the style attributes in
// server HTML, and React's hydration keeps them as they are rather than setting them again, so a component whose look
// rests on an inline style (a fill's width, a row's indent, a pane's size) stays wrong until something re-renders it,
// unless it applies its styles again through the CSSOM (src/internal/serverStyles.ts). This file's page has the
// policy from the start; serverStyles.test.tsx covers the mechanism itself. The page without the policy is the same
// HTML with every style attribute set through the CSSOM before hydrating, which the policy allows: both sides hydrate
// the same markup, so text that depends on the time (RelativeTime) and what effects measure match.
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = "style-src-attr 'none'";
document.head.appendChild(meta);

const html = inject('serverStories');
const frames = (n: number) => new Promise<void>((r) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : r()); f(); });

// Each element's box, from the host's corner, rounded to the pixel, in document order. A weight first used by this
// story (ErrorSummary's medium links) starts loading at layout, so wait for it: measured in the fallback font, a link
// came out a few pixels narrower on one side only.
async function boxes(host: HTMLElement) {
  await frames(2);
  await document.fonts.ready;
  for (const a of document.getAnimations()) a.finish();
  const o = host.getBoundingClientRect();
  return [...host.querySelectorAll('*')].map((e) => {
    const r = e.getBoundingClientRect();
    return { el: `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''}`, box: [r.left - o.left, r.top - o.top, r.width, r.height].map(Math.round) };
  });
}

// Each element's style attribute as the server sent it, in document order. Read from an inert parse with no policy,
// since a blocked attribute's text isn't kept everywhere (Firefox empties it).
const styleTexts = (serverHtml: string) => [...new DOMParser().parseFromString(serverHtml, 'text/html').body.querySelectorAll('*')].map((e) => e.getAttribute('style') || '');
function setStyle(el: Element, text: string) {
  // One declaration at a time; a ; inside parentheses (url(data:…;base64,…)) doesn't end one.
  for (const d of text.split(/;(?![^(]*\))/)) {
    const at = d.indexOf(':');
    if (at > 0) (el as HTMLElement).style.setProperty(d.slice(0, at).trim(), d.slice(at + 1).trim());
  }
}

// Some styles in server HTML are the app's, not the component's, and an app has them under the policy some other way
// (a class, a stylesheet, 'unsafe-inline' for them), so the strict side gets them before hydrating too:
// - what a story file wrote itself (a wrapper's max-width), found from where React's development build says the
//   element was made;
// - a style a story passes to a component that hands it on as it is (<Card style>, Table's containerProps.style): the
//   same object all the way up to the element the story wrote, which the getting-started page says needs
//   'unsafe-inline' (or a class);
// - Grid's and Stack's: they're Server Components, which don't hydrate, so their columns and gaps need
//   'unsafe-inline' in server HTML (docs/GettingStarted.mdx).
type Fiber = { return: Fiber | null; memoizedProps?: Record<string, unknown> & { style?: unknown }; _debugStack?: Error; _debugOwner?: { type?: unknown } | null };
// The library's components, and the render functions inside forwardRef and memo, by identity.
const LIBRARY = new Set<unknown>(Object.values(await import('../index')).flatMap((v) => (v && (typeof v === 'object' || typeof v === 'function') ? [v, (v as { render?: unknown }).render, (v as { type?: unknown }).type] : [])).filter(Boolean));
const fromStory = (f: Fiber) => {
  // The first frame outside node_modules (a frame ends in :line:col; the "Error: …" header line doesn't).
  const frame = String(f._debugStack?.stack || '').split('\n').find((l) => /:\d+:\d+\)?$/.test(l) && !l.includes('/node_modules/'));
  if (frame) return /\.stories\.tsx|\/tools\/test\//.test(frame);
  // WebKit runs ES modules with proper tail calls, so a story's arrow function that returns JSX (a decorator's
  // wrapper) leaves no frame behind. Then the element's owner says it: made by one of the library's components, it
  // is the component's; made by anything else, the story's.
  const owner = f._debugOwner?.type;
  return !!owner && !LIBRARY.has(owner);
};
const SERVER_ONLY = '[data-component="grid"], [data-component="stack"]';
function appStyled(el: Element) {
  if (el.matches(SERVER_ONLY)) return true;
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  let f = key ? (Reflect.get(el, key) as Fiber) : null;
  if (!f) return false;
  const style = f.memoizedProps?.style;
  for (let up = f.return; style && up; up = up.return) if (Object.values(up.memoizedProps || {}).some((v) => v === style || (!!v && typeof v === 'object' && (v as { style?: unknown }).style === style))) f = up;
  return fromStory(f);
}

// Hydrates the server HTML, with the style attributes at the indexes given (all of them, for the page without the
// policy) set through the CSSOM first. Returns the boxes and which elements' styles are the app's.
async function hydrate(ui: React.ReactElement, serverHtml: string, apply: (i: number) => boolean) {
  // React's development build records where an element was made for only 10,000 elements a second, and a story
  // with many (PhoneInput's country list), straight after others, gets "unknown" past that, so the count starts again.
  const internals = Reflect.get(React, '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE') as { recentlyCreatedOwnerStacks?: number } | undefined;
  if (internals) internals.recentlyCreatedOwnerStacks = 0;
  const host = document.createElement('div');
  host.style.width = '800px';
  document.body.appendChild(host);
  host.innerHTML = serverHtml;
  const texts = styleTexts(serverHtml);
  const els = [...host.querySelectorAll('*')];
  els.forEach((el, i) => { if (texts[i] && apply(i)) setStyle(el, texts[i]); });
  let root: Root | undefined;
  const errors: string[] = [];
  flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
  const app = new Set(els.flatMap((el, i) => (texts[i] && appStyled(el) ? [i] : [])));
  const out = await boxes(host);
  root?.unmount();
  host.remove();
  return { out, app, errors };
}

// What still lays out wrong here, until its fix lands (none now): a component, or one story as
// "<Component>/<Story>". Measured but not held to it, so the fix's pull request can take its name out without this
// file going red first.
const KNOWN = new Set<string>([]);

// The clock stands still through each story's three hydrations, so a RelativeTime can't cross into its next minute
// between them.
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'], now: Date.now() }); });
afterEach(() => { vi.useRealTimers(); });

for (const [name, list] of storiesToRun()) {
  describe(`${name} stories hydrate under a strict CSP`, () => {
    for (const [exportName, ui] of list) {
      test(`${exportName} lays out as it does without the policy`, async () => {
        const serverHtml = html[`${name}/${exportName}`];
        expect(serverHtml, 'the server render in Node').not.toMatch(/^Error: /);
        // The first hydration loads what the story loads on demand (icons drawn by name) and finds the app's styles;
        // the two compared come after it, so both find the same things ready.
        const { app } = await hydrate(ui, serverHtml, () => true);
        const { out: got, errors } = await hydrate(ui, serverHtml, (i) => app.has(i));
        const { out: want } = await hydrate(ui, serverHtml, () => true);
        expect(errors, 'recoverable errors').toEqual([]);
        // Only the elements that differ, so a failure names them.
        const off = got.map((g, i) => ({ ...g, want: want[i]?.box })).filter((g, i) => !want[i] || want[i].el !== g.el || g.box.some((v, k) => Math.abs(v - want[i].box[k]) > 1));
        if (KNOWN.has(name) || KNOWN.has(`${name}/${exportName}`)) return;
        expect(off.slice(0, 5), `${off.length} elements differ (x, y, width, height from the story's corner)`).toEqual([]);
        expect(got.length, 'elements').toBe(want.length);
      });
    }
  });
}
