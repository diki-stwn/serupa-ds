// Anatomy (128): each component guide's "## Anatomy" section is a numbered list the docs can draw (docs/anatomy.tsx):
// parts numbered 1, 2, 3… with a name each, and a class selector each that's in the markup of the story the diagram
// is drawn on (tools/test/baseline-server/<Name>.html, the story it names), so no number points at
// nothing. Components with parts (classes like dk-<name>__<part>) need the section; the list says which don't yet.
//   node tools/test/anatomy.mjs
import fs from 'node:fs';
import path from 'node:path';
import { HERE, PROJECT, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
const DIR = path.join(PROJECT, 'src', 'components');
// Components whose guide has no Anatomy section yet. The check fails when one gets it, so the entry is removed.
const TODO = new Set([]);
// Components that have parts but no story to draw them on, and why.
const EXEMPT = { Toast: "toasts appear when toast() is called, not in a story's markup" };

const section = (md) => {
  const at = md.search(/^## Anatomy\s*$/m);
  if (at < 0) return null;
  const rest = md.slice(at + 1), end = rest.search(/^## /m);
  return end < 0 ? md.slice(at) : md.slice(at, at + 1 + end);
};
// The server markup of each story: <!-- Name --> then its HTML.
const stories = (html) => {
  const bits = html.split(/^<!-- (\w+) -->$/m), out = {};
  for (let i = 1; i < bits.length; i += 2) out[bits[i]] = bits[i + 1];
  return out;
};
const classLists = (html) => [...html.matchAll(/\sclass="([^"]*)"/g)].map((m) => new Set(m[1].split(/\s+/)));

const kebab = (c) => c.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
let drawn = 0;
for (const name of fs.readdirSync(DIR).sort()) {
  const readme = path.join(DIR, name, 'README.md');
  if (!fs.existsSync(readme)) continue;
  const md = fs.readFileSync(readme, 'utf8');
  const s = section(md);
  const css = fs.existsSync(path.join(DIR, name, `${name}.css`)) ? fs.readFileSync(path.join(DIR, name, `${name}.css`), 'utf8') : '';
  const hasParts = new RegExp(`\\.dk-${kebab(name)}__[a-z]`).test(css);
  if (!s) {
    if (hasParts && !TODO.has(name) && !EXEMPT[name]) t(`${name}: the guide has an Anatomy section (its CSS has parts)`, false, 'add "## Anatomy" after "When not to use": a numbered list of **Part** (`.class`): what it is');
    continue;
  }
  if (TODO.has(name)) t(`${name}: has its Anatomy section now`, false, 'remove it from TODO in tools/test/anatomy.mjs');
  const headings = [...md.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
  t(`${name}: Anatomy comes after "When not to use" and before "Usage"`, headings.indexOf('Anatomy') > headings.indexOf('When not to use') && headings.indexOf('Anatomy') < headings.indexOf('Usage'), headings.join(' · '));
  const items = [...s.matchAll(/^(\d+)\. (.*)$/gm)];
  const parts = items.map((m) => {
    const f = /^\*\*(.+?)\*\* \(`([^`]+)`\): \S/.exec(m[2]);
    return { n: Number(m[1]), line: m[2], name: f?.[1], selector: f?.[2] };
  });
  const bad = parts.filter((p) => !p.name || !/^(\.[a-z][\w-]*)+$/.test(p.selector));
  const numbered = parts.every((p, i) => p.n === i + 1);
  const names = parts.map((p) => p.name), twice = names.filter((x, i) => x && names.indexOf(x) !== i);
  t(`${name}: ${parts.length} parts, numbered from 1, each "**Name** (\`.class\`): what it is"`, parts.length >= 2 && !bad.length && numbered && !twice.length,
    [bad.length && `not in the form: ${bad.map((p) => p.n + '. ' + p.line.slice(0, 50)).join(' | ')}`, !numbered && 'numbers skip or repeat', twice.length && `named twice: ${twice.join(', ')}`, parts.length < 2 && 'fewer than two parts'].filter(Boolean).join('; '));
  const server = path.join(HERE, 'baseline-server', `${name}.html`);
  if (!fs.existsSync(server)) { t(`${name}: has server markup to check the parts against`, false, server); continue; }
  const all = stories(fs.readFileSync(server, 'utf8'));
  // The story is named: Storybook lists them in the file's order, the server markup alphabetically.
  const story = /^Drawn from the `(\w+)` story(?:, opened)?\./m.exec(s)?.[1];
  if (!story) { t(`${name}: the Anatomy section names its story ("Drawn from the \`Default\` story.")`, false); continue; }
  if (!(story in all)) { t(`${name}: the Anatomy story ${story} exists`, false, `stories: ${Object.keys(all).join(', ')}`); continue; }
  const lists = classLists(all[story]);
  const missing = parts.filter((p) => p.selector && !lists.some((l) => p.selector.slice(1).split('.').every((c) => l.has(c))));
  t(`${name}: every part is in the ${story} story the diagram is drawn on`, !missing.length, missing.map((p) => `${p.n}. ${p.name} (${p.selector})`).join(', '));
  drawn++;
}
t(`${drawn} components have an anatomy diagram`, drawn > 0);
done(report('Anatomy', R));
