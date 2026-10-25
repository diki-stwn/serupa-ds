import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Breadcrumb, BreadcrumbItem } from '../components/Breadcrumb/Breadcrumb';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { Radio, RadioGroup } from '../components/Radio/Radio';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Slider } from '../components/Slider/Slider';
import { Switch } from '../components/Switch/Switch';

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
// The height that takes a press: from the drawn box's middle, how far up and down a point still lands on the target.
function reach(target: HTMLElement): number {
  const r = target.getBoundingClientRect(), x = r.left + Math.min(r.width / 2, 6);
  const hits = (y: number) => { const e = document.elementFromPoint(x, y); return !!e && (e === target || target.contains(e)); };
  let up = 0, down = 0;
  while (up < 20 && hits(r.top - up - 0.5)) up++;
  while (down < 20 && hits(r.bottom + down + 0.5)) down++;
  return Math.round(r.height + up + down);
}

// WCAG 2.5.8: every target takes a press over at least 24px, here without moving anything on the page (AL1).
describe('target size', () => {
  test('Checkbox, Radio and Switch rows, Slider, small SegmentedControl options and Breadcrumb links take a press over 24px; what is drawn keeps its size', async () => {
    await render(<div style={{ display: 'grid', gap: '16px', padding: '40px', width: '320px' }}>
      <Checkbox>Remember me</Checkbox>
      <div><Checkbox aria-label="Select row" /></div>
      <RadioGroup aria-label="Plan"><Radio value="free">Free</Radio></RadioGroup>
      <Switch>Wi-Fi</Switch>
      <Slider aria-label="Volume" defaultValue={40} />
      <SegmentedControl aria-label="View" size="sm" options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} defaultValue="list" />
      <Breadcrumb><BreadcrumbItem href="#home">Home</BreadcrumbItem><BreadcrumbItem href="#docs">Docs</BreadcrumbItem><BreadcrumbItem>Page</BreadcrumbItem></Breadcrumb>
    </div>);
    const targets: Array<[string, HTMLElement]> = [
      ['checkbox row', q('.dk-checkbox:not(.dk-checkbox--bare)')], ['bare checkbox', q('.dk-checkbox--bare')], ['radio row', q('.dk-radio')], ['switch row', q('.dk-switch')],
      ['slider', q('.dk-slider')], ['segment', q('.dk-segmented__item')], ['breadcrumb link', q('.dk-breadcrumb__link')],
    ];
    expect(targets.map(([k, e]) => [k, Math.round(e.getBoundingClientRect().height), reach(e) >= 24]))
      .toEqual([['checkbox row', 20, true], ['bare checkbox', 16, true], ['radio row', 20, true], ['switch row', 20, true], ['slider', 20, true], ['segment', 18, true], ['breadcrumb link', 20, true]]);
    // The bare checkbox reaches 24px across too.
    const bare = q('.dk-checkbox--bare'), r = bare.getBoundingClientRect(), y = r.top + r.height / 2;
    expect([document.elementFromPoint(r.left - 3.5, y) === bare, document.elementFromPoint(r.right + 3.5, y) === bare]).toEqual([true, true]);
  });
});
