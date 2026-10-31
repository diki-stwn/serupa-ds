// Editor autocomplete (136): dist/vscode/ holds VS Code custom data for every utility class and token, in the format
// VS Code reads (html.customData, css.customData), in step with the build.
//   node tools/test/editor-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { HERE, PROJECT, tokensCss, report, done } from './lib.mjs';
import { tokenList } from '../build/editor-data.mjs';
import { tokenDescriptions } from '../tokens/build.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const load = (f) => { try { return JSON.parse(fs.readFileSync(path.join(PROJECT, 'dist', 'vscode', f), 'utf8')); } catch { return null; } };
const html = load('serupa.html-data.json'), css = load('serupa.css-data.json');
t('dist/vscode/ has serupa.html-data.json and serupa.css-data.json, as custom data version 1.1 (npm run build)', html?.version === 1.1 && css?.version === 1.1);
const attr = (n) => html?.globalAttributes?.find((a) => a.name === n)?.values?.map((v) => v.name) || [];
const classes = attr('class');
const known = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'baseline-utilities.json'), 'utf8')));
const missing = known.filter((c) => !classes.includes(c)), extra = classes.filter((c) => !known.includes(c));
t(`class offers every utility class, responsive variants too (${classes.length}), and nothing else`, classes.length && !missing.length && !extra.length, `missing: ${missing.slice(0, 10).join(', ')}; not utility classes: ${extra.slice(0, 10).join(', ')}`);
const bare = html?.globalAttributes?.find((a) => a.name === 'class')?.values?.filter((v) => !v.description) || [];
t('each class says what it sets', !bare.length, bare.slice(0, 10).map((v) => v.name).join(', '));
const { themes } = tokensCss();
t('data-theme offers the six themes', attr('data-theme').join() === [...themes].sort().join(), attr('data-theme').join());
t('data-brand and data-mode offer what theme.js reads', attr('data-brand').join() === 'blue,emerald,violet' && attr('data-mode').join() === 'auto,dark,light', JSON.stringify([attr('data-brand'), attr('data-mode')]));
const tokens = tokenList(fs.readFileSync(path.join(PROJECT, 'tokens.css'), 'utf8')).map((x) => x.name);
const props = css?.properties?.map((p) => p.name) || [];
t(`the CSS data offers every token (${tokens.length}), with what it is and its value`, tokens.length > 250 && tokens.join() === props.join() && css.properties.every((p) => /in blue-light/.test(p.description?.value || '')), `missing: ${tokens.filter((x) => !props.includes(x)).slice(0, 10).join(', ')}`);
const described = tokenDescriptions(JSON.parse(fs.readFileSync(path.join(PROJECT, 'tokens.json'), 'utf8')));
const lost = (css?.properties || []).filter((p) => described.has(p.name) && !(p.description?.value || '').startsWith(described.get(p.name).replace(/^Alias\. /, ''))).map((p) => p.name);
t('each token carries its description from tokens.json (tokens.css has no comments)', described.size > 250 && !lost.length, lost.slice(0, 10).join(', '));
const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8'));
t('package.json exports them as serupa-ds/vscode/*', pkg.exports['./vscode/*'] === './dist/vscode/*');
done(report('Editor data', R));
