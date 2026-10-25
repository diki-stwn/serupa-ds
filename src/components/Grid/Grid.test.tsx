import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { css } from '../../../tools/test/vitest/helpers';
import { Grid } from './Grid';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const boxes = (n: number) => Array.from({ length: n }, (_, i) => <div key={i} style={{ background: '#ccc', height: `${10 + i * 5}px` }} />);
// Each cell's box, relative to the grid's top-left corner.
const kids = (id: string) => {
  const o = el(id).getBoundingClientRect();
  return [...el(id).children].map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left - o.left), y: Math.round(r.top - o.top), w: Math.round(r.width), h: Math.round(r.height) }; });
};
const Wide = ({ children }: { children: React.ReactNode }) => <div style={{ width: '600px' }}>{children}</div>;

describe('Grid', () => {
  test('columns={3}: three equal columns 8px apart, wrapping onto a second row; ref reaches it', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Wide><Grid id="g3" columns={3} gap={2} ref={r}>{boxes(5)}</Grid></Wide>);
    const k = kids('g3');
    expect([k[0].w, k[1].x - k[0].x, k[3].x === k[0].x, k[3].y > k[0].y]).toEqual([195, 203, true, true]);
    expect(r.current!.dataset.component).toBe('grid');
  });

  test('auto with minColumnWidth 100px: six columns of 100px in 600px', async () => {
    await render(<Wide><Grid id="gauto" minColumnWidth="100px" gap={0}>{boxes(7)}</Grid></Wide>);
    const k = kids('gauto');
    expect([k[5].x - k[0].x, k[6].x === k[0].x, k[0].w]).toEqual([500, true, 100]);
  });

  test('defaults: auto columns of at least 256px (container-3xs), 16px apart: two across 600px', async () => {
    await render(<Wide><Grid id="gdef">{boxes(3)}</Grid></Wide>);
    const k = kids('gdef');
    expect([k[0].w, k[1].x - k[0].x, k[2].y > k[0].y]).toEqual([292, 308, true]);
  });

  test('a sizing token name works as minColumnWidth; columns out of 1–12 falls back to auto', async () => {
    await render(<Wide><Grid id="gtok" minColumnWidth="container-3xs" columns={99}>{boxes(3)}</Grid></Wide>);
    expect(kids('gtok')[0].w).toBe(292);
    expect(el('gtok').className).toBe('dk-grid dk-grid--auto');
  });

  test('a column never gets wider than a narrow grid (120px)', async () => {
    await render(<div style={{ width: '120px' }}><Grid id="gnarrow">{boxes(2)}</Grid></div>);
    const k = kids('gnarrow');
    expect([k[0].w, k[1].y > k[0].y]).toEqual([120, true]);
  });

  test('as ul: no bullets or padding', async () => {
    await render(<Grid id="gul" as="ul" columns={2}><li>a</li><li>b</li></Grid>);
    const s = css(el('gul'));
    expect([s.listStyleType, s.paddingLeft]).toEqual(['none', '0px']);
  });
});
