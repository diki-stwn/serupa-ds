/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// Every story with Trusted Types on (36): require-trusted-types-for 'script' makes the browser refuse a string
// written as HTML or script (innerHTML, insertAdjacentHTML, outerHTML, document.write, a script's text or src,
// DOMParser, eval and string timers) unless a policy made it, and nothing in the package may need one: an app that
// turns Trusted Types on gets no violation from a component. This file's page has the policy from before the
// stories load. Browsers without Trusted Types skip it.
const supported = typeof (window as { trustedTypes?: unknown }).trustedTypes === 'object';
const violations: string[] = [];
if (supported) {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "require-trusted-types-for 'script'";
  document.head.prepend(meta);
  document.addEventListener('securitypolicyviolation', (e) => violations.push(`${e.effectiveDirective}${e.sample ? ` (${e.sample})` : ''}`));
}
const { storiesToRun } = await import('../../tools/test/vitest/stories');
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

describe('Trusted Types', () => {
  for (const [name, list] of storiesToRun()) {
    test.runIf(supported)(`${name} stories write no HTML or script as a string`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) {
        violations.length = 0;
        const host = document.body.appendChild(document.createElement('div'));
        const root = createRoot(host);
        try {
          flushSync(() => root.render(ui));
          await frame();
        } catch (e) {
          problems.push(`${exportName}: ${(e as Error).message}`);
        }
        root.unmount();
        host.remove();
        await new Promise((r) => setTimeout(r, 0));
        for (const v of violations) problems.push(`${exportName}: ${v}`);
      }
      expect(problems).toEqual([]);
    });
  }
  // The policy is on: a plain string written as HTML is refused.
  test.runIf(supported)('the page refuses HTML written as a string', () => {
    expect(() => { document.createElement('div').innerHTML = '<b>x</b>'; }).toThrow(TypeError);
  });
});
