// The decimals each currency is shown with (shownDigits in src/internal/currency.ts) match the CLDR of the Node this
// runs in. The table pins them, because Safari and Firefox ship older CLDR than Node and Chromium (IDR: 2 decimals,
// not 0), and a server render in one engine must read the same as the hydration in another. When Node updates CLDR
// and a currency changes, this fails and names it: move it in the table.
//   node tools/test/currency.mjs
import { read, done, report } from './lib.mjs';

const src = read('src/internal/currency.ts');
// Each table line: for (const c of "AAA BBB".split(" ")) t[c] = n;, in DIGITS (ISO 4217) and SHOWN (CLDR).
const table = (name) => {
  const body = src.slice(src.indexOf(`const ${name}:`), src.indexOf('})();', src.indexOf(`const ${name}:`)));
  const t = {};
  for (const [, list, n] of body.matchAll(/of "([A-Z ]+)"\.split\(" "\)\) t\[c\] = (\d)/g)) for (const c of list.split(' ')) t[c] = Number(n);
  return t;
};
const iso = table('DIGITS'), shown = table('SHOWN');
const digits = (c) => shown[c] ?? iso[c] ?? 2;
const wrong = [], extra = [];
for (const c of Intl.supportedValuesOf('currency')) {
  const cldr = new Intl.NumberFormat('en', { style: 'currency', currency: c }).resolvedOptions().maximumFractionDigits;
  if (cldr !== digits(c)) wrong.push(`${c} ${cldr} (table: ${digits(c)})`);
}
// A SHOWN entry the same as its ISO digits is dead weight.
for (const [c, n] of Object.entries(shown)) if (n === (iso[c] ?? 2)) extra.push(c);
done(report('Currency decimals', [
  { name: `SHOWN and DIGITS give every currency the decimals CLDR ${process.versions.cldr} shows it with`, ok: !wrong.length, detail: `move in src/internal/currency.ts: ${wrong.join(', ')}` },
  { name: 'SHOWN lists only currencies whose CLDR decimals differ from ISO 4217', ok: !extra.length, detail: `remove from SHOWN: ${extra.join(', ')}` },
  { name: 'the tables were read', ok: Object.keys(iso).length > 10 && Object.keys(shown).length > 5, detail: 'the table format in currency.ts changed; update the parser here' },
]));
