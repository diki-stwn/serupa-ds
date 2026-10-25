// ColorPicker's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
import type { ColorHue, ColorTone } from "../../internal/color";

export interface ColorPickerLabels {
  /** ColorPicker: the name of a swatch given only as a hex code ("Dark blue"), from its hue and tone. */
  colorName: (hue: ColorHue, tone: ColorTone) => string;
  /** ColorPicker: the native picker's name, the hex field's name, and the contrast line under them. */
  customColor: string;
  hexCode: string;
  contrast: (ratio: string) => string;
  lowContrast: (minimum: string) => string;
}
const EN: Record<ColorHue, string> = { red: "red", orange: "orange", yellow: "yellow", green: "green", teal: "teal", blue: "blue", purple: "purple", pink: "pink", brown: "brown", gray: "gray", black: "black", white: "white" };
const ID: Record<ColorHue, string> = { red: "merah", orange: "oranye", yellow: "kuning", green: "hijau", teal: "hijau toska", blue: "biru", purple: "ungu", pink: "merah muda", brown: "cokelat", gray: "abu-abu", black: "hitam", white: "putih" };
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const en: ColorPickerLabels = {
  colorName: (hue, tone) => cap((tone ? tone + " " : "") + EN[hue]),
  customColor: "Custom color",
  hexCode: "Hex code",
  contrast: (ratio) => "Contrast " + ratio + ":1",
  lowContrast: (min) => "below " + min + ":1, which can be hard to read",
};
export const id: ColorPickerLabels = {
  colorName: (hue, tone) => cap(ID[hue] + (tone === "light" ? " muda" : tone === "dark" ? " tua" : "")),
  customColor: "Warna khusus",
  hexCode: "Kode hex",
  contrast: (ratio) => "Kontras " + ratio + ":1",
  lowContrast: (min) => "di bawah " + min + ":1, bisa sulit dibaca",
};
