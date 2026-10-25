// ErrorBoundary's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface ErrorBoundaryLabels {
  /** ErrorBoundary: the default fallback's title, its message and its retry button. */
  errorTitle: string;
  errorDescription: string;
  tryAgain: string;
}
export const en: ErrorBoundaryLabels = {
  errorTitle: "Something went wrong",
  errorDescription: "This part of the page couldn't load.",
  tryAgain: "Try again",
};
export const id: ErrorBoundaryLabels = {
  errorTitle: "Terjadi kesalahan",
  errorDescription: "Bagian halaman ini tidak dapat dimuat.",
  tryAgain: "Coba lagi",
};
