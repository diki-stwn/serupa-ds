import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { Grid } from '../components/Grid/Grid';
import { Meter } from '../components/Meter/Meter';
import { Progress } from '../components/Progress/Progress';
import { Slider } from '../components/Slider/Slider';

// A page served with a strict policy: style attributes in its HTML are ignored (style-src-attr 'none'), styles set
// through the CSSOM are not. This file's page has the policy from the first test on (BF2).
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = "style-src-attr 'none'";
document.head.appendChild(meta);

const ui = <div>
  <Progress id="p" value={40} aria-label="Upload" />
  <Meter id="m" value={70} aria-label="Storage" />
  <Slider id="s" defaultValue={25} aria-label="Volume" />
  <Grid id="g" columns={3}><span>a</span><span>b</span><span>c</span></Grid>
</div>;
const px = (sel: string, prop: 'width' | 'left') => Math.round((document.querySelector(sel) as HTMLElement).getBoundingClientRect()[prop]);

describe('server HTML under a strict Content Security Policy', () => {
  test('the server\'s style attributes are ignored at first, and apply once the page is hydrated', async () => {
    const host = document.createElement('div');
    host.style.width = '400px';
    document.body.appendChild(host);
    host.innerHTML = renderToString(ui);
    const fill = '#p .dk-progress__fill', cols = () => getComputedStyle(document.getElementById('g')!).gridTemplateColumns.split(' ').length;
    const track = (sel: string) => Math.round((document.querySelector(sel) as HTMLElement).getBoundingClientRect().width);
    const share = () => Math.round(px(fill, 'width') / track('#p .dk-progress__track') * 100);
    expect([share(), cols()]).toEqual([100, 1]);   // the policy holds: the fill takes the whole track, no columns
    let root: Root | undefined;
    flushSync(() => { root = hydrateRoot(host, ui); });
    await new Promise((r) => setTimeout(r, 50));
    expect([share(), Math.round(px('#m .dk-meter__fill', 'width') / track('#m .dk-meter__track') * 100), cols()]).toEqual([40, 70, 3]);
    const thumb = document.querySelector('#s .dk-slider__thumb') as HTMLElement, rail = document.querySelector('#s') as HTMLElement;
    expect(thumb.getBoundingClientRect().left - rail.getBoundingClientRect().left).toBeGreaterThan(20);
    root?.unmount(); host.remove();
  });
});
