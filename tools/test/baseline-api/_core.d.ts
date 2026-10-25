// exports: configure, type CustomIconName, customIcons, enLabels, getIcon, IconData, idLabels, MaterialIconName, type Placement, registerIcons, type SerupaConfig, type SerupaLabels, SerupaProvider, type SerupaProviderProps, type SerupaSettings, type SerupaTheme, type Space, type ThemeBrand, type ThemeInfo, type ThemeMode, useSerupa, version
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
    children?: React.ReactNode;
}
interface SerupaSettings {
    locale: string | undefined;
    labels: SerupaLabels;
    icons: ReadonlyMap<string, IconData>;
}
declare function SerupaProvider(props: SerupaProviderProps): React.ReactElement;
declare namespace SerupaProvider {
    var displayName: string;
}
declare function useSerupa(): SerupaSettings;
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
            configure: typeof configure;
            customIcons: typeof customIcons;
            enLabels: typeof DEFAULT_LABELS;
            getIcon: typeof getIcon;
            idLabels: typeof idLabels;
            registerIcons: typeof registerIcons;
            SerupaProvider: typeof SerupaProvider;
            useSerupa: typeof useSerupa;
            theme?: ThemeApi;
        };
    }
}
