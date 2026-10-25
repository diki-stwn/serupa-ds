// Breadcrumb's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface BreadcrumbLabels {
  /** Breadcrumb, and its "…" button. */
  breadcrumb: string;
  showHiddenPages: string;
  /** Breadcrumb with collapse="menu": the "…" button and the menu it opens. */
  morePages: string;
}
export const en: BreadcrumbLabels = {
  breadcrumb: "Breadcrumb",
  showHiddenPages: "Show all pages",
  morePages: "More pages",
};
export const id: BreadcrumbLabels = {
  breadcrumb: "Navigasi jejak",
  showHiddenPages: "Tampilkan semua halaman",
  morePages: "Halaman lainnya",
};
