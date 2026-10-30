import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { Meter } from '../components/Meter/Meter';
import { Progress } from '../components/Progress/Progress';
import { Rating } from '../components/Rating/Rating';
import { Slider } from '../components/Slider/Slider';

// A page served with a strict policy: style attributes in its HTML are ignored (style-src-attr 'none'), styles set
// through the CSSOM are not. This file's page has the policy from the first test on (BF2).
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = "style-src-attr 'none'";
document.head.appendChild(meta);

// How much of each Rating star its fill shows, in whole percent.
const stars = () => [...document.querySelectorAll('#r > *')].map((st) => Math.round(st.children[1].getBoundingClientRect().width / st.getBoundingClientRect().width * 100));

const ui = <div>
  <Progress id="p" value={40} aria-label="Upload" />
  <Meter id="m" value={70} aria-label="Storage" />
  <Slider id="s" defaultValue={25} aria-label="Volume" />
  <Rating id="r" value={4.3} readOnly aria-label="Reviews" />
</div>;

describe('server HTML under a strict Content Security Policy', () => {
  test('the server\'s style attributes are ignored at first, and apply once the page is hydrated', async () => {
    const host = document.createElement('div');
    host.style.width = '400px';
    document.body.appendChild(host);
    host.innerHTML = renderToString(ui);
    const fill = '#p .dk-progress__fill';
    // How much of a track its fill covers, in whole percent: the part the track shows, as a fill may slide past it.
    const seen = (f: string, t: string) => { const a = document.querySelector(f)!.getBoundingClientRect(), b = document.querySelector(t)!.getBoundingClientRect(); return Math.round((Math.min(a.right, b.right) - Math.max(a.left, b.left)) / b.width * 100); };
    const share = () => seen(fill, '#p .dk-progress__track');
    expect(share()).toBe(100);   // the policy holds: the fill takes the whole track
    let root: Root | undefined;
    flushSync(() => { root = hydrateRoot(host, ui); });
    await expect.poll(() => [share(), seen('#m .dk-meter__fill', '#m .dk-meter__track')], { message: `the fill's style: ${document.querySelector(fill)?.getAttribute('style')}` }).toEqual([40, 70]);
    const thumb = document.querySelector('#s [role=slider]') as HTMLElement, rail = document.querySelector('#s') as HTMLElement;
    expect(thumb.getBoundingClientRect().left - rail.getBoundingClientRect().left).toBeGreaterThan(20);
    expect(stars()).toEqual([100, 100, 100, 100, 30]);   // 4.3 stars, not five full ones (GR10)
    root?.unmount(); host.remove();
  });

  test('Firefox empties a blocked style attribute: the styles still apply, from what React hydrated', async () => {
    const host = document.createElement('div');
    host.style.width = '400px';
    document.body.appendChild(host);
    host.innerHTML = renderToString(ui);
    for (const el of host.querySelectorAll('[style]')) el.setAttribute('style', '');   // what Firefox leaves of them
    let root: Root | undefined;
    flushSync(() => { root = hydrateRoot(host, ui); });
    const seen = (f: string, t: string) => { const a = document.querySelector(f)!.getBoundingClientRect(), b = document.querySelector(t)!.getBoundingClientRect(); return Math.round((Math.min(a.right, b.right) - Math.max(a.left, b.left)) / b.width * 100); };
    await expect.poll(() => [seen('#p .dk-progress__fill', '#p .dk-progress__track'), seen('#m .dk-meter__fill', '#m .dk-meter__track')]).toEqual([40, 70]);
    const thumb = document.querySelector('#s [role=slider]') as HTMLElement, rail = document.querySelector('#s') as HTMLElement;
    expect(thumb.getBoundingClientRect().left - rail.getBoundingClientRect().left).toBeGreaterThan(20);
    expect(stars()).toEqual([100, 100, 100, 100, 30]);   // 4.3 stars, not five full ones (GR10)
    root?.unmount(); host.remove();
  });
});
