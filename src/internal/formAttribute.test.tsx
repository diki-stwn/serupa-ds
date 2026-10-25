import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Slider } from '../components/Slider/Slider';
import { TimePicker } from '../components/TimePicker/TimePicker';

// U3: a control placed outside its form, tied to it with form="…", as a native input can be. Its hidden inputs
// carry the form attribute too, so the form submits them, and a reset of that form puts the default back.
describe('form attribute on controls with hidden inputs', () => {
  test('a control outside its form submits with it', async () => {
    await render(<>
      <form id="outside-f" />
      <Combobox form="outside-f" name="country" aria-label="Country" options={['Brazil', 'Chile']} defaultValue="Chile" />
      <DatePicker form="outside-f" name="day" aria-label="Day" locale="en-US" defaultValue={new Date(2025, 2, 10)} />
      <DateRangePicker form="outside-f" startName="from" endName="to" locale="en-US" defaultValue={{ start: new Date(2025, 2, 10), end: new Date(2025, 2, 14) }} />
      <PhoneInput form="outside-f" name="phone" aria-label="Phone" defaultCountry="US" defaultValue="+12015550123" />
      <SegmentedControl form="outside-f" name="period" aria-label="Period" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} defaultValue="week" />
      <Slider form="outside-f" name="volume" aria-label="Volume" defaultValue={30} />
      <TimePicker form="outside-f" name="at" aria-label="At" locale="en-GB" defaultValue="09:30" />
    </>);
    const data = Object.fromEntries(new FormData(document.getElementById('outside-f') as HTMLFormElement));
    expect(data).toEqual({ country: 'Chile', day: '2025-03-10', from: '2025-03-10', to: '2025-03-14', phone: '+12015550123', period: 'week', volume: '30', at: '09:30' });
  });

  test('a reset of that form puts the default back in a control outside it', async () => {
    await render(<>
      <form id="outside-r" />
      <SegmentedControl form="outside-r" name="period" aria-label="Period" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} defaultValue="week" />
      <Slider form="outside-r" name="volume" aria-label="Volume" defaultValue={30} />
    </>);
    const f = document.getElementById('outside-r') as HTMLFormElement;
    (document.querySelector('[role="radio"][aria-checked="false"]') as HTMLElement).click();
    (document.querySelector('[role="slider"]') as HTMLElement).focus();
    (document.querySelector('[role="slider"]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await expect.poll(() => Object.fromEntries(new FormData(f))).toEqual({ period: 'day', volume: '100' });
    f.reset();
    await expect.poll(() => Object.fromEntries(new FormData(f))).toEqual({ period: 'week', volume: '30' });
  });
});
