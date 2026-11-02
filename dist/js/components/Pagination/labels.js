// src/components/Pagination/labels.ts
var en = {
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  itemsOf: (first, last, total) => (first === last ? first : first + "\u2013" + last) + " of " + total,
  perPage: "Items per page"
};
var id = {
  pagination: "Halaman",
  previousPage: "Halaman sebelumnya",
  nextPage: "Halaman berikutnya",
  itemsOf: (first, last, total) => (first === last ? first : first + "\u2013" + last) + " dari " + total,
  perPage: "Item per halaman"
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
