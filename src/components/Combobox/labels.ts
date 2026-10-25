// Combobox's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ComboboxLabels {
  /** Combobox while loading options. */
  loadingResults: string;
  /** Combobox when nothing matches. */
  noResults: string;
  /** Combobox, said once typing stops: how many options match. */
  resultsCount: (count: number) => string;
  /** Combobox, under the list when more options match than it shows: how many more. */
  moreResults: (count: number) => string;
  /** Combobox chevron button. */
  showOptions: string;
  /** Combobox × button, with the field's label when it has one ("Clear Country"). */
  clearValue: (label: string) => string;
  /** Combobox with multiple, read out when an option is picked and its tag added ("Design added"). */
  valueAdded: (label: string) => string;
  /** Combobox with multiple, read out when a tag is removed ("Design removed"). */
  valueRemoved: (label: string) => string;
}
export const en: ComboboxLabels = {
  loadingResults: "Loading…",
  noResults: "No results",
  resultsCount: (count) => count === 1 ? "1 result" : count + " results",
  moreResults: (count) => "Keep typing to narrow " + count + " more",
  showOptions: "Show options",
  clearValue: (label) => label ? "Clear " + label : "Clear",
  valueAdded: (label) => label + " added",
  valueRemoved: (label) => label + " removed",
};
export const id: ComboboxLabels = {
  loadingResults: "Memuat…",
  noResults: "Tidak ada hasil",
  resultsCount: (count) => count + " hasil",
  moreResults: (count) => "Ketik lagi untuk mempersempit " + count + " lainnya",
  showOptions: "Tampilkan pilihan",
  clearValue: (label) => label ? "Hapus " + label : "Hapus",
  valueAdded: (label) => label + " ditambahkan",
  valueRemoved: (label) => label + " dihapus",
};
