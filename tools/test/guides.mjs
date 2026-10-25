// Usage guides: every component's README.md has the sections docs/usage-guide-template.md requires, so each
// Storybook page says when to use the component, when not to, and how it meets accessibility; and every test or
// tool file a guide names (`tools/test/menu.mjs`, `Menu.test.tsx`) exists; and every class the docs name exists in
// dist/bundle.css (npm run build first), so a page never recommends one that does nothing.
//   node tools/test/guides.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';

const REQUIRED = ['When to use', 'When not to use', 'Usage', 'Accessibility', 'Props', 'Component tokens'];
const DIR = path.join(PROJECT, 'src', 'components');
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
for (const name of fs.readdirSync(DIR).sort()) {
  if (!fs.existsSync(path.join(DIR, name, `${name}.tsx`))) continue;
  const file = path.join(DIR, name, 'README.md');
  if (!fs.existsSync(file)) { t(`${name}: has a usage guide (README.md)`, false, 'missing'); continue; }
  const raw = fs.readFileSync(file, 'utf8'), md = raw.replace(/```[\s\S]*?```/g, '');
  const named = [...raw.matchAll(/`(tools\/[\w./-]+\.\w+|\w+\.test\.tsx)`/g)].map((m) => m[1]);
  const gone = named.filter((f) => !fs.existsSync(f.startsWith('tools/') ? path.join(PROJECT, f) : path.join(DIR, name, f)));
  if (named.length) t(`${name}: the files the guide names exist`, !gone.length, `not found: ${gone.join(', ')}`);
  const headings = [...md.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
  const missing = REQUIRED.filter((h) => !headings.includes(h));
  const order = REQUIRED.filter((h) => headings.includes(h)).map((h) => headings.indexOf(h));
  const inOrder = order.every((v, i) => !i || v > order[i - 1]);
  t(`${name}: the guide has ${REQUIRED.join(', ')}, in that order`, !missing.length && inOrder, missing.length ? `missing: ${missing.join(', ')}` : `order: ${headings.join(' · ')}`);
  // What the keyboard does, under Accessibility: a "### Keyboard" part or a "**Keyboard:**" line ("none: it isn't
  // focusable" is an answer). A component that handles keys itself (keydown in its source) needs a | Key | … | table.
  const a11y = (md.split(/^## Accessibility\s*$/m)[1] || '').split(/^## /m)[0];
  const said = /^### Keyboard\b|\*\*Keyboard:\*\*/m.test(a11y);
  const table = /^\s*\| Key \|/m.test(a11y);
  const keys = /onKeyDown|keydown/.test(fs.readFileSync(path.join(DIR, name, `${name}.tsx`), 'utf8'));
  const ok = said && (!keys || table);
  const why = !said ? 'no "### Keyboard" part or "**Keyboard:**" line under Accessibility' : 'it handles keys: add a | Key | Does | table';
  t(`${name}: the guide says what the keyboard does`, ok, why);
}
// The classes the docs name: each word of a class="…" in an example, and each prefixed class in backticks
// (`md:gap-12`). Utilities have only breakpoint prefixes, so `hover:scale-105` or `focus:not-sr-only` would silently
// do nothing. A bare `scale-105` in backticks is left alone: a token has the same name.
const bundle = path.join(PROJECT, 'dist', 'bundle.css');
if (!fs.existsSync(bundle)) t('the classes the docs name exist in dist/bundle.css', false, 'npm run build first');
else {
  const css = fs.readFileSync(bundle, 'utf8');
  const exists = (c) => css.includes('.' + c.replace(/[:/.[\]%]/g, (m) => '\\' + m));
  const docs = ['README.md', ...fs.readdirSync(path.join(PROJECT, 'docs')).filter((f) => /\.mdx?$/.test(f)).map((f) => `docs/${f}`),
    ...fs.readdirSync(DIR).map((n) => `src/components/${n}/README.md`).filter((f) => fs.existsSync(path.join(PROJECT, f)))];
  const unknown = [];
  for (const f of docs) {
    const text = fs.readFileSync(path.join(PROJECT, f), 'utf8');
    const named = [
      ...[...text.matchAll(/class(?:Name)?="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => /^[a-z-]/.test(c)),
      ...[...text.matchAll(/`([^`\n]+)`/g)].flatMap((m) => m[1].split(/\s+/)).filter((w) => /^[a-z0-9]+:[a-z-][\w\-/.[\]%]*$/.test(w)),
    ];
    for (const c of new Set(named)) if (!exists(c)) unknown.push(`${f}: ${c}`);
  }
  t('the classes the docs name exist in dist/bundle.css', !unknown.length, unknown.slice(0, 12).join(', '));
}
done(report('Usage guides', R));
