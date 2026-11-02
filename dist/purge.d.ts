/** What both plugins take. */
export interface SerupaPurgeOptions {
  /** The files and folders to read for class names and component names, relative to the project. Default: whichever
   *  of src/, index.html, app/, pages/ and components/ exist. */
  content?: string[];
  /** Classes your code builds at runtime ("grid-cols-" + n), or "@safelist.txt" for a file of them. */
  keep?: string[];
  /** Also drop the styles of components the sources never name (IconButton keeps Button and Icon). Default: false. */
  components?: boolean;
}

/** A Vite plugin (vite.config.js `plugins`): trims Serupa's stylesheets in `vite build`; the dev server serves them whole. */
export declare function serupaPurge(options?: SerupaPurgeOptions): {
  name: string;
  apply: "build";
  enforce: "pre";
  configResolved(config: { root: string }): void;
  buildStart(): void;
  transform(code: string, id: string): { code: string; map: null } | null;
};

/** A PostCSS plugin (postcss.config.js `plugins`): trims the rules that came from Serupa's stylesheets. */
export declare function serupaPurgePostcss(options?: SerupaPurgeOptions & {
  /** The folder content is relative to. Default: the current folder. */
  root?: string;
}): { postcssPlugin: string; Once(root: unknown, helpers: unknown): void };
export declare namespace serupaPurgePostcss { const postcss: true; }
