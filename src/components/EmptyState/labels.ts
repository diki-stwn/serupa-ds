// EmptyState's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface EmptyStateLabels {
  /** EmptyState with suggestions: the words before the searches to try instead ("Did you mean: mars"). */
  didYouMean: string;
  /** EmptyState with onClearFilters: the button that clears the search and filters. */
  clearFilters: string;
}
export const en: EmptyStateLabels = {
  didYouMean: "Did you mean:",
  clearFilters: "Clear filters",
};
export const id: EmptyStateLabels = {
  didYouMean: "Mungkin maksud Anda:",
  clearFilters: "Hapus filter",
};
