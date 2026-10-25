import { announce } from "./announce";

/* DatePicker, DateRangePicker, TimePicker and NumberInput put back typed text they don't take. This tells the app why
   (onInvalidInput) and says so to screen readers, who would otherwise hear the old value come back without a word. */
export function reject<R extends string>(text: string, reason: R, onInvalidInput: ((text: string, reason: R) => void) | undefined, say: (text: string) => string): void {
  const t = text.trim();
  if (onInvalidInput) onInvalidInput(t, reason);
  announce(say(t), { assertive: true });
}
