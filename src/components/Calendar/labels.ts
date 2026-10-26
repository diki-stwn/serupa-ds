// Calendar's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface CalendarLabels {
  /** Calendar month buttons. */
  previousMonth: string;
  nextMonth: string;
  /** Calendar monthYearPicker menus. */
  month: string;
  year: string;
}
export const en: CalendarLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  month: "Month",
  year: "Year",
};
export const id: CalendarLabels = {
  previousMonth: "Bulan sebelumnya",
  nextMonth: "Bulan berikutnya",
  month: "Bulan",
  year: "Tahun",
};
