// Writes each component's token table in its README from its <name>.tokens.json, so the table can't drift from the
// tokens the package publishes (E14). The table sits between two markers in the "Component tokens" section:
//   <!-- token-table:start (made from <name>.tokens.json by npm run tokens: edit the descriptions there) -->
//   …
//   <!-- token-table:end -->
// Columns: the CSS variable, its default (the shared token it reads, or the literal value) and the token's
// $description. A component with more than TWENTY tokens in two or more groups gets a heading per group.
//   node tools/tokens/readme-tables.mjs           rewrite the tables
//   node tools/tokens/readme-tables.mjs --check   exit 1, naming each README that is out of date
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COMP = path.join(ROOT, 'src', 'components');
const START = (file) => `<!-- token-table:start (made from ${file} by npm run tokens: edit the descriptions there) -->`;
const END = '<!-- token-table:end -->';
const TWENTY = 20;
const HEADINGS = { color: 'Colors', spacing: 'Spacing', sizing: 'Sizing', border: 'Border', borders: 'Border', radius: 'Radius', shape: 'Shape', shadow: 'Shadow', typography: 'Type', fontSize: 'Type', lineHeight: 'Type', motion: 'Motion', transitions: 'Motion', layout: 'Layout', opacity: 'Opacity', state: 'States' };

// `{spacing.spacing-1_5}` reads as `spacing-1.5`, the name the CSS variable has (--spacing-1\.5).
function defaultOf(value) {
  if (typeof value === 'string') {
    const ref = /^\{[^.}]+\.([^}]+)\}$/.exec(value);
    return '`' + (ref ? ref[1].replace(/_/g, '.') : value) + '`';
  }
  if (value && typeof value === 'object' && value.alpha === 0) return '`transparent`';
  if (value && typeof value === 'object' && value.hex) return '`' + value.hex + '`';
  return '`' + JSON.stringify(value) + '`';
}
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function tableFor(tokensFile) {
  const root = Object.values(JSON.parse(fs.readFileSync(tokensFile, 'utf8')))[0];
  const groups = [];
  for (const [group, entries] of Object.entries(root)) {
    if (group.startsWith('$')) continue;
    const rows = [];
    for (const [name, t] of Object.entries(entries)) {
      if (name.startsWith('$')) continue;
      rows.push(`| \`${t.$extensions['com.serupa'].cssVar}\` | ${defaultOf(t.$value)} | ${cell(t.$description ?? '')} |`);
    }
    if (rows.length) groups.push({ heading: HEADINGS[group] ?? group, rows });
  }
  const head = ['| Token | Default | Use |', '| --- | --- | --- |'];
  const count = groups.reduce((n, g) => n + g.rows.length, 0);
  if (count <= TWENTY || groups.length < 2) return [...head, ...groups.flatMap((g) => g.rows)].join('\n');
  // Groups that share a heading (border and borders) go under one.
  const merged = [];
  for (const g of groups) {
    const same = merged.find((m) => m.heading === g.heading);
    if (same) same.rows.push(...g.rows); else merged.push({ ...g, rows: [...g.rows] });
  }
  return merged.map((g) => [`**${g.heading}**`, '', ...head, ...g.rows].join('\n')).join('\n\n');
}

// Each component's README and token file, for the components that have one.
export function components() {
  return fs.readdirSync(COMP).flatMap((name) => {
    const dir = path.join(COMP, name);
    const tokens = fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? fs.readdirSync(dir).find((f) => f.endsWith('.tokens.json')) : undefined;
    return tokens ? [{ name, readme: path.join(dir, 'README.md'), tokens: path.join(dir, tokens), file: `${name}/${tokens}` }] : [];
  });
}

// The README with its table made from the token file, or an error when it has no markers.
export function render(c) {
  const text = fs.readFileSync(c.readme, 'utf8');
  const a = text.indexOf('<!-- token-table:start'), b = text.indexOf(END);
  if (a < 0 || b < a) return { error: `${path.relative(ROOT, c.readme)} has no ${END.replace('end', 'start')} … ${END} markers` };
  return { text: text.slice(0, a) + START(path.basename(c.tokens)) + '\n' + tableFor(c.tokens) + '\n' + text.slice(b), old: text };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const bad = [];
  for (const c of components()) {
    const r = render(c);
    if (r.error) { bad.push(r.error); continue; }
    if (r.text === r.old) continue;
    if (check) bad.push(`${path.relative(ROOT, c.readme)}: its token table is out of date: run npm run tokens`);
    else fs.writeFileSync(c.readme, r.text);
  }
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
}
