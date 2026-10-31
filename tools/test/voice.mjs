// Content and voice (docs/foundations.md): the words in the guides and the words the components say.
//   - READMEs, the docs and the skill leave out words that tell the reader something should be quick for them
//     ("simply", "obviously", "of course", "easy", "just add …") and loaded terms (whitelist, master/slave);
//   - every string in a labels.ts (what people read and hear) says the same, and never points by shape, color,
//     position or sound alone ("the button below", "the red field", WCAG 1.3.3).
// Code (fenced blocks and `inline`) and quoted examples are left out of the prose. A use that reads right goes in ALLOW, with why.
//   node tools/test/voice.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';

// [file, words as they stand in it, why it's fine]
const ALLOW = [];

const WORDS = /\b(simply|obviously|of course|easy|easily|whitelist(?:ed|ing|s)?|blacklist(?:ed|ing|s)?|master|slave)\b|\bjust (?:add|call|change|copy|drop|import|pass|put|run|set|use|wrap|write|click|press|tap|type|enter|select)\b/gi;
const POINTING = /\b(?:button|link|field|icon|box|menu|option)s? (?:below|above|on the (?:left|right))\b|\b(?:red|green|blue|yellow|orange|gray|grey) (?:button|field|link|icon|text|one)s?\b|\b(?:round|square|circular) (?:button|icon)s?\b|\b(?:see|click|press|tap|select) (?:below|above)\b|\b(?:when|after) you hear\b|\bthe (?:sound|beep)\b/gi;

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const rel = (f) => path.relative(PROJECT, f);
const allowed = (file, text) => ALLOW.some(([f, w]) => f === file && w.toLowerCase() === text.toLowerCase());
const hits = (file, text, re) => [...text.matchAll(re)].map((m) => m[0]).filter((w) => !allowed(file, w));
const lineOf = (text, word) => text.slice(0, text.toLowerCase().indexOf(word.toLowerCase())).split('\n').length;

const walk = (dir, keep) => (fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(String).filter(keep).map((f) => path.join(dir, f)) : []);
const prose = [
  ...walk(path.join(PROJECT, 'src', 'components'), (f) => /(^|[\\/])README\.md$/.test(f)),
  ...walk(path.join(PROJECT, 'docs'), (f) => /\.mdx?$/.test(f)),
  ...walk(path.join(PROJECT, 'skills'), (f) => /\.md$/.test(f)),
  ...['README.md', 'CONTRIBUTING.md', 'AGENTS.md'].map((f) => path.join(PROJECT, f)).filter((f) => fs.existsSync(f)),
];
const words = [];
for (const f of prose) {
  const text = fs.readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length))
    // Words in quotes are examples ("not just \"Invalid\"", Content and voice's own "Just add …"); the labels are checked below.
    .replace(/"[^"\n]*"|“[^”\n]*”/g, (m) => ' '.repeat(m.length));
  for (const w of hits(rel(f), text, WORDS)) words.push(`${rel(f)}:${lineOf(text, w)} "${w}"`);
}
t(`the guides and docs (${prose.length} files) leave out "simply", "just", "obviously", "easy" and loaded terms`, !words.length,
  `${words.join('; ')}: reword it (Content and voice in docs/foundations.md), or add it to ALLOW in tools/test/voice.mjs with why it reads right`);

// The strings a labels.ts says: what's inside its quotes, outside comments.
const labelFiles = [...walk(path.join(PROJECT, 'src', 'components'), (f) => /(^|[\\/])labels\.ts$/.test(f)), path.join(PROJECT, 'src', 'internal', 'labels.ts')].filter((f) => fs.existsSync(f));
const said = [];
let strings = 0;
for (const f of labelFiles) {
  const code = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [, s] of code.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    strings++;
    for (const w of [...hits(rel(f), s, WORDS), ...hits(rel(f), s, POINTING)]) said.push(`${rel(f)} "${s}" (${w})`);
  }
}
t(`the labels (${labelFiles.length} files, ${strings} strings) name things, not their shape, color, position or sound, and leave out "just" and the rest`, !said.length && strings > 100,
  strings <= 100 ? `only ${strings} strings found: the labels.ts files moved or changed shape` : said.join('; '));

// The patterns themselves: what they must catch, and what they must leave alone.
const bad = ['Simply drag a file', 'Just add a row', 'Obviously', 'It is easy', 'Add it to the whitelist', 'the master branch', 'Select the button below', 'Fix the red field', 'Press the round button', 'Continue when you hear the beep'];
const good = ['Not just a color', 'People just opened it', 'Drag files here', '3 characters left', 'below 4.5:1, which can be hard to read', 'Dark blue', 'Show options'];
const caught = (s) => new RegExp(WORDS.source, 'i').test(s) || new RegExp(POINTING.source, 'i').test(s);
t('the patterns catch the examples they are for', bad.every(caught), bad.filter((s) => !caught(s)).join('; '));
t('and leave ordinary words alone ("not just", "drag files here", "3 characters left")', !good.some(caught), good.filter(caught).join('; '));

done(report('Content and voice', R));
