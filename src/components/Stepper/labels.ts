// Stepper's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface StepperLabels {
  /** Stepper: its name, and the words read out or shown for a step. */
  completed: string;
  hasError: string;
  /** Stepper: read after the title of a step with status "warning". */
  hasWarning: string;
  /** Stepper, when the steps don't fit side by side and it shows only the current step's title: "Step 2 of 4". */
  stepOf: (step: number, total: number) => string;
}
export const en: StepperLabels = {
  completed: "completed",
  hasError: "has an error",
  hasWarning: "needs attention",
  stepOf: (step, total) => "Step " + step + " of " + total,
};
export const id: StepperLabels = {
  completed: "selesai",
  hasError: "ada kesalahan",
  hasWarning: "perlu diperhatikan",
  stepOf: (step, total) => "Langkah " + step + " dari " + total,
};
