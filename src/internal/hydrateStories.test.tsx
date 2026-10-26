import * as React from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, inject, test } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// Every story is rendered to HTML as a server would, then hydrated: React must find the same markup, with no
// mismatch and no recoverable error (F3). A mismatch makes React throw the server HTML away and render again in the
// browser, so a server-rendered page flashes and loses what people typed before hydration.
// The HTML comes from Node (tools/test/vitest/serverStories.ts), in modules of their own, not from this page's: so
// module state that a render here leaves behind can't make the browser agree with a server it never saw (L2).
const html = inject('serverStories');

async function hydrate(ui: React.ReactElement, serverHtml: string) {
  const host = document.createElement('div');
  host.innerHTML = serverHtml;
  document.body.appendChild(host);
  const errors: string[] = [], logError = console.error;
  console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); };
  let root: Root | undefined;
  try {
    flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
    await new Promise((r) => setTimeout(r, 20));
  } finally {
    console.error = logError;
    root?.unmount();
    host.remove();
  }
  return errors;
}

for (const [name, list] of storiesToRun()) {
  describe(`${name} stories hydrate`, () => {
    for (const [exportName, ui] of list) {
      test(`${exportName}`, async () => {
        const serverHtml = html[`${name}/${exportName}`];
        expect(serverHtml, 'the server render in Node').not.toMatch(/^Error: /);
        expect(await hydrate(ui, serverHtml)).toEqual([]);
      });
    }
  });
}
