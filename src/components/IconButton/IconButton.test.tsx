import * as React from 'react';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { css } from '../../../tools/test/vitest/helpers';
import { IconButton, type IconButtonProps } from './IconButton';
import { Tooltip } from '../Tooltip/Tooltip';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const box = (id: string) => { const r = el(id).getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };

const warns: string[] = [];
beforeAll(() => { vi.spyOn(console, 'warn').mockImplementation((m) => { warns.push(String(m)); }); });
afterAll(() => { vi.restoreAllMocks(); });

let clicks = 0;
function Icons({ ibRef }: { ibRef?: React.Ref<HTMLButtonElement | HTMLAnchorElement> }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
    <IconButton id="ib" icon="more_vert" label="More actions" onClick={() => { clicks++; }} ref={ibRef} className="extra" />
    <IconButton id="ibr" icon="edit" label="Edit" shape="round" variant="secondary" size="lg" />
    <IconButton id="ibl" icon="open_in_new" label="Open" href="#x" />
    <IconButton id="ibt" icon="close" label="Close" hideTitle destructive />
    <IconButton id="ibtitle" icon="close" label="Close" title="Close (Esc)" />
  </div>;
}

describe('IconButton', () => {
  test('a ghost icon-only <button>, named by label (aria-label and title); ref and className reach it; md is a 32px square', async () => {
    const ref = React.createRef<HTMLButtonElement | HTMLAnchorElement>();
    await render(<Icons ibRef={ref} />);
    const e = el('ib') as HTMLButtonElement;
    expect([e.tagName, e.type, e.getAttribute('aria-label'), e.title, e.dataset.variant, e.dataset.shape, e.hasAttribute('data-icon-only'), (e.querySelector('[data-icon]') as HTMLElement).dataset.icon]).toEqual(['BUTTON', 'button', 'More actions', 'More actions', 'ghost', 'square', true, 'more_vert']);
    expect(e.className).toMatch(/dk-icon-btn/);
    expect(e.className).toMatch(/extra/);
    expect(ref.current).toBe(e);
    expect(box('ib').slice(2)).toEqual([32, 32]);
  });

  test('shape round: a circle; variant and size pass through to Button', async () => {
    await render(<Icons />);
    const s = css(el('ibr'));
    expect(parseFloat(s.borderTopLeftRadius)).toBeGreaterThanOrEqual(22);
    expect([s.width, s.height, el('ibr').dataset.variant]).toEqual(['44px', '44px', 'secondary']);
  });

  test('with href it is a link; hideTitle leaves out the tooltip; a given title wins; destructive passes through', async () => {
    await render(<Icons />);
    expect([el('ibl').tagName, el('ibl').getAttribute('href'), el('ibl').getAttribute('aria-label')]).toEqual(['A', '#x', 'Open']);
    expect([el('ibt').hasAttribute('title'), el('ibt').hasAttribute('data-destructive'), el('ibtitle').title]).toEqual([false, true, 'Close (Esc)']);
  });

  test('inside a Tooltip it has no title (GC2): the Tooltip shows the words, as a description or, with role="label", as its name', async () => {
    await render(<>
      <Tooltip content="Open the settings"><IconButton id="tdesc" icon="settings" label="Settings" /></Tooltip>
      <Tooltip content="Settings" role="label"><IconButton id="tname" icon="settings" label="Settings" /></Tooltip>
      <IconButton id="tbare" icon="settings" label="Settings" />
    </>);
    const tip = (id: string, attr: string) => document.getElementById(el(id).getAttribute(attr)!)!.textContent;
    expect([el('tdesc').hasAttribute('title'), tip('tdesc', 'aria-describedby'), el('tname').hasAttribute('title'), tip('tname', 'aria-labelledby'), el('tbare').title])
      .toEqual([false, 'Open the settings', false, 'Settings', 'Settings']);
  });

  test('a click calls onClick', async () => {
    await render(<Icons />);
    clicks = 0;
    await userEvent.click(el('ib'));
    expect(clicks).toBe(1);
  });

  test('keyboard: Tab reaches the first IconButton, Enter and Space press it, and it shows its focus ring (focus-visible, a 2px outline in the ring color, 2px out)', async () => {
    await render(<Icons />);
    (document.activeElement as HTMLElement | null)?.blur();
    clicks = 0;
    await userEvent.tab();
    expect(document.activeElement).toBe(el('ib'));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicks).toBe(2);
    const e = el('ib');
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

  test('aria-label instead of label (from JavaScript, or a spread made for Button) still names it, and nothing warns (GQ2)', async () => {
    const before = warns.length;
    const plain = { id: 'iaria', icon: 'close', 'aria-label': 'Close' } as unknown as IconButtonProps;
    await render(<IconButton {...plain} />);
    expect([el('iaria').getAttribute('aria-label'), el('iaria').title]).toEqual(['Close', 'Close']);
    await expect.poll(() => warns.slice(before).filter((m) => /aria-label|label/.test(m))).toEqual([]);
  });

  test('no warnings about missing labels', () => {
    expect(warns.filter((m) => /aria-label/.test(m))).toEqual([]);
  });
});
