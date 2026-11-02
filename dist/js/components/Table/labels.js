// src/components/Table/labels.ts
var en = {
  table: "Table",
  tableSorted: (column, direction) => "Sorted by " + column + ", " + direction + ".",
  tableSelected: (n) => n + " selected",
  clearSelection: "Clear selection"
};
var id = {
  table: "Tabel",
  tableSorted: (column, direction) => "Diurutkan menurut " + column + ", " + (direction === "ascending" ? "naik" : "turun") + ".",
  tableSelected: (n) => n + " dipilih",
  clearSelection: "Hapus pilihan"
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
