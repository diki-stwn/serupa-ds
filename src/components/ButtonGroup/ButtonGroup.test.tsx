import * as React from 'react';
import { beforeAll, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Menu, MenuItem } from '../Menu/Menu';
import { Tooltip } from '../Tooltip/Tooltip';
import { ButtonGroup } from './ButtonGroup';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const rects = (id: string) => [...el(id).children].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: Math.round(r.width) }; });
const corners = (e: Element) => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].join(' '); };

// Measured at rest, as the script did: no transitions or animations.
beforeAll(() => {
  const still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.appendChild(still);
});

describe('ButtonGroup', () => {
  test('role="group" named by aria-label; ref and className reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<ButtonGroup id="gatt" aria-label="View" ref={ref} className="extra"><Button variant="outline">Day</Button></ButtonGroup>);
    const e = el('gatt');
    expect([e.getAttribute('role'), e.getAttribute('aria-label'), e.className, e.dataset.component]).toEqual(['group', 'View', 'dk-button-group dk-button-group--attached extra', 'button-group']);
    expect(ref.current).toBe(e);
  });

  test('attached: buttons overlap by the 1px border, so the borders make one line; only the group\'s outer corners are rounded; a hovered button comes to the front, so its border shows whole', async () => {
    await render(<ButtonGroup id="gatt" aria-label="View">
      <Button variant="outline" id="b1">Day</Button><Button variant="outline" id="b2">Week</Button><Button variant="outline" id="b3">Month</Button>
    </ButtonGroup>);
    const r = rects('gatt');
    expect([r[1].l - r[0].r, r[2].l - r[1].r]).toEqual([-1, -1]);
    expect(['b1', 'b2', 'b3'].map((id) => corners(el(id)))).toEqual(['6px 0px 0px 6px', '0px 0px 0px 0px', '0px 6px 6px 0px']);
    await userEvent.hover(el('b2'));
    expect(['b1', 'b2'].map((id) => getComputedStyle(el(id)).zIndex)).toEqual(['auto', '10']);
  });

  test('attached={false}: 8px apart, own corners; --button-group-gap sets the gap', async () => {
    await render(<>
      <ButtonGroup id="gsp" attached={false}><Button variant="outline">Cancel</Button><Button>Save</Button></ButtonGroup>
      <ButtonGroup id="gtok" attached={false} style={{ '--button-group-gap': '13px' } as React.CSSProperties}><Button>A</Button><Button>B</Button></ButtonGroup>
    </>);
    const s = rects('gsp'), t = rects('gtok');
    expect(s[1].l - s[0].r).toBe(8);
    expect(getComputedStyle(el('gsp').lastElementChild!).borderTopLeftRadius).toBe('6px');
    expect(t[1].l - t[0].r).toBe(13);
  });

  test('vertical: stacked, overlapping by 1px, the same width, inner corners square, data-orientation="vertical"', async () => {
    await render(<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <ButtonGroup id="gv" orientation="vertical"><Button variant="outline">Top</Button><Button variant="outline">Bottom</Button></ButtonGroup>
    </div>);
    const r = rects('gv'), c = el('gv').children;
    expect([r[1].t - r[0].b, r[0].l === r[1].l, r[0].w === r[1].w]).toEqual([-1, true, true]);
    expect([el('gv').dataset.orientation, getComputedStyle(c[0]).borderBottomLeftRadius, getComputedStyle(c[1]).borderTopRightRadius]).toEqual(['vertical', '0px', '0px']);
  });
  test('split button: a Menu trigger at the end (its menu comes after it) and a Tooltip at the start still get the outer corners', async () => {
    await render(<ButtonGroup id="gs" attached aria-label="Publish">
      <Tooltip content="Publish now"><Button id="gs1">Publish</Button></Tooltip>
      <Menu trigger={<IconButton id="gs2" variant="primary" icon="expand_more" label="More publish options" />}><MenuItem>Schedule</MenuItem></Menu>
    </ButtonGroup>);
    const r = getComputedStyle(el('gs1')).borderTopLeftRadius;
    expect(r).not.toBe('0px');
    expect(corners(el('gs1'))).toBe([r, '0px', '0px', r].join(' '));
    expect(corners(el('gs2'))).toBe(['0px', r, r, '0px'].join(' '));
    expect(el('gs2').getBoundingClientRect().left).toBeLessThan(el('gs1').getBoundingClientRect().right);   // the borders overlap
  });

  test('attached, a row wider than its container (six buttons at 320px) wraps as separate buttons, each whole, and joins again once there\'s room (EL1)', async () => {
    await page.viewport(320, 640);
    const labels = ['Bold', 'Italic', 'Underline', 'Strike', 'Code', 'Link'];
    const { rerender } = await render(<div style={{ width: '288px' }}><ButtonGroup id="gw" aria-label="Format">{labels.map((t) => <Button key={t} variant="outline">{t}</Button>)}</ButtonGroup></div>);
    const g = el('gw');
    await expect.poll(() => g.hasAttribute('data-wrapped')).toBe(true);
    const kids = [...g.children] as HTMLElement[];
    expect([document.documentElement.scrollWidth <= 320, g.getBoundingClientRect().width <= 288, kids.every((k) => k.scrollWidth <= k.clientWidth + 1)]).toEqual([true, true, true]);
    expect(new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size).toBeGreaterThan(1);   // more than one line
    expect([g.classList.contains('dk-button-group--attached'), corners(kids[1]) === corners(kids[0])]).toEqual([false, true]);   // separate buttons, every corner rounded
    await rerender(<div style={{ width: '600px' }}><ButtonGroup id="gw" aria-label="Format">{labels.map((t) => <Button key={t} variant="outline">{t}</Button>)}</ButtonGroup></div>);
    await page.viewport(800, 640);
    await expect.poll(() => g.hasAttribute('data-wrapped')).toBe(false);
    expect([g.classList.contains('dk-button-group--attached'), new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size]).toEqual([true, 1]);
  });

  test('two attached primary buttons have an edge between them, in their text color, in all six themes; outline buttons keep their shared border (EL1)', async () => {
    await render(<ButtonGroup id="gp"><Button id="p1">Save</Button><Button id="p2">Save as</Button><Button id="p3" variant="outline">Cancel</Button></ButtonGroup>);
    const edge = (id: string) => getComputedStyle(el(id)).borderInlineStartColor;
    expect([edge('p1'), edge('p2') === 'rgba(0, 0, 0, 0)']).toEqual(['rgba(0, 0, 0, 0)', false]);
    // The edge keeps 3:1 on the button's fill (lowest: violet-light, 3.67).
    const low: string[] = [];
    for (const t of THEMES) {
      document.documentElement.setAttribute('data-theme', t);
      const r = contrast('color-mix(in srgb, var(--on-primary) 40%, var(--primary))', 'var(--primary)');
      if (r < 3) low.push(`${t} ${r.toFixed(2)}`);
    }
    expect(low).toEqual([]);
    expect(getComputedStyle(el('p3')).borderInlineStartColor).not.toBe(edge('p2'));
  });
});

describe('ButtonGroup in a grid (GP2)', () => {
  test('an attached row wider than its grid column wraps instead of widening the track', async () => {
    await render(<div id="gp2" style={{ width: '288px', display: 'grid' }}>
      <ButtonGroup id="gp2-g" aria-label="Project"><Button variant="outline">Duplicate project</Button><Button variant="outline">Archive project</Button><Button variant="outline">Delete</Button></ButtonGroup>
    </div>);
    await expect.poll(() => document.getElementById('gp2-g')!.dataset.wrapped).toBe('true');
    expect(document.getElementById('gp2')!.scrollWidth).toBe(288);
  });
});
