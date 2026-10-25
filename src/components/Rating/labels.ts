// Rating's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface RatingLabels {
  /** Each Rating choice's name, for a value: "1 star", "3.5 stars". */
  ratingStars: (value: number) => string;
  /** A read-only Rating's name: "4.5 out of 5". */
  ratingValue: (value: number, max: number) => string;
}
export const en: RatingLabels = {
  ratingStars: (value) => (value === 1 ? "1 star" : value + " stars"),
  ratingValue: (value, max) => value + " out of " + max,
};
export const id: RatingLabels = {
  ratingStars: (value) => String(value).replace(".", ",") + " bintang",
  ratingValue: (value, max) => String(value).replace(".", ",") + " dari " + max,
};
