/*! Serupa · React components (needs React 19) · CHANGELOG.md */
export type { Space } from "./internal/space";
export type { Placement } from "./internal/position";
export type { OpenChangeDetails, OpenChangeReason } from "./internal/openChange";
import { configure } from "./internal/config";
export type { SerupaConfig } from "./internal/config";
import { idLabels, DEFAULT_LABELS as enLabels } from "./internal/labels";
export type { SerupaLabels } from "./internal/labels";
import { SerupaProvider, useLocale, useSerupa } from "./internal/provider";
import { announce } from "./internal/announce";
import { announcePage } from "./internal/announcePage";
export type { AnnouncePageOptions } from "./internal/announcePage";
import { useCollator } from "./internal/collator";
import { plural } from "./internal/plural";
export type { PluralForms } from "./internal/plural";
import { withoutTransitions } from "./internal/withoutTransitions";
import { withViewTransition } from "./internal/viewTransition";
export type { SerupaProviderProps, SerupaSettings } from "./internal/provider";
import { customIcons, getIcon, registerIcons } from "./icons";
export type { CustomIconName } from "./icons";
export type { IconData } from "./material/types";
export type { MaterialIconName } from "./material/icons";
export type { SerupaTheme, ThemeBrand, ThemeInfo, ThemeMode } from "./theme-types";

export { announce, announcePage, configure, customIcons, enLabels, getIcon, idLabels, plural, registerIcons, SerupaProvider, useCollator, useLocale, useSerupa, withoutTransitions, withViewTransition };
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
      announce: typeof announce; announcePage: typeof announcePage; configure: typeof configure; customIcons: typeof customIcons; enLabels: typeof enLabels; getIcon: typeof getIcon; idLabels: typeof idLabels; plural: typeof plural;
      registerIcons: typeof registerIcons; SerupaProvider: typeof SerupaProvider; useCollator: typeof useCollator; useLocale: typeof useLocale; useSerupa: typeof useSerupa;
      withoutTransitions: typeof withoutTransitions; withViewTransition: typeof withViewTransition;
      /** Present when theme.js is loaded. */ theme?: ThemeApi;
    };
    /** Every Material Symbol, once serupa-icons.iife.js has run (serupa.iife.js adds it when an Icon needs it). */
    SerupaIcons?: Readonly<Record<string, unknown>>;
  }
}
