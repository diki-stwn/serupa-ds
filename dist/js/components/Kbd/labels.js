// src/components/Kbd/labels.ts
var en = {
  keyName: (name) => name
};
var ID_KEYS = {
  "Up arrow": "Panah atas",
  "Down arrow": "Panah bawah",
  "Left arrow": "Panah kiri",
  "Right arrow": "Panah kanan",
  Space: "Spasi",
  Delete: "Hapus",
  Backspace: "Hapus mundur",
  "Page Up": "Halaman atas",
  "Page Down": "Halaman bawah",
  Function: "Fungsi"
};
var id = {
  keyName: (name) => ID_KEYS[name] || name
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
