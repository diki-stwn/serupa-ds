import { describe, expect, test } from 'vitest';
import { announcePage } from './announcePage';
import { announcerIdle, ensureAnnouncer } from './announce';

const region = () => document.querySelector('[data-dk-announcer]') as HTMLElement;
const page = (html: string) => { const box = document.createElement('div'); box.innerHTML = html; document.body.appendChild(box); return box; };

describe('announcePage (15)', () => {
  test('focuses the h1 in <main> (focusable with tabindex -1) and says the title when it says more than the heading', async () => {
    ensureAnnouncer();
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    const box = page('<h1 id="logo">Acme</h1><main><h1 id="h">Invoices</h1><a href="#x">Link</a></main>');
    document.title = 'Invoices · Acme';
    try {
      announcePage();
      const h = document.getElementById('h')!;
      expect([document.activeElement, h.getAttribute('tabindex')]).toEqual([h, '-1']);
      await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('Invoices · Acme');
    } finally { box.remove(); }
  });

  test('a title the focused heading already says isn\'t said again; with no heading, <main> takes focus; focus: false leaves it', async () => {
    ensureAnnouncer();
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    const box = page('<main id="m"><h1 id="h" tabindex="0">Settings</h1></main><button id="b">B</button>');
    try {
      announcePage({ title: 'Settings' });
      expect([document.activeElement!.id, document.getElementById('h')!.getAttribute('tabindex')]).toEqual(['h', '0']);
      await new Promise((r) => setTimeout(r, 700));
      expect(region().textContent).not.toBe('Settings');
      document.getElementById('h')!.remove();
      announcePage({ title: 'Profile' });
      expect([document.activeElement!.id, document.getElementById('m')!.getAttribute('tabindex')]).toEqual(['m', '-1']);
      await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('Profile');
      document.getElementById('b')!.focus();
      announcePage({ focus: false, title: 'Billing' });
      expect(document.activeElement!.id).toBe('b');
      await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('Billing');
    } finally { box.remove(); }
  });

  test('focus as a selector or an element', async () => {
    const box = page('<main><h1>Page</h1><h2 id="sub">Section</h2><p id="p">Text</p></main>');
    try {
      announcePage({ focus: '#sub', title: '' });
      expect(document.activeElement!.id).toBe('sub');
      announcePage({ focus: document.getElementById('p')!, title: '' });
      expect(document.activeElement!.id).toBe('p');
    } finally { box.remove(); }
  });
});
