// The agents' guide to working on the repository (AGENTS.md, which Claude Code reads through CLAUDE.md's one line
// @AGENTS.md: not a symbolic link, which tracked.mjs forbids). Everything it names exists: each npm script, each file
// or folder, each link and the README section it points to. It points to the real rules rather than repeating them,
// so it can only go stale by naming something that's gone.
//   node tools/test/agents.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, read, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const guide = read('AGENTS.md');
t('CLAUDE.md is the one line @AGENTS.md', read('CLAUDE.md') === '@AGENTS.md\n', 'write just "@AGENTS.md" and a newline');

const { scripts } = JSON.parse(read('package.json'));
const runs = [...new Set([...guide.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]))];
const noScript = runs.filter((s) => !scripts[s]);
t('every npm run script it names is in package.json', runs.length && !noScript.length, noScript.join(', ') || 'it names none');

const exists = (p) => fs.existsSync(path.join(PROJECT, p));
// Paths in code spans and link targets: anything with a slash or a file extension, <Name> standing for a component.
const spans = [...guide.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]).filter((p) => /\/|\.\w+$/.test(p) && !/^[@<]/.test(p));
const links = [...guide.matchAll(/\]\(([^)#\s]+)(#[\w-]+)?\)/g)];
const paths = [...new Set([...spans.map((p) => p.replace('<Name>', 'Button')), ...links.map((m) => m[1])])];
// Build output isn't in a fresh checkout: it only has to be what .gitignore keeps out.
const built = new Set(['dist/', 'src/generated/']);
const missing = paths.filter((p) => !(built.has(p) ? read('.gitignore').includes(p.replace(/\/$/, '')) : exists(p)));
t('every file and folder it names exists', paths.length && !missing.length, missing.join(', '));
const scriptsRun = [...new Set([...guide.matchAll(/node (tools\/[\w./-]+\.mjs)/g)].map((m) => m[1]))];
t('every script it runs with node exists', scriptsRun.length && scriptsRun.every(exists), scriptsRun.filter((p) => !exists(p)).join(', '));

// A link to a section: GitHub's anchor for one of that file's headings.
const slug = (h) => h.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
const badAnchors = links.filter((m) => m[2] && exists(m[1])).filter((m) => ![...read(m[1]).matchAll(/^#+ (.+)$/gm)].some((h) => '#' + slug(h[1]) === m[2])).map((m) => m[1] + m[2]);
t('every section it links to is a heading there', !badAnchors.length, badAnchors.join(', '));

done(report('Agents guide', R));
