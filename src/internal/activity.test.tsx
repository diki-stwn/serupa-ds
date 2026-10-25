/// <reference types="vite/client" />
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// Every story inside <Activity> (29): when an app hides a part of the page with <Activity mode="hidden"> (a tab
// kept alive, a route kept warm), React keeps its state but runs its effects' cleanups and hides its DOM. What the
// story put elsewhere must go too: once hidden, nothing it showed may still be on screen (a portal in <body>, the
// top layer), no interval it started may still run, and no animation-frame loop may keep going.
const intervals = new Set<number>();
const setI = window.setInterval, clearI = window.clearInterval;
window.setInterval = ((handler: TimerHandler, ms?: number, ...a: unknown[]) => { const id = setI(handler, ms, ...a); intervals.add(id); return id; }) as typeof window.setInterval;
window.clearInterval = ((id?: number) => { if (id !== undefined) intervals.delete(id); clearI(id); }) as typeof window.clearInterval;
let frames = 0;
const raf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb: FrameRequestCallback) => { frames++; return raf(cb); };
const { storiesToRun } = await import('../../tools/test/vitest/stories');
const D = await import('../index');

const frame = () => new Promise((r) => raf(() => raf(r)));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const describeEl = (el: Element) => `<${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? `.${el.className.split(' ')[0]}` : ''}>`;
// On screen: it has a box and isn't hidden by visibility.
const shown = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };

function Toasted() { React.useEffect(() => { D.toast('Saved'); }, []); return null; }
// The stories open no overlay at rest, so each overlay is also shown open, then hidden.
const OPEN: Array<[string, () => React.ReactElement]> = [
  ['Dialog', () => <D.Dialog defaultOpen title="Dialog">Body</D.Dialog>],
  ['Drawer', () => <D.Drawer defaultOpen title="Drawer">Body</D.Drawer>],
  ['Popover', () => <D.Popover defaultOpen title="Popover" trigger={<D.Button>Open</D.Button>}>Body</D.Popover>],
  ['Menu', () => <D.Menu defaultOpen trigger={<D.Button>Open</D.Button>}><D.MenuItem>One</D.MenuItem></D.Menu>],
  ['Tooltip', () => <D.Tooltip defaultOpen content="Tooltip"><D.Button>Open</D.Button></D.Tooltip>],
  ['Toast', () => <><D.Toaster /><Toasted /></>],
];

async function hidden(ui: React.ReactElement, exportName: string, problems: string[]) {
  const before = new Set(document.body.children);
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  const ivBefore = new Set(intervals);
  flushSync(() => root.render(<React.Activity mode="visible">{ui}</React.Activity>));
  await frame();
  await wait(50);
  const opened = document.querySelectorAll(':popover-open, dialog[open], [data-component="toaster"] li[data-tone]').length;
  flushSync(() => root.render(<React.Activity mode="hidden">{ui}</React.Activity>));
  await frame();
  await wait(50);
  // The live regions (internal/announce.ts) are shared by the page and show nothing.
  for (const el of document.body.children) if (!before.has(el) && el !== host && !el.matches('[data-dk-announcer], [data-dk-announcer-assertive]') && shown(el)) problems.push(`${exportName}: ${describeEl(el)} in <body> is still shown`);
  for (const el of document.querySelectorAll(':popover-open, dialog[open]')) if (shown(el)) problems.push(`${exportName}: ${describeEl(el)} is still open in the top layer`);
  const left = [...intervals].filter((id) => !ivBefore.has(id));
  if (left.length) problems.push(`${exportName}: ${left.length} interval(s) still running`);
  frames = 0;
  await wait(200);
  if (frames > 3) problems.push(`${exportName}: an animation-frame loop still runs (${frames} frames in 200ms)`);
  root.unmount();
  host.remove();
  return opened;
}

describe('Activity', () => {
  for (const [name, ui] of OPEN) {
    test(`an open ${name} closes once hidden by <Activity>`, async () => {
      const problems: string[] = [];
      const opened = await hidden(ui(), name, problems);
      expect([opened > 0, problems]).toEqual([true, []]);
    });
  }
  for (const [name, list] of storiesToRun()) {
    test(`${name} stories leave nothing on screen or running once hidden by <Activity>`, async () => {
      const problems: string[] = [];
      for (const [exportName, ui] of list) await hidden(ui, exportName, problems);
      expect(problems).toEqual([]);
    });
  }
});
