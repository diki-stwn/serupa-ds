import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { fold } from "../../internal/fold";

export interface HighlightProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The text to show. */
  children: string;
  /** What to mark in it: a search ("lod"), or several terms. Matched ignoring case, accents and width, as
      Combobox matches: "lodz" marks "Łódź". Empty: nothing is marked. */
  query: string | ReadonlyArray<string>;
  /** Marks every word of a query on its own ("new york" marks "New" and "York" wherever they are). Default: false,
      the query as one phrase. */
  words?: boolean;
}

/** Where query matches text, as [start, end) offsets into text (UTF-16), in order and not overlapping. Matched as
    fold() matches: case, accents and width ignored. */
export function highlightRanges(text: string, query: string | ReadonlyArray<string>, words?: boolean): Array<[number, number]> {
  const terms = (typeof query === "string" ? [query] : query).flatMap((q) => (words ? q.split(/\s+/) : [q.trim()])).map(fold).filter(Boolean);
  if (!terms.length || !text) return [];
  // The folded text, and for each folded character the offset of the original character it came from, so a match
  // in the folded text ("ss") maps back to the text people see ("ß").
  let folded = "";
  const from: number[] = [], to: number[] = [];
  for (let i = 0; i < text.length;) {
    const ch = String.fromCodePoint(text.codePointAt(i)!);
    const f = fold(ch);
    for (let k = 0; k < f.length; k++) { from.push(i); to.push(i + ch.length); }
    folded += f;
    i += ch.length;
  }
  const hits: Array<[number, number]> = [];
  for (const t of terms) {
    for (let at = folded.indexOf(t); at >= 0; at = folded.indexOf(t, at + t.length)) {
      let end = to[at + t.length - 1];
      // A combining accent after the last matched letter belongs to it: "e" + "́" is marked whole.
      while (end < text.length && /\p{M}/u.test(text[end])) end++;
      hits.push([from[at], end]);
    }
  }
  hits.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out: Array<[number, number]> = [];
  for (const h of hits) {
    const last = out[out.length - 1];
    if (last && h[0] <= last[1]) last[1] = Math.max(last[1], h[1]);
    else out.push([h[0], h[1]]);
  }
  return out;
}

/* Highlight: text with the parts that match a query in <mark>, for search results, Combobox options and a
   command palette. Matching ignores case, accents and width (internal/fold.ts), and maps back to the text as
   written, so "strasse" marks "Straße". The marks are <mark> (a highlight to assistive tech that announces it),
   in --highlight-* colors, and Mark/MarkText in forced-colors mode. className and other props go to the <span>. */
/** Text with the parts that match a search marked, ignoring case and accents. */
export const Highlight = /* @__PURE__ */ component<HTMLSpanElement, HighlightProps>("Highlight", function Highlight(props, ref) {
  const rest = omit(props, { children: 1, query: 1, words: 1, className: 1 } as const);
  const text = typeof props.children === "string" ? props.children : String(props.children ?? "");
  const ranges = highlightRanges(text, props.query ?? "", props.words);
  const parts: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([s, e], i) => {
    if (s > at) parts.push(text.slice(at, s));
    parts.push(<mark key={i} className="dk-highlight__mark">{text.slice(s, e)}</mark>);
    at = e;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <span {...rest} ref={ref} className={cn("dk-highlight", props.className)} data-component="highlight">{parts}</span>;
});
