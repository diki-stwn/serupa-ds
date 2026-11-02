// The nightly issue script (tools/nightly-issue.mjs) reads the failing tests out of a run's output the way Vitest
// prints them, and writes an issue that lists each browser.
//   node tools/test/nightly-issue.mjs
import { failures, body } from '../nightly-issue.mjs';
import { done, report } from './lib.mjs';

const output = [
  '\x1b[31m\x1b[41m\x1b[1m FAIL \x1b[22m\x1b[49m\x1b[39m  components (webkit)  src/components/Card/Card.test.tsx > Card > pressed scale',
  'AssertionError: expected \'none\' to be \'matrix(0.97, 0, 0, 0.97, 0, 0)\'',
  ' FAIL   components (webkit)  src/components/Table/Table.test.tsx > Table > arrow keys scroll the frame',
  ' ✓ components (webkit)  src/components/Badge/Badge.test.tsx (12 tests) 300ms',
  ' FAIL   components (webkit)  src/components/Card/Card.test.tsx > Card > pressed scale',
].join('\n');
const found = failures(output);
const text = body({ firefox: [], webkit: found, chromium: null }, 'https://example.com/run/1');

const storybook = failures([
  'PASS  Button: Default',
  'FAIL  Card: Pressed (firefox) threw: TypeError: x is undefined',
  '\nStorybook: 1/2 passed',
  ' FAIL   checks  tools/test/print.mjs > Print > tables repeat their header',
].join('\n'));
const grouped = body({ 'firefox (components)': [], 'webkit (storybook)': storybook }, 'https://example.com/run/2');

done(report('Nightly issue', [
  { name: 'reads the Node suites\' own FAIL lines and Vitest\'s checks project, which names no engine', ok: storybook.length === 2 && storybook[0] === 'Card: Pressed (firefox) threw: TypeError: x is undefined' && storybook[1] === 'tools/test/print.mjs > Print > tables repeat their header', detail: JSON.stringify(storybook) },
  { name: 'a job per group and engine gets its own section', ok: grouped.includes('### webkit (storybook)\n\n2 failing:') && grouped.includes('### firefox (components)\n\nNo failing tests.'), detail: grouped },
  { name: 'reads each failing test once, colors stripped', ok: found.length === 2 && found[0] === 'src/components/Card/Card.test.tsx > Card > pressed scale', detail: JSON.stringify(found) },
  { name: 'reads no failures from a green run', ok: failures(' ✓ components (firefox)  src/a.test.tsx (3 tests)\n Tests  2764 passed').length === 0 },
  { name: 'the issue lists each browser, links the run, and says when a job had no output', ok: text.includes('### webkit\n\n2 failing:') && text.includes('### firefox\n\nNo failing tests.') && text.includes('stopped before the tests ran') && text.includes('(https://example.com/run/1)'), detail: text },
]));
