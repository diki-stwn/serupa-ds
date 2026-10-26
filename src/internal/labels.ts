// The words the components say or show on their own, in English, and the same words in Indonesian.
// SerupaProvider (internal/provider.tsx) picks between them; a component's own prop still wins.
// Words only one component says live in that component's labels.ts; the ones here are shared.
import { componentEn, componentId, type ComponentLabels } from "../generated/labels";

/** The words the components say or show on their own: button names, region names, empty and loading text.
    <SerupaProvider labels> changes them for a subtree; a component's own prop (closeLabel, dismissLabel, …)
    still wins for that one instance. */
export interface SerupaLabels extends ComponentLabels {
  /** Dialog and Drawer × button. */
  close: string;
  /** Alert and Toast close button. */
  dismiss: string;
  /** Loader, and Button and Badge while loading. */
  loading: string;
  /** CopyButton: its label, what it says once it has copied, and when copying fails. */
  copy: string;
  /** Before the name on a remove button: Badge ("Remove Design"), FileUpload ("Remove report.pdf"). */
  remove: string;
  /** Image view and remove buttons, and the viewer's name when the image has no alt text. */
  image: string;
  /** Pagination. */
  page: (page: number) => string;
  /** Stepper: its name, and the words read out or shown for a step. */
  progress: string;
  optional: string;
  /** Sidebar and Navbar nav, and the Navbar menu button. */
  mainNavigation: string;
  menu: string;
  /** FileUpload: read out with the choose button when the upload is required (a button can't carry aria-required). */
  required: string;
}

/** The shared words only (SerupaLabels less each component's own). */
export type SharedLabels = Omit<SerupaLabels, keyof ComponentLabels>;

/** The shared English words: the defaults every component starts from. A component's own words come from its
    labels.ts through useLabels (internal/provider.tsx), so a bundle carries only the words of the components in it. */
export const SHARED_LABELS: SharedLabels = {
  close: "Close",
  dismiss: "Dismiss",
  loading: "Loading…",
  copy: "Copy",
  remove: "Remove",
  image: "Image",
  page: (n) => "Page " + n,
  progress: "Progress",
  optional: "Optional",
  mainNavigation: "Main",
  menu: "Menu",
  required: "Required",
};

/** Every English word, shared and each component's (enLabels). */
// Object.assign marked pure, so a bundler drops the set a project doesn't import (see src/generated/labels.ts).
export const DEFAULT_LABELS: SerupaLabels = /* @__PURE__ */ Object.assign({}, componentEn, SHARED_LABELS);

/** The same words in Indonesian: `<SerupaProvider locale="id-ID" labels={idLabels}>`. */
export const idLabels: SerupaLabels = /* @__PURE__ */ Object.assign({}, componentId, {
  close: "Tutup",
  dismiss: "Abaikan",
  loading: "Memuat…",
  copy: "Salin",
  remove: "Hapus",
  image: "Gambar",
  page: (n) => "Halaman " + n,
  progress: "Kemajuan",
  optional: "Opsional",
  mainNavigation: "Utama",
  menu: "Menu",
  required: "Wajib diisi",
} satisfies Omit<SerupaLabels, keyof ComponentLabels>);
