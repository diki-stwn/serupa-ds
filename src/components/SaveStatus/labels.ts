// SaveStatus's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface SaveStatusLabels {
  /** SaveStatus: while changes are being saved. */
  saving: string;
  /** SaveStatus: once they're saved, shown before how long ago ("Saved 2 minutes ago") and announced alone. */
  saved: string;
  /** SaveStatus: when saving failed. */
  saveFailed: string;
  /** SaveStatus: the button that tries saving again. */
  retrySave: string;
}
export const en: SaveStatusLabels = {
  saving: "Saving…",
  saved: "Saved",
  saveFailed: "Couldn’t save",
  retrySave: "Try again",
};
export const id: SaveStatusLabels = {
  saving: "Menyimpan…",
  saved: "Tersimpan",
  saveFailed: "Gagal menyimpan",
  retrySave: "Coba lagi",
};
