import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconChunks, loadAllIcons } from '../../icons';
import { Icon } from './Icon';

// A file of its own: once the whole table is in (module state), no Icon on the page loads a part again, which
// IconParts.test.tsx counts.
const path = (id: string) => document.querySelector(`#${id} svg path`);

describe('Icon: loadAllIcons', () => {
  test('a failed load is forgotten so the next call tries again; then the table loads once, and any name draws without loading a part', async () => {
    const all = vi.spyOn(iconChunks, 'all').mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'));
    const part = vi.spyOn(iconChunks, 'part');
    await expect(loadAllIcons()).rejects.toThrow(/Failed to fetch/);
    await Promise.all([loadAllIcons(), loadAllIcons()]);
    await render(<Icon id="zoom-in" name="zoom_in" />);
    await vi.waitFor(() => expect(path('zoom-in')).not.toBeNull());
    expect([all.mock.calls.length, part.mock.calls.length]).toEqual([2, 0]);
    all.mockRestore();
    part.mockRestore();
  });
});
