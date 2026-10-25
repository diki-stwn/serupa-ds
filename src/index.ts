/*! Serupa · React components (needs React 18+) · CHANGELOG.md */
export type { Space } from "./internal/space";
export type { Placement } from "./internal/position";
export type { OpenChangeDetails, OpenChangeReason } from "./internal/openChange";
import { configure } from "./internal/config";
export type { SerupaConfig } from "./internal/config";
import { idLabels, DEFAULT_LABELS as enLabels } from "./internal/labels";
export type { SerupaLabels } from "./internal/labels";
import { SerupaProvider, useSerupa } from "./internal/provider";
import { useCollator } from "./internal/collator";
export type { SerupaProviderProps, SerupaSettings } from "./internal/provider";
import { customIcons, getIcon, registerIcons } from "./icons";
export type { CustomIconName } from "./icons";
export type { IconData } from "./material/types";
export type { MaterialIconName } from "./material/icons";
export type { SerupaTheme, ThemeBrand, ThemeInfo, ThemeMode } from "./theme-types";

export { configure, customIcons, enLabels, getIcon, idLabels, registerIcons, SerupaProvider, useCollator, useSerupa };
// Every component folder's index.ts (generated: tools/build/registry.mjs).
export * from "./generated/components";
import type { ComponentGlobals } from "./generated/globals";

/** The system's version, e.g. "4.8.0" (semver). */
export const version: string = __VERSION__;

type ThemeApi = import("./theme-types").SerupaTheme;
declare global {
  interface Window {
    /** The components on plain pages (serupa.iife.js): everything the package exports, and theme when theme.js is loaded. */
    Serupa: ComponentGlobals & {
      /** The system's version, e.g. "4.8.0" (semver). */ version: string;
      configure: typeof configure; customIcons: typeof customIcons; enLabels: typeof enLabels; getIcon: typeof getIcon; idLabels: typeof idLabels;
      registerIcons: typeof registerIcons; SerupaProvider: typeof SerupaProvider; useCollator: typeof useCollator; useSerupa: typeof useSerupa;
      /** Present when theme.js is loaded. */ theme?: ThemeApi;
    };
  }
}
