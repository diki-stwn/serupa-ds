// Prints the coverage of the Vitest component tests as Markdown, for the CI run's summary page:
//   node tools/test/vitest/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
// Reads coverage/coverage-summary.json (npm run test:coverage, or SERUPA_COVERAGE=1 node tools/test/run.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT } from '../lib.mjs';

const file = path.join(PROJECT, 'coverage', 'coverage-summary.json');
if (!fs.existsSync(file)) { console.log('No coverage report (coverage/coverage-summary.json): a pull request tests only the components it changes, and coverage is measured on full runs (main).'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const pct = (m) => `${m.pct.toFixed(1)}%`;
const row = (name, s) => `| ${name} | ${pct(s.lines)} | ${pct(s.branches)} | ${pct(s.functions)} |`;
// Components with their own test file, by line coverage of their .tsx; the rest of src/ is in the total.
const tested = Object.entries(data).filter(([f]) => f !== 'total' && /src\/components\/(\w+)\/\1\.tsx$/.test(f) && fs.existsSync(f.replace(/\.tsx$/, '.test.tsx')))
  .map(([f, s]) => [path.basename(f, '.tsx'), s]).sort((a, b) => a[1].lines.pct - b[1].lines.pct);
console.log(['## Component test coverage', '', '| | Lines | Branches | Functions |', '| --- | --- | --- | --- |', row('**All of src/**', data.total), ...tested.map(([n, s]) => row(n, s))].join('\n'));
