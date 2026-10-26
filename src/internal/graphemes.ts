// Characters as people see them: 👨‍👩‍👧 (five code points joined), 🇮🇩 (two) and é written as e + ◌́ are each one.
// String length counts UTF-16 code units instead ("👨‍👩‍👧🇮🇩".length is 12). Where Intl.Segmenter is missing (Firefox
// before 125), code points are the closest stand-in.

// module state: one locale-free segmenter, made on first use.
let seg: Intl.Segmenter | null | undefined;
const segmenter = () => (seg === undefined ? (seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null) : seg);

/** The text split into the characters people see. */
export function graphemes(text: string): string[] {
  const s = segmenter();
  return s ? Array.from(s.segment(text), (x) => x.segment) : Array.from(text);
}

/** How many characters people see in the text. */
export function graphemeCount(text: string): number {
  const s = segmenter();
  if (!s) return Array.from(text).length;
  let n = 0;
  for (const _ of s.segment(text)) n++;
  return n;
}

/**
 * The edit from `before` to `after` with what was typed or pasted cut so the text has at most `max` characters, the
 * way the browser's maxlength cuts it: the text around the edit stays, and only the new part is shortened. Returns the
 * text and where the caret goes (a code-unit offset), or null when `after` already fits or the edit made it shorter.
 */
export function limitEdit(before: string, after: string, max: number): { value: string; caret: number } | null {
  const total = graphemeCount(after);
  if (total <= max || total <= graphemeCount(before)) return null;
  // The unchanged start and end, in whole characters, so an edit next to an emoji doesn't split it.
  const a = graphemes(before), b = graphemes(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  const head = b.slice(0, start), added = b.slice(start, b.length - end), tail = b.slice(b.length - end);
  const keep = Math.max(0, max - head.length - tail.length);
  const kept = head.join("") + added.slice(0, keep).join("");
  return { value: kept + tail.join(""), caret: kept.length };
}
