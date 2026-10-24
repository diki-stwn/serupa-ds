// Slider's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface SliderLabels {
  /** A range Slider's thumb names. */
  sliderMinimum: string;
  sliderMaximum: string;
}
export const en: SliderLabels = {
  sliderMinimum: "Minimum",
  sliderMaximum: "Maximum",
};
export const id: SliderLabels = {
  sliderMinimum: "Minimum",
  sliderMaximum: "Maksimum",
};
