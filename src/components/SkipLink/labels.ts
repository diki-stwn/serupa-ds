// SkipLink's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface SkipLinkLabels {
  /** SkipLink: the link's text when it has no children. */
  skipToContent: string;
}
export const en: SkipLinkLabels = {
  skipToContent: "Skip to content",
};
export const id: SkipLinkLabels = {
  skipToContent: "Langsung ke konten",
};
