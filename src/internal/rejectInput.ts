import { announce } from "./announce";

/* DatePicker, DateRangePicker and TimePicker put back typed text they don't take. This tells the app why
   (onInvalidInput) and says so to screen readers, who would otherwise hear the old value come back without a word. */
export function reject(text: string, reason: "unreadable" | "unavailable", onInvalidInput: ((text: string, reason: "unreadable" | "unavailable") => void) | undefined, say: (text: string) => string): void {
  const t = text.trim();
  if (onInvalidInput) onInvalidInput(t, reason);
  announce(say(t), { assertive: true });
}
