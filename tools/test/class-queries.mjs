// Tests that find elements by class (E1): `.dk-…` in querySelector, querySelectorAll, closest or matches ties a test to
// the markup rather than to what a person (or a screen reader) finds, so a renamed class breaks it and a lost role or
// name doesn't. Find elements by role and name (getByRole) instead. The count per test file only goes down: a new
// one fails, and so does a file that dropped some until its budget follows.
//   node tools/test/class-queries.mjs            check
//   node tools/test/class-queries.mjs --update   write the counts as the new budgets (only after removing queries)
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const BASELINE = path.join(PROJECT, 'tools/test/baseline-class-queries.json');
const QUERY = /\b(?:querySelector(?:All)?|closest|matches)(?:<[^>()]*>)?\(\s*(['"`])((?:(?!\1).)*?\.dk-(?:(?!\1).)*)\1/g;

const files = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map((f) => String(f).split(path.sep).join('/'))
  .filter((f) => /\.test\.tsx?$/.test(f)).sort();
const counts = {};
for (const f of files) {
  const n = [...fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8').matchAll(QUERY)].length;
  if (n) counts['src/' + f] = n;
}
if (process.argv.includes('--update')) {
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(counts).length} budgets to ${path.relative(PROJECT, BASELINE)}`);
  process.exit(0);
}
const budget = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const R = [{ name: `the test files were read (${files.length}, ${total(counts)} class queries)`, ok: files.length > 50, detail: `${files.length} test files under src/` }];
for (const f of [...new Set([...Object.keys(budget), ...Object.keys(counts)])].sort()) {
  const n = counts[f] || 0, b = budget[f] || 0;
  R.push({
    name: `${f}: ${n} class ${n === 1 ? 'query' : 'queries'}, budget ${b}`,
    ok: n === b,
    detail: n > b
      ? `${n - b} new: find the element by role and name (screen.getByRole('button', { name: 'Save' })) rather than by its .dk- class`
      : `${b - n} fewer than the budget, well done: run node tools/test/class-queries.mjs --update so they can't come back`,
  });
}
done(report('Class queries in tests', R));
