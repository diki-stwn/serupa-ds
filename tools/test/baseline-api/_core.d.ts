// exports: announce, configure, type CustomIconName, customIcons, enLabels, getIcon, IconData, idLabels, MaterialIconName, type OpenChangeDetails, type OpenChangeReason, type Placement, registerIcons, type SerupaConfig, type SerupaLabels, SerupaProvider, type SerupaProviderProps, type SerupaSettings, type SerupaTheme, type Space, type ThemeBrand, type ThemeInfo, type ThemeMode, useCollator, useLocale, useSerupa, version, withoutColorTransitions
import * as React from "react";
import { IconData, MaterialIconName } from "./icons.js";
type ThemeBrand = "blue" | "emerald" | "violet";
type ThemeMode = "auto" | "dark" | "light";
interface ThemeInfo {
    brand: ThemeBrand;
    mode: ThemeMode;
    theme: string;
}
interface SerupaTheme {
    get(): ThemeInfo;
    set(choice: {
        brand?: ThemeBrand;
        mode?: ThemeMode;
    }): ThemeInfo;
    reset(): ThemeInfo;
    onChange(fn: (info: ThemeInfo) => void): () => void;
}
type Space = 0 | 0.5 | 1 | 1.5 | 10 | 11 | 12 | 14 | 16 | 2 | 2.5 | 20 | 24 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9;
type Side = "bottom" | "left" | "right" | "top";
type Placement = `${Side}-${"end" | "start"}` | Side;
type OpenChangeReason = "api" | "blur" | "close" | "escape" | "focus" | "hover" | "outside" | "select" | "swipe" | "trigger";
interface OpenChangeDetails {
    reason: OpenChangeReason;
}
interface SerupaConfig {
    link?: React.ElementType;
}
declare function configure(opts?: SerupaConfig): Required<SerupaConfig>;
type ColorHue = "black" | "blue" | "brown" | "gray" | "green" | "orange" | "pink" | "purple" | "red" | "teal" | "white" | "yellow";
type ColorTone = "" | "dark" | "light";
interface SerupaLabels extends ComponentLabels {
    close: string;
    dismiss: string;
    loading: string;
    copy: string;
    remove: string;
    image: string;
    page: (page: number) => string;
    progress: string;
    optional: string;
    mainNavigation: string;
    menu: string;
    required: string;
}
declare const DEFAULT_LABELS: SerupaLabels;
declare const idLabels: SerupaLabels;
interface SerupaProviderProps {
    locale?: string;
    labels?: Partial<SerupaLabels>;
    icons?: Array<IconData | Readonly<Record<string, IconData>>> | IconData | Readonly<Record<string, IconData>>;
    platform?: "apple" | "other";
    children?: React.ReactNode;
}
interface SerupaSettings {
    locale: string | undefined;
    labels: SerupaLabels;
    icons: ReadonlyMap<string, IconData>;
    platform: "apple" | "other" | undefined;
}
declare function SerupaProvider(props: SerupaProviderProps): React.ReactElement;
declare namespace SerupaProvider {
    var displayName: string;
}
declare function useSerupa(): SerupaSettings;
declare function useLocale(own?: string): string;
declare function announce(text: string, options?: {
    assertive?: boolean;
}): void;
declare function useCollator(options?: Intl.CollatorOptions & {
    locale?: string;
}): Intl.Collator;
declare function withoutColorTransitions(change: () => void, element?: HTMLElement): void;
type CustomIconName = never;
declare const customIcons: readonly CustomIconName[];
declare function registerIcons(...icons: Array<IconData | Readonly<Record<string, IconData>>>): void;
declare function getIcon(name: string): IconData | undefined;
declare const version: string;
type ThemeApi = SerupaTheme;
declare global {
    interface Window {
        Serupa: ComponentGlobals & {
            version: string;
            announce: typeof announce;
            configure: typeof configure;
            customIcons: typeof customIcons;
            enLabels: typeof DEFAULT_LABELS;
            getIcon: typeof getIcon;
            idLabels: typeof idLabels;
            registerIcons: typeof registerIcons;
            SerupaProvider: typeof SerupaProvider;
            useCollator: typeof useCollator;
            useLocale: typeof useLocale;
            useSerupa: typeof useSerupa;
            withoutColorTransitions: typeof withoutColorTransitions;
            theme?: ThemeApi;
        };
    }
}
