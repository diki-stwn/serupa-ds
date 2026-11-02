// src/components/FileUpload/labels.ts
function anyOf(types) {
  const first = types[0];
  const an = first === first.toUpperCase() ? /^[AEFHILMNORSX]/.test(first) : /^[aeiou]/.test(first);
  return (an ? "an " : "a ") + (types.length === 1 ? first : types.slice(0, -1).join(", ") + " or " + types[types.length - 1]);
}
var en = {
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
  fileFolder: (name) => `${name} is a folder: choose the files in it instead.`,
  fileAlreadyAdded: (name) => `${name} is already added.`,
  filesAdded: (names) => names.length === 1 ? `${names[0]} added.` : `${names.length} files added.`,
  fileRemoved: (name) => `${name} removed.`
};
var ID_KINDS = { image: "gambar", video: "video", "audio file": "file audio", "text file": "file teks" };
var id = {
  dragFiles: "Seret file ke sini",
  dragFile: "Seret file ke sini",
  chooseFiles: "Pilih file",
  chooseFile: "Pilih file",
  chosenFiles: "File yang dipilih",
  chosenFile: "File yang dipilih",
  fileWrongType: (name, types) => types ? `${name} bukan ${new Intl.ListFormat("id", { type: "disjunction" }).format(types.map((t) => ID_KINDS[t] || t))}.` : `${name}: jenis file ini tidak diterima.`,
  fileTooLarge: (name, limit) => `${name} lebih besar dari ${limit}.`,
  fileTooMany: (name, max) => `${name} tidak ditambahkan: maksimal ${max} file.`,
  fileOnlyOne: (name) => `${name} tidak ditambahkan: hanya satu file.`,
  fileMissing: (multiple) => multiple ? "Pilih setidaknya satu file." : "Pilih file.",
  fileFolder: (name) => `${name} adalah folder: pilih file di dalamnya.`,
  fileAlreadyAdded: (name) => `${name} sudah ditambahkan.`,
  filesAdded: (names) => names.length === 1 ? `${names[0]} ditambahkan.` : `${names.length} file ditambahkan.`,
  fileRemoved: (name) => `${name} dihapus.`
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
