// Input's own words, in English and Indonesian, shared with Textarea's count. tools/build/registry.mjs adds them to
// SerupaLabels, enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface InputLabels {
  /** Input and Textarea with showCount and maxLength: read out when few characters are left, and at the limit
      (left is 0). Not on every keystroke. */
  charactersLeft: (left: number) => string;
}
export const en: InputLabels = {
  charactersLeft: (left) => (left === 0 ? "Character limit reached." : left === 1 ? "1 character left." : left + " characters left."),
};
export const id: InputLabels = {
  charactersLeft: (left) => (left === 0 ? "Batas karakter tercapai." : "Sisa " + left + " karakter."),
};
