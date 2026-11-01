// Language packs (I7, 137): every serupa-ds/labels/<language> entry has every built-in word, each of the same kind as
// English's (a text or a function of the same arguments), says something for every sample (a count of 1 and of 5,
// each status, hue and reason), and isn't English where it should be translated. Run after npm run build.
//   node tools/test/label-packs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PROJECT, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
const dir = path.join(PROJECT, 'dist', 'js', 'labels');
const src = fs.readdirSync(path.join(PROJECT, 'src', 'labels')).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3)).sort();
const built = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort() : [];
t(`each src/labels/ file is built into dist/js/labels/ (${src.join(', ')})`, src.length >= 2 && src.join() === built.join(), `built: ${built.join(', ')}`);
const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8'));
t('package.json exports serupa-ds/labels/* with its types', pkg.exports['./labels/*']?.types === './dist/labels/*.d.ts' && pkg.exports['./labels/*'].import === './dist/js/labels/*.js'
  && src.every((l) => fs.existsSync(path.join(PROJECT, 'dist', 'labels', l + '.d.ts'))));

const packs = Object.fromEntries(await Promise.all(built.map(async (l) => [l, await import(pathToFileURL(path.join(dir, l + '.js')).href)])));
const en = packs.en.labels;
const { enLabels, idLabels } = await import(pathToFileURL(path.join(PROJECT, 'dist', 'js', 'index.js')).href);
t('serupa-ds/labels/en and /id are enLabels and idLabels', packs.en.labels === enLabels && packs.id.labels === idLabels);

// Arguments for each function label: every case it has to word (a count of 1 and of several; each value of a union).
const reasons = ['valueMissing', 'typeMismatch', 'badInput', 'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'patternMismatch'];
const SAMPLES = {
  avatarStatus: ['online', 'busy', 'away', 'offline'].map((s) => [s]),
  avatarMore: [[1], [5]], slideOf: [[2, 5]], slidesOf: [[1, 3, 9]],
  colorName: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown', 'gray', 'black', 'white'].flatMap((h) => ['light', 'dark', ''].map((tone) => [h, tone])),
  contrast: [['4.5']], lowContrast: [['3']], resultsCount: [[0], [1], [5]], moreResults: [[1], [40]],
  clearValue: [['Size'], ['']], valueAdded: [['Red']], valueRemoved: [['Red']], inputNotAccepted: [['31/02']], formatHint: [['DD/MM/YYYY']],
  errorSummaryTitle: [[1], [3]],
  fileWrongType: [['a.exe', ['image']], ['a.exe', ['image', 'video', 'PDF']], ['a.exe', undefined]], fileTooLarge: [['a.png', '5 MB']],
  fileTooMany: [['a.png', 1], ['a.png', 3]], fileOnlyOne: [['a.png']], fileMissing: [[true], [false]], fileFolder: [['photos']], fileAlreadyAdded: [['a.png']],
  filesAdded: [[['a.png']], [['a.png', 'b.png']]], fileRemoved: [['a.png']],
  charactersLeft: [[0], [1], [5]],
  invalidValue: reasons.map((reason) => [{ reason, type: reason === 'typeMismatch' ? 'email' : 'text', length: 3, minLength: 5, maxLength: 2, min: '1', max: '9', step: '2', title: '' }]),
  keyName: [['Up arrow'], ['Space'], ['Enter']], showingOf: [[10, 50]], loadedMore: [[1], [10]], meterZone: [['92%', 'high'], ['10%', 'low'], ['50%', 'medium']],
  itemsOf: [[1, 1, 9], [1, 10, 90]], progressComplete: [['Upload'], ['']], ratingStars: [[1], [3.5], [5]], ratingValue: [[3, 5]],
  reorderGrabbed: [['Apples', 2, 5]], reorderMoved: [['Apples', 3, 5]], reorderDropped: [['Apples', 3, 5]], reorderCancelled: [['Apples', 2, 5]],
  stepOf: [[2, 4]], tableSorted: [['Amount', 'ascending'], ['Amount', 'descending']], tableSelected: [[1], [3]],
  commandsCount: [[0], [1], [5]], toastShortcut: [['F8']], moreToasts: [[2]], toastRepeated: [[3]], typePhraseFirst: [['delete']], page: [[3]],
};
// English's own invalidValue says nothing (the browser's message stays); a translation words each reason.
const SILENT_IN_ENGLISH = new Set(['invalidValue']);
// Words that are often the same in another language (a brand, an abbreviation, a loanword).
const SAME_OK = new Set(['menu', 'formatHint', 'hexCode', 'keyName', 'avatarStatus', 'carouselRole', 'slideRole', 'contrast', 'ratingValue', 'moreToasts', 'sliderMinimum']);

// …and in one language only: words that language shares with English.
const SAME_IN = {
  de: ['fieldOptional', 'optional', 'sliderMaximum', 'colorName'],
  es: ['generalShortcuts'],
  ms: ['edit'],
  nl: ['sliderMaximum'],
  sv: ['sliderMaximum', 'colorName'],
  fr: ['colorName', 'notificationCenter', 'notifications', 'pagination', 'sliderMaximum', 'image', 'page'],
};
const sameOk = (l, k) => SAME_OK.has(k) || (SAME_IN[l] || []).includes(k);

const fnNoSample = Object.keys(en).filter((k) => typeof en[k] === 'function' && !SAMPLES[k]);
t('every function label has samples here', !fnNoSample.length, fnNoSample.join(', '));
for (const [l, mod] of Object.entries(packs)) {
  const L = mod.labels;
  const missing = Object.keys(en).filter((k) => !(k in L)), extra = Object.keys(L).filter((k) => !(k in en));
  const kind = Object.keys(en).filter((k) => k in L && typeof L[k] !== typeof en[k]);
  const empty = [], same = [];
  for (const k of Object.keys(en)) {
    if (!(k in L) || typeof L[k] !== typeof en[k]) continue;
    if (typeof L[k] === 'string') {
      if (!L[k].trim()) empty.push(k);
      if (l !== 'en' && L[k] === en[k] && !sameOk(l, k)) same.push(k);
      continue;
    }
    for (const args of SAMPLES[k] || []) {
      let out;
      try { out = L[k](...args); } catch (e) { empty.push(`${k}(${JSON.stringify(args)}) throws ${e.message}`); continue; }
      if (typeof out !== 'string' || (!out.trim() && !(l === 'en' && SILENT_IN_ENGLISH.has(k)))) empty.push(`${k}(${JSON.stringify(args)})`);
      else if (l !== 'en' && out === en[k](...args) && !sameOk(l, k)) same.push(`${k}(${JSON.stringify(args)})`);
    }
  }
  t(`${l}: all ${Object.keys(en).length} words, each a text or a function as in English, under locale "${mod.locale}"`, !missing.length && !extra.length && !kind.length && typeof mod.locale === 'string' && new Intl.Locale(mod.locale).language === l.split('-')[0],
    `missing: ${missing.slice(0, 8).join(', ')}; not in English: ${extra.slice(0, 8).join(', ')}; another kind: ${kind.join(', ')}`);
  t(`${l}: every word and every sample says something`, !empty.length, empty.slice(0, 8).join('; '));
  if (l !== 'en') t(`${l}: nothing is left in English`, !same.length, same.slice(0, 10).join('; '));
}
done(report('Label packs', R));
