import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconChunks } from '../../icons';
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
