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

  test('columns={3} with minColumnWidth is up to three: three across 600px, two across 400px, one across 200px (FV1)', async () => {
    const at = (w: number) => <div style={{ width: w + 'px' }}><Grid id={'gup' + w} columns={3} minColumnWidth="150px" gap={2}>{boxes(4)}</Grid></div>;
    await render(<>{at(600)}{at(400)}{at(200)}</>);
    const wide = kids('gup600'), mid = kids('gup400'), narrow = kids('gup200');
    expect([wide[0].w, wide[2].y === wide[0].y, wide[3].y > wide[0].y]).toEqual([195, true, true]);
    expect([mid[0].w, mid[1].y === mid[0].y, mid[2].y > mid[0].y]).toEqual([196, true, true]);
    expect([narrow[0].w, narrow[1].y > narrow[0].y]).toEqual([200, true]);
    expect(el('gup600').className).toBe('dk-grid dk-grid--upto');
  });

  test('fill: a short row stretches across the empty columns; without it the empty columns stay (FV1)', async () => {
    await render(<Wide>
      <Grid id="gfill" fill minColumnWidth="100px" gap={0}>{boxes(2)}</Grid>
      <Grid id="gkeep" minColumnWidth="100px" gap={0}>{boxes(2)}</Grid>
      <Grid id="gupfill" fill columns={4} minColumnWidth="100px" gap={0}>{boxes(2)}</Grid>
      <Grid id="gfixed" fill columns={4} gap={0}>{boxes(2)}</Grid>
    </Wide>);
    expect([kids('gfill')[0].w, kids('gkeep')[0].w, kids('gupfill')[0].w, kids('gfixed')[0].w]).toEqual([300, 100, 300, 150]);
  });

  test('a nested Grid keeps its own defaults: it takes neither the gap nor the minColumnWidth of the Grid around it', async () => {
    await render(<Wide><Grid columns={1} gap={10} minColumnWidth="50px">
      <Grid id="ginner">{boxes(3)}</Grid>
    </Grid></Wide>);
    const k = kids('ginner');
    expect([k[0].w, k[1].x - k[0].x]).toEqual([292, 308]);
  });

  test('as ul: no bullets or padding', async () => {
    await render(<Grid id="gul" as="ul" columns={2}><li>a</li><li>b</li></Grid>);
    const s = css(el('gul'));
    expect([s.listStyleType, s.paddingLeft]).toEqual(['none', '0px']);
  });
});
