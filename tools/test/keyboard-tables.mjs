// Keyboard tables become tests (H7): every key a component's README lists under "### Keyboard" is pressed by a test
// in that component's folder. A table row nobody presses is a promise nothing checks, so it fails, unless KNOWN
// lists it under the queue item that adds the test. A KNOWN line whose key a test now presses fails too.
// Only the key itself is looked for (Shift+Tab needs a Tab, Alt+ArrowDown an ArrowDown, Ctrl+Home a Home).
//   node tools/test/keyboard-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

// What no test presses yet, by component: FH1 adds a test for each, checking what the table says the key does.
const KNOWN = Object.fromEntries(Object.entries({
  Calendar: ['Space'],
  ColorPicker: ['ArrowUp'],
  CopyButton: ['Tab', 'Enter', 'Space'],
  DateRangePicker: ['Space'],
  Dialog: ['Space'],
  Drawer: ['Space'],
  InlineEdit: ['Tab'],
  Input: ['Tab', 'Enter'],
  Link: ['Enter'],
  Navbar: ['Enter', 'Space'],
  NumberInput: ['PageDown'],
  PasswordInput: ['Tab', 'CapsLock'],
  PhoneInput: ['ArrowUp', 'ArrowDown', 'Delete'],
  Popover: ['Space'],
  SearchInput: ['Tab'],
  Select: ['Tab', 'ArrowUp', 'ArrowDown', 'Space'],
  SortableList: ['ArrowUp', 'ArrowLeft', 'ArrowRight'],
  Splitter: ['Tab'],
  Stepper: ['Tab', 'Space'],
  Table: ['arrow'],
  Tabs: ['Space'],
  Textarea: ['Tab'],
  TimePicker: ['PageUp'],
  ToggleButton: ['Tab', 'Enter'],
}).flatMap(([c, ks]) => ks.map((k) => [`${c}:${k}`, 'FH1'])));

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const NAMES = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight', Esc: 'Escape', 'Caps Lock': 'CapsLock', Spacebar: 'Space' };
// The keys a table cell names: "Home / End", "↑ ↓", "Alt+ArrowDown", "→ (← in rtl)", "Arrow keys", "A letter".
function keys(cell) {
  const text = cell.replace(/`/g, '').replace(/\([^)]*\)/g, ' ').replace(/\bin a form field\b/g, ' ');
  if (/^\s*(letters|a letter|printable characters|any character|type a character)\s*$/i.test(text)) return ['letter'];
  if (/arrow keys/i.test(text)) return ['arrow'];
  return text.split(/[,/]|\s+or\s+/).flatMap((part) => {
    const p = part.trim();
    if (!p) return [];
    if (p === 'Caps Lock') return ['CapsLock'];
    const base = p.split('+').pop().trim();
    if (base === 'Arrow' || base === 'Arrows') return ['arrow'];
    return base.split(/\s+/).map((k) => NAMES[k] || k);
  });
}
// The keys a test file presses: user-event's {Key} and {Key>}, a KeyboardEvent's key, userEvent.tab(), a space typed.
function pressed(src) {
  const out = new Set();
  for (const m of src.matchAll(/\{\/?(\w+)>?\}/g)) out.add(m[1]);
  for (const m of src.matchAll(/\bkey:\s*(['"`])(.+?)\1/g)) out.add(m[2] === ' ' ? 'Space' : m[2]);
  // user-event's [Code] form, and a key named in a list a test loops over (['ArrowUp', 'ArrowLeft']).
  for (const m of src.matchAll(/\[(\w+)\]/g)) out.add(m[1]);
  for (const m of src.matchAll(/(['"`])(Arrow(?:Up|Down|Left|Right)|Home|End|Page(?:Up|Down)|Enter|Escape|Tab|Space|Backspace|Delete|CapsLock|F\d+)\1/g)) out.add(m[2]);
  if (/userEvent\.tab\(/.test(src)) out.add('Tab');
  if (/keyboard\((['"`]) \1\)/.test(src) || /\{Space\}/.test(src)) out.add('Space');
  for (const m of src.matchAll(/keyboard\((['"`])([^{'"`]*?)\1\)/g)) if (/[a-z]/i.test(m[2])) out.add('letter');
  for (const k of out) if (/^[a-z]$/i.test(k)) out.add('letter');
  if (ARROWS.some((a) => out.has(a))) out.add('arrow');
  return out;
}

const dir = path.join(PROJECT, 'src', 'components');
const results = [];
const seen = new Set();
let tables = 0;
for (const name of fs.readdirSync(dir).sort()) {
  const readme = path.join(dir, name, 'README.md');
  if (!fs.existsSync(readme)) continue;
  const table = /^### Keyboard\n([\s\S]*?)(?=\n#{2,3} |(?![\s\S]))/m.exec(fs.readFileSync(readme, 'utf8'));
  if (!table) continue;
  tables++;
  const rows = table[1].split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1);
  const tests = fs.readdirSync(path.join(dir, name)).filter((f) => /\.test\.tsx?$/.test(f)).map((f) => fs.readFileSync(path.join(dir, name, f), 'utf8')).join('\n');
  const got = pressed(tests);
  const missing = [...new Set(rows.flatMap((r) => keys(r.split('|')[1])))].filter((k) => !got.has(k));
  for (const k of missing) {
    seen.add(`${name}:${k}`);
    const known = KNOWN[`${name}:${k}`];
    results.push({ name: known ? `${name}: ${k} is in the README's keyboard table but no test presses it yet (${known})` : `${name}: a test presses ${k}, which the README's keyboard table lists`, ok: !!known,
      detail: `no test in src/components/${name}/ presses ${k}; add one that checks what the table says it does` });
  }
  if (!missing.length) results.push({ name: `${name}: a test presses every key its README's keyboard table lists`, ok: true });
}
results.unshift({ name: `found the README keyboard tables (${tables})`, ok: tables >= 30, detail: `only ${tables}` });
for (const k of Object.keys(KNOWN)) if (!seen.has(k)) results.push({ name: `${k}: still untested`, ok: false, detail: 'a test presses it now; take its line out of KNOWN' });
done(report('Keyboard tables', results));
