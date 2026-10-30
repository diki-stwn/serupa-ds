// src/components/ColorPicker/labels.ts
var EN = { red: "red", orange: "orange", yellow: "yellow", green: "green", teal: "teal", blue: "blue", purple: "purple", pink: "pink", brown: "brown", gray: "gray", black: "black", white: "white" };
var ID = { red: "merah", orange: "oranye", yellow: "kuning", green: "hijau", teal: "hijau toska", blue: "biru", purple: "ungu", pink: "merah muda", brown: "cokelat", gray: "abu-abu", black: "hitam", white: "putih" };
var cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
var en = {
  colorName: (hue, tone) => cap((tone ? tone + " " : "") + EN[hue]),
  customColor: "Custom color",
  hexCode: "Hex code",
  contrast: (ratio) => "Contrast " + ratio + ":1",
  lowContrast: (min) => "below " + min + ":1, which can be hard to read"
};
var id = {
  colorName: (hue, tone) => cap(ID[hue] + (tone === "light" ? " muda" : tone === "dark" ? " tua" : "")),
  customColor: "Warna khusus",
  hexCode: "Kode hex",
  contrast: (ratio) => "Kontras " + ratio + ":1",
  lowContrast: (min) => "di bawah " + min + ":1, bisa sulit dibaca"
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
