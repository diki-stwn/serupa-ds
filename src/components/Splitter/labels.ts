// Splitter's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface SplitterLabels {
  /** Splitter's handle, when it has no separatorLabel. */
  resizePanes: string;
}
export const en: SplitterLabels = {
  resizePanes: "Resize panes",
};
export const id: SplitterLabels = {
  resizePanes: "Ubah ukuran panel",
};
