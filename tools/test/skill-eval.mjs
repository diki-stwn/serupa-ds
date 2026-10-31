// The skill eval's grader (tools/skill-eval/grade.mjs) marks what it should: a good answer passes every check, and
// each kind of mistake fails the one check that names it and no other. Every task names only components the package
// has, and every task has a dated result in tools/skill-eval/results/.
//   node tools/test/skill-eval.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';
import { CHECKS, TASKS, grade } from '../skill-eval/grade.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

const GOOD = `import * as React from 'react';
import { Button, Field, Input, IconButton, Checkbox, Image, Stack } from 'serupa-ds';
export function SignIn() {
  const [email, setEmail] = React.useState('');
  return (
    <form className="p-4 gap-2" style={{ padding: 'var(--spacing-4)', opacity: 0.9, flex: 1 }}>
      <Stack gap="2">
        <Field label="Email" error={email ? undefined : 'Enter your email'}><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Checkbox label="Keep me signed in" />
        <Checkbox>Or with children</Checkbox>
        <IconButton icon={null} label="More" />
        <Image src="/a.png" alt="" />
        <input type="hidden" name="next" value="/" />
        <Button type="submit">Sign in</Button>
      </Stack>
    </form>
  );
}`;
const good = grade(GOOD, ['Field', 'Input', 'Button|Link']);
t('a good answer passes every check', CHECKS.every((c) => good[c].ok), CHECKS.filter((c) => !good[c].ok).map((c) => `${c}: ${good[c].why}`).join('; '));

// Each mistake, as one change to the good answer, and the one check it must fail.
const BAD = [
  ['parses', GOOD.replace('</form>', '</fom>')],
  ['serupa', GOOD.replace("from 'serupa-ds'", "from './ui'")],
  ['components', GOOD.replace('Button, Field, ', 'Field, ').replace(/<Button type="submit">Sign in<\/Button>/, '')],
  ['no-rebuilds', GOOD.replace('<Button type="submit">Sign in</Button>', '<button type="submit">Sign in</button>')],
  ['tokens', GOOD.replace("padding: 'var(--spacing-4)'", 'padding: 16')],
  ['tokens', GOOD.replace("padding: 'var(--spacing-4)'", "color: '#1a73e8'")],
  ['tokens', GOOD.replace('className="p-4 gap-2"', 'className="p-[12px] gap-2"')],
  ['tokens', GOOD.replace("padding: 'var(--spacing-4)'", "transition: 'opacity 200ms'")],
  ['names', GOOD.replace('label="More"', 'aria-label="More"')],
  ['names', GOOD.replace('<Image src="/a.png" alt="" />', '<img src="/a.png" />')],
  ['names', GOOD.replace('<Checkbox label="Keep me signed in" />', '<Checkbox />')],
  ['names', GOOD.replace('<Button type="submit">', '<Input placeholder="Code" /><Button type="submit">')],
  ['no-div-click', GOOD.replace('<Stack gap="2">', '<Stack gap="2"><div onClick={() => {}}>Row</div>')],
];
for (const [check, src] of BAD) {
  const r = grade(src, ['Field', 'Input', 'Button|Link']);
  // Nothing imported from serupa-ds means none of the expected components either.
  const also = { parses: CHECKS, serupa: ['components'] }[check] ?? [];
  const others = CHECKS.filter((c) => c !== check && !also.includes(c) && !r[c].ok);
  t(`a mistake fails "${check}" and nothing else (${r[check].why || 'passed'})`, !r[check].ok && !others.length,
    r[check].ok ? `"${check}" passed` : `also failed: ${others.map((c) => `${c} (${r[c].why})`).join(', ')}`);
}

// The tasks name components that exist, and have been run.
const names = new Set(fs.readdirSync(path.join(PROJECT, 'src/components')));
const exports = fs.readFileSync(path.join(PROJECT, 'src/components/Toast/index.ts'), 'utf8');
for (const task of TASKS) {
  const unknown = task.expect.flatMap((e) => e.split('|')).filter((n) => !names.has(n) && !new RegExp(`\\b${n}\\b`).test(exports));
  t(`task ${task.id}: every component it expects exists`, !unknown.length, 'not in the package: ' + unknown.join(', '));
}
const results = path.join(PROJECT, 'tools/skill-eval/results');
const runs = fs.existsSync(results) ? fs.readdirSync(results).filter((n) => /^\d{4}-\d{2}-\d{2}\.md$/.test(n)) : [];
t('the eval has at least one dated run in tools/skill-eval/results/', runs.length > 0, 'run node tools/skill-eval/run.mjs and commit its results');

done(report('Skill eval grader', R));
