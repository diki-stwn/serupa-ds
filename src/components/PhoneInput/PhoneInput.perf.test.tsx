import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { PhoneInput } from './PhoneInput';

// How long a keystroke's render takes (React Profiler, median of ten), with every country and with one.
async function typing(id: string, countries?: string[]): Promise<number> {
  const times: number[] = [];
  const r = await render(<React.Profiler id={id} onRender={(_id, phase, actual) => { if (phase === 'update') times.push(actual); }}>
    <PhoneInput id={id} aria-label="Phone" defaultCountry="ID" countries={countries} />
  </React.Profiler>);
  await userEvent.click(document.getElementById(id)!);
  await userEvent.keyboard('8123456789');
  await r.unmount();
  return times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
}

describe('PhoneInput re-render cost (AY2)', () => {
  test('a keystroke costs about the same with all 244 countries as with one: the options aren\'t rebuilt on each render', async () => {
    const one = await typing('p1', ['ID']), all = await typing('pall');
    // With the options rebuilt on each render, all 244 took about six times as long as one. The browser rounds these
    // times to 0.1ms, so a run that lands exactly on three times one (0.7 and 2.1) is still a pass.
    expect(all).toBeLessThanOrEqual(Math.max(one, 0.5) * 3 + 0.1);
  });
});
