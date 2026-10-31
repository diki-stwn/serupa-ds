// Grades what a coding agent wrote for the skill eval's tasks (tools/skill-eval/tasks.json), one TSX file per task, on
// the things the Serupa skill (skills/serupa/SKILL.md) tells an agent to do. Each check passes or fails per answer:
//   parses       the answer is TSX that parses
//   serupa       it imports from "serupa-ds"
//   components   it uses the task's expected components (an "A|B" entry takes either)
//   no-rebuilds  no native <button>, <input>, <select>, <textarea>, <table> or <dialog> where Serupa has one
//   tokens       no raw colors (#hex, rgb(), hsl()), pixel sizes or durations, in style props, CSS strings or classes
//   names        every form control sits in a Field or has its own name, every IconButton has a label, every
//                picture has alt
//   no-div-click no onClick on an element that isn't interactive (div, span, li, tr, td, p, img, section)
// It reads code only: it can't tell whether the page works. tools/test/skill-eval.mjs checks the grader itself.
//   node tools/skill-eval/grade.mjs <dir with sign-in.tsx, settings-table.tsx, …>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '@typescript/typescript6';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TASKS = JSON.parse(fs.readFileSync(path.join(HERE, 'tasks.json'), 'utf8'));
export const CHECKS = ['parses', 'serupa', 'components', 'no-rebuilds', 'tokens', 'names', 'no-div-click'];

const REBUILT = { button: 'Button', input: 'Input', select: 'Select', textarea: 'Textarea', table: 'Table', dialog: 'Dialog' };
const FIELD_CONTROLS = new Set(['Input', 'PasswordInput', 'Textarea', 'Select', 'NumberInput', 'SearchInput', 'Combobox', 'DatePicker', 'DateRangePicker', 'TimePicker', 'PhoneInput', 'PinInput', 'Slider', 'ColorPicker']);
const SELF_LABELLED = new Set(['Checkbox', 'Switch', 'Radio']);   // a label prop or children
const STILL = new Set(['div', 'span', 'li', 'tr', 'td', 'p', 'img', 'section']);
// Style properties whose bare numbers are not lengths.
const UNITLESS = new Set(['opacity', 'flex', 'flexGrow', 'flexShrink', 'zIndex', 'lineHeight', 'fontWeight', 'order', 'gridColumn', 'gridRow', 'aspectRatio']);
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/i;
const RAW_LENGTH = /(?<![\w-])-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em)\b|\[\d+(?:px|rem)\]/;
const RAW_TIME = /(?<![\w-])(?:\d+(?:\.\d+)?|\.\d+)m?s\b/;

/** One answer's results: { check: { ok, why } }. `expect` is the task's component list. */
export function grade(source, expect = []) {
  const out = Object.fromEntries(CHECKS.map((c) => [c, { ok: true, why: '' }]));
  const fail = (c, why) => { if (out[c].ok) out[c] = { ok: false, why }; };
  const file = ts.createSourceFile('answer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // Syntax errors: createSourceFile keeps them on the file (not in its public type).
  const syntax = /** @type {{ parseDiagnostics?: import('@typescript/typescript6').Diagnostic[] }} */ (/** @type {unknown} */ (file)).parseDiagnostics ?? [];
  if (syntax.length) {
    for (const c of CHECKS) out[c] = { ok: false, why: c === 'parses' ? ts.flattenDiagnosticMessageText(syntax[0].messageText, ' ') : 'did not parse' };
    return out;
  }
  const imported = new Set();
  for (const s of file.statements) {
    if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === 'serupa-ds') {
      const b = s.importClause?.namedBindings;
      if (b && ts.isNamedImports(b)) for (const e of b.elements) imported.add((e.propertyName ?? e.name).text);
    }
  }
  if (!imported.size) fail('serupa', 'nothing imported from "serupa-ds"');
  const missing = expect.filter((alts) => !alts.split('|').some((a) => imported.has(a)));
  if (missing.length) fail('components', 'missing ' + missing.join(', '));

  const tagOf = (n) => n.tagName.getText(file);
  const attrs = (n) => new Map(n.attributes.properties.filter(ts.isJsxAttribute).map((a) => [a.name.getText(file), a]));
  const opening = (n) => ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null;
  const hasChildren = (n) => ts.isJsxElement(n) && n.children.some((c) => !ts.isJsxText(c) || c.text.trim());
  const inField = (n) => { for (let p = n.parent; p; p = p.parent) { const o = opening(p); if (o && o !== n && tagOf(o) === 'Field') return true; } return false; };

  const styleValue = (prop) => {
    const name = prop.name?.getText(file).replace(/['"]/g, '');
    const v = prop.initializer;
    if (!v) return;
    if (ts.isNumericLiteral(v) && Number(v.text) !== 0 && !UNITLESS.has(name)) fail('tokens', `style ${name}: ${v.text}`);
    if (ts.isStringLiteral(v) && /transition|animation|duration|delay/i.test(name) && RAW_TIME.test(v.text)) fail('tokens', `style ${name}: ${RAW_TIME.exec(v.text)[0]}`);
  };
  const text = (s, where) => {
    if (RAW_COLOR.test(s)) fail('tokens', `${where}: ${RAW_COLOR.exec(s)[0]}`);
    else if (RAW_LENGTH.test(s)) fail('tokens', `${where}: ${RAW_LENGTH.exec(s)[0]}`);
    else if (RAW_TIME.test(s) && /transition|animation|duration|delay/i.test(s)) fail('tokens', `${where}: ${RAW_TIME.exec(s)[0]}`);
  };

  const visit = (n) => {
    const o = opening(n);
    if (o) {
      const tag = tagOf(o), a = attrs(o);
      if (REBUILT[tag] && !(tag === 'input' && /["']hidden["']/.test(a.get('type')?.initializer?.getText(file) ?? ''))) fail('no-rebuilds', `<${tag}> where Serupa has ${REBUILT[tag]}`);
      if (STILL.has(tag) && a.has('onClick')) fail('no-div-click', `onClick on <${tag}>`);
      const named = a.has('aria-label') || a.has('aria-labelledby');
      if (FIELD_CONTROLS.has(tag) && !named && !inField(n)) fail('names', `${tag} outside a Field, with no aria-label`);
      if (SELF_LABELLED.has(tag) && !named && !a.has('label') && !hasChildren(n) && !inField(n)) fail('names', `${tag} with no label`);
      if (tag === 'IconButton' && !a.has('label')) fail('names', 'IconButton with no label');
      if ((tag === 'img' || tag === 'Image') && !a.has('alt')) fail('names', `<${tag}> with no alt`);
      const style = a.get('style')?.initializer;
      if (style && ts.isJsxExpression(style) && style.expression && ts.isObjectLiteralExpression(style.expression)) {
        for (const p of style.expression.properties) if (ts.isPropertyAssignment(p)) styleValue(p);
      }
    }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      if (!(ts.isImportDeclaration(n.parent) || ts.isExternalModuleReference(n.parent))) text(n.text, 'text "' + n.text.slice(0, 40) + '"');
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return out;
}

/** Every task's answer in `dir` (<id>.tsx), graded; a missing answer fails every check. */
export function gradeDir(dir) {
  return TASKS.map((t) => {
    const f = path.join(dir, t.id + '.tsx');
    const r = fs.existsSync(f) ? grade(fs.readFileSync(f, 'utf8'), t.expect) : Object.fromEntries(CHECKS.map((c) => [c, { ok: false, why: 'no answer' }]));
    return { id: t.id, results: r, passed: CHECKS.filter((c) => r[c].ok).length };
  });
}

/** A Markdown table of one run: a row per task, a column per check, and the score. */
export function table(rows) {
  const head = `| Task | ${CHECKS.join(' | ')} | Score |\n|---|${CHECKS.map(() => '---').join('|')}|---|\n`;
  const body = rows.map((r) => `| ${r.id} | ${CHECKS.map((c) => r.results[c].ok ? '✓' : '✗ ' + r.results[c].why.replace(/[\\|]/g, '\\$&')).join(' | ')} | ${r.passed}/${CHECKS.length} |`).join('\n');
  const total = rows.reduce((s, r) => s + r.passed, 0);
  return head + body + `\n\n**${total} of ${rows.length * CHECKS.length} checks passed.**\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node tools/skill-eval/grade.mjs <answers dir>'); process.exit(2); }
  process.stdout.write(table(gradeDir(path.resolve(dir))));
}
