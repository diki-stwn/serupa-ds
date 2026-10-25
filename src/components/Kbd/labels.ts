// Kbd's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface KbdLabels {
  /** Kbd: what screen readers hear for a named key, from its English name ("Up arrow", "Command", "Space"). */
  keyName: (name: string) => string;
}
export const en: KbdLabels = {
  keyName: (name) => name,
};
const ID_KEYS: Record<string, string> = {
  "Up arrow": "Panah atas", "Down arrow": "Panah bawah", "Left arrow": "Panah kiri", "Right arrow": "Panah kanan",
  Space: "Spasi", Delete: "Hapus", Backspace: "Hapus mundur",
};
export const id: KbdLabels = {
  keyName: (name) => ID_KEYS[name] || name,
};
