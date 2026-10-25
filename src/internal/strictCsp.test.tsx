/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// Every story under the strict policy the getting-started page promises works (F4+35): scripts only from the page's
// own server (no eval, no inline script or event handler, no javascript: URL), styles and fonts only from it too,
// and styles set through the DOM. Each story is shown in the browser, where React sets styles through the DOM; what
// a server render needs on top of this (style-src-attr) is serverStyles.test.tsx's. Any violation the browser
// reports while a story is shown fails it. This file's page has the policy from before the stories load.
const POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; form-action 'self'";
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = POLICY;
document.head.prepend(meta);
const violations: string[] = [];
document.addEventListener('securitypolicyviolation', (e) => violations.push(`${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}${e.sample ? ` (${e.sample})` : ''}`));
const { storiesToRun } = await import('../../tools/test/vitest/stories');

// An inline handler is only reported when its event fires, which may be after the story is gone: the markup is
// checked for them, and for javascript: URLs, directly.
function inline(root: Element): string[] {
  const out: string[] = [];
  for (const el of root.querySelectorAll('*')) for (const a of el.attributes) {
    if (/^on/i.test(a.name)) out.push(`<${el.tagName.toLowerCase()} ${a.name}> is an inline handler`);
    else if (/^\s*javascript:/i.test(a.value)) out.push(`<${el.tagName.toLowerCase()} ${a.name}> is a javascript: URL`);
  }
  return out;
}
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

describe('strict Content Security Policy', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories work under a strict policy`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) {
        violations.length = 0;
        const host = document.body.appendChild(document.createElement('div'));
        const root = createRoot(host);
        flushSync(() => root.render(ui));
        await frame();
        for (const p of inline(host)) problems.push(`${exportName}: ${p}`);
        root.unmount();
        host.remove();
        // Violation events are queued; give them a task to arrive.
        await new Promise((r) => setTimeout(r, 0));
        for (const v of violations) problems.push(`${exportName}: ${v}`);
      }
      expect(problems).toEqual([]);
    });
  }
});
