import * as React from 'react';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Card, CardFooter, CardHeader } from '../components/Card/Card';
import { Button } from '../components/Button/Button';
import { press, withMotion } from '../../tools/test/vitest/helpers';

// Scratch probe (not for merge): what is :active while the mouse is held on a Card with href, in WebKit?
test('PROBE card active', async () => {
  const out: string[] = [];
  await withMotion(async () => {
    await render(<Card id="zc" href="#zc"><CardHeader title="Atlas" /><CardFooter><Button id="zb">Save</Button></CardFooter></Card>);
    const c = document.getElementById('zc')!;
    const r = c.getBoundingClientRect();
    for (const at of [{ x: 8, y: 8 }, { x: r.width / 2, y: 20 }]) {
      await press(c, async () => {
        await new Promise((ok) => setTimeout(ok, 100));
        const hit = document.elementFromPoint(r.left + at.x, r.top + at.y);
        out.push(`at ${at.x},${at.y}: hit=${hit?.tagName}.${hit?.className} active=[${[...document.querySelectorAll(':active')].map((e) => e.tagName + '.' + (e.className || '')).join(' | ')}] cardActive=${c.matches(':active')} rule=${c.matches('.dk-card--link:active:not(:has(:is(a[href], button, input, select, textarea, label, summary, [tabindex]):not(.dk-card__link):active))')} scale=${getComputedStyle(c).scale} hash=${location.hash}`);
      }, at);
    }
  });
  history.replaceState(null, '', location.pathname + location.search);
  expect(out).toEqual(['PROBE']);
});
