/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// Mount and unmount every story three times (G7): whatever a story leaves behind once it's gone has to stay the same
// from the first time to the third, or it grows in an app each time a page shows the component. Counted here, in
// this test's own frame (a heap count would take in the other test files' frames, which share the page):
//   listeners on window, document, <html> and <body> that were added and not removed
//   intervals that were started and not cleared
//   ResizeObserver, MutationObserver and IntersectionObserver that observe something and weren't disconnected
//   elements left in <body> or <head>
// The first mount can leave what is made once and shared (the live regions, a style sheet); only growth after it
// counts. Watched from before the stories load, so nothing they start is missed.
const GLOBAL = new Set<EventTarget>([window, document, document.documentElement, document.body]);
const listeners = new Map<string, number>();
const key = (t: EventTarget, type: string, capture: boolean) =>
  `${t === window ? 'window' : t === document ? 'document' : (t as Element).tagName.toLowerCase()} ${type}${capture ? ' (capture)' : ''}`;
const capture = (o?: boolean | AddEventListenerOptions) => (typeof o === 'boolean' ? o : !!o?.capture);
const seen = new WeakMap<EventTarget, Array<[unknown, string, boolean]>>();
function added(t: EventTarget, type: string, fn: unknown, o?: boolean | AddEventListenerOptions) {
  // Adding the same listener twice adds it once; a { once } listener or one tied to a signal lets go by itself.
  if (!fn || !GLOBAL.has(t) || (typeof o === 'object' && (o.once || o.signal))) return;
  const list = seen.get(t) || [];
  seen.set(t, list);
  if (list.some(([f, ty, c]) => f === fn && ty === type && c === capture(o))) return;
  list.push([fn, type, capture(o)]);
  listeners.set(key(t, type, capture(o)), (listeners.get(key(t, type, capture(o))) || 0) + 1);
}
function removed(t: EventTarget, type: string, fn: unknown, o?: boolean | EventListenerOptions) {
  const list = seen.get(t);
  const at = list ? list.findIndex(([f, ty, c]) => f === fn && ty === type && c === capture(o)) : -1;
  if (at < 0) return;
  list!.splice(at, 1);
  listeners.set(key(t, type, capture(o)), listeners.get(key(t, type, capture(o)))! - 1);
}
// On the prototype, and on window itself: Vitest's browser runner puts its own addEventListener on window, bound
// to the original, so window's listeners never reach the prototype's.
for (const owner of [EventTarget.prototype, ...(Object.prototype.hasOwnProperty.call(window, 'addEventListener') ? [window] : [])] as EventTarget[]) {
  const add = owner.addEventListener, remove = owner.removeEventListener;
  owner.addEventListener = function (this: EventTarget, type: string, fn: EventListenerOrEventListenerObject | null, o?: boolean | AddEventListenerOptions) {
    added(this, type, fn, o);
    return add.call(this, type, fn, o);
  };
  owner.removeEventListener = function (this: EventTarget, type: string, fn: EventListenerOrEventListenerObject | null, o?: boolean | EventListenerOptions) {
    removed(this, type, fn, o);
    return remove.call(this, type, fn, o);
  };
}
const intervals = new Set<number>();
const setI = window.setInterval, clearI = window.clearInterval;
window.setInterval = ((handler: TimerHandler, ms?: number, ...a: unknown[]) => { const id = setI(handler, ms, ...a); intervals.add(id); return id; }) as typeof window.setInterval;
window.clearInterval = ((id?: number) => { if (id !== undefined) intervals.delete(id); clearI(id); }) as typeof window.clearInterval;
const observing = new Map<object, string>();
for (const name of ['ResizeObserver', 'MutationObserver', 'IntersectionObserver'] as const) {
  const Real = window[name] as unknown as { prototype: { observe: (...a: unknown[]) => void; disconnect: () => void } };
  const observe = Real.prototype.observe, disconnect = Real.prototype.disconnect;
  Real.prototype.observe = function (this: object, ...a: unknown[]) { observing.set(this, name); return observe.apply(this, a); };
  Real.prototype.disconnect = function (this: object) { observing.delete(this); return disconnect.call(this); };
}
const { storiesToRun } = await import('../../tools/test/vitest/stories');

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const describeEl = (el: Element) => `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}>`;

// What is left now, as counts by name, so two of them can be compared.
function left(): Map<string, number> {
  const out = new Map<string, number>();
  const count = (k: string, n = 1) => out.set(k, (out.get(k) || 0) + n);
  for (const [k, n] of listeners) if (n > 0) count(`listener on ${k}`, n);
  if (intervals.size) count('interval', intervals.size);
  for (const name of observing.values()) count(`${name} not disconnected`);
  for (const el of [...document.body.children, ...document.head.children]) count(`${describeEl(el)} left in <${el.parentElement!.tagName.toLowerCase()}>`);
  return out;
}

async function cycle(ui: React.ReactElement) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await frame();
  root.unmount();
  host.remove();
}

describe('leaks', () => {
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories leave nothing behind that grows each time they mount`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) {
        await cycle(ui);
        const after1 = left();
        await cycle(ui);
        await cycle(ui);
        for (const [k, n] of left()) if (n > (after1.get(k) || 0)) problems.push(`${exportName}: ${k} (${after1.get(k) || 0} after the first mount, ${n} after the third)`);
      }
      expect(problems).toEqual([]);
    });
  }
});
