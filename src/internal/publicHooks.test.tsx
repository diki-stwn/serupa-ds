// The hooks and helpers the package exports for a project's own components (W4): they read the same settings and
// speak through the same live regions as the components.
import * as React from 'react';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { announce, SerupaProvider, useLocale, useSerupa } from '../index';

test('useLocale gives the locale the components use: a given one, else the provider\'s, else the browser\'s', async () => {
  const seen: string[] = [];
  function Peek({ own }: { own?: string }) { seen.push(useLocale(own)); return null; }
  await render(<><SerupaProvider locale="id-ID"><Peek /><Peek own="de-DE" /></SerupaProvider><Peek /></>);
  expect(seen.slice(-3)).toEqual(['id-ID', 'de-DE', new Intl.DateTimeFormat().resolvedOptions().locale]);
});

test('useSerupa gives the provider\'s words', async () => {
  let close = '';
  function Peek() { close = useSerupa().labels.close; return null; }
  await render(<SerupaProvider labels={{ close: 'Tutup' }}><Peek /></SerupaProvider>);
  expect(close).toBe('Tutup');
});

test('announce says text politely, or assertively for an error', async () => {
  announce('Draft saved');
  announce('Upload failed', { assertive: true });
  await expect.poll(() => document.querySelector('[data-dk-announcer]')?.textContent, { timeout: 3000 }).toBe('Draft saved');
  await expect.poll(() => document.querySelector('[data-dk-announcer-assertive]')?.textContent, { timeout: 3000 }).toBe('Upload failed');
  expect(document.querySelector('[data-dk-announcer-assertive]')?.getAttribute('role')).toBe('alert');
});
