// utilities-extra.css (V4): the utility families few pages use, which ship in their own file instead of utilities.css
// and bundle.css. Masks (mask-*) and gradients (bg-linear-*, bg-radial*, bg-conic*, and the from-, via- and to-
// stops they read) are a quarter of the rules: a page that wants them imports serupa-ds/utilities-extra.css after
// bundle.css or utilities.css. Storybook and the tests load both, so the template keeps them where they belong.
//   split(css) → { core, extra }, each a stylesheet in the same order, with the same @layer, @media and @supports
//   blocks around its rules; the @property rules for --dk-mask-* and --dk-gradient-* go with the extras.

/** The classes that ship in utilities-extra.css, without a responsive prefix (md:from-primary is from-primary), negative
 *  ones (-mask-linear-45) included. */
export const EXTRA = /^-?(?:mask-|bg-(?:linear|radial|conic)\b|(?:from|via|to)-)/;
/** The internal variables only those classes set or read. */
export const EXTRA_VARS = /^--dk-(?:mask|gradient)-/;

const unescape = (c) => c.replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
// The classes a selector names, and the class prefixes it matches ([class^="from-"], [class*=" mask-t-"]).
const classesIn = (sel) => [
  ...[...sel.matchAll(/\.((?:[A-Za-z0-9_-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g)].map((m) => unescape(m[1]).replace(/^(?:[a-z0-9-]+:)+/, '')),
  ...[...sel.matchAll(/\[class[\^*]="\s?([^"]+)"\]/g)].map((m) => m[1]),
];

// Top-level items of a stylesheet (comments already gone): { pre, body } for a block, { pre } for a statement.
function items(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    let j = i, depth = 0, q = null, brace = -1;
    for (; j < s.length; j++) {
      const ch = s[j];
      if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") q = ch;
      else if (ch === '{') { if (depth === 0) brace = j; depth++; }
      else if (ch === '}') { if (--depth === 0) { j++; break; } }
      else if (ch === ';' && depth === 0) { j++; break; }
    }
    out.push(brace < 0 || brace > j ? { pre: s.slice(i, j).trim() } : { pre: s.slice(i, brace).trim(), body: s.slice(brace + 1, j - 1) });
    i = j;
  }
  return out;
}

export function split(css) {
  const walk = (s) => {
    const core = [], extra = [];
    for (const { pre, body } of items(s)) {
      if (body === undefined) { core.push(pre); continue; }
      if (/^@(layer|media|supports|container)\b/.test(pre)) {
        const inner = walk(body);
        if (inner.core.trim()) core.push(`${pre} {\n${inner.core}\n}`);
        if (inner.extra.trim()) extra.push(`${pre} {\n${inner.extra}\n}`);
        continue;
      }
      if (pre.startsWith('@property')) { (EXTRA_VARS.test(pre.split(/\s+/)[1]) ? extra : core).push(`${pre} {${body}}`); continue; }
      if (pre.startsWith('@')) { core.push(`${pre} {${body}}`); continue; }   // @keyframes
      const kinds = new Set(classesIn(pre).map((c) => EXTRA.test(c)));
      if (kinds.size > 1) throw new Error(`utilities-extra: a rule mixes extra and core classes: ${pre}`);
      (kinds.has(true) ? extra : core).push(`${pre} {${body}}`);
    }
    return { core: core.join('\n'), extra: extra.join('\n') };
  };
  return walk(css.replace(/\/\*(?!!)[\s\S]*?\*\//g, ''));
}
