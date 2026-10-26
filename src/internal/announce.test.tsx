import { describe, expect, test, vi } from 'vitest';
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

  test('a clock that goes back (a system time change, a fake clock in a test) doesn\'t hold the next message back', async () => {
    ensureAnnouncer();
    await settle();
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 60000 });
    try {
      announce('Ahead');
      await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('Ahead');
    } finally {
      vi.useRealTimers();
    }
    announce('Back');
    await expect.poll(() => region().textContent, { timeout: 1500 }).toBe('Back');
  });
});
