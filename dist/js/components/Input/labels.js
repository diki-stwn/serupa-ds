// src/components/Input/labels.ts
var en = {
  charactersLeft: (left) => left === 0 ? "Character limit reached." : left === 1 ? "1 character left." : left + " characters left.",
  invalidValue: () => ""
};
var id = {
  charactersLeft: (left) => left === 0 ? "Batas karakter tercapai." : "Sisa " + left + " karakter.",
  invalidValue: (p) => {
    switch (p.reason) {
      case "valueMissing":
        return "Isi kolom ini.";
      case "typeMismatch":
        return p.type === "email" ? "Masukkan alamat email yang benar." : "Masukkan nilai yang benar.";
      case "badInput":
        return "Masukkan angka.";
      case "tooShort":
        return "Minimal " + p.minLength + " karakter (sekarang " + p.length + ").";
      case "tooLong":
        return "Maksimal " + p.maxLength + " karakter (sekarang " + p.length + ").";
      case "rangeUnderflow":
        return "Nilai harus " + p.min + " atau lebih.";
      case "rangeOverflow":
        return "Nilai harus " + p.max + " atau kurang.";
      case "stepMismatch":
        return "Masukkan nilai kelipatan " + p.step + ".";
      case "patternMismatch":
        return "Ikuti format yang diminta." + (p.title ? " " + p.title : "");
    }
  }
};
export {
  en,
  id
};
//# sourceMappingURL=labels.js.map
