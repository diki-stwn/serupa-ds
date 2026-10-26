import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Button } from '../components/Button/Button';
import { InlineEdit } from '../components/InlineEdit/InlineEdit';
import { Menu, MenuItem } from '../components/Menu/Menu';
import { Popover } from '../components/Popover/Popover';
import { Tooltip } from '../components/Tooltip/Tooltip';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const shown = (e: Element | null) => !!e && !(e as HTMLElement).hidden && getComputedStyle(e).display !== 'none';
const outside = () => userEvent.click(document.body, { position: { x: 5, y: 5 } });

// Open at first without being controlled, then closed by the person as usual (AQ1).
describe('defaultOpen and defaultEditing', () => {
  test('Menu with defaultOpen starts open and still closes on its own', async () => {
    const changes: boolean[] = [];
    await render(<div style={{ padding: '120px' }}>
      <Menu defaultOpen onOpenChange={(o) => changes.push(o)} trigger={<Button id="mb">Actions</Button>}><MenuItem>Rename</MenuItem></Menu>
    </div>);
    const menu = () => document.getElementById(el('mb').getAttribute('aria-controls') || '');
    expect([el('mb').getAttribute('aria-expanded'), shown(menu())]).toEqual(['true', true]);
    await outside();
    expect([el('mb').getAttribute('aria-expanded'), changes]).toEqual(['false', [false]]);
  });

  test('Popover with defaultOpen', async () => {
    await render(<div style={{ padding: '120px' }}><Popover defaultOpen title="Share" trigger={<Button id="pb">Share</Button>}><p>Link</p></Popover></div>);
    const panel = () => el('pb').nextElementSibling as HTMLElement;
    expect([el('pb').getAttribute('aria-expanded'), panel().matches(':popover-open')]).toEqual(['true', true]);
    await outside();
    expect(el('pb').getAttribute('aria-expanded')).toBe('false');
  });

  test('Tooltip with defaultOpen', async () => {
    await render(<div style={{ padding: '120px' }}><Tooltip defaultOpen content="Saved 2 min ago"><Button id="tb">Status</Button></Tooltip></div>);
    const tip = () => document.querySelector('[role="tooltip"]');
    expect(shown(tip())).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(shown(tip())).toBe(false);
  });

  test('InlineEdit with defaultEditing starts with its field open and focused; Enter saves and closes it', async () => {
    await render(<InlineEdit id="ie" label="Name" defaultValue="Apollo" defaultEditing />);
    const field = el('ie').querySelector('input') as HTMLInputElement;
    expect([document.activeElement === field, field.value]).toEqual([true, 'Apollo']);
    await userEvent.keyboard('{End}x{Enter}');
    expect([el('ie').querySelector('input'), el('ie').textContent]).toEqual([null, expect.stringContaining('Apollox')]);
  });
});
