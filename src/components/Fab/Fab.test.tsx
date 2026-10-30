import * as React from 'react';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { css } from '../../../tools/test/vitest/helpers';
import { Fab } from './Fab';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const box = (id: string) => { const r = el(id).getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };

const warns: string[] = [];
beforeAll(async () => {
  vi.spyOn(console, 'warn').mockImplementation((m) => { warns.push(String(m)); });
  await page.viewport(800, 600);   // the screen the corners are measured against
});
afterAll(() => { vi.restoreAllMocks(); });

let clicks = 0;
function Fabs({ fabRef }: { fabRef?: React.Ref<HTMLButtonElement> }) {
  return <div style={{ padding: '120px 120px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
    <Fab id="fab" icon="add" label="New project" onClick={() => { clicks++; }} ref={fabRef} />
    <Fab id="fbs" icon="add" label="Add" size="sm" position="top-start" />
    <Fab id="fext" icon="edit" label="Compose" extended position="bottom-start" />
    <Fab id="fst" icon="add" label="Static" position="static" />
    {/* @ts-expect-error: an unknown position */}
    <Fab id="fbad" icon="add" label="Bad" position="middle" style={{ '--fab-size': '50px', '--fab-offset': '10px' } as React.CSSProperties} />
    <div dir="rtl"><Fab id="frtl" icon="add" label="RTL" position="top-end" /></div>
  </div>;
}

describe('Fab', () => {
  test('a primary <button> named by label, fixed, z-index 30, round, raised (shadow-lg), with a 24px icon', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    await render(<Fabs fabRef={ref} />);
    const e = el('fab'), s = css(e);
    expect([e.getAttribute('aria-label'), e.title, e.dataset.variant, s.position, s.zIndex, css(e.querySelector('[data-icon]')).fontSize]).toEqual(['New project', 'New project', 'primary', 'fixed', '30', '24px']);
    expect(parseFloat(s.borderTopLeftRadius)).toBeGreaterThanOrEqual(28);
    expect(s.boxShadow).toMatch(/10px 15px -3px/);
    expect(ref.current).toBe(e);
  });

  test('56×56, 24px from the bottom-end corner; size sm at top-start: 40×40, 24px from the top-left corner', async () => {
    await render(<Fabs />);
    const [w, h] = [window.innerWidth, window.innerHeight], f = box('fab');
    expect([f[2], f[3], f[0] + 56, f[1] + 56]).toEqual([56, 56, w - 24, h - 24]);
    expect(box('fbs')).toEqual([24, 24, 40, 40]);
  });

  test('extended: the label shows next to the icon (no aria-label needed), 56px tall, wider than square, 20px side padding, bottom-start', async () => {
    await render(<Fabs />);
    const e = el('fext'), [left, , w, h] = box('fext');
    expect([e.querySelector('.dk-btn__label')!.textContent, e.getAttribute('aria-label'), h, left, css(e).paddingLeft]).toEqual(['Compose', null, 56, 24, '20px']);
    expect(w).toBeGreaterThan(56);
  });

  test('position static stays in the flow; an unknown position falls back to bottom-end; --fab-size and --fab-offset override one', async () => {
    await render(<Fabs />);
    expect(css(el('fst')).position).not.toBe('fixed');
    const b = box('fbad');
    expect([b[2], b[0] + 50, b[1] + 50]).toEqual([50, window.innerWidth - 10, window.innerHeight - 10]);
  });

  test('the corner follows the text direction (top-end is top-left in right-to-left)', async () => {
    await render(<Fabs />);
    expect(box('frtl').slice(0, 2)).toEqual([24, 24]);
  });

  test('hover: a deeper shadow (shadow-xl)', async () => {
    await render(<Fabs />);
    await userEvent.hover(el('fst'));
    await expect.poll(() => css(el('fst')).boxShadow).toMatch(/20px 25px -5px/);
  });

  test('keyboard: Tab reaches the Fab, Enter and Space press it, and it shows its focus ring (focus-visible, a 2px outline in the ring color, 2px out)', async () => {
    await render(<Fabs />);
    (document.activeElement as HTMLElement | null)?.blur();
    const order: string[] = [];
    for (let i = 0; i < 12 && !order.includes('fab'); i++) { await userEvent.tab(); order.push(document.activeElement!.id); }
    expect(order).toContain('fab');
    clicks = 0;
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicks).toBe(2);
    const e = el('fab');
    await Promise.all(e.getAnimations().map((a) => a.finished));   // the ring fades in
    const probe = document.createElement('span');
    probe.style.color = 'var(--dk-btn-ring)';
    e.appendChild(probe);
    const ring = getComputedStyle(probe).color;
    probe.remove();
    const s = css(e);
    expect(e.matches(':focus-visible')).toBe(true);
    expect([s.outlineStyle, s.outlineWidth, s.outlineOffset, s.outlineColor]).toEqual(['solid', '2px', '2px', ring]);
  });

  test('no warnings about missing labels', () => {
    expect(warns.filter((m) => /aria-label/.test(m))).toEqual([]);
  });
});

describe('Fab: focus stays clear of it', () => {
  test('tabbing down a phone-sized page of links, none is left under a bottom-end FAB (WCAG 2.4.11); a top FAB pads the top', async () => {
    await page.viewport(390, 700);
    try {
      const links = []; for (let i = 0; i < 60; i++) links.push(<p key={i} style={{ textAlign: 'end', margin: '0 0 12px' }}><a href={'#l' + i} id={'l' + i}>Link {i}</a></p>);
      // The page leaves room for the FAB after its last line, as the README asks; scroll padding can't scroll past the end.
      const screen = await render(<div style={{ paddingBottom: '104px' }}><Fab id="ffab" icon="add" label="New" />{links}</div>);
      const fab = el('ffab').getBoundingClientRect();
      const under: number[] = [];
      document.documentElement.scrollTop = 0;
      for (let i = 0; i < 60; i++) {
        await userEvent.keyboard('{Tab}');
        const a = document.activeElement as HTMLElement;
        if (a.id !== 'l' + i) { await userEvent.keyboard('{Tab}'); }
        const r = (document.activeElement as HTMLElement).getBoundingClientRect();
        if (r.bottom > fab.top && r.top < fab.bottom && r.right > fab.left && r.left < fab.right) under.push(i);
      }
      expect(under).toEqual([]);
      await screen.rerender(<div style={{ paddingBottom: '104px' }}><Fab id="ffab" icon="add" label="New" position="top-end" />{links}</div>);
      expect([css(document.documentElement).scrollPaddingTop, css(document.documentElement).scrollPaddingBottom]).toEqual(['104px', 'auto']);
    } finally {
      await page.viewport(800, 600);
    }
  });
});

describe('Fab: an extended FAB with a long label on a phone (GR14)', () => {
  test('stays inside the screen, its offset from both sides, and the label takes its ellipsis, in LTR and RTL', async () => {
    try {
      for (const w of [320, 390]) {
        await page.viewport(w, 700);
        for (const dir of ['ltr', 'rtl'] as const) {
          const r = await render(<div dir={dir}><Fab id="gr14" icon="add" label="Create a new quarterly report from a template" extended /></div>);
          const b = el('gr14').getBoundingClientRect();
          expect([Math.round(b.left), Math.round(w - b.right)]).toEqual([24, 24]);
          const svg = el('gr14').firstElementChild!.getBoundingClientRect();   // the icon
          expect(svg.left).toBeGreaterThanOrEqual(b.left);
          expect(svg.right).toBeLessThanOrEqual(b.right);
          await r.unmount();
        }
      }
    } finally { await page.viewport(800, 600); }
  });
});
