/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// No story makes a network request of its own (37): a design system that calls home, loads a font or an image from
// someone else's server, or opens a socket would surprise an app with a strict CSP, an offline page or a privacy
// review. While each story is shown, any fetch, XMLHttpRequest, sendBeacon, WebSocket or EventSource fails, and so
// does a resource the browser loads from another origin (an <img>, a stylesheet, a font). The page's own files are fine.
const calls: string[] = [];
const note = (kind: string, url: unknown) => calls.push(`${kind} ${String(url instanceof Request ? url.url : url)}`);
const realFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) { note('fetch', input); return realFetch.call(window, input, init); };
const open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
  note('XMLHttpRequest', url);
  return (open as (...a: unknown[]) => void).call(this, method, url, ...rest);
};
const beacon = navigator.sendBeacon.bind(navigator);
navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) => { note('sendBeacon', url); return beacon(url, data); };
for (const name of ['WebSocket', 'EventSource'] as const) {
  const Real = window[name] as unknown as new (url: string | URL, o?: unknown) => object;
  (window as unknown as Record<string, unknown>)[name] = class extends Real { constructor(url: string | URL, o?: unknown) { note(name, url); super(url, o); } };
}
const { storiesToRun } = await import('../../tools/test/vitest/stories');

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const elsewhere = (url: string) => { try { const u = new URL(url, location.href); return /^https?:$/.test(u.protocol) && u.origin !== location.origin; } catch { return false; } };
// What the story's markup asks the browser to load: a request that is refused or still on its way may not have a
// resource entry yet.
function asked(root: Element): string[] {
  const out: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const attr of ['src', 'poster', 'data']) { const v = el.getAttribute(attr); if (v && elsewhere(v)) out.push(`<${el.tagName.toLowerCase()} ${attr}> ${v}`); }
    for (const attr of ['srcset', 'imagesrcset']) for (const part of (el.getAttribute(attr) || '').split(',')) { const v = part.trim().split(/\s+/)[0]; if (v && elsewhere(v)) out.push(`<${el.tagName.toLowerCase()} ${attr}> ${v}`); }
    if (el.tagName === 'LINK' && /stylesheet|preload|prefetch|preconnect|icon|modulepreload/.test(el.getAttribute('rel') || '') && elsewhere(el.getAttribute('href') || '')) out.push(`<link href> ${el.getAttribute('href')}`);
    for (const m of (el.getAttribute('style') || '').matchAll(/url\(\s*['"]?([^'")]+)/g)) if (elsewhere(m[1])) out.push(`style url() ${m[1]}`);
  }
  return out;
}

describe('network', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories make no network request of their own`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) {
        calls.length = 0;
        const since = performance.now();
        const host = document.body.appendChild(document.createElement('div'));
        const root = createRoot(host);
        flushSync(() => root.render(ui));
        await frame();
        const markup = asked(host).map((a) => `asks for ${a}`);
        const loaded = performance.getEntriesByType('resource').filter((e) => e.startTime >= since && elsewhere(e.name)).map((e) => `loaded ${e.name}`);
        root.unmount();
        host.remove();
        for (const c of [...calls, ...markup, ...loaded]) problems.push(`${exportName}: ${c}`);
      }
      expect(problems).toEqual([]);
    });
  }
});
