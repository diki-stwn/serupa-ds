// Input's own words, in English and Indonesian, shared with Textarea's count. tools/build/registry.mjs adds them to
// SerupaLabels, enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.

/** A native constraint an Input's or a Textarea's value fails, for the invalidValue label: which one (the
    ValidityState flag that is set), and what the field asks for. */
export interface ValidityProblem {
  reason: 'valueMissing' | 'typeMismatch' | 'badInput' | 'tooShort' | 'tooLong' | 'rangeUnderflow' | 'rangeOverflow' | 'stepMismatch' | 'patternMismatch';
  /** The field's type ("email", "number", "text"…; "textarea" for a Textarea). */
  type: string;
  /** How many characters the value has now. */
  length: number;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
  /** The field's title, which browsers add to a pattern message. */
  title?: string;
}

export interface InputLabels {
  /** Input and Textarea with showCount and maxLength: read out when few characters are left, and at the limit
      (left is 0). Not on every keystroke. */
  charactersLeft: (left: number) => string;
  /** Input and Textarea: the message the browser shows for a native constraint the value fails (required, type,
      minLength, maxLength, min, max, step, pattern), in the provider's language rather than the browser's. ""
      keeps the browser's own message, which English does, since the browser already speaks its user's language. */
  invalidValue: (problem: ValidityProblem) => string;
}
export const en: InputLabels = {
  charactersLeft: (left) => (left === 0 ? "Character limit reached." : left === 1 ? "1 character left." : left + " characters left."),
  invalidValue: () => "",
};
export const id: InputLabels = {
  charactersLeft: (left) => (left === 0 ? "Batas karakter tercapai." : "Sisa " + left + " karakter."),
  invalidValue: (p) => {
    switch (p.reason) {
      case "valueMissing": return "Isi kolom ini.";
      case "typeMismatch": return p.type === "email" ? "Masukkan alamat email yang benar." : "Masukkan nilai yang benar.";
      case "badInput": return "Masukkan angka.";
      case "tooShort": return "Minimal " + p.minLength + " karakter (sekarang " + p.length + ").";
      case "tooLong": return "Maksimal " + p.maxLength + " karakter (sekarang " + p.length + ").";
      case "rangeUnderflow": return "Nilai harus " + p.min + " atau lebih.";
      case "rangeOverflow": return "Nilai harus " + p.max + " atau kurang.";
      case "stepMismatch": return "Masukkan nilai kelipatan " + p.step + ".";
      case "patternMismatch": return "Ikuti format yang diminta." + (p.title ? " " + p.title : "");
    }
  },
};
