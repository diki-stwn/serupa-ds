// src/components/Rating/labels.ts
var en = {
  ratingStars: (value) => value === 1 ? "1 star" : value + " stars",
  ratingValue: (value, max) => value + " out of " + max
};
var id = {
  ratingStars: (value) => String(value).replace(".", ",") + " bintang",
  ratingValue: (value, max) => String(value).replace(".", ",") + " dari " + max
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
