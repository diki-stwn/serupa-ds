// TypeToConfirm's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface TypeToConfirmLabels {
  /** TypeToConfirm: the words before the phrase in its label ("To confirm, type" acme/web). */
  typeToConfirm: string;
  /** TypeToConfirm: why the button can't be pressed yet, its description until the phrase is typed. */
  typePhraseFirst: (phrase: string) => string;
}
export const en: TypeToConfirmLabels = {
  typeToConfirm: "To confirm, type",
  typePhraseFirst: (phrase) => "Type “" + phrase + "” first",
};
export const id: TypeToConfirmLabels = {
  typeToConfirm: "Untuk mengonfirmasi, ketik",
  typePhraseFirst: (phrase) => "Ketik “" + phrase + "” dulu",
};
