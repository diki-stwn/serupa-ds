// KeyboardShortcuts's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface KeyboardShortcutsLabels {
  /** KeyboardShortcuts: the help dialog's title. */
  keyboardShortcuts: string;
  /** KeyboardShortcuts: the group for shortcuts given no group. */
  generalShortcuts: string;
  /** KeyboardShortcuts: what "?" does, listed in the dialog. */
  showShortcuts: string;
}
export const en: KeyboardShortcutsLabels = {
  keyboardShortcuts: "Keyboard shortcuts",
  generalShortcuts: "General",
  showShortcuts: "Show keyboard shortcuts",
};
export const id: KeyboardShortcutsLabels = {
  keyboardShortcuts: "Pintasan keyboard",
  generalShortcuts: "Umum",
  showShortcuts: "Tampilkan pintasan keyboard",
};
