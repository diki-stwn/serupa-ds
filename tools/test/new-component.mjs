// The component generator (tools/new-component.mjs) makes a folder the contract accepts: it writes into a scratch
// folder here and checks what came out. No browser needed.
//   node tools/test/new-component.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-new-'));
const make = (...a) => spawnSync(process.execPath, [path.join(PROJECT, 'tools', 'new-component.mjs'), ...a, '--root', root], { encoding: 'utf8' });

// --directions first (KW17): one story file, Directions/<Name>, with a switch between its takes, that the contract
// refuses to merge.
const picked = make('TimeChip', '--directions');
const pick = path.join(root, 'src', 'directions', 'TimeChip.stories.tsx');
t('--directions writes only the Directions story, outside src/components/', picked.status === 0 && fs.existsSync(pick) && !fs.existsSync(path.join(root, 'src', 'components', 'TimeChip')), picked.stderr);
if (fs.existsSync(pick)) {
  const story = fs.readFileSync(pick, 'utf8');
  t('under Directions/, with one switch between the takes', story.includes("title: 'Directions/TimeChip'") && story.includes("control: 'inline-radio'") && /export const Pick/.test(story));
  t('and marked unfinished, so it never merges', story.includes('TODO(new-component)'));
  t('a second --directions for the same name stops', make('TimeChip', '--directions').status === 1);
}

const made = make('DateBadge', '--group', 'Forms');
const dir = path.join(root, 'src', 'components', 'DateBadge');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
t('it makes a component folder', made.status === 0 && fs.existsSync(dir), made.stderr);
if (made.status === 0) {
  const want = ['DateBadge.tsx', 'index.ts', 'DateBadge.css', 'date-badge.tokens.json', 'DateBadge.stories.tsx', 'DateBadge.mdx', 'README.md', 'preview.html', 'DateBadge.test.tsx'];
  const have = fs.readdirSync(dir).sort();
  t('with every file contract.mjs asks for, named the way it asks', JSON.stringify(have) === JSON.stringify([...want].sort()), have.join(', '));
  t('and the server-render case package.mjs runs', fs.existsSync(path.join(root, 'tools', 'test', 'ssr', 'DateBadge.mjs')));

  const code = read('DateBadge.tsx');
  t('the component goes through component() and is marked pure, so it tree-shakes', /\/\* @__PURE__ \*\/ component<[^>]+>\("DateBadge"/.test(code) && !/forwardRef|displayName/.test(code));
  t('it starts as beta: @beta in the doc comment on its export (tools/build/registry.mjs reads it)', /@beta[^*]*\*\/\nexport const DateBadge\b/.test(code));
  t('its class and data-component are the kebab-case name', code.includes('"dk-date-badge"') && code.includes('data-component="date-badge"'));
  t('the stories sit in the group asked for', read('DateBadge.stories.tsx').includes("title: 'Components/Forms/DateBadge'"));

  // The tokens file, the CSS and the guide's table agree: every token's CSS variable is read in the CSS, with the
  // shared token it references as the fallback, and listed in the guide.
  const flat = (o) => Object.values(o).flatMap((v) => (v && typeof v === 'object' ? ('$value' in v ? [v] : flat(v)) : []));
  const tokens = flat(JSON.parse(read('date-badge.tokens.json')));
  const css = read('DateBadge.css'), guide = read('README.md');
  const off = tokens.filter((x) => {
    const v = x.$extensions['com.serupa'].cssVar, shared = x.$value.replace(/^\{\w+\.(.+)\}$/, '$1');
    return !css.includes(`var(${v}, var(--${shared}))`) || !guide.includes(`| \`${v}\` | \`${shared}\` |`);
  });
  t('each token is read in the CSS with its default, and listed in the guide', tokens.length && !off.length, off.map((x) => x.$extensions['com.serupa'].cssVar).join(', '));
  t('the CSS is in the components layer', /^@layer dk\.components \{/m.test(css));

  const REQUIRED = ['When to use', 'When not to use', 'Usage', 'Accessibility', 'Props', 'Component tokens'];
  const headings = [...guide.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  t('the guide has the headings guides.mjs requires, in order', JSON.stringify(headings) === JSON.stringify(REQUIRED), headings.join(', '));
  const marked = fs.readdirSync(dir).filter((f) => f !== 'index.ts' && f !== 'date-badge.tokens.json' && f !== 'DateBadge.mdx' && f !== 'preview.html' && !read(f).includes('TODO(new-component)'));
  t('every file that needs its author\'s words says TODO(new-component), so contract.mjs holds it back', !marked.length, marked.join(', '));

  const again = make('DateBadge');
  t('it won\'t overwrite a component that exists', again.status === 1 && /already exists/.test(again.stderr), again.stderr);
}
for (const bad of ['dateBadge', 'Date-Badge', '']) t(`it refuses the name "${bad}" (PascalCase only)`, make(...(bad ? [bad] : [])).status === 2);

fs.rmSync(root, { recursive: true, force: true });
done(report('Component generator', R));
