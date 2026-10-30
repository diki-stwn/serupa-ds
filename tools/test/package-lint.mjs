// The package as published, checked by the two standard linters: publint (package.json fields, exports, file
// formats) and Are the Types Wrong (every export's types resolve the way TypeScript reads them in Node 16+ and
// bundlers). Build first (npm run build). Both read the tarball npm pack makes, so they see what a project installs.
//   node tools/test/package-lint.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';
import { PROJECT, report, done, fail } from './lib.mjs';

// The package exactly as a release ships it (tools/publish.mjs): the files package.json lists, and a package.json
// without scripts or devDependencies. Packed from a copy, so npm doesn't run the build again.
const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-pack-'));
const dir = path.join(tmp, 'package');
for (const f of pkg.files) if (fs.existsSync(path.join(PROJECT, f))) fs.cpSync(path.join(PROJECT, f), path.join(dir, f), { recursive: true });
const shipped = { ...pkg };
delete shipped.scripts;
delete shipped.devDependencies;
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(shipped, null, 2) + '\n');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packed = spawnSync(npm, ['pack', '--json', '--pack-destination', tmp], { cwd: dir, encoding: 'utf8' });
if (packed.status !== 0) fail('npm pack: ' + packed.stderr);
const tarball = path.join(tmp, JSON.parse(packed.stdout)[0].filename);
const R = [];

// publint, at its strictest. serupa.iife.js and serupa-icons.iife.js are browser scripts for a <script> tag, not
// modules: publint reads the CommonJS shim inside them (React comes from window.React) as a CJS file in an ESM
// package, so that one message, for those two files, is expected.
const script = (m) => m.code === 'FILE_INVALID_FORMAT' && /\.iife\.js$/.test(String(m.args?.actualFilePath || ''));
const { messages } = await publint({ pkgDir: dir, level: 'suggestion', strict: true, pack: 'npm' });
const found = messages.filter((m) => !script(m));
R.push({ name: 'publint finds nothing (package.json, exports, file formats)', ok: !found.length, detail: found.map((m) => `${m.type}: ${formatMessage(m, pkg)}`).join(' | ') });

// Are the Types Wrong. The package is ESM only (projects on CommonJS import() it), so the esm-only profile; the
// CSS, the browser scripts and theme.js have no types to check.
const notCode = Object.keys(pkg.exports).filter((k) => /\.(css|iife\.js)$/.test(k) || k === './theme.js').map((k) => k.slice(2));
const attw = spawnSync(process.execPath, [path.join(PROJECT, 'node_modules', '@arethetypeswrong', 'cli', 'dist', 'index.js'), tarball, '--profile', 'esm-only', '--format', 'ascii', ...(notCode.length ? ['--exclude-entrypoints', ...notCode] : [])], { encoding: 'utf8' });
R.push({ name: 'Are the Types Wrong: every export\'s types resolve in Node 16+ (ESM) and bundlers', ok: attw.status === 0, detail: (() => {
  const lines = (attw.stdout + attw.stderr).split('\n');
  // Each problem is a line that links its explanation (💀, 🎭, ⚠️, 🐛…: the mark varies), unless ignored per profile.
  const problems = lines.filter((l) => /arethetypeswrong\.github\.io\/blob\/main\/docs\/problems\//.test(l) && !/ignored/.test(l));
  // No problem table (a package with no types at all, a crash): its first lines say what went wrong.
  return (problems.length ? problems : lines.filter((l) => l.trim()).slice(0, 3)).slice(0, 10).join(' | ');
})() });

fs.rmSync(tmp, { recursive: true, force: true });
done(report('Package lint', R));
