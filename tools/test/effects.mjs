// Effects that run after every render (R3): an effect with no dependency list runs after each render of its
// component, which includes every re-render of a parent, and a layout effect that measures forces a layout each
// time. Some are meant (a ref kept up to date, a property React doesn't set, focus put back), so each one says why
// in a comment starting "every render:" on its line or the line above. A new one without it fails: give it a
// dependency list, or say why it can't have one.
//   node tools/test/effects.mjs
import fs from 'node:fs';
import path from 'node:path';
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const EFFECT = /^(?:React\.)?use(?:Layout|Insertion|IsoLayout)?Effect$/;
const files = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map((f) => String(f).split(path.sep).join('/'))
  .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f));
const R = [];
let effects = 0, every = 0;
for (const f of files) {
  const text = fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8'), lines = text.split('\n');
  const file = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n) => {
    if (ts.isCallExpression(n) && EFFECT.test(n.expression.getText(file))) {
      effects++;
      if (n.arguments.length < 2) {
        every++;
        const line = file.getLineAndCharacterOfPosition(n.getStart(file)).line;
        const said = /every render:/.test(lines[line]) || /^\s*(\/\/|\/\*|\*).*every render:/.test(lines[line - 1] || '');
        R.push({ name: `src/${f}:${line + 1}: ${n.expression.getText(file)} with no dependency list says why it runs after every render`, ok: said,
          detail: 'give it a dependency list, or add a comment starting "every render:" on its line or the line above saying why it needs to run each time' });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
}
R.unshift({ name: `the effects were read (${effects}, ${every} with no dependency list)`, ok: effects > 50, detail: `${effects} effects in ${files.length} files` });
done(report('Effects', R));
