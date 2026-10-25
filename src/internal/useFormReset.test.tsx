import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl';
import { Slider } from '../components/Slider/Slider';
import { TimePicker } from '../components/TimePicker/TimePicker';

// The custom inputs submit through hidden inputs fed by React state; form.reset() (and React 19 resetting a form
// after its action) must put their default back, as it does for a native field.
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const form = () => q('#f') as HTMLFormElement;
const sent = () => Object.fromEntries([...new FormData(form()).entries()].map(([k, v]) => [k, typeof v === "string" ? v : v.name]));
const typeInto = async (sel: string, text: string) => {
  const el = q(sel) as HTMLInputElement;
  await userEvent.clear(el);
  await userEvent.type(el, text);
  await userEvent.keyboard('{Enter}');
  el.blur();
};

describe('form reset puts the default back', () => {
  test('Combobox, DatePicker, DateRangePicker, TimePicker, Slider and SegmentedControl', async () => {
    await render(
      <form id="f">
        <Combobox id="cb" aria-label="Fruit" name="fruit" options={['Apple', 'Banana', 'Cherry']} defaultValue="Apple" />
        <DatePicker id="dp" aria-label="Day" name="day" locale="en-US" defaultValue={new Date(2026, 0, 5)} />
        <DateRangePicker id="dr" startName="from" endName="to" locale="en-US" defaultValue={{ start: new Date(2026, 0, 5), end: new Date(2026, 0, 9) }} />
        <TimePicker id="tp" aria-label="At" name="at" locale="en-US" hour12={false} defaultValue="09:00" />
        <Slider aria-label="Volume" name="volume" defaultValue={20} />
        <SegmentedControl aria-label="View" name="view" options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} defaultValue="list" />
      </form>,
    );
    const before = sent();
    expect(before).toEqual({ fruit: 'Apple', day: '2026-01-05', from: '2026-01-05', to: '2026-01-09', at: '09:00', volume: '20', view: 'list' });

    // Change every one.
    await userEvent.click(q('#cb'));
    await userEvent.click(q('[role="option"]:last-child'));
    await typeInto('#dp', '02/10/2026');
    await typeInto('#dr', '01/07/2026');
    await typeInto('#tp', '14:30');
    q('[role="slider"]').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await userEvent.click(q('[role="radio"][aria-checked="false"]'));
    await expect.poll(() => sent()).toEqual({ fruit: 'Cherry', day: '2026-02-10', from: '2026-01-07', to: '2026-01-09', at: '14:30', volume: '22', view: 'grid' });

    React.act(() => form().reset());
    await expect.poll(() => sent()).toEqual(before);
    // What people see is back too.
    expect([(q('#cb') as HTMLInputElement).value, (q('#dp') as HTMLInputElement).value, (q('#dr') as HTMLInputElement).value, (q('#tp') as HTMLInputElement).value, q('[role="slider"]').getAttribute('aria-valuenow'), q('[role="radio"][aria-checked="true"]').textContent])
      .toEqual(['Apple', '01/05/2026', '01/05/2026', '09:00', '20', 'List']);
  });

  test('a controlled one is left to the app, like a native field', async () => {
    function Controlled() {
      const [v, setV] = React.useState('Banana');
      return <form id="f"><Combobox id="cb" aria-label="Fruit" name="fruit" options={['Apple', 'Banana']} value={v} onValueChange={(x) => setV(x ?? '')} /></form>;
    }
    await render(<Controlled />);
    React.act(() => form().reset());
    await new Promise((r) => setTimeout(r, 50));
    expect(sent()).toEqual({ fruit: 'Banana' });
  });
});
