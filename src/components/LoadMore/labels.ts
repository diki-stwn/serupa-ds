// LoadMore's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface LoadMoreLabels {
  /** LoadMore: the button. */
  loadMore: string;
  /** LoadMore with count and total: how many are shown ("Showing 20 of 134"); the numbers come formatted. */
  showingOf: (shown: string, total: string) => string;
  /** LoadMore: announced when a load adds items, with how many ("20 more loaded"). */
  loadedMore: (added: string) => string;
  /** LoadMore without count: announced when a load finishes. */
  moreLoaded: string;
  /** LoadMore: shown in place of the button once there's nothing more. */
  allLoaded: string;
}
export const en: LoadMoreLabels = {
  loadMore: "Load more",
  showingOf: (shown, total) => `Showing ${shown} of ${total}`,
  loadedMore: (added) => `${added} more loaded`,
  moreLoaded: "More loaded",
  allLoaded: "You’ve reached the end",
};
export const id: LoadMoreLabels = {
  loadMore: "Muat lagi",
  showingOf: (shown, total) => `Menampilkan ${shown} dari ${total}`,
  loadedMore: (added) => `${added} lagi dimuat`,
  moreLoaded: "Berikutnya dimuat",
  allLoaded: "Sudah sampai akhir",
};
