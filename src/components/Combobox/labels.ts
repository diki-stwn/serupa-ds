// Combobox's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ComboboxLabels {
  /** Combobox while loading options. */
  loadingResults: string;
  /** Combobox when nothing matches. */
  noResults: string;
  /** Combobox chevron button. */
  showOptions: string;
  /** Combobox × button, with the field's label when it has one ("Clear Country"). */
  clearValue: (label: string) => string;
}
export const en: ComboboxLabels = {
  loadingResults: "Loading…",
  noResults: "No results",
  showOptions: "Show options",
  clearValue: (label) => label ? "Clear " + label : "Clear",
};
export const id: ComboboxLabels = {
  loadingResults: "Memuat…",
  noResults: "Tidak ada hasil",
  showOptions: "Tampilkan pilihan",
  clearValue: (label) => label ? "Hapus " + label : "Hapus",
};
