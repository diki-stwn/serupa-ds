// ErrorSummary's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ErrorSummaryLabels {
  /** ErrorSummary: its heading, from how many errors it lists. */
  errorSummaryTitle: (count: number) => string;
}
export const en: ErrorSummaryLabels = {
  errorSummaryTitle: (count) => (count === 1 ? "There is a problem" : "There are " + count + " problems"),
};
export const id: ErrorSummaryLabels = {
  errorSummaryTitle: (count) => (count === 1 ? "Ada satu masalah" : "Ada " + count + " masalah"),
};
