// Avatar's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface AvatarLabels {
  /** Avatar: the status read after the name ("Ana Lim, online"). */
  avatarStatus: (status: "online" | "busy" | "away" | "offline") => string;
}
export const en: AvatarLabels = {
  avatarStatus: (status) => status,
};
const ID_STATUS = { online: "daring", busy: "sibuk", away: "tidak di tempat", offline: "luring" };
export const id: AvatarLabels = {
  avatarStatus: (status) => ID_STATUS[status],
};
