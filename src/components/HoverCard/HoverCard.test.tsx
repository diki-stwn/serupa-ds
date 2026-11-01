import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, settle } from '../../../tools/test/vitest/helpers';
import { HoverCard } from './HoverCard';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const isOpen = (id: string) => { const c = el(id); return !c.hidden && getComputedStyle(c).display !== 'none'; };
const rect = (e: Element) => e.getBoundingClientRect();
const near = (a: number, b: number) => Math.abs(a - b) <= 1;
const away = () => userEvent.hover(document.body, { position: { x: 600, y: 10 } });

function Card(props: Partial<React.ComponentProps<typeof HoverCard>>) {
  return (
    <div style={{ padding: '40px 120px 320px' }}>
      <button id="before">Before</button>{' '}
      <HoverCard id="hc" trigger={<a id="t" href="#dewi">@dewi</a>} {...props}>
        <strong>Dewi Lestari</strong> <a id="inside" href="#projects">Projects</a>
      </HoverCard>{' '}
      <button id="after">After</button>
    </div>
  );
}

describe('HoverCard', () => {
  test('closed: nothing inside rendered, inert; props, className and the ref reach the card; the trigger keeps its own props', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Card ref={ref} className="extra" data-x="y" />);
    const c = el('hc');
    expect([ref.current === c, c.className, c.dataset.x, c.dataset.component, c.dataset.state, c.hidden, c.inert, c.textContent]).toEqual([true, 'dk-hover-card extra', 'y', 'hover-card', 'closed', true, true, '']);
    expect(el('t').getAttribute('href')).toBe('#dewi');
  });

  test('hover: opens after the 500ms delay, 8px below the link in the top layer; leaving both closes it after a grace', async () => {
    const asks: string[] = [];
    await render(<Card onOpenChange={(v, d) => asks.push(v + ' ' + d.reason)} />);
    const t0 = performance.now();
    await userEvent.hover(el('t'));
    await expect.poll(() => isOpen('hc')).toBe(true);
    expect(performance.now() - t0).toBeGreaterThanOrEqual(500);
    const c = el('hc');
    expect([c.dataset.side, c.matches(':popover-open'), near(rect(c).top - rect(el('t')).bottom, 8)]).toEqual(['bottom', true, true]);
    await away();
    await settle(100);
    expect(isOpen('hc')).toBe(true);
    await expect.poll(() => isOpen('hc')).toBe(false);
    expect(asks).toEqual(['true hover', 'false hover']);
  });

  test('a pointer passing over the link without resting opens nothing', async () => {
    await render(<Card />);
    await userEvent.hover(el('t'));
    await away();
    await settle(700);
    expect(isOpen('hc')).toBe(false);
  });

  test('the pointer can move onto the card and stay; Escape closes it while hovered', async () => {
    await render(<Card />);
    await userEvent.hover(el('t'));
    await expect.poll(() => isOpen('hc')).toBe(true);
    await userEvent.hover(el('inside'));
    await settle(500);
    expect(isOpen('hc')).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(isOpen('hc')).toBe(false);
  });

  test('keyboard: focus resting on the link opens it; Tab goes into the card, Shift+Tab back; Escape inside closes it and focus returns to the link', async () => {
    await render(<Card />);
    el('before').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(el('t'));
    await expect.poll(() => isOpen('hc')).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(el('inside'));
    await userEvent.tab({ shift: true });
    expect([document.activeElement === el('t'), isOpen('hc')]).toEqual([true, true]);
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect([isOpen('hc'), document.activeElement === el('t')]).toEqual([false, true]);
  });

  test('keyboard: focus moving on past the card closes it; tabbing straight past the link opens nothing', async () => {
    await render(<Card />);
    el('before').focus();
    await userEvent.tab();
    await expect.poll(() => isOpen('hc')).toBe(true);
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(el('after'));
    await expect.poll(() => isOpen('hc')).toBe(false);
    el('before').focus();
    await userEvent.tab();
    await userEvent.tab();
    await settle(700);
    expect(isOpen('hc')).toBe(false);
  });

  test('every placement: the card opens on that side of the link, its start or end lined up with the link\'s', async () => {
    const all = ['bottom', 'bottom-start', 'bottom-end', 'top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'left', 'left-start', 'left-end'] as const;
    const at = (placement: typeof all[number]) => <div style={{ display: 'grid', placeItems: 'center', height: '700px' }}>
      <HoverCard key={placement} id="hp" open placement={placement} trigger={<a id="tp" href="#dewi">@dewi</a>}><strong>Dewi Lestari</strong></HoverCard>
    </div>;
    const r = await render(at(all[0]));
    for (const placement of all) {
      await r.rerender(at(placement));
      await expect.poll(() => isOpen('hp'), { message: placement }).toBe(true);
      const [side, align] = placement.split('-'), c = el('hp');
      await expect.poll(() => c.dataset.side, { message: placement }).toBe(side);
      const a = rect(el('tp')), b = rect(c);
      expect(side === 'bottom' ? b.top >= a.bottom : side === 'top' ? b.bottom <= a.top : side === 'right' ? b.left >= a.right : b.right <= a.left, placement).toBe(true);
      const across = side === 'top' || side === 'bottom';
      if (align === 'start') expect(near(across ? b.left : b.top, across ? a.left : a.top), placement).toBe(true);
      if (align === 'end') expect(near(across ? b.right : b.bottom, across ? a.right : a.bottom), placement).toBe(true);
    }
  });

  test('controlled and disabled: open shows it; disabled never does', async () => {
    const s = await render(<Card open onOpenChange={() => {}} />);
    await expect.poll(() => isOpen('hc')).toBe(true);
    await s.rerender(<Card open disabled onOpenChange={() => {}} />);
    await expect.poll(() => isOpen('hc')).toBe(false);
  });

  test('its text reads 4.5:1 on its background in all six themes', async () => {
    await render(<Card open onOpenChange={() => {}} />);
    await expect.poll(() => isOpen('hc')).toBe(true);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(el('hc')).color, css(el('hc')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});
