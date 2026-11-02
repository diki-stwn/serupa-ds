// src/internal/digits.ts
var HANIDEC = "\u3007\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D";
function latinDigits(text) {
  return text.replace(/[〇一二三四五六七八九]/g, (c) => String(HANIDEC.indexOf(c))).replace(/\p{Nd}/gu, (c) => {
    const cp = c.codePointAt(0);
    if (cp < 128) return c;
    let zero = cp;
    while (/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero--;
    return String((cp - zero) % 10);
  });
}
export {
  latinDigits
};
//# sourceMappingURL=digits.js.map
