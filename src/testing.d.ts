/** Serupa's six themes, in the order the docs show them. */
export type SerupaTheme = 'blue-light' | 'blue-dark' | 'violet-light' | 'violet-dark' | 'emerald-light' | 'emerald-dark';
export declare const THEMES: readonly SerupaTheme[];

/** What forEachTheme needs from a page: Playwright's Page fits, and so does anything with the same evaluate(). */
export interface ThemedPage {
  evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R>;
  /** Used when it's there, so prefers-color-scheme matches each theme. */
  emulateMedia?(options: { colorScheme: 'light' | 'dark' | null }): Promise<void>;
}

export interface ForEachThemeOptions {
  /** Only these themes, in this order. Default: all six. */
  themes?: readonly SerupaTheme[];
  /** Turn off transitions, animations and the text caret while it runs. Default: true. */
  still?: boolean;
}

/** Draws the page in each theme in turn (data-theme on <html>, the matching color scheme, fonts loaded, transitions
 *  off) and calls fn with the theme's name, for a screenshot. Puts the page back as it was afterwards, even when fn
 *  throws.
 *  @example await forEachTheme(page, (theme) => expect(page).toHaveScreenshot(`home-${theme}.png`)); */
export declare function forEachTheme(page: ThemedPage, fn: (theme: SerupaTheme) => unknown, options?: ForEachThemeOptions): Promise<void>;
