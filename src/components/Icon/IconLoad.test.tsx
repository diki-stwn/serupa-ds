import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconChunks } from '../../icons';
import { partOf } from '../../material/parts';
import { Icon } from './Icon';

const path = (id: string) => document.querySelector(`#${id} svg path`);

describe('Icon: the icons by name fail to load', () => {
  test('the box stays empty and warns once with the reason; it draws when the browser is back online, and the next Icon loads at once', async () => {
    // The first load fails, as after a network blip or a deploy that removed the old chunk; the loads after it work.
    const named = vi.spyOn(iconChunks, 'named').mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Icon id="first" name="close" />);
    await vi.waitFor(() => expect(warn.mock.calls.some((c) => /icon-load/.test(String(c[0])) && /Failed to fetch/.test(String(c[0])))).toBe(true));
    expect(path('first')).toBeNull();
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(path('first')).not.toBeNull());
    await render(<Icon id="second" name="search" />);
    await vi.waitFor(() => expect(path('second')).not.toBeNull());
    expect([named.mock.calls.length, warn.mock.calls.filter((c) => /icon-load/.test(String(c[0]))).length]).toEqual([2, 1]);
    warn.mockRestore();
    named.mockRestore();
  });
});

describe('Icon: a name outside the components\' own icons', () => {
  test('loads only the part of the table that holds it, once per part, and never the whole table', async () => {
    const part = vi.spyOn(iconChunks, 'part');
    const all = vi.spyOn(iconChunks, 'all');
    await render(<Icon id="rocket-launch" name="rocket_launch" />);
    await vi.waitFor(() => expect(path('rocket-launch')).not.toBeNull());
    // rocket is in the same part as rocket_launch, home in another.
    await render(<Icon id="rocket" name="rocket" />);
    await vi.waitFor(() => expect(path('rocket')).not.toBeNull());
    await render(<Icon id="home" name="home" />);
    await vi.waitFor(() => expect(path('home')).not.toBeNull());
    expect([part.mock.calls.map((c) => c[0]), all.mock.calls.length]).toEqual([['rocket_launch', 'home'], 0]);
    part.mockRestore();
    all.mockRestore();
  });

  test('every Material Symbol sorts into the part that holds it', () => {
    // The parts as text: each holds its icons as `name: "..."`, in name order.
    const parts = import.meta.glob<string>('../../material/part/*.ts', { eager: true, query: '?raw', import: 'default' });
    const wrong: string[] = [];
    let count = 0;
    for (const [file, text] of Object.entries(parts)) {
      const i = Number(/(\d+)\.ts$/.exec(file)![1]);
      for (const m of text.matchAll(/name: "([a-z0-9_]+)"/g)) { count++; if (partOf(m[1]) !== i) wrong.push(`${m[1]} in part ${i}, partOf says ${partOf(m[1])}`); }
    }
    expect([Object.keys(parts).length, count > 3000, wrong]).toEqual([32, true, []]);
  });
});
