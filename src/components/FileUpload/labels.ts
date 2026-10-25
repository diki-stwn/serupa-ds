// FileUpload's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface FileUploadLabels {
  /** FileUpload. */
  dragFiles: string;
  dragFile: string;
  chooseFiles: string;
  chooseFile: string;
  chosenFiles: string;
  chosenFile: string;
  /** FileUpload's messages for a refused file. types: what accept allows, in short names ("image", "PDF"), or null
      when a type has no short name. */
  fileWrongType: (name: string, types: string[] | null) => string;
  fileTooLarge: (name: string, limit: string) => string;
  fileTooMany: (name: string, max: number) => string;
  fileOnlyOne: (name: string) => string;
  /** FileUpload: shown when a form is submitted without a required file. */
  fileMissing: (multiple: boolean) => string;
}
// "an image or PDF", "a PNG, JPG or GIF": "an" before a vowel sound ("an SVG", said "ess"; "an MP4").
function anyOf(types: string[]): string {
  const first = types[0];
  const an = first === first.toUpperCase() ? /^[AEFHILMNORSX]/.test(first) : /^[aeiou]/.test(first);
  return (an ? "an " : "a ") + (types.length === 1 ? first : types.slice(0, -1).join(", ") + " or " + types[types.length - 1]);
}
export const en: FileUploadLabels = {
  dragFiles: "Drag files here",
  dragFile: "Drag a file here",
  chooseFiles: "Choose files",
  chooseFile: "Choose a file",
  chosenFiles: "Chosen files",
  chosenFile: "Chosen file",
  fileWrongType: (name, types) => types ? `${name} isn't ${anyOf(types)}.` : `${name}: this type of file isn't accepted.`,
  fileTooLarge: (name, limit) => `${name} is larger than ${limit}.`,
  fileTooMany: (name, max) => `${name} wasn't added: up to ${max} ${max === 1 ? "file" : "files"}.`,
  fileOnlyOne: (name) => `${name} wasn't added: one file only.`,
  fileMissing: (multiple) => multiple ? "Choose at least one file." : "Choose a file.",
};
const ID_KINDS: Record<string, string> = { image: "gambar", video: "video", "audio file": "file audio", "text file": "file teks" };
export const id: FileUploadLabels = {
  dragFiles: "Seret file ke sini",
  dragFile: "Seret file ke sini",
  chooseFiles: "Pilih file",
  chooseFile: "Pilih file",
  chosenFiles: "File yang dipilih",
  chosenFile: "File yang dipilih",
  fileWrongType: (name, types) => types
    ? `${name} bukan ${new Intl.ListFormat("id", { type: "disjunction" }).format(types.map((t) => ID_KINDS[t] || t))}.`
    : `${name}: jenis file ini tidak diterima.`,
  fileTooLarge: (name, limit) => `${name} lebih besar dari ${limit}.`,
  fileTooMany: (name, max) => `${name} tidak ditambahkan: maksimal ${max} file.`,
  fileOnlyOne: (name) => `${name} tidak ditambahkan: hanya satu file.`,
  fileMissing: (multiple) => multiple ? "Pilih setidaknya satu file." : "Pilih file.",
};
