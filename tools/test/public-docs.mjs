// What an editor shows for the package: the types in dist/index.d.ts, read with the TypeScript checker as a
// project that imports the package would see them. Build first (npm run build).
// Every component's own props have a doc line on hover (a pass-through the component re-declares too, and the
// second of a pair that shares one comment), no prop tagged @internal reaches the public types, and every
// component has its …Props type exported next to it.
//   node tools/test/public-docs.mjs
import path from 'node:path';
// TypeScript 7 has no compiler API yet, so this reads the types with TypeScript 6's (see tools/typescript/api.mjs).
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const DTS = path.join(PROJECT, 'dist', 'index.d.ts');
const program = ts.createProgram([DTS], { strict: true, jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true, noEmit: true });
const checker = program.getTypeChecker();
const DIST = path.join(PROJECT, 'dist') + path.sep;
const mod = checker.getSymbolAtLocation(program.getSourceFile(DTS));
const exports = checker.getExportsOfModule(mod);
const names = new Set(exports.map((s) => s.name));

// A component: a capitalized value export that React can render (a function or forwardRef/memo object with a call
// or $$typeof), not a context, a hook or a helper object.
const isComponent = (s) => {
  const sym = s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
  if (!/^[A-Z]/.test(s.name) || !(sym.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) return false;
  const decl = sym.valueDeclaration;
  if (!decl) return false;
  const t = checker.getTypeOfSymbolAtLocation(sym, decl);
  const text = checker.typeToString(t);
  if (/Context<|Provider<|Consumer</.test(text)) return false;
  return t.getCallSignatures().some((sig) => {
    const r = checker.typeToString(sig.getReturnType());
    return /ReactNode|Element|ReactElement/.test(r);
  }) || /ForwardRefExoticComponent|MemoExoticComponent|NamedExoticComponent/.test(text);
};

const R = [];
const missingProps = [], undocumented = [], internal = [];
for (const s of exports) {
  if (!isComponent(s)) continue;
  if (!names.has(`${s.name}Props`)) { missingProps.push(s.name); continue; }
  const p = exports.find((e) => e.name === `${s.name}Props`);
  const sym = p.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(p) : p;
  const type = checker.getDeclaredTypeOfSymbol(sym);
  const props = type.isUnion() ? type.types.flatMap((t) => t.getProperties()) : type.getProperties();
  const seen = new Set();
  for (const prop of props) {
    if (seen.has(prop.name)) continue;
    seen.add(prop.name);
    const decls = (prop.declarations || []).filter((d) => d.getSourceFile().fileName.startsWith(DIST));
    if (!decls.length) continue;   // React's own DOM attributes keep React's docs
    const tags = prop.getJsDocTags(checker).map((t) => t.name);
    if (tags.includes('internal')) internal.push(`${s.name}.${prop.name}`);
    else if (!ts.displayPartsToString(prop.getDocumentationComment(checker)).trim() && !tags.includes('deprecated')) undocumented.push(`${s.name}.${prop.name}`);
  }
}
R.push({ name: 'every component has its …Props type exported', ok: !missingProps.length, detail: missingProps.join(', ') });
R.push({ name: 'every own prop of a component has a doc line on hover', ok: !undocumented.length, detail: undocumented.join(', ') });
R.push({ name: 'no prop tagged @internal is in the public types', ok: !internal.length, detail: internal.join(', ') });
done(report('Public docs', R));
