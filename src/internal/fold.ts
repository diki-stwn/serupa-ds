// Text folded for matching what people type against labels: case, accents and width ignored, so "lodz" finds "Łódź",
// "strasse" finds "Straße", "ｔｏｋｙｏ" finds "Tokyo" and "トウキョウ" finds "ﾄｳｷｮｳ". NFKD splits accents off
// and maps full- and half-width forms to the usual ones; a few letters don't decompose and get a table.
const LETTERS: Record<string, string> = { "ł": "l", "đ": "d", "ð": "d", "ø": "o", "æ": "ae", "œ": "oe", "ß": "ss", "ħ": "h", "ı": "i", "þ": "th", "ŧ": "t", "ŋ": "n", "ĸ": "k" };

// The marks that are accents, dropped: the combining diacritics (Latin, Greek, Cyrillic, Vietnamese), Hebrew points
// and Arabic harakat. Not every mark: in Devanagari, Bengali, Tamil, Thai and the like a mark is a vowel or a tone
// ("काम" is not "कम"), and in Japanese the voicing mark makes "ガ" a different sound from "カ" (GR29).
const ACCENTS = /[\u0300-\u036f]|[\u1ab0-\u1aff]|[\u1dc0-\u1dff]|[\u20d0-\u20ff]|[\ufe20-\ufe2f]|[\u0591-\u05c7]|[\u0610-\u061a]|[\u064b-\u065f]|[\u0670]|[\u06d6-\u06ed]/g;   // one class per range: a class that runs one mark into the next is "misleading" to lint

/** Lowercased, without accents or width differences, with ł→l, ø→o, æ→ae, ß→ss and the like. Vowel signs and tone
    marks (Hindi, Thai…) and Japanese voicing marks are kept: they make a different word. */
export function fold(s: string): string {
  return s.normalize("NFKD").replace(ACCENTS, "").toLowerCase().replace(/[łđðøæœßħıþŧŋĸ]/g, (c) => LETTERS[c]);
}
