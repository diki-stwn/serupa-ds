import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Button } from '../components/Button/Button';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { Menu, MenuItem } from '../components/Menu/Menu';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { Popover } from '../components/Popover/Popover';
import { SearchInput } from '../components/SearchInput/SearchInput';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { isComposing } from './ime';

// The keydowns an input method sends while composing: Safari's isComposing, and keyCode 229 from older engines.
const composing = (target: Element, key: string, how: 'flag' | '229' = 'flag') => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, isComposing: how === 'flag' });
  if (how === '229') Object.defineProperty(e, 'keyCode', { value: 229 });
  target.dispatchEvent(e);
  return e;
};
const settle = () => new Promise((r) => setTimeout(r, 50));
const el = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;

describe('typing with an input method', () => {
  test('isComposing: the flag, or keyCode 229; a plain keydown is not', () => {
    expect([
      isComposing(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true })),
      isComposing(Object.defineProperty(new KeyboardEvent('keydown', { key: 'Enter' }), 'keyCode', { value: 229 })),
      isComposing(new KeyboardEvent('keydown', { key: 'Enter' })),
    ]).toEqual([true, true, false]);
  });

  test('Combobox: a composing Enter doesn\'t pick the highlighted option, and a composing Escape doesn\'t close the list', async () => {
    await render(<Combobox id="cb" aria-label="Country" options={['Japan', 'Jamaica', 'Jordan']} />);
    await userEvent.click(el('cb'));
    await userEvent.keyboard('{ArrowDown}');
    for (const how of ['flag', '229'] as const) {
      expect(composing(el('cb'), 'Enter', how).defaultPrevented).toBe(false);
      composing(el('cb'), 'Escape', how);
      await settle();
      expect([el('cb').value, el('cb').getAttribute('aria-expanded')]).toEqual(['', 'true']);
    }
  });

  test('SearchInput: a composing Escape doesn\'t clear the field and a composing Enter doesn\'t search', async () => {
    const calls: string[] = [];
    await render(<SearchInput id="s" aria-label="Search" defaultValue="にほ" onSearch={(v) => calls.push('search ' + v)} onClear={() => calls.push('clear')} />);
    composing(el('s'), 'Escape');
    composing(el('s'), 'Enter', '229');
    await settle();
    expect([el('s').value, calls.join()]).toEqual(['にほ', '']);
    await userEvent.click(el('s'));
    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual(['search にほ']);
  });

  test('TimePicker, DatePicker, DateRangePicker and NumberInput: a composing Enter doesn\'t read the half-typed text', async () => {
    const calls: string[] = [];
    await render(<div>
      <TimePicker id="t" aria-label="Time" locale="en-US" onValueChange={(v) => calls.push('time ' + v)} />
      <DatePicker id="d" aria-label="Date" locale="en-US" onValueChange={(v) => calls.push('date ' + String(v))} />
      <DateRangePicker data-testid="r" aria-label="Stay" locale="en-US" onValueChange={(v) => calls.push('range ' + String(v.start))} />
      <NumberInput id="n" aria-label="Count" step={1} onValueChange={(v) => calls.push('number ' + v)} />
    </div>);
    const range = document.querySelector<HTMLInputElement>('[data-testid=r] .dk-date-range-picker__field')!;
    for (const [i, text] of [[el('t'), '2'], [el('d'), '1/2'], [range, '1/2']] as const) {
      i.focus();
      // Set the text without an input event, as a composition in progress would show it.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(i, text);
      composing(i, 'Enter');
    }
    composing(el('n'), 'ArrowUp');
    await settle();
    expect(calls).toEqual([]);
    expect([el('t').value, el('d').value, el('n').value]).toEqual(['2', '1/2', '']);
  });

  test('Menu and Popover: a composing Escape doesn\'t close them', async () => {
    await render(<div>
      <Menu trigger={<Button id="mb">Actions</Button>}><MenuItem>Edit</MenuItem><MenuItem>Delete</MenuItem></Menu>
      <Popover title="Rename" trigger={<Button id="pb">Rename</Button>}><input id="name" aria-label="Name" /></Popover>
    </div>);
    await userEvent.click(el('mb'));
    await expect.poll(() => document.activeElement!.getAttribute('role')).toBe('menuitem');
    composing(document.activeElement!, 'Escape');
    await settle();
    expect(el('mb').getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard('{Escape}');
    expect(el('mb').getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(el('pb'));
    el('name').focus();
    composing(el('name'), 'Escape');
    await settle();
    expect(el('pb').getAttribute('aria-expanded')).toBe('true');
  });
});
