// src/components/Highlight/Highlight.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { fold } from "../../internal/fold.js";
var UNIT = /.\p{M}*/suy;
function highlightRanges(text, query, words) {
  const terms = (typeof query === "string" ? [query] : query).flatMap((q) => words ? q.split(/\s+/) : [q.trim()]).map(fold).filter(Boolean);
  if (!terms.length || !text) return [];
  let folded = "";
  const from = [], to = [];
  for (let i = 0; i < text.length; ) {
    UNIT.lastIndex = i;
    const ch = UNIT.exec(text)[0];
    const f = fold(ch);
    for (let k = 0; k < f.length; k++) {
      from.push(i);
      to.push(i + ch.length);
    }
    folded += f;
    i += ch.length;
  }
  const hits = [];
  for (const t of terms) {
    for (let at = folded.indexOf(t); at >= 0; at = folded.indexOf(t, at + t.length)) {
      let end = to[at + t.length - 1];
      while (end < text.length && /\p{M}/u.test(text[end])) end++;
      hits.push([from[at], end]);
    }
  }
  hits.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out = [];
  for (const h of hits) {
    const last = out[out.length - 1];
    if (last && h[0] <= last[1]) last[1] = Math.max(last[1], h[1]);
    else out.push([h[0], h[1]]);
  }
  return out;
}
var Highlight = /* @__PURE__ */ component("Highlight", function Highlight2(props, ref) {
  const rest = omit(props, { children: 1, query: 1, words: 1, className: 1 });
  const text = typeof props.children === "string" ? props.children : String(props.children ?? "");
  const ranges = highlightRanges(text, props.query ?? "", props.words);
  const parts = [];
  let at = 0;
  ranges.forEach(([s, e], i) => {
    if (s > at) parts.push(text.slice(at, s));
    parts.push(/* @__PURE__ */ React.createElement("mark", { key: i, className: "dk-highlight__mark" }, text.slice(s, e)));
    at = e;
  });
  if (at < text.length) parts.push(text.slice(at));
  return /* @__PURE__ */ React.createElement("span", { ...rest, ref, className: cn("dk-highlight", props.className), "data-component": "highlight" }, parts);
});
export {
  Highlight,
  highlightRanges
};
//# sourceMappingURL=Highlight.js.map
