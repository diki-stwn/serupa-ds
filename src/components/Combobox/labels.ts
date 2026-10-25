// Combobox's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ComboboxLabels {
  /** Combobox while loading options. */
  loadingResults: string;
  /** Combobox when nothing matches. */
  noResults: string;
  /** Combobox, said once typing stops: how many options match. */
  resultsCount: (count: number) => string;
  /** Combobox chevron button. */
  showOptions: string;
  /** Combobox × button, with the field's label when it has one ("Clear Country"). */
  clearValue: (label: string) => string;
}
export const en: ComboboxLabels = {
  loadingResults: "Loading…",
  noResults: "No results",
  resultsCount: (count) => count === 1 ? "1 result" : count + " results",
  showOptions: "Show options",
  clearValue: (label) => label ? "Clear " + label : "Clear",
};
export const id: ComboboxLabels = {
  loadingResults: "Memuat…",
  noResults: "Tidak ada hasil",
  resultsCount: (count) => count + " hasil",
  showOptions: "Tampilkan pilihan",
  clearValue: (label) => label ? "Hapus " + label : "Hapus",
};
