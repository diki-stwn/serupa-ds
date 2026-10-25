// src/components/Combobox/labels.ts
var en = {
  loadingResults: "Loading\u2026",
  noResults: "No results",
  resultsCount: (count) => count === 1 ? "1 result" : count + " results",
  moreResults: (count) => "Keep typing to narrow " + count + " more",
  showOptions: "Show options",
  clearValue: (label) => label ? "Clear " + label : "Clear"
};
var id = {
  loadingResults: "Memuat\u2026",
  noResults: "Tidak ada hasil",
  resultsCount: (count) => count + " hasil",
  moreResults: (count) => "Ketik lagi untuk mempersempit " + count + " lainnya",
  showOptions: "Tampilkan pilihan",
  clearValue: (label) => label ? "Hapus " + label : "Hapus"
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
