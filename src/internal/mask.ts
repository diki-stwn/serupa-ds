// Input's mask: a pattern such as "9999 9999 9999 9999" (a card), "99/99/9999" (a date) or "AA99 **** **** ****"
// (an IBAN). 9 takes a digit, a a letter, A a letter in capitals, * a letter or digit; \ makes the next character
// plain; anything else is shown as it is, between what's typed.

import { latinDigits } from "./digits";

type Slot = { take: RegExp; upper: boolean } | string;

const SLOTS: Record<string, { take: RegExp; upper: boolean }> = {
  "9": { take: /\p{Nd}/u, upper: false },
  a: { take: /\p{L}/u, upper: false },
  A: { take: /\p{L}/u, upper: true },
  "*": { take: /[\p{L}\p{Nd}]/u, upper: false },
};

export function parseMask(mask: string): Slot[] {
  const out: Slot[] = [];
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i];
    if (c === "\\" && i + 1 < mask.length) out.push(mask[++i]);
    else out.push(SLOTS[c] || c);
  }
  return out;
}

// The plain text the mask starts with ("+62 " in "+62 999"), which isn't typed.
const lead = (slots: Slot[]): string => {
  let s = "";
  for (const x of slots) { if (typeof x !== "string") break; s += x; }
  return s;
};

/** What was typed, without the mask's plain text: the letters and digits of text, after its leading plain text.
    Digits come back as 0-9 whatever keyboard typed them (full-width, Arabic-Indic…), so the value is one a server reads. */
export function unmask(slots: Slot[], text: string): string {
  const start = lead(slots);
  const body = start && text.startsWith(start) ? text.slice(start.length) : text;
  return Array.from(latinDigits(body.normalize("NFKC"))).filter((c) => /[\p{L}\p{Nd}]/u.test(c)).join("");
}

/** typed (letters and digits) laid into the mask: each character goes in the next slot it fits (others are dropped),
    plain text shows between them, and the text stops after the last character placed. Returns the text and where each
    placed character ends in it, for putting the caret back. */
export function applyMask(slots: Slot[], typed: string): { text: string; ends: number[] } {
  const chars = Array.from(typed);
  let text = "", pending = "", i = 0;
  const ends: number[] = [];
  for (const slot of slots) {
    if (typeof slot === "string") { pending += slot; continue; }
    while (i < chars.length && !slot.take.test(chars[i])) i++;
    if (i >= chars.length) break;
    text += pending + (slot.upper ? chars[i].toUpperCase() : chars[i]);
    pending = "";
    ends.push(text.length);
    i++;
  }
  return { text, ends };
}

/** Whether the mask takes only digits, for a number keyboard on phones. */
export const digitsOnly = (slots: Slot[]): boolean => slots.every((x) => typeof x === "string" || x === SLOTS["9"]);

/** Whether the character at index i of masked text is the mask's plain text (not something typed). */
export function isPlain(slots: Slot[], text: string, i: number): boolean {
  const { ends } = applyMask(slots, unmask(slots, text));
  return i >= 0 && i < text.length && !ends.includes(i + 1);
}
