import * as React from 'react';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { useVirtual, type VirtualRange } from './virtual';

// useVirtual on its own: a plain scroller of fixed 20px rows, and scrollToIndex, which VirtualList doesn't use yet.
function Rows(props: { count: number; out: { r?: VirtualRange } }) {
  const r = useVirtual({ count: props.count, estimate: 20, overscan: 0 });
  props.out.r = r;
  const rows: React.ReactNode[] = [];
  for (let i = r.start; i < r.end; i++) rows.push(<div key={i} data-index={i} style={{ height: 20 }}>{i}</div>);
  return <div ref={r.ref} id="s" style={{ height: 100, overflowY: 'auto' }}><div style={{ height: r.before }} />{rows}<div style={{ height: r.after }} /></div>;
}
const frame = () => new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
const shown = () => [...document.querySelectorAll<HTMLElement>('#s [data-index]')].map((e) => Number(e.dataset.index));

test('scrollToIndex brings a row into view (nearest edge) and leaves one already in view alone', async () => {
  const out: { r?: VirtualRange } = {};
  await render(<Rows count={1000} out={out} />);
  const s = document.getElementById('s')!;
  out.r!.scrollToIndex(500);
  await frame();
  expect(s.scrollTop).toBe(501 * 20 - 100);   // the row's bottom at the view's bottom
  await expect.poll(() => shown()).toContain(500);
  out.r!.scrollToIndex(498);
  await frame();
  expect(s.scrollTop).toBe(501 * 20 - 100);   // already in view: no move
  out.r!.scrollToIndex(10);
  await frame();
  expect(s.scrollTop).toBe(200);               // the row's top at the view's top
  out.r!.scrollToIndex(-1); out.r!.scrollToIndex(1000);
  await frame();
  expect(s.scrollTop).toBe(200);               // out of range: nothing
});

test('past the height limit (1,000,000 rows of 20px), scrollToIndex maps the row to the scaled range: the last and a middle row come into view', async () => {
  const out: { r?: VirtualRange } = {};
  await render(<Rows count={1_000_000} out={out} />);
  const s = document.getElementById('s')!;
  await expect.poll(() => s.scrollHeight).toBeLessThanOrEqual(15_000_000);
  out.r!.scrollToIndex(999_999);
  await expect.poll(() => shown()).toContain(999_999);
  out.r!.scrollToIndex(400_000);
  await expect.poll(() => shown()).toContain(400_000);
  expect(out.r!.offsetOf(400_000)).toBeGreaterThanOrEqual(s.scrollTop - 1);
});
