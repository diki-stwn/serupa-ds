// The baseline report (tools/baseline-report.mjs) that the Update baselines workflow posts on a pull request: each
// changed picture beside the old one, grouped by component, the size changes, and the other baselines counted.
//   node tools/test/baseline-report.mjs
import { MARKER, report } from '../baseline-report.mjs';
import { done, report as check } from './lib.mjs';

const url = (file, side) => `https://example.com/${side}/${file}`;
const sizes = {
  base: { 'tools/test/baseline-size/Combobox.json': { alone: 14.2, share: 3.9, css: 1.3 } },
  head: { 'tools/test/baseline-size/Combobox.json': { alone: 15.2, share: 3.9, css: 1.4 }, 'tools/test/baseline-size/Rating.json': { alone: 2, share: 0.8, css: 0.5 } },
};
const pictures = Array.from({ length: 8 }, (_, i) => ({ status: 'M', file: `tools/test/baseline-visual/Button/Primary-${i}-rest.png` }));
const text = report([
  ...pictures,
  { status: 'A', file: 'tools/test/baseline-visual/Rating/Default-axes.png' },
  { status: 'D', file: 'tools/test/baseline-visual/Alert/Old-axes.png' },
  { status: 'M', file: 'tools/test/baseline-size/Combobox.json' },
  { status: 'A', file: 'tools/test/baseline-size/Rating.json' },
  { status: 'M', file: 'tools/test/baseline-aria/Rating.txt' },
  { status: 'M', file: 'tools/test/baseline-aria/Button.txt' },
], (f) => sizes.base[f] ?? null, (f) => sizes.head[f] ?? null, url);
const empty = report([{ status: 'M', file: 'tools/test/size.mjs' }], () => null, () => null, url);

done(check('Baseline report', [
  { name: 'starts with the marker the workflow finds its earlier comment by', ok: text.startsWith(MARKER + '\n') && empty.startsWith(MARKER) },
  { name: 'counts the pictures and groups them by component, A to Z', ok: text.includes('### Pictures: 8 changed, 1 new, 1 removed') && text.indexOf('<b>Alert</b>: 1 removed') < text.indexOf('<b>Button</b>: 8 changed') && text.indexOf('<b>Button</b>') < text.indexOf('<b>Rating</b>: 1 new'), detail: text },
  { name: 'shows a changed picture before and after, and caps each component at six', ok: text.includes('<img src="https://example.com/base/tools/test/baseline-visual/Button/Primary-0-rest.png"') && text.includes('<img src="https://example.com/head/tools/test/baseline-visual/Button/Primary-0-rest.png"') && !text.includes('Primary-6-rest') && text.includes('And 2 more in Files changed.'), detail: text },
  { name: 'a new picture has no before, a removed one no after', ok: text.includes('| `Default-axes` | new | <img') && text.includes('| `Old-axes` | <img src="https://example.com/base/tools/test/baseline-visual/Alert/Old-axes.png" width="240" alt="Old-axes before"> | removed |'), detail: text },
  { name: 'size: before, after and the change for what moved, the value alone for what did not', ok: text.includes('| Combobox | 14.2 KiB → 15.2 KiB (+1) | 3.9 KiB | 1.3 KiB → 1.4 KiB (+0.1) |') && text.includes('| Rating | – → 2 KiB | – → 0.8 KiB | – → 0.5 KiB |'), detail: text },
  { name: 'the other baselines are counted by what they hold', ok: text.includes('- roles and names: 2 files'), detail: text },
  { name: 'says so when no baseline moved', ok: empty.includes('No baseline changes.'), detail: empty },
]));
