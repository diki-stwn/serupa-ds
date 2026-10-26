// module state: which warnings were given; on a server each is given once per process, which is all a warning needs.
const warned: Record<string, 1> = {};
// Each warning's section in docs/warnings.md, which says why it shows and how to fix it.
const DOCS = "https://github.com/diki-stwn/serupa-ds/blob/main/docs/warnings.md#";

/** A console warning, once per key for the page's lifetime. Call it inside `if (process.env.NODE_ENV !== "production" && …)`,
 *  so a production build drops the call and its message (tools/test/dev-warnings.mjs checks every one is). code names
 *  the warning and its section in docs/warnings.md, and is the key unless the warning is given once per something
 *  (an icon name, a component): then key says what. */
export function warnOnce(code: string, msg: string, key = code): void {
  if (!warned[key] && typeof console !== "undefined") {
    warned[key] = 1;
    console.warn(`${msg} (Serupa warning ${code}: ${DOCS}${code})`);
  }
}

/** Forgets which warnings were given. The test setup calls it between tests, so a test that expects a warning
 *  doesn't depend on whether a test before it (in random order) already gave the same one. */
export function resetWarnings(): void {
  for (const k of Object.keys(warned)) delete warned[k];
}
