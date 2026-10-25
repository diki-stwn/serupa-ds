import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Textarea } from './Textarea';

// autoResize where the browser can't size a field to its content (Firefox, older Safari): measured in script. This
// file reports no field-sizing support before Textarea reads it, so Chromium runs the fallback (Textarea.test.tsx
// covers the CSS path).
vi.hoisted(() => {
  const supports = CSS.supports.bind(CSS);
  CSS.supports = (a: string, b?: string) => (a === 'field-sizing' ? false : b === undefined ? supports(a) : supports(a, b));
});

const el = (id: string) => document.getElementById(id) as HTMLTextAreaElement;
const height = (id: string) => Math.round(el(id).getBoundingClientRect().height);

describe('Textarea autoResize, measured in script', () => {
  test('sets the height inline: grows a line at a time from rows, stops at maxRows, shrinks back; refits when the width changes, with no ResizeObserver loop error', async () => {
    const errors: string[] = [], onError = (e: ErrorEvent) => { errors.push(e.message); };
    addEventListener('error', onError);
    try {
      await render(<div style={{ width: '320px' }}>
        <Textarea id="js" autoResize rows={2} maxRows={4} aria-label="Script" />
        <div id="js-narrow" style={{ width: '320px' }}><Textarea id="js-wrap" autoResize rows={1} defaultValue="one two three four five six seven eight nine ten eleven twelve" aria-label="Wrap" /></div>
      </div>);
      expect([el('js').style.height !== '', height('js')]).toEqual([true, 2 * 20 + 12]);
      await userEvent.click(el('js'));
      await userEvent.keyboard('1{Enter}2{Enter}3');
      await expect.poll(() => height('js')).toBe(3 * 20 + 12);
      await userEvent.keyboard('{Enter}4{Enter}5{Enter}6');
      await expect.poll(() => height('js')).toBe(4 * 20 + 12);
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await expect.poll(() => height('js')).toBe(2 * 20 + 12);
      const w1 = height('js-wrap');
      document.getElementById('js-narrow')!.style.width = '160px';
      await expect.poll(() => height('js-wrap')).toBeGreaterThan(w1);
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      expect(errors).toEqual([]);
    } finally { removeEventListener('error', onError); }
  });
});
