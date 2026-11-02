// src/internal/mask.ts
import { latinDigits } from "./digits.js";
var SLOTS = {
  "9": { take: /\p{Nd}/u, upper: false },
  a: { take: /\p{L}/u, upper: false },
  A: { take: /\p{L}/u, upper: true },
  "*": { take: /[\p{L}\p{Nd}]/u, upper: false }
};
function parseMask(mask) {
  const out = [];
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i];
    if (c === "\\" && i + 1 < mask.length) out.push(mask[++i]);
    else out.push(SLOTS[c] || c);
  }
  return out;
}
var lead = (slots) => {
  let s = "";
  for (const x of slots) {
    if (typeof x !== "string") break;
    s += x;
  }
  return s;
};
var LOOSE = /[\s\-./()]/;
function afterLead(start, text) {
  const want = Array.from(start).filter((c) => !LOOSE.test(c));
  if (!want.length) return text;
  let i = 0;
  for (const c of want) {
    while (i < text.length && LOOSE.test(text[i]) && text[i] !== c) i++;
    if (text[i] !== c) return text;
    i++;
  }
  return text.slice(i);
}
function unmask(slots, text) {
  const t = latinDigits(text.normalize("NFKC"));
  return Array.from(afterLead(lead(slots), t)).filter((c) => /[\p{L}\p{Nd}]/u.test(c)).join("");
}
function applyMask(slots, typed) {
  const chars = Array.from(typed);
  let text = "", pending = "", i = 0;
  const ends = [];
  for (const slot of slots) {
    if (typeof slot === "string") {
      pending += slot;
      continue;
    }
    while (i < chars.length && !slot.take.test(chars[i])) i++;
    if (i >= chars.length) break;
    text += pending + (slot.upper ? chars[i].toUpperCase() : chars[i]);
    pending = "";
    ends.push(text.length);
    i++;
  }
  return { text, ends };
}
var digitsOnly = (slots) => slots.every((x) => typeof x === "string" || x === SLOTS["9"]);
function isPlain(slots, text, i) {
  const { ends } = applyMask(slots, unmask(slots, text));
  return i >= 0 && i < text.length && !ends.includes(i + 1);
}
export {
  applyMask,
  digitsOnly,
  isPlain,
  parseMask,
  unmask
};
//# sourceMappingURL=mask.js.map
