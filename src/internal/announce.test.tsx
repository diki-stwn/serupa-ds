import { describe, expect, test } from 'vitest';
import { announce, ensureAnnouncer } from './announce';

const region = () => document.querySelector('[data-dk-announcer]') as HTMLElement;
const settle = () => new Promise((ok) => setTimeout(ok, 700));

describe('announce', () => {
  test('a burst is said as one message, joined as sentences: no doubled stop after a message that ends in one, ". " after one that doesn\'t; a repeat waiting in the queue isn\'t added twice', async () => {
    ensureAnnouncer();
    await settle();
    announce('First');
    announce('Picked up Apollo, position 1 of 3.');
    announce('Apollo, position 2 of 3.');
    announce('Apollo, position 2 of 3.');
    announce('Saved');
    await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('First. Picked up Apollo, position 1 of 3. Apollo, position 2 of 3. Saved');
    expect(region().textContent).not.toMatch(/\.\./);
  });
});
