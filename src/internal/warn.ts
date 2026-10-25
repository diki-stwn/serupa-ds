// module state: which warnings were given; on a server each is given once per process, which is all a warning needs.
const warned: Record<string, 1> = {};

/** A console warning, once per key for the page's lifetime. Call it inside `if (process.env.NODE_ENV !== "production" && …)`,
 *  so a production build drops the call and its message (tools/test/dev-warnings.mjs checks every one is). */
export function warnOnce(key: string, msg: string): void {
  if (!warned[key] && typeof console !== "undefined") {
    warned[key] = 1;
    console.warn(msg);
  }
}

/** Forgets which warnings were given. The test setup calls it between tests, so a test that expects a warning
 *  doesn't depend on whether a test before it (in random order) already gave the same one. */
export function resetWarnings(): void {
  for (const k of Object.keys(warned)) delete warned[k];
}
