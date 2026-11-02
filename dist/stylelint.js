// serupa-ds/stylelint: a Stylelint config for an app's own CSS, so it reads Serupa's tokens instead of writing raw
// values that drift from the theme (a hex color that ignores dark mode, a 12px gap off the spacing scale).
//   // stylelint.config.js
//   export default { extends: ["serupa-ds/stylelint"] };
// Three rules, each with the token family to use in its message:
//   serupa/no-raw-color     a color written out (#hex, rgb(), hsl(), oklch(), a named color) instead of a color token.
//                           A named color counts only in a property that takes a color, so grid-area: tan passes.
//   serupa/no-raw-spacing   a fixed length in margin, padding, gap or inset instead of a spacing token. A percentage
//                           or a viewport or container unit (inset: 50%, 1vw) passes: no token says that
//   serupa/no-raw-radius    a length in border-radius instead of a rounded token
// A value inside var() is never flagged, its fallback included, and calc() over tokens passes. Turn one off, or
// write `/* stylelint-disable-next-line serupa/no-raw-color -- why */` above a line that needs a raw value.
import stylelint from "stylelint";

const { report, ruleMessages, validateOptions } = stylelint.utils;

// The CSS named colors (CSS Color 4). transparent, currentcolor and the system colors (Canvas, CanvasText …) are not
// in it: they follow the page and forced-colors mode, which a token can't.
const NAMED = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue " +
  "chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
  "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise " +
  "darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod " +
  "gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral " +
  "lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
  "lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
  "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
  "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
  "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow " +
  "springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "));
const COLOR_FUNCTIONS = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)$/i;
const LENGTH = /^-?(?:\d*\.)?\d+(?:px|r?em|r?lh|r?cap|r?ex|r?ch|r?ic|vw|vh|vi|vb|vmin|vmax|[sdl]v[whib]|svmin|svmax|dvmin|dvmax|lvmin|lvmax|cq[whib]|cqmin|cqmax|cm|mm|q|in|pt|pc|%)$/i;
const SPACING = /^(?:margin|padding|scroll-margin|scroll-padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?$|^(?:gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$|^inset(?:-(?:block|inline)(?:-(?:start|end))?)?$/i;
// The properties a named color can mean a color in; anywhere else (grid-area, animation-name, font-family) it is a name.
const COLOR_PROPS = /^(?:-[a-z]+-)?(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|border-color|border-image(?:-source)?|outline(?:-color)?|fill|stroke|(?:box|text)-shadow|caret-color|accent-color|text-stroke(?:-color)?|text-decoration(?:-color)?|text-emphasis(?:-color)?|column-rule(?:-color)?|scrollbar-color|filter|stop-color|flood-color|lighting-color)$/i;
// A length that scales with its container or the viewport, which the spacing scale has no token for.
const RELATIVE = /(?:%|v[whib]|vmin|vmax|[sdl]v[whib]|[sdl]vmin|[sdl]vmax|cq[whib]|cqmin|cqmax)$/i;
const RADIUS = /^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/i;

// The value's words and function names outside every var(), with the strings and url()s left out.
function* outsideVar(value) {
  let depth = 0, inVar = -1, word = "";
  const flush = function* () { if (word) yield { word, fn: false }; word = ""; };
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '"' || c === "'") { yield* flush(); const end = value.indexOf(c, i + 1); i = end < 0 ? value.length : end; continue; }
    if (c === "(") {
      const name = word.toLowerCase(); word = "";
      if (inVar < 0 && (name === "var" || name === "url" || name === "env")) inVar = depth;
      else if (inVar < 0 && name) yield { word: name, fn: true };
      depth++;
      continue;
    }
    if (c === ")") { yield* flush(); depth--; if (inVar === depth) inVar = -1; continue; }
    if (/[\s,/*+]/.test(c)) { if (inVar < 0) yield* flush(); else word = ""; continue; }
    if (inVar < 0) word += c;
  }
  if (inVar < 0) yield* flush();
}

function rule(name, messages, check) {
  const messagesFor = ruleMessages(name, messages);
  const fn = (primary) => (root, result) => {
    if (!validateOptions(result, name, { actual: primary, possible: [true] })) return;
    root.walkDecls((decl) => {
      if (decl.prop.startsWith("--")) return;   // a custom property is where an app defines its own tokens
      for (const word of check(decl)) report({ result, ruleName: name, message: messagesFor.rejected(word, decl.prop), node: decl, word });
    });
  };
  fn.ruleName = name;
  fn.messages = messagesFor;
  return { ruleName: name, rule: fn };
}

const color = rule("serupa/no-raw-color", {
  rejected: (v, p) => `${v} in ${p} is a color written out: use a color token, such as var(--text), var(--surface) or var(--primary), so it follows the theme and dark mode`,
}, function* (decl) {
  const named = COLOR_PROPS.test(decl.prop);
  for (const { word, fn } of outsideVar(decl.value)) {
    if (fn ? COLOR_FUNCTIONS.test(word) : /^#[\da-f]{3,8}$/i.test(word) || (named && NAMED.has(word.toLowerCase()))) yield fn ? `${word}()` : word;
  }
});

const lengths = (props, relativePasses) => function* (decl) {
  if (!props.test(decl.prop)) return;
  for (const { word, fn } of outsideVar(decl.value)) {
    if (!fn && LENGTH.test(word) && !/^-?0+(?:\.0+)?[a-z%]*$/i.test(word) && !(relativePasses && RELATIVE.test(word))) yield word;
  }
};

const spacing = rule("serupa/no-raw-spacing", {
  rejected: (v, p) => `${v} in ${p} is off the spacing scale: use a spacing token, such as var(--spacing-4)`,
}, lengths(SPACING, true));

const radius = rule("serupa/no-raw-radius", {
  rejected: (v, p) => `${v} in ${p} is a radius written out: use a rounded token, such as var(--rounded-md) or var(--rounded-full)`,
}, lengths(RADIUS, false));

/** @type {import("stylelint").Config} */
const config = {
  plugins: [color, spacing, radius],
  rules: { "serupa/no-raw-color": true, "serupa/no-raw-spacing": true, "serupa/no-raw-radius": true },
};
export default config;
