import { describe, expect, test } from 'vitest';
import { settleTime, speed, track, type Samples } from './fling';

describe('fling', () => {
  test('the speed is the last 100ms of the gesture: a slow drag that ends in a flick reads as the flick', () => {
    const s: Samples = [{ t: 0, p: 0 }];
    for (let t = 20; t <= 300; t += 20) track(s, t, t / 10);   // 0.1px/ms for 300ms
    for (let t = 310; t <= 340; t += 10) track(s, t, 30 + (t - 300) * 2);   // then 2px/ms
    expect(s.every((x) => x.t >= 240)).toBe(true);
    expect(speed(s)).toBeGreaterThan(0.5);   // far above the drag's 0.1px/ms
    expect(speed([{ t: 5, p: 3 }])).toBe(0);
  });

  test('a settle starts at the hand\'s speed on ease-fling (3 × distance ÷ speed), between 150 and 400ms; from a stop it goes as if at 1px/ms', () => {
    expect(settleTime(100, 1.5)).toBe(200);
    expect(settleTime(100, -1.5)).toBe(200);
    expect(settleTime(10, 3)).toBe(150);
    expect(settleTime(400, 1)).toBe(400);
    expect(settleTime(80, 0)).toBe(240);
    expect(settleTime(80, 0, { max: 200 })).toBe(200);
  });
});
