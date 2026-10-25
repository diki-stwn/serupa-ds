// Spacing steps a layout prop can take (gap={4} → var(--spacing-4)), the same scale as the gap-* utilities.
export const SPACE = ["0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16", "20", "24"] as const;
export type Space = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 14 | 16 | 20 | 24;

/** var(--spacing-<step>) for a step on the scale, or undefined (then the component's default applies). */
export function space(step: unknown): string | undefined {
  const s = typeof step === "number" || typeof step === "string" ? String(step) : "";
  return (SPACE as readonly string[]).indexOf(s) < 0 ? undefined : "var(--spacing-" + s.replace(".", "\\.") + ")";
}
