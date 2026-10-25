// Table's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface TableLabels {
  /** Table's scroll region when it has no caption. */
  table: string;
  /** Table: read out when a sortable column's order changes ("Sorted by Amount, ascending"). */
  tableSorted: (column: string, direction: 'ascending' | 'descending') => string;
}
export const en: TableLabels = {
  table: "Table",
  tableSorted: (column, direction) => "Sorted by " + column + ", " + direction + ".",
};
export const id: TableLabels = {
  table: "Tabel",
  tableSorted: (column, direction) => "Diurutkan menurut " + column + ", " + (direction === "ascending" ? "naik" : "turun") + ".",
};
