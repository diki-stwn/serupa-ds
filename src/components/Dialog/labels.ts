// Dialog's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface DialogLabels {
  /** Dialog with unsaved: the question asked before it closes, the line under it, and its two buttons. */
  discardTitle: string;
  discardDescription: string;
  discard: string;
  keepEditing: string;
}
export const en: DialogLabels = {
  discardTitle: "Discard changes?",
  discardDescription: "What you changed here hasn't been saved.",
  discard: "Discard",
  keepEditing: "Keep editing",
};
export const id: DialogLabels = {
  discardTitle: "Buang perubahan?",
  discardDescription: "Perubahan di sini belum disimpan.",
  discard: "Buang",
  keepEditing: "Lanjutkan mengedit",
};
