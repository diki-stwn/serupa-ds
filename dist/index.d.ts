import * as React from 'react';

type ThemeBrand = 'blue' | 'violet' | 'emerald';
type ThemeMode = 'auto' | 'light' | 'dark';
interface ThemeInfo {
    brand: ThemeBrand; /** What was asked for. */
    mode: ThemeMode; /** What is applied, e.g. "violet-dark". */
    theme: string;
}
/** theme.js (standalone, no React): picks the page theme and follows the system's light/dark setting. */
interface SerupaTheme {
    get(): ThemeInfo;
    /** Change and remember the choice in this browser. Unknown values are ignored. */
    set(choice: {
        brand?: ThemeBrand;
        mode?: ThemeMode;
    }): ThemeInfo;
    /** Forget the choice; back to the page's data-brand / data-mode. */
    reset(): ThemeInfo;
    /** Called after every change; returns an unsubscribe function. */
    onChange(fn: (info: ThemeInfo) => void): () => void;
}

type Space = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 14 | 16 | 20 | 24;

type Side = 'top' | 'bottom' | 'left' | 'right';
type Placement = Side | `${Side}-${'start' | 'end'}`;

/** Why an overlay asks to open or close, passed to onOpenChange as { reason }.
    'trigger': its trigger was pressed. 'escape': Escape was pressed. 'outside': a press outside it.
    'blur': focus moved somewhere else. 'close': its close button, or a close() it handed you, such as a Done button's.
    'api': the browser closed it itself, as dialog.close() or a form with method="dialog" do.
    'select': an item in it was chosen, as a MenuItem is.
    'hover': the pointer came onto its element or left it. 'focus': its element took focus from the keyboard.
    'swipe': a touch drag flung it back toward its edge, as on a Drawer. */
type OpenChangeReason = "trigger" | "escape" | "outside" | "blur" | "close" | "api" | "select" | "hover" | "focus" | "swipe";
/** The second argument of onOpenChange. */
interface OpenChangeDetails {
    reason: OpenChangeReason;
}

interface SerupaConfig {
    /** Renders a Button with href, such as a router's Link (Next.js: Link; React Router: a component that maps href to to). Receives href, className, ref, event handlers and children. Default: 'a'. */
    link?: React.ElementType;
}
/** Set once at startup; returns the current settings. */
declare function configure(opts?: SerupaConfig): Required<SerupaConfig>;

interface AccordionLabels {
    /** Accordion with showExpandAll: the button that opens every item, and the one that closes them all. */
    expandAll: string;
    collapseAll: string;
}

interface AvatarLabels {
    /** Avatar: the status read after the name ("Ana Lim, online"). */
    avatarStatus: (status: "online" | "busy" | "away" | "offline") => string;
}

interface AvatarGroupLabels {
    /** AvatarGroup: the name of the "+N" avatar. */
    avatarMore: (count: number) => string;
}

interface BreadcrumbLabels {
    /** Breadcrumb, and its "…" button. */
    breadcrumb: string;
    showHiddenPages: string;
    /** Breadcrumb with collapse="menu": the "…" button and the menu it opens. */
    morePages: string;
}

interface CalendarLabels {
    /** Calendar month buttons. */
    previousMonth: string;
    nextMonth: string;
    /** Calendar monthYearPicker menus. */
    month: string;
    year: string;
}

interface CarouselLabels {
    /** Carousel arrows. */
    previousSlide: string;
    nextSlide: string;
    /** Carousel: each slide's name, and its dot's ("2 of 5"). */
    slideOf: (slide: number, total: number) => string;
    /** Carousel with perView: a dot's name, the slides its page shows ("1–3 of 7"). */
    slidesOf: (first: number, last: number, total: number) => string;
    /** What a screen reader calls the carousel and each slide (aria-roledescription). */
    carouselRole: string;
    slideRole: string;
}

interface CheckboxLabels {
    /** CheckboxGroup with required: what the browser says when the form is sent with no box checked. */
    selectAtLeastOne: string;
}

type ColorHue = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'brown' | 'gray' | 'black' | 'white';
type ColorTone = 'light' | 'dark' | '';

interface ColorPickerLabels {
    /** ColorPicker: the name of a swatch given only as a hex code ("Dark blue"), from its hue and tone. */
    colorName: (hue: ColorHue, tone: ColorTone) => string;
    /** ColorPicker: the native picker's name, the hex field's name, and the contrast line under them. */
    customColor: string;
    hexCode: string;
    contrast: (ratio: string) => string;
    lowContrast: (minimum: string) => string;
}

interface ComboboxLabels {
    /** Combobox while loading options. */
    loadingResults: string;
    /** Combobox when loadOptions rejects. */
    loadFailed: string;
    /** Combobox when nothing matches. */
    noResults: string;
    /** Combobox, said once typing stops: how many options match. */
    resultsCount: (count: number) => string;
    /** Combobox, under the list when more options match than it shows: how many more. */
    moreResults: (count: number) => string;
    /** Combobox chevron button. */
    showOptions: string;
    /** Combobox × button, with the field's label when it has one ("Clear Country"). */
    clearValue: (label: string) => string;
    /** Combobox with multiple, read out when an option is picked and its tag added ("Design added"). */
    valueAdded: (label: string) => string;
    /** Combobox with multiple, read out when a tag is removed ("Design removed"). */
    valueRemoved: (label: string) => string;
}

interface CommandPaletteLabels {
    /** CommandPalette: the dialog's name, and what its shortcut does in <KeyboardShortcuts>. */
    commandPalette: string;
    /** CommandPalette: the search field's placeholder and name. */
    searchCommands: string;
    /** CommandPalette: shown, and said, when nothing matches what was typed. */
    noCommands: string;
    /** CommandPalette: said once typing stops, with how many commands match. */
    commandsCount: (count: number) => string;
    /** CommandPalette: the group for commands given no group. */
    otherCommands: string;
}

interface CopyButtonLabels {
    /** CopyButton: its label, what it says once it has copied, and when copying fails. */
    copied: string;
    copyFailed: string;
}

interface DatePickerLabels {
    /** DatePicker, DateRangePicker and TimePicker. */
    chooseDate: string;
    /** DatePicker, DateRangePicker and TimePicker: said when typed text is put back because it isn't a value the field takes. */
    inputNotAccepted: (text: string) => string;
    /** DatePicker, DateRangePicker and TimePicker: the format to type, read after the field's name ("dd/mm/yyyy", "hh:mm"). */
    formatHint: (pattern: string) => string;
}

interface DateRangePickerLabels {
    /** DatePicker, DateRangePicker and TimePicker. */
    chooseDates: string;
    startDate: string;
    endDate: string;
    chooseStartDate: string;
    chooseEndDate: string;
}

interface DialogLabels {
    /** Dialog with unsaved: the question asked before it closes, the line under it, and its two buttons. */
    discardTitle: string;
    discardDescription: string;
    discard: string;
    keepEditing: string;
}

interface EmptyStateLabels {
    /** EmptyState with suggestions: the words before the searches to try instead ("Did you mean: mars"). */
    didYouMean: string;
    /** EmptyState with onClearFilters: the button that clears the search and filters. */
    clearFilters: string;
}

interface ErrorBoundaryLabels {
    /** ErrorBoundary: the default fallback's title, its message and its retry button. */
    errorTitle: string;
    errorDescription: string;
    tryAgain: string;
}

interface ErrorSummaryLabels {
    /** ErrorSummary: its heading, from how many errors it lists. */
    errorSummaryTitle: (count: number) => string;
}

interface FieldLabels {
    /** Field: after the label with optional. */
    fieldOptional: string;
}

interface FileUploadLabels {
    /** FileUpload. */
    dragFiles: string;
    dragFile: string;
    chooseFiles: string;
    chooseFile: string;
    chosenFiles: string;
    chosenFile: string;
    /** FileUpload's messages for a refused file. types: what accept allows, in short names ("image", "PDF"), or null
        when a type has no short name. */
    fileWrongType: (name: string, types: string[] | null) => string;
    fileTooLarge: (name: string, limit: string) => string;
    fileTooMany: (name: string, max: number) => string;
    fileOnlyOne: (name: string) => string;
    /** FileUpload: shown when a form is submitted without a required file. */
    fileMissing: (multiple: boolean) => string;
    /** FileUpload: a dropped folder (only files can be added), and a file that's already in the list. */
    fileFolder: (name: string) => string;
    fileAlreadyAdded: (name: string) => string;
    /** FileUpload: said to screen readers as files are added (their names) and removed. */
    filesAdded: (names: string[]) => string;
    fileRemoved: (name: string) => string;
}

interface ImageLabels {
    /** Image view and remove buttons, and the viewer's name when the image has no alt text. */
    viewImage: string;
    removeImage: string;
}

interface InlineEditLabels {
    /** InlineEdit: after the text in its button's name ("Project name: Apollo, Edit"). */
    edit: string;
}

/** A native constraint an Input's or a Textarea's value fails, for the invalidValue label: which one (the
    ValidityState flag that is set), and what the field asks for. */
interface ValidityProblem {
    reason: 'valueMissing' | 'typeMismatch' | 'badInput' | 'tooShort' | 'tooLong' | 'rangeUnderflow' | 'rangeOverflow' | 'stepMismatch' | 'patternMismatch';
    /** The field's type ("email", "number", "text"…; "textarea" for a Textarea). */
    type: string;
    /** How many characters the value has now. */
    length: number;
    minLength?: number;
    maxLength?: number;
    min?: string;
    max?: string;
    step?: string;
    /** The field's title, which browsers add to a pattern message. */
    title?: string;
}
interface InputLabels {
    /** Input and Textarea with showCount and maxLength: read out when few characters are left, and at the limit
        (left is 0). Not on every keystroke. */
    charactersLeft: (left: number) => string;
    /** Input and Textarea: the message the browser shows for a native constraint the value fails (required, type,
        minLength, maxLength, min, max, step, pattern), in the provider's language rather than the browser's. ""
        keeps the browser's own message, which English does, since the browser already speaks its user's language. */
    invalidValue: (problem: ValidityProblem) => string;
}

interface KbdLabels {
    /** Kbd: what screen readers hear for a named key, from its English name ("Up arrow", "Command", "Space"). */
    keyName: (name: string) => string;
}

interface KeyboardShortcutsLabels {
    /** KeyboardShortcuts: the help dialog's title. */
    keyboardShortcuts: string;
    /** KeyboardShortcuts: the group for shortcuts given no group. */
    generalShortcuts: string;
    /** KeyboardShortcuts: what "?" does, listed in the dialog. */
    showShortcuts: string;
}

interface LinkLabels {
    /** Link with external: read after the link text. */
    opensInNewTab: string;
}

interface LoadMoreLabels {
    /** LoadMore: the button. */
    loadMore: string;
    /** LoadMore with count and total: how many are shown ("Showing 20 of 134"); the numbers come formatted. */
    showingOf: (shown: string, total: string) => string;
    /** LoadMore: announced when a load adds items, with how many ("20 more loaded"). */
    loadedMore: (added: string) => string;
    /** LoadMore without count: announced when a load finishes. */
    moreLoaded: string;
    /** LoadMore: shown in place of the button once there's nothing more. */
    allLoaded: string;
}

type MeterZone = 'low' | 'medium' | 'high';
interface MeterLabels {
    /** Meter: read out after the value when it's outside the best zone, so the warning the color gives is heard too
        ("92%, high"). zone is where the value falls: under low, between low and high, or over high. */
    meterZone: (value: string, zone: MeterZone) => string;
}

interface NotificationCenterLabels {
    /** NotificationCenter: the drawer's title. */
    notificationCenter: string;
    /** NotificationCenter: what shows when there are none. */
    noNotifications: string;
    /** NotificationCenter: read before an unread one's title. */
    unreadNotification: string;
    /** NotificationCenter: the button on an unread one. */
    markRead: string;
    /** NotificationCenter: the footer button that marks every one read. */
    markAllRead: string;
    /** NotificationCenter: the footer button that empties the list. */
    clearNotifications: string;
}

interface NumberInputLabels {
    /** NumberInput step buttons. */
    decrease: string;
    increase: string;
}

interface PaginationLabels {
    /** Pagination. */
    pagination: string;
    previousPage: string;
    nextPage: string;
    /** The summary with total and pageSize: "21–30 of 245" (the numbers come in the locale's digits and grouping). */
    itemsOf: (first: string, last: string, total: string) => string;
    /** The page-size select's label, with pageSizeOptions. */
    perPage: string;
}

interface PasswordInputLabels {
    /** PasswordInput show/hide button. */
    showPassword: string;
    /** PasswordInput: shown in the field and read out while Caps Lock is on. */
    capsLockOn: string;
}

interface PhoneInputLabels {
    /** PhoneInput's country menu. */
    country: string;
}

interface ProgressLabels {
    /** Progress with announceComplete: said when it reaches max. name is its label or aria-label, or "" without one. */
    progressComplete: (name: string) => string;
}

interface RatingLabels {
    /** Each Rating choice's name, for a value: "1 star", "3.5 stars". */
    ratingStars: (value: number) => string;
    /** A read-only Rating's name: "4.5 out of 5". */
    ratingValue: (value: number, max: number) => string;
}

interface SaveStatusLabels {
    /** SaveStatus: while changes are being saved. */
    saving: string;
    /** SaveStatus: once they're saved, shown before how long ago ("Saved 2 minutes ago") and announced alone. */
    saved: string;
    /** SaveStatus: when saving failed. */
    saveFailed: string;
    /** SaveStatus: the button that tries saving again. */
    retrySave: string;
}

interface SearchInputLabels {
    /** SearchInput while loading. */
    searching: string;
    /** SearchInput clear button. */
    clearSearch: string;
}

interface SkipLinkLabels {
    /** SkipLink: the link's text when it has no children. */
    skipToContent: string;
}

interface SliderLabels {
    /** A range Slider's thumb names. */
    sliderMinimum: string;
    sliderMaximum: string;
}

interface SortableListLabels {
    /** SortableList: before an item's name on its handle ("Reorder Apollo"), the handle's instructions, and what it
        says as an item is picked up, moved, dropped or put back ("Apollo, position 2 of 5"). */
    reorder: string;
    reorderInstructions: string;
    reorderGrabbed: (item: string, position: number, total: number) => string;
    reorderMoved: (item: string, position: number, total: number) => string;
    reorderDropped: (item: string, position: number, total: number) => string;
    reorderCancelled: (item: string, position: number, total: number) => string;
}

interface SplitterLabels {
    /** Splitter's handle, when it has no separatorLabel. */
    resizePanes: string;
    /** Said after a press on the handle that didn't drag it: the next press in the Splitter puts the handle there. */
    splitterPlace: string;
}

interface StepperLabels {
    /** Stepper: its name, and the words read out or shown for a step. */
    completed: string;
    hasError: string;
    /** Stepper: read after the title of a step with status "warning". */
    hasWarning: string;
    /** Stepper, when the steps don't fit side by side and it shows only the current step's title: "Step 2 of 4". */
    stepOf: (step: number, total: number) => string;
}

interface TableLabels {
    /** Table's scroll region when it has no caption. */
    table: string;
    /** Table: read out when a sortable column's order changes ("Sorted by Amount, ascending"). */
    tableSorted: (column: string, direction: 'ascending' | 'descending') => string;
    /** TableActionBar: how many rows are selected, shown and read out ("3 selected"). */
    tableSelected: (count: number) => string;
    /** TableActionBar: the button that clears the selection. */
    clearSelection: string;
}

interface TimePickerLabels {
    /** DatePicker, DateRangePicker and TimePicker. */
    chooseTime: string;
}

interface ToastLabels {
    /** Toaster region. */
    notifications: string;
    /** Toaster: said once, after the first toast with an action, so keyboard and screen reader users know how to reach it. */
    toastShortcut: (key: string) => string;
    /** Toaster: the line for toasts waiting past the limit. */
    moreToasts: (count: number) => string;
    /** A toast shown again while it was still up: the count read with it and said once the burst stops ("12 times"). */
    toastRepeated: (count: number) => string;
    /** toast.undo: the button that takes the action back. */
    undo: string;
}

interface TypeToConfirmLabels {
    /** TypeToConfirm: the words before the phrase in its label ("To confirm, type" acme/web). */
    typeToConfirm: string;
    /** TypeToConfirm: why the button can't be pressed yet, its description until the phrase is typed. */
    typePhraseFirst: (phrase: string) => string;
}

/** The words each component brings, from its own labels.ts. */
type ComponentLabels = AccordionLabels & AvatarLabels & AvatarGroupLabels & BreadcrumbLabels & CalendarLabels & CarouselLabels & CheckboxLabels & ColorPickerLabels & ComboboxLabels & CommandPaletteLabels & CopyButtonLabels & DatePickerLabels & DateRangePickerLabels & DialogLabels & EmptyStateLabels & ErrorBoundaryLabels & ErrorSummaryLabels & FieldLabels & FileUploadLabels & ImageLabels & InlineEditLabels & InputLabels & KbdLabels & KeyboardShortcutsLabels & LinkLabels & LoadMoreLabels & MeterLabels & NotificationCenterLabels & NumberInputLabels & PaginationLabels & PasswordInputLabels & PhoneInputLabels & ProgressLabels & RatingLabels & SaveStatusLabels & SearchInputLabels & SkipLinkLabels & SliderLabels & SortableListLabels & SplitterLabels & StepperLabels & TableLabels & TimePickerLabels & ToastLabels & TypeToConfirmLabels;

/** The words the components say or show on their own: button names, region names, empty and loading text.
    <SerupaProvider labels> changes them for a subtree; a component's own prop (closeLabel, dismissLabel, …)
    still wins for that one instance. */
interface SerupaLabels extends ComponentLabels {
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
/** Every English word, shared and each component's (enLabels). */
declare const DEFAULT_LABELS: SerupaLabels;
/** The same words in Indonesian: `<SerupaProvider locale="id-ID" labels={idLabels}>`. */
declare const idLabels: SerupaLabels;

/** One Material Symbols icon: its name and its outline, one SVG path on the font's 960-unit grid
 * (viewBox "0 -960 960 960"). Import them from serupa-ds/icons: `import { Add } from "serupa-ds/icons"`. */
interface IconData {
    readonly name: string;
    readonly d: string;
}

interface SerupaProviderProps {
    /** A BCP 47 locale (such as "id-ID") for Calendar, DatePicker, DateRangePicker, TimePicker and NumberInput: how dates, times and numbers
     *  are written and typed, month and weekday names, and the first day of the week. Default: the browser's.
     *  "en_US" is read as "en-US"; one Intl can't read is skipped, with a warning in development. */
    locale?: string;
    /** Replaces some or all of the words the components say on their own, such as { close: "Tutup" }, or a whole
     *  set (idLabels). Keys left out keep the outer provider's words, else English. */
    labels?: Partial<SerupaLabels>;
    /** Icons that work by name inside this provider, in the shape registerIcons takes: one icon, or a module of them. */
    icons?: Array<IconData | Readonly<Record<string, IconData>>> | IconData | Readonly<Record<string, IconData>>;
    /** The device's platform, for Kbd's key names (⌘ or Ctrl): 'apple' or 'other'. Set it from the request (the
     *  User-Agent or Sec-CH-UA-Platform header) so the server writes the right keys and nothing changes on hydration.
     *  Default: found on the device after it mounts. */
    platform?: 'apple' | 'other';
    /** The part of the page these settings apply to. */
    children?: React.ReactNode;
}
/** What the components read: the nearest provider's settings, merged with the outer ones. */
interface SerupaSettings {
    locale: string | undefined;
    labels: SerupaLabels;
    icons: ReadonlyMap<string, IconData>;
    platform: 'apple' | 'other' | undefined;
}
/** Locale, built-in words and extra icons for every component inside it. A component's own prop still wins. */
declare function SerupaProvider(props: SerupaProviderProps): React.ReactElement;
declare namespace SerupaProvider {
    var displayName: string;
}
/** The nearest SerupaProvider's settings, or the defaults (browser locale, English words) without one. */
declare function useSerupa(): SerupaSettings;
/** The locale a component uses: its own prop, else the nearest SerupaProvider's, else the browser's (en-US until hydrated).
 *  A malformed one is mended ("en_US" to "en-US") or skipped, never passed to Intl to throw. */
declare function useLocale(own?: string): string;

/** Says text to screen readers through the live regions the components use, which move into an open Dialog or Drawer
 *  so they're heard there too. A burst is said as one message. assertive interrupts what's being read: only for errors. */
declare function announce(text: string, options?: {
    assertive?: boolean;
}): void;

/** What announcePage takes: the title to say (default: document.title), and where focus goes (default: the h1 in
 * <main>, else the first h1, else <main>; an element or a selector; false leaves focus where it is). */
interface AnnouncePageOptions {
    title?: string;
    focus?: Element | string | false;
}
/** After a client-side route change: focuses the new page's main heading and says its title to screen readers. */
declare function announcePage(options?: AnnouncePageOptions): void;

/** An `Intl.Collator` for the locale the components use (the given one, else the nearest SerupaProvider's, else the
 *  browser's), for sorting options and table rows the way people expect: "Äpfel" beside "Apfel" in German,
 *  "Item 2" before "Item 10". `rows.sort((a, b) => compare(a.name, b.name))` with `const { compare } = useCollator()`.
 *  Pass `sensitivity: "base"` to treat "a", "A" and "á" as the same, or `numeric: false` to compare digits one by one. */
declare function useCollator(options?: Intl.CollatorOptions & {
    locale?: string;
}): Intl.Collator;

/** The words for a count in each plural category a language has (CLDR: zero, one, two, few, many, other). Only
 *  `other` is required; a category left out falls back to it. A `#` stands for the count, written the locale's way. */
interface PluralForms {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
}
/** The words for `count` in `locale`'s plural rules (Intl.PluralRules), with `#` replaced by the count. For labels whose
 *  words change with a number, in languages with more than "1" and "the rest":
 *  `resultsCount: (n) => plural("ru", n, { one: "# результат", few: "# результата", many: "# результатов", other: "# результата" })`.
 *  A locale Intl can't read is treated as English. */
declare function plural(locale: string, count: number, forms: PluralForms): string;

/** Runs `change` (such as setting data-theme on a section) and finishes the color transitions it starts in `element` and
 *  everything inside it, so the new theme's colors arrive at once instead of fading control by control. Motion (opacity,
 *  scale, translate) runs on. theme.js does this for the page. */
declare function withoutTransitions(change: () => void, element?: HTMLElement): void;

/** Runs `update` (a state change, a DOM change) as a View Transition, so what it moves glides to its new place instead of
 *  jumping: a list reordered or filtered, a card expanded, a layout switched. Give each element that should travel a
 *  `view-transition-name` (or the `view-transition-match` utility class). React state set inside `update` is flushed
 *  synchronously, so the new layout is in place when the browser takes its "after" picture. `types` are View Transition
 *  types for your own `:active-view-transition-type()` styles. Resolves when the transition has finished (at once
 *  without one). */
declare function withViewTransition(update: () => void, options?: {
    types?: string[];
}): Promise<void>;

/** Names of the custom icons (tools/icons/build.mjs). Empty (never) until you add some. */
type CustomIconName = never;
/** Names of your custom icons, sorted. */
declare const customIcons: readonly CustomIconName[];
/** Adds icons that work by name. Every Material Symbol already does; use this for an icon of your own in the same shape
 * (`{ name, d }`, drawn on Material's 960-unit grid): `registerIcons(MyIcon)` or a whole module. To draw every icon on
 * the first render (server rendering, say), register the full set first: `registerIcons(await import("serupa-ds/icons"))`. */
declare function registerIcons(...icons: Array<IconData | Readonly<Record<string, IconData>>>): void;
/** The Material Symbol for a name, if it is registered or already loaded. */
declare function getIcon(name: string): IconData | undefined;

/** Every Material Symbol name, for autocomplete. */
type MaterialIconName = "10k" | "10mp" | "11mp" | "123" | "12mp" | "13mp" | "14mp" | "15mp" | "16mp" | "17mp" | "18_up_rating" | "18mp" | "19mp" | "1k" | "1k_plus" | "1x_mobiledata" | "1x_mobiledata_badge" | "20mp" | "21mp" | "22mp" | "23mp" | "24fps_select" | "24mp" | "2d" | "2k" | "2k_plus" | "2mp" | "30fps" | "30fps_select" | "360" | "3d_rotation" | "3g_mobiledata" | "3g_mobiledata_badge" | "3k" | "3k_plus" | "3mp" | "3p" | "4g_mobiledata" | "4g_mobiledata_badge" | "4g_plus_mobiledata" | "4k" | "4k_plus" | "4mp" | "50mp" | "5g" | "5g_mobiledata_badge" | "5k" | "5k_plus" | "5mp" | "60fps" | "60fps_select" | "6_ft_apart" | "6k" | "6k_plus" | "6mp" | "7k" | "7k_plus" | "7mp" | "8k" | "8k_plus" | "8mp" | "9k" | "9k_plus" | "9mp" | "abc" | "ac_unit" | "access_alarm" | "access_alarms" | "access_time" | "access_time_filled" | "accessibility" | "accessibility_new" | "accessible" | "accessible_forward" | "account_balance" | "account_balance_wallet" | "account_box" | "account_child" | "account_child_invert" | "account_circle" | "account_circle_filled" | "account_circle_off" | "account_tree" | "action_key" | "activity_zone" | "acute" | "ad" | "ad_group" | "ad_group_off" | "ad_off" | "ad_units" | "adaptive_audio_mic" | "adaptive_audio_mic_off" | "adb" | "add" | "add_2" | "add_a_photo" | "add_ad" | "add_alarm" | "add_alert" | "add_box" | "add_business" | "add_call" | "add_card" | "add_chart" | "add_circle" | "add_circle_outline" | "add_column_left" | "add_column_right" | "add_comment" | "add_diamond" | "add_home" | "add_home_work" | "add_ic_call" | "add_link" | "add_location" | "add_location_alt" | "add_moderator" | "add_notes" | "add_photo_alternate" | "add_reaction" | "add_road" | "add_row_above" | "add_row_below" | "add_shopping_cart" | "add_task" | "add_to_drive" | "add_to_home_screen" | "add_to_photos" | "add_to_queue" | "add_triangle" | "addchart" | "adf_scanner" | "adjust" | "admin_meds" | "admin_panel_settings" | "ads_click" | "agender" | "agriculture" | "air" | "air_freshener" | "air_purifier" | "air_purifier_gen" | "airline_seat_flat" | "airline_seat_flat_angled" | "airline_seat_individual_suite" | "airline_seat_legroom_extra" | "airline_seat_legroom_normal" | "airline_seat_legroom_reduced" | "airline_seat_recline_extra" | "airline_seat_recline_normal" | "airline_stops" | "airlines" | "airplane_ticket" | "airplanemode_active" | "airplanemode_inactive" | "airplay" | "airport_shuttle" | "airware" | "airwave" | "alarm" | "alarm_add" | "alarm_off" | "alarm_on" | "alarm_smart_wake" | "album" | "align_center" | "align_end" | "align_flex_center" | "align_flex_end" | "align_flex_start" | "align_horizontal_center" | "align_horizontal_left" | "align_horizontal_right" | "align_items_stretch" | "align_justify_center" | "align_justify_flex_end" | "align_justify_flex_start" | "align_justify_space_around" | "align_justify_space_between" | "align_justify_space_even" | "align_justify_stretch" | "align_self_stretch" | "align_space_around" | "align_space_between" | "align_space_even" | "align_start" | "align_stretch" | "align_vertical_bottom" | "align_vertical_center" | "align_vertical_top" | "all_inbox" | "all_inclusive" | "all_match" | "all_out" | "allergies" | "allergy" | "alt_route" | "alternate_email" | "altitude" | "ambient_screen" | "ambulance" | "amend" | "amp_stories" | "analytics" | "anchor" | "android" | "animated_images" | "animation" | "announcement" | "aod" | "aod_tablet" | "aod_watch" | "apartment" | "api" | "apk_document" | "apk_install" | "app_badging" | "app_blocking" | "app_promo" | "app_registration" | "app_settings_alt" | "app_shortcut" | "apparel" | "approval" | "approval_delegation" | "apps" | "apps_outage" | "aq" | "aq_indoor" | "ar_on_you" | "ar_stickers" | "architecture" | "archive" | "area_chart" | "arming_countdown" | "arrow_and_edge" | "arrow_back" | "arrow_back_2" | "arrow_back_ios" | "arrow_back_ios_new" | "arrow_circle_down" | "arrow_circle_left" | "arrow_circle_right" | "arrow_circle_up" | "arrow_cool_down" | "arrow_downward" | "arrow_downward_alt" | "arrow_drop_down" | "arrow_drop_down_circle" | "arrow_drop_up" | "arrow_forward" | "arrow_forward_ios" | "arrow_insert" | "arrow_left" | "arrow_left_alt" | "arrow_menu_close" | "arrow_menu_open" | "arrow_or_edge" | "arrow_outward" | "arrow_range" | "arrow_right" | "arrow_right_alt" | "arrow_selector_tool" | "arrow_split" | "arrow_top_left" | "arrow_top_right" | "arrow_upload_progress" | "arrow_upload_ready" | "arrow_upward" | "arrow_upward_alt" | "arrow_warm_up" | "arrows_input" | "arrows_more_down" | "arrows_more_up" | "arrows_output" | "arrows_outward" | "art_track" | "article" | "article_shortcut" | "artist" | "aspect_ratio" | "assessment" | "assignment" | "assignment_add" | "assignment_ind" | "assignment_late" | "assignment_return" | "assignment_returned" | "assignment_turned_in" | "assist_walker" | "assistant" | "assistant_device" | "assistant_direction" | "assistant_navigation" | "assistant_on_hub" | "assistant_photo" | "assured_workload" | "asterisk" | "astrophotography_auto" | "astrophotography_off" | "atm" | "atr" | "attach_email" | "attach_file" | "attach_file_add" | "attach_file_off" | "attach_money" | "attachment" | "attractions" | "attribution" | "audio_description" | "audio_file" | "audio_video_receiver" | "audiotrack" | "auto_activity_zone" | "auto_awesome" | "auto_awesome_mosaic" | "auto_awesome_motion" | "auto_delete" | "auto_detect_voice" | "auto_draw_solid" | "auto_fix" | "auto_fix_high" | "auto_fix_normal" | "auto_fix_off" | "auto_graph" | "auto_label" | "auto_meeting_room" | "auto_mode" | "auto_read_pause" | "auto_read_play" | "auto_schedule" | "auto_stories" | "auto_timer" | "auto_towing" | "auto_transmission" | "auto_videocam" | "autofps_select" | "automation" | "autopause" | "autopay" | "autoplay" | "autorenew" | "autostop" | "av1" | "av_timer" | "avc" | "avg_pace" | "avg_time" | "award_star" | "azm" | "baby_changing_station" | "back_hand" | "back_to_tab" | "background_dot_large" | "background_dot_small" | "background_grid_small" | "background_replace" | "backlight_high" | "backlight_high_off" | "backlight_low" | "backpack" | "backspace" | "backup" | "backup_table" | "badge" | "badge_critical_battery" | "bakery_dining" | "balance" | "balcony" | "ballot" | "bar_chart" | "bar_chart_4_bars" | "bar_chart_off" | "barcode" | "barcode_reader" | "barcode_scanner" | "barefoot" | "batch_prediction" | "bath_outdoor" | "bath_private" | "bath_public_large" | "bathroom" | "bathtub" | "battery_0_bar" | "battery_1_bar" | "battery_20" | "battery_2_bar" | "battery_30" | "battery_3_bar" | "battery_4_bar" | "battery_50" | "battery_5_bar" | "battery_60" | "battery_6_bar" | "battery_80" | "battery_90" | "battery_alert" | "battery_change" | "battery_charging_20" | "battery_charging_30" | "battery_charging_50" | "battery_charging_60" | "battery_charging_80" | "battery_charging_90" | "battery_charging_full" | "battery_error" | "battery_full" | "battery_full_alt" | "battery_horiz_000" | "battery_horiz_050" | "battery_horiz_075" | "battery_low" | "battery_plus" | "battery_profile" | "battery_saver" | "battery_share" | "battery_status_good" | "battery_std" | "battery_unknown" | "battery_vert_005" | "battery_vert_020" | "battery_vert_050" | "battery_very_low" | "beach_access" | "bed" | "bedroom_baby" | "bedroom_child" | "bedroom_parent" | "bedtime" | "bedtime_off" | "beenhere" | "bento" | "bia" | "bid_landscape" | "bid_landscape_disabled" | "bigtop_updates" | "bike_dock" | "bike_lane" | "bike_scooter" | "biotech" | "blanket" | "blender" | "blind" | "blinds" | "blinds_closed" | "block" | "blood_pressure" | "bloodtype" | "bluetooth" | "bluetooth_audio" | "bluetooth_connected" | "bluetooth_disabled" | "bluetooth_drive" | "bluetooth_searching" | "blur_circular" | "blur_linear" | "blur_medium" | "blur_off" | "blur_on" | "blur_short" | "body_fat" | "body_system" | "bolt" | "bomb" | "book" | "book_2" | "book_3" | "book_4" | "book_4_spark" | "book_5" | "book_6" | "book_online" | "book_ribbon" | "bookmark" | "bookmark_add" | "bookmark_added" | "bookmark_bag" | "bookmark_border" | "bookmark_check" | "bookmark_flag" | "bookmark_heart" | "bookmark_manager" | "bookmark_remove" | "bookmark_star" | "bookmarks" | "books_movies_and_music" | "border_all" | "border_bottom" | "border_clear" | "border_color" | "border_horizontal" | "border_inner" | "border_left" | "border_outer" | "border_right" | "border_style" | "border_top" | "border_vertical" | "borg" | "bottom_app_bar" | "bottom_drawer" | "bottom_navigation" | "bottom_panel_close" | "bottom_panel_open" | "bottom_right_click" | "bottom_sheets" | "box" | "box_add" | "box_edit" | "boy" | "brand_awareness" | "brand_family" | "branding_watermark" | "breakfast_dining" | "breaking_news" | "breaking_news_alt_1" | "breastfeeding" | "brightness_1" | "brightness_2" | "brightness_3" | "brightness_4" | "brightness_5" | "brightness_6" | "brightness_7" | "brightness_alert" | "brightness_auto" | "brightness_empty" | "brightness_high" | "brightness_low" | "brightness_medium" | "bring_your_own_ip" | "broadcast_on_home" | "broadcast_on_personal" | "broken_image" | "browse" | "browse_activity" | "browse_gallery" | "browser_not_supported" | "browser_updated" | "brunch_dining" | "brush" | "bubble" | "bubble_chart" | "bubbles" | "bug_report" | "build" | "build_circle" | "bungalow" | "burst_mode" | "bus_alert" | "business" | "business_center" | "business_chip" | "business_messages" | "buttons_alt" | "cabin" | "cable" | "cable_car" | "cached" | "cadence" | "cake" | "cake_add" | "calculate" | "calendar_add_on" | "calendar_apps_script" | "calendar_clock" | "calendar_month" | "calendar_today" | "calendar_view_day" | "calendar_view_month" | "calendar_view_week" | "call" | "call_end" | "call_end_alt" | "call_log" | "call_made" | "call_merge" | "call_missed" | "call_missed_outgoing" | "call_quality" | "call_received" | "call_split" | "call_to_action" | "camera" | "camera_alt" | "camera_enhance" | "camera_front" | "camera_indoor" | "camera_outdoor" | "camera_rear" | "camera_roll" | "camera_video" | "cameraswitch" | "campaign" | "camping" | "cancel" | "cancel_presentation" | "cancel_schedule_send" | "candle" | "candlestick_chart" | "captive_portal" | "capture" | "car_crash" | "car_rental" | "car_repair" | "car_tag" | "card_giftcard" | "card_membership" | "card_travel" | "cardio_load" | "cardiology" | "cards" | "cards_star" | "carpenter" | "carry_on_bag" | "carry_on_bag_checked" | "carry_on_bag_inactive" | "carry_on_bag_question" | "cases" | "casino" | "cast" | "cast_connected" | "cast_for_education" | "cast_pause" | "cast_warning" | "castle" | "category" | "category_search" | "celebration" | "cell_merge" | "cell_tower" | "cell_wifi" | "center_focus_strong" | "center_focus_weak" | "chair" | "chair_alt" | "chalet" | "change_circle" | "change_history" | "charger" | "charging_station" | "chart_data" | "chat" | "chat_add_on" | "chat_apps_script" | "chat_bubble" | "chat_bubble_outline" | "chat_error" | "chat_info" | "chat_paste_go" | "chat_paste_go_2" | "check" | "check_box" | "check_box_outline_blank" | "check_circle" | "check_circle_filled" | "check_circle_outline" | "check_in_out" | "check_indeterminate_small" | "check_small" | "checkbook" | "checked_bag" | "checked_bag_question" | "checklist" | "checklist_rtl" | "checkroom" | "cheer" | "chess" | "chess_pawn" | "chevron_backward" | "chevron_forward" | "chevron_left" | "chevron_right" | "child_care" | "child_friendly" | "chip_extraction" | "chips" | "chrome_reader_mode" | "chromecast_2" | "chromecast_device" | "chronic" | "church" | "cinematic_blur" | "circle" | "circle_notifications" | "circles" | "circles_ext" | "clarify" | "class" | "clean_hands" | "cleaning" | "cleaning_bucket" | "cleaning_services" | "clear" | "clear_all" | "clear_day" | "clear_night" | "climate_mini_split" | "clinical_notes" | "clock_arrow_down" | "clock_arrow_up" | "clock_loader_10" | "clock_loader_20" | "clock_loader_40" | "clock_loader_60" | "clock_loader_80" | "clock_loader_90" | "close" | "close_fullscreen" | "close_small" | "closed_caption" | "closed_caption_add" | "closed_caption_disabled" | "closed_caption_off" | "cloud" | "cloud_alert" | "cloud_circle" | "cloud_done" | "cloud_download" | "cloud_off" | "cloud_queue" | "cloud_sync" | "cloud_upload" | "cloudy" | "cloudy_filled" | "cloudy_snowing" | "co2" | "co_present" | "code" | "code_blocks" | "code_off" | "coffee" | "coffee_maker" | "cognition" | "cognition_2" | "collapse_all" | "collapse_content" | "collections" | "collections_bookmark" | "color_lens" | "colorize" | "colors" | "combine_columns" | "comedy_mask" | "comic_bubble" | "comment" | "comment_bank" | "comments_disabled" | "commit" | "communication" | "communities" | "communities_filled" | "commute" | "compare" | "compare_arrows" | "compass_calibration" | "component_exchange" | "compost" | "compress" | "computer" | "concierge" | "conditions" | "confirmation_number" | "congenital" | "connect_without_contact" | "connected_tv" | "connecting_airports" | "construction" | "contact_emergency" | "contact_mail" | "contact_page" | "contact_phone" | "contact_phone_filled" | "contact_support" | "contactless" | "contactless_off" | "contacts" | "contacts_product" | "content_copy" | "content_cut" | "content_paste" | "content_paste_go" | "content_paste_off" | "content_paste_search" | "contextual_token" | "contextual_token_add" | "contract" | "contract_delete" | "contract_edit" | "contrast" | "contrast_circle" | "contrast_rtl_off" | "contrast_square" | "control_camera" | "control_point" | "control_point_duplicate" | "controller_gen" | "conversion_path" | "conversion_path_off" | "convert_to_text" | "conveyor_belt" | "cookie" | "cookie_off" | "cooking" | "cool_to_dry" | "copy_all" | "copyright" | "coronavirus" | "corporate_fare" | "cottage" | "counter_0" | "counter_1" | "counter_2" | "counter_3" | "counter_4" | "counter_5" | "counter_6" | "counter_7" | "counter_8" | "counter_9" | "countertops" | "create" | "create_new_folder" | "credit_card" | "credit_card_clock" | "credit_card_gear" | "credit_card_heart" | "credit_card_off" | "credit_score" | "crib" | "crisis_alert" | "crop" | "crop_16_9" | "crop_3_2" | "crop_5_4" | "crop_7_5" | "crop_9_16" | "crop_din" | "crop_free" | "crop_landscape" | "crop_original" | "crop_portrait" | "crop_rotate" | "crop_square" | "crossword" | "crowdsource" | "cruelty_free" | "css" | "csv" | "currency_bitcoin" | "currency_exchange" | "currency_franc" | "currency_lira" | "currency_pound" | "currency_ruble" | "currency_rupee" | "currency_rupee_circle" | "currency_yen" | "currency_yuan" | "curtains" | "curtains_closed" | "custom_typography" | "cut" | "cycle" | "cyclone" | "dangerous" | "dark_mode" | "dashboard" | "dashboard_2" | "dashboard_customize" | "data_alert" | "data_array" | "data_check" | "data_exploration" | "data_info_alert" | "data_loss_prevention" | "data_object" | "data_saver_off" | "data_saver_on" | "data_table" | "data_thresholding" | "data_usage" | "database" | "database_off" | "database_upload" | "dataset" | "dataset_linked" | "date_range" | "deblur" | "deceased" | "decimal_decrease" | "decimal_increase" | "deck" | "dehaze" | "delete" | "delete_forever" | "delete_history" | "delete_outline" | "delete_sweep" | "delivery_dining" | "delivery_truck_bolt" | "delivery_truck_speed" | "demography" | "density_large" | "density_medium" | "density_small" | "dentistry" | "departure_board" | "deployed_code" | "deployed_code_account" | "deployed_code_alert" | "deployed_code_history" | "deployed_code_update" | "dermatology" | "description" | "deselect" | "design_services" | "desk" | "deskphone" | "desktop_access_disabled" | "desktop_cloud" | "desktop_cloud_stack" | "desktop_landscape" | "desktop_landscape_add" | "desktop_mac" | "desktop_portrait" | "desktop_windows" | "destruction" | "details" | "detection_and_zone" | "detector" | "detector_alarm" | "detector_battery" | "detector_co" | "detector_offline" | "detector_smoke" | "detector_status" | "developer_board" | "developer_board_off" | "developer_guide" | "developer_mode" | "developer_mode_tv" | "device_hub" | "device_reset" | "device_thermostat" | "device_unknown" | "devices" | "devices_fold" | "devices_fold_2" | "devices_off" | "devices_other" | "devices_wearables" | "dew_point" | "diagnosis" | "diagonal_line" | "dialer_sip" | "dialogs" | "dialpad" | "diamond" | "dictionary" | "difference" | "digital_out_of_home" | "digital_wellbeing" | "dining" | "dinner_dining" | "directions" | "directions_alt" | "directions_alt_off" | "directions_bike" | "directions_boat" | "directions_boat_filled" | "directions_bus" | "directions_bus_filled" | "directions_car" | "directions_car_filled" | "directions_off" | "directions_railway" | "directions_railway_2" | "directions_railway_filled" | "directions_run" | "directions_subway" | "directions_subway_filled" | "directions_transit" | "directions_transit_filled" | "directions_walk" | "directory_sync" | "dirty_lens" | "disabled_by_default" | "disabled_visible" | "disc_full" | "discover_tune" | "dishwasher" | "dishwasher_gen" | "display_external_input" | "display_settings" | "distance" | "diversity_1" | "diversity_2" | "diversity_3" | "diversity_4" | "dns" | "do_disturb" | "do_disturb_alt" | "do_disturb_off" | "do_disturb_on" | "do_not_disturb" | "do_not_disturb_alt" | "do_not_disturb_off" | "do_not_disturb_on" | "do_not_disturb_on_total_silence" | "do_not_step" | "do_not_touch" | "dock" | "dock_to_bottom" | "dock_to_left" | "dock_to_right" | "docs" | "docs_add_on" | "docs_apps_script" | "document_scanner" | "domain" | "domain_add" | "domain_disabled" | "domain_verification" | "domain_verification_off" | "domino_mask" | "done" | "done_all" | "done_outline" | "donut_large" | "donut_small" | "door_back" | "door_front" | "door_open" | "door_sensor" | "door_sliding" | "doorbell" | "doorbell_3p" | "doorbell_chime" | "double_arrow" | "downhill_skiing" | "download" | "download_2" | "download_done" | "download_for_offline" | "downloading" | "draft" | "draft_orders" | "drafts" | "drag_click" | "drag_handle" | "drag_indicator" | "drag_pan" | "draw" | "draw_abstract" | "draw_collage" | "drawing_recognition" | "dresser" | "drive_eta" | "drive_export" | "drive_file_move" | "drive_file_move_outline" | "drive_file_move_rtl" | "drive_file_rename_outline" | "drive_folder_upload" | "drive_fusiontable" | "dropdown" | "dry" | "dry_cleaning" | "dual_screen" | "duo" | "dvr" | "dynamic_feed" | "dynamic_form" | "e911_avatar" | "e911_emergency" | "e_mobiledata" | "e_mobiledata_badge" | "earbuds" | "earbuds_battery" | "early_on" | "earthquake" | "east" | "ecg" | "ecg_heart" | "eco" | "eda" | "edgesensor_high" | "edgesensor_low" | "edit" | "edit_arrow_up" | "edit_attributes" | "edit_audio" | "edit_calendar" | "edit_document" | "edit_location" | "edit_location_alt" | "edit_note" | "edit_notifications" | "edit_off" | "edit_road" | "edit_square" | "editor_choice" | "egg" | "egg_alt" | "eject" | "elderly" | "elderly_woman" | "electric_bike" | "electric_bolt" | "electric_car" | "electric_meter" | "electric_moped" | "electric_rickshaw" | "electric_scooter" | "electrical_services" | "elevation" | "elevator" | "email" | "emergency" | "emergency_heat" | "emergency_heat_2" | "emergency_home" | "emergency_recording" | "emergency_share" | "emergency_share_off" | "emoji_emotions" | "emoji_events" | "emoji_flags" | "emoji_food_beverage" | "emoji_language" | "emoji_nature" | "emoji_objects" | "emoji_people" | "emoji_symbols" | "emoji_transportation" | "emoticon" | "empty_dashboard" | "enable" | "encrypted" | "encrypted_add" | "encrypted_add_circle" | "encrypted_minus_circle" | "encrypted_off" | "endocrinology" | "energy" | "energy_program_saving" | "energy_program_time_used" | "energy_savings_leaf" | "engineering" | "enhanced_encryption" | "ent" | "enterprise" | "enterprise_off" | "equal" | "equalizer" | "eraser_size_1" | "eraser_size_2" | "eraser_size_3" | "eraser_size_4" | "eraser_size_5" | "error" | "error_circle_rounded" | "error_med" | "error_outline" | "escalator" | "escalator_warning" | "euro" | "euro_symbol" | "ev_charger" | "ev_mobiledata_badge" | "ev_shadow" | "ev_shadow_add" | "ev_shadow_minus" | "ev_station" | "event" | "event_available" | "event_busy" | "event_list" | "event_note" | "event_repeat" | "event_seat" | "event_upcoming" | "exclamation" | "exercise" | "exit_to_app" | "expand" | "expand_all" | "expand_circle_down" | "expand_circle_right" | "expand_circle_up" | "expand_content" | "expand_less" | "expand_more" | "expansion_panels" | "expension_panels" | "experiment" | "explicit" | "explore" | "explore_nearby" | "explore_off" | "explosion" | "export_notes" | "exposure" | "exposure_neg_1" | "exposure_neg_2" | "exposure_plus_1" | "exposure_plus_2" | "exposure_zero" | "extension" | "extension_off" | "eye_tracking" | "eyeglasses" | "face" | "face_2" | "face_3" | "face_4" | "face_5" | "face_6" | "face_down" | "face_left" | "face_nod" | "face_retouching_natural" | "face_retouching_off" | "face_right" | "face_shake" | "face_unlock" | "face_up" | "fact_check" | "factory" | "falling" | "familiar_face_and_zone" | "family_history" | "family_home" | "family_link" | "family_restroom" | "family_star" | "farsight_digital" | "fast_forward" | "fast_rewind" | "fastfood" | "faucet" | "favorite" | "favorite_border" | "fax" | "feature_search" | "featured_play_list" | "featured_seasonal_and_gifts" | "featured_video" | "feed" | "feedback" | "female" | "femur" | "femur_alt" | "fence" | "fertile" | "festival" | "fiber_dvr" | "fiber_manual_record" | "fiber_new" | "fiber_pin" | "fiber_smart_record" | "file_copy" | "file_copy_off" | "file_download" | "file_download_done" | "file_download_off" | "file_export" | "file_json" | "file_map" | "file_map_stack" | "file_open" | "file_png" | "file_present" | "file_save" | "file_save_off" | "file_upload" | "file_upload_off" | "files" | "filter" | "filter_1" | "filter_2" | "filter_3" | "filter_4" | "filter_5" | "filter_6" | "filter_7" | "filter_8" | "filter_9" | "filter_9_plus" | "filter_alt" | "filter_alt_off" | "filter_arrow_right" | "filter_b_and_w" | "filter_center_focus" | "filter_drama" | "filter_frames" | "filter_hdr" | "filter_list" | "filter_list_alt" | "filter_list_off" | "filter_none" | "filter_retrolux" | "filter_tilt_shift" | "filter_vintage" | "finance" | "finance_chip" | "finance_mode" | "find_in_page" | "find_replace" | "fingerprint" | "fingerprint_off" | "fire_extinguisher" | "fire_hydrant" | "fire_truck" | "fireplace" | "first_page" | "fit_page" | "fit_page_height" | "fit_screen" | "fit_width" | "fitness_center" | "fitness_tracker" | "flag" | "flag_2" | "flag_check" | "flag_circle" | "flag_filled" | "flaky" | "flare" | "flash_auto" | "flash_off" | "flash_on" | "flashlight_off" | "flashlight_on" | "flatware" | "flex_direction" | "flex_no_wrap" | "flex_wrap" | "flight" | "flight_class" | "flight_land" | "flight_takeoff" | "flights_and_hotels" | "flightsmode" | "flip" | "flip_camera_android" | "flip_camera_ios" | "flip_to_back" | "flip_to_front" | "float_landscape_2" | "float_portrait_2" | "flood" | "floor" | "floor_lamp" | "flourescent" | "flowchart" | "flowsheet" | "fluid" | "fluid_balance" | "fluid_med" | "fluorescent" | "flutter" | "flutter_dash" | "flyover" | "fmd_bad" | "fmd_good" | "foggy" | "folded_hands" | "folder" | "folder_check" | "folder_check_2" | "folder_code" | "folder_copy" | "folder_data" | "folder_delete" | "folder_eye" | "folder_limited" | "folder_managed" | "folder_match" | "folder_off" | "folder_open" | "folder_shared" | "folder_special" | "folder_supervised" | "folder_zip" | "follow_the_signs" | "font_download" | "font_download_off" | "food_bank" | "foot_bones" | "footprint" | "for_you" | "forest" | "fork_left" | "fork_right" | "fork_spoon" | "forklift" | "format_align_center" | "format_align_justify" | "format_align_left" | "format_align_right" | "format_bold" | "format_clear" | "format_color_fill" | "format_color_reset" | "format_color_text" | "format_h1" | "format_h2" | "format_h3" | "format_h4" | "format_h5" | "format_h6" | "format_image_left" | "format_image_right" | "format_indent_decrease" | "format_indent_increase" | "format_ink_highlighter" | "format_italic" | "format_letter_spacing" | "format_letter_spacing_2" | "format_letter_spacing_standard" | "format_letter_spacing_wide" | "format_letter_spacing_wider" | "format_line_spacing" | "format_list_bulleted" | "format_list_bulleted_add" | "format_list_numbered" | "format_list_numbered_rtl" | "format_overline" | "format_paint" | "format_paragraph" | "format_quote" | "format_quote_off" | "format_shapes" | "format_size" | "format_strikethrough" | "format_text_clip" | "format_text_overflow" | "format_text_wrap" | "format_textdirection_l_to_r" | "format_textdirection_r_to_l" | "format_textdirection_vertical" | "format_underlined" | "format_underlined_squiggle" | "forms_add_on" | "forms_apps_script" | "fort" | "forum" | "forward" | "forward_10" | "forward_30" | "forward_5" | "forward_circle" | "forward_media" | "forward_to_inbox" | "foundation" | "frame_inspect" | "frame_person" | "frame_person_mic" | "frame_person_off" | "frame_reload" | "frame_source" | "free_breakfast" | "free_cancellation" | "front_hand" | "front_loader" | "full_coverage" | "full_hd" | "full_stacked_bar_chart" | "fullscreen" | "fullscreen_exit" | "fullscreen_portrait" | "function" | "functions" | "funicular" | "g_mobiledata" | "g_mobiledata_badge" | "g_translate" | "gallery_thumbnail" | "gamepad" | "games" | "garage" | "garage_door" | "garage_home" | "garden_cart" | "gas_meter" | "gastroenterology" | "gate" | "gavel" | "general_device" | "generating_tokens" | "genetics" | "genres" | "gesture" | "gesture_select" | "get_app" | "gif" | "gif_2" | "gif_box" | "girl" | "gite" | "glass_cup" | "globe" | "globe_asia" | "globe_book" | "globe_uk" | "glucose" | "glyphs" | "go_to_line" | "golf_course" | "gondola_lift" | "google_home_devices" | "google_plus_reshare" | "google_tv_remote" | "google_wifi" | "gpp_bad" | "gpp_good" | "gpp_maybe" | "gps_fixed" | "gps_not_fixed" | "gps_off" | "grade" | "gradient" | "grading" | "grain" | "graph_1" | "graph_2" | "graph_3" | "graph_4" | "graph_5" | "graph_6" | "graphic_eq" | "grass" | "grid_3x3" | "grid_3x3_off" | "grid_4x4" | "grid_goldenratio" | "grid_guides" | "grid_off" | "grid_on" | "grid_view" | "grocery" | "group" | "group_add" | "group_off" | "group_remove" | "group_search" | "group_work" | "grouped_bar_chart" | "groups" | "groups_2" | "groups_3" | "guardian" | "gynecology" | "h_mobiledata" | "h_mobiledata_badge" | "h_plus_mobiledata" | "h_plus_mobiledata_badge" | "hail" | "hallway" | "hand_bones" | "hand_gesture" | "hand_gesture_off" | "handheld_controller" | "handshake" | "handwriting_recognition" | "handyman" | "hangout_video" | "hangout_video_off" | "hard_disk" | "hard_drive" | "hard_drive_2" | "hardware" | "hd" | "hdr_auto" | "hdr_auto_select" | "hdr_enhanced_select" | "hdr_off" | "hdr_off_select" | "hdr_on" | "hdr_on_select" | "hdr_plus" | "hdr_plus_off" | "hdr_strong" | "hdr_weak" | "head_mounted_device" | "headphones" | "headphones_battery" | "headset" | "headset_mic" | "headset_off" | "healing" | "health_and_beauty" | "health_and_safety" | "health_metrics" | "heap_snapshot_large" | "heap_snapshot_multiple" | "heap_snapshot_thumbnail" | "hearing" | "hearing_aid" | "hearing_aid_disabled" | "hearing_disabled" | "heart_broken" | "heart_check" | "heart_minus" | "heart_plus" | "heat" | "heat_pump" | "heat_pump_balance" | "height" | "helicopter" | "help" | "help_center" | "help_clinic" | "help_outline" | "hematology" | "hevc" | "hexagon" | "hide" | "hide_image" | "hide_source" | "high_density" | "high_quality" | "high_res" | "highlight" | "highlight_alt" | "highlight_keyboard_focus" | "highlight_mouse_cursor" | "highlight_off" | "highlight_text_cursor" | "highlighter_size_1" | "highlighter_size_2" | "highlighter_size_3" | "highlighter_size_4" | "highlighter_size_5" | "hiking" | "history" | "history_2" | "history_edu" | "history_off" | "history_toggle_off" | "hive" | "hls" | "hls_off" | "holiday_village" | "home" | "home_and_garden" | "home_app_logo" | "home_filled" | "home_health" | "home_improvement_and_tools" | "home_iot_device" | "home_max" | "home_max_dots" | "home_mini" | "home_pin" | "home_repair_service" | "home_speaker" | "home_storage" | "home_work" | "horizontal_distribute" | "horizontal_rule" | "horizontal_split" | "host" | "hot_tub" | "hotel" | "hotel_class" | "hourglass" | "hourglass_bottom" | "hourglass_disabled" | "hourglass_empty" | "hourglass_full" | "hourglass_top" | "house" | "house_siding" | "house_with_shield" | "houseboat" | "household_supplies" | "hov" | "how_to_reg" | "how_to_vote" | "hr_resting" | "html" | "http" | "https" | "hub" | "humerus" | "humerus_alt" | "humidity_high" | "humidity_indoor" | "humidity_low" | "humidity_mid" | "humidity_percentage" | "hvac" | "ice_skating" | "icecream" | "id_card" | "identity_aware_proxy" | "identity_platform" | "ifl" | "iframe" | "iframe_off" | "image" | "image_aspect_ratio" | "image_not_supported" | "image_search" | "imagesearch_roller" | "imagesmode" | "immunology" | "import_contacts" | "import_export" | "important_devices" | "in_home_mode" | "inactive_order" | "inbox" | "inbox_customize" | "inbox_text" | "incomplete_circle" | "indeterminate_check_box" | "indeterminate_question_box" | "info" | "info_i" | "infrared" | "ink_eraser" | "ink_eraser_off" | "ink_highlighter" | "ink_highlighter_move" | "ink_marker" | "ink_pen" | "ink_selection" | "inpatient" | "input" | "input_circle" | "insert_chart" | "insert_chart_filled" | "insert_chart_outlined" | "insert_comment" | "insert_drive_file" | "insert_emoticon" | "insert_invitation" | "insert_link" | "insert_page_break" | "insert_photo" | "insert_text" | "insights" | "install_desktop" | "install_mobile" | "instant_mix" | "integration_instructions" | "interactive_space" | "interests" | "interpreter_mode" | "inventory" | "inventory_2" | "invert_colors" | "invert_colors_off" | "ios" | "ios_share" | "iron" | "iso" | "jamboard_kiosk" | "javascript" | "join" | "join_full" | "join_inner" | "join_left" | "join_right" | "joystick" | "jump_to_element" | "kayaking" | "kebab_dining" | "keep" | "keep_off" | "keep_pin" | "keep_public" | "kettle" | "key" | "key_off" | "key_vertical" | "key_visualizer" | "keyboard" | "keyboard_alt" | "keyboard_arrow_down" | "keyboard_arrow_left" | "keyboard_arrow_right" | "keyboard_arrow_up" | "keyboard_backspace" | "keyboard_capslock" | "keyboard_capslock_badge" | "keyboard_command_key" | "keyboard_control_key" | "keyboard_double_arrow_down" | "keyboard_double_arrow_left" | "keyboard_double_arrow_right" | "keyboard_double_arrow_up" | "keyboard_external_input" | "keyboard_full" | "keyboard_hide" | "keyboard_keys" | "keyboard_lock" | "keyboard_lock_off" | "keyboard_off" | "keyboard_onscreen" | "keyboard_option_key" | "keyboard_previous_language" | "keyboard_return" | "keyboard_tab" | "keyboard_tab_rtl" | "keyboard_voice" | "kid_star" | "king_bed" | "kitchen" | "kitesurfing" | "lab_panel" | "lab_profile" | "lab_research" | "label" | "label_important" | "label_important_outline" | "label_off" | "label_outline" | "labs" | "lan" | "landscape" | "landscape_2" | "landscape_2_off" | "landslide" | "language" | "language_chinese_array" | "language_chinese_cangjie" | "language_chinese_dayi" | "language_chinese_pinyin" | "language_chinese_quick" | "language_chinese_wubi" | "language_french" | "language_gb_english" | "language_international" | "language_japanese_kana" | "language_korean_latin" | "language_pinyin" | "language_spanish" | "language_us" | "language_us_colemak" | "language_us_dvorak" | "laps" | "laptop" | "laptop_car" | "laptop_chromebook" | "laptop_mac" | "laptop_windows" | "lasso_select" | "last_page" | "launch" | "laundry" | "layers" | "layers_clear" | "lda" | "leaderboard" | "leak_add" | "leak_remove" | "left_click" | "left_panel_close" | "left_panel_open" | "legend_toggle" | "lens" | "lens_blur" | "letter_switch" | "library_add" | "library_add_check" | "library_books" | "library_music" | "license" | "lift_to_talk" | "light" | "light_group" | "light_mode" | "light_off" | "lightbulb" | "lightbulb_2" | "lightbulb_circle" | "lightbulb_outline" | "lightning_stand" | "line_axis" | "line_curve" | "line_end" | "line_end_arrow" | "line_end_arrow_notch" | "line_end_circle" | "line_end_diamond" | "line_end_square" | "line_start" | "line_start_arrow" | "line_start_arrow_notch" | "line_start_circle" | "line_start_diamond" | "line_start_square" | "line_style" | "line_weight" | "linear_scale" | "link" | "link_off" | "linked_camera" | "linked_services" | "liquor" | "list" | "list_alt" | "list_alt_add" | "list_alt_check" | "lists" | "live_help" | "live_tv" | "living" | "local_activity" | "local_airport" | "local_atm" | "local_bar" | "local_cafe" | "local_car_wash" | "local_convenience_store" | "local_dining" | "local_drink" | "local_fire_department" | "local_florist" | "local_gas_station" | "local_grocery_store" | "local_hospital" | "local_hotel" | "local_laundry_service" | "local_library" | "local_mall" | "local_movies" | "local_offer" | "local_parking" | "local_pharmacy" | "local_phone" | "local_pizza" | "local_play" | "local_police" | "local_post_office" | "local_printshop" | "local_see" | "local_shipping" | "local_taxi" | "location_automation" | "location_away" | "location_chip" | "location_city" | "location_disabled" | "location_home" | "location_off" | "location_on" | "location_pin" | "location_searching" | "locator_tag" | "lock" | "lock_clock" | "lock_open" | "lock_open_right" | "lock_outline" | "lock_person" | "lock_reset" | "login" | "logo_dev" | "logout" | "looks" | "looks_3" | "looks_4" | "looks_5" | "looks_6" | "looks_one" | "looks_two" | "loop" | "loupe" | "low_density" | "low_priority" | "lowercase" | "loyalty" | "lte_mobiledata" | "lte_mobiledata_badge" | "lte_plus_mobiledata" | "lte_plus_mobiledata_badge" | "luggage" | "lunch_dining" | "lyrics" | "macro_auto" | "macro_off" | "magic_button" | "magic_exchange" | "magic_tether" | "magnification_large" | "magnification_small" | "magnify_docked" | "magnify_fullscreen" | "mail" | "mail_lock" | "mail_off" | "mail_outline" | "male" | "man" | "man_2" | "man_3" | "man_4" | "manage_accounts" | "manage_history" | "manage_search" | "manga" | "manufacturing" | "map" | "map_search" | "maps_home_work" | "maps_ugc" | "margin" | "mark_as_unread" | "mark_chat_read" | "mark_chat_unread" | "mark_email_read" | "mark_email_unread" | "mark_unread_chat_alt" | "markdown" | "markdown_copy" | "markdown_paste" | "markunread" | "markunread_mailbox" | "masked_transitions" | "masked_transitions_add" | "masks" | "match_case" | "match_word" | "matter" | "maximize" | "measuring_tape" | "media_bluetooth_off" | "media_bluetooth_on" | "media_link" | "media_output" | "media_output_off" | "mediation" | "medical_information" | "medical_mask" | "medical_services" | "medication" | "medication_liquid" | "meeting_room" | "memory" | "memory_alt" | "menstrual_health" | "menu" | "menu_book" | "menu_open" | "merge" | "merge_type" | "message" | "metabolism" | "metro" | "mfg_nest_yale_lock" | "mic" | "mic_alert" | "mic_double" | "mic_external_off" | "mic_external_on" | "mic_none" | "mic_off" | "microbiology" | "microwave" | "microwave_gen" | "military_tech" | "mimo" | "mimo_disconnect" | "mindfulness" | "minimize" | "minor_crash" | "mintmark" | "missed_video_call" | "missed_video_call_filled" | "missing_controller" | "mist" | "mitre" | "mixture_med" | "mms" | "mobile_friendly" | "mobile_off" | "mobile_screen_share" | "mobiledata_off" | "mode" | "mode_comment" | "mode_cool" | "mode_cool_off" | "mode_dual" | "mode_edit" | "mode_edit_outline" | "mode_fan" | "mode_fan_off" | "mode_heat" | "mode_heat_cool" | "mode_heat_off" | "mode_night" | "mode_of_travel" | "mode_off_on" | "mode_standby" | "model_training" | "modeling" | "monetization_on" | "money" | "money_bag" | "money_off" | "money_off_csred" | "monitor" | "monitor_heart" | "monitor_weight" | "monitor_weight_gain" | "monitor_weight_loss" | "monitoring" | "monochrome_photos" | "monorail" | "mood" | "mood_bad" | "mop" | "moped" | "more" | "more_down" | "more_horiz" | "more_time" | "more_up" | "more_vert" | "mosque" | "motion_blur" | "motion_mode" | "motion_photos_auto" | "motion_photos_off" | "motion_photos_on" | "motion_photos_pause" | "motion_photos_paused" | "motion_play" | "motion_sensor_active" | "motion_sensor_alert" | "motion_sensor_idle" | "motion_sensor_urgent" | "motorcycle" | "mountain_flag" | "mouse" | "mouse_lock" | "mouse_lock_off" | "move" | "move_down" | "move_group" | "move_item" | "move_location" | "move_selection_down" | "move_selection_left" | "move_selection_right" | "move_selection_up" | "move_to_inbox" | "move_up" | "moved_location" | "movie" | "movie_creation" | "movie_edit" | "movie_filter" | "movie_info" | "movie_off" | "moving" | "moving_beds" | "moving_ministry" | "mp" | "multicooker" | "multiline_chart" | "multimodal_hand_eye" | "multiple_airports" | "multiple_stop" | "museum" | "music_cast" | "music_note" | "music_note_add" | "music_off" | "music_video" | "my_location" | "mystery" | "nat" | "nature" | "nature_people" | "navigate_before" | "navigate_next" | "navigation" | "near_me" | "near_me_disabled" | "nearby" | "nearby_error" | "nearby_off" | "nephrology" | "nest_audio" | "nest_cam_floodlight" | "nest_cam_indoor" | "nest_cam_iq" | "nest_cam_iq_outdoor" | "nest_cam_magnet_mount" | "nest_cam_outdoor" | "nest_cam_stand" | "nest_cam_wall_mount" | "nest_cam_wired_stand" | "nest_clock_farsight_analog" | "nest_clock_farsight_digital" | "nest_connect" | "nest_detect" | "nest_display" | "nest_display_max" | "nest_doorbell_visitor" | "nest_eco_leaf" | "nest_farsight_weather" | "nest_found_savings" | "nest_gale_wifi" | "nest_heat_link_e" | "nest_heat_link_gen_3" | "nest_hello_doorbell" | "nest_locator_tag" | "nest_mini" | "nest_multi_room" | "nest_protect" | "nest_remote" | "nest_remote_comfort_sensor" | "nest_secure_alarm" | "nest_sunblock" | "nest_tag" | "nest_thermostat" | "nest_thermostat_e_eu" | "nest_thermostat_gen_3" | "nest_thermostat_sensor" | "nest_thermostat_sensor_eu" | "nest_thermostat_zirconium_eu" | "nest_true_radiant" | "nest_wake_on_approach" | "nest_wake_on_press" | "nest_wifi_gale" | "nest_wifi_mistral" | "nest_wifi_point" | "nest_wifi_point_vento" | "nest_wifi_pro" | "nest_wifi_pro_2" | "nest_wifi_router" | "network_cell" | "network_check" | "network_intelligence" | "network_intelligence_history" | "network_intelligence_update" | "network_locked" | "network_manage" | "network_node" | "network_ping" | "network_wifi" | "network_wifi_1_bar" | "network_wifi_1_bar_locked" | "network_wifi_2_bar" | "network_wifi_2_bar_locked" | "network_wifi_3_bar" | "network_wifi_3_bar_locked" | "network_wifi_locked" | "neurology" | "new_label" | "new_releases" | "new_window" | "news" | "newsmode" | "newspaper" | "newsstand" | "next_plan" | "next_week" | "nfc" | "night_shelter" | "night_sight_auto" | "night_sight_auto_off" | "night_sight_max" | "nightlife" | "nightlight" | "nightlight_round" | "nights_stay" | "no_accounts" | "no_adult_content" | "no_backpack" | "no_crash" | "no_drinks" | "no_encryption" | "no_encryption_gmailerrorred" | "no_flash" | "no_food" | "no_luggage" | "no_meals" | "no_meeting_room" | "no_photography" | "no_sim" | "no_sound" | "no_stroller" | "no_transfer" | "noise_aware" | "noise_control_off" | "noise_control_on" | "nordic_walking" | "north" | "north_east" | "north_west" | "not_accessible" | "not_accessible_forward" | "not_interested" | "not_listed_location" | "not_started" | "note" | "note_add" | "note_alt" | "note_stack" | "note_stack_add" | "notes" | "notification_add" | "notification_important" | "notification_multiple" | "notifications" | "notifications_active" | "notifications_none" | "notifications_off" | "notifications_paused" | "notifications_unread" | "numbers" | "nutrition" | "ods" | "odt" | "offline_bolt" | "offline_pin" | "offline_pin_off" | "offline_share" | "oil_barrel" | "on_device_training" | "on_hub_device" | "oncology" | "ondemand_video" | "online_prediction" | "onsen" | "opacity" | "open_in_browser" | "open_in_full" | "open_in_new" | "open_in_new_down" | "open_in_new_off" | "open_in_phone" | "open_jam" | "open_run" | "open_with" | "ophthalmology" | "oral_disease" | "orbit" | "order_approve" | "order_play" | "orders" | "orthopedics" | "other_admission" | "other_houses" | "outbound" | "outbox" | "outbox_alt" | "outdoor_garden" | "outdoor_grill" | "outgoing_mail" | "outlet" | "outlined_flag" | "outpatient" | "outpatient_med" | "output" | "output_circle" | "oven" | "oven_gen" | "overview" | "overview_key" | "owl" | "oxygen_saturation" | "p2p" | "pace" | "pacemaker" | "package" | "package_2" | "padding" | "page_control" | "page_info" | "pageless" | "pages" | "pageview" | "paid" | "palette" | "pallet" | "pan_tool" | "pan_tool_alt" | "pan_zoom" | "panorama" | "panorama_fish_eye" | "panorama_horizontal" | "panorama_photosphere" | "panorama_vertical" | "panorama_wide_angle" | "paragliding" | "park" | "partly_cloudy_day" | "partly_cloudy_night" | "partner_exchange" | "partner_reports" | "party_mode" | "passkey" | "password" | "password_2" | "password_2_off" | "patient_list" | "pattern" | "pause" | "pause_circle" | "pause_circle_filled" | "pause_circle_outline" | "pause_presentation" | "payment" | "payments" | "pedal_bike" | "pediatrics" | "pen_size_1" | "pen_size_2" | "pen_size_3" | "pen_size_4" | "pen_size_5" | "pending" | "pending_actions" | "pentagon" | "people" | "people_alt" | "people_outline" | "percent" | "performance_max" | "pergola" | "perm_camera_mic" | "perm_contact_calendar" | "perm_data_setting" | "perm_device_information" | "perm_identity" | "perm_media" | "perm_phone_msg" | "perm_scan_wifi" | "person" | "person_2" | "person_3" | "person_4" | "person_add" | "person_add_alt" | "person_add_disabled" | "person_alert" | "person_apron" | "person_book" | "person_cancel" | "person_celebrate" | "person_check" | "person_edit" | "person_filled" | "person_off" | "person_outline" | "person_pin" | "person_pin_circle" | "person_play" | "person_raised_hand" | "person_remove" | "person_search" | "personal_bag" | "personal_bag_off" | "personal_bag_question" | "personal_injury" | "personal_places" | "personal_video" | "pest_control" | "pest_control_rodent" | "pet_supplies" | "pets" | "phishing" | "phone" | "phone_alt" | "phone_android" | "phone_bluetooth_speaker" | "phone_callback" | "phone_disabled" | "phone_enabled" | "phone_forwarded" | "phone_in_talk" | "phone_iphone" | "phone_locked" | "phone_missed" | "phone_paused" | "phonelink" | "phonelink_erase" | "phonelink_lock" | "phonelink_off" | "phonelink_ring" | "phonelink_ring_off" | "phonelink_setup" | "photo" | "photo_album" | "photo_auto_merge" | "photo_camera" | "photo_camera_back" | "photo_camera_front" | "photo_filter" | "photo_frame" | "photo_library" | "photo_prints" | "photo_size_select_actual" | "photo_size_select_large" | "photo_size_select_small" | "php" | "physical_therapy" | "piano" | "piano_off" | "picture_as_pdf" | "picture_in_picture" | "picture_in_picture_alt" | "picture_in_picture_center" | "picture_in_picture_large" | "picture_in_picture_medium" | "picture_in_picture_mobile" | "picture_in_picture_off" | "picture_in_picture_small" | "pie_chart" | "pie_chart_filled" | "pie_chart_outline" | "pie_chart_outlined" | "pill" | "pill_off" | "pin" | "pin_drop" | "pin_end" | "pin_invoke" | "pinboard" | "pinboard_unread" | "pinch" | "pinch_zoom_in" | "pinch_zoom_out" | "pip" | "pip_exit" | "pivot_table_chart" | "place" | "place_item" | "plagiarism" | "planet" | "planner_banner_ad_pt" | "planner_review" | "play_arrow" | "play_circle" | "play_disabled" | "play_for_work" | "play_lesson" | "play_music" | "play_pause" | "play_shapes" | "playing_cards" | "playlist_add" | "playlist_add_check" | "playlist_add_check_circle" | "playlist_add_circle" | "playlist_play" | "playlist_remove" | "plumbing" | "plus_one" | "podcasts" | "podiatry" | "podium" | "point_of_sale" | "point_scan" | "poker_chip" | "policy" | "policy_alert" | "poll" | "polyline" | "polymer" | "pool" | "portable_wifi_off" | "portrait" | "position_bottom_left" | "position_bottom_right" | "position_top_right" | "post" | "post_add" | "potted_plant" | "power" | "power_input" | "power_off" | "power_rounded" | "power_settings_circle" | "power_settings_new" | "prayer_times" | "precision_manufacturing" | "pregnancy" | "pregnant_woman" | "preliminary" | "prescriptions" | "present_to_all" | "preview" | "preview_off" | "price_change" | "price_check" | "print" | "print_add" | "print_connect" | "print_disabled" | "print_error" | "print_lock" | "priority" | "priority_high" | "privacy" | "privacy_tip" | "private_connectivity" | "problem" | "procedure" | "process_chart" | "production_quantity_limits" | "productivity" | "progress_activity" | "prompt_suggestion" | "propane" | "propane_tank" | "psychiatry" | "psychology" | "psychology_alt" | "public" | "public_off" | "publish" | "published_with_changes" | "pulmonology" | "pulse_alert" | "punch_clock" | "push_pin" | "qr_code" | "qr_code_2" | "qr_code_2_add" | "qr_code_scanner" | "query_builder" | "query_stats" | "question_answer" | "question_exchange" | "question_mark" | "queue" | "queue_music" | "queue_play_next" | "quick_phrases" | "quick_reference" | "quick_reference_all" | "quick_reorder" | "quickreply" | "quiet_time" | "quiet_time_active" | "quiz" | "r_mobiledata" | "radar" | "radio" | "radio_button_checked" | "radio_button_partial" | "radio_button_unchecked" | "radiology" | "railway_alert" | "railway_alert_2" | "rainy" | "rainy_heavy" | "rainy_light" | "rainy_snow" | "ramen_dining" | "ramp_left" | "ramp_right" | "range_hood" | "rate_review" | "rate_review_rtl" | "raven" | "raw_off" | "raw_on" | "read_more" | "readiness_score" | "real_estate_agent" | "rear_camera" | "rebase" | "rebase_edit" | "receipt" | "receipt_long" | "receipt_long_off" | "recent_actors" | "recent_patient" | "recenter" | "recommend" | "record_voice_over" | "rectangle" | "recycling" | "redeem" | "redo" | "reduce_capacity" | "refresh" | "regular_expression" | "relax" | "release_alert" | "remember_me" | "reminder" | "reminders_alt" | "remote_gen" | "remove" | "remove_circle" | "remove_circle_outline" | "remove_done" | "remove_from_queue" | "remove_moderator" | "remove_red_eye" | "remove_road" | "remove_selection" | "remove_shopping_cart" | "reopen_window" | "reorder" | "repartition" | "repeat" | "repeat_on" | "repeat_one" | "repeat_one_on" | "replace_audio" | "replace_image" | "replace_video" | "replay" | "replay_10" | "replay_30" | "replay_5" | "replay_circle_filled" | "reply" | "reply_all" | "report" | "report_gmailerrorred" | "report_off" | "report_problem" | "request_page" | "request_quote" | "reset_brightness" | "reset_focus" | "reset_image" | "reset_iso" | "reset_settings" | "reset_shadow" | "reset_shutter_speed" | "reset_tv" | "reset_white_balance" | "reset_wrench" | "resize" | "respiratory_rate" | "responsive_layout" | "restart_alt" | "restaurant" | "restaurant_menu" | "restore" | "restore_from_trash" | "restore_page" | "resume" | "reviews" | "rewarded_ads" | "rheumatology" | "rib_cage" | "rice_bowl" | "right_click" | "right_panel_close" | "right_panel_open" | "ring_volume" | "ring_volume_filled" | "ripples" | "road" | "robot" | "robot_2" | "rocket" | "rocket_launch" | "roller_shades" | "roller_shades_closed" | "roller_skating" | "roofing" | "room" | "room_preferences" | "room_service" | "rotate_90_degrees_ccw" | "rotate_90_degrees_cw" | "rotate_auto" | "rotate_left" | "rotate_right" | "roundabout_left" | "roundabout_right" | "rounded_corner" | "route" | "router" | "routine" | "rowing" | "rss_feed" | "rsvp" | "rtt" | "rubric" | "rule" | "rule_folder" | "rule_settings" | "run_circle" | "running_with_errors" | "rv_hookup" | "safety_check" | "safety_check_off" | "safety_divider" | "sailing" | "salinity" | "sanitizer" | "satellite" | "satellite_alt" | "sauna" | "save" | "save_alt" | "save_as" | "save_clock" | "saved_search" | "savings" | "scale" | "scan" | "scan_delete" | "scanner" | "scatter_plot" | "scene" | "schedule" | "schedule_send" | "schema" | "school" | "science" | "science_off" | "scooter" | "score" | "scoreboard" | "screen_lock_landscape" | "screen_lock_portrait" | "screen_lock_rotation" | "screen_record" | "screen_rotation" | "screen_rotation_alt" | "screen_rotation_up" | "screen_search_desktop" | "screen_share" | "screenshot" | "screenshot_frame" | "screenshot_keyboard" | "screenshot_monitor" | "screenshot_region" | "screenshot_tablet" | "script" | "scrollable_header" | "scuba_diving" | "sd" | "sd_card" | "sd_card_alert" | "sd_storage" | "sdk" | "search" | "search_activity" | "search_check" | "search_check_2" | "search_hands_free" | "search_insights" | "search_off" | "security" | "security_key" | "security_update" | "security_update_good" | "security_update_warning" | "segment" | "select" | "select_all" | "select_check_box" | "select_to_speak" | "select_window" | "select_window_2" | "select_window_off" | "self_care" | "self_improvement" | "sell" | "send" | "send_and_archive" | "send_money" | "send_time_extension" | "send_to_mobile" | "sensor_door" | "sensor_occupied" | "sensor_window" | "sensors" | "sensors_krx" | "sensors_krx_off" | "sensors_off" | "sentiment_calm" | "sentiment_content" | "sentiment_dissatisfied" | "sentiment_excited" | "sentiment_extremely_dissatisfied" | "sentiment_frustrated" | "sentiment_neutral" | "sentiment_sad" | "sentiment_satisfied" | "sentiment_satisfied_alt" | "sentiment_stressed" | "sentiment_very_dissatisfied" | "sentiment_very_satisfied" | "sentiment_worried" | "serif" | "server_person" | "service_toolbox" | "set_meal" | "settings" | "settings_accessibility" | "settings_account_box" | "settings_alert" | "settings_applications" | "settings_b_roll" | "settings_backup_restore" | "settings_bluetooth" | "settings_brightness" | "settings_cell" | "settings_cinematic_blur" | "settings_ethernet" | "settings_heart" | "settings_input_antenna" | "settings_input_component" | "settings_input_composite" | "settings_input_hdmi" | "settings_input_svideo" | "settings_motion_mode" | "settings_night_sight" | "settings_overscan" | "settings_panorama" | "settings_phone" | "settings_photo_camera" | "settings_power" | "settings_remote" | "settings_slow_motion" | "settings_suggest" | "settings_system_daydream" | "settings_timelapse" | "settings_video_camera" | "settings_voice" | "settop_component" | "severe_cold" | "shadow" | "shadow_add" | "shadow_minus" | "shape_line" | "shape_recognition" | "shapes" | "share" | "share_eta" | "share_location" | "share_off" | "share_reviews" | "share_windows" | "sheets_rtl" | "shelf_auto_hide" | "shelf_position" | "shelves" | "shield" | "shield_lock" | "shield_locked" | "shield_moon" | "shield_person" | "shield_question" | "shield_with_heart" | "shield_with_house" | "shift" | "shift_lock" | "shift_lock_off" | "shop" | "shop_2" | "shop_two" | "shopping_bag" | "shopping_bag_speed" | "shopping_basket" | "shopping_cart" | "shopping_cart_checkout" | "shopping_cart_off" | "shoppingmode" | "short_stay" | "short_text" | "shortcut" | "show_chart" | "shower" | "shuffle" | "shuffle_on" | "shutter_speed" | "shutter_speed_add" | "shutter_speed_minus" | "sick" | "side_navigation" | "sign_language" | "signal_cellular_0_bar" | "signal_cellular_1_bar" | "signal_cellular_2_bar" | "signal_cellular_3_bar" | "signal_cellular_4_bar" | "signal_cellular_add" | "signal_cellular_alt" | "signal_cellular_alt_1_bar" | "signal_cellular_alt_2_bar" | "signal_cellular_connected_no_internet_0_bar" | "signal_cellular_connected_no_internet_4_bar" | "signal_cellular_no_sim" | "signal_cellular_nodata" | "signal_cellular_null" | "signal_cellular_off" | "signal_cellular_pause" | "signal_disconnected" | "signal_wifi_0_bar" | "signal_wifi_4_bar" | "signal_wifi_4_bar_lock" | "signal_wifi_bad" | "signal_wifi_connected_no_internet_4" | "signal_wifi_off" | "signal_wifi_statusbar_4_bar" | "signal_wifi_statusbar_not_connected" | "signal_wifi_statusbar_null" | "signature" | "signpost" | "sim_card" | "sim_card_alert" | "sim_card_download" | "simulation" | "single_bed" | "sip" | "siren" | "siren_check" | "siren_open" | "siren_question" | "skateboarding" | "skeleton" | "skillet" | "skillet_cooktop" | "skip_next" | "skip_previous" | "skull" | "slab_serif" | "sledding" | "sleep" | "sleep_score" | "slide_library" | "sliders" | "slideshow" | "slow_motion_video" | "smart_button" | "smart_card_reader" | "smart_card_reader_off" | "smart_display" | "smart_outlet" | "smart_screen" | "smart_toy" | "smartphone" | "smartphone_camera" | "smb_share" | "smoke_free" | "smoking_rooms" | "sms" | "sms_failed" | "snippet_folder" | "snooze" | "snowboarding" | "snowing" | "snowing_heavy" | "snowmobile" | "snowshoeing" | "soap" | "social_distance" | "social_leaderboard" | "solar_power" | "sort" | "sort_by_alpha" | "sos" | "sound_detection_dog_barking" | "sound_detection_glass_break" | "sound_detection_loud_sound" | "sound_sampler" | "soup_kitchen" | "source" | "source_environment" | "source_notes" | "south" | "south_america" | "south_east" | "south_west" | "spa" | "space_bar" | "space_dashboard" | "spatial_audio" | "spatial_audio_off" | "spatial_speaker" | "spatial_tracking" | "speaker" | "speaker_group" | "speaker_notes" | "speaker_notes_off" | "speaker_phone" | "special_character" | "specific_gravity" | "speech_to_text" | "speed" | "speed_0_25" | "speed_0_2x" | "speed_0_5" | "speed_0_5x" | "speed_0_75" | "speed_0_7x" | "speed_1_2" | "speed_1_25" | "speed_1_2x" | "speed_1_5" | "speed_1_5x" | "speed_1_75" | "speed_1_7x" | "speed_2x" | "speed_camera" | "spellcheck" | "split_scene" | "splitscreen" | "splitscreen_add" | "splitscreen_bottom" | "splitscreen_landscape" | "splitscreen_left" | "splitscreen_portrait" | "splitscreen_right" | "splitscreen_top" | "splitscreen_vertical_add" | "spo2" | "spoke" | "sports" | "sports_and_outdoors" | "sports_bar" | "sports_baseball" | "sports_basketball" | "sports_cricket" | "sports_esports" | "sports_football" | "sports_golf" | "sports_gymnastics" | "sports_handball" | "sports_hockey" | "sports_kabaddi" | "sports_martial_arts" | "sports_mma" | "sports_motorsports" | "sports_rugby" | "sports_score" | "sports_soccer" | "sports_tennis" | "sports_volleyball" | "sprinkler" | "sprint" | "square" | "square_dot" | "square_foot" | "ssid_chart" | "stack" | "stack_hexagon" | "stack_off" | "stack_star" | "stacked_bar_chart" | "stacked_email" | "stacked_inbox" | "stacked_line_chart" | "stacks" | "stadia_controller" | "stadium" | "stairs" | "stairs_2" | "star" | "star_border" | "star_border_purple500" | "star_half" | "star_outline" | "star_purple500" | "star_rate" | "star_rate_half" | "stars" | "start" | "stat_0" | "stat_1" | "stat_2" | "stat_3" | "stat_minus_1" | "stat_minus_2" | "stat_minus_3" | "stay_current_landscape" | "stay_current_portrait" | "stay_primary_landscape" | "stay_primary_portrait" | "step" | "step_into" | "step_out" | "step_over" | "steppers" | "steps" | "stethoscope" | "stethoscope_arrow" | "stethoscope_check" | "sticky_note" | "sticky_note_2" | "stock_media" | "stockpot" | "stop" | "stop_circle" | "stop_screen_share" | "storage" | "store" | "store_mall_directory" | "storefront" | "storm" | "straight" | "straighten" | "strategy" | "stream" | "stream_apps" | "streetview" | "stress_management" | "strikethrough_s" | "stroke_full" | "stroke_partial" | "stroller" | "style" | "styler" | "stylus" | "stylus_laser_pointer" | "stylus_note" | "subdirectory_arrow_left" | "subdirectory_arrow_right" | "subheader" | "subject" | "subscript" | "subscriptions" | "subtitles" | "subtitles_off" | "subway" | "summarize" | "sunny" | "sunny_snowing" | "superscript" | "supervised_user_circle" | "supervised_user_circle_off" | "supervisor_account" | "support" | "support_agent" | "surfing" | "surgical" | "surround_sound" | "swap_calls" | "swap_driving_apps" | "swap_driving_apps_wheel" | "swap_horiz" | "swap_horizontal_circle" | "swap_vert" | "swap_vertical_circle" | "sweep" | "swipe" | "swipe_down" | "swipe_down_alt" | "swipe_left" | "swipe_left_alt" | "swipe_right" | "swipe_right_alt" | "swipe_up" | "swipe_up_alt" | "swipe_vertical" | "switch" | "switch_access" | "switch_access_2" | "switch_access_shortcut" | "switch_access_shortcut_add" | "switch_account" | "switch_camera" | "switch_left" | "switch_right" | "switch_video" | "switches" | "sword_rose" | "swords" | "symptoms" | "synagogue" | "sync" | "sync_alt" | "sync_arrow_down" | "sync_arrow_up" | "sync_desktop" | "sync_disabled" | "sync_lock" | "sync_problem" | "sync_saved_locally" | "syringe" | "system_security_update" | "system_security_update_good" | "system_security_update_warning" | "system_update" | "system_update_alt" | "tab" | "tab_close" | "tab_close_inactive" | "tab_close_right" | "tab_duplicate" | "tab_group" | "tab_inactive" | "tab_move" | "tab_new_right" | "tab_recent" | "tab_unselected" | "table" | "table_bar" | "table_chart" | "table_chart_view" | "table_convert" | "table_edit" | "table_eye" | "table_lamp" | "table_restaurant" | "table_rows" | "table_rows_narrow" | "table_view" | "tablet" | "tablet_android" | "tablet_camera" | "tablet_mac" | "tabs" | "tactic" | "tag" | "tag_faces" | "takeout_dining" | "tamper_detection_off" | "tamper_detection_on" | "tap_and_play" | "tapas" | "target" | "task" | "task_alt" | "taunt" | "taxi_alert" | "team_dashboard" | "temp_preferences_custom" | "temp_preferences_eco" | "temple_buddhist" | "temple_hindu" | "tenancy" | "terminal" | "terrain" | "text_ad" | "text_compare" | "text_decrease" | "text_fields" | "text_fields_alt" | "text_format" | "text_increase" | "text_rotate_up" | "text_rotate_vertical" | "text_rotation_angledown" | "text_rotation_angleup" | "text_rotation_down" | "text_rotation_none" | "text_select_end" | "text_select_jump_to_beginning" | "text_select_jump_to_end" | "text_select_move_back_character" | "text_select_move_back_word" | "text_select_move_down" | "text_select_move_forward_character" | "text_select_move_forward_word" | "text_select_move_up" | "text_select_start" | "text_snippet" | "text_to_speech" | "text_up" | "textsms" | "texture" | "texture_add" | "texture_minus" | "theater_comedy" | "theaters" | "thermometer" | "thermometer_add" | "thermometer_gain" | "thermometer_loss" | "thermometer_minus" | "thermostat" | "thermostat_auto" | "thermostat_carbon" | "things_to_do" | "thread_unread" | "threat_intelligence" | "thumb_down" | "thumb_down_alt" | "thumb_down_filled" | "thumb_down_off" | "thumb_down_off_alt" | "thumb_up" | "thumb_up_alt" | "thumb_up_filled" | "thumb_up_off" | "thumb_up_off_alt" | "thumbnail_bar" | "thumbs_up_down" | "thunderstorm" | "tibia" | "tibia_alt" | "tile_large" | "tile_medium" | "tile_small" | "time_auto" | "time_to_leave" | "timelapse" | "timeline" | "timer" | "timer_10" | "timer_10_alt_1" | "timer_10_select" | "timer_3" | "timer_3_alt_1" | "timer_3_select" | "timer_5" | "timer_5_shutter" | "timer_arrow_down" | "timer_arrow_up" | "timer_off" | "timer_pause" | "timer_play" | "tips_and_updates" | "tire_repair" | "title" | "titlecase" | "toast" | "toc" | "today" | "toggle_off" | "toggle_on" | "token" | "toll" | "tonality" | "toolbar" | "tools_flat_head" | "tools_installation_kit" | "tools_ladder" | "tools_level" | "tools_phillips" | "tools_pliers_wire_stripper" | "tools_power_drill" | "tools_wrench" | "tooltip" | "tooltip_2" | "top_panel_close" | "top_panel_open" | "topic" | "tornado" | "total_dissolved_solids" | "touch_app" | "touch_double" | "touch_long" | "touch_triple" | "touchpad_mouse" | "touchpad_mouse_off" | "tour" | "toys" | "toys_and_games" | "toys_fan" | "track_changes" | "trackpad_input" | "trackpad_input_2" | "trackpad_input_3" | "traffic" | "traffic_jam" | "trail_length" | "trail_length_medium" | "trail_length_short" | "train" | "tram" | "transcribe" | "transfer_within_a_station" | "transform" | "transgender" | "transit_enterexit" | "transit_ticket" | "transition_chop" | "transition_dissolve" | "transition_fade" | "transition_push" | "transition_slide" | "translate" | "transportation" | "travel" | "travel_explore" | "travel_luggage_and_bags" | "trending_down" | "trending_flat" | "trending_up" | "trip" | "trip_origin" | "trolley" | "trolley_cable_car" | "trophy" | "troubleshoot" | "try" | "tsunami" | "tsv" | "tty" | "tune" | "tungsten" | "turn_left" | "turn_right" | "turn_sharp_left" | "turn_sharp_right" | "turn_slight_left" | "turn_slight_right" | "turned_in" | "turned_in_not" | "tv" | "tv_displays" | "tv_gen" | "tv_guide" | "tv_next" | "tv_off" | "tv_options_edit_channels" | "tv_options_input_settings" | "tv_remote" | "tv_signin" | "tv_with_assistant" | "two_pager" | "two_pager_store" | "two_wheeler" | "type_specimen" | "u_turn_left" | "u_turn_right" | "ulna_radius" | "ulna_radius_alt" | "umbrella" | "unarchive" | "undo" | "unfold_less" | "unfold_less_double" | "unfold_more" | "unfold_more_double" | "ungroup" | "universal_currency" | "universal_currency_alt" | "universal_local" | "unknown_2" | "unknown_5" | "unknown_7" | "unknown_document" | "unknown_med" | "unlicense" | "unpaved_road" | "unpin" | "unpublished" | "unsubscribe" | "upcoming" | "update" | "update_disabled" | "upgrade" | "upi_pay" | "upload" | "upload_2" | "upload_file" | "uppercase" | "urology" | "usb" | "usb_off" | "user_attributes" | "vaccines" | "vacuum" | "valve" | "vape_free" | "vaping_rooms" | "variable_add" | "variable_insert" | "variable_remove" | "variables" | "ventilator" | "verified" | "verified_user" | "vertical_align_bottom" | "vertical_align_center" | "vertical_align_top" | "vertical_distribute" | "vertical_shades" | "vertical_shades_closed" | "vertical_split" | "vibration" | "video_call" | "video_camera_back" | "video_camera_back_add" | "video_camera_front" | "video_camera_front_off" | "video_chat" | "video_file" | "video_label" | "video_library" | "video_search" | "video_settings" | "video_stable" | "videocam" | "videocam_alert" | "videocam_off" | "videogame_asset" | "videogame_asset_off" | "view_agenda" | "view_array" | "view_carousel" | "view_column" | "view_column_2" | "view_comfy" | "view_comfy_alt" | "view_compact" | "view_compact_alt" | "view_cozy" | "view_day" | "view_headline" | "view_in_ar" | "view_in_ar_new" | "view_in_ar_off" | "view_kanban" | "view_list" | "view_module" | "view_object_track" | "view_quilt" | "view_real_size" | "view_sidebar" | "view_stream" | "view_timeline" | "view_week" | "vignette" | "villa" | "visibility" | "visibility_lock" | "visibility_off" | "vital_signs" | "vitals" | "vo2_max" | "voice_chat" | "voice_over_off" | "voice_selection" | "voice_selection_off" | "voicemail" | "volcano" | "volume_down" | "volume_down_alt" | "volume_mute" | "volume_off" | "volume_up" | "volunteer_activism" | "voting_chip" | "vpn_key" | "vpn_key_alert" | "vpn_key_off" | "vpn_lock" | "vr180_create2d" | "vr180_create2d_off" | "vrpano" | "wall_art" | "wall_lamp" | "wallet" | "wallpaper" | "wallpaper_slideshow" | "ward" | "warehouse" | "warning" | "warning_amber" | "warning_off" | "wash" | "watch" | "watch_button_press" | "watch_check" | "watch_later" | "watch_off" | "watch_screentime" | "watch_vibration" | "watch_wake" | "water" | "water_bottle" | "water_bottle_large" | "water_damage" | "water_do" | "water_drop" | "water_ec" | "water_full" | "water_heater" | "water_lock" | "water_loss" | "water_lux" | "water_medium" | "water_orp" | "water_ph" | "water_pump" | "water_voc" | "waterfall_chart" | "waves" | "waving_hand" | "wb_auto" | "wb_cloudy" | "wb_incandescent" | "wb_iridescent" | "wb_shade" | "wb_sunny" | "wb_twilight" | "wc" | "weather_hail" | "weather_mix" | "weather_snowy" | "web" | "web_asset" | "web_asset_off" | "web_stories" | "web_traffic" | "webhook" | "weekend" | "weight" | "west" | "whatshot" | "wheelchair_pickup" | "where_to_vote" | "widget_medium" | "widget_small" | "widget_width" | "widgets" | "width" | "width_full" | "width_normal" | "width_wide" | "wifi" | "wifi_1_bar" | "wifi_2_bar" | "wifi_add" | "wifi_calling" | "wifi_calling_1" | "wifi_calling_2" | "wifi_calling_3" | "wifi_calling_bar_1" | "wifi_calling_bar_2" | "wifi_calling_bar_3" | "wifi_channel" | "wifi_find" | "wifi_home" | "wifi_lock" | "wifi_notification" | "wifi_off" | "wifi_password" | "wifi_protected_setup" | "wifi_proxy" | "wifi_tethering" | "wifi_tethering_error" | "wifi_tethering_off" | "wind_power" | "window" | "window_closed" | "window_open" | "window_sensor" | "wine_bar" | "woman" | "woman_2" | "work" | "work_alert" | "work_history" | "work_off" | "work_outline" | "work_update" | "workflow" | "workspace_premium" | "workspaces" | "workspaces_outline" | "wounds_injuries" | "wrap_text" | "wrist" | "wrong_location" | "wysiwyg" | "yard" | "your_trips" | "youtube_activity" | "youtube_searched_for" | "zone_person_alert" | "zone_person_idle" | "zone_person_urgent" | "zoom_in" | "zoom_in_map" | "zoom_out" | "zoom_out_map";

interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    /** 'single' (default): opening one closes the others. 'multiple': any number can be open. */
    type?: 'single' | 'multiple';
    /** The open items' values (controlled). Use with onValueChange. */
    value?: string[];
    /** The items open at first (uncontrolled). Default: none. */
    defaultValue?: string[];
    /** Called with the open items' values when one opens or closes. */
    onValueChange?: (value: string[]) => void;
    /** With type="single": lets the open item close again, leaving none open. Default: true. */
    collapsible?: boolean;
    /** 'plain' (default): lines between items. 'card': a bordered, rounded frame. */
    variant?: 'plain' | 'card';
    /** The heading level of the titles, to fit the page's outline. Default: 3. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** With type="multiple": an "Expand all" button above the items, which becomes "Collapse all" once every item
        is open. Disabled items stay as they are. Default: false. */
    showExpandAll?: boolean;
}
interface AccordionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** Identifies the item in value. Default: its position ("0", "1"…). */
    value?: string;
    /** The title: what the heading button says. */
    title: React.ReactNode;
    /** Can't be opened or closed. Default: false. */
    disabled?: boolean;
    /** The content shown when it's open. */
    children?: React.ReactNode;
    /** Closed content stays in the page, keeping its state, and find-in-page searches it. false renders the content
        only while the item is open (and while it closes), for heavy content; find-in-page can't find it then. Default: true. */
    keepMounted?: boolean;
}
/** Items that show and hide their content under heading buttons; one open at a time, or several. */
declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
/** One item in an Accordion: a title button and the content it shows and hides. */
declare const AccordionItem: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;

/** Any Material Symbol's name, a custom icon's name, or a name you registered with registerIcons. */
type IconName = CustomIconName | MaterialIconName | (string & {});
/** What icon props (Button's leftIcon, IconButton's icon…) take: an icon name, an icon from serupa-ds/icons
 * (`leftIcon={Add}`), or any element. */
type IconSource = IconName | IconData | React.ReactNode;
interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Any Material Symbols name (search them on Foundations/Icons), a custom icon's name, or one you registered with
     * registerIcons. A custom icon with the same name wins. Give `name` or `icon`. */
    name?: IconName;
    /** A Material Symbols icon imported from serupa-ds/icons: `icon={ArrowForward}`. Give `name` or `icon`. */
    icon?: IconData;
    /** Size in px (a number, or a string of one: "20") or any CSS length. Default: 24px, or the button's icon size inside a Button. */
    size?: number | string;
    /** Flips the icon in right-to-left text (dir="rtl"), so an arrow points the way reading goes. 'auto' (default) flips
     * Material Symbols' directional icons (arrow_forward, chevron_right, send, undo…); true flips any icon, false none. */
    mirror?: boolean | "auto";
}
/** An icon: Material Symbols Rounded (filled) or one of your custom SVG icons. Sized by font-size, drawn in the text color. Decorative by default (aria-hidden); pass aria-label to make it meaningful. */
declare const Icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<HTMLSpanElement>>;

type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** 'info' (default), 'success', 'warning', 'danger' or 'neutral'. Sets the background, the border tint and the icon. */
    tone?: AlertTone;
    /** A short bold first line. */
    title?: React.ReactNode;
    /** The icon before the content: an icon name or element, or false for none. Default: each tone's own (info, check_circle, warning, error). */
    icon?: IconSource | false;
    /** Buttons or links under the message. */
    actions?: React.ReactNode;
    /** Shows a close button that calls this. Hide or remove the alert yourself. */
    onDismiss?: () => void;
    /** The close button's name. Default: 'Dismiss'. */
    dismissLabel?: string;
}
/** A message about the page or a task: a tinted box with an icon, an optional title, actions and a close button. */
declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;

/** The initials of a name: the first letters of the first and last words ("Ada Lovelace" → "AL"), or one letter.
    Words with no letter, digit or pictograph ("—") are left out. In a joining script they're kept apart ("م‌ع"). */
declare function initials(name?: string): string;

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';
interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** The picture's URL. Without one, or when it fails to load, the initials (or the person icon) show instead. */
    src?: string;
    /** The person's or thing's name: the initials come from it, and it's the accessible name. */
    name?: string;
    /** The accessible name, when it isn't the name. Pass alt="" when the name is already written next to it. */
    alt?: string;
    /** 'xs' 24px, 'sm' 32px, 'md' 40px (default), 'lg' 48px or 'xl' 64px. */
    size?: AvatarSize;
    /** 'circle' (default, people) or 'square' (teams, projects, organisations). */
    shape?: 'circle' | 'square';
    /** A dot at the bottom end: 'online', 'busy', 'away' or 'offline'. Added to the accessible name. */
    status?: AvatarStatus;
    /** What a screen reader hears for the status. Default: the avatarStatus label ("online", "daring" in idLabels). */
    statusLabel?: string;
    /** Props for the <img>, such as loading="eager" for an avatar above the fold, or referrerPolicy. Default: loading="lazy", decoding="async". */
    imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}
/** A picture of a person, team or project, with initials or an icon when there's no picture. */
declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>;

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The avatars: <Avatar> elements, or elements around them such as a Tooltip or a link. */
    children?: React.ReactNode;
    /** The most avatars to show. The rest fold into a "+N" avatar at the end. Default: all of them. */
    max?: number;
    /** How many there are in all, when you pass only some (e.g. the first 5 of 120 members). Default: the number of children. */
    total?: number;
    /** One size for every avatar in the group: 'xs', 'sm', 'md' (default), 'lg' or 'xl'. */
    size?: AvatarSize;
    /** What a screen reader hears for the "+N" avatar. Default: the avatarMore label ("N more"). */
    moreLabel?: (count: number) => string;
    /** The group's accessible name, such as "Assigned to". */
    label?: string;
    /** Makes "+N" a button that opens a popover listing the people not shown, so keyboard and touch users can see them too. */
    showMore?: boolean;
    /** Makes "+N" a button that calls this, to show the rest your own way (a Dialog, a page). Wins over showMore. */
    onMore?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
/** Avatars in an overlapping row, with "+N" for the rest. */
declare const AvatarGroup: React.ForwardRefExoticComponent<AvatarGroupProps & React.RefAttributes<HTMLDivElement>>;

type BadgeVariant = 'subtle' | 'solid' | 'outline';
type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';
interface BadgeProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
    /** 'subtle' (default): a tint with colored text. 'solid': a full fill, for strong emphasis. 'outline': a colored border and text. */
    variant?: BadgeVariant;
    /** 'neutral' (default) and 'primary' use the alias colors; 'success' (green), 'warning' (amber), 'danger' (red) and 'info' (sky) are statuses; the palette families are for categories and tags. Every tone and variant keeps 4.5:1 text in light and dark. */
    tone?: BadgeTone;
    /** A small status dot before the label, in the badge's text color. Ignored with leftIcon or count. With no label, icon or count, renders a lone indicator dot ("something new"): decorative unless given aria-label. */
    dot?: boolean;
    /** With dot (in a label or the lone indicator): a copy of the dot grows and fades every second (the system's ping animation), for live states. Off under reduced motion. Ignored without a dot. Default false. */
    ping?: boolean;
    /** A Material Symbols (or custom) icon name, or an element, before the label. Decorative. */
    leftIcon?: IconSource;
    /** Makes it a count badge: a round pill with the number. 0 renders nothing unless showZero. */
    count?: number;
    /** With count: above this, shows "max+" (default 99: "99+"). */
    max?: number;
    /** With count: show the badge at 0. */
    showZero?: boolean;
    /** Adds a remove (×) button at the end that calls this. */
    onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    /** The remove button's accessible name, before the label: "Remove" (default) → "Remove Design". */
    removeLabel?: string;
    /** Makes it interactive: renders a <button type="button"> with hover, focus and active states. onRemove is ignored then. */
    onClick?: React.MouseEventHandler<HTMLElement>;
    /** Makes it a link (the component set with Serupa.configure({ link }), <a> by default), with hover, focus and active states. */
    href?: string;
    /** Where the link opens, as on <a>; with "_blank", rel defaults to "noopener noreferrer". */
    target?: string;
    /** The link's relation to the page, as on <a>. */
    rel?: string;
    /** Turns an interactive badge off. A link has no disabled state in HTML: a disabled link badge renders without href, with role="link" and aria-disabled, and can't be focused or followed. */
    disabled?: boolean;
    /** 'button' (default, never submits by accident), 'submit' or 'reset', when interactive. */
    type?: 'button' | 'submit' | 'reset';
    /** A ring replaces the content (the width stays); aria-busy, and an interactive badge ignores clicks but keeps focus. */
    loading?: boolean;
    /** Announced to screen readers when loading starts. Default "Loading"; "" announces nothing. */
    loadingText?: string;
}
/** A short label for status, counts and categories. A <span>; a <button> with onClick, a link with href. */
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLElement>>;

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
    /** BreadcrumbItems, from the top level down to the current page (the last one). */
    children?: React.ReactNode;
    /** 'chevron' (default) or 'slash' between items. */
    separator?: 'chevron' | 'slash';
    /** Shows at most this many items: the first, a "…" button that shows the rest, and the last ones. Default: no limit. */
    maxItems?: number;
    /** What the "…" button does. 'inline' (default): shows the hidden items in the trail. 'menu': opens a Menu of
        them, so a long trail stays on one line on a phone. */
    collapse?: 'inline' | 'menu';
    /** The nav's accessible name. Default: "Breadcrumb". */
    "aria-label"?: string;
    /** The "…" button's accessible name. Default: "Show all pages", or "More pages" with collapse="menu". */
    expandLabel?: string;
}
/** BreadcrumbItem's own props, beside those of the element it renders. */
interface BreadcrumbItemOwnProps {
    /** Where it goes. The last item is the current page: it's text, not a link, whatever href says. */
    href?: string;
    /** An icon before the label: a Material Symbols or custom name, or an element. */
    icon?: IconSource;
    /** Set by Breadcrumb on the last item. */
    current?: boolean;
}
/** BreadcrumbItem's props: its own, `as`, and the props of the element `as` names (an <a>'s by default), so
 *  <BreadcrumbItem as={RouterLink} to="/projects"> takes RouterLink's `to`. */
type BreadcrumbItemProps<C extends React.ElementType = 'a'> = BreadcrumbItemOwnProps & {
    /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof BreadcrumbItemOwnProps | 'as'>;
/** One page in a Breadcrumb: a link, or the current page when it's the last. `as` renders your router's link, typed with its props. */
declare const BreadcrumbItem: {
    <C extends React.ElementType = "a">(props: BreadcrumbItemProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): React.ReactElement | null;
    displayName?: string;
};
/** Where the current page sits: links to the pages above it, separated by chevrons. maxItems collapses the middle. */
declare const Breadcrumb: React.ForwardRefExoticComponent<BreadcrumbProps & React.RefAttributes<HTMLElement>>;

/** The button's class names, for styling any other element as a button. iconPosition adds the optical padding for one icon beside a label; wrap lets the label take more than one line. */
declare function buttonClass(opts?: {
    variant?: ButtonVariant;
    destructive?: boolean;
    size?: ButtonSize;
    iconOnly?: boolean;
    iconPosition?: 'left' | 'right';
    wrap?: boolean;
    className?: string;
}): string;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';
/** What every Button takes, as a <button> or as a link. */
interface ButtonOwnProps {
    /** Visual style. Default: 'primary' (solid brand color). */
    variant?: ButtonVariant;
    /** Danger colors on any variant, for deleting or irreversible actions. Default: false. */
    destructive?: boolean;
    /** Height: sm 24px, md 32px, lg 44px (the control-height tokens). Default: 'md'. */
    size?: ButtonSize;
    /** Icon before the label: an icon name (custom or Material Symbols, "add") or any element. */
    leftIcon?: IconSource;
    /** Icon after the label: an icon name (custom or Material Symbols, "arrow_forward") or any element. */
    rightIcon?: IconSource;
    /** Icon-only button: an icon name (custom or Material Symbols) or element, in a square at the size's height. Ignores children, leftIcon and rightIcon; needs an aria-label. */
    icon?: IconSource;
    /** Shows a centered Loader (ring) and blocks clicks, keys and Enter-key form submission while an action runs, so a request can't be sent twice. Keeps size, colors and keyboard focus; sets aria-busy, aria-disabled and data-loading. Default: false, except that a type="submit" button inside a `<form action={fn}>` is loading while that form is being sent. Set it to override. */
    loading?: boolean;
    /** Announced to screen readers (polite status region) when loading starts. Default: 'Loading'. Pass '' to stay silent. */
    loadingText?: string;
    /** Why it's disabled ("Fill in your name first"). With disabled, the button stays focusable (aria-disabled, so
        keyboard and screen reader users can reach it and hear why) and this is its description; clicks still do
        nothing. Wrap it in a Tooltip with the same words to show them on hover and focus too. */
    disabledReason?: string;
    /** Shown with a check in place of the label for 2 seconds, and announced, after an onClick that returned a
        promise resolves ("Saved"). For actions that don't move people elsewhere. Default: none. */
    successText?: string;
    /** Lets a long label take more than one line: the button grows from its size's height instead of cutting the
        label with an ellipsis. Without it, a text label that's cut shows in full as the button's title on hover.
        Default: false. */
    wrap?: boolean;
}
/** A Button without href: a native <button>. */
interface ButtonAsButtonProps extends ButtonOwnProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'> {
    /** Without href it's a <button>; give it href to make it a link. */
    href?: undefined;
    /** Can return a promise: the button then takes no second click until it settles, shows loading if it takes a while, and shows successText once it resolves. */
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
    /** 'button' (default, never submits by accident), 'submit' or 'reset'. */
    type?: 'button' | 'submit' | 'reset';
    /** Opens, closes or toggles a [popover] element by id (native HTML). */
    popoverTarget?: string;
    /** What a press does to the popoverTarget element: 'show', 'hide' or 'toggle' (default). */
    popoverTargetAction?: 'show' | 'hide' | 'toggle';
    /** Invoker commands: the id of the element to act on, and the action ('show-modal', 'close', 'request-close', 'show-popover', 'hide-popover', 'toggle-popover', or a custom '--name'). */
    commandfor?: string;
    /** The action for the commandfor element: 'show-modal', 'close', 'request-close', 'show-popover', 'hide-popover', 'toggle-popover', or a custom '--name'. */
    command?: string;
}
/** A Button with href: a link (<a>, or the component set with Serupa.configure({ link })), for navigation. */
interface ButtonAsLinkProps extends ButtonOwnProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type' | 'onClick'> {
    /** Can return a promise, as on a button. */
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => unknown;
    /** Where the link goes. With target="_blank", rel defaults to "noopener noreferrer". */
    href: string;
    /** A link has no disabled state in HTML: a disabled link Button renders without href, with aria-disabled, and can't be focused or followed. */
    disabled?: boolean;
}
type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;
/** A <button> for actions; pass href for navigation and it renders a link. Built-in micro-interactions: press and a loading cross-fade, plus an opt-in right-icon nudge (--button-icon-nudge); off under reduced motion. Colors, spacing, sizes, borders and motion can be overridden with the --button-* component tokens (button.tokens.json) on the page, a container or one button. */
declare const Button: {
    (props: ButtonAsButtonProps & React.RefAttributes<HTMLButtonElement>): React.ReactElement | null;
    (props: ButtonAsLinkProps & React.RefAttributes<HTMLAnchorElement>): React.ReactElement | null;
    displayName?: string;
};

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Buttons, IconButtons or ToggleButtons. */
    children?: React.ReactNode;
    /** Joins them into one control: shared borders, outer corners only. Default: true. */
    attached?: boolean;
    /** 'horizontal' (default) or 'vertical'. */
    orientation?: 'horizontal' | 'vertical';
    /** What the group is for ("Text formatting"), for screen readers. */
    "aria-label"?: string;
}
/** Related buttons in a row or a column, joined into one control or spaced apart. */
declare const ButtonGroup: React.ForwardRefExoticComponent<ButtonGroupProps & React.RefAttributes<HTMLDivElement>>;

interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** The selected day (controlled), or null. Use with onValueChange. A Date, or a plain "yyyy-mm-dd" string for that local day. */
    value?: Date | string | null;
    /** The selected day at first (uncontrolled), as a Date or "yyyy-mm-dd". */
    defaultValue?: Date | string | null;
    /** Called with the day people pick (local midnight), and the same day as "yyyy-mm-dd". */
    onValueChange?: (value: Date, iso: string) => void;
    /** The month shown (controlled): any day in it. Use with onMonthChange. */
    month?: Date;
    /** The month shown at first. Default: the selected day's, or today's (min's or max's when today is outside them). */
    defaultMonth?: Date;
    /** Called when the shown month changes. */
    onMonthChange?: (month: Date) => void;
    /** The earliest day that can be picked, as a Date or "yyyy-mm-dd". */
    min?: Date | string;
    /** The latest day that can be picked, as a Date or "yyyy-mm-dd". */
    max?: Date | string;
    /** Days that can't be picked, such as weekends. */
    isDateDisabled?: (date: Date) => boolean;
    /** A BCP 47 locale for month and weekday names and the first day of the week. Default: the nearest SerupaProvider's locale, else the browser's. */
    locale?: string;
    /** 0 Sunday … 6 Saturday. Default: the locale's. */
    weekStartsOn?: number;
    /** Moves focus to the selected day (or today) when the calendar appears. Default: false. */
    autoFocus?: boolean;
    /** Names for the month buttons. Default: "Previous month" and "Next month". */
    previousLabel?: string;
    /** The next month button's name. Default: "Next month". */
    nextLabel?: string;
    /** Month and year menus in the header in place of the title, to jump far (a birth date, a contract 18 months
        out) without a click per month. The years run from min's (else 100 years back) to max's (else 10 ahead).
        Default: false. */
    monthYearPicker?: boolean;
}
/** A month of days to pick one from, with keyboard navigation; used by DatePicker. */
declare const Calendar: React.ForwardRefExoticComponent<CalendarProps & React.RefAttributes<HTMLDivElement>>;

type CardVariant = 'outline' | 'elevated' | 'filled';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
interface CardProps extends React.HTMLAttributes<HTMLElement> {
    /** 'outline' (default): surface, a border and a hairline shadow. 'elevated': a raised shadow, for content that floats over the page. 'filled': surface-muted and flat, for panels inside another surface. */
    variant?: CardVariant;
    /** Inner padding: 'none' (for full-bleed media; pad the parts yourself), 'sm' 12px, 'md' 20px (default) or 'lg' 24px. */
    padding?: CardPadding;
    /** The element: 'div' (default), 'section', 'article' or 'li'. */
    as?: 'div' | 'section' | 'article' | 'li';
    /** Makes the whole card clickable, with a hover border and a focus ring. The link (the component set with
        configure({ link }), <a> by default) goes around the CardHeader's title and is named by it; its area is
        stretched over the card. Buttons and links inside still work on their own. Without a CardHeader title, the
        link is named by the card's text. */
    href?: string;
    /** The link's target. "_blank" adds rel="noopener noreferrer". */
    target?: string;
    /** The link's rel. */
    rel?: string;
}
/** A surface that groups related content and actions: CardHeader, CardBody and CardFooter inside. With href, the whole card is a link. */
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLElement>>;
interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The card's title, as a heading. */
    title?: React.ReactNode;
    /** A muted line (or a few) under the title. */
    description?: React.ReactNode;
    /** Something at the end of the header: a Badge, a menu button. */
    action?: React.ReactNode;
    /** The title's heading level: 2 to 6, default 3. Pick the level that fits the page's outline. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
}
/** The card's title, an optional description and an optional action at the end. Any children come after the description. */
declare const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;
/** The card's main content. */
declare const CardBody: React.ForwardRefExoticComponent<CardBodyProps & React.RefAttributes<HTMLDivElement>>;
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Where the actions sit: 'end' (default), 'start' or 'between' (the first at the start, the rest at the end: give them a wrapper). */
    justify?: 'start' | 'end' | 'between';
}
/** The card's actions, in a wrapping row at the end. */
declare const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;

interface CarouselProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    /** The slides, one per child (pictures, cards, anything). */
    children?: React.ReactNode;
    /** What the carousel shows, such as "Featured products": it names the region. Required unless you give aria-label, or aria-labelledby pointing at a visible heading. */
    label?: string;
    /** The slide shown (from 0), when you control it. */
    index?: number;
    /** The first slide shown when you don't control it. Default: 0. */
    defaultIndex?: number;
    /** Called with the new slide's index when the person moves to it. */
    onIndexChange?: (index: number) => void;
    /** Past the last slide comes the first, and before the first the last. Default: false (the buttons stop at the ends). */
    loop?: boolean;
    /** The previous and next buttons on the sides. Default: true. */
    arrows?: boolean;
    /** A dot for each slide under the carousel. Default: true. */
    dots?: boolean;
    /** The previous button's name. Default: "Previous slide". */
    previousLabel?: string;
    /** The next button's name. Default: "Next slide". */
    nextLabel?: string;
    /** Each slide's name, and its dot's, from the index (from 0) and the count. Default: the slideOf label, "2 of 5". */
    slideLabel?: (index: number, count: number) => string;
    /** How many slides show side by side: a number, or one per screen width, { base, sm, md, lg } (from 640, 768
        and 1024px up; each one holds until the next is set). Default: 1. Previous and next still move one slide,
        and with more than one the dots count pages. */
    perView?: number | CarouselPerView;
}
interface CarouselPerView {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
}
/** One slide at a time, with previous and next buttons, dots and swipe. */
declare const Carousel: React.ForwardRefExoticComponent<CarouselProps & React.RefAttributes<HTMLElement>>;

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
    /** 'sm' (14px box, text-xs), 'md' (16px, text-sm, default) or 'lg' (20px, text-base). */
    size?: 'sm' | 'md' | 'lg';
    /** The label, next to the box; a click on it toggles the box. Without one, give the checkbox an aria-label. */
    children?: React.ReactNode;
    /** A second, muted line under the label, linked to the checkbox with aria-describedby. */
    description?: React.ReactNode;
    /** The "some" state, such as a select-all box when only some rows are picked: a dash, announced as mixed. Set it from your state; a click clears it natively. */
    indeterminate?: boolean;
    /** A danger border (while unchecked) and focus ring, and aria-invalid. */
    invalid?: boolean;
    /** Focusable and read out (aria-readonly), but a click or Space doesn't change it; a checked box is still submitted. */
    readOnly?: boolean;
    /** In a CheckboxGroup: the box that checks or clears every other box. It's checked when all are, and indeterminate when some are. Leave out value. */
    selectAll?: boolean;
    /** Called with the new checked state and the change event, after onChange: the same shape as ToggleButton's onPressedChange. */
    onCheckedChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}
/** V is the boxes' value type: string (or number) as you use them, inferred from value, defaultValue or onValueChange. */
interface CheckboxGroupProps<V extends string | number = string | number> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
    /** The checked boxes' values (controlled). Use with onValueChange. */
    value?: readonly V[];
    /** The values checked at first (uncontrolled). Default: none. */
    defaultValue?: readonly V[];
    /** Called with the new list of checked values (in the boxes' order) and the change event. */
    onValueChange?: (value: V[], event: React.ChangeEvent<HTMLInputElement>) => void;
    /** The boxes' name, so each checked one is submitted with its value; a generated one by default. */
    name?: string;
    /** 'vertical' (stacked, default) or 'horizontal' (a wrapping row). */
    orientation?: 'vertical' | 'horizontal';
    /** The boxes' size, unless a Checkbox sets its own. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border on every unchecked box, and aria-invalid on the group. Field sets it from its error. */
    invalid?: boolean;
    /** Disables every box. */
    disabled?: boolean;
    /** At least one box must be checked: aria-required on the group, and the browser won't submit the form until one is. */
    required?: boolean;
    /** The Checkbox elements, at any depth. */
    children?: React.ReactNode;
}
/** Any number of choices from a set of Checkboxes: a <div role="group"> that names them, holds the checked values and passes size, invalid, disabled and required down. A Checkbox with selectAll checks or clears the rest. */
declare const CheckboxGroup: (<V extends string | number = string | number>(props: CheckboxGroupProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & {
    displayName?: string;
};
/** A native checkbox with its label (ref, checked, onChange and every input attribute go to the <input>); className and style go to the <label> around it. */
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;

/** A swatch: its color as hex, and its name in words ("Ocean"), which is what screen readers say. */
interface ColorSwatch {
    value: string;
    label: string;
}
interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** The colors to pick from: { value: "#1d4ed8", label: "Ocean" }, or a hex string, which gets a rough name from
        its color ("Dark blue", the colorName label) and its code as a tooltip. */
    swatches: ReadonlyArray<ColorSwatch | string>;
    /** The color, as #rrggbb (controlled). Use with onValueChange. null: none picked. */
    value?: string | null;
    /** The color at first (uncontrolled). */
    defaultValue?: string | null;
    /** Called with the new color, always lowercase #rrggbb, as it changes: also on every step while dragging in the
        browser's color picker, and as a hex code is typed. */
    onValueChange?: (value: string) => void;
    /** Called with the color once it's chosen: a swatch picked, the browser's color picker closed, or the hex field
        left or Enter pressed. Not while dragging or typing, so it fits saving or other costly work. */
    onValueCommit?: (value: string) => void;
    /** A hex field and the browser's color picker after the swatches, for any color. Default: true. */
    custom?: boolean;
    /** A color to check the picked one against (the background it goes on, or the text on it): shows the WCAG ratio. */
    contrastWith?: string;
    /** The ratio below which it warns. Default: 4.5 (text); 3 for large text and icons. */
    minContrast?: number;
    /** 'sm' (24px swatches) or 'md' (32px, default). */
    size?: 'sm' | 'md';
    /** Turns every swatch and the hex field off, as a disabled native control. */
    disabled?: boolean;
    /** Submits the color with a form, in a hidden input. */
    name?: string;
    /** The id of the form the color submits with, when the picker sits outside it (like an input's form attribute). */
    form?: string;
    /** A color must be picked: aria-required on the swatches, and a form isn't submitted without one. In a required Field, it's set for you. */
    required?: boolean;
    /** Marks the swatches invalid (aria-invalid). In a Field with an error, it's set for you. */
    invalid?: boolean;
}
/** Swatches to pick a color from, a hex field for any other, and a contrast check against a background. */
declare const ColorPicker: React.ForwardRefExoticComponent<ColorPickerProps & React.RefAttributes<HTMLDivElement>>;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'children' | 'prefix'> {
    /** 'sm' (24px, text-xs), 'md' (32px, text-sm, default) or 'lg' (44px, text-base): the control heights, like Button. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border and focus ring, and aria-invalid. Say what's wrong in text next to it, linked with aria-describedby. */
    invalid?: boolean;
    /** A decorative icon inside the field, before the text: an icon name or an element. */
    leftIcon?: IconSource;
    /** A decorative icon inside the field, after the text. */
    rightIcon?: IconSource;
    /** Text inside the field, before what's typed, such as "https://" or "@". It's added to the field's description, so it's heard too. */
    prefix?: React.ReactNode;
    /** Text inside the field, after what's typed, such as "kg" or ".com". It's added to the field's description too. */
    suffix?: React.ReactNode;
    /** A character count at the end of the field, "12 / 50" with maxLength (text-colored once it's reached), read out
        only when few characters are left and at the limit. Linked to the field with aria-describedby. Default: false. */
    showCount?: boolean;
    /** Keeps the text in a pattern as people type, paste or delete, with the caret where they left it: 9 takes a digit,
        a a letter, A a letter in capitals, * a letter or digit; \ makes the next character plain; the rest shows as it is
        ("9999 9999 9999 9999", "99/99/9999", "AA99 **** **** ****"). value, defaultValue and onChange's
        event.target.value are the masked text. A digits-only mask gets the number keyboard on phones. */
    mask?: string;
}
/** A single-line text field: a native <input> (ref, value, onChange and every input attribute go to it) in a box that holds the icons; className and style go to the box. Label it with <label htmlFor> or aria-label. */
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

/** V is the options' values, inferred from options or given, such as Combobox<"red" | "green">. */
type ComboboxOption<V extends string = string> = V | {
    value: V;
    label: string;
    description?: React.ReactNode;
    disabled?: boolean;
};
interface ComboboxBaseProps<V extends string = string> extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "value" | "defaultValue" | "rightIcon" | "onChange"> {
    /** The choices: strings, or { value, label, description, disabled }. The label is what's typed to find it and shown once picked.
        With loadOptions, the ones shown before anything has loaded (or leave it out). */
    options?: readonly ComboboxOption<V>[];
    /** Loads the options for the typed text, such as from a server: called after typing pauses (debounce), and with ""
        when the list first opens. The signal aborts when newer text is typed or the field goes away, so a slow answer
        for "ca" never replaces the one for "can". The list shows the loading row while it waits and the loadFailed
        message if it rejects; filtering is then yours (filter is ignored). */
    loadOptions?: (text: string, context: {
        signal: AbortSignal;
    }) => Promise<readonly ComboboxOption<V>[]>;
    /** With loadOptions, how long typing must pause before loading, in ms. Default: 250. */
    debounce?: number;
    /** The text in the field (controlled). Use with onInputChange, which is called with every change to it. */
    inputValue?: string;
    /** The text in the field at first (uncontrolled). Default: the picked option's label, or "". */
    defaultInputValue?: string;
    /** Called whenever the field's text changes: as it's typed, and when picking, clearing, Escape or leaving the
        field puts a label back. For loading options from a server (with filter={false} and loading), or with inputValue. */
    onInputChange?: (text: string) => void;
    /** How typing narrows the list. Default: options whose label contains the text, ignoring case, accents and width ("lodz" finds "Łódź", "strasse" finds "Straße"). false shows every option (filter them yourself). */
    filter?: false | ((option: {
        value: V;
        label: string;
    }, text: string) => boolean);
    /** Shows a × that clears the selection once something is picked. Default: false. */
    clearable?: boolean;
    /** Shows a loading row in the list. Default: false. */
    loading?: boolean;
    /** Shown when nothing matches. Default: "No results". */
    emptyText?: React.ReactNode;
    /** Shown while loading. Default: "Loading…". */
    loadingText?: string;
    /** The chevron button's name. Default: the showOptions label ("Show options"). */
    toggleLabel?: string;
    /** The × button's name. Default: the clearValue label, "Clear" and the field's label ("Clear Country"), or "Clear" when it has none. */
    clearLabel?: string;
}
/** Picks one option. */
interface ComboboxSingleProps<V extends string = string> extends ComboboxBaseProps<V> {
    /** Picks one option (default); true picks any number, as tags. */
    multiple?: false;
    /** The selected value (controlled), or null. Use with onValueChange. */
    value?: V | null;
    /** The value selected at first (uncontrolled). */
    defaultValue?: V | null;
    /** Called with the picked value, or null when the field is emptied or cleared. */
    onValueChange?: (value: V | null) => void;
}
/** Picks any number of options, each shown as a tag in the field. */
interface ComboboxMultipleProps<V extends string = string> extends ComboboxBaseProps<V> {
    /** Picks any number of options: each shows as a removable tag before the text, picking toggles an option and keeps
        the list open, and Backspace in the empty field removes the last tag. */
    multiple: true;
    /** The selected values in order (controlled). Use with onValueChange. */
    value?: readonly V[];
    /** The values selected at first (uncontrolled). */
    defaultValue?: readonly V[];
    /** Called with every selected value, in the order they were picked. */
    onValueChange?: (value: V[]) => void;
}
type ComboboxProps<V extends string = string> = ComboboxSingleProps<V> | ComboboxMultipleProps<V>;
/** A text field with a list of options that narrows as you type; picks one listed option. */
declare const Combobox: (<V extends string = string>(props: ComboboxProps<V> & React.RefAttributes<HTMLInputElement>) => React.ReactElement | null) & {
    displayName?: string;
};

interface DialogProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'title' | 'open'> {
    /** Whether it's open. Controlled: close it yourself in onOpenChange. */
    open?: boolean;
    /** Open at first, then it closes itself (uncontrolled), for one shown on arrival. Default: false. */
    defaultOpen?: boolean;
    /** Called with false when people ask to close it, and why: { reason: 'escape' | 'close' (the ×) | 'outside' (the backdrop) | 'api' (the browser closed it) }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** The heading, which also names the dialog. */
    title?: React.ReactNode;
    /** A muted line under the title, read when the dialog opens. */
    description?: React.ReactNode;
    /** Buttons at the bottom end: the main action last. */
    footer?: React.ReactNode;
    /** 'sm' 384px, 'md' 512px (default) or 'lg' 672px wide, at most the screen less 16px each side. */
    size?: 'sm' | 'md' | 'lg';
    /** An alert dialog (role="alertdialog") for a confirmation that needs an answer: no close button, and the backdrop doesn't close it. Escape still does. */
    alert?: boolean;
    /** Shows the × in the corner. Default: true (false for alert). */
    closeButton?: boolean;
    /** The × button's name. Default: 'Close'. */
    closeLabel?: string;
    /** Whether a click on the backdrop closes it. Default: true (false for alert). */
    closeOnBackdrop?: boolean;
    /** Fills the screen: true always, 'mobile' under 640px wide (a long form on a phone). Default: false. */
    fullScreen?: boolean | 'mobile';
    /** The element that takes focus when it opens, instead of the first that can (the ×) or one marked data-autofocus: the safe choice in a confirmation (Cancel), or the field people came to fill. */
    initialFocus?: React.RefObject<HTMLElement | null>;
    /** Where focus goes when it closes, instead of back to what opened it: the next row after deleting one, whose own button is gone. Used when it's on the page then; otherwise focus goes back to the opener. */
    finalFocus?: React.RefObject<HTMLElement | null>;
    /** There are changes that would be lost: Escape, the ×, the backdrop or the browser closing it first ask "Discard changes?" (an alert dialog, Keep editing focused), and onOpenChange(false) comes only after Discard. Leaving the page asks too (beforeunload). Your own Cancel button closes it directly, so ask there yourself if it should. Default: false. */
    unsaved?: boolean;
}
/** A modal dialog on the native <dialog>: a title, content and actions, over a dimmed page. */
declare const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDialogElement>>;

/** One command or page in the palette. */
interface Command {
    /** Unique among the commands. */
    id: string;
    /** What it does or where it goes, in a few words ("New project", "Settings"). What's typed is matched against it. */
    label: string;
    /** The heading it's listed under ("Pages", "Actions"), in the order groups first appear. Default: "Commands". */
    group?: string;
    /** More words that find it, not shown ("preferences" for Settings). */
    keywords?: string[];
    /** An icon before the label: a name or an icon from serupa-ds/icons. */
    icon?: React.ReactNode | IconData;
    /** Keys shown after the label in Kbd (["mod", "N"]). Shown only: set the shortcut itself up with useShortcut. */
    shortcut?: string[];
    /** A page to go to when it's chosen, with no onSelect. */
    href?: string;
    /** Shown but can't be chosen. */
    disabled?: boolean;
    /** Runs when it's chosen, after the palette has closed. */
    onSelect?: () => void;
}
interface CommandPaletteProps extends Omit<DialogProps, "title" | "description" | "footer" | "alert" | "children" | "size" | "fullScreen" | "initialFocus" | "closeButton" | "closeLabel" | "onSelect" | "unsaved"> {
    /** The commands and pages it searches, in the order they're listed before anything is typed. */
    commands: Command[];
    /** Runs for any command chosen, after the palette has closed and after the command's own onSelect. */
    onSelect?: (command: Command) => void;
    /** The keys that open it anywhere on the page (default ["mod", "K"]: ⌘K on Apple devices, Ctrl+K elsewhere); false for none. */
    hotkey?: string[] | false;
    /** The search field's placeholder and name. Default: "Search commands and pages" (labels.searchCommands). */
    placeholder?: string;
    /** Shown when nothing matches. Default: "No matching commands" (labels.noCommands). */
    emptyText?: React.ReactNode;
    /** How many it lists at most while searching, the best matches first. Default: 50. */
    limit?: number;
}
/** A ⌘K search over commands and pages in a dialog: type to filter, arrows to move, Enter to run.
 *  @beta New: its API may still change in a minor release. Take this tag off once it has shipped with its bug bash done (CONTRIBUTING.md). */
declare const CommandPalette: React.ForwardRefExoticComponent<CommandPaletteProps & React.RefAttributes<HTMLDialogElement>>;

type ContainerSize = 'prose' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
    /** The widest the content gets: 'prose' 672px (reading), 'md' 768, 'lg' 1024, 'xl' 1280 (default), '2xl' 1536 or 'full'. */
    size?: ContainerSize;
    /** Side padding that grows with the screen (16, 24 from 640px, 32 from 1024px), outside the maximum width and never
     *  less than the screen's safe area (a notch). It follows the screen's width, not the space the Container is in.
     *  Default: true. */
    padded?: boolean;
    /** The element. Default: 'div'. */
    as?: 'div' | 'main' | 'section' | 'header' | 'footer' | 'article';
}
/** Centers content with a maximum width and responsive side padding. */
declare const Container: React.ForwardRefExoticComponent<ContainerProps & React.RefAttributes<HTMLElement>>;

interface CopyButtonProps extends Omit<ButtonAsButtonProps, 'value' | 'onCopy' | 'icon' | 'leftIcon' | 'rightIcon' | 'loading' | 'loadingText'> {
    /** What to copy: the text, or a function that returns it (or a promise of it) when the button is pressed. */
    value: string | (() => string | Promise<string>);
    /** The button's text. Default: "Copy" (labels.copy). */
    children?: React.ReactNode;
    /** What it shows and announces once it has copied. Default: "Copied" (labels.copied). */
    copiedLabel?: string;
    /** Shows only the icon, named by children (or "Copy") as its aria-label and tooltip. Default: false. */
    iconOnly?: boolean;
    /** How long it shows "Copied", in ms. Default: 2000. */
    timeout?: number;
    /** Called with the text once it's on the clipboard. */
    onCopy?: (text: string) => void;
    /** Called when the browser refuses (no permission, an insecure page). The button also announces labels.copyFailed. */
    onCopyError?: (error: unknown) => void;
}
/** A button that copies text to the clipboard, then shows "Copied" with a check and says so to screen readers. */
declare const CopyButton: React.ForwardRefExoticComponent<CopyButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'children'> {
    /** The chosen day (controlled), or null. Use with onValueChange. A "yyyy-mm-dd" string is that day, wherever the
        browser is (a Date made from one is UTC midnight, the day before west of Greenwich). */
    value?: Date | string | null;
    /** The chosen day at first (uncontrolled), as a Date or "yyyy-mm-dd". */
    defaultValue?: Date | string | null;
    /** Called with the new day (local midnight) and the same day as "yyyy-mm-dd", or null and null when the field is cleared. */
    onValueChange?: (value: Date | null, iso: string | null) => void;
    /** Called when typed text is put back on blur or Enter: "unreadable" when it isn't a date, "unavailable" when it
        is one that can't be chosen (outside min..max, or isDateDisabled). The field also says so to screen readers. */
    onInvalidInput?: (text: string, reason: "unreadable" | "unavailable") => void;
    /** The earliest and latest days that can be chosen, as Dates or "yyyy-mm-dd". */
    min?: Date | string;
    /** The latest day that can be chosen, as a Date or "yyyy-mm-dd". */
    max?: Date | string;
    /** Days that can't be chosen, such as weekends. */
    isDateDisabled?: (date: Date) => boolean;
    /** A BCP 47 locale for the typed format, names and first day of the week. Default: the nearest SerupaProvider's locale, else the browser's. */
    locale?: string;
    /** 0 Sunday … 6 Saturday. Default: the locale's. */
    weekStartsOn?: number;
    /** 'sm', 'md' (default) or 'lg', like Input. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border and aria-invalid, like Input. */
    invalid?: boolean;
    /** The calendar button's name. Default: "Choose a date". */
    buttonLabel?: string;
}
/** A date field: type a date or pick one from a calendar popover. */
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLInputElement>>;

/** A range of days; either end can be empty while it's being chosen. */
interface DateRange {
    start: Date | null;
    end: Date | null;
}
/** A range as given to DateRangePicker: each end a Date, a plain "yyyy-mm-dd" string for that local day, or null. */
interface DateRangeInput {
    start: Date | string | null;
    end: Date | string | null;
}
interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'defaultValue' | 'onChange'> {
    /** The chosen range (controlled). Use with onValueChange. Each end a Date or a plain "yyyy-mm-dd" string. */
    value?: DateRangeInput;
    /** The chosen range at first (uncontrolled). */
    defaultValue?: DateRangeInput;
    /** Called with the new range whenever either end changes (local midnights), and the same range as "yyyy-mm-dd" strings. */
    onValueChange?: (value: DateRange, iso: {
        start: string | null;
        end: string | null;
    }) => void;
    /** Called when typed text is put back on blur or Enter: "unreadable" when it isn't a date, "unavailable" when it
        is one that can't be chosen (outside min..max, or isDateDisabled). The field also says so to screen readers. */
    onInvalidInput?: (text: string, reason: "unreadable" | "unavailable") => void;
    /** The earliest and latest days that can be chosen, as Dates or "yyyy-mm-dd". */
    min?: Date | string;
    /** The latest day that can be chosen, as a Date or "yyyy-mm-dd". */
    max?: Date | string;
    /** Days that can't be the start or end, such as holidays. They can sit inside a range. */
    isDateDisabled?: (date: Date) => boolean;
    /** A BCP 47 locale for the typed format, names and first day of the week. Default: the nearest SerupaProvider's locale, else the browser's. */
    locale?: string;
    /** 0 Sunday … 6 Saturday. Default: the locale's. */
    weekStartsOn?: number;
    /** 'sm', 'md' (default) or 'lg', like Input. */
    size?: 'sm' | 'md' | 'lg';
    /** Marks both fields invalid (aria-invalid and the error border), as on Input. */
    invalid?: boolean;
    /** Turns both fields and the calendar button off, as a disabled native control. */
    disabled?: boolean;
    /** Shows the dates without letting them change, as a read-only <input>. */
    readOnly?: boolean;
    /** Both fields are required: a form won't submit until each end has a date, as with a required <input>. */
    required?: boolean;
    /** The start field's id, so a Field or <label htmlFor> focuses it. */
    id?: string;
    /** Names for the two fields. Default: "Start date" and "End date". */
    startLabel?: string;
    /** The end field's name. Default: "End date". */
    endLabel?: string;
    /** Form names: hidden inputs send each end as yyyy-mm-dd. */
    startName?: string;
    /** The form name the end date is sent under, as yyyy-mm-dd. */
    endName?: string;
    /** The id of a form to submit and reset with, when it isn't inside one, as the form attribute of an input. */
    form?: string;
    /** The calendar button's name. Default: "Choose dates". */
    buttonLabel?: string;
    /** Months shown side by side in the popup: 1 or 2 (default). */
    months?: 1 | 2;
}
/** Two date fields for a start and end, with a two-month calendar popup to pick the range. */
declare const DateRangePicker: React.ForwardRefExoticComponent<DateRangePickerProps & React.RefAttributes<HTMLSpanElement>>;

interface DividerProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
    /** 'horizontal' (default) or 'vertical' (between items in a row: it takes the row's height). */
    orientation?: 'horizontal' | 'vertical';
    /** Text in the middle of a horizontal line, such as "or". */
    label?: React.ReactNode;
    /** Leaves it out of the accessibility tree, when it's only decoration. Default: false. */
    decorative?: boolean;
}
/** A line between content, horizontal or vertical, with an optional label such as "or". */
declare const Divider: React.ForwardRefExoticComponent<DividerProps & React.RefAttributes<HTMLElement>>;

interface DrawerProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'title' | 'open'> {
    /** Whether it's open. Controlled: close it yourself in onOpenChange. */
    open?: boolean;
    /** Open at first, then it closes itself (uncontrolled), for one shown on arrival. Default: false. */
    defaultOpen?: boolean;
    /** Called with false when people ask to close it, and why: { reason: 'escape' | 'close' (the ×) | 'outside' (the backdrop) | 'swipe' | 'api' (the browser closed it) }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** The edge it slides in from: 'right' (default), 'left', 'top' or 'bottom'. */
    side?: 'right' | 'left' | 'top' | 'bottom';
    /** The width of a left or right drawer: 'sm' 320px, 'md' 384px (default) or 'lg' 512px, at most the screen. Top and bottom drawers fit their content. */
    size?: 'sm' | 'md' | 'lg';
    /** The heading, which also names the drawer. */
    title?: React.ReactNode;
    /** A muted line under the title, read when it opens. */
    description?: React.ReactNode;
    /** Buttons pinned to the bottom, under a line: the main action last. */
    footer?: React.ReactNode;
    /** Shows the × in the corner. Default: true. */
    closeButton?: boolean;
    /** The × button's name. Default: 'Close'. */
    closeLabel?: string;
    /** Whether a click on the backdrop closes it. Default: true. */
    closeOnBackdrop?: boolean;
    /** false: a side panel next to the page instead of over it. No backdrop, the page stays usable and scrolls, and
        focus can leave it; Escape inside it and the × still close it. Default: true. */
    modal?: boolean;
    /** A touch drag toward its edge closes it (onOpenChange(false, { reason: 'swipe' })). Top and bottom drawers
        are dragged by the header or footer, so the body still scrolls. Default: true. */
    swipeToClose?: boolean;
    /** The element that takes focus when it opens, instead of the first that can (the ×) or one marked data-autofocus: the field people came to fill. */
    initialFocus?: React.RefObject<HTMLElement | null>;
    /** Where focus goes when it closes, instead of back to what had it before (taken when that's gone): the next row after the one it deleted, say. */
    finalFocus?: React.RefObject<HTMLElement | null>;
    /** There are changes that would be lost: Escape, the ×, the backdrop, a swipe or the browser closing it first ask "Discard changes?" (an alert dialog, Keep editing focused), and onOpenChange(false) comes only after Discard. Leaving the page asks too (beforeunload). Your own Cancel button closes it directly, so ask there yourself if it should. Default: false. */
    unsaved?: boolean;
}
/** A modal panel that slides in from an edge: navigation, filters, details. */
declare const Drawer: React.ForwardRefExoticComponent<DrawerProps & React.RefAttributes<HTMLDialogElement>>;

interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** A picture of what's missing: an icon name ('inbox', 'search_off') or an element (an illustration). */
    icon?: IconSource;
    /** What's empty, in a few words: "No projects yet". */
    title: React.ReactNode;
    /** What it means or what to do next. */
    description?: React.ReactNode;
    /** One or two Buttons: the way out ("New project"). */
    actions?: React.ReactNode;
    /** 'md' (default) or 'sm' (inside a card, a table or a menu). */
    size?: 'sm' | 'md';
    /** 'plain' (default) or 'dashed': a dashed frame, for a drop zone or a slot to fill. */
    variant?: 'plain' | 'dashed';
    /** The title's heading level, to fit the page outline. Default: 3. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Says the title and description to screen readers once, politely, as it appears: for a result shown after a search
        or a filter ("No results for “mars”"), which would otherwise appear in silence. Not for an empty page on arrival. Default: false. */
    announce?: boolean;
    /** After a search that found nothing: searches to try instead, such as a spelling fix ("Did you mean: mars").
        Each is a link-style button that calls onSuggestion; without onSuggestion they're plain text. */
    suggestions?: string[];
    /** Called with the suggestion picked: run that search. */
    onSuggestion?: (suggestion: string) => void;
    /** Adds a "Clear filters" button after the actions, which calls this: the usual way out of no results. */
    onClearFilters?: () => void;
}
/** What to show when there's nothing yet: an icon, a title, a description and the action that fills it. */
declare const EmptyState: React.ForwardRefExoticComponent<EmptyStateProps & React.RefAttributes<HTMLDivElement>>;

interface ErrorBoundaryFallbackProps {
    /** What was thrown. */
    error: unknown;
    /** Clears the error and renders the children again. */
    reset: () => void;
}
interface ErrorBoundaryProps {
    /** The part of the page to guard. */
    children?: React.ReactNode;
    /** What to show instead when something inside throws while rendering. Default: a danger Alert with a title, a
        description and a "Try again" button. A function gets { error, reset }. */
    fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
    /** The default fallback's title. Default: "Something went wrong" (the errorTitle label). */
    title?: React.ReactNode;
    /** The default fallback's message. Default: "This part of the page couldn't load." (errorDescription). */
    description?: React.ReactNode;
    /** Called with the error and React's component stack, for logging or reporting. */
    onError?: (error: unknown, info: React.ErrorInfo) => void;
    /** Called when the error is cleared: Try again, reset(), or a change in resetKeys. */
    onReset?: () => void;
    /** Values that, when one changes, clear the error and render the children again (a route, an id). */
    resetKeys?: ReadonlyArray<unknown>;
    /** A class for the default fallback's box. */
    className?: string;
}
/** Catches a render error in its children and shows a fallback with "Try again", so one broken part doesn't take the page down. */
declare const ErrorBoundary: ((props: ErrorBoundaryProps) => React.ReactElement) & {
    displayName: string;
};

/** One error in the summary: the field it's about and what's wrong. */
interface ErrorSummaryItem {
    /** The id of the field (the <input>, <select> or <textarea>, or a group's first control) the error is about. */
    field: string;
    /** What's wrong and how to fix it, as the field's own error says it ("Enter your email address"). */
    message: React.ReactNode;
}
interface ErrorSummaryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** The errors, in the order of the fields on the page. With none, nothing renders. */
    errors: readonly ErrorSummaryItem[];
    /** The heading. Default: "There is a problem", or "There are N problems". */
    title?: React.ReactNode;
    /** The heading's level, h2 to h6, to fit the page's outline. Default: 2. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Text under the heading, before the list. */
    description?: React.ReactNode;
    /** Moves focus to the summary when it appears (a submit that failed), so it's read out and seen first. Default: true. */
    autoFocus?: boolean;
}
/** After a failed submit: a heading and a list of the form's errors, each a link that moves focus to its field. */
declare const ErrorSummary: React.ForwardRefExoticComponent<ErrorSummaryProps & React.RefAttributes<HTMLDivElement>>;

type FabPosition = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'static';
interface FabProps extends Omit<ButtonAsButtonProps, 'icon' | 'leftIcon' | 'rightIcon' | 'children' | 'variant' | 'size' | 'aria-label'> {
    /** The icon: a custom or Material Symbols name ("add") or any element. */
    icon: IconSource;
    /** What the button does. Shown next to the icon when extended; otherwise its aria-label and title. */
    label: string;
    /** Shows the label next to the icon (an extended FAB). Default: false. */
    extended?: boolean;
    /** 'md' (default, 56px) or 'sm' (40px). */
    size?: 'sm' | 'md';
    /** Where it's fixed on the screen: 'bottom-end' (default), 'bottom-start', 'top-end' or 'top-start', 24px from the corner; 'static' leaves the placing to you. */
    position?: FabPosition;
}
/** A floating action button: the screen's main action, round and raised, fixed to a corner. */
declare const Fab: React.ForwardRefExoticComponent<FabProps & React.RefAttributes<HTMLButtonElement>>;

interface FieldProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
    /** The label: a <label> linked to the control, or with group, the fieldset's <legend>. */
    label?: React.ReactNode;
    /** Help text under the label, before the control (text-muted); added to the control's aria-describedby. */
    hint?: React.ReactNode;
    /** An error message under the control (danger-text, with an icon); makes the control invalid and is added to its aria-describedby. */
    error?: React.ReactNode;
    /** A * after the label (hidden from screen readers) and aria-required on the control; with group, "Required" in words in the legend for screen readers. Add the control's own required for the browser's check. */
    required?: boolean;
    /** "(optional)" after the label, or your own words. Ignored with required. */
    optional?: boolean | string;
    /** Disables the control (with group, every control in the fieldset) and dims the label and hint. */
    disabled?: boolean;
    /** A <fieldset> with a <legend> for a set of checkboxes or radios; the hint and error describe the fieldset. */
    group?: boolean;
    /** 'vertical' (default): label, hint, control and error stacked. 'horizontal': the label in a column at the start
     *  (--field-label-width) on the control's first line, with the control, hint and error beside it, for dense
     *  settings forms; it stacks again when the field is too narrow for both. Not with group. */
    layout?: 'vertical' | 'horizontal';
    /** The control's id; by default the control's own id, or a generated one. */
    id?: string;
    /** One control (Input, Textarea, Select or any element), or with group, the set. */
    children?: React.ReactNode;
}
/** A label, an optional hint and an error message around one form control, wired up for screen readers. className and other attributes go to the outer element. */
declare const Field: ((props: FieldProps) => React.ReactElement) & {
    displayName: string;
};

/** A file size for people: 1.5 MB, 820 KB, 12 B. With a locale, in that locale's digits and units, the same as
 *  FormattedNumber format="bytes": formatFileSize(5_000_000, "id-ID") is "4,8 MB" (GR20). */
declare function formatFileSize(bytes: number, locale?: string): string;

type FileRejection = {
    file: File;
    reason: 'type' | 'size' | 'count' | 'folder' | 'duplicate';
    message: string;
};
interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'title'> {
    /** The chosen files (controlled). Use with onFilesChange. */
    files?: File[];
    /** Called with the new list when files are added or removed. */
    onFilesChange?: (files: File[]) => void;
    /** Called with the files that weren't added and why. They're also listed under the drop area. */
    onReject?: (rejections: FileRejection[]) => void;
    /** File types to allow, as for <input accept>: "image/*,.pdf". */
    accept?: string;
    /** Allows several files. Default: false (a new file replaces the old one). */
    multiple?: boolean;
    /** The largest file allowed, in bytes. */
    maxSize?: number;
    /** The most files allowed, with multiple. */
    maxFiles?: number;
    /** Turns the drop area and its button off, as a disabled native control. */
    disabled?: boolean;
    /** A danger outline on the drop area, and aria-invalid on the native input; the choose button is described by the error (a button supports neither aria-invalid nor aria-errormessage). In a Field with an error, it's set for you. */
    invalid?: boolean;
    /** Required for the form's check (on the native input) and aria-required on the choose button. In a required Field, aria-required is set for you. */
    required?: boolean;
    /** The chosen files are shown and submitted, but can't be changed: the choose button stays focusable (aria-disabled) and doesn't open the picker, dropped files are ignored and there are no remove buttons. */
    readOnly?: boolean;
    /** Submits the files with a form, through the native file input. */
    name?: string;
    /** The id of the form the files submit with, when the FileUpload sits outside it (like an input's form attribute). */
    form?: string;
    /** The drop area's title. Default: "Drag files here" ("Drag a file here" without multiple). */
    title?: React.ReactNode;
    /** The button's text. Default: "Choose files" ("Choose a file"). */
    buttonLabel?: string;
    /** A muted line, such as "PNG or JPG, up to 5 MB". */
    hint?: React.ReactNode;
    /** The remove buttons' names, given the file name. Default: (name) => `Remove ${name}`. */
    removeLabel?: (name: string) => string;
}
/** A drop area and a button for choosing files, with the chosen files listed under it. */
declare const FileUpload: React.ForwardRefExoticComponent<FileUploadProps & React.RefAttributes<HTMLDivElement>>;

/** How FormattedNumber writes a number: as is, short (1.2K), a share (45%), money, a file size or a unit. */
type NumberFormat = 'decimal' | 'compact' | 'percent' | 'currency' | 'bytes' | 'unit';
interface FormatNumberOptions extends Intl.NumberFormatOptions {
    /** 'decimal' (default), 'compact', 'percent' (0.45 is 45%), 'currency' (with currency), 'bytes' or 'unit' (with unit). */
    format?: NumberFormat;
}
/** A number in the locale's words: formatNumber(1234, "id-ID") is "1.234"; { format: "compact" } "1,2 rb"; "bytes" "1,5 MB". */
declare function formatNumber(value: number | bigint, locale?: string, options?: FormatNumberOptions): string;

interface FormattedNumberProps extends Omit<React.DataHTMLAttributes<HTMLDataElement>, 'children' | 'value'> {
    /** The number. NaN renders an empty element. */
    value: number | bigint;
    /** 'decimal' (default), 'compact' (1.2K), 'percent' (0.45 is 45%), 'currency' (with currency), 'bytes' (1.5 MB) or 'unit' (with unit). */
    format?: NumberFormat;
    /** With format="currency": an ISO 4217 code, "IDR", "USD", "EUR". */
    currency?: string;
    /** With format="unit": a unit Intl knows, "kilometer-per-hour", "celsius", "liter". */
    unit?: string;
    /** Any other Intl.NumberFormat options (maximumFractionDigits, signDisplay, currencyDisplay...); these win. */
    options?: Intl.NumberFormatOptions;
    /** A locale for this one; otherwise the SerupaProvider's, else the browser's. */
    locale?: string;
}
/** A number written the way the reader's locale writes it: plain, compact, a percentage, money, a size or a unit. */
declare const FormattedNumber: React.ForwardRefExoticComponent<FormattedNumberProps & React.RefAttributes<HTMLDataElement>>;

interface GridProps extends React.HTMLAttributes<HTMLElement> {
    /** A number of equal columns (1 to 12), or 'auto' (default): as many columns as fit, each at least minColumnWidth.
        A number with minColumnWidth is "up to": that many on a wide screen, fewer as columns would get narrower than minColumnWidth. */
    columns?: number | 'auto';
    /** The narrowest a column gets, a CSS length or a sizing token name ('container-3xs'). Default: 256px (container-3xs) with columns="auto"; none with a number. */
    minColumnWidth?: string;
    /** With columns="auto" or "up to": a short last row's cells stretch across the empty columns (auto-fit), so two cards on a wide screen share the width. Default: false (empty columns stay, so cells line up with the rows above). */
    fill?: boolean;
    /** The space between cells, a step of the spacing scale. Default: 4 (16px). */
    gap?: Space;
    /** The element. Default: 'div'. */
    as?: 'div' | 'section' | 'ul' | 'ol';
}
/** Equal columns, or as many as fit, with even space from the spacing scale between cells. */
declare const Grid: React.ForwardRefExoticComponent<GridProps & React.RefAttributes<HTMLElement>>;

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    /** The heading element, h1 to h6: pick the level that fits the page's outline. Default: 2. */
    level?: HeadingLevel;
    /** The look, from the type scale, separate from the level. Default: the level's own (1: 3xl, 2: 2xl, 3: xl, 4: lg, 5: base, 6: sm). */
    size?: HeadingSize;
}
/** A heading (h1 to h6) in the system's type: level sets the element, size the look. */
declare const Heading: React.ForwardRefExoticComponent<HeadingProps & React.RefAttributes<HTMLHeadingElement>>;

interface HighlightProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** The text to show. */
    children: string;
    /** What to mark in it: a search ("lod"), or several terms. Matched ignoring case, accents and width, as
        Combobox matches: "lodz" marks "Łódź". Empty: nothing is marked. */
    query: string | ReadonlyArray<string>;
    /** Marks every word of a query on its own ("new york" marks "New" and "York" wherever they are). Default: false,
        the query as one phrase. */
    words?: boolean;
}
/** Where query matches text, as [start, end) offsets into text (UTF-16), in order and not overlapping. Matched as
    fold() matches: case, accents and width ignored. */
declare function highlightRanges(text: string, query: string | ReadonlyArray<string>, words?: boolean): Array<[number, number]>;
/** Text with the parts that match a search marked, ignoring case and accents. */
declare const Highlight: React.ForwardRefExoticComponent<HighlightProps & React.RefAttributes<HTMLSpanElement>>;

interface HoverCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
    /** The element it previews: one element that can take focus, usually a link to the page with the full details. */
    trigger: React.ReactElement;
    /** What the card shows: a person's name, photo and role, a page's title and summary. Links and buttons are fine. */
    children: React.ReactNode;
    /** Where it goes: 'bottom' (default), 'top', 'left', 'right', with '-start' or '-end'. It flips when there's no room. */
    placement?: Placement;
    /** Milliseconds the pointer rests on the trigger, or keyboard focus stays on it, before the card opens. Default: 500. */
    openDelay?: number;
    /** Milliseconds after the pointer leaves the trigger and the card (or focus leaves both) before it closes. Default: 300. */
    closeDelay?: number;
    /** Open it yourself (controlled), with onOpenChange. */
    open?: boolean;
    /** Open at first (uncontrolled). Default: false. */
    defaultOpen?: boolean;
    /** Called when it asks to open or close, with why: { reason: 'hover' | 'focus' | 'blur' | 'escape' | 'outside' }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** Never opens, for example while the trigger is disabled. */
    disabled?: boolean;
    /** Classes on the card. The other HTML attributes (id, data-*, aria-*) and the ref go on the card too. */
    className?: string;
    /** Styles on the card. */
    style?: React.CSSProperties;
}
/** A preview card for a link, shown on hover and keyboard focus, that may hold links of its own. */
declare const HoverCard: React.ForwardRefExoticComponent<HoverCardProps & React.RefAttributes<HTMLDivElement>>;

type Without<T> = T extends unknown ? Omit<T, 'icon' | 'leftIcon' | 'rightIcon' | 'children' | 'aria-label'> : never;
interface IconButtonOwnProps {
    /** The icon: a custom or Material Symbols name ("more_vert") or any element. */
    icon: IconSource;
    /** What the button does, for screen readers (its aria-label) and as a tooltip (title). Required: an icon alone has no name. */
    label: string;
    /** 'square' (default, the Button's corners) or 'round'. */
    shape?: 'square' | 'round';
    /** Leaves out the title tooltip, for when visible text already shows the label. A wrapping Tooltip (aria-describedby or aria-labelledby) leaves it out by itself. Default: false. */
    hideTitle?: boolean;
}
type IconButtonProps = Without<ButtonAsButtonProps> & IconButtonOwnProps | Without<ButtonAsLinkProps> & IconButtonOwnProps;
type IconButtonElement = HTMLButtonElement | HTMLAnchorElement;
/** A Button that shows only an icon, with a required label for screen readers. Default variant: ghost. */
declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<IconButtonElement>>;

type ImageRatio = 'auto' | 'square' | '4:3' | 'video' | number;
interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src' | 'placeholder' | 'children'> {
    /** The picture's address. */
    src: string;
    /** What the picture shows, for people who can't see it. Required: use "" only for a decorative picture. */
    alt: string;
    /** The frame's shape: 'auto' (the picture's own, default), 'square' (1:1), '4:3', 'video' (16:9) or a number (width / height). */
    ratio?: ImageRatio;
    /** How the picture fills a fixed ratio: 'cover' (fills and crops, default) or 'contain' (fits whole). */
    fit?: 'cover' | 'contain';
    /** Rounded corners (--image-radius). Default: true. */
    rounded?: boolean;
    /** What shows if the picture fails to load. Default: a muted broken-image icon. */
    fallback?: React.ReactNode;
    /** Makes it a button that opens the picture full size in a viewer. Default: false. */
    viewable?: boolean;
    /** A larger version for the viewer. Default: src. */
    fullSrc?: string;
    /** The view button's name. Default: "View image" plus the alt text. */
    viewLabel?: string;
    /** Shows a remove button in the corner; called when it's pressed. */
    onRemove?: () => void;
    /** The remove button's name. Default: "Remove image" plus the alt text. */
    removeLabel?: string;
    /** The main picture at the top of a page (a hero): loads at once with high priority instead of lazily, so it
     *  shows sooner (Largest Contentful Paint). Default: false. */
    priority?: boolean;
    /** Other versions of the picture for some screens or formats (art direction, AVIF or WebP), tried in order before
     *  src: each one becomes a <source> in a <picture> around the <img>. */
    sources?: ImageSource[];
    /** A version for a dark color scheme (a chart or logo drawn on dark): shown when the page's theme is dark (a *-dark
     *  data-theme or data-mode), or, where the theme follows the screen, when the screen prefers dark. */
    darkSrc?: string;
    /** Dims a photo a shade in a dark color scheme, so a bright one doesn't glare on a dark page (--image-dim). Default: false. */
    dim?: boolean;
    /** Props for the outer frame, such as style for its width. */
    frameProps?: React.HTMLAttributes<HTMLSpanElement>;
}
/** One <source> of a picture: srcSet, and the media query or type it's for. */
interface ImageSource {
    srcSet: string;
    /** A media query this version is for, such as "(max-width: 640px)". */
    media?: string;
    /** Its format, such as "image/avif": a browser that can't show it moves on. */
    type?: string;
    /** How wide it shows, for w descriptors in its srcSet. Default: the frame's width when lazy, as for the <img>. */
    sizes?: string;
    /** Its own size, when it has another shape than src (a cropped phone version). */
    width?: number;
    height?: number;
}
/** A picture in a frame with a ratio, a loading placeholder and an error fallback; optionally opens full size or can be removed. */
declare const Image: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>;

interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> {
    /** What the text is ("Project name"): the field's name while editing, and part of the button's name ("Project name: Apollo, Edit"). */
    label: string;
    /** The text (controlled). Use with onValueChange. */
    value?: string;
    /** The text at first (uncontrolled). */
    defaultValue?: string;
    /** Called with the new text when it's saved (Enter, or leaving the field) and has changed. */
    onValueChange?: (value: string) => void;
    /** Called when editing ends without saving (Escape). */
    onCancel?: () => void;
    /** Checks the text before it's saved: return an error message to keep the field open and show it, or nothing to save. It can return a Promise for a check on the server: the field stays open, aria-busy, until it settles. Leaving the field with a failing text keeps it open with the message, which is said, and leaves focus where it went. */
    validate?: (value: string) => React.ReactNode | Promise<React.ReactNode>;
    /** Shown (in the muted color) when the text is empty. */
    placeholder?: string;
    /** 'sm', 'md' (default) or 'lg': Input's heights and text sizes, in both modes, so nothing moves when it opens. */
    size?: 'sm' | 'md' | 'lg';
    /** Whether the field is open (controlled). Use with onEditingChange. */
    editing?: boolean;
    /** Open at first (uncontrolled), with the field focused, such as a new row's name. Default: false. */
    defaultEditing?: boolean;
    /** Called with true when it opens and false when it closes. */
    onEditingChange?: (editing: boolean) => void;
    /** Shows the text without an edit button. */
    disabled?: boolean;
    /** Shows the text without an edit button, in the full text color. */
    readOnly?: boolean;
    /** The word after the text in the button's name. Default: "Edit" (from SerupaProvider labels). */
    editLabel?: string;
    /** Props for the <input> while editing: maxLength, autoComplete, spellCheck, inputMode… */
    inputProps?: Omit<InputProps, 'value' | 'defaultValue' | 'size' | 'aria-label'>;
}
/** Text people can click to edit in place: Enter or leaving saves, Escape cancels. */
declare const InlineEdit: React.ForwardRefExoticComponent<InlineEditProps & React.RefAttributes<HTMLDivElement>>;

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
    /** A combination, one key each: ['mod', 'K'], ['shift', 'enter']. Names below show as symbols on Apple devices. Or pass one key as children. */
    keys?: string[];
    /** 'sm' (20px) or 'md' (24px, default). */
    size?: 'sm' | 'md';
}
/** A keyboard key or shortcut, drawn as keycaps; "mod" follows the platform (⌘ or Ctrl). */
declare const Kbd: React.ForwardRefExoticComponent<KbdProps & React.RefAttributes<HTMLElement>>;

/** One shortcut in the help dialog. */
interface Shortcut {
    /** The keys, pressed together, as Kbd takes them: ['mod', 'K'], ['?']. */
    keys: string[];
    /** What it does, in a few words ("Search", "New message"). */
    description: string;
    /** The heading it's listed under. Default: "General". */
    group?: string;
}
interface ShortcutOptions {
    /** What it does, listed in <KeyboardShortcuts>'s dialog. Without it, the shortcut works but isn't listed. */
    description?: string;
    /** The heading it's listed under. Default: "General". */
    group?: string;
    /** false turns it off for now (default true). */
    enabled?: boolean;
    /** Also fire while typing in a text field. Shortcuts with mod, ctrl or cmd always do; others don't by default,
     *  so "/" or "N" can still be typed. */
    inInputs?: boolean;
}
interface KeyboardShortcutsProps extends Omit<DialogProps, "title" | "description" | "footer" | "alert" | "children" | "size" | "fullScreen" | "initialFocus" | "finalFocus" | "closeButton" | "closeOnBackdrop" | "closeLabel" | "unsaved"> {
    /** The dialog's title. Default: "Keyboard shortcuts" (labels.keyboardShortcuts). */
    title?: React.ReactNode;
    /** Shortcuts to list that aren't set up with useShortcut, such as the browser's or another library's. */
    shortcuts?: Shortcut[];
    /** The keys that open it (default ['?']); false for none, when you open it yourself. */
    helpKeys?: string[] | false;
}
/** Runs handler when the keys are pressed (["mod", "K"]: one key and its modifiers), and lists it in <KeyboardShortcuts> when it has a description. */
declare function useShortcut(keys: string | string[], handler: (event: KeyboardEvent) => void, options?: ShortcutOptions): void;
/** The help dialog listing the page's keyboard shortcuts in Kbd, opened with "?"; set them up with useShortcut. */
declare const KeyboardShortcuts: React.ForwardRefExoticComponent<KeyboardShortcutsProps & React.RefAttributes<HTMLDialogElement>>;

/** Link's own props, beside those of the element it renders. */
interface LinkOwnProps {
    /** 'primary' (default): the primary color. 'neutral': the surrounding text's color, still underlined. */
    tone?: 'primary' | 'neutral';
    /** 'always' (default): underlined, so it's a link without relying on color. 'hover': only on hover and focus, for links whose place already says they're links (a nav bar, a footer). */
    underline?: 'always' | 'hover';
    /** Opens in a new tab (target="_blank", rel="noopener noreferrer"), with a new-tab icon and "(opens in a new tab)" for screen readers (the opensInNewTab label). Default: false. */
    external?: boolean;
}
/** Link's props: its own, `as`, and the props of the element `as` names (an <a>'s by default), so
 *  <Link as={RouterLink} to="/settings"> takes RouterLink's `to`, and its ref is that element's. */
type LinkProps<C extends React.ElementType = 'a'> = LinkOwnProps & {
    /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a' (it gets href, className and the rest). */
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof LinkOwnProps | 'as'>;
/** An inline text link: underlined, primary or the text's color. external opens a new tab and says so. `as` renders your router's link, typed with its props. */
declare const Link: {
    <C extends React.ElementType = "a">(props: LinkProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): React.ReactElement | null;
    displayName?: string;
};

interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
    /** ListItems. */
    children?: React.ReactNode;
    /** 'plain' (default) or 'card': inside a bordered, rounded frame. */
    variant?: 'plain' | 'card';
    /** Lines between items. Default: true. */
    divided?: boolean;
    /** 'ul' (default) or 'ol' when the order matters. */
    as?: 'ul' | 'ol';
}
interface ListItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title" | "onClick"> {
    /** The item's main line. */
    title: React.ReactNode;
    /** A second, muted line. */
    description?: React.ReactNode;
    /** Before the text: an Avatar, an icon name or an image. */
    leading?: IconSource;
    /** After the text: meta (a date, a Badge) or actions (an IconButton, a Menu). Stays outside the link or button. */
    trailing?: React.ReactNode;
    /** Makes the item's main area a link. */
    href?: string;
    /** Makes the item's main area a button (when there's no href). */
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a'. Its props go in linkProps. */
    as?: React.ElementType;
    /** Extra props for the link or button (to for a router link, target, aria-*). */
    linkProps?: Record<string, unknown>;
    /** Shaded with a primary bar at its start, and aria-current="true" (or aria-pressed for a button). For the current page in a nav list, also pass linkProps={{ "aria-current": "page" }}, which wins. Default: false. */
    selected?: boolean;
    /** Dims a link or button item and stops it. Default: false. */
    disabled?: boolean;
}
/** Rows of related things: title, description, leading avatar or icon, trailing meta or actions; rows can be links. */
declare const List: React.ForwardRefExoticComponent<ListProps & React.RefAttributes<HTMLUListElement>>;
/** One row in a List. */
declare const ListItem: React.ForwardRefExoticComponent<ListItemProps & React.RefAttributes<HTMLLIElement>>;

interface LoadMoreProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Loads the next page. Return a promise: the button shows loading and takes no second press until it settles. */
    onLoadMore: () => void | PromiseLike<unknown>;
    /** false once there's nothing more: the button gives way to "You've reached the end" (endText). Default: true. */
    hasMore?: boolean;
    /** Loading from outside (your own fetch state), on top of a promise from onLoadMore. */
    loading?: boolean;
    /** How many items are shown now. When it grows, the number added is announced ("20 more loaded"). */
    count?: number;
    /** How many there are in all: with count, shows "Showing 20 of 134" and adds it to the announcement. */
    total?: number;
    /** Loads on its own when the button scrolls near the viewport (infinite scroll); the button stays for keyboard users
        and as the fallback. It loads once each time it comes near, and again only after count changes. Default: false. */
    infinite?: boolean;
    /** The button's text, in place of "Load more" ("Show 20 more"). */
    label?: React.ReactNode;
    /** Shown in place of the button once hasMore is false. Default: "You've reached the end"; null shows nothing. */
    endText?: React.ReactNode;
}
/** The end of a paged list: "Showing 20 of 134", a Load more button (or infinite scroll), and an announcement of what each load added. */
declare const LoadMore: React.ForwardRefExoticComponent<LoadMoreProps & React.RefAttributes<HTMLDivElement>>;

type LoaderVariant = 'ring' | 'spokes' | 'dots' | 'pixel' | 'text' | 'skeleton';
type LoaderShape = 'text' | 'circle' | 'rect';
type LoaderPattern = 'wave' | 'random' | 'sweep' | 'fall' | 'rise' | 'snake' | 'spiral' | 'cross' | 'checker';
type LoaderTone = 'neutral' | 'primary' | 'muted' | 'inverse';
interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** 'ring' (default): an arc that grows and shrinks as it turns on a faint track. 'spokes': eight rounded spokes fading round a circle, ticking a spoke at a time, like the iOS activity indicator. 'dots': three pulsing dots, softer, for chat-like or inline waits. 'pixel': a 3×3 grid of squares lighting up in a diagonal wave. 'text': the label's words with a shine sweeping through them. 'skeleton': placeholder shapes where the content will be (see shape). */
    variant?: LoaderVariant;
    /** sm 16px (inline, small controls), md 24px (default: cards, panels, lists), lg 40px (a page or empty area). The text variant's words, and the skeleton's text lines: text-xs, text-sm, text-base. The skeleton circle: 16, 24 or 40px. */
    size?: 'sm' | 'md' | 'lg';
    /** 'neutral' (default): the text color, so it fits any surface. 'primary' or 'muted' color the ring, dots or pixel grid with those aliases (the text and skeleton variants stay in the text color). 'inverse': white in every theme, for dark scrims, overlays and media. */
    tone?: LoaderTone;
    /** Announced to screen readers when the loader appears, and its accessible name (role="progressbar"); the words the text variant shows. Default: 'Loading'. Pass '' when something nearby already announces it (the loader is then decorative). In a group of skeletons, name one and pass '' to the rest. */
    label?: string;
    /** Skeleton only. 'text' (default): lines as tall as the size's text line, full width, the last of several shorter. 'circle': an avatar, the size's 24px by default. 'rect': an image or card, full width and 96px tall. Set width and height with className (w-48, size-12, h-40). */
    shape?: LoaderShape;
    /** Skeleton with shape 'text': how many lines, 1 (default) to 20. */
    lines?: number;
    /** Pixel only. 'wave' (default): a wave of light runs along the diagonals from the top-left. 'random': each square twinkles on its own clock, so they light up in an ever-changing order. 'sweep': columns, left to right. 'fall': rows, top to bottom. 'rise': rows, bottom to top. 'snake': square by square, left to right then back, row by row. 'spiral': clockwise round the edge, then the center. 'cross': the corners, then the plus. 'checker': the X, then the edges. */
    pattern?: LoaderPattern;
    /** Pixel only: a soft halo of the loader's color round the lit squares (--loader-pixel-glow-size, 2px). Best on dark surfaces. Default false. */
    glow?: boolean;
    /** Milliseconds to wait before showing, so fast requests don't flash a loader. Its space is kept meanwhile. Default: 300. 0 shows it at once. */
    delay?: number;
    /** Whether it's loading. Keep the Loader mounted and pass false when the work ends: once shown, it stays at least 500ms, so it never flashes, then renders nothing. Default: true. */
    loading?: boolean;
}
/** Shows that something is loading when you can't say how far along it is. Mark the area that's loading with aria-busy while it shows. */
declare const Loader: React.ForwardRefExoticComponent<LoaderProps & React.RefAttributes<HTMLSpanElement>>;

interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
    /** The button that opens the menu: one element, such as a Button or IconButton. It gets aria-haspopup, aria-expanded and the keys. */
    trigger: React.ReactElement;
    /** MenuItem, MenuGroup and MenuSeparator. */
    children: React.ReactNode;
    /** Where the menu goes: 'bottom-start' (default), 'bottom-end', 'top-start', 'top-end', or any Tooltip placement. It flips when there's no room. */
    placement?: Placement;
    /** Open it yourself (controlled), with onOpenChange. */
    open?: boolean;
    /** Open at first (uncontrolled), such as a menu a page returns to. Default: false. */
    defaultOpen?: boolean;
    /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' (Tab) | 'select' (an item chosen) }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** The menu's name for screen readers. Default: the trigger's text, by aria-labelledby. */
    'aria-label'?: string;
    /** Classes on the menu panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
    className?: string;
    /** Styles on the menu panel. */
    style?: React.CSSProperties;
}
/** A list of actions behind a button: MenuItem, MenuGroup and MenuSeparator inside. */
declare const Menu: React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>>;
interface ContextMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
    /** The area the menu belongs to: one element, such as a Card, a table row or a canvas. A right-click (a long
        press on touch), Shift+F10 or the Menu key in it opens the menu. */
    target: React.ReactElement;
    /** MenuItem, MenuGroup, MenuSub and MenuSeparator. */
    children: React.ReactNode;
    /** The menu's name for screen readers ("File actions"). Required: there's no button to take it from. */
    'aria-label': string;
    /** Open it yourself (controlled), with onOpenChange. It opens where it was last asked for, or at the target. */
    open?: boolean;
    /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' (Tab) | 'select' (an item chosen) }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** Leaves the browser's own menu in place: the target's right-click and keys do nothing. Default: false. */
    disabled?: boolean;
    /** Classes on the menu panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
    className?: string;
    /** Styles on the menu panel. */
    style?: React.CSSProperties;
}
/** A Menu that opens at the pointer on a right-click, or at the focused element on Shift+F10 or the Menu key. */
declare const ContextMenu: React.ForwardRefExoticComponent<ContextMenuProps & React.RefAttributes<HTMLDivElement>>;
/** MenuItem's own props, beside those of the element it renders. */
interface MenuItemOwnProps {
    /** Called when the item is chosen (click, Enter or Space). The menu then closes, unless you call event.preventDefault(). */
    onSelect?: (event: React.SyntheticEvent) => void;
    /** An icon before the label: an icon name or any element. */
    icon?: IconSource;
    /** A keyboard shortcut shown at the end, such as "⌘K" or "Ctrl+Shift+P". Only a hint: wire the shortcut yourself.
        It's also given to assistive tech as aria-keyshortcuts ("Meta+K"), worked out from it; pass aria-keyshortcuts
        to set that yourself. */
    shortcut?: string;
    /** Danger colors, for deleting. */
    destructive?: boolean;
    /** Still reachable with the keys, but can't be chosen (aria-disabled). */
    disabled?: boolean;
}
interface MenuItemBaseProps extends MenuItemOwnProps, Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
    /** Makes it a link (the configure({ link }) component, <a> by default). */
    href?: string;
    /** Makes it a link with this component, in place of the configure({ link }) one: a router's Link, with its own props (to). */
    as?: React.ElementType;
    /** Where the link opens, as on <a>; with "_blank", rel defaults to "noopener noreferrer". */
    target?: string;
    /** The link's relation to the page, as on <a>. */
    rel?: string;
}
/** One action in a Menu, or with href a link. `as` renders your router's link, typed with its props. */
declare const MenuItem: {
    <C extends React.ElementType = "a">(props: MenuItemProps<C> & {
        ref?: React.Ref<HTMLElement>;
    }): React.ReactElement | null;
    displayName?: string;
};
/** MenuItem's props: its own, `as`, and the props of the element `as` names (an <a>'s by default, for href, target
 *  and rel), so <MenuItem as={RouterLink} to="/settings"> takes RouterLink's `to`. */
type MenuItemProps<C extends React.ElementType = 'a'> = MenuItemOwnProps & {
    /** Makes it a link with this component, in place of the configure({ link }) one: a router's Link, with its own props (to). */
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof MenuItemOwnProps | 'as'>;
type CheckableProps = Omit<MenuItemBaseProps, 'href' | 'as' | 'target' | 'rel' | 'destructive' | 'role' | 'aria-checked'>;
interface MenuCheckboxItemProps extends CheckableProps {
    /** Whether it's on. The menu's items unmount while it's closed, so the state lives with you: set it in onCheckedChange. */
    checked: boolean;
    /** Called with the new state when it's chosen (click, Enter or Space). */
    onCheckedChange?: (checked: boolean) => void;
}
/** A setting in a Menu that's on or off, such as "Show grid". */
declare const MenuCheckboxItem: React.ForwardRefExoticComponent<MenuCheckboxItemProps & React.RefAttributes<HTMLElement>>;
interface MenuRadioGroupProps extends Omit<MenuGroupProps, 'defaultValue' | 'onChange'> {
    /** The chosen item's value. The menu's items unmount while it's closed, so the state lives with you: set it in onValueChange. */
    value: string | undefined;
    /** Called with the item's value when one is chosen. */
    onValueChange?: (value: string) => void;
}
/** A group of MenuRadioItems, one of them chosen. */
declare const MenuRadioGroup: React.ForwardRefExoticComponent<MenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
interface MenuRadioItemProps extends CheckableProps {
    /** The value MenuRadioGroup chooses with this item. */
    value: string;
}
/** One choice in a MenuRadioGroup. */
declare const MenuRadioItem: React.ForwardRefExoticComponent<MenuRadioItemProps & React.RefAttributes<HTMLElement>>;
interface MenuSubProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
    /** The item's label, which also names the submenu. */
    label: React.ReactNode;
    /** MenuItem, MenuGroup, MenuSeparator, and MenuSub again. */
    children: React.ReactNode;
    /** An icon before the label: an icon name or any element. */
    icon?: IconSource;
    /** Still reachable with the keys, but doesn't open (aria-disabled). */
    disabled?: boolean;
}
/** An item that opens a submenu of more items. */
declare const MenuSub: React.ForwardRefExoticComponent<MenuSubProps & React.RefAttributes<HTMLElement>>;
interface MenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** A small heading over the group, which also names it. */
    label?: React.ReactNode;
}
/** Items that belong together, with an optional heading. */
declare const MenuGroup: React.ForwardRefExoticComponent<MenuGroupProps & React.RefAttributes<HTMLDivElement>>;
type MenuSeparatorProps = React.HTMLAttributes<HTMLDivElement>;
/** A line between groups of items. */
declare const MenuSeparator: React.ForwardRefExoticComponent<MenuSeparatorProps & React.RefAttributes<HTMLDivElement>>;

type MeterState = 'optimum' | 'suboptimal' | 'poor' | 'none';
interface MeterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The measured value, between min and max. */
    value: number;
    /** The lowest possible value. Default: 0. */
    min?: number;
    /** The highest possible value. Default: 100. */
    max?: number;
    /** Values under this are low. With high, it sets the zones that color the bar. */
    low?: number;
    /** Values over this are high. */
    high?: number;
    /** The best value. Under low: low values are good (a fill rate). Over high: high values are good (a battery). In
        between, or left out: the middle zone is good and both ends are less good (a temperature). */
    optimum?: number;
    /** The bar's thickness: 'sm' 4px, 'md' 8px (default), 'lg' 12px. */
    size?: 'sm' | 'md' | 'lg';
    /** A visible name above the bar, which also names it. Without one, give it an aria-label. */
    label?: React.ReactNode;
    /** Shows the value at the end of the label row, in the same words as the read-out ("92%, high"). Default: false. */
    showValue?: boolean;
    /** Turns the value into words, shown and read out: (value, min, max) => "7.2 of 10 GB". Default: the share as the
        locale writes a percentage ("72%"). Say what a colored zone means here too, such as "92%, almost full". */
    formatValue?: (value: number, min: number, max: number) => string;
}
/** Which zone value is in, as HTML's <meter> works it out: optimum (success), suboptimal (warning) or poor (danger);
    'none' when there's no low or high, so no zones. */
declare function meterState(value: number, min: number, max: number, low?: number, high?: number, optimum?: number): MeterState;
/** A measurement within a known range (storage used, strength, a level): a bar with role="meter", colored by the low, high and optimum zones. */
declare const Meter: React.ForwardRefExoticComponent<MeterProps & React.RefAttributes<HTMLDivElement>>;

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    /** The logo or product name on the left, usually a link home. */
    brand?: React.ReactNode;
    /** NavbarLinks: the main pages. Below 768px they fold into a menu button. */
    children?: React.ReactNode;
    /** Controls on the right: a search, a user menu, a sign-in button. */
    actions?: React.ReactNode;
    /** Keeps the bar at the top while the page scrolls, and keeps what the keyboard focuses (or a #link jumps to)
     *  from scrolling under it. Default: false. */
    sticky?: boolean;
    /** The content's maximum width, like Container: 'prose', 'md', 'lg', 'xl' (default), '2xl' or 'full'. */
    size?: ContainerSize;
    /** The links' nav name. Default: "Main". */
    "aria-label"?: string;
    /** The menu button's name on small screens. Default: "Menu". */
    menuLabel?: string;
}
/** NavbarLink's own props, beside those of the element it renders. */
interface NavbarLinkOwnProps {
    /** The current page: shaded, with aria-current="page". Default: false. */
    active?: boolean;
}
/** NavbarLink's props: its own, `as`, and the props of the element `as` names (an <a>'s by default), so
 *  <NavbarLink as={RouterLink} to="/team"> takes RouterLink's `to`, and its ref is that element's. */
type NavbarLinkProps<C extends React.ElementType = 'a'> = NavbarLinkOwnProps & {
    /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof NavbarLinkOwnProps | 'as'>;
/** The bar across the top: brand, main links and actions. On small screens the links fold into a menu button. */
declare const Navbar: React.ForwardRefExoticComponent<NavbarProps & React.RefAttributes<HTMLElement>>;
/** A main page link in a Navbar. active marks the current page; following one closes the small-screen menu. `as` renders your router's link, typed with its props. */
declare const NavbarLink: {
    <C extends React.ElementType = "a">(props: NavbarLinkProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): React.ReactElement | null;
    displayName?: string;
};

type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
interface ToastOptions {
    /** The main line. */
    title: React.ReactNode;
    /** A muted line under it. */
    description?: React.ReactNode;
    /** 'neutral' (default, no icon), 'info', 'success', 'warning' or 'danger': an icon in the tone's color. */
    tone?: ToastTone;
    /** One button in the toast, such as Undo. Choosing it also closes the toast. */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Milliseconds before it goes. Default: the Toaster's duration, 5000 unless set. 0 keeps it, as autoDismiss false does. The time stops while it's hovered or focused, or the window is in the background. */
    duration?: number;
    /** Whether it goes by itself after its duration. Default: the Toaster's autoDismiss, true unless set, with an action
     *  too (its time stops while it's hovered or focused, and F8 reaches it). false keeps it until it's closed: for a
     *  message someone has to act on, such as a failed upload with Retry. */
    autoDismiss?: boolean;
    /** What screen readers announce. Default: the title and description, when they're text. */
    announcement?: string;
    /** Reuse an id to replace a toast that's showing (say, "Saving…" → "Saved"). */
    id?: string;
}
/** Shows a toast in the page's <Toaster> and returns its id. */
declare function show(options: ToastOptions | string): string;
/** Closes one toast, or every toast with no id. */
declare function dismiss(id?: string): void;
type Message<A> = ToastOptions | string | ((arg: A) => ToastOptions | string);
interface ToastPromiseMessages<T> {
    /** While it's pending: neutral, and it stays until the promise settles. */
    loading: ToastOptions | string;
    /** Once it resolves, replacing the loading toast; success tone. A function gets the value. */
    success: Message<T>;
    /** Once it rejects, replacing the loading toast; danger tone, said at once. A function gets the reason. */
    error: Message<unknown>;
}
declare function promise<T>(work: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>): Promise<T>;
interface ToastUndoOptions extends Omit<ToastOptions, "action" | "autoDismiss"> {
    /** Does the action for good. It runs once, when the toast closes without Undo: its time runs out, it's closed, or
     *  the page is left. */
    commit: () => void;
    /** Runs instead of commit when Undo is chosen: show things as they were. */
    onUndo?: () => void;
    /** The button's text. Default: "Undo" (labels.undo). */
    undoLabel?: string;
}
declare function undo(options: ToastUndoOptions): string;
/** Shows a toast in the page's <Toaster> and returns its id; toast.dismiss(id) closes it, toast.promise(p, { loading, success, error }) follows a promise, and toast.undo({ title, commit, onUndo }) does an action for good only if Undo isn't chosen. */
declare const toast: typeof show & {
    dismiss: typeof dismiss;
    promise: typeof promise;
    undo: typeof undo;
};
interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
    /** Where toasts appear: 'bottom-end' (default), 'bottom-start', 'bottom-center', 'top-start', 'top-center' or 'top-end'. Start and end follow the text direction. */
    position?: ToasterPosition;
    /** The region's name for screen readers. Default: 'Notifications'. */
    label?: string;
    /** The close button's name. Default: 'Dismiss'. */
    dismissLabel?: string;
    /** The most toasts shown at once; the newest show, and older ones wait under a "+2 more" line until there's room. Default: 3. */
    limit?: number;
    /** How long each toast stays, in milliseconds, unless it sets its own duration. Default: 5000. */
    duration?: number;
    /** Whether toasts go by themselves, unless one sets its own autoDismiss. Default: true. */
    autoDismiss?: boolean;
}
/** The place toast() messages appear: render one, once, near the root of the app. */
declare const Toaster: ((props: ToasterProps) => React.ReactElement) & {
    displayName: string;
};

/** One notification in the list. */
interface NotificationItem {
    /** Unique in the list; a toast's id when it came from one. */
    id: string;
    /** The main line. */
    title: React.ReactNode;
    /** A muted line under it. */
    description?: React.ReactNode;
    /** 'neutral' (default, no icon), 'info', 'success', 'warning' or 'danger', as a toast's. */
    tone?: ToastTone;
    /** When it happened, shown as "5 minutes ago". */
    time?: Date | number;
    /** Whether it's been read. Unread ones have a dot, bolder titles and a "Mark as read" button. */
    read?: boolean;
}
interface NotificationCenterProps extends DrawerProps {
    /** The drawer's title. Default: "Notifications" (labels.notificationCenter). */
    title?: React.ReactNode;
    /** Not taken: the list is the drawer's content. */
    description?: never;
    /** Not taken: the footer holds "Mark all as read" and "Clear all". */
    footer?: never;
    /** Not taken: the list is the drawer's content. */
    children?: never;
    /** Not taken: there's nothing to edit, so nothing to lose. */
    unsaved?: never;
    /** The notifications, newest first: useToastHistory().items, or your own. */
    items: NotificationItem[];
    /** Called with an unread one's id when its "Mark as read" is chosen. Without it, there's no button. */
    onMarkRead?: (id: string) => void;
    /** Called when "Mark all as read" in the footer is chosen. Without it, there's no button. */
    onMarkAllRead?: () => void;
    /** Called when "Clear all" in the footer is chosen. Without it, there's no button. */
    onClear?: () => void;
    /** What shows with no notifications. Default: "No notifications yet" (labels.noNotifications). */
    empty?: React.ReactNode;
}
interface ToastHistoryOptions {
    /** The most kept; older ones drop off the end. Default: 50. */
    limit?: number;
}
/** What useToastHistory returns. */
interface ToastHistory {
    /** The toasts shown since it mounted, newest first, unread until marked read. */
    items: NotificationItem[];
    /** How many are unread, for a badge on the button that opens the NotificationCenter. */
    unread: number;
    /** Marks one read, or every one with no id. */
    markRead: (id?: string) => void;
    /** Empties the list. */
    clear: () => void;
}
/** Records the toasts shown while it's mounted, for a NotificationCenter: { items, unread, markRead, clear }. */
declare function useToastHistory(options?: ToastHistoryOptions): ToastHistory;
/** A drawer of past notifications with read states: feed it useToastHistory() or your own list. */
declare const NotificationCenter: React.ForwardRefExoticComponent<NotificationCenterProps & React.RefAttributes<HTMLDialogElement>>;

interface NumberInputProps extends Omit<InputProps, "type" | "showCount" | "value" | "defaultValue" | "rightIcon" | "min" | "max" | "step"> {
    /** The number (controlled), or null when the field is empty. Use with onValueChange. */
    value?: number | null;
    /** The number at first (uncontrolled). */
    defaultValue?: number | null;
    /** Called with the new number, or null when emptied: as people type (numbers within min..max), on blur (clamped), and from the arrow keys and buttons. */
    onValueChange?: (value: number | null) => void;
    /** Called when typed text isn't kept as it is, with the text and why: "range" when a number outside min..max is
        brought back within them (on blur or Enter), so a form can say "Quantity was reduced to 100"; "unreadable" when
        the text isn't a number and the previous one comes back, which is also said to screen readers. */
    onInvalidInput?: (text: string, reason: "range" | "unreadable") => void;
    /** The smallest allowed number. The field snaps to it when it loses focus. */
    min?: number;
    /** The largest allowed number. */
    max?: number;
    /** How much the arrow keys and buttons change it. Default: 1. Its decimals set how many the value keeps (step 0.25: two). */
    step?: number;
    /** How many steps PageUp, PageDown and Shift with an arrow move. Default: 10. */
    largeStep?: number;
    /** Shows the − and + buttons at the end. Default: true. */
    steppers?: boolean;
    /** The buttons' names. Default: "Decrease" and "Increase". */
    decrementLabel?: string;
    /** The increase button's name. Default: "Increase". */
    incrementLabel?: string;
    /** The locale whose decimal and group marks are read and written ("1.500,25" in id-ID). Default: the nearest SerupaProvider's locale, else the browser's. */
    locale?: string;
    /** How the number is shown, as Intl.NumberFormat options: `{ style: "currency", currency: "IDR" }`, `{ useGrouping: true }`,
        or the percent style (the value is the fraction: 0.15 shows 15%). Default: no grouping and every decimal the value has. */
    formatOptions?: Intl.NumberFormatOptions;
    /** The digits the value is written in. Default: the locale's own, as other components write numbers (١٬٢٥٠ in ar-EG,
        ۱۲۵۰ in fa-IR); "latn" for Latin digits. Typed digits are read in any script either way. */
    numberingSystem?: string;
    /** An ISO 4217 code ("IDR", "USD", "JPY"): shows the amount as money, with the symbol where the locale puts it, and keeps
        the currency's decimals (19.99, not 20). Short for formatOptions { style: "currency", currency }; formatOptions still wins. */
    currency?: string;
    /** With currency: value, defaultValue, onValueChange, min, max and step are whole minor units (cents), so 1999 is
        $19.99 and ¥1999 is ¥1,999. Store money this way to avoid floating-point sums. */
    minorUnits?: boolean;
}
/** A number field with − and + buttons, arrow keys, min, max and step. */
declare const NumberInput: React.ForwardRefExoticComponent<NumberInputProps & React.RefAttributes<HTMLInputElement>>;

type Entry = number | "start-ellipsis" | "end-ellipsis";
/** The pages to show: the boundaries at each end, siblings around the current one, and … where pages are skipped. Always the same length, so the arrows don't move. */
declare function paginationRange(page: number, count: number, siblings?: number, boundaries?: number): Entry[];

interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    /** How many pages there are. */
    count: number;
    /** The current page, from 1 (controlled). Use with onPageChange. */
    page?: number;
    /** The page it starts on when uncontrolled. Default: 1. */
    defaultPage?: number;
    /** Called with the new page when someone picks one. */
    onPageChange?: (page: number) => void;
    /** Makes every page a link to this URL instead of a button (it still calls onPageChange on click). */
    getHref?: (page: number) => string;
    /** With getHref, what renders each page link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
    linkAs?: React.ElementType;
    /** Pages shown on each side of the current one. Default: 1. Fewer show when the row wouldn't fit on one line. */
    siblings?: number;
    /** Pages always shown at the start and the end. Default: 1. Fewer show, after the siblings, when the row wouldn't fit. */
    boundaries?: number;
    /** 'md' (default, 32px) or 'sm' (24px). */
    size?: 'sm' | 'md';
    /** The nav's accessible name. Default: "Pagination". */
    "aria-label"?: string;
    /** Default: "Previous page". */
    previousLabel?: string;
    /** Default: "Next page". */
    nextLabel?: string;
    /** A page's accessible name. Default: (n) => "Page " + n. */
    pageLabel?: (page: number) => string;
    /** How many items there are in all. With pageSize, a summary before the pages says which ones show: "21–30 of 245". */
    total?: number;
    /** How many items a page holds. With total, shows the summary. */
    pageSize?: number;
    /** The page sizes to offer, as a select labelled "Items per page" after the summary: [10, 25, 50]. Needs pageSize (the one picked). */
    pageSizeOptions?: number[];
    /** Called with the size picked in the select, and the page that keeps the first item shown in view (page 5 at 10 a page starts with item 41, which is on page 2 at 25 a page). Set pageSize, and page when controlled; uncontrolled, the page moves by itself. */
    onPageSizeChange?: (pageSize: number, page: number) => void;
}
/** Moves through pages of results: previous, next, and page numbers with … where pages are skipped. */
declare const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<HTMLElement>>;

interface PasswordInputProps extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "rightIcon"> {
    /** Shows the password as text (controlled). Use with onVisibleChange. */
    visible?: boolean;
    /** Shows it as text at first (uncontrolled). Default: false. */
    defaultVisible?: boolean;
    /** Called with the new state when the show/hide button is pressed. */
    onVisibleChange?: (visible: boolean) => void;
    /** The show/hide button's name. Default: "Show password" (its aria-pressed says whether it's shown). */
    toggleLabel?: string;
    /** While Caps Lock is on and the field has focus, "Caps Lock is on" shows at the end of the field and is read out once. Default: true. */
    capsLockHint?: boolean;
}
/** A password field with a button that shows and hides what was typed. */
declare const PasswordInput: React.ForwardRefExoticComponent<PasswordInputProps & React.RefAttributes<HTMLInputElement>>;

/** One country PhoneInput knows: its ISO 3166 code, calling code, trunk prefix, grouping and national lengths. */
interface PhoneCountry {
    /** ISO 3166-1 alpha-2, such as "ID". */
    code: string;
    /** The calling code without "+", such as "62". */
    dial: string;
    /** The prefix dialled at home and dropped after the calling code ("0" in most places, "8" in Russia, "" where there is none). */
    trunk: string;
    /** The grouping, with # for a digit, such as "###-####-####". Digits past the last # follow it without a space. "#" leaves the digits ungrouped. */
    pattern: string;
    /** Groupings for national numbers that start with these digits, such as { "30": "## ########" } for Berlin; the longest match wins over pattern. */
    patterns?: Record<string, string>;
    /** For a calling code shared with another country: the starts of the national numbers that are this country's, such as ["416", "604"] for Canada in +1. */
    areas?: string[];
    /** The shortest and longest national number, without the trunk prefix. */
    min: number;
    max: number;
}
/** The result of reading an international number. */
interface ParsedPhone {
    country: PhoneCountry;
    /** The national number, digits only, without the trunk prefix. */
    national: string;
}
/** Reads "+62 812-3456-7890" (or "0062…"): the country from its calling code and the national digits. Where countries share
   a calling code, the number's area picks one (+1 416 is Canada, +1 684 American Samoa), else `prefer`, else the main one.
   `countries` replaces the built-in list (PhoneInput passes its own). Undefined when no calling code matches. */
declare function parsePhone(value: string, prefer?: string, countries?: readonly PhoneCountry[]): ParsedPhone | undefined;
/** Formats an E.164 number for reading: "+6281234567890" is "+62 812-3456-7890". A number with no known calling code comes back as it was. */
declare function formatPhone(e164: string, prefer?: string): string;

/** What onValueChange reports with the E.164 number. */
interface PhoneValueDetails {
    /** The picked country's ISO code, such as "ID". */
    country: string;
    /** The national number, digits only, without the trunk prefix. */
    national: string;
    /** Whether the number has a length the country uses. */
    complete: boolean;
}
interface PhoneInputProps extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "value" | "defaultValue" | "onChange" | "leftIcon" | "rightIcon"> {
    /** The number in E.164, such as "+6281234567890", or "" (controlled). Use with onValueChange. */
    value?: string;
    /** The number at first (uncontrolled), in E.164. */
    defaultValue?: string;
    /** Called with the E.164 number ("" when empty) as people type, paste or change the country. */
    onValueChange?: (value: string, details: PhoneValueDetails) => void;
    /** The picked country, an ISO code such as "ID" (controlled). Use with onCountryChange. */
    country?: string;
    /** The country at first (uncontrolled). Default: the locale's region when it's known, else "US". */
    defaultCountry?: string;
    /** Called with the ISO code when the country changes, from the menu or a pasted "+…" number. */
    onCountryChange?: (country: string) => void;
    /** The countries in the menu, as ISO codes or your own PhoneCountry rows (which replace the built-in row with the same code); the menu sorts them by name. Default: every country PhoneInput knows. */
    countries?: Array<string | PhoneCountry>;
    /** The country menu's name. Default: "Country". */
    countryLabel?: string;
    /** Submits the E.164 number under this name in a hidden input. */
    name?: string;
}
/** A phone number field: a country menu and a tel field that groups the number as people type, reporting E.164 ("+6281234567890"). */
declare const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps & React.RefAttributes<HTMLInputElement>>;

interface PinInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'maxLength' | 'children'> {
    /** How many characters the code has, one box each. Default: 6. */
    length?: number;
    /** The code typed so far (controlled). */
    value?: string;
    /** The code at first (uncontrolled). */
    defaultValue?: string;
    /** Called with the code as it changes, after characters that don't fit `type` are dropped. */
    onValueChange?: (value: string) => void;
    /** Called with the code once every box is filled, by typing, pasting or a one-time code the phone offers. */
    onComplete?: (value: string) => void;
    /** 'numeric' (digits only and a number keypad, default) or 'alphanumeric' (letters and digits). */
    type?: 'numeric' | 'alphanumeric';
    /** Shows a dot in each filled box instead of the character, and makes the field a password field. Default: false. */
    mask?: boolean;
    /** 'sm', 'md' (default) or 'lg': square boxes at the control heights, 24, 32 and 44px. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border on every box, and aria-invalid. Say what's wrong in text next to it; Field's error does both. */
    invalid?: boolean;
}
/** A one-time code or PIN in one box per character, typed into one native field: paste, autofill and forms work as with an Input. */
declare const PinInput: React.ForwardRefExoticComponent<PinInputProps & React.RefAttributes<HTMLInputElement>>;

interface PopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'role'> {
    /** The element that opens it: one element that can take focus, such as a Button. It gets aria-expanded and aria-controls. */
    trigger: React.ReactElement;
    /** What's inside: text, a form, links, buttons. A function gets close(), for a Cancel or Done button. */
    children: React.ReactNode | ((close: () => void) => React.ReactNode);
    /** A heading at the top that names the popover. */
    title?: React.ReactNode;
    /** The title's heading level, to fit the page's outline. Default: 2, as in Dialog. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Where it goes: 'bottom' (default), 'top', 'left', 'right', with '-start' or '-end'. It flips when there's no room. */
    placement?: Placement;
    /** Open it yourself (controlled), with onOpenChange. */
    open?: boolean;
    /** Open at first (uncontrolled). Default: false. */
    defaultOpen?: boolean;
    /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' | 'close' }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** Its name for screen readers when it has no title. */
    "aria-label"?: string;
    /** Where focus goes when it opens: 'first' (default: the first control inside, or the panel) or 'panel'. */
    initialFocus?: 'first' | 'panel';
    /** Classes on the panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
    className?: string;
    /** Styles on the panel. */
    style?: React.CSSProperties;
}
/** A small non-modal dialog next to its trigger, for interactive content: a form, filters, details. */
declare const Popover: React.ForwardRefExoticComponent<PopoverProps & React.RefAttributes<HTMLDivElement>>;

type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';
interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    /** How far along, from 0 to max. Leave it out (or null) when you can't tell: the bar then shows an animated segment. */
    value?: number | null;
    /** The value that means done. Default: 100. */
    max?: number;
    /** 'bar' (default): a horizontal bar, full width. 'circle': a ring. */
    variant?: 'bar' | 'circle';
    /** The bar's thickness: 'sm' 4px, 'md' 8px (default), 'lg' 12px. The ring: 24, 40 or 64px. */
    size?: 'sm' | 'md' | 'lg';
    /** The fill color: 'primary' (default), 'success', 'warning' or 'danger'. */
    tone?: ProgressTone;
    /** A visible name above the bar, which also names it; a ring has no room to show it, so there it only names it.
        Without one, give it an aria-label. */
    label?: React.ReactNode;
    /** Shows the value: at the end of the label row, or inside the ring (md and lg). Default: false. */
    showValue?: boolean;
    /** Turns the value into words, shown and read out. Default: the percentage as the locale writes it: "45%", "%45" in
        Turkish, "45 %" in French, "٤٥٪" in Egyptian Arabic. */
    formatValue?: (value: number, max: number) => string;
    /** Says politely that it's done when the value reaches max: true says "Upload: complete" (the label or aria-label,
        then labels.progressComplete), or pass your own words. The bar's value changes aren't read out on their own. */
    announceComplete?: boolean | string;
    /** Called once each time the value reaches max (not when it starts there). */
    onComplete?: () => void;
}
/** How far along a task is: a bar or a ring with role="progressbar"; leave value out when you can't tell. */
declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;

interface ProseProps extends React.HTMLAttributes<HTMLElement> {
    /** The element. Default: 'div'. 'article' for a post or a help page that stands on its own. */
    as?: 'div' | 'article' | 'section';
    /** The content: HTML from Markdown or a CMS (with dangerouslySetInnerHTML), or plain elements. */
    children?: React.ReactNode;
}
/** Styles for Markdown and CMS content: spacing between blocks, headings, lists, quotes, code, tables and images. */
declare const Prose: React.ForwardRefExoticComponent<ProseProps & React.RefAttributes<HTMLElement>>;

/** V is the radios' value type: string (or number) as you use them, inferred from value or onValueChange. */
interface RadioGroupProps<V extends string | number = string | number> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** The radios' name; a generated one by default. */
    name?: string;
    /** The picked value (controlled); null or undefined for none. Use with onValueChange. */
    value?: V | null;
    /** The value picked at first (uncontrolled). */
    defaultValue?: V;
    /** Called with the picked radio's value (and the change event), like SegmentedControl, Tabs and Slider. */
    onValueChange?: (value: V, event: React.ChangeEvent<HTMLInputElement>) => void;
    /** 'vertical' (stacked, default) or 'horizontal' (a wrapping row). */
    orientation?: 'vertical' | 'horizontal';
    /** The radios' size, unless a Radio sets its own. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border on every unchecked radio, and aria-invalid on the group. Field sets it from its error. */
    invalid?: boolean;
    /** Disables every radio. */
    disabled?: boolean;
    /** Marks the choice required (aria-required, and required on the radios). */
    required?: boolean;
    /** The Radio elements, at any depth. */
    children?: React.ReactNode;
}
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
    /** 'sm' (14px circle, text-xs), 'md' (16px, text-sm, default) or 'lg' (20px, text-base). In a RadioGroup, the group's size by default. */
    size?: 'sm' | 'md' | 'lg';
    /** The label, next to the circle; a click on it picks the radio. Without one, give the radio an aria-label. */
    children?: React.ReactNode;
    /** A second, muted line under the label, linked to the radio with aria-describedby. */
    description?: React.ReactNode;
    /** A danger border (while unchecked) and focus ring, and aria-invalid. In a group, set invalid on the RadioGroup. */
    invalid?: boolean;
}
/** One choice from a set of Radios: a <div role="radiogroup"> that names them, holds the value and passes size, invalid, disabled and required down. Label it with Field group, aria-label or aria-labelledby. */
declare const RadioGroup: (<V extends string | number = string | number>(props: RadioGroupProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & {
    displayName?: string;
};
/** A native radio with its label (ref, value and every input attribute go to the <input>); className and style go to the <label> around it. In a RadioGroup, the group sets name and checked. */
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;

interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    /** The rating (controlled), or null for none. Use with onValueChange. */
    value?: number | null;
    /** The rating at first (uncontrolled). */
    defaultValue?: number | null;
    /** Called with the picked rating, or null when it's cleared. */
    onValueChange?: (value: number | null) => void;
    /** How many stars. Default: 5. */
    max?: number;
    /** Half stars can be picked too (each star is two choices). Default: false. */
    allowHalf?: boolean;
    /** Picking the current rating again (a click, Space), Backspace or Delete clears it. Default: false. */
    clearable?: boolean;
    /** Shows the rating without choices: a role="img" named "4.5 out of 5", for reviews and averages. Any fraction is drawn. */
    readOnly?: boolean;
    /** Disables every choice. */
    disabled?: boolean;
    /** Sends the rating with a form (a native radio per choice). */
    name?: string;
    /** The id of a form elsewhere on the page that the radios belong to. */
    form?: string;
    /** Marks a rating required (on the radios). */
    required?: boolean;
    /** Marks the rating invalid (aria-invalid on the group). Field sets it from its error. */
    invalid?: boolean;
    /** 'sm' (20px stars), 'md' (24px, default) or 'lg' (32px). */
    size?: "sm" | "md" | "lg";
}
/** Stars to pick a rating (a radio group) or to show one (readOnly: an image named "4.5 out of 5"). */
declare const Rating: React.ForwardRefExoticComponent<RatingProps & React.RefAttributes<HTMLDivElement>>;

interface RelativeTimeProps extends Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'children' | 'dateTime'> {
    /** The moment: a Date, a timestamp in ms, or a string Date can read ("2026-10-24T09:30:00Z"). A day on its own,
        "2026-10-24", is that day on the viewer's calendar, in days: "today", "yesterday", "in 3 days". */
    date: Date | number | string;
    /** 'long' ("3 minutes ago", default), 'short' ("3 min. ago") or 'narrow' ("3m ago"), as Intl.RelativeTimeFormat writes them. */
    format?: 'long' | 'short' | 'narrow';
    /** 'auto' (default): "yesterday", "now", "next week" where the language has a word. 'always': "1 day ago". */
    numeric?: 'auto' | 'always';
    /** How the exact date in the tooltip (title) is written. Default: { dateStyle: "long", timeStyle: "short" }. false: no tooltip. */
    titleFormat?: Intl.DateTimeFormatOptions | false;
    /** After how many days, ago or ahead, it shows the date instead of words ("Oct 24, 2026" rather than "340 days
        ago"), as absoluteFormat writes it. Default 7. false: words however far. */
    absoluteAfter?: number | false;
    /** How that date is written. Default: { dateStyle: "medium" }. */
    absoluteFormat?: Intl.DateTimeFormatOptions;
    /** A locale for this one; otherwise the SerupaProvider's, else the browser's. */
    locale?: string;
}
/** The words for a moment relative to now, as RelativeTime writes them: "3 minutes ago", "in 2 days", "now". A day
    on its own ("2026-10-24") is counted in calendar days or more: "today", "yesterday", "in 3 days". */
declare function relativeTime(date: Date | number | string, now: number, locale?: string, options?: {
    format?: 'long' | 'short' | 'narrow';
    numeric?: 'auto' | 'always';
}): string;
/** How long ago a moment was, in words ("3 minutes ago"), kept up to date; the exact date in its tooltip. */
declare const RelativeTime: React.ForwardRefExoticComponent<RelativeTimeProps & React.RefAttributes<HTMLTimeElement>>;

type SaveState = "idle" | "saving" | "saved" | "error";
interface SaveStatusProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Where saving is: 'idle' (nothing to say, renders empty), 'saving', 'saved' or 'error'. */
    status: SaveState;
    /** When the last save finished, for "Saved 2 minutes ago" (kept up to date). Without it, just "Saved". */
    savedAt?: Date | number;
    /** Shows a Try again button after an error; called when it's pressed. */
    onRetry?: () => void;
    /** What went wrong, in place of "Couldn't save" ("Couldn't save: you're offline"). */
    errorText?: React.ReactNode;
}
/** Whether autosaved changes are saved: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with Try again; announced politely. */
declare const SaveStatus: React.ForwardRefExoticComponent<SaveStatusProps & React.RefAttributes<HTMLDivElement>>;

interface SearchInputProps extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "leftIcon" | "rightIcon"> {
    /** Called with the text when Enter is pressed. */
    onSearch?: (value: string) => void;
    /** Called after the field is cleared, by the × or Escape. The field's onChange also gets an empty value. */
    onClear?: () => void;
    /** The clear button's name. Default: "Clear search". */
    clearLabel?: string;
    /** Shows a small loader in place of the search icon while results load. Default: false. */
    loading?: boolean;
    /** The loader's name, announced when it appears. Default: "Searching". */
    loadingLabel?: string;
}
/** A search field: a search icon, a clear button once something is typed, Escape to clear and Enter to search. */
declare const SearchInput: React.ForwardRefExoticComponent<SearchInputProps & React.RefAttributes<HTMLInputElement>>;

interface SegmentedControlOption<V extends string = string> {
    value: V;
    /** The segment's text. With only an icon, pass aria-label instead. */
    label?: React.ReactNode;
    /** An icon name or element before the label. */
    icon?: IconSource;
    /** The segment's name when it shows only an icon. */
    "aria-label"?: string;
    /** Turns this segment off. */
    disabled?: boolean;
}
/** V is the segments' values, inferred from options or given, such as SegmentedControl<'list' | 'board'>. */
interface SegmentedControlProps<V extends string = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** The segments, in order: 2 to about 5. */
    options: readonly SegmentedControlOption<V>[];
    /** The selected value (controlled). Use with onValueChange. */
    value?: V;
    /** The value selected at first (uncontrolled). Default: the first segment that isn't disabled. */
    defaultValue?: V;
    /** Called with the new value when a segment is chosen. */
    onValueChange?: (value: V) => void;
    /** 'sm' (24px), 'md' (32px, default) or 'lg' (44px): the control heights. */
    size?: 'sm' | 'md' | 'lg';
    /** Stretches to its container, with equal segments. Default: false. */
    fullWidth?: boolean;
    /** Turns every segment off, as a disabled native control. */
    disabled?: boolean;
    /** Submits the value with a form, in a hidden input. */
    name?: string;
    /** The id of a form to submit and reset with, when it isn't inside one, as the form attribute of an input. */
    form?: string;
    /** A danger outline, and aria-invalid on the group. Say what's wrong in text next to it (Field's error does). */
    invalid?: boolean;
    /** Sets aria-required on the group. */
    required?: boolean;
    /** Focusable and read out, and arrows move focus, but nothing changes the selection; the value is still submitted. */
    readOnly?: boolean;
}
/** Picks one of a few options shown side by side: a radio group drawn as segments. */
declare const SegmentedControl: (<V extends string = string>(props: SegmentedControlProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & {
    displayName?: string;
};

type SelectOption = string | number | {
    value: string | number;
    label?: React.ReactNode;
    disabled?: boolean;
};
interface SelectOptionGroup {
    label: string;
    options: SelectOption[];
    disabled?: boolean;
}
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'multiple'> {
    /** 'sm' (24px, text-xs), 'md' (32px, text-sm, default) or 'lg' (44px, text-base): the control heights, like Input. */
    size?: 'sm' | 'md' | 'lg';
    /** A danger border and focus ring, and aria-invalid. */
    invalid?: boolean;
    /** A decorative icon before the text: an icon name or an element. */
    leftIcon?: IconSource;
    /** A first, empty option shown in the placeholder color until something is picked (it can't be picked back). An uncontrolled Select starts on it. */
    placeholder?: string;
    /** The options: strings, { value, label, disabled }, or groups { label, options }. Or pass <option> and <optgroup> children (after these). */
    options?: Array<SelectOption | SelectOptionGroup>;
}
/** A native <select> styled like Input (ref, value, onChange and every select attribute go to it), with a chevron; className and style go to the box. Label it with <label htmlFor>, aria-label or Field. multiple isn't supported. */
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    /** SidebarSections, or SidebarItems directly. */
    children?: React.ReactNode;
    /** Above the items: a logo, a workspace switcher. */
    header?: React.ReactNode;
    /** Pinned to the bottom: settings, the signed-in user. */
    footer?: React.ReactNode;
    /** Narrows it to icons only (64px). Labels show as tooltips, and groups open their items in a menu. Default: false. */
    collapsed?: boolean;
    /** The nav's accessible name. Default: "Main". */
    "aria-label"?: string;
}
interface SidebarSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** A small heading over the section's items. Hidden when the sidebar is collapsed. */
    title?: React.ReactNode;
    /** SidebarItems. */
    children?: React.ReactNode;
}
/** SidebarItem's own props, beside those of the element it renders. */
interface SidebarItemOwnProps {
    /** The item's text. */
    label: React.ReactNode;
    /** An icon before the label: a Material Symbols or custom name, or an element. Top-level items need one to show when collapsed. */
    icon?: IconSource;
    /** The current page: shaded, with aria-current="page". Default: false. */
    active?: boolean;
    /** Something at the end, such as a count Badge. Collapsed, a dot on the icon shows there is one, and screen readers still read it. */
    badge?: React.ReactNode;
    /** Nested SidebarItems: the item becomes a button that shows and hides them. */
    children?: React.ReactNode;
    /** With children: open at first. Default: open when one of them is active. */
    defaultOpen?: boolean;
    /** With children: whether the group is open, controlled. Pair it with onOpenChange. */
    open?: boolean;
    /** With children: called when the group's button asks to open or close it, with why: { reason: 'trigger' }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
}
/** SidebarItem's props: its own, `as`, and the props of the element `as` names (an <a>'s by default), so
 *  <SidebarItem as={RouterLink} to="/inbox"> takes RouterLink's `to`. With children it renders a button, which
 *  gets those attributes and handlers too. */
type SidebarItemProps<C extends React.ElementType = 'a'> = SidebarItemOwnProps & {
    /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof SidebarItemOwnProps | 'as'>;
/** A vertical nav for an app's pages: sections of items with icons, badges and nested groups; collapses to an icon rail. */
declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
/** A group of items in a Sidebar, with an optional small heading. */
declare const SidebarSection: React.ForwardRefExoticComponent<SidebarSectionProps & React.RefAttributes<HTMLDivElement>>;
/** An item in a Sidebar: a link, or a group of nested items. `as` renders your router's link, typed with its props. */
declare const SidebarItem: {
    <C extends React.ElementType = "a">(props: SidebarItemProps<C> & {
        ref?: React.Ref<HTMLElement>;
    }): React.ReactElement | null;
    displayName?: string;
};

interface SkipLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    /** The id of the element it skips to: the page's main content. Default: "main". */
    target?: string;
    /** The link's text. Default: "Skip to content" (labels.skipToContent). */
    children?: React.ReactNode;
}
/** A "Skip to content" link, shown on keyboard focus, that moves focus to the page's main content. */
declare const SkipLink: React.ForwardRefExoticComponent<SkipLinkProps & React.RefAttributes<HTMLAnchorElement>>;

type SliderValue = number | [number, number];
/** A mark on a Slider's track: a value, and optional text shown under it. */
interface SliderMark {
    value: number;
    label?: React.ReactNode;
}
/** V is a number for one thumb or [low, high] for a range, inferred from value, defaultValue or the callbacks. */
interface SliderProps<V extends SliderValue = SliderValue> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
    /** The value (controlled): a number, or [low, high] for a range with two thumbs. Use with onValueChange. */
    value?: V;
    /** The value at first (uncontrolled). Default: min. */
    defaultValue?: V;
    /** Called with the new value as it moves (dragging, keys). */
    onValueChange?: (value: V) => void;
    /** Called once when a drag or key press that changed the value ends: for saving or fetching. */
    onValueCommit?: (value: V) => void;
    /** Default: 0. */
    min?: number;
    /** Default: 100. */
    max?: number;
    /** The smallest change. Default: 1. */
    step?: number;
    /** How many steps PageUp, PageDown and Shift with an arrow move. Default: 10. */
    largeStep?: number;
    /** 'sm' (4px track, 16px thumb) or 'md' (6px, 20px, default). */
    size?: 'sm' | 'md';
    /** Turns the thumbs off, as a disabled native control. */
    disabled?: boolean;
    /** Turns a value into the words read out (aria-valuetext), such as "$40". Default: the number (shown by showValue in the locale's digits). */
    formatValue?: (value: number) => string;
    /** A range's thumb names. Default: the sliderMinimum and sliderMaximum labels ("Minimum", "Maximum"). A single thumb is named by aria-label or aria-labelledby. */
    thumbLabels?: [string, string];
    /** Submits the value with a form: one hidden input, or two with the same name for a range. */
    name?: string;
    /** The id of a form to submit and reset with, when it isn't inside one, as the form attribute of an input. */
    form?: string;
    /** A danger fill and thumb ring, and aria-invalid on the thumbs. Say what's wrong in text next to it (Field's error does). */
    invalid?: boolean;
    /** Focusable and read out, but keys and presses don't change it; the value is still submitted. */
    readOnly?: boolean;
    /** Accepted so Field's required doesn't reach the DOM. A slider always has a value, so it has no effect. */
    required?: boolean;
    /** Ticks on the track: true for every step (every largeStep steps past 100 ticks), or a list of values with optional text under each. Visual only; the thumb's value is what's read out. */
    marks?: boolean | SliderMark[];
    /** Shows the value (formatValue's text) over a thumb while it's focused, dragged or hovered. Visual only, as aria-valuetext already says it. */
    showValue?: boolean;
}
declare const Slider: (<V extends SliderValue = SliderValue>(props: SliderProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & {
    displayName?: string;
};

interface SortableListProps<T> extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children' | 'onChange'> {
    /** The items, in order. Controlled: pass the new order back from onReorder. */
    items: readonly T[];
    /** A stable key for each item (its id), so focus and React state follow it as it moves. */
    getKey: (item: T) => string | number;
    /** The item's name in words ("Apollo"): on its handle ("Reorder Apollo") and in what's announced as it moves. */
    getLabel: (item: T) => string;
    /** What each row shows, after its handle. dragging is true for the item being moved. */
    renderItem: (item: T, state: {
        index: number;
        dragging: boolean;
    }) => React.ReactNode;
    /** Called with the new order when an item is dropped somewhere new, and which positions it moved between (from 0). */
    onReorder: (items: T[], move: {
        from: number;
        to: number;
    }) => void;
    /** Shows the items without handles. */
    disabled?: boolean;
    /** The word before an item's name on its handle. Default: "Reorder" (from SerupaProvider labels). */
    reorderLabel?: string;
    /** Which way the items run: "vertical" (default), a column, or "horizontal", a row (tabs, chips, a board's columns)
     *  that drags and auto-scrolls sideways. In a row, Left and Right follow the reading direction, so in right-to-left
     *  ArrowLeft moves an item later. */
    orientation?: "vertical" | "horizontal";
}
/** A list people reorder by dragging a handle or with the keyboard, with every move announced. */
declare const SortableList: <T>(props: SortableListProps<T> & {
    ref?: React.Ref<HTMLUListElement>;
}) => React.ReactElement;

interface SplitterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
    /** The two panes, first and second. The handle between them resizes the first; the second takes the rest. */
    children: [React.ReactNode, React.ReactNode];
    /** "horizontal" (default): the panes side by side, the first at the start (left, or right in rtl). "vertical": stacked, the first on top. */
    direction?: "horizontal" | "vertical";
    /** The first pane's size in percent of the Splitter (controlled). Use with onSizeChange. */
    size?: number;
    /** The first pane's size at first, in percent (uncontrolled); 0 starts it collapsed when collapsible. Default: 50. */
    defaultSize?: number;
    /** Called with the first pane's new size in percent while it's dragged or moved with the keys. */
    onSizeChange?: (size: number) => void;
    /** The first pane's least and largest size, in percent. Default: 10 and 90. */
    min?: number;
    /** The first pane's largest size, in percent. Default: 90. */
    max?: number;
    /** How far an arrow key moves the handle, in percent. Default: 5. */
    step?: number;
    /** Enter on the handle (or a double-click) collapses the first pane to 0, and again brings it back. Default: false. */
    collapsible?: boolean;
    /** Keeps an uncontrolled size in localStorage under this key, so the layout comes back on the next visit. */
    storageKey?: string;
    /** The handle's accessible name: say what it resizes ("Sidebar"). Default: the resizePanes label, "Resize panes". */
    separatorLabel?: string;
}
/** Two panes with a draggable, keyboard-operable handle between them: list and detail, sidebar and editor. */
declare const Splitter: React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>>;

interface StackProps extends React.HTMLAttributes<HTMLElement> {
    /** 'column' (default): items one under another. 'row': side by side. */
    direction?: 'column' | 'row';
    /** The space between items, a step of the spacing scale (4 → 16px). Default: 4. */
    gap?: Space;
    /** Cross-axis alignment: 'stretch' (default for columns), 'start', 'center' (default for rows), 'end' or 'baseline'. */
    align?: 'stretch' | 'start' | 'center' | 'end' | 'baseline';
    /** Main-axis distribution: 'start' (default), 'center', 'end' or 'between'. */
    justify?: 'start' | 'center' | 'end' | 'between';
    /** Lets a row wrap onto more lines. Default: false. */
    wrap?: boolean;
    /** The element. Default: 'div'. */
    as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer' | 'form' | 'fieldset' | 'span';
}
/** Lays children out in a column or a row, with even space from the spacing scale between them. */
declare const Stack: React.ForwardRefExoticComponent<StackProps & React.RefAttributes<HTMLElement>>;

interface StepperStep {
    title: React.ReactNode;
    /** A muted line under the title. */
    description?: React.ReactNode;
    /** Shows "Optional" under the title. */
    optional?: boolean;
    /** 'error': marks the step in danger, such as a step with a problem to fix. 'warning': amber, for a softer
        problem that doesn't block going on, such as a field left for later. */
    status?: 'error' | 'warning';
}
interface StepperProps extends React.HTMLAttributes<HTMLElement> {
    /** The steps, in order. */
    steps: StepperStep[];
    /** The current step's index, from 0. Steps before it are complete; steps.length marks them all complete. */
    current: number;
    /** 'horizontal' (default): side by side, joined by lines. 'vertical': stacked, for narrow spaces or long descriptions. */
    orientation?: 'horizontal' | 'vertical';
    /** 'sm' (24px circles, text-xs) or 'md' (32px, text-sm, default). */
    size?: 'sm' | 'md';
    /** Makes steps buttons that go to them: the completed ones, or every one but the current with clickable="all". */
    onStepClick?: (index: number) => void;
    /** Which steps onStepClick makes buttons. 'completed' (default): the ones before the current step. 'all': every
        step but the current one, for a form people can fill in any order. */
    clickable?: 'completed' | 'all';
    /** Words read out or shown: { completed: 'completed', error: 'has an error', warning: 'needs attention', optional: 'Optional', stepOf: (step, total) => `Step ${step} of ${total}` }. */
    labels?: {
        completed?: string;
        error?: string;
        warning?: string;
        optional?: string;
        stepOf?: (step: number, total: number) => string;
    };
}
/** Where people are in a task split into steps: numbered circles joined by lines. */
declare const Stepper: React.ForwardRefExoticComponent<StepperProps & React.RefAttributes<HTMLElement>>;

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'role'> {
    /** 'sm' (28 by 16px track, text-xs), 'md' (36 by 20px, text-sm, default) or 'lg' (44 by 24px, text-base). */
    size?: 'sm' | 'md' | 'lg';
    /** The label; a click on it flips the switch. Without one, give the switch an aria-label. */
    children?: React.ReactNode;
    /** A second, muted line under the label, linked to the switch with aria-describedby. */
    description?: React.ReactNode;
    /** 'end' (the label after the track, default) or 'start' (the label first, as in a settings list). */
    labelPosition?: 'start' | 'end';
    /** A danger track (while off) and focus ring, and aria-invalid. */
    invalid?: boolean;
    /** Focusable and read out (aria-readonly), but a click or Space doesn't flip it; an on switch is still submitted. */
    readOnly?: boolean;
    /** While a change is being saved: a small Loader turns on the thumb, aria-busy is set, and clicks and Space don't flip it, so it can't be sent twice. It stays focusable. Set checked when the save succeeds. */
    pending?: boolean;
    /** Called with the new state and the change event, after onChange: the same shape as ToggleButton's onPressedChange. */
    onCheckedChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}
/** An on/off setting that applies at once: a native checkbox with role="switch" (ref, checked, onChange and every input attribute go to it), drawn as a track and thumb; className and style go to the <label> around it. */
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLInputElement>>;

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    /** 'md' (default): 12px cell padding. 'sm': 8px top and bottom, for dense data. */
    size?: 'sm' | 'md';
    /** Shades every other body row. Rows then don't change on hover. Default: false. */
    striped?: boolean;
    /** Keeps the header row in view while the table scrolls inside a container with a height. Default: false. */
    stickyHeader?: boolean;
    /** A title for the table, rendered as its <caption> (announced with it, and names the scroll area). */
    caption?: React.ReactNode;
    /** Hides the caption on screen; screen readers still announce it. Default: false. */
    hideCaption?: boolean;
    /** Props for the scrolling frame around the table (style with a maxHeight for stickyHeader). */
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    /** Marks a row as selected: a shaded background and a primary bar at its start. Screen readers can't tell from
        the shading (and ignore aria-selected in a table), so give the row a TableSelectCell, whose checkbox says it. */
    selected?: boolean;
    /** Makes the whole row a link to this URL: a real <a> in one cell (the first TableCell, or the one marked link)
        whose area is stretched over the row. Buttons, checkboxes and links in other cells sit above it and work on
        their own. Ctrl/Cmd-click and middle-click open it in a new tab, as any link does. */
    href?: string;
    /** The row link's target. "_blank" adds rel="noopener noreferrer". */
    target?: string;
    /** The row link's rel. */
    rel?: string;
}
interface TableSelectCellProps extends Omit<CheckboxProps, 'children' | 'description' | 'size'> {
    /** The checkbox's name for screen readers, such as "Select Alpha", or "Select all rows" in the header. */
    label: string;
    /** In the header row: renders a <th>, for a select-all checkbox (with indeterminate while some rows are). Default: false. */
    header?: boolean;
    /** Props for the cell around the checkbox. */
    cellProps?: React.TdHTMLAttributes<HTMLTableCellElement>;
}
type SortDirection = 'ascending' | 'descending' | 'none';
interface TableHeaderCellProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
    /** Lines the text up: 'start' (default), 'center' or 'end' (numbers). */
    align?: 'start' | 'center' | 'end';
    /** Makes the column sortable: the header becomes a button, and this is the current order. */
    sort?: SortDirection;
    /** Called when the sort button is pressed (decide the next order yourself). */
    onSort?: () => void;
}
interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
    /** Lines the text up: 'start' (default), 'center' or 'end' (numbers, which also get tabular digits). */
    align?: 'start' | 'center' | 'end';
    /** In a TableRow with href: this cell holds the row's link (its text is the link's name). Default: the row's
        first TableCell. Mark one when that cell isn't a direct child of the row, or isn't the one that names it. */
    link?: boolean;
}
interface TableActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** How many rows are selected. The bar shows while it's more than 0, with "3 selected" at its start. */
    count: number;
    /** Called by its "Clear selection" button: clear the selection. Without it, there's no button. */
    onClear?: () => void;
    /** The clear button's text. Default: "Clear selection" (labels.clearSelection). */
    clearLabel?: string;
    /** The actions for the selected rows: Buttons such as Delete or Export. */
    children?: React.ReactNode;
}
/** A data table: native table markup in a scrolling frame, with sizes, stripes, a sticky header and sortable columns. */
declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableFootProps = React.HTMLAttributes<HTMLTableSectionElement>;
/** The header rows (<thead>). */
declare const TableHead: React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableSectionElement>>;
/** The body rows (<tbody>). */
declare const TableBody: React.ForwardRefExoticComponent<TableBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
/** Footer rows such as totals (<tfoot>). */
declare const TableFoot: React.ForwardRefExoticComponent<TableFootProps & React.RefAttributes<HTMLTableSectionElement>>;
/** A row (<tr>). selected shades it, with a bar at its start; a TableSelectCell in it says so to screen readers. With href, the whole row is a link. */
declare const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
/** A cell with a checkbox for selecting its row (or, with header, every row); the checkbox carries the selected state for screen readers. */
declare const TableSelectCell: React.ForwardRefExoticComponent<TableSelectCellProps & React.RefAttributes<HTMLInputElement>>;
/** A header cell (<th>, scope="col" unless you say otherwise). With sort, its text is a button and aria-sort says the order. */
declare const TableHeaderCell: React.ForwardRefExoticComponent<TableHeaderCellProps & React.RefAttributes<HTMLTableCellElement>>;
/** A data cell (<td>). align="end" for numbers. A number as its child is written in the locale's digits (ungrouped,
 *  as given: 1204 stays 1204 in en-US and is ١٢٠٤ in ar-EG); for grouping, currency or units, pass FormattedNumber. */
declare const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
/** The bar of actions for a table's selected rows: "3 selected", your buttons, and "Clear selection". */
declare const TableActionBar: React.ForwardRefExoticComponent<TableActionBarProps & React.RefAttributes<HTMLDivElement>>;

type TabsVariant = 'line' | 'pill';
interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** The selected tab's value (controlled). Use with onValueChange. */
    value?: string;
    /** The tab selected at first (uncontrolled). Default: the first tab that isn't disabled. */
    defaultValue?: string;
    /** Called with the new value when a tab is chosen. */
    onValueChange?: (value: string) => void;
    /** 'line' (default): a line under the selected tab. 'pill': the selected tab filled in primary. */
    variant?: TabsVariant;
    /** 'sm' (32px tabs) or 'md' (36px, default). */
    size?: 'sm' | 'md';
    /** 'auto' (default): arrow keys move and select at once. 'manual': arrow keys move, Enter or Space selects (for panels that are slow to show). */
    activation?: 'auto' | 'manual';
    /** 'horizontal' (default): the tabs in a row over the panels. 'vertical': a column beside them, with ↑ ↓ between tabs. */
    orientation?: 'horizontal' | 'vertical';
}
/** Switches between panels in one place: Tabs > TabList > Tab, and a TabPanel for each tab. */
declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
type TabListProps = React.HTMLAttributes<HTMLDivElement>;
/** The row of tabs. Give it an aria-label when the page doesn't already say what the tabs are for. */
declare const TabList: React.ForwardRefExoticComponent<TabListProps & React.RefAttributes<HTMLDivElement>>;
interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
    /** Ties the tab to the TabPanel with the same value. */
    value: string;
    /** An icon before the label: an icon name or any element. */
    icon?: IconSource;
}
/** One tab: a button that selects its panel. */
declare const Tab: React.ForwardRefExoticComponent<TabProps & React.RefAttributes<HTMLButtonElement>>;
interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The value of the Tab that shows this panel. */
    value: string;
    /** Keeps the panel in the page while hidden (the default: hidden panels keep their state). false renders it only while selected. */
    keepMounted?: boolean;
}
/** The content for one tab, shown while its tab is selected. */
declare const TabPanel: React.ForwardRefExoticComponent<TabPanelProps & React.RefAttributes<HTMLDivElement>>;

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
type TextTone = 'default' | 'muted' | 'primary' | 'danger';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
interface TextProps extends React.HTMLAttributes<HTMLElement> {
    /** The element: 'p' (default), 'span', 'div', 'label', 'strong', 'em', 'small', 'li' or 'figcaption'. */
    as?: 'p' | 'span' | 'div' | 'label' | 'strong' | 'em' | 'small' | 'li' | 'figcaption';
    /** From the type scale, with its line height. Default: inherited from the parent. */
    size?: TextSize;
    /** 'default' (text), 'muted' (secondary), 'primary' or 'danger'. Each keeps 4.5:1 on surface. Default: inherited. */
    tone?: TextTone;
    /** Default: inherited. */
    weight?: TextWeight;
    /** Keeps it on one line, cut with an ellipsis. Give it a width (it's a block). */
    truncate?: boolean;
    /** Caps the line at about 65 characters (`container-prose`), the comfortable length for running text: an
     *  article's paragraphs, a long description, help text on a wide page. Default: false. */
    measure?: boolean;
    /** For a label: the id of the control it names. */
    htmlFor?: string;
}
/** Body text in the system's type: size, tone and weight, each inherited when unset. */
declare const Text: React.ForwardRefExoticComponent<TextProps & React.RefAttributes<HTMLElement>>;

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'children'> {
    /** 'sm' (text-xs), 'md' (text-sm, default) or 'lg' (text-base): Input's text sizes and side padding. */
    size?: 'sm' | 'md' | 'lg';
    /** Visible lines of text: the starting height, and the smallest one with autoResize. Default: 3. */
    rows?: number;
    /** Grows with the text, from rows up to maxRows, and scrolls past that. Turns off the resize handle. Default: false. */
    autoResize?: boolean;
    /** With autoResize: the most lines it grows to before it scrolls. Unset: no limit. */
    maxRows?: number;
    /** 'vertical' (default): a handle to drag the height. 'none': a fixed height. Read-only, disabled and autoResize textareas have none. */
    resize?: 'vertical' | 'none';
    /** A danger border and focus ring, and aria-invalid. Say what's wrong in text next to it, linked with aria-describedby. */
    invalid?: boolean;
    /** A character count under the text, "12 / 200" with maxLength (text-colored once it's reached). Linked to the field with aria-describedby. Default: false. */
    showCount?: boolean;
}
/** A multi-line text field: a native <textarea> (ref, value, onChange and every textarea attribute go to it) in a box that holds the count; className and style go to the box. Label it with <label htmlFor> or aria-label. */
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'children'> {
    /** The chosen time as "HH:mm" (24-hour, controlled), or null. Use with onValueChange. */
    value?: string | null;
    /** The chosen time at first (uncontrolled). */
    defaultValue?: string | null;
    /** Called with the new time as "HH:mm", or null when the field is cleared. */
    onValueChange?: (value: string | null) => void;
    /** Called when typed text is put back on blur or Enter: "unreadable" when it isn't a time, "unavailable" when it
        is one that can't be chosen (outside min..max). The field also says so to screen readers. */
    onInvalidInput?: (text: string, reason: "unreadable" | "unavailable") => void;
    /** The earliest and latest times, as "HH:mm". */
    min?: string;
    /** The latest time, as "HH:mm". */
    max?: string;
    /** Minutes between the times in the list (not seconds, as <input type="time"> counts its step: 15, not 900). Default: 30. Typed times don't have to fall on a step. */
    step?: number;
    /** A BCP 47 locale for how times are written. Default: the nearest SerupaProvider's locale, else the browser's. */
    locale?: string;
    /** 12-hour (AM/PM) or 24-hour. Default: the locale's. */
    hour12?: boolean;
    /** 'sm', 'md' (default) or 'lg', like Input. */
    size?: 'sm' | 'md' | 'lg';
    /** Marks the field invalid (aria-invalid and the error border), as on Input. */
    invalid?: boolean;
    /** The list's name, and the button's. Default: "Choose a time". */
    listLabel?: string;
}
/** A time field: type a time or pick one from a list. Values are "HH:mm". */
declare const TimePicker: React.ForwardRefExoticComponent<TimePickerProps & React.RefAttributes<HTMLInputElement>>;

type TimelineAlign = "start" | "alternate";
type TimelineStatus = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
interface TimelineProps extends React.OlHTMLAttributes<HTMLOListElement> {
    /** 'start' (default): every event on one side of the line. 'alternate': from 768px up, events take turns on either side of a centered line; narrower, they stay on one side. */
    align?: TimelineAlign;
    /** TimelineItems, in the order they happened (or newest first: the list keeps whatever order you give). */
    children?: React.ReactNode;
}
interface TimelineItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** What happened: "Order shipped". */
    title?: React.ReactNode;
    /** When it happened, as people read it: "12 Mar, 14:05" or "2 hours ago". */
    time?: React.ReactNode;
    /** The same moment for machines, on the <time> element: "2026-03-12T14:05". */
    dateTime?: string;
    /** An icon in the marker instead of a dot: a Material Symbols or custom name, or an element. */
    icon?: IconSource;
    /** The marker's color: 'neutral' (default), 'primary', 'success', 'warning', 'danger' or 'info'. It's decoration: say the status in the title too. */
    status?: TimelineStatus;
    /** More about the event, below the title and time. */
    children?: React.ReactNode;
}
/** An ordered list of events, for activity feeds and order history. */
declare const Timeline: React.ForwardRefExoticComponent<TimelineProps & React.RefAttributes<HTMLOListElement>>;
/** One event in a Timeline. */
declare const TimelineItem: React.ForwardRefExoticComponent<TimelineItemProps & React.RefAttributes<HTMLLIElement>>;

interface ToggleButtonProps extends Omit<ButtonAsButtonProps, "variant" | "destructive" | "loading" | "loadingText"> {
    /** Whether it's on (controlled). Use with onPressedChange. */
    pressed?: boolean;
    /** Whether it starts on (uncontrolled). Default: false. */
    defaultPressed?: boolean;
    /** Called with the new state when it's pressed. */
    onPressedChange?: (pressed: boolean) => void;
    /** 'outline' (default) or 'ghost' (for toolbars). */
    variant?: 'outline' | 'ghost';
}
/** A Button that turns something on and off, with aria-pressed: bold, mute, show grid. */
declare const ToggleButton: React.ForwardRefExoticComponent<ToggleButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface ToggleGroupProps extends Omit<ButtonGroupProps, "defaultValue" | "onChange"> {
    /** 'single' (default): turning one on turns the others off, and pressing the one that's on turns it off. 'multiple': each turns on and off by itself. */
    type?: 'single' | 'multiple';
    /** The values of the buttons that are on (controlled). Use with onValueChange. */
    value?: string[];
    /** The values of the buttons that are on at first (uncontrolled). */
    defaultValue?: string[];
    /** Called with the values of the buttons that are on, when one is pressed. */
    onValueChange?: (value: string[]) => void;
    /** With type="single": one button always stays on, so pressing the one that's on does nothing. Default: false. */
    required?: boolean;
    /** Turns every button off and out of use. */
    disabled?: boolean;
    /** The buttons' size, for those that don't set their own. */
    size?: ToggleButtonProps["size"];
    /** The buttons' variant, for those that don't set their own: 'outline' (default) or 'ghost'. */
    variant?: ToggleButtonProps["variant"];
    /** ToggleButtons, each with a value ("bold", "left"). Other children render as they are. */
    children?: React.ReactNode;
}
/** ToggleButtons that share one value: one on at a time, or any number. */
declare const ToggleGroup: React.ForwardRefExoticComponent<ToggleGroupProps & React.RefAttributes<HTMLDivElement>>;

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** 'horizontal' (a wrapping row, default; Left and Right move focus) or 'vertical' (a column; Up and Down). */
    orientation?: 'horizontal' | 'vertical';
    /** What the controls are for ("Text formatting"); needed when a page has more than one toolbar. */
    "aria-label"?: string;
    /** Buttons, IconButtons, ToggleButtons, ButtonGroups, Menus, Selects and Dividers, at any depth. */
    children?: React.ReactNode;
}
/** A set of controls with one Tab stop, where the arrow keys move between them. */
declare const Toolbar: React.ForwardRefExoticComponent<ToolbarProps & React.RefAttributes<HTMLDivElement>>;

interface TooltipProps {
    /** What the tooltip says: a short line of text. Keep links and buttons out (people can't reach them). */
    content: React.ReactNode;
    /** One element that can take focus (a Button, a link, an IconButton). The tooltip describes it. */
    children: React.ReactElement;
    /** 'top' (default), 'bottom', 'left', 'right', or with '-start' / '-end' ('bottom-start'). It flips when there's no room. */
    placement?: Placement;
    /** Milliseconds the pointer rests before it shows. Default: 400. Keyboard focus shows it at once, and so does the pointer while another tooltip is open or closed less than 300ms ago. */
    delay?: number;
    /** 'description' (default): adds to the element's name (aria-describedby). 'label': is its name (aria-labelledby), for an icon-only button with no other label. */
    role?: 'description' | 'label';
    /** Open it yourself (controlled); with onOpenChange. */
    open?: boolean;
    /** Open at first (uncontrolled). Default: false. */
    defaultOpen?: boolean;
    /** Called when it asks to show or hide, with why: { reason: 'hover' | 'focus' | 'blur' | 'trigger' (a press on the element) | 'escape' | 'outside' }. */
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    /** Never shows it, for example while the element is disabled. */
    disabled?: boolean;
    /** Classes on the tooltip. */
    className?: string;
    /** Styles on the tooltip. */
    style?: React.CSSProperties;
}
/** A short hint about one element, shown on hover and keyboard focus. */
declare const Tooltip: ((props: TooltipProps) => React.ReactElement) & {
    displayName: string;
};

interface TreeViewItem {
    /** Identifies the item in value and expanded. Unique in the whole tree. */
    id: string;
    /** What the row shows. */
    label: React.ReactNode;
    /** The text typing finds it by, when label isn't a string. Default: label. */
    textValue?: string;
    /** An icon before the label, such as a folder or a file. */
    icon?: IconSource;
    /** The items inside it. An item with children (even an empty array) can open and close. */
    children?: TreeViewItem[];
    /** Can be focused and read, but not picked, opened or closed. */
    disabled?: boolean;
}
interface TreeViewProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "defaultValue" | "onChange"> {
    /** The items at the top level, each with its own children. */
    items: TreeViewItem[];
    /** 'single' (default): one item is picked at a time. 'multiple': any number, toggled with Space or a click. 'none': items are only opened and closed. */
    selectionMode?: 'single' | 'multiple' | 'none';
    /** The picked items' ids (controlled). Use with onValueChange. */
    value?: string[];
    /** The picked items' ids at first (uncontrolled). */
    defaultValue?: string[];
    /** Called with the picked items' ids when they change. */
    onValueChange?: (value: string[]) => void;
    /** The open items' ids (controlled). Use with onExpandedChange. */
    expanded?: string[];
    /** The open items' ids at first (uncontrolled). */
    defaultExpanded?: string[];
    /** Called with the open items' ids when one opens or closes. */
    onExpandedChange?: (expanded: string[]) => void;
    /** What the tree holds ("Files"). Needed, unless aria-labelledby names it. */
    "aria-label"?: string;
}
/** Nested items that open and close, such as folders and files, with one item or many picked. */
declare const TreeView: React.ForwardRefExoticComponent<TreeViewProps & React.RefAttributes<HTMLUListElement>>;

interface TypeToConfirmProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** What to type to confirm, such as the name of what's deleted ("acme/web"). Spaces around what's typed don't count. */
    phrase: string;
    /** The button's label: the action, in words ("Delete this repository"). */
    confirmLabel: React.ReactNode;
    /** Runs when the button is pressed (or Enter is pressed in the field) with the phrase typed. Can return a promise:
     *  the button shows loading until it settles and takes no second press. */
    onConfirm: () => unknown;
    /** The field's label. Default: "To confirm, type" and the phrase in bold. */
    label?: React.ReactNode;
    /** Help under the label, such as what can't be undone. */
    hint?: React.ReactNode;
    /** Whether letter case must match too. Default: true. */
    caseSensitive?: boolean;
    /** Called when what's typed starts or stops matching the phrase. */
    onMatch?: (matched: boolean) => void;
    /** Disables the field and the button. */
    disabled?: boolean;
}
/** A field and a destructive button: the button works only once the phrase (a name) is typed, for actions that can't be undone. */
declare const TypeToConfirm: React.ForwardRefExoticComponent<TypeToConfirmProps & React.RefAttributes<HTMLDivElement>>;

interface VirtualListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
    /** How many rows there are. */
    count: number;
    /** Draws row `index`: a ListItem (or another element that passes its props and style on to an <li>). */
    renderItem: (index: number) => React.ReactElement;
    /** A stable key for row `index` (its id), so a row keeps its state when rows are added or removed. Default: the index. */
    itemKey?: (index: number) => React.Key;
    /** A guess at a row's height in px, for rows not drawn yet. Rows are measured once drawn. Default: 56. */
    estimatedItemHeight?: number;
    /** Rows drawn beyond each edge of the view, so a fast scroll doesn't show a gap. Default: 4. */
    overscan?: number;
    /** 'plain' (default) or 'card': inside a bordered, rounded frame, as List. */
    variant?: "plain" | "card";
    /** Lines between rows. Default: true. */
    divided?: boolean;
    /** 'ul' (default) or 'ol' when the order matters. */
    as?: "ul" | "ol";
}
/** A List of thousands of rows that draws only the ones in view: same rows, same look, fast at any length.
 *  @beta New: its API may still change in a minor release. Take this tag off once it has shipped with its bug bash done (CONTRIBUTING.md). */
declare const VirtualList: React.ForwardRefExoticComponent<VirtualListProps & React.RefAttributes<HTMLUListElement>>;

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
    /** Shows it while it (or something in it) has keyboard focus: for a "Skip to content" link. Default: false. */
    focusable?: boolean;
    /** The element. Default: 'span'. */
    as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label' | 'legend';
}
/** Content for screen readers only: hidden on screen, still announced. focusable shows it on keyboard focus. */
declare const VisuallyHidden: React.ForwardRefExoticComponent<VisuallyHiddenProps & React.RefAttributes<HTMLElement>>;

/** The components on plain pages: window.Serupa (serupa.iife.js) has each of them. */
interface ComponentGlobals {
    Accordion: typeof Accordion;
    AccordionItem: typeof AccordionItem;
    Alert: typeof Alert;
    Avatar: typeof Avatar;
    initials: typeof initials;
    AvatarGroup: typeof AvatarGroup;
    Badge: typeof Badge;
    Breadcrumb: typeof Breadcrumb;
    BreadcrumbItem: typeof BreadcrumbItem;
    Button: typeof Button;
    buttonClass: typeof buttonClass;
    ButtonGroup: typeof ButtonGroup;
    Calendar: typeof Calendar;
    Card: typeof Card;
    CardBody: typeof CardBody;
    CardFooter: typeof CardFooter;
    CardHeader: typeof CardHeader;
    Carousel: typeof Carousel;
    Checkbox: typeof Checkbox;
    CheckboxGroup: typeof CheckboxGroup;
    ColorPicker: typeof ColorPicker;
    Combobox: typeof Combobox;
    CommandPalette: typeof CommandPalette;
    Container: typeof Container;
    CopyButton: typeof CopyButton;
    DatePicker: typeof DatePicker;
    DateRangePicker: typeof DateRangePicker;
    Dialog: typeof Dialog;
    Divider: typeof Divider;
    Drawer: typeof Drawer;
    EmptyState: typeof EmptyState;
    ErrorBoundary: typeof ErrorBoundary;
    ErrorSummary: typeof ErrorSummary;
    Fab: typeof Fab;
    Field: typeof Field;
    FileUpload: typeof FileUpload;
    formatFileSize: typeof formatFileSize;
    FormattedNumber: typeof FormattedNumber;
    formatNumber: typeof formatNumber;
    Grid: typeof Grid;
    Heading: typeof Heading;
    Highlight: typeof Highlight;
    highlightRanges: typeof highlightRanges;
    HoverCard: typeof HoverCard;
    Icon: typeof Icon;
    IconButton: typeof IconButton;
    Image: typeof Image;
    InlineEdit: typeof InlineEdit;
    Input: typeof Input;
    Kbd: typeof Kbd;
    KeyboardShortcuts: typeof KeyboardShortcuts;
    useShortcut: typeof useShortcut;
    Link: typeof Link;
    List: typeof List;
    ListItem: typeof ListItem;
    LoadMore: typeof LoadMore;
    Loader: typeof Loader;
    ContextMenu: typeof ContextMenu;
    Menu: typeof Menu;
    MenuCheckboxItem: typeof MenuCheckboxItem;
    MenuGroup: typeof MenuGroup;
    MenuItem: typeof MenuItem;
    MenuRadioGroup: typeof MenuRadioGroup;
    MenuRadioItem: typeof MenuRadioItem;
    MenuSeparator: typeof MenuSeparator;
    MenuSub: typeof MenuSub;
    Meter: typeof Meter;
    meterState: typeof meterState;
    Navbar: typeof Navbar;
    NavbarLink: typeof NavbarLink;
    NotificationCenter: typeof NotificationCenter;
    useToastHistory: typeof useToastHistory;
    NumberInput: typeof NumberInput;
    Pagination: typeof Pagination;
    paginationRange: typeof paginationRange;
    PasswordInput: typeof PasswordInput;
    PhoneInput: typeof PhoneInput;
    formatPhone: typeof formatPhone;
    parsePhone: typeof parsePhone;
    PinInput: typeof PinInput;
    Popover: typeof Popover;
    Progress: typeof Progress;
    Prose: typeof Prose;
    Radio: typeof Radio;
    RadioGroup: typeof RadioGroup;
    Rating: typeof Rating;
    RelativeTime: typeof RelativeTime;
    relativeTime: typeof relativeTime;
    SaveStatus: typeof SaveStatus;
    SearchInput: typeof SearchInput;
    SegmentedControl: typeof SegmentedControl;
    Select: typeof Select;
    Sidebar: typeof Sidebar;
    SidebarItem: typeof SidebarItem;
    SidebarSection: typeof SidebarSection;
    SkipLink: typeof SkipLink;
    Slider: typeof Slider;
    SortableList: typeof SortableList;
    Splitter: typeof Splitter;
    Stack: typeof Stack;
    Stepper: typeof Stepper;
    Switch: typeof Switch;
    Table: typeof Table;
    TableActionBar: typeof TableActionBar;
    TableBody: typeof TableBody;
    TableCell: typeof TableCell;
    TableFoot: typeof TableFoot;
    TableHead: typeof TableHead;
    TableHeaderCell: typeof TableHeaderCell;
    TableRow: typeof TableRow;
    TableSelectCell: typeof TableSelectCell;
    Tab: typeof Tab;
    TabList: typeof TabList;
    TabPanel: typeof TabPanel;
    Tabs: typeof Tabs;
    Text: typeof Text;
    Textarea: typeof Textarea;
    TimePicker: typeof TimePicker;
    Timeline: typeof Timeline;
    TimelineItem: typeof TimelineItem;
    toast: typeof toast;
    Toaster: typeof Toaster;
    ToggleButton: typeof ToggleButton;
    ToggleGroup: typeof ToggleGroup;
    Toolbar: typeof Toolbar;
    Tooltip: typeof Tooltip;
    TreeView: typeof TreeView;
    TypeToConfirm: typeof TypeToConfirm;
    VirtualList: typeof VirtualList;
    VisuallyHidden: typeof VisuallyHidden;
}

/** The system's version, e.g. "4.8.0" (semver). */
declare const version: string;
type ThemeApi = SerupaTheme;
declare global {
    interface Window {
        /** The components on plain pages (serupa.iife.js): everything the package exports, and theme when theme.js is loaded. */
        Serupa: ComponentGlobals & {
            /** The system's version, e.g. "4.8.0" (semver). */ version: string;
            announce: typeof announce;
            announcePage: typeof announcePage;
            configure: typeof configure;
            customIcons: typeof customIcons;
            enLabels: typeof DEFAULT_LABELS;
            getIcon: typeof getIcon;
            idLabels: typeof idLabels;
            plural: typeof plural;
            registerIcons: typeof registerIcons;
            SerupaProvider: typeof SerupaProvider;
            useCollator: typeof useCollator;
            useLocale: typeof useLocale;
            useSerupa: typeof useSerupa;
            withoutTransitions: typeof withoutTransitions;
            withViewTransition: typeof withViewTransition;
            /** Present when theme.js is loaded. */ theme?: ThemeApi;
        };
        /** Every Material Symbol, once serupa-icons.iife.js has run (serupa.iife.js adds it when an Icon needs it). */
        SerupaIcons?: Readonly<Record<string, unknown>>;
    }
}

export { Accordion, AccordionItem, Alert, Avatar, AvatarGroup, Badge, Breadcrumb, BreadcrumbItem, Button, ButtonGroup, Calendar, Card, CardBody, CardFooter, CardHeader, Carousel, Checkbox, CheckboxGroup, ColorPicker, Combobox, CommandPalette, Container, ContextMenu, CopyButton, DatePicker, DateRangePicker, Dialog, Divider, Drawer, EmptyState, ErrorBoundary, ErrorSummary, Fab, Field, FileUpload, FormattedNumber, Grid, Heading, Highlight, HoverCard, Icon, IconButton, Image, InlineEdit, Input, Kbd, KeyboardShortcuts, Link, List, ListItem, LoadMore, Loader, Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuSub, Meter, Navbar, NavbarLink, NotificationCenter, NumberInput, Pagination, PasswordInput, PhoneInput, PinInput, Popover, Progress, Prose, Radio, RadioGroup, Rating, RelativeTime, SaveStatus, SearchInput, SegmentedControl, Select, SerupaProvider, Sidebar, SidebarItem, SidebarSection, SkipLink, Slider, SortableList, Splitter, Stack, Stepper, Switch, Tab, TabList, TabPanel, Table, TableActionBar, TableBody, TableCell, TableFoot, TableHead, TableHeaderCell, TableRow, TableSelectCell, Tabs, Text, Textarea, TimePicker, Timeline, TimelineItem, Toaster, ToggleButton, ToggleGroup, Toolbar, Tooltip, TreeView, TypeToConfirm, VirtualList, VisuallyHidden, announce, announcePage, buttonClass, configure, customIcons, DEFAULT_LABELS as enLabels, formatFileSize, formatNumber, formatPhone, getIcon, highlightRanges, idLabels, initials, meterState, paginationRange, parsePhone, plural, registerIcons, relativeTime, toast, useCollator, useLocale, useSerupa, useShortcut, useToastHistory, version, withViewTransition, withoutTransitions };
export type { AccordionItemProps, AccordionProps, AlertProps, AlertTone, AnnouncePageOptions, AvatarGroupProps, AvatarProps, AvatarSize, AvatarStatus, BadgeProps, BadgeTone, BadgeVariant, BreadcrumbItemOwnProps, BreadcrumbItemProps, BreadcrumbProps, ButtonAsButtonProps, ButtonAsLinkProps, ButtonGroupProps, ButtonProps, ButtonSize, ButtonVariant, CalendarProps, CardBodyProps, CardFooterProps, CardHeaderProps, CardPadding, CardProps, CardVariant, CarouselPerView, CarouselProps, CheckboxGroupProps, CheckboxProps, ColorPickerProps, ColorSwatch, ComboboxMultipleProps, ComboboxOption, ComboboxProps, ComboboxSingleProps, Command, CommandPaletteProps, ContainerProps, ContainerSize, ContextMenuProps, CopyButtonProps, CustomIconName, DatePickerProps, DateRange, DateRangeInput, DateRangePickerProps, DialogProps, DividerProps, DrawerProps, EmptyStateProps, ErrorBoundaryFallbackProps, ErrorBoundaryProps, ErrorSummaryItem, ErrorSummaryProps, FabPosition, FabProps, FieldProps, FileRejection, FileUploadProps, FormatNumberOptions, FormattedNumberProps, GridProps, HeadingLevel, HeadingProps, HeadingSize, HighlightProps, HoverCardProps, IconButtonProps, IconData, IconName, IconProps, IconSource, ImageProps, ImageRatio, ImageSource, InlineEditProps, InputProps, KbdProps, KeyboardShortcutsProps, LinkOwnProps, LinkProps, ListItemProps, ListProps, LoadMoreProps, LoaderPattern, LoaderProps, LoaderShape, LoaderTone, LoaderVariant, MaterialIconName, MenuCheckboxItemProps, MenuGroupProps, MenuItemOwnProps, MenuItemProps, MenuProps, MenuRadioGroupProps, MenuRadioItemProps, MenuSeparatorProps, MenuSubProps, MeterProps, MeterState, NavbarLinkOwnProps, NavbarLinkProps, NavbarProps, NotificationCenterProps, NotificationItem, NumberFormat, NumberInputProps, OpenChangeDetails, OpenChangeReason, PaginationProps, ParsedPhone, PasswordInputProps, PhoneCountry, PhoneInputProps, PhoneValueDetails, PinInputProps, Placement, PluralForms, PopoverProps, ProgressProps, ProgressTone, ProseProps, RadioGroupProps, RadioProps, RatingProps, RelativeTimeProps, SaveState, SaveStatusProps, SearchInputProps, SegmentedControlOption, SegmentedControlProps, SelectOption, SelectOptionGroup, SelectProps, SerupaConfig, SerupaLabels, SerupaProviderProps, SerupaSettings, SerupaTheme, Shortcut, ShortcutOptions, SidebarItemOwnProps, SidebarItemProps, SidebarProps, SidebarSectionProps, SkipLinkProps, SliderMark, SliderProps, SliderValue, SortDirection, SortableListProps, Space, SplitterProps, StackProps, StepperProps, StepperStep, SwitchProps, TabListProps, TabPanelProps, TabProps, TableActionBarProps, TableBodyProps, TableCellProps, TableFootProps, TableHeadProps, TableHeaderCellProps, TableProps, TableRowProps, TableSelectCellProps, TabsProps, TabsVariant, TextProps, TextSize, TextTone, TextWeight, TextareaProps, ThemeBrand, ThemeInfo, ThemeMode, TimePickerProps, TimelineAlign, TimelineItemProps, TimelineProps, TimelineStatus, ToastHistory, ToastHistoryOptions, ToastOptions, ToastPromiseMessages, ToastTone, ToastUndoOptions, ToasterPosition, ToasterProps, ToggleButtonProps, ToggleGroupProps, ToolbarProps, TooltipProps, TreeViewItem, TreeViewProps, TypeToConfirmProps, ValidityProblem, VirtualListProps, VisuallyHiddenProps };
