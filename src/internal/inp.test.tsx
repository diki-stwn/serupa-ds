/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { stories } from '../../tools/test/vitest/stories';

// How long the page takes to answer a click or a key in the four components people open and type into most (F9, 119):
// the browser's own Event Timing, from the input to the next paint, which is what Interaction to Next Paint (INP)
// counts. A real phone's budget for a good INP is 200 ms; this is a desktop browser on React's development build,
// where an answer takes one or two frames (16-24 ms on 25 Oct 2026), so BUDGET fails a change that makes one take
// several times that, such as rebuilding every option on each keystroke.
const BUDGET = 100;
const timings: PerformanceEventTiming[] = [];
new PerformanceObserver((list) => timings.push(...(list.getEntries() as PerformanceEventTiming[]))).observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit);
// Event Timing entries arrive after the paint they wait for.
const settle = () => new Promise((r) => setTimeout(r, 300));
const story = (component: string, name = 'Playground') => stories.find(([n]) => n === component)![1].find(([n]) => n === name)![1];
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;

const INTERACTIONS: Array<[string, string, () => Promise<void>]> = [
  ['Combobox', 'opening it and typing two letters', async () => { await userEvent.click($('[role=combobox]')); await userEvent.keyboard('an'); }],
  ['Dialog', 'opening it', async () => { await userEvent.click($('button')); }],
  ['Menu', 'opening it, moving down and closing it', async () => { await userEvent.click($('button')); await userEvent.keyboard('{ArrowDown}{Escape}'); }],
  ['Select', 'picking the next option with the keyboard', async () => { $('select').focus(); await userEvent.keyboard('{ArrowDown}'); }],
];

describe('interaction to next paint', () => {
  for (const [component, what, act] of INTERACTIONS) {
    test(`${component}: ${what} answers within ${BUDGET} ms`, async () => {
      const r = await render(story(component));
      await settle();
      timings.length = 0;
      await act();
      await settle();
      const slow = timings.filter((t) => t.interactionId && t.duration > BUDGET).map((t) => `${t.name}: ${t.duration} ms`);
      expect(timings.some((t) => t.interactionId)).toBe(true);
      expect(slow).toEqual([]);
      await r.unmount();
    });
  }
});
