// The system's own CSS conventions as Stylelint rules, so the editor shows them while a component's CSS is written,
// not only the checks after a build. stylelint.config.mjs turns them on for src/components/; tools/test/stylelint-rules.mjs
// checks each one against CSS that should pass and CSS that shouldn't.
//   serupa/component-layer          every rule in the file is inside one @layer dk.components { … }
//   serupa/no-raw-value             values come from tokens: no number outside a var() but 0, 1em and fr shares
//   serupa/color-through-component-token
//                                   a shared color (an alias like --text, or a palette step like --blue-600) is read only
//                                   as a component token's default, var(--card-text, var(--text)), so every color can be
//                                   overridden per component. Option allowPalette: palette steps are fine (Badge's tones)
//   serupa/focus-ring-outline       a focus ring is an outline (focus-ring-width, focus-ring-offset), not a box-shadow
//                                   ring, whose gap paints in one color and shows as a band on a tinted background.
//                                   Inset rings, for elements a scrolling container would clip (Tabs), are allowed
//   serupa/no-physical-shorthand    a box shorthand (padding, margin, inset, scroll-margin/padding, border-width/
//                                   color/style) whose right and left values differ, or a border-radius whose corners
//                                   differ left to right, is physical: it stays put in right-to-left text. Use the
//                                   -block / -inline longhands (padding-block, padding-inline-start) instead
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import valueParser from 'postcss-value-parser';

const { createPlugin, utils: { report, ruleMessages, validateOptions } } = stylelint;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// The shared colors (tokens.json) and the component tokens (each folder's <name>.tokens.json), read once.
const colors = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8')).color.tokens;
const ALIASES = new Set(colors.filter((x) => x.value && typeof x.value === 'object' && Object.keys(x.value).length > 1).map((x) => x.name));
const PALETTE = new Set(colors.filter((x) => !ALIASES.has(x.name)).map((x) => x.name));
const COMPONENT_TOKENS = new Set();
const components = path.join(ROOT, 'src', 'components');
for (const c of fs.readdirSync(components)) {
  for (const f of fs.readdirSync(path.join(components, c)).filter((f) => f.endsWith('.tokens.json'))) {
    const walk = (tree) => {
      for (const [k, v] of Object.entries(tree)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue;
        if ('$value' in v) COMPONENT_TOKENS.add(v.$extensions['com.serupa'].cssVar.slice(2));
        else walk(v);
      }
    };
    walk(JSON.parse(fs.readFileSync(path.join(components, c, f), 'utf8')));
  }
}

const rule = (name, messages, check) => {
  const fn = (primary, secondary) => (root, result) => {
    if (!validateOptions(result, name, { actual: primary, possible: [true] })) return;
    check(root, (node, message, word) => report({ result, ruleName: name, message, node, word }), fn.messages, secondary || {});
  };
  fn.ruleName = name;
  fn.messages = ruleMessages(name, messages);
  return createPlugin(name, fn);
};

const layer = rule('serupa/component-layer', {
  outside: 'Put every rule in the one @layer dk.components { … } block, so a page\'s own CSS outside a layer wins over it',
  name: (n) => `A component's CSS goes in @layer dk.components, not @layer ${n}`,
  second: 'One @layer dk.components block per file: join this one to the first',
}, (root, flag, m) => {
  let seen = false;
  root.each((node) => {
    if (node.type === 'comment') return;
    if (node.type === 'atrule' && node.name === 'layer' && node.nodes) {
      if (node.params !== 'dk.components') flag(node, m.name(node.params));
      else if (seen) flag(node, m.second);
      seen = true;
      return;
    }
    flag(node, m.outside);
  });
});

// A number with or without a unit, as tools/test/foundation.mjs counts them in the built CSS.
const NUMBER = /^-?\d*\.?\d+(?:[a-z]+|%)?$/i;
// 0 = none or off; 1em = an icon box that follows its own font size; and any share of a grid's free space (1fr).
const ALLOWED = new Set(['0', '1em']);
const raw = rule('serupa/no-raw-value', {
  rejected: (v, d) => `${v} in "${d}" isn't a token: use a var() (a spacing, sizing, border-width, radius, motion … token), or say why in a stylelint-disable comment`,
}, (root, flag, m) => {
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--dk')) return;   // internal variables carry computed values between rules
    valueParser(decl.value).walk((n) => {
      if (n.type === 'function' && n.value === 'var') return false;   // a token, with its default
      if (n.type === 'word' && NUMBER.test(n.value) && !ALLOWED.has(n.value) && !n.value.endsWith('fr')) flag(decl, m.rejected(n.value, `${decl.prop}: ${decl.value.slice(0, 60)}`), n.value);
    });
  });
});

const color = rule('serupa/color-through-component-token', {
  rejected: (n) => `var(--${n}) is a shared color: read it through a component token, var(--<component>-<part>, var(--${n})), so it can be overridden per component`,
}, (root, flag, m, { allowPalette }) => {
  root.walkDecls((decl) => {
    valueParser(decl.value).walk((n) => {
      if (n.type !== 'function' || n.value !== 'var') return;
      const name = (n.nodes[0]?.value || '').replace(/^--/, '').replace(/\\/g, '');
      if (COMPONENT_TOKENS.has(name)) return false;   // its default is where the shared color belongs
      if (ALIASES.has(name) || (PALETTE.has(name) && !allowPalette)) flag(decl, m.rejected(name), `--${name}`);
    });
  });
});

const focus = rule('serupa/focus-ring-outline', {
  rejected: 'A focus ring is an outline (outline-width: var(--focus-ring-width), outline-offset: var(--focus-ring-offset)), not a box-shadow ring',
}, (root, flag, m) => {
  root.walkRules((r) => {
    if (!/:focus(?:-visible)?(?![\w-])/.test(r.selector) || /:focus-within/.test(r.selector)) return;
    r.walkDecls('box-shadow', (decl) => {
      if (/ring/.test(decl.value) && !/^\s*inset/.test(decl.value)) flag(decl, m.rejected, 'box-shadow');
    });
  });
});

// The box shorthands, top right bottom left, and border-radius, top-left top-right bottom-right bottom-left.
const BOX = /^(padding|margin|inset|scroll-(margin|padding)|border-(width|color|style))$/;
const physical = rule('serupa/no-physical-shorthand', {
  box: (p) => `${p} sets different right and left values, which don't swap in right-to-left text; use ${p.replace(/^(border)-(\w+)$/, '$1-inline-$2').replace(/^(?!border)(.*)$/, '$1-inline')} (and -block) instead`,
  radius: 'border-radius sets different corners on the left and right, which don\'t swap in right-to-left text; use border-start-start-radius and the other logical corners',
}, (root, flag, m) => {
  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    if (!BOX.test(prop) && prop !== 'border-radius') return;
    // The values around a "/" (border-radius's vertical radii) are compared on their own.
    const groups = [[]];
    for (const n of valueParser(decl.value).nodes) {
      if (n.type === 'div' && n.value === '/') groups.push([]);
      else if (n.type !== 'space' && n.type !== 'comment') groups.at(-1).push(valueParser.stringify(n));
    }
    if (BOX.test(prop)) {
      const v = groups[0];
      if (v.length === 4 && v[1] !== v[3]) flag(decl, m.box(prop), decl.value);
    } else if (groups.some((v) => (v.length === 2 && v[0] !== v[1]) || (v.length === 3 && v[0] !== v[1]) || (v.length === 4 && (v[0] !== v[1] || v[2] !== v[3])))) {
      flag(decl, m.radius, decl.value);
    }
  });
});

export default [layer, raw, color, focus, physical];
