// The coding agents' skill (skills/serupa/SKILL.md): it loads (a name and a description in its front matter), and
// what it tells an agent is true of the package. Every component it lists exists (dist/components.json), every
// export, utility class and token it names is real, and it installs the version package.json is at. Its components
// index is rewritten from the component folders on each release (tools/build/registry.mjs), like README.md's. Build
// first (npm run build).
//   node tools/test/skill.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, read, report, done, fail } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const skill = read('skills/serupa/SKILL.md');
const manifest = path.join(PROJECT, 'dist', 'components.json');
if (!fs.existsSync(manifest)) fail('dist/components.json is missing: run npm run build first');
const { components } = JSON.parse(fs.readFileSync(manifest, 'utf8'));

// Front matter: what an agent's skill loader reads to decide when to use it.
const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? '';
const field = (k) => new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(front)?.[1].trim() ?? '';
t('it has front matter naming it "serupa", as its folder is', field('name') === 'serupa', `name: ${field('name') || '(none)'}`);
const description = field('description');
t('its description says when to use it, in at most 1024 characters and without angle brackets', description && description.length <= 1024 && !/[<>]/.test(description), `${description.length} characters`);

// The components index, between the markers registry.mjs writes.
const index = /<!-- components:start[^>]*-->([\s\S]*?)<!-- components:end -->/.exec(skill)?.[1] ?? '';
const listed = [...index.matchAll(/^- \*\*(\w+)\*\*:/gm)].map((m) => m[1]);
t('it has a components index (node tools/build/registry.mjs --readme writes it)', listed.length, 'no "- **Name**:" lines between the components markers');
const gone = listed.filter((n) => !components[n]);
t('every component it lists is in the package (dist/components.json)', !gone.length, `${gone.join(', ')}: run node tools/build/registry.mjs --readme`);

// The rest of the text: what it tells an agent to use has to exist.
const prose = skill.replace(index, '');
// The main entry's exports and the subpath tools' (serupa-ds/purge's serupaPurge(), serupa-ds/testing's forEachTheme()).
const declared = ['index', 'purge', 'testing', 'stylelint', 'eslint'].map((f) => read(`dist/${f}.d.ts`)).join('\n');
const exported = new Set([...declared.matchAll(/\bexport (?:declare )?(?:const|function|class) (\w+)|\bexport \{([^}]*)\}/g)].flatMap((m) => (m[1] ? [m[1]] : m[2].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()))).filter(Boolean));
// A component or helper it names in code: `<Container …`, `Field`, `announcePage()`.
const names = [...new Set([...prose.matchAll(/`<?([A-Z][A-Za-z]+)\b/g), ...prose.matchAll(/`([a-z]\w*)\(/g)].map((m) => m[1]))];
const missing = names.filter((n) => n !== 'var' && !exported.has(n) && !components[n]);
t('every export it names is one the package has', !missing.length, missing.join(', '));
const utilities = JSON.parse(read('tools/test/baseline-utilities.json'));
const css = read('tokens.css');
const classes = [...new Set([...prose.matchAll(/`([a-z][a-z0-9-]*-[a-z0-9-]+)`/g)].map((m) => m[1]).filter((c) => /^(p|m|gap|bg|text|rounded|shadow|outline|border|flex|grid|sr)-/.test(c)))];
// The alias list names tokens (`text-muted`), the rest classes (`text-text-muted`): either has to exist.
const unknownClasses = classes.filter((c) => !(c in utilities) && !css.includes(`--${c}:`));
t('every utility class or alias it names is in bundle.css or tokens.css', classes.length && !unknownClasses.length, unknownClasses.join(', ') || 'it names none');
const tokens = [...new Set([...prose.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]))];
const unknownTokens = tokens.filter((n) => !css.includes(`--${n}:`));
t('every token it names is in tokens.css', tokens.length && !unknownTokens.length, unknownTokens.join(', ') || 'it names none');
const { version } = JSON.parse(read('package.json'));
const pinned = [...prose.matchAll(/serupa-ds#v(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
t(`it installs the current version (v${version}; tools/release.mjs stamps it)`, pinned.length && pinned.every((v) => v === version), pinned.join(', ') || 'no serupa-ds#v… install line');

done(report('Agent skill', R));
