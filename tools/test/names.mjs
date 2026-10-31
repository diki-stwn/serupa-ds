// Accessible names in the ARIA baselines (TF5, after TF4): what a screen reader user hears for each control.
//   - no name says the same words twice in a row ("Ada Lovelace Ada Lovelace": an image or icon named beside its own
//     text, which should be alt="" or aria-hidden);
//   - in one story, no two links or buttons share a name, so each says which item it acts on (WCAG 2.4.6, 2.4.9).
//     Stories that show one control several times on purpose (Sizes, States, Tones…) are left out by name.
// The snapshots hold names, not descriptions, so a control told apart by aria-describedby still shows here: KNOWN
// lists those, and the cases still to fix, each with why. It only shrinks: an entry that no longer happens fails.
//   node tools/test/names.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';

// Stories that repeat a control on purpose, to show its sizes, states or variants side by side.
const DEMO = /Sizes|States|Shapes|Locales|Tones|Variants|Destructive|Disabled|Loading|Long(Text|Label)/;
// "Component/Story": why its repeated names are fine, or what still has to change.
const KNOWN = {
  'NotificationCenter/Open': 'each "Mark as read" is described by its row\'s title (aria-describedby, TF4 #940), which the snapshot doesn\'t show',
  'NumberInput/Currency': 'each field\'s Decrease and Increase sit in that field\'s own labelled group, as in every number field',
  'Toast/Burst': 'TF4: each toast\'s "Dismiss" isn\'t described by its title yet',
  'Toast/TopCenter': 'TF4: each toast\'s "Dismiss" isn\'t described by its title yet',
};

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const DIR = path.join(PROJECT, 'tools', 'test', 'baseline-aria');
const LINE = /^\s*- (\w+) "((?:[^"\\]|\\.)*)"/;
const REPEAT = /^(.{2,}?)\s+\1(?:\s|$)/u;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.yml')).sort();
const repeats = [], dups = [], used = new Set();
let names = 0;
for (const f of files) {
  const comp = f.replace(/\.yml$/, '');
  const seen = new Map();
  let story = '';
  const flush = () => {
    const twice = [...seen].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
    const key = `${comp}/${story}`;
    if (!twice.length || DEMO.test(story)) return;
    if (KNOWN[key]) { used.add(key); return; }
    dups.push(`${key}: ${twice.join(', ')}`);
  };
  for (const line of fs.readFileSync(path.join(DIR, f), 'utf8').split('\n')) {
    const h = /^# (.+)$/.exec(line);
    if (h) { flush(); story = h[1]; seen.clear(); continue; }
    const m = LINE.exec(line);
    if (!m) continue;
    const [, role, name] = m;
    names++;
    if (REPEAT.test(name)) repeats.push(`${comp}/${story}: ${role} "${name}"`);
    if (role === 'link' || role === 'button') seen.set(`${role} "${name}"`, (seen.get(`${role} "${name}"`) || 0) + 1);
  }
  flush();
}

t(`the ARIA baselines were read (${files.length} components, ${names} names)`, files.length > 50 && names > 500,
  `only ${files.length} files and ${names} names in tools/test/baseline-aria/: run npm run test:aria:update`);
t('no name says the same words twice in a row', !repeats.length,
  `${repeats.join('; ')}: give the image or icon beside the text alt="" or aria-hidden, so the name is said once`);
t('in a story, no two links or buttons share a name', !dups.length,
  `${dups.join('; ')}: name each for the item it acts on, or describe it with aria-describedby (then add the story to KNOWN in tools/test/names.mjs with why)`);
const stale = Object.keys(KNOWN).filter((k) => !used.has(k));
t('every KNOWN entry still happens (fixed ones come off the list)', !stale.length, `${stale.join('; ')}: remove it from KNOWN in tools/test/names.mjs`);

// The repeat pattern: what it must catch, and what it must leave alone.
const bad = ['Ada Lovelace Ada Lovelace ada@example.com', 'Edit Edit', 'Grace Hopper Grace Hopper'];
// A name that really repeats a word ("Bora Bora") is caught too: give its story a KNOWN entry.
const good = ['Ada Lovelace', 'Close', 'Mark as read', 'Page 1 of 1', 'Sort by name, then by name length'];
t('the repeat pattern catches a name said twice', bad.every((s) => REPEAT.test(s)), bad.filter((s) => !REPEAT.test(s)).join('; '));
t('and leaves single words and ordinary names alone', !good.some((s) => REPEAT.test(s)), good.filter((s) => REPEAT.test(s)).join('; '));

done(report('Accessible names', R));
