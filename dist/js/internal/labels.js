// src/internal/labels.ts
import { componentEn, componentId } from "../generated/labels.js";
var SHARED_LABELS = {
  close: "Close",
  dismiss: "Dismiss",
  loading: "Loading\u2026",
  copy: "Copy",
  remove: "Remove",
  image: "Image",
  page: (n) => "Page " + n,
  progress: "Progress",
  optional: "Optional",
  mainNavigation: "Main",
  menu: "Menu",
  required: "Required"
};
var DEFAULT_LABELS = /* @__PURE__ */ Object.assign({}, componentEn, SHARED_LABELS);
var idLabels = /* @__PURE__ */ Object.assign({}, componentId, {
  close: "Tutup",
  dismiss: "Abaikan",
  loading: "Memuat\u2026",
  copy: "Salin",
  remove: "Hapus",
  image: "Gambar",
  page: (n) => "Halaman " + n,
  progress: "Kemajuan",
  optional: "Opsional",
  mainNavigation: "Utama",
  menu: "Menu",
  required: "Wajib diisi"
});
export {
  DEFAULT_LABELS,
  SHARED_LABELS,
  idLabels
};
//# sourceMappingURL=labels.js.map
