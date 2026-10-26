// Checkbox's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface CheckboxLabels {
  /** CheckboxGroup with required: what the browser says when the form is sent with no box checked. */
  selectAtLeastOne: string;
}
export const en: CheckboxLabels = {
  selectAtLeastOne: "Select at least one option.",
};
export const id: CheckboxLabels = {
  selectAtLeastOne: "Pilih setidaknya satu opsi.",
};
