// Field's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface FieldLabels {
  /** Field: after the label with optional. */
  fieldOptional: string;
}
export const en: FieldLabels = {
  fieldOptional: "(optional)",
};
export const id: FieldLabels = {
  fieldOptional: "(opsional)",
};
