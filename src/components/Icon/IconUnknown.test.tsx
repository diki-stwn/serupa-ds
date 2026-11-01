import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconChunks } from '../../icons';
import { Icon } from './Icon';

// A file of its own: the parts a page has loaded stay loaded (module state), and the tests run in a random order.
describe('Icon: an unknown name whose other spellings fail to load', () => {
  test('still warns once, without a guess', async () => {
    // "Home" loads its part and isn't in it; the part for "home", its snake_case spelling, fails to load.
    const real = iconChunks.part;
    const part = vi.spyOn(iconChunks, 'part').mockImplementation((name) => (name === 'Home' ? real(name) : Promise.reject(new TypeError('Failed to fetch dynamically imported module'))));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Icon name="Home" />);
    await vi.waitFor(() => expect(warn.mock.calls.filter((c) => /icon-unknown/.test(String(c[0]))).map((c) => /Check the name/.test(String(c[0])))).toEqual([true]));
    expect(part.mock.calls.map((c) => c[0])).toEqual(['Home', 'home']);
    warn.mockRestore();
    part.mockRestore();
  });
});
