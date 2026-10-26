import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { color, css, lowContrast } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { Select } from './Select';

const field = (id: string) => document.getElementById(id) as HTMLSelectElement;
const box = (id: string) => field(id).parentElement as HTMLElement;

let errors: MockInstance<typeof console.error>, warnings: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); warnings = vi.spyOn(console, 'warn'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); warnings.mockRestore(); });

const Grid = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gap: '8px', width: '320px' }}>{children}</div>;
function Role({ changes, sref }: { changes: string[]; sref?: React.Ref<HTMLSelectElement> }) {
  const [v, setV] = React.useState('b');
  return <>
    <label htmlFor="md">Role</label>
    <Select id="md" ref={sref} value={v} onChange={(e) => { changes.push(e.target.value); setV(e.target.value); }}
      options={['a', { value: 'b', label: 'Bee' }, { value: 'c', label: 'Sea', disabled: true }]} className="extra" data-x="y" />
  </>;
}

describe('Select', () => {
  test('a native <select> (no system arrow) in a .dk-select box (data-component="select"); md 32px text-sm, 12px start padding and room for the chevron at the end, 1px border, 6px corners', async () => {
    await render(<Grid><Role changes={[]} /></Grid>);
    const b = css(box('md')), f = css(field('md'));
    expect([field('md').tagName, box('md').dataset.component, f.appearance]).toEqual(['SELECT', 'select', 'none']);
    expect(box('md').className).toMatch(/dk-select dk-select--size-md/);
    expect([b.height, f.fontSize, f.paddingLeft, f.paddingRight, b.borderTopWidth, b.borderRadius]).toEqual(['32px', '14px', '12px', '36px', '1px', '6px']);
  });

  test('keyboard table: Tab reaches the select; ArrowDown and ArrowUp pick the next and previous option, skipping a disabled one; Space goes to the browser, which opens its list (FH1)', async () => {
    const changes: string[] = [];
    await render(<Grid><button id="kb-before">before</button><Select id="kb-s" aria-label="Pick" defaultValue="a" onChange={(e) => changes.push(e.target.value)} options={['a', { value: 'b', label: 'Bee', disabled: true }, 'c']} /></Grid>);
    document.getElementById('kb-before')!.focus();
    await userEvent.tab();
    const at = document.activeElement?.id;
    await userEvent.keyboard('{ArrowDown}{ArrowUp}');
    let cancelled: boolean | null = null;
    const watch = (e: KeyboardEvent) => { if (e.key === ' ') cancelled = e.defaultPrevented; };
    window.addEventListener('keydown', watch);
    await userEvent.keyboard(' ');
    window.removeEventListener('keydown', watch);
    await userEvent.keyboard('{Escape}');
    expect([at, changes, cancelled]).toEqual(['kb-s', ['c', 'a'], false]);
  });

  test('sizes: sm 24px text-xs, lg 44px text-base; an unknown size falls back to md; multiple is ignored with a warning', async () => {
    await render(<Grid>
      <Select id="sm" size="sm" options={['x']} aria-label="Small" />
      <Select id="lg" size="lg" options={['x']} aria-label="Large" />
      {/* @ts-expect-error: an unknown size and multiple, as plain JavaScript could pass */}
      <Select id="bad" size="xl" multiple options={['x']} aria-label="Bad" />
    </Grid>);
    const m = (id: string) => [css(box(id)).height, css(field(id)).fontSize, css(field(id)).paddingLeft];
    expect(m('sm')).toEqual(['24px', '12px', '8px']);
    expect(m('lg')).toEqual(['44px', '16px', '16px']);
    expect([box('bad').dataset.size, field('bad').multiple]).toEqual(['md', false]);
    expect(warnings.mock.calls.some((c: unknown[]) => /multiple/.test(String(c[0])))).toBe(true);
  });

  test('ref and attributes go to the <select>, className to the box; options from strings and { value, label, disabled }; picking an option updates a controlled value through onChange', async () => {
    const ref = React.createRef<HTMLSelectElement>(), changes: string[] = [];
    await render(<Grid><Role changes={changes} sref={ref} /></Grid>);
    const i = field('md');
    expect([ref.current === i, box('md').classList.contains('extra'), i.dataset.x, i.labels[0].textContent]).toEqual([true, true, 'y', 'Role']);
    expect([...i.options].map((o) => o.value + ':' + o.textContent + (o.disabled ? ':off' : '')).join()).toBe('a:a,b:Bee,c:Sea:off');
    await userEvent.selectOptions(i, 'a');
    await expect.poll(() => field('md').value).toBe('a');
    expect(changes.join()).toBe('a');
  });

  test('placeholder: a first empty option that can\'t be picked; an uncontrolled select starts on it in the placeholder color, then the text color once something is picked', async () => {
    await render(<Grid><Select id="ph" placeholder="Choose one" options={['One', 'Two']} aria-label="Placeholder" /></Grid>);
    const o = field('ph').options[0];
    expect([o.value, o.textContent, o.disabled, field('ph').value]).toEqual(['', 'Choose one', true, '']);
    expect(box('ph').className).toMatch(/dk-select--empty/);
    expect(css(field('ph')).color).toBe(color('var(--placeholder)'));
    await userEvent.selectOptions(field('ph'), 'Two');
    await expect.poll(() => box('ph').className).not.toMatch(/dk-select--empty/);
    expect([field('ph').value, css(field('ph')).color]).toEqual(['Two', color('var(--text)')]);
  });

  test('form reset: an uncontrolled select goes back to its placeholder (or its defaultValue) and looks it, and the form sends the default', async () => {
    await render(<form id="f">
      <Select id="ph" name="ph" aria-label="Size" placeholder="Choose a size" options={['S', 'M']} />
      <Select id="dv" name="dv" aria-label="Fruit" defaultValue="b" options={[{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]} />
    </form>);
    await userEvent.selectOptions(field('ph'), 'M');
    await userEvent.selectOptions(field('dv'), 'a');
    expect([box('ph').classList.contains('dk-select--empty'), field('dv').value]).toEqual([false, 'a']);
    (document.getElementById('f') as HTMLFormElement).reset();
    await expect.poll(() => box('ph').classList.contains('dk-select--empty')).toBe(true);
    const data = new FormData(document.getElementById('f') as HTMLFormElement);
    expect([field('ph').value, field('dv').value, data.get('ph'), data.get('dv')]).toEqual(['', 'b', null, 'b']);
    await userEvent.selectOptions(field('ph'), 'S');
    expect(box('ph').classList.contains('dk-select--empty')).toBe(false);
  });

  test('groups, plain options and <option> children together; the left icon and chevron are decorative and don\'t take clicks; the text starts after the icon', async () => {
    await render(<Grid><Select id="grp" leftIcon="schedule" aria-label="Groups" options={[{ label: 'Europe', options: ['London', 'Paris'] }, 'Tokyo']}><option value="kid">Child</option></Select></Grid>);
    const i = field('grp');
    expect([...i.querySelectorAll('optgroup')].map((g) => g.label + '=' + [...g.children].map((o) => (o as HTMLOptionElement).value).join('/')).join()).toBe('Europe=London/Paris');
    expect([...i.options].map((o) => o.value).join()).toBe('London,Paris,Tokyo,kid');
    expect([...box('grp').querySelectorAll<HTMLElement>('.dk-select__icon')].map((x) => x.getAttribute('aria-hidden') + ':' + css(x).pointerEvents + ':' + (x.querySelector<HTMLElement>('[data-icon]'))?.dataset.icon).join())
      .toBe('true:none:schedule,true:none:expand_more');
    expect(css(i).paddingLeft).toBe('36px');
  });

  test('a click on the chevron lands on the <select>, so it opens', async () => {
    await render(<Grid><Select id="lg" size="lg" options={['x']} aria-label="Large" /></Grid>);
    const r = field('lg').getBoundingClientRect(), c = box('lg').querySelector('.dk-select__icon--chevron')!.getBoundingClientRect();
    expect(document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2)).toBe(field('lg'));
    expect(c.right <= r.right && c.left >= r.left).toBe(true);
  });

  test('focus: the border and a 1px ring take the focus color; a transparent outline for forced-colors mode', async () => {
    await render(<Grid><Role changes={[]} /></Grid>);
    field('md').focus();
    const ring = color('var(--focus-ring)');
    // The border and ring ease in over 150ms.
    await expect.poll(() => css(box('md')).borderTopColor).toBe(ring);
    await expect.poll(() => css(box('md')).boxShadow).toContain(ring);
    const s = css(box('md'));
    expect(s.boxShadow).toMatch(/0px 0px 0px 1px/);
    expect([s.outlineWidth, s.outlineColor]).toEqual(['2px', 'rgba(0, 0, 0, 0)']);
  });

  test('hover: field-border-hover', async () => {
    await render(<Grid><Select id="sm" size="sm" options={['x']} aria-label="Small" /><Select id="lg" size="lg" options={['x']} aria-label="Large" /></Grid>);
    await userEvent.hover(field('sm'));
    await expect.poll(() => css(box('sm')).borderTopColor).not.toBe(css(box('lg')).borderTopColor);
  });

  test('invalid: aria-invalid and a danger border; disabled: native disabled, 50%, not-allowed', async () => {
    await render(<Grid><Select id="inv" invalid options={['x']} aria-label="Invalid" /><Select id="dis" disabled options={['x']} aria-label="Disabled" /></Grid>);
    expect(field('inv').getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => css(box('inv')).borderTopColor).toBe(color('var(--danger)'));
    expect([field('dis').disabled, css(box('dis')).opacity, css(field('dis')).cursor]).toEqual([true, '0.5', 'not-allowed']);
    expect(box('dis').className).toMatch(/disabled/);
  });

  test('in a Field: labelled, described and invalid with the error', async () => {
    await render(<Grid><Field label="Country" error="Pick a country."><Select id="fld" placeholder="Choose" options={['DK']} /></Field></Grid>);
    const i = field('fld');
    expect([i.labels[0].textContent, i.getAttribute('aria-invalid'), !!i.getAttribute('aria-describedby')]).toEqual(['Country', 'true', true]);
    expect(box('fld').className).toMatch(/dk-select--invalid/);
  });

  test('contrast in all six themes: text and placeholder 4.5:1 on the field; chevron, border, focus ring and invalid border 3:1', () => {
    expect(lowContrast([
      ['text', 'var(--text)', 'var(--field)', 4.5],
      ['placeholder', 'var(--placeholder)', 'var(--field)', 4.5],
      ['chevron', 'var(--text-muted)', 'var(--field)', 3],
      ['border', 'var(--field-border)', 'var(--field)', 3],
      ['border on page', 'var(--field-border)', 'var(--surface)', 3],
      ['focus', 'var(--focus-ring)', 'var(--surface)', 3],
      ['invalid', 'var(--danger)', 'var(--field)', 3],
    ])).toEqual([]);
  });
});
