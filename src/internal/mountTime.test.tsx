/// <reference types="vite/client" />
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { storiesToRun } from '../../tools/test/vitest/stories';

// How long each story takes to mount (F9), as React's Profiler counts it: the render and commit of the first mount,
// the fastest of five so a slow tick of the machine doesn't count. A story that takes longer than BUDGET to mount
// fails. This is React's development build, slower than an app's production one: the slowest story here took about
// 9 ms on 25 Oct 2026 (NumberInput/Currency), most take under 4, and 20 leaves room for a slower CI machine.
const BUDGET = 20;
// Each PhoneInput lists every country (244 options) and takes about 7 to 9 ms to mount here, so its stories get a
// budget of their own until the list is made cheaper. A pull request's CI run measured one PhoneInput at 21 to 28 ms
// on 30 Oct 2026, three times the local time, so each budget is about five times what it takes here: one PhoneInput
// 40 ms, States (four of them, 23 ms here) 120 and ByArea (six, 57 ms here) 280.
const OWN_BUDGET: Record<string, number> = {
  'PhoneInput/Controlled': 40, 'PhoneInput/InAField': 40, 'PhoneInput/LongValue': 40, 'PhoneInput/Playground': 40,
  'PhoneInput/States': 120, 'PhoneInput/ByArea': 280,
};
const RUNS = 5;
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

async function mountTime(ui: React.ReactElement): Promise<number> {
  let best = Infinity;
  for (let i = 0; i < RUNS; i++) {
    let took = 0;
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    flushSync(() => root.render(<React.Profiler id="m" onRender={(_id, phase, actual) => { if (phase === 'mount') took += actual; }}>{ui}</React.Profiler>));
    root.unmount();
    host.remove();
    best = Math.min(best, took);
    await frame();
  }
  return best;
}

describe('mount time', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories each mount within their budget`, async () => {
      const slow: string[] = [];
      for (const [exportName, ui] of list) {
        const ms = await mountTime(ui);
        const budget = OWN_BUDGET[`${name}/${exportName}`] ?? BUDGET;
        if (ms > budget) slow.push(`${exportName}: ${ms.toFixed(1)} ms (budget ${budget})`);
      }
      expect(slow).toEqual([]);
    });
  }
});
