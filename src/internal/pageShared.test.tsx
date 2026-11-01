import { describe, expect, test } from 'vitest';
import { announce, announcerIdle, ensureAnnouncer } from './announce';
import { modalClosed, modalOpened, topModal } from './layers';

// A second copy of the package on the page (G2): the same files loaded again as modules of their own, as a second
// install's would be, with a query Vite keeps apart.
const copy = <T,>(file: string): Promise<T> => import(/* @vite-ignore */ `${file}?copy=2`);

describe('what the page shares is kept once with two copies of the package (G2)', () => {
  test('a modal opened by one copy is the other copy\'s innermost modal too, and both see it close', async () => {
    const other = await copy<typeof import('./layers')>('./layers.ts');
    expect(other.topModal, 'a module of its own').not.toBe(topModal);
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      other.modalOpened(el);
      expect(topModal()).toBe(el);
      modalClosed(el);
      expect(other.topModal()).toBe(null);
      modalOpened(el);
      expect(other.topModal()).toBe(el);
    } finally { modalClosed(el); el.remove(); }
  });

  test('both copies announce through one polite region, which moves into a modal the other copy opened', async () => {
    const other = await copy<typeof import('./announce')>('./announce.ts');
    const layers = await copy<typeof import('./layers')>('./layers.ts');
    ensureAnnouncer();
    other.ensureAnnouncer();
    expect(document.querySelectorAll('[data-dk-announcer]').length).toBe(1);
    const dialog = document.createElement('div');
    document.body.appendChild(dialog);
    try {
      layers.modalOpened(dialog);
      expect(document.querySelector('[data-dk-announcer]')!.parentElement).toBe(dialog);
      announce('Saved');
      other.announce('Sent');
      await expect.poll(() => document.querySelector('[data-dk-announcer]')!.textContent, { timeout: 3000 }).toBe('Saved. Sent');
      await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    } finally { layers.modalClosed(dialog); dialog.remove(); }
    expect(document.querySelector('[data-dk-announcer]')!.parentElement).toBe(document.body);
  });
});
