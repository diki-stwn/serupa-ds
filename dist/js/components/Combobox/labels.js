// src/components/Combobox/labels.ts
var en = {
  loadingResults: "Loading\u2026",
  loadFailed: "Couldn't load options. Type to try again.",
  noResults: "No results",
  resultsCount: (count) => count === 1 ? "1 result" : count + " results",
  moreResults: (count) => "Keep typing to narrow " + count + " more",
  showOptions: "Show options",
  clearValue: (label) => label ? "Clear " + label : "Clear",
  valueAdded: (label) => label + " added",
  valueRemoved: (label) => label + " removed"
};
var id = {
  loadingResults: "Memuat\u2026",
  loadFailed: "Gagal memuat pilihan. Ketik untuk mencoba lagi.",
  noResults: "Tidak ada hasil",
  resultsCount: (count) => count + " hasil",
  moreResults: (count) => "Ketik lagi untuk mempersempit " + count + " lainnya",
  showOptions: "Tampilkan pilihan",
  clearValue: (label) => label ? "Hapus " + label : "Hapus",
  valueAdded: (label) => label + " ditambahkan",
  valueRemoved: (label) => label + " dihapus"
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
