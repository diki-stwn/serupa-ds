import { describe, expect, test } from 'vitest';
import { keepMotion } from '../../tools/test/vitest/helpers';
import { withoutTransitions } from './withoutTransitions';

const frames = (n: number) => new Promise<void>((f) => { const go = (k: number) => (k ? requestAnimationFrame(() => go(k - 1)) : f()); go(n); });

describe('withoutTransitions', () => {
  keepMotion();

  test('a section switched to another theme inside it changes its colors at once (no transitions start); they are back two frames later', async () => {
    const sec = document.body.appendChild(document.createElement('section'));
    sec.setAttribute('data-theme', 'blue-light');
    sec.innerHTML = '<p style="transition: background-color 150ms, color 150ms; background: var(--surface-muted); color: var(--text)">Row</p>'.repeat(5);
    expect(getComputedStyle(sec.firstElementChild!).transitionDuration).toBe('0.15s, 0.15s');   // the light colors are in place
    withoutTransitions(() => sec.setAttribute('data-theme', 'blue-dark'), sec);
    const during = [sec.getAnimations({ subtree: true }).length, sec.hasAttribute('data-theme-switching')];
    await frames(3);
    expect([...during, sec.hasAttribute('data-theme-switching'), getComputedStyle(sec.firstElementChild!).transitionDuration]).toEqual([0, true, false, '0.15s, 0.15s']);
    sec.remove();
  });

  test('with no element it works on the page root; a quick second switch keeps transitions off until its own two frames', async () => {
    const root = document.documentElement;
    withoutTransitions(() => {});
    await frames(1);
    withoutTransitions(() => {});
    await frames(1);
    const mid = root.hasAttribute('data-theme-switching');
    await frames(2);
    expect([mid, root.hasAttribute('data-theme-switching')]).toEqual([true, false]);
  });
});
