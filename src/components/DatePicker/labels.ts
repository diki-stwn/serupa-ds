// DatePicker's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface DatePickerLabels {
  /** DatePicker, DateRangePicker and TimePicker. */
  chooseDate: string;
  /** DatePicker, DateRangePicker and TimePicker: said when typed text is put back because it isn't a value the field takes. */
  inputNotAccepted: (text: string) => string;
  /** DatePicker, DateRangePicker and TimePicker: the format to type, read after the field's name ("dd/mm/yyyy", "hh:mm"). */
  formatHint: (pattern: string) => string;
}
export const en: DatePickerLabels = {
  chooseDate: "Choose a date",
  inputNotAccepted: (text) => `"${text}" wasn't accepted, so the previous value was kept.`,
  formatHint: (pattern) => "Format: " + pattern,
};
export const id: DatePickerLabels = {
  chooseDate: "Pilih tanggal",
  inputNotAccepted: (text) => `"${text}" tidak diterima, jadi nilai sebelumnya dipertahankan.`,
  formatHint: (pattern) => "Format: " + pattern,
};
