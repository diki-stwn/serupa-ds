// Module-level state (L1): a server renders every request with the same modules, so a `let`, a Map or Set, or an empty
// object or array at the top of a module is shared by all of them. Most are meant (a cache keyed by locale, the page's
// one clock, a queue only the browser fills), so each one says why that's safe in a comment starting "module state:"
// on its line or just above it (one comment covers the declarations right under it, up to a blank line or other
// code). A new one without it fails: move the state into a component or a context, or say why
// one request can't see another's.
//   node tools/test/module-state.mjs
import fs from 'node:fs';
import path from 'node:path';
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const COLLECTION = /^(Map|Set|WeakMap|WeakSet|Array)$/;
const files = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map((f) => String(f).split(path.sep).join('/'))
  .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) && !f.endsWith('.d.ts'));
// What makes a top-level declaration state: a let or var, a new collection, or an empty {} or [] to fill later.
function mutable(list, d) {
  if (!(list.flags & ts.NodeFlags.Const)) return 'a let';
  let init = d.initializer;
  while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
  if (!init) return null;
  if (ts.isNewExpression(init) && ts.isIdentifier(init.expression) && COLLECTION.test(init.expression.text)) return 'a ' + init.expression.text;
  if (ts.isObjectLiteralExpression(init) && !init.properties.length) return 'an empty object';
  if (ts.isArrayLiteralExpression(init) && !init.elements.length) return 'an empty array';
  return null;
}
const R = [];
let decls = 0, state = 0;
for (const f of files) {
  const text = fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8'), lines = text.split('\n');
  const file = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const line = (n) => file.getLineAndCharacterOfPosition(n.getStart(file)).line;
  const says = (s) => /module state:/.test(lines[line(s)]) || /module state:/.test(text.slice(s.getFullStart(), s.getStart(file)));
  // Said for s, or for a declaration in the unbroken run of declarations above it.
  const covered = (k) => {
    for (let j = k; j >= 0; j--) {
      const s = file.statements[j];
      if (says(s)) return true;
      const above = file.statements[j - 1];
      if (!above || !ts.isVariableStatement(above) || file.getLineAndCharacterOfPosition(above.getEnd()).line !== line(s) - 1) return false;
    }
    return false;
  };
  for (const [k, s] of file.statements.entries()) {
    if (!ts.isVariableStatement(s)) continue;
    for (const d of s.declarationList.declarations) {
      decls++;
      const kind = mutable(s.declarationList, d);
      if (!kind) continue;
      state++;
      R.push({ name: `src/${f}:${line(s) + 1}: ${d.name.getText(file)} (${kind} at the top of the module) says why every request can share it`, ok: covered(k),
        detail: 'move it into a component or a context, or add a comment starting "module state:" on its line or just above it saying why one server request can\'t see another\'s' });
    }
  }
}
R.unshift({ name: `the modules were read (${decls} top-level declarations, ${state} of them state)`, ok: decls > 200 && state > 10, detail: `${decls} declarations in ${files.length} files` });
done(report('Module state', R));
