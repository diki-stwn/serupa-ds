// Accordion's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface AccordionLabels {
  /** Accordion with showExpandAll: the button that opens every item, and the one that closes them all. */
  expandAll: string;
  collapseAll: string;
}
export const en: AccordionLabels = {
  expandAll: "Expand all",
  collapseAll: "Collapse all",
};
export const id: AccordionLabels = {
  expandAll: "Buka semua",
  collapseAll: "Tutup semua",
};
