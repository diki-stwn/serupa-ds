import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Alert } from '../components/Alert/Alert';
import { Button } from '../components/Button/Button';
import { Card, CardBody, CardHeader } from '../components/Card/Card';
import { Dialog } from '../components/Dialog/Dialog';
import { Drawer } from '../components/Drawer/Drawer';
import { Menu, MenuItem } from '../components/Menu/Menu';
import { toast, Toaster } from '../components/Toast/Toast';

// A word longer than any line it lands in: a German compound, as a translation or user content would have.
const WORD = 'Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung';
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
// Nothing inside spills past its own box, and the box fits its column.
const spills = (el: HTMLElement, width: number) => [el.scrollWidth > el.clientWidth + 1, Math.round(el.getBoundingClientRect().width) > width];

describe('long words (R31)', () => {
  test('Alert, Card and Button in a 200px column at 320px: the word wraps (or the label ends in an ellipsis), and the page doesn\'t scroll sideways', async () => {
    await page.viewport(320, 640);
    await render(<div style={{ width: '200px' }}>
      <Alert title={WORD}>{WORD}</Alert>
      <Card><CardHeader title={WORD} description={WORD} /><CardBody>{WORD}</CardBody></Card>
      <Button id="b">{WORD}</Button>
    </div>);
    expect([...spills(q('.dk-alert'), 200), ...spills(q('.dk-alert__title'), 200)]).toEqual([false, false, false, false]);
    expect([...spills(q('.dk-card'), 200), ...spills(q('.dk-card__title'), 200)]).toEqual([false, false, false, false]);
    const b = q('#b'), label = [...b.querySelectorAll('span')].find((s) => s.textContent === WORD) as HTMLElement;
    expect([Math.round(b.getBoundingClientRect().width) <= 200, getComputedStyle(label).textOverflow, b.textContent]).toEqual([true, 'ellipsis', WORD]);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });

  test('Dialog: the word wraps inside the panel, which stays on screen', async () => {
    await page.viewport(320, 640);
    await render(<>
      <Dialog id="d" open onOpenChange={() => {}} title={WORD} description={WORD}>{WORD}</Dialog>
    </>);
    const panel = q('#d .dk-dialog__panel');
    expect([panel.scrollWidth <= panel.clientWidth + 1, q('#d .dk-dialog__title').scrollWidth <= q('#d .dk-dialog__title').clientWidth + 1, panel.getBoundingClientRect().right <= 320]).toEqual([true, true, true]);
    (q('#d') as HTMLDialogElement).close();
  });

  test('Drawer: the same', async () => {
    await page.viewport(320, 640);
    await render(<>
      <Drawer id="w" open onOpenChange={() => {}} title={WORD}>{WORD}</Drawer>
    </>);
    const panel = q('#w .dk-drawer__panel');
    expect([panel.scrollWidth <= panel.clientWidth + 1, panel.getBoundingClientRect().right <= 320]).toEqual([true, true]);
    (q('#w') as HTMLDialogElement).close();
  });

  test('Menu and Toast: the item and the toast stay on screen with the word wrapped', async () => {
    await page.viewport(320, 640);
    await render(<>
      <Menu open onOpenChange={() => {}} trigger={<Button>Open</Button>}><MenuItem>{WORD}</MenuItem></Menu>
      <Toaster />
    </>);
    React.act(() => { toast({ title: WORD, description: WORD, duration: 0 }); });
    await expect.poll(() => !!document.querySelector('[role="menuitem"]')).toBe(true);
    const item = q('[role="menuitem"]'), t = q('.dk-toast');
    expect([item.scrollWidth <= item.clientWidth + 1, item.getBoundingClientRect().right <= 320, t.scrollWidth <= t.clientWidth + 1, t.getBoundingClientRect().right <= 320]).toEqual([true, true, true, true]);
    React.act(() => toast.dismiss());
  });
});
