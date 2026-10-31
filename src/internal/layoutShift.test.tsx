import * as React from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { beforeAll, describe, expect, inject, test } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// Nothing a component draws on the server may move once the page hydrates and its fonts arrive (PF4): every story's
// server HTML goes in with the stylesheets, then hydrates, then waits for document.fonts.ready and two frames, and the
// layout-shift entries in that time (the Layout Instability API, Chromium only) must add up to 0. A shift there is
// what people see as a page that jumps under the pointer: an icon that was 0 wide on the server, a label measured
// only in an effect, a height set after mount.
const html = inject('serverStories');
const supported = typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('layout-shift');

// Stories that move on purpose, by "<Component>/<Story>", each with why. Each still has to stay under KNOWN_BUDGET.
// Take an entry out when its component's fix lands (GR62 works on Stepper and Pagination).
const KNOWN = new Map<string, string>([
  // Measure their row after mount and wrap or stack when it doesn't fit (useRowWrap): the server can't know the width.
  ['ButtonGroup/LongLabels', 'wraps to fit'],
  ['ButtonGroup/Narrow', 'wraps to fit'],
  ['ToggleGroup/LongLabels', 'wraps to fit'],
  ['Stepper/LongLabels', 'stacks to fit'],
  ['Stepper/Narrow', 'stacks to fit'],
  // Drops page numbers one by one until the row fits.
  ['Pagination/Overflow', 'cuts to fit'],
]);
// About a fifth of what Core Web Vitals counts as a good page (CLS 0.1) for one story.
const KNOWN_BUDGET = 0.03;

type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: Array<{ node?: Node | null }> };
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

async function shiftOf(ui: React.ReactElement, serverHtml: string) {
  const host = document.createElement('div');
  host.style.width = '800px';
  host.innerHTML = serverHtml;
  document.body.appendChild(host);
  await frame(); await frame();
  const entries: Shift[] = [];
  const observer = new PerformanceObserver((list) => { for (const e of list.getEntries()) entries.push(e as Shift); });
  observer.observe({ type: 'layout-shift' });
  let root: Root | undefined;
  try {
    flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: () => {} }); });
    await document.fonts.ready;
    await frame(); await frame();
    for (const e of observer.takeRecords()) entries.push(e as Shift);
  } finally {
    observer.disconnect();
    root?.unmount();
    host.remove();
  }
  const moved = entries.filter((e) => !e.hadRecentInput);
  const total = moved.reduce((sum, e) => sum + e.value, 0);
  const what = moved.flatMap((e) => (e.sources || []).map((s) => (s.node as Element | null)?.getAttribute?.('class') || s.node?.nodeName)).filter(Boolean);
  return { total, what: [...new Set(what)].slice(0, 5).join(', ') };
}

describe.skipIf(!supported)('layout shift', () => {
  // The fonts load once, first, as a returning visitor has them cached: the check is about what hydration moves, and a
  // first font load would shift every story the same way.
  beforeAll(async () => {
    document.body.insertAdjacentHTML('beforeend', '<p id="font-warm" style="position:absolute;opacity:0">Aa <b>Aa</b> <code>Aa</code></p>');
    await document.fonts.ready;
    await frame();
    document.getElementById('font-warm')?.remove();
  });

  for (const [name, list] of storiesToRun()) {
    describe(`${name} stories don't move when they hydrate`, () => {
      for (const [exportName, ui] of list) {
        const key = `${name}/${exportName}`;
        test(`${exportName}`, async () => {
          const serverHtml = html[key];
          if (/^Error: /.test(serverHtml)) return; // hydrateStories.test.tsx reports it
          const { total, what } = await shiftOf(ui, serverHtml);
          if (!KNOWN.has(key)) expect(total, `moved: ${what}`).toBe(0);
          else expect(total, `moved more than a known mover may (${KNOWN.get(key)}): ${what}`).toBeLessThanOrEqual(KNOWN_BUDGET);
        });
      }
    });
  }
});
