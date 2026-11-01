import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { toast, Toaster } from './Toast';

// A second copy of the package on the page (G2): Toast.tsx loaded again as a module of its own, as a second install's
// would be, with a query Vite keeps apart. A file of its own, so the second copy's Toaster doesn't stay in the others.
const file = './Toast.tsx';
const copy = (): Promise<typeof import('./Toast')> => import(/* @vite-ignore */ `${file}?copy=2`);
const titles = () => [...document.querySelectorAll('.dk-toast__title')].map((t) => t.textContent);

describe('Toast with two copies of the package on the page (G2)', () => {
  test('a toast() from either copy shows in the one Toaster, and a dismiss from either closes it', async () => {
    const other = await copy();
    expect(other.toast, 'a module of its own').not.toBe(toast);
    await render(<Toaster />);
    React.act(() => { toast('Saved'); other.toast('Sent'); });
    await expect.poll(titles).toEqual(['Saved', 'Sent']);
    React.act(() => other.toast.dismiss());
    await expect.poll(titles).toEqual([]);
  });

  test('the other copy\'s Toaster, mounted last, takes this copy\'s toasts over', async () => {
    const other = await copy();
    const shown = await render(<><Toaster /><other.Toaster className="theirs" /></>);
    React.act(() => { toast('Copied'); });
    await expect.poll(() => [...document.querySelectorAll('.theirs .dk-toast__title')].map((t) => t.textContent)).toEqual(['Copied']);
    React.act(() => toast.dismiss());
    await shown.unmount();
  });
});
