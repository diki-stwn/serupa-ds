// Text folded for matching what people type against labels: case, accents and width ignored, so "lodz" finds "Łódź",
// "strasse" finds "Straße", "ｔｏｋｙｏ" finds "Tokyo" and "トウキョウ" finds "ﾄｳｷｮｳ" (and "とうきょう"). NFKD splits accents off
// and maps full- and half-width forms to the usual ones; a few letters don't decompose and get a table.
const LETTERS: Record<string, string> = { "ł": "l", "đ": "d", "ð": "d", "ø": "o", "æ": "ae", "œ": "oe", "ß": "ss", "ħ": "h", "ı": "i", "þ": "th", "ŧ": "t", "ŋ": "n", "ĸ": "k", "ς": "σ" };

// The marks that are accents, dropped: the combining diacritics (Latin, Greek, Cyrillic, Vietnamese), Hebrew points
// and Arabic harakat. Not every mark: in Devanagari, Bengali, Tamil, Thai and the like a mark is a vowel or a tone
// ("काम" is not "कम"), and in Japanese the voicing mark makes "ガ" a different sound from "カ" (GR29).
const ACCENTS = /[\u0300-\u036f]|[\u1ab0-\u1aff]|[\u1dc0-\u1dff]|[\u20d0-\u20ff]|[\ufe20-\ufe2f]|[\u0591-\u05c7]|[\u0610-\u061a]|[\u064b-\u065f]|[\u0670]|[\u06d6-\u06ed]/g;   // one class per range: a class that runs one mark into the next is "misleading" to lint

// Cyrillic letters that only look like a letter with an accent: й, ў and ї are letters of their own (Russian "мой" is
// not "мои"), so their marks are put back before the accents go. ё still finds е, as people type it (GR41).
const CYRILLIC = /[иИуУ]\u0306|[іІ]\u0308/g;

// Greek final sigma ς is σ at the end of a word (L8E14): lowercasing "ΑΣ" gives "ας" but "ΑΣΤΥ" gives "αστυ", so a
// search typed in capitals found nothing, and "οδος" didn't find "ΟΔΟΣ" marked one letter at a time.
// Katakana are read as hiragana, as Japanese search does (L8E17): an IME types "こーひー" until it's converted, and
// it must still find "コーヒー". NFKD has already turned half-width katakana into full-width ones.
/** Lowercased, without accents or width differences, with ł→l, ø→o, æ→ae, ß→ss, ς→σ and the like. Vowel signs and tone
    marks (Hindi, Thai…) and Japanese voicing marks are kept: they make a different word. */
export function fold(s: string): string {
  return s.normalize("NFKD").replace(CYRILLIC, (m) => m.normalize("NFC")).replace(ACCENTS, "").toLowerCase().replace(/[łđðøæœßħıþŧŋĸς]/g, (c) => LETTERS[c])
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
