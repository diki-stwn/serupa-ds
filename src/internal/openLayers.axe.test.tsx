// axe on the open states (E2). The Storybook check runs axe on every story, but a story shows a Dialog, Menu or
// picker closed, so what opens on top (the list, the calendar, the panel and its buttons) was never checked. Here
// each one is opened as people open it, then checked in all six themes with the same WCAG 2.2 AA rules.
import * as React from 'react';
import axe from 'axe-core';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES } from '../../tools/test/vitest/helpers';
import { Button } from '../components/Button/Button';
import { Combobox } from '../components/Combobox/Combobox';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { Dialog } from '../components/Dialog/Dialog';
import { Drawer } from '../components/Drawer/Drawer';
import { Field } from '../components/Field/Field';
import { Menu, MenuGroup, MenuItem, MenuSeparator } from '../components/Menu/Menu';
import { Popover } from '../components/Popover/Popover';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { Tooltip } from '../components/Tooltip/Tooltip';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

/** The axe violations on the page in each theme, as "theme: rule (target)" lines; text in a disabled control is
 *  exempt from contrast, as WCAG 1.4.3 says (the same rule as tools/test/storybook.mjs). */
async function violations(): Promise<string[]> {
  const out: string[] = [];
  for (const th of THEMES) {
    document.documentElement.setAttribute('data-theme', th);
    const r = await axe.run(document, { runOnly: { type: 'tag', values: TAGS } });
    const inactive = (n: axe.NodeResult) => document.querySelector(n.target.join(' '))?.closest(':disabled, [aria-disabled="true"]');
    for (const v of r.violations) {
      const nodes = v.id === 'color-contrast' ? v.nodes.filter((n) => !inactive(n)) : v.nodes;
      if (nodes.length) out.push(`${th}: ${v.id} (${nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')})`);
    }
  }
  return out;
}

const shown = (sel: string) => expect.poll(() => { const el = document.querySelector(sel); return !!el && (el as HTMLElement).checkVisibility(); }).toBe(true);

describe('open layers pass axe (WCAG 2.2 AA) in all six themes', () => {
  test('Dialog, open: title, description, body and footer buttons', async () => {
    await render(<Dialog open onOpenChange={() => {}} title="Invite people" description="They'll get an email." footer={<><Button variant="secondary">Cancel</Button><Button>Send</Button></>}>
      <Field label="Email"><input type="email" /></Field>
    </Dialog>);
    await shown('dialog[open]');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('Drawer, open', async () => {
    await render(<Drawer open onOpenChange={() => {}} title="Filters"><p>Show only open items.</p></Drawer>);
    await shown('dialog[open]');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('Menu, open: items, a shortcut, a disabled item, a group and a destructive item', async () => {
    await render(<Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuItem icon="edit" shortcut="⌘E">Edit</MenuItem>
      <MenuItem disabled>Archive</MenuItem>
      <MenuSeparator />
      <MenuGroup label="Danger zone"><MenuItem icon="delete" destructive>Delete</MenuItem></MenuGroup>
    </Menu>);
    await userEvent.click(document.querySelector('button')!);
    await shown('[role="menu"]');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('Popover, open', async () => {
    await render(<Popover open onOpenChange={() => {}} title="Share" trigger={<Button>Share</Button>}><p>Anyone with the link can view.</p></Popover>);
    await shown('.dk-popover');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('Tooltip, open', async () => {
    await render(<Tooltip open content="Copy the link"><Button>Copy</Button></Tooltip>);
    await shown('[role="tooltip"]');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('Combobox, open with its list', async () => {
    await render(<Field label="Country"><Combobox options={['Indonesia', 'Malaysia', { value: 'sg', label: 'Singapore', disabled: true }]} /></Field>);
    (document.querySelector('input') as HTMLInputElement).focus();
    await userEvent.keyboard('{ArrowDown}');
    await shown('[role="listbox"]');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('DatePicker, open with its calendar', async () => {
    await render(<Field label="Due"><DatePicker locale="en-US" defaultValue={new Date(2026, 2, 12)} min={new Date(2026, 2, 3)} /></Field>);
    await userEvent.click(document.querySelector('.dk-date-picker__button')!);
    await shown('.dk-date-picker__popup');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('DateRangePicker, open with its calendars', async () => {
    await render(<Field label="Stay" group><DateRangePicker locale="en-US" defaultValue={{ start: new Date(2026, 2, 12), end: new Date(2026, 2, 15) }} /></Field>);
    await userEvent.click(document.querySelector('.dk-date-range-picker__button')!);
    await shown('.dk-date-range-picker__popup');
    expect(await violations()).toEqual([]);
  }, 60_000);

  test('TimePicker, open with its list', async () => {
    await render(<Field label="Start"><TimePicker locale="en-US" defaultValue="09:30" /></Field>);
    await userEvent.click(document.querySelector('.dk-time-picker__button')!);
    await shown('[role="listbox"]');
    expect(await violations()).toEqual([]);
  }, 60_000);
});
