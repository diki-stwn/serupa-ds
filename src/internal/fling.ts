// Fling and settle (inertia): what the hand lets go of mid-motion carries on at the hand's speed and slows to rest,
// instead of jumping to a speed of its own. The speed is the pointer's over the last 100ms, so a slow drag that ends
// in a flick counts and a pause before letting go doesn't. The settle runs on ease-fling (ease-out-cubic), which
// starts three times faster than its average, so a settle of 3 × distance / speed starts exactly at the hand's speed.

/** Pointer positions over time, for `speed()`: those of the last 100ms, and at least two. */
export type Samples = { t: number; p: number }[];

const WINDOW = 100;
/** ease-fling's starting speed over its average (the slope of ease-out-cubic at 0). */
const SLOPE = 3;

/** Adds a position (in px, along the gesture) at time `t` (an event's timeStamp) and drops the samples the window has passed. */
export function track(s: Samples, t: number, p: number): void {
  s.push({ t, p });
  while (s.length > 2 && s[0].t < t - WINDOW) s.shift();
}

/** The pointer's speed over the window, in px per ms, signed along the gesture. */
export function speed(s: Samples): number {
  const a = s[0], b = s[s.length - 1];
  return a && b ? (b.p - a.p) / Math.max(1, b.t - a.t) : 0;
}

/** How long a settle over `distance` px takes when it starts at `v` px/ms on ease-fling, so it carries on at the hand's
 *  speed: between `min` and `max` ms, and as if at `floor` px/ms at least, so a slow release still arrives briskly. */
export function settleTime(distance: number, v: number, { min = 150, max = 400, floor = 1 }: { min?: number; max?: number; floor?: number } = {}): number {
  return Math.round(Math.min(max, Math.max(min, (SLOPE * Math.abs(distance)) / Math.max(Math.abs(v), floor))));
}

/** A drag past where it can go meets resistance: it moves less the further it goes, never more than w (Carousel past
 *  its first or last slide, a Drawer pulled away from its edge). */
export const rubber = (d: number, w: number): number => Math.sign(d) * (1 - 1 / (Math.abs(d) * 0.55 / Math.max(1, w) + 1)) * w;
