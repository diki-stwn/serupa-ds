import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Badge } from '../components/Badge/Badge';
import { Pagination } from '../components/Pagination/Pagination';
import { SerupaProvider } from './provider';
import { activeIn, byId, rootOf } from './root';

// Rendered into an open shadow root, where document.activeElement is the host and document.getElementById
// doesn't see the root's ids: the shared focus helpers read the element's own root instead (GR60).
async function inShadow(ui: React.ReactElement) {
  const host = document.createElement('div');
  document.body.append(host);
  const inner = document.createElement('div');
  host.attachShadow({ mode: 'open' }).append(inner);
  await render(<SerupaProvider locale="en-US">{ui}</SerupaProvider>, { container: inner });
  return { root: host.shadowRoot!, done: () => host.remove() };
}

describe('focus and ids inside a shadow root (GR60)', () => {
  test('rootOf, activeIn and byId read the shadow root; a node outside one reads the page', async () => {
    const { root, done } = await inShadow(<button id="sr-b">B</button>);
    try {
      const b = root.getElementById('sr-b')!;
      b.focus();
      expect([rootOf(b) === root, activeIn(b) === b, byId(b, 'sr-b') === b, document.activeElement === b, rootOf(document.body) === document, rootOf(null) === document])
        .toEqual([true, true, true, false, true, true]);
    } finally { done(); }
  });

  test('Pagination: the next arrow that reaches the last page hands focus to the previous arrow (useFocusHandover)', async () => {
    const { root, done } = await inShadow(<Pagination count={3} defaultPage={2} />);
    try {
      const arrows = [...root.querySelectorAll<HTMLButtonElement>('.dk-pagination__arrow')];
      arrows[1].focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => root.activeElement).toBe(arrows[0]);
    } finally { done(); }
  });

  test('Badge: removing one moves focus to the next one\'s remove button (removeAndRefocus)', async () => {
    function List() {
      const [left, set] = React.useState(['Red', 'Green', 'Blue']);
      return <div>{left.map((t) => <Badge key={t} onRemove={() => set((l) => l.filter((x) => x !== t))}>{t}</Badge>)}</div>;
    }
    const { root, done } = await inShadow(<List />);
    try {
      const removes = () => [...root.querySelectorAll<HTMLButtonElement>('.dk-badge__remove')];
      removes()[1].focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => removes().length).toBe(2);
      await expect.poll(() => root.activeElement).toBe(removes()[1]);
    } finally { done(); }
  });
});
