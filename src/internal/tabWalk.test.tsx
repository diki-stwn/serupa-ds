/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { storiesToRun } from '../../tools/test/vitest/stories';

// Tab and Shift+Tab through every story, from a button before it to a button after it (G6, WCAG 2.1.2 No Keyboard
// Trap): focus has to get through and out each way, and never land somewhere a screen reader can't follow (inside
// aria-hidden or inert). An open modal keeps focus in on purpose; Escape, the way out it offers, has to let it go.
const STEPS = 150;
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const describeEl = (el: Element | null) => {
  if (!el || el === document.body) return 'the page (focus was lost)';
  const name = el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 30);
  return `<${el.tagName.toLowerCase()}${el.getAttribute('role') ? ` role="${el.getAttribute('role')}"` : ''}>${name ? ` "${name}"` : ''}`;
};

// Walks from one end to the other; returns what went wrong, or null.
async function walk(from: HTMLElement, to: HTMLElement, shift: boolean): Promise<string | null> {
  from.focus();
  const seen = new Map<Element, number>();
  let escapes = 0;
  for (let i = 0; i < STEPS; i++) {
    await userEvent.tab({ shift });
    const at = document.activeElement;
    if (at === to) return null;
    if (at && at !== document.body && (at.closest('[aria-hidden="true"]') || at.closest('[inert]')))
      return `focus landed on ${describeEl(at)}, inside ${at.closest('[inert]') ? 'inert' : 'aria-hidden'} content, which a screen reader doesn't read`;
    // Back on an element already visited: focus is going round in circles. Escape is how a modal lets go.
    if (at && seen.has(at) && i - seen.get(at)! > 0) {
      if (escapes++ >= 3) return `focus goes round ${describeEl(at)} and Escape doesn't let it out`;
      await userEvent.keyboard('{Escape}');
      await frame();
      seen.clear();
      continue;
    }
    if (at) seen.set(at, i);
  }
  return `focus didn't get ${shift ? 'back' : 'through'} in ${STEPS} presses of ${shift ? 'Shift+Tab' : 'Tab'} (last on ${describeEl(document.activeElement)})`;
}

async function check(ui: React.ReactElement): Promise<string[]> {
  const before = document.body.appendChild(document.createElement('button'));
  const host = document.body.appendChild(document.createElement('div'));
  const after = document.body.appendChild(document.createElement('button'));
  before.textContent = 'before';
  after.textContent = 'after';
  const root = createRoot(host);
  try {
    flushSync(() => root.render(ui));
    await frame();
    await new Promise((r) => setTimeout(r, 50));
    const problems: string[] = [];
    const forward = await walk(before, after, false);
    if (forward) problems.push(`Tab: ${forward}`);
    const back = await walk(after, before, true);
    if (back) problems.push(`Shift+Tab: ${back}`);
    return problems;
  } finally {
    root.unmount();
    for (const el of [before, host, after]) el.remove();
  }
}

describe('keyboard walk', () => {
  for (const [name, list] of storiesToRun()) {
    test(`focus gets through and out of every ${name} story with Tab and Shift+Tab`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) for (const p of await check(ui)) problems.push(`${exportName}: ${p}`);
      expect(problems).toEqual([]);
    });
  }
});
