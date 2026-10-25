// Link's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface LinkLabels {
  /** Link with external: read after the link text. */
  opensInNewTab: string;
}
export const en: LinkLabels = {
  opensInNewTab: "(opens in a new tab)",
};
export const id: LinkLabels = {
  opensInNewTab: "(terbuka di tab baru)",
};
