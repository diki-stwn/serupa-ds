// serupa-purge's command line, without a browser (page.mjs checks what it keeps): a mistake in the arguments ends
// with a message and exit 2, not a stack trace; a linked source file is read and a linked folder or a link to a
// folder is skipped without crashing; a CSS escape for no character reads as U+FFFD, as CSS says; the rules inside
// @starting-style are trimmed like those inside @media; with --components, a word every component exports (their
// label sets, en and id) marks none of them used. Build first.
//   node tools/test/purge-cli.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, report, done, fail } from './lib.mjs';
import { purge, unusedComponentClasses, usedClasses } from '../../bin/serupa-purge.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
if (!fs.existsSync(path.join(PROJECT, 'dist', 'components.json'))) fail('dist/components.json is missing: run npm run build first');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-purge-'));
const cli = (...args) => spawnSync(process.execPath, [path.join(PROJECT, 'bin', 'serupa-purge.mjs'), ...args], { cwd: dir, encoding: 'utf8' });
try {
  fs.writeFileSync(path.join(dir, 'page.html'), '<div class="flex"></div>');
  for (const [label, args, word] of [
    ['-o with no file name', ['page.html', '-o'], '-o needs a file name'],
    ['--css followed by an option', ['page.html', '--css', '--components'], '--css needs a file name'],
    ['an unknown option', ['page.html', '--minify'], 'unknown option --minify'],
    ['a source that isn\'t there', ['missing.html'], 'no such file or folder: missing.html'],
    ['a safelist file that isn\'t there', ['page.html', '--keep', '@safe.txt'], 'no such file or folder: safe.txt'],
    ['no sources', [], 'no source files or folders given'],
  ]) {
    const r = cli(...args);
    t(`stops on ${label}, saying so`, r.status === 2 && r.stderr.includes(word) && r.stderr.includes('usage:') && !/\n\s+at /.test(r.stderr), `exit ${r.status}: ${r.stderr.slice(0, 300)}`);
  }
  const ok = cli('page.html', '-o', 'out.css');
  t('a correct command still writes the file', ok.status === 0 && fs.existsSync(path.join(dir, 'out.css')), ok.stderr.slice(0, 300));

  // Links in a source folder: a linked file is read; a link to a folder whose name looks like a source, and a link
  // back up the tree, are skipped.
  const src = path.join(dir, 'src');
  fs.mkdirSync(path.join(src, 'real'), { recursive: true });
  fs.writeFileSync(path.join(src, 'real', 'a.tsx'), 'className="grid"');
  fs.writeFileSync(path.join(dir, 'outside.ts'), 'className="hidden"');
  let linked = true;
  try {
    fs.symlinkSync(path.join(dir, 'outside.ts'), path.join(src, 'linked.ts'));
    fs.symlinkSync(path.join(src, 'real'), path.join(src, 'folder.js'));
    fs.symlinkSync(src, path.join(src, 'real', 'up'));
  } catch { linked = false; }   // no symbolic links on this system (Windows without the right): nothing to check
  if (linked) {
    let used = null, error = '';
    try { used = usedClasses([src]); } catch (e) { error = String(e); }
    t('reads a linked source file, and skips linked folders without crashing', used?.has('grid') && used.has('hidden'), error || [...(used || [])].join(' '));
  }

  // Escapes: \0, a surrogate and a code point past U+10FFFF are U+FFFD in CSS; String.fromCodePoint throws on the last.
  let out = '', error = '';
  try { out = purge('.a\\110000 b { color: red } .\\31 0 { color: blue } .x\\D800 { color: green }', new Set(['10', 'a�b', 'x�'])); } catch (e) { error = String(e); }
  t('reads a CSS escape for no character as U+FFFD instead of throwing', !error && out.includes('color: red') && out.includes('color: blue') && out.includes('color: green'), error || out);

  // @starting-style holds rules like @media does: a dropped component's or an unused class's go with it.
  const start = purge('@starting-style { .dk-dialog { opacity: 0 } .dk-btn { opacity: 0 } .grid { opacity: 0 } }', new Set(), new Set(['dk-dialog']));
  t('trims the rules inside @starting-style', start.includes('.dk-btn') && !start.includes('dk-dialog') && !start.includes('.grid'), start);

  // --components: a word every component's label sets share (en, id) marks none of them used (GR99).
  const manifest = JSON.parse(fs.readFileSync(path.join(PROJECT, 'dist', 'components.json'), 'utf8'));
  const dropped = (words) => [...unusedComponentClasses(manifest, new Set(words))].sort();
  const button = dropped(['Button', 'Save']);
  t('--components: id="save" or lang="en" in the sources keeps no more components than without', JSON.stringify(dropped(['Button', 'Save', 'id', 'en', 'lang'])) === JSON.stringify(button) && !button.includes('dk-btn') && button.includes('dk-toast'), `${dropped(['Button', 'id', 'en']).length} classes dropped, ${button.length} without id and en`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
done(report('serupa-purge command line', R));
