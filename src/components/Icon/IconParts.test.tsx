import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconChunks } from '../../icons';
import { partOf } from '../../material/parts';
import { Icon } from './Icon';

// A file of its own: the icons a page has loaded stay loaded (module state), and the tests run in a random order, so
// these loads would leave IconLoad.test.tsx's "fail to load" test with nothing left to fail.
const path = (id: string) => document.querySelector(`#${id} svg path`);

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

  test('every Material Symbol sorts into the part that holds it', async () => {
    // The parts as text: each holds its icons as `name: "..."`, in name order. Loaded here rather than with the file
    // (eager), so 2.8 MB of text isn't still loading while the tests above time their warnings.
    const load = import.meta.glob<string>('../../material/part/*.ts', { query: '?raw', import: 'default' });
    const parts = Object.fromEntries(await Promise.all(Object.entries(load).map(async ([f, get]) => [f, await get()] as const)));
    const wrong: string[] = [];
    let count = 0;
    for (const [file, text] of Object.entries(parts)) {
      const i = Number(/(\d+)\.ts$/.exec(file)![1]);
      for (const m of text.matchAll(/name: "([a-z0-9_]+)"/g)) { count++; if (partOf(m[1]) !== i) wrong.push(`${m[1]} in part ${i}, partOf says ${partOf(m[1])}`); }
    }
    expect([Object.keys(parts).length, count > 3000, wrong]).toEqual([32, true, []]);
  });
});
