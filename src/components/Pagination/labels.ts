// Pagination's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface PaginationLabels {
  /** Pagination. */
  pagination: string;
  previousPage: string;
  nextPage: string;
  /** The summary with total and pageSize: "21–30 of 245" (the numbers come in the locale's digits and grouping). */
  itemsOf: (first: string, last: string, total: string) => string;
  /** The page-size select's label, with pageSizeOptions. */
  perPage: string;
}
export const en: PaginationLabels = {
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  itemsOf: (first, last, total) => (first === last ? first : first + "–" + last) + " of " + total,
  perPage: "Items per page",
};
export const id: PaginationLabels = {
  pagination: "Halaman",
  previousPage: "Halaman sebelumnya",
  nextPage: "Halaman berikutnya",
  itemsOf: (first, last, total) => (first === last ? first : first + "–" + last) + " dari " + total,
  perPage: "Item per halaman",
};
