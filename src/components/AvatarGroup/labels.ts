// AvatarGroup's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface AvatarGroupLabels {
  /** AvatarGroup: the name of the "+N" avatar. */
  avatarMore: (count: number) => string;
}
export const en: AvatarGroupLabels = {
  avatarMore: (count) => count + " more",
};
export const id: AvatarGroupLabels = {
  avatarMore: (count) => count + " lainnya",
};
