/// <reference types="vite/client" />
import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { stories } from '../../tools/test/vitest/stories';
import { Combobox } from '../components/Combobox/Combobox';

// How long the page takes to answer a click or a key in the four components people open and type into most (F9, 119):
// the browser's own Event Timing, from the input to the next paint, which is what Interaction to Next Paint (INP)
// counts. A real phone's budget for a good INP is 200 ms; this is a desktop browser on React's development build,
// where an answer takes one or two frames (16-24 ms on 25 Oct 2026), so BUDGET fails a change that makes one take
// several times that, such as rebuilding every option on each keystroke.
const BUDGET = 100;
// Event Timing reports only an answer that took 16 ms or more: on a fast machine, none at all is a pass. WebKit has
// no Event Timing, so there is nothing to measure there.
const supported = PerformanceObserver.supportedEntryTypes.includes('event');
const timings: PerformanceEventTiming[] = [];
if (supported) new PerformanceObserver((list) => timings.push(...(list.getEntries() as PerformanceEventTiming[]))).observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit);
// Event Timing entries arrive after the paint they wait for.
const settle = () => new Promise((r) => setTimeout(r, 300));
const story = (component: string, name = 'Playground') => stories.find(([n]) => n === component)![1].find(([n]) => n === name)![1];
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;

// J11: ten thousand options, as a long list of products or people would have. Combobox puts at most 100 rows in the
// page and folds each label once, so filtering stays inside the same budget with no deferred rendering.
const TEN_THOUSAND = Array.from({ length: 10_000 }, (_, i) => ({ value: 'o' + i, label: `Option ${i} ${['and', 'ant', 'bee', 'cat'][i % 4]}` }));

const INTERACTIONS: Array<[string, string, () => Promise<void>, React.ReactElement?]> = [
  ['Combobox', 'opening it and typing two letters', async () => { await userEvent.click($('[role=combobox]')); await userEvent.keyboard('an'); }],
  ['Dialog', 'opening it', async () => { await userEvent.click($('button')); }],
  ['Menu', 'opening it, moving down and closing it', async () => { await userEvent.click($('button')); await userEvent.keyboard('{ArrowDown}{Escape}'); }],
  ['Combobox', 'with 10,000 options, opening it and typing two letters', async () => { await userEvent.click($('[role=combobox]')); await userEvent.keyboard('an'); }, <Combobox aria-label="Products" options={TEN_THOUSAND} />],
  ['Select', 'picking the next option with the keyboard', async () => { $('select').focus(); await userEvent.keyboard('{ArrowDown}'); }],
];

describe('interaction to next paint', () => {
  for (const [component, what, act, ui] of INTERACTIONS) {
    test.runIf(supported)(`${component}: ${what} answers within ${BUDGET} ms`, async () => {
      const r = await render(ui ?? story(component));
      await settle();
      timings.length = 0;
      await act();
      await settle();
      const slow = timings.filter((t) => t.interactionId && t.duration > BUDGET).map((t) => `${t.name}: ${t.duration} ms`);
      expect(slow).toEqual([]);
      await r.unmount();
    });
  }
});
