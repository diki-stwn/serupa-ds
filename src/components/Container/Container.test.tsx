import * as React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { css } from '../../../tools/test/vitest/helpers';
import { Container } from './Container';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const Wide = ({ w = 600, children }: { w?: number; children: React.ReactNode }) => <div id="root" style={{ width: `${w}px` }}>{children}</div>;
// The padding follows the screen's width, so some tests resize the viewport; put it back afterwards.
afterEach(async () => { await page.viewport(900, 700); });

describe('Container', () => {
  test('defaults: xl (1280px), padded, a <div>; ref and className reach it', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Wide><Container id="cdef" ref={r} className="extra">x</Container></Wide>);
    const e = el('cdef'), s = css(e);
    expect([e.tagName, e.className, r.current === e, s.maxWidth, e.dataset.size, e.getBoundingClientRect().width]).toEqual(['DIV', 'dk-container dk-container--xl dk-container--padded extra', true, '1328px', 'xl', 600]);
  });

  test('prose: 672px of content (container-2xl), the padding outside it, as main (FF1)', async () => {
    await page.viewport(1400, 800);
    await expect.poll(() => window.innerWidth).toBe(1400);
    await render(<Wide w={1200}><Container id="cprose" size="prose" as="main">x</Container><Container id="cbare" size="prose" padded={false}>x</Container></Wide>);
    const e = el('cprose'), s = css(e);
    expect([e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight), s.paddingLeft, el('cbare').getBoundingClientRect().width, e.tagName]).toEqual([672, '32px', 672, 'MAIN']);
  });

  test('full, padded={false}: no maximum, no padding', async () => {
    await render(<Wide><Container id="cfull" size="full" padded={false}>x</Container></Wide>);
    const s = css(el('cfull'));
    expect([s.maxWidth, s.paddingLeft]).toEqual(['none', '0px']);
  });

  test('unknown size and as fall back to xl and div', async () => {
    await render(<Wide><Container id="cbad" size={'huge' as never} as={'table' as never}>x</Container></Wide>);
    expect([el('cbad').tagName, el('cbad').dataset.size]).toEqual(['DIV', 'xl']);
  });

  test('padding grows with the screen: 16px, 24px from 640px, 32px from 1024px', async () => {
    await render(<Wide><Container id="cdef">x</Container></Wide>);
    const pad: string[] = [];
    for (const w of [400, 800, 1100]) {
      await page.viewport(w, 800);
      await expect.poll(() => window.innerWidth).toBe(w);
      pad.push(css(el('cdef')).paddingLeft);
    }
    expect(pad).toEqual(['16px', '24px', '32px']);
  });

  test('centers itself once the page is wider than its size', async () => {
    await page.viewport(2000, 800);
    await expect.poll(() => window.innerWidth).toBe(2000);
    await render(<Wide w={1800}><Container id="cdef">x</Container></Wide>);
    const r = el('cdef').getBoundingClientRect(), o = el('root').getBoundingClientRect();
    expect([r.width, Math.round(r.left - o.left), Math.round(o.right - r.right)]).toEqual([1344, 228, 228]);   // 1280 of content and 32px each side
  });
});
