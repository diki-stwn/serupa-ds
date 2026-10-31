// The architecture decision records in docs/adr/: each one's status is Proposed, Accepted or "Superseded by" a
// record that exists, every link between records resolves, and the README's table lists every record with the
// same status as the record itself.
//   node tools/test/adr.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const DIR = path.join(PROJECT, 'docs', 'adr');
const files = fs.readdirSync(DIR).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
const readme = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');
const STATUS = /^\*\*Status:\*\* (Proposed|Accepted|Superseded by \[ADR-(\d{4})\]\((\d{4}-[^)]+\.md)\))$/m;

const badStatus = [], badLinks = [], badTitle = [], notListed = [], wrongRow = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(DIR, f), 'utf8');
  const num = f.slice(0, 4);
  if (!text.startsWith(`# ADR-${num}: `)) badTitle.push(f);
  const m = STATUS.exec(text);
  if (!m) badStatus.push(f);
  else if (m[2] && (m[3].slice(0, 4) !== m[2] || m[2] === num)) badStatus.push(`${f} (supersedes link ${m[3]})`);
  for (const [, target] of text.matchAll(/\]\((\d{4}-[^)#]+\.md)(?:#[^)]*)?\)/g))
    if (!fs.existsSync(path.join(DIR, target))) badLinks.push(`${f} → ${target}`);
  const row = readme.split('\n').find((l) => l.startsWith(`| [${num}](${f}) |`));
  if (!row) { notListed.push(f); continue; }
  const want = !m ? null : m[2] ? `Superseded by [${m[2]}](${m[3]})` : m[1];
  if (want && !row.trimEnd().endsWith(`| ${want} |`)) wrongRow.push(`${f}: README says "${row.split('|').at(-2).trim()}", the record says "${want}"`);
}
for (const [, target] of readme.matchAll(/\]\((\d{4}-[^)#]+\.md)\)/g))
  if (!fs.existsSync(path.join(DIR, target))) badLinks.push(`README.md → ${target}`);

done(report('ADRs', [
  { name: 'there are records in docs/adr/', ok: files.length > 0 },
  { name: 'each record starts with "# ADR-NNNN: " and its own number', ok: !badTitle.length, detail: badTitle.join(', ') },
  { name: 'each record\'s status is Proposed, Accepted or Superseded by another record', ok: !badStatus.length, detail: badStatus.join(', ') },
  { name: 'every link between records resolves', ok: !badLinks.length, detail: badLinks.join(', ') },
  { name: 'the README lists every record', ok: !notListed.length, detail: notListed.join(', ') },
  { name: 'the README gives each record\'s own status', ok: !wrongRow.length, detail: wrongRow.join('; ') },
]));
