import * as React from 'react';
import { beforeAll, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
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

});
