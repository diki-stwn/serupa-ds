import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { place, placeLayer } from './position';

// A phone held sideways: 400 × 390. Anchors are DOMRects at the given top and bottom, 100px wide at x 20.
const at = (top: number, bottom: number) => new DOMRect(20, top, 100, bottom - top);

describe('place', () => {
  beforeAll(async () => { await page.viewport(400, 390); });
  afterAll(async () => { await page.viewport(900, 700); });

  test('fits below: stays below, no max height', () => {
    expect(place(at(20, 46), { width: 200, height: 200 }, 'bottom-start', 4)).toEqual({ x: 20, y: 50, side: 'bottom' });
  });

  test('only the other side fits: flips to it', () => {
    expect(place(at(300, 326), { width: 200, height: 200 }, 'bottom-start', 4)).toEqual({ x: 20, y: 96, side: 'top' });
  });

  test('neither side fits: the roomier side, at the height it has, so all of it is on screen (the audit\'s 30-item menu)', () => {
    // Below: 390 - 8 - 206 - 4 = 172. Above: 180 - 4 - 8 = 168.
    expect(place(at(180, 206), { width: 200, height: 374 }, 'bottom-start', 4)).toEqual({ x: 20, y: 210, side: 'bottom', maxHeight: 172 });
    // Above has more: 250 - 4 - 8 = 238, below 390 - 8 - 276 - 4 = 102.
    expect(place(at(250, 276), { width: 200, height: 374 }, 'bottom-start', 4)).toEqual({ x: 20, y: 8, side: 'top', maxHeight: 238 });
  });

  test('a phone keyboard shrinks the visual viewport: a list under a field near its bottom flips above; pinch-zoom offsets keep it on the visible part', () => {
    const fake = (offsetLeft: number, offsetTop: number, width: number, height: number) => Object.defineProperty(window, 'visualViewport', { configurable: true, value: { offsetLeft, offsetTop, width, height } });
    try {
      // The keyboard covers the bottom 190px: 200px of page show. Below the field (150–176) there are 200 - 8 - 176 - 4 = 12px.
      fake(0, 0, 400, 200);
      expect(place(at(150, 176), { width: 200, height: 100 }, 'bottom-start', 4)).toEqual({ x: 20, y: 46, side: 'top' });
      // Zoomed in on the right half (x 200–400, y 100–300): the layer is kept inside it, 8px from its left edge.
      fake(200, 100, 200, 200);
      expect(place(at(150, 176), { width: 100, height: 50 }, 'bottom-start', 4)).toEqual({ x: 208, y: 180, side: 'bottom' });
    } finally { delete (window as { visualViewport?: unknown }).visualViewport; }
    expect(place(at(20, 46), { width: 200, height: 200 }, 'bottom-start', 4)).toEqual({ x: 20, y: 50, side: 'bottom' });
  });

  test('a side placement taller than the screen: the screen\'s height less the margins, from the top margin', () => {
    expect(place(at(100, 126), { width: 100, height: 500 }, 'right', 4)).toEqual({ x: 124, y: 8, side: 'right', maxHeight: 374 });
  });

  test('a side placement wider than the room beside the anchor: a max width of that room, so it stays on screen and its text wraps', () => {
    expect(place(at(100, 126), { width: 300, height: 40 }, 'right', 4)).toEqual({ x: 124, y: 93, side: 'right', maxWidth: 268 });
    expect(place(new DOMRect(300, 100, 50, 26), { width: 400, height: 40 }, 'left', 4)).toEqual({ x: 8, y: 93, side: 'left', maxWidth: 288 });
    expect(place(at(100, 126), { width: 200, height: 40 }, 'right', 4)).toEqual({ x: 124, y: 93, side: 'right' });
  });

  test('placeLayer: --dk-layer-origin is the point on the edge facing the anchor, level with its centre (EO1)', () => {
    const anchor = document.createElement('button'), layer = document.createElement('div');
    anchor.style.cssText = 'position: fixed; left: 120px; top: 100px; height: 26px; width: 60px';
    layer.style.cssText = 'position: fixed; width: 100px; height: 80px';
    document.body.append(anchor, layer);
    const origin = (p: string) => { placeLayer(layer, anchor, p, 4); return [layer.dataset.side, layer.style.getPropertyValue('--dk-layer-origin')]; };
    // bottom-start: the layer's left edge is the anchor's, so the anchor's centre is 30px in, on its top edge.
    expect(origin('bottom-start')).toEqual(['bottom', '30px 0px']);
    expect(origin('bottom-end')).toEqual(['bottom', '70px 0px']);
    expect(origin('top')).toEqual(['top', '50px 80px']);
    expect(origin('right')).toEqual(['right', '0px 40px']);
    expect(origin('left-start')).toEqual(['left', '100px 13px']);
    anchor.remove(); layer.remove();
  });

  test('placeLayer: a max width of its own (a style prop) is kept, and combined with the room beside the anchor', () => {
    const anchor = document.createElement('button'), layer = document.createElement('div');
    anchor.style.cssText = 'position: fixed; left: 20px; top: 100px; height: 26px; width: 100px';
    layer.style.cssText = 'position: fixed; width: 360px; max-width: 280px';
    document.body.append(anchor, layer);
    placeLayer(layer, anchor, 'bottom-start', 4);
    expect(layer.style.maxWidth).toBe('280px');
    placeLayer(layer, anchor, 'right', 4);
    expect(layer.getBoundingClientRect().width).toBe(268);
    placeLayer(layer, anchor, 'bottom-start', 4);
    expect(layer.style.maxWidth).toBe('280px');
    anchor.remove(); layer.remove();
  });

  test('placeLayer: sets the max height and scrolls inside, keeps the scroll position, and grows back when there is room', async () => {
    const anchor = document.createElement('button'), layer = document.createElement('div');
    anchor.style.cssText = 'position: fixed; left: 20px; top: 180px; height: 26px; width: 100px';
    layer.style.cssText = 'position: fixed; width: 200px';
    for (let i = 0; i < 30; i++) layer.appendChild(Object.assign(document.createElement('div'), { textContent: 'Item ' + i, style: 'height: 20px' }));
    document.body.append(anchor, layer);
    placeLayer(layer, anchor, 'bottom-start', 4);
    const r = layer.getBoundingClientRect();
    expect([layer.style.maxHeight, layer.style.overflowY, r.top, r.bottom <= 390 - 8]).toEqual(['172px', 'auto', 210, true]);
    layer.scrollTop = 200;
    placeLayer(layer, anchor, 'bottom-start', 4);
    expect(layer.scrollTop).toBe(200);
    anchor.style.top = '10px';
    await page.viewport(400, 700);
    placeLayer(layer, anchor, 'bottom-start', 4);
    expect([layer.style.maxHeight, layer.style.overflowY, layer.offsetHeight]).toEqual(['', '', 600]);
    anchor.remove(); layer.remove();
    await page.viewport(400, 390);
  });
});
