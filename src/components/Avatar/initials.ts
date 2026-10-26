// In its own module, without "use client", so a Server Component can call it (a function from a client module is
// only a reference there). Avatar.tsx re-exports it.

// module state: one locale-free segmenter, made on first use.
let segmenter: { segment(s: string): Iterable<{ segment: string }> } | null | undefined;
/** The characters a person sees: "👩🏽" or "é" written as e and an accent are one, where Intl.Segmenter exists. */
function graphemes(s: string): string[] {
  if (segmenter === undefined) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  return segmenter ? Array.from(segmenter.segment(s), (g) => g.segment) : Array.from(s);
}
const INITIAL = /^[\p{L}\p{N}\p{Extended_Pictographic}]/u;
/** A word's initial: its first letter, digit or pictograph (a quote or bracket is skipped), upper-cased and cut to one
    character ("ß" is "S", not "SS"). */
function initial(word: string): string {
  const g = graphemes(word).find((c) => INITIAL.test(c));
  return g ? graphemes(g.toUpperCase())[0] : "";
}

/** The initials of a name: the first letters of the first and last words ("Ada Lovelace" → "AL"), or one letter.
    Words with no letter, digit or pictograph ("—") are left out. */
export function initials(name?: string): string {
  const found = (name || "").trim().split(/\s+/).map(initial).filter(Boolean);
  if (!found.length) return "";
  return found[0] + (found.length > 1 ? found[found.length - 1] : "");
}
