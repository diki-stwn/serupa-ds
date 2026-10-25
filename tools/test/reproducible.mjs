// Reproducible build (D3): the same source builds the same package, byte for byte, wherever and whenever it's built.
// Copies the source (the files git tracks, plus new ones it doesn't ignore) to a folder elsewhere, builds it there
// under another time zone and locale, and compares every file in its dist/ with this checkout's (npm run build first).
// A difference means the build reads something besides the source: a date, an absolute path, the order a folder
// lists in, the machine's locale. Then a release can't be checked against its tag, and every build is a new diff.
//   node tools/test/reproducible.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, done, report } from './lib.mjs';

const hashes = (root) => {
  const out = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else out.set(path.relative(root, f), crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
    }
  };
  if (fs.existsSync(root)) walk(root);
  return out;
};

const R = [];
const here = hashes(path.join(PROJECT, 'dist'));
if (!here.size) R.push({ name: 'dist/ is built', ok: false, detail: 'npm run build first' });
else {
  const files = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: PROJECT, encoding: 'utf8' }).stdout.split('\0').filter(Boolean);
  // A path of another length and name, so nothing that embeds the checkout's location can match by chance.
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-reproducible-elsewhere-'));
  try {
    for (const f of files) {
      const from = path.join(PROJECT, f);
      if (!fs.existsSync(from) || fs.lstatSync(from).isDirectory()) continue;   // deleted, or a submodule
      fs.mkdirSync(path.dirname(path.join(copy, f)), { recursive: true });
      fs.copyFileSync(from, path.join(copy, f));
    }
    fs.symlinkSync(path.join(PROJECT, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
    const run = spawnSync(process.execPath, [path.join(copy, 'tools', 'build', 'build.mjs')], {
      cwd: copy, encoding: 'utf8', env: { ...process.env, TZ: 'Pacific/Chatham', LANG: 'id_ID.UTF-8', LC_ALL: 'id_ID.UTF-8' },
    });
    R.push({ name: 'the copy builds', ok: run.status === 0, detail: (run.stderr || '').split('\n').filter(Boolean).slice(-5).join(' | ') });
    if (run.status === 0) {
      const there = hashes(path.join(copy, 'dist'));
      const differ = [...new Set([...here.keys(), ...there.keys()])].filter((f) => here.get(f) !== there.get(f)).sort();
      R.push({ name: `a second build elsewhere is byte-identical (${here.size} files in dist/)`, ok: !differ.length, detail: differ.slice(0, 15).map((f) => (!here.has(f) ? `${f} (only in the copy)` : !there.has(f) ? `${f} (missing from the copy)` : f)).join(', ') + (differ.length > 15 ? ` and ${differ.length - 15} more` : '') + (differ.length ? '. If you changed the source since your last build, npm run build and run this again' : '') });
    }
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}
done(report('Reproducible build', R));
