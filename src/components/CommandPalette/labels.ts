// CommandPalette's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface CommandPaletteLabels {
  /** CommandPalette: the dialog's name, and what its shortcut does in <KeyboardShortcuts>. */
  commandPalette: string;
  /** CommandPalette: the search field's placeholder and name. */
  searchCommands: string;
  /** CommandPalette: shown, and said, when nothing matches what was typed. */
  noCommands: string;
  /** CommandPalette: said once typing stops, with how many commands match. */
  commandsCount: (count: number) => string;
  /** CommandPalette: the group for commands given no group. */
  otherCommands: string;
}
export const en: CommandPaletteLabels = {
  commandPalette: "Command palette",
  searchCommands: "Search commands and pages",
  noCommands: "No matching commands",
  commandsCount: (count) => count === 1 ? "1 command" : count + " commands",
  otherCommands: "Commands",
};
export const id: CommandPaletteLabels = {
  commandPalette: "Palet perintah",
  searchCommands: "Cari perintah dan halaman",
  noCommands: "Tidak ada perintah yang cocok",
  commandsCount: (count) => count + " perintah",
  otherCommands: "Perintah",
};
