// Escape hatches in the shipped code (src/, not tests or stories), against a budget that only goes down (E9):
// double casts (`as unknown as`) that tell TypeScript to trust the code, and comments that switch a check off
// (@ts-ignore, @ts-expect-error, @ts-nocheck, eslint-disable). `any` is already an ESLint error.
//   node tools/test/casts.mjs
// A new one fails: type the code instead. When one goes, lower the budget whenever this file is next touched.
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const BUDGET = { 'double casts (as unknown as)': 2, 'checks switched off (@ts-ignore, @ts-expect-error, eslint-disable)': 0 };
const PATTERN = { 'double casts (as unknown as)': /\bas unknown as\b/g, 'checks switched off (@ts-ignore, @ts-expect-error, eslint-disable)': /@ts-(?:ignore|expect-error|nocheck)\b|eslint-disable/g };

const files = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map((f) => String(f).split(path.sep).join('/'))
  .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f));
const R = Object.entries(PATTERN).map(([name, re]) => {
  const found = files.flatMap((f) => fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8').split('\n').flatMap((line, i) => (line.match(re) || []).map(() => `src/${f}:${i + 1}`)));
  const budget = BUDGET[name];
  return {
    name: `${name}: ${found.length}, within ${budget}`,
    ok: found.length <= budget,
    detail: `${found.length - budget} more than the budget: ${found.join(', ')}. Type the code instead, or raise the budget in tools/test/casts.mjs if there is no other way`,
  };
});
done(report('Escape hatches', R));
