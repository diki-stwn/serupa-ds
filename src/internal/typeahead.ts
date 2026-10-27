// Typeahead for lists that move focus as people type (Menu): letters typed within half a second build one word, so
// "de" goes past "Duplicate" to "Delete"; the same letter again steps through the items starting with it; a word
// nothing starts with starts again from the last letter. Labels match folded (internal/fold.ts): "e" finds "Éditer".
import { fold } from "./fold";

/** What has been typed so far, and when the last letter came: keep one per list, in a ref. */
export interface Typed { text: string; at: number }

/** Half a second between letters starts a new word, as in native lists. */
export const TYPEAHEAD_PAUSE = 500;

/** Whether a word is being typed (a letter came within the pause): Space then joins it ("my files") instead of
 *  choosing the focused item, as in native lists and the APG. */
export function typing(typed: Typed, now = Date.now()): boolean {
  return typed.text !== "" && now - typed.at <= TYPEAHEAD_PAUSE;
}

/** The index of the item to go to after the key typed, or -1 when none matches. `current` is the focused item (-1 for none). */
export function typeahead(typed: Typed, key: string, labels: readonly string[], current: number, now = Date.now()): number {
  const k = fold(key);
  typed.text = (now - typed.at > TYPEAHEAD_PAUSE ? "" : typed.text) + k;
  typed.at = now;
  const n = labels.length;
  const find = (word: string, from: number) => {
    for (let s = 0; s < n; s++) { const i = (from + s + n) % n; if (fold(labels[i].trim()).startsWith(word)) return i; }
    return -1;
  };
  // The same letter over and over steps on; a longer word may stay on the item it already matches.
  const same = [...typed.text].every((c) => c === k);
  let i = same ? find(k, current + 1) : find(typed.text, Math.max(current, 0));
  if (i < 0 && !same) { typed.text = k; i = find(k, current + 1); }
  return i;
}
