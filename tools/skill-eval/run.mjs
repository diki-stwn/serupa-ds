// Runs the skill eval: each task in tasks.json goes to a coding agent (Claude Code's `claude -p`, in an empty folder,
// with no tools) twice, once with the Serupa skill (skills/serupa/SKILL.md) as its instructions and once without,
// and grade.mjs scores both. Writes the answers to tools/skill-eval/results/<date>/{with,without}/<task>.tsx and the
// two tables to tools/skill-eval/results/<date>.md. Run it again when the skill changes, and commit the results:
// an edit that makes agents worse shows up as a lower score.
//   node tools/skill-eval/run.mjs [--model <name>] [--only sign-in,filters]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TASKS, gradeDir, table } from './grade.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const model = arg('--model');
const only = arg('--only')?.split(',');
const date = new Date().toISOString().slice(0, 10);
const out = path.join(HERE, 'results', date);
const skill = fs.readFileSync(path.join(ROOT, 'skills/serupa/SKILL.md'), 'utf8');
const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-eval-'));

const ASK = 'Write it as one React component in TypeScript (TSX), in a project that has serupa-ds installed and its CSS loaded. '
  + 'Reply with the code only, in one ```tsx block.';
function answer(task, withSkill) {
  const prompt = (withSkill ? `Use this skill:\n\n<skill>\n${skill}\n</skill>\n\n` : '') + `${task.prompt}\n\n${ASK}`;
  const args = ['-p', prompt, '--output-format', 'text', '--disallowedTools', 'Bash,Edit,Write,Read,Glob,Grep,WebFetch,WebSearch,Agent'];
  if (model) args.push('--model', model);
  const reply = execFileSync('claude', args, { cwd: empty, encoding: 'utf8', maxBuffer: 16 << 20, timeout: 600_000 });
  return /```(?:tsx|jsx|typescript|ts)?\n([\s\S]*?)```/.exec(reply)?.[1] ?? reply;
}

const report = [`# Skill eval, ${date}`, '', `Claude Code ${execFileSync('claude', ['--version'], { encoding: 'utf8' }).trim()}${model ? `, model ${model}` : ''}. Each task once per mode; one run is a sample, so read a difference of a check or two as noise.`, ''];
for (const mode of ['with', 'without']) {
  const dir = path.join(out, mode);
  fs.mkdirSync(dir, { recursive: true });
  for (const t of TASKS) {
    if (only && !only.includes(t.id)) continue;
    process.stdout.write(`${mode} skill: ${t.id}… `);
    fs.writeFileSync(path.join(dir, t.id + '.tsx'), answer(t, mode === 'with'));
    console.log('done');
  }
  report.push(`## ${mode === 'with' ? 'With' : 'Without'} the skill`, '', table(gradeDir(dir)));
}
fs.writeFileSync(path.join(HERE, 'results', date + '.md'), report.join('\n'));
console.log(`\nWrote tools/skill-eval/results/${date}.md`);
