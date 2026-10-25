import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { ToggleGroup } from './ToggleGroup';
import { ToggleButton } from '../ToggleButton/ToggleButton';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const pressed = () => [...document.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].map((b) => b.getAttribute('aria-pressed') === 'true' ? b.value : '').filter(Boolean).join();
const btn = (name: string) => page.getByRole('button', { name });

function Align(props: Partial<React.ComponentProps<typeof ToggleGroup>>) {
  return (
    <ToggleGroup id="g" aria-label="Text alignment" {...props}>
      <ToggleButton value="left" aria-label="Left" icon="format_align_left" />
      <ToggleButton value="center" aria-label="Center" icon="format_align_center" />
      <ToggleButton value="right" aria-label="Right" icon="format_align_right" />
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  test('a role="group" laid out like an attached ButtonGroup; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Align ref={ref} className="extra" data-x="y" />);
    const e = el('g');
    expect([e.getAttribute('role'), e.getAttribute('aria-label'), ref.current === e, e.dataset.x, e.dataset.component, e.dataset.type, e.dataset.orientation]).toEqual(['group', 'Text alignment', true, 'y', 'toggle-group', 'single', 'horizontal']);
    expect(e.className).toBe('dk-button-group dk-toggle-group dk-button-group--attached extra');
    const [a, b] = [...e.querySelectorAll('button')].map((x) => x.getBoundingClientRect());
    expect(Math.round(b.left - a.right)).toBe(-1);   // attached: the borders overlap into one line
  });

  test('single: pressing one turns the others off, pressing it again turns it off; onValueChange hears each', async () => {
    const onValueChange = vi.fn();
    await render(<Align defaultValue={['left']} onValueChange={onValueChange} />);
    expect(pressed()).toBe('left');
    await btn('Center').click();
    expect([pressed(), onValueChange.mock.calls.at(-1)![0]]).toEqual(['center', ['center']]);
    await btn('Center').click();
    expect([pressed(), onValueChange.mock.calls.at(-1)![0]]).toEqual(['', []]);
  });

  test('single and required: the one that\'s on stays on', async () => {
    const onValueChange = vi.fn();
    await render(<Align defaultValue={['left']} required onValueChange={onValueChange} />);
    await btn('Left').click();
    expect([pressed(), onValueChange.mock.calls.length]).toEqual(['left', 0]);
    await btn('Right').click();
    expect(pressed()).toBe('right');
  });

  test('multiple: each turns on and off by itself, and the group reports them together', async () => {
    const onValueChange = vi.fn();
    await render(<Align type="multiple" defaultValue={['left']} onValueChange={onValueChange} />);
    expect(el('g').dataset.type).toBe('multiple');
    await btn('Right').click();
    expect([pressed(), onValueChange.mock.calls.at(-1)![0]]).toEqual(['left,right', ['left', 'right']]);
    await btn('Left').click();
    expect(pressed()).toBe('right');
  });

  test('controlled: the buttons follow value, and change only when the parent passes a new one', async () => {
    function Controlled() {
      const [v, setV] = React.useState<string[]>(['center']);
      return <><Align value={v} onValueChange={setV} /><output id="out">{v.join()}</output></>;
    }
    await render(<Controlled />);
    await btn('Right').click();
    expect([pressed(), el('out').textContent]).toEqual(['right', 'right']);
  });

  test('controlled without a handler: pressing changes nothing', async () => {
    await render(<Align value={['center']} />);
    await btn('Left').click();
    expect(pressed()).toBe('center');
  });

  test('size, variant and disabled reach buttons that don\'t set their own; a button\'s own onPressedChange still runs', async () => {
    const own = vi.fn();
    await render(
      <ToggleGroup id="g" aria-label="View" size="sm" variant="ghost" type="multiple">
        <ToggleButton value="day" onPressedChange={own}>Day</ToggleButton>
        <ToggleButton value="week" size="lg" variant="outline">Week</ToggleButton>
        <span id="note">plain</span>
      </ToggleGroup>,
    );
    const [day, week] = [...el('g').querySelectorAll('button')];
    expect([day.dataset.size, day.dataset.variant, week.dataset.size, week.dataset.variant, el('note').textContent]).toEqual(['sm', 'ghost', 'lg', 'outline', 'plain']);
    await userEvent.click(day);
    expect([own.mock.calls.at(-1)![0], pressed()]).toEqual([true, 'day']);
    await render(<Align id="g2" disabled />);
    expect([...el('g2').querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
  });

  test('vertical and not attached: a column, and buttons apart', async () => {
    await render(<Align orientation="vertical" attached={false} />);
    const e = el('g');
    expect([e.dataset.orientation, e.className]).toEqual(['vertical', 'dk-button-group dk-toggle-group dk-button-group--vertical']);
    const [a, b] = [...e.querySelectorAll('button')].map((x) => x.getBoundingClientRect());
    expect(b.top - a.bottom).toBeGreaterThan(0);
  });
});
