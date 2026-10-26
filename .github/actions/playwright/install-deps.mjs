// node install-deps.mjs <browser> <deb folder>: installs the system packages Playwright needs for <browser>
// that the runner lacks, keeping the downloaded .deb files in <deb folder> so a later run (with the folder
// restored from the cache) installs them without downloading. Falls back to `playwright install-deps` if
// Playwright's answer can't be read.
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [browser, debs] = process.argv.slice(2);
const run = (cmd, args, timeout) => execFileSync(cmd, args, { stdio: 'inherit', timeout });
// Ubuntu's mirror sometimes stalls a connection for good: apt gives up on a stalled one after 30 s and tries again,
// and each apt run is stopped after a few minutes, so a shard fails fast (and a re-run starts it over) instead of
// hanging until the job's timeout (a stalled `apt-get update` held two shards for over 20 minutes on 26 Oct).
const NET = ['-o', 'Acquire::http::Timeout=30', '-o', 'Acquire::https::Timeout=30', '-o', 'Acquire::Retries=3'];
const MINUTES = 60 * 1000;

// --dry-run lists what's missing ("Missing system dependencies (9):" and one package per line, exiting 1),
// prints the apt command it would run, or says nothing is missing (exiting 0).
const dry = spawnSync('npx', ['playwright', 'install-deps', '--dry-run', browser], { encoding: 'utf8' });
const out = `${dry.stdout}${dry.stderr}`;
const listed = /Missing system dependencies[^\n]*:\n((?:[ \t]+\S+\n?)+)/.exec(out);
const command = /apt-get install -y((?:\s+[a-z0-9][a-z0-9.+:-]*)+)/.exec(out);
const packages = (listed ? listed[1] : command ? command[1] : '').trim().split(/\s+/).filter((p) => p && !p.startsWith('-'));
if (!packages.length) {
  if (dry.status === 0) { console.log('All system packages are already installed.'); process.exit(0); }
  console.log(`Couldn't read Playwright's package list, so installing the usual way. It printed:\n${out}`);
  run('npx', ['playwright', 'install-deps', browser]);
  process.exit(0);
}

fs.mkdirSync(`${debs}/partial`, { recursive: true });
const cached = fs.readdirSync(debs).filter((f) => f.endsWith('.deb')).length;
console.log(`Installing ${packages.length} packages (${packages.join(', ')}); ${cached} .deb files are cached.`);
const install = (more) => run('sudo', ['apt-get', 'install', '-y', '--no-install-recommends', '-o', `Dir::Cache::Archives=${debs}`,
  '-o', 'APT::Keep-Downloaded-Packages=true', ...NET, ...more, ...packages], 5 * MINUTES);
// With every .deb in the cache, apt installs from disk and needs no network: no `apt-get update`, which is the
// step that stalls. --no-download fails if anything is missing (a package updated since the cache was saved, a
// new runner image), and then the lists are read fresh and the new versions downloaded.
try {
  install(['--no-download']);
} catch {
  console.log('Some packages aren\'t in the cache: reading the package lists and downloading them.');
  run('sudo', ['apt-get', 'update', '-qq', ...NET], 4 * MINUTES);
  install([]);
}
// apt writes as root; the cache step saves the folder as the runner user.
run('sudo', ['chown', '-R', `${process.getuid()}:${process.getgid()}`, debs]);
