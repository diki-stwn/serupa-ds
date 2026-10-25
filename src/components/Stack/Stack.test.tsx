import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { css } from '../../../tools/test/vitest/helpers';
import { Stack } from './Stack';

const el = (id: string) => document.getElementById(id) as HTMLElement;
// Grey boxes, each 5px taller than the one before, optionally a fixed width.
const boxes = (n: number, w?: string) => Array.from({ length: n }, (_, i) => <div key={i} style={{ background: '#ccc', width: w, height: `${10 + i * 5}px` }} />);
// Each child's box, relative to the stack's top-left corner.
const kids = (id: string) => {
  const o = el(id).getBoundingClientRect();
  return [...el(id).children].map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left - o.left), y: Math.round(r.top - o.top), w: Math.round(r.width), h: Math.round(r.height) }; });
};
const Wide = ({ children }: { children: React.ReactNode }) => <div style={{ width: '600px' }}>{children}</div>;

describe('Stack', () => {
  test('defaults: a <div>; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Wide><Stack id="sdef" ref={r} className="extra" data-x="y">{boxes(3)}</Stack></Wide>);
    const e = el('sdef');
    expect([e.tagName, e.className, e.dataset.component, r.current === e, e.dataset.x]).toEqual(['DIV', 'dk-stack dk-stack--align-stretch extra', 'stack', true, 'y']);
  });

  test('a column, 16px apart (spacing-4), children stretched', async () => {
    await render(<Wide><Stack id="sdef">{boxes(3)}</Stack></Wide>);
    const s = css(el('sdef')), k = kids('sdef');
    expect([s.display, s.flexDirection, s.rowGap, s.alignItems]).toEqual(['flex', 'column', '16px', 'stretch']);
    expect([k[1].y - (k[0].y + k[0].h), k[0].w]).toEqual([16, 600]);
  });

  test('gap={1.5}: 6px (spacing-1.5, the dot escaped)', async () => {
    await render(<Wide><Stack id="sgap" gap={1.5}>{boxes(2)}</Stack></Wide>);
    expect(css(el('sgap')).rowGap).toBe('6px');
  });

  test('row: side by side, centered, justify between', async () => {
    await render(<Wide><Stack id="srow" direction="row" gap={2} justify="between">{boxes(3, '20px')}</Stack></Wide>);
    const s = css(el('srow')), k = kids('srow');
    expect([s.flexDirection, s.columnGap, s.alignItems, s.justifyContent]).toEqual(['row', '8px', 'center', 'space-between']);
    expect(k[2].x + k[2].w).toBe(600);
    expect(k[0].y).toBeGreaterThan(k[2].y);
  });

  test('unknown as, gap, align, justify and direction fall back', async () => {
    await render(<Wide><Stack id="sbad" as={'table' as never} gap={7.7 as never} align={'up' as never} justify={'around' as never} direction={'diag' as never}>{boxes(2)}</Stack></Wide>);
    const e = el('sbad');
    expect([e.tagName, e.className, css(e).rowGap].join(' ')).toBe('DIV dk-stack dk-stack--align-stretch 16px');
  });

  test('as ul: no bullets, padding or margin', async () => {
    await render(<Stack id="sul" as="ul"><li>a</li><li>b</li></Stack>);
    const s = css(el('sul'));
    expect([s.listStyleType, s.paddingLeft, s.marginTop]).toEqual(['none', '0px', '0px']);
  });

  test('wrap: a row that wraps onto more lines', async () => {
    await render(<div style={{ width: '50px' }}><Stack id="swrap" direction="row" wrap gap={0}>{boxes(4, '20px')}</Stack></div>);
    const k = kids('swrap');
    expect(k[2].y).toBeGreaterThan(k[0].y);
  });

  test('the --stack-gap token sets the default gap', async () => {
    await render(<Stack id="stok" style={{ '--stack-gap': '3px' } as React.CSSProperties}>{boxes(2)}</Stack>);
    expect(css(el('stok')).rowGap).toBe('3px');
  });
});
