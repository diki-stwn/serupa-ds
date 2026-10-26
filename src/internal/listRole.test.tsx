/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// FU1: Safari (WebKit) drops list semantics from a <ul> or <ol> whose list-style is none, unless it has role="list"
// or sits in a <nav>, so VoiceOver stops saying "list, 6 items". Chromium keeps the role, so this can only check the
// attribute: every unstyled list a story draws says role="list", or has a role of its own (tree, listbox), or is in a nav.
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
function bare(): string[] {
  return [...document.body.querySelectorAll<HTMLElement>('ul, ol')]
    .filter((l) => getComputedStyle(l).listStyleType === 'none' && !l.hasAttribute('role') && !l.closest('nav'))
    .map((l) => `<${l.tagName.toLowerCase()} class="${l.className}">`);
}

describe('unstyled lists keep their list role (FU1)', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name}: every list-style: none <ul>/<ol> outside a nav has role="list"`, async () => {
      const found = new Set<string>();
      for (const [exportName, ui] of list) {
        const host = document.body.appendChild(document.createElement('div'));
        const root = createRoot(host);
        try {
          flushSync(() => root.render(ui));
          await frame();
          for (const l of bare()) found.add(`${exportName}: ${l}`);
        } finally {
          root.unmount();
          host.remove();
        }
      }
      expect([...found]).toEqual([]);
    });
  }
});
