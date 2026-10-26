// Splitter's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface SplitterLabels {
  /** Splitter's handle, when it has no separatorLabel. */
  resizePanes: string;
  /** Said after a press on the handle that didn't drag it: the next press in the Splitter puts the handle there. */
  splitterPlace: string;
}
export const en: SplitterLabels = {
  resizePanes: "Resize panes",
  splitterPlace: "Press where the handle should go, or press the handle again to cancel.",
};
export const id: SplitterLabels = {
  resizePanes: "Ubah ukuran panel",
  splitterPlace: "Tekan di tempat pegangan harus berada, atau tekan pegangan lagi untuk batal.",
};
