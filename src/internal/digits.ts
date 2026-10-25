// Digits people type in other scripts, read as ASCII so Number() and the date and time parsers understand them.

// Chinese numerals (zh-u-nu-hanidec) aren't Unicode decimal digits, so they're mapped one by one.
const HANIDEC = "〇一二三四五六七八九";

/** Any decimal digits (Arabic-Indic ٢٢, Persian ۲۲, Bengali ২২, Thai ๒๒, full-width ２２, Chinese 二二) as ASCII. */
export function latinDigits(text: string): string {
  return text.replace(/[〇一二三四五六七八九]/g, (c) => String(HANIDEC.indexOf(c))).replace(/\p{Nd}/gu, (c) => {
    const cp = c.codePointAt(0)!;
    if (cp < 128) return c;
    let zero = cp;
    while (/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero--;
    return String((cp - zero) % 10);
  });
}
