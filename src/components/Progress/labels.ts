// Progress's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ProgressLabels {
  /** Progress with announceComplete: said when it reaches max. name is its label or aria-label, or "" without one. */
  progressComplete: (name: string) => string;
}
export const en: ProgressLabels = {
  progressComplete: (name) => (name ? name + ": complete" : "Complete"),
};
export const id: ProgressLabels = {
  progressComplete: (name) => (name ? name + ": selesai" : "Selesai"),
};
