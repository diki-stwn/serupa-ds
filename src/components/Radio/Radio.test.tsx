import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { color, css, lowContrast, press, withMotion } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { Radio, RadioGroup } from './Radio';

const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const wrap = (id: string) => input(id).closest('.dk-radio') as HTMLElement;
const dot = (id: string) => wrap(id).querySelector('.dk-radio__dot') as HTMLElement;
// How far the circle's middle is from the middle of the label's first line, in px.
const mid = (id: string) => {
  const ir = input(id).getBoundingClientRect(), tr = wrap(id).querySelector('.dk-radio__label')!.getBoundingClientRect();
  return Math.abs(ir.top + ir.height / 2 - (tr.top + Math.min(tr.height, parseFloat(css(wrap(id)).lineHeight)) / 2));
};

let errors: MockInstance<typeof console.error>, warnings: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); warnings = vi.spyOn(console, 'warn'); });
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  expect(warnings).not.toHaveBeenCalled();
  errors.mockRestore(); warnings.mockRestore();
});

const Grid = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gap: '16px', width: '420px', justifyItems: 'start' }}>{children}</div>;
function Letters({ changes, gref, rref }: { changes: string[]; gref?: React.Ref<HTMLDivElement>; rref?: React.Ref<HTMLInputElement> }) {
  const [v, setV] = React.useState('b');
  return <RadioGroup id="ctl" ref={gref} aria-label="Letters" value={v} onValueChange={(val, e) => { changes.push(val + ':' + e.type); setV(val); }} className="extra" data-x="y">
    <Radio id="a" value="a" ref={rref} name="ignored" defaultChecked>Alpha</Radio>
    <Radio id="b" value="b" description="The second letter.">Bravo</Radio>
    <Radio id="c" value="c" size="lg">Charlie</Radio>
  </RadioGroup>;
}
const Numbers = () => <RadioGroup id="unc" aria-label="Sizes" size="sm" orientation="horizontal" defaultValue={2} name="num">
  <Radio id="n1" value={1}>One</Radio><Radio id="n2" value={2}>Two</Radio><Radio id="n3" value={3}>Three</Radio>
</RadioGroup>;
const Invalid = () => <RadioGroup id="none" aria-label="Nothing picked" invalid required>
  <Radio id="x1" value="x">X</Radio><Radio id="x2" value="y">Y</Radio>
</RadioGroup>;
const Solo = () => <div>
  <Radio id="s1" name="solo" value="1" defaultChecked>Solo one</Radio>
  {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
  <Radio id="s2" name="solo" value="2" size="xl">Solo two</Radio>
  <Radio id="bare" name="bare" aria-label="Bare" />
</div>;

describe('Radio', () => {
  test('RadioGroup: a <div role="radiogroup"> (data-component="radio-group"), vertical by default; ref and attributes go to it; every radio gets one generated name (the group\'s wins over a radio\'s own)', async () => {
    const gref = React.createRef<HTMLDivElement>();
    await render(<Grid><Letters changes={[]} gref={gref} /></Grid>);
    const g = document.getElementById('ctl')!, names = [...g.querySelectorAll('input')].map((i) => i.name);
    expect([g.getAttribute('role'), gref.current === g, g.dataset.x, g.dataset.component, g.dataset.orientation, css(g).flexDirection]).toEqual(['radiogroup', true, 'y', 'radio-group', 'vertical', 'column']);
    expect(g.className).toMatch(/dk-radio-group dk-radio-group--vertical extra/);
    expect(new Set(names).size).toBe(1);
    expect(names[0]).toBeTruthy();
    expect(names[0]).not.toBe('ignored');
  });

  test('form reset: the first choice is checked again and the group follows it (uncontrolled); a controlled group shows its value again', async () => {
    await render(<form id="rr">
      <RadioGroup aria-label="Plan" name="plan" defaultValue="free"><Radio id="rr-free" value="free">Free</Radio><Radio id="rr-pro" value="pro">Pro</Radio></RadioGroup>
      <RadioGroup aria-label="Ship" value="air" onValueChange={() => {}}><Radio id="rr-air" value="air">Air</Radio><Radio id="rr-sea" value="sea">Sea</Radio></RadioGroup>
    </form>);
    await userEvent.click(input('rr-pro'));
    expect(input('rr-pro').checked).toBe(true);
    (document.getElementById('rr') as HTMLFormElement).reset();
    await expect.poll(() => input('rr-free').checked).toBe(true);
    expect([input('rr-pro').checked, input('rr-air').checked, new FormData(document.getElementById('rr') as HTMLFormElement).get('plan')]).toEqual([false, true, 'free']);
    // The group's state followed: one more click on Pro checks it (it would do nothing if the group still held "pro").
    await userEvent.click(input('rr-pro'));
    expect(input('rr-pro').checked).toBe(true);
  });

  test('Radio: a native radio (no system look) in a <label class="dk-radio"> (data-component="radio"); md: a 16px circle, 1px field border, text-sm, centered on the label\'s first line; ref goes to the <input>', async () => {
    const rref = React.createRef<HTMLInputElement>();
    await render(<Grid><Letters changes={[]} rref={rref} /></Grid>);
    await document.fonts.ready;
    const s = css(input('a'));
    expect([input('a').tagName + ':' + input('a').type, wrap('a').tagName, wrap('a').dataset.component, s.appearance, s.width, s.borderTopWidth, css(wrap('a')).fontSize, rref.current === input('a')])
      .toEqual(['INPUT:radio', 'LABEL', 'radio', 'none', '16px', '1px', '14px', true]);
    expect(parseFloat(s.borderTopLeftRadius)).toBeGreaterThanOrEqual(8);
    expect(mid('a')).toBeLessThan(1);
    await expect.poll(() => css(input('a')).borderTopColor).toBe(color('var(--field-border)'));
  });

  test('controlled: the group\'s value checks its radio (a radio\'s defaultChecked is ignored); checked: a primary fill with a centered 6px dot in on-primary', async () => {
    await render(<Grid><Letters changes={[]} /></Grid>);
    const prim = color('var(--primary)');
    expect([input('a').checked, input('b').checked]).toEqual([false, true]);
    // The fill eases in over 100ms (motion-press).
    await expect.poll(() => [css(input('b')).backgroundColor, css(input('b')).borderTopColor]).toEqual([prim, prim]);
    expect([css(dot('b')).visibility, css(dot('a')).visibility, dot('b').getBoundingClientRect().width, css(dot('b')).backgroundColor]).toEqual(['visible', 'hidden', 6, color('var(--on-primary)')]);
    const dr = dot('b').getBoundingClientRect(), ir = input('b').getBoundingClientRect();
    expect(Math.abs(dr.left + dr.width / 2 - (ir.left + ir.width / 2)) + Math.abs(dr.top + dr.height / 2 - (ir.top + ir.height / 2))).toBeLessThan(0.5);
  });

  test('a click on a label calls onValueChange(value, event) and moves the check; arrow keys move the choice, natively', async () => {
    const changes: string[] = [];
    await render(<Grid><Letters changes={changes} /></Grid>);
    await userEvent.click(wrap('a').querySelector('.dk-radio__label')!);
    await expect.poll(() => input('a').checked).toBe(true);
    expect([input('b').checked, changes.join()]).toEqual([false, 'a:change']);
    input('a').focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => input('b').checked).toBe(true);
    expect([document.activeElement!.id, changes.join()]).toEqual(['b', 'a:change,b:change']);
  });

  test('keyboard table: Tab lands on the checked radio (or the first); every arrow moves the choice, wrapping and skipping disabled ones; Space checks the focused radio when none is (FH1)', async () => {
    const seen: string[] = [];
    await render(<Grid><button id="kb-before">Before</button><RadioGroup aria-label="Fruit" name="kb" onValueChange={(v) => seen.push(String(v))}>
      <Radio id="kb-a" value="a">A</Radio><Radio id="kb-b" value="b" disabled>B</Radio><Radio id="kb-c" value="c">C</Radio><Radio id="kb-d" value="d">D</Radio>
    </RadioGroup></Grid>);
    input('kb-before').focus();
    await userEvent.keyboard('{Tab}');
    expect([document.activeElement!.id, input('kb-a').checked]).toEqual(['kb-a', false]);   // none checked: the first, not checked yet
    await userEvent.keyboard(' ');
    await expect.poll(() => input('kb-a').checked).toBe(true);
    const at = async (key: string) => { await userEvent.keyboard(`{${key}}`); return document.activeElement!.id + (input(document.activeElement!.id).checked ? '*' : ''); };
    expect([await at('ArrowRight'), await at('ArrowDown'), await at('ArrowRight'), await at('ArrowUp'), await at('ArrowLeft'), await at('ArrowLeft')])
      .toEqual(['kb-c*', 'kb-d*', 'kb-a*', 'kb-d*', 'kb-c*', 'kb-a*']);   // B is skipped, and the ends wrap
    expect(seen.join()).toBe('a,c,d,a,d,c,a');
    input('kb-before').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement!.id).toBe('kb-a');   // back to the checked one
  });

  test('right to left: ArrowLeft is next and wraps from the last radio to the first, ArrowRight wraps back, in every engine', async () => {
    const seen: string[] = [];
    await render(<Grid><div dir="rtl"><RadioGroup aria-label="Fruit" name="rtl" defaultValue="c" onValueChange={(v) => seen.push(String(v))}>
      <Radio id="rtl-a" value="a">A</Radio><Radio id="rtl-b" value="b">B</Radio><Radio id="rtl-c" value="c">C</Radio>
    </RadioGroup></div></Grid>);
    input('rtl-c').focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => input('rtl-a').checked).toBe(true);
    expect(document.activeElement!.id).toBe('rtl-a');
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => input('rtl-c').checked).toBe(true);
    expect([document.activeElement!.id, seen.join()]).toEqual(['rtl-c', 'a,c']);
  });

  test('onChange, deprecated: still called with (value, event) after onValueChange, and warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: string[] = [];
    await render(<Grid><RadioGroup aria-label="Ship" onValueChange={(v, e) => calls.push('value:' + v + ':' + e.type)} onChange={(v, e) => calls.push('change:' + v + ':' + e.type)}>
      <Radio id="dc-air" value="air">Air</Radio><Radio id="dc-sea" value="sea">Sea</Radio>
    </RadioGroup></Grid>);
    await userEvent.click(input('dc-sea'));
    await userEvent.click(input('dc-air'));
    expect(calls).toEqual(['value:sea:change', 'change:sea:change', 'value:air:change', 'change:air:change']);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('RadioGroup: onChange is deprecated')).length).toBe(1);
    warn.mockRestore();
  });

  test('a radio\'s own size wins over the group\'s: lg is a 20px circle with text-base, centered', async () => {
    await render(<Grid><Letters changes={[]} /></Grid>);
    await document.fonts.ready;
    expect([css(input('c')).width, css(wrap('c')).fontSize, wrap('c').dataset.size]).toEqual(['20px', '16px', 'lg']);
    expect(mid('c')).toBeLessThan(1);
  });

  test('uncontrolled: defaultValue (numbers too) and clicks; the group\'s name and size (sm: a 14px circle, text-xs); horizontal: a row with 16px gaps', async () => {
    await render(<Grid><Numbers /></Grid>);
    await document.fonts.ready;
    const g = document.getElementById('unc')!, tops = [...g.querySelectorAll('.dk-radio')].map((x) => x.getBoundingClientRect().top);
    expect([input('n2').checked, input('n1').checked, input('n1').name, css(input('n1')).width, css(wrap('n1')).fontSize]).toEqual([true, false, 'num', '14px', '12px']);
    expect(mid('n1')).toBeLessThan(1);
    expect([css(g).flexDirection, css(g).columnGap, tops.every((y) => Math.abs(y - tops[0]) < 1)]).toEqual(['row', '16px', true]);
    await userEvent.click(input('n3'), { force: true });
    await expect.poll(() => input('n3').checked).toBe(true);
    expect(input('n2').checked).toBe(false);
  });

  test('description: a muted line in aria-describedby, kept out of the name; the label names the radio, or aria-label without one', async () => {
    await render(<Grid><Letters changes={[]} /><Solo /></Grid>);
    const d = wrap('b').querySelector('.dk-radio__description')!;
    expect(input('b').getAttribute('aria-describedby')).toBe(d.id);
    expect(css(d).color).toBe(color('var(--text-muted)'));
    await expect.element(page.getByRole('radio', { name: 'Bravo', exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole('radio', { name: 'Bare', exact: true })).toBeInTheDocument();
    expect(wrap('bare').className).toMatch(/dk-radio--bare/);
  });

  test('invalid and required on the group: aria-invalid and aria-required on it, required on each radio, a danger border on each', async () => {
    await render(<Grid><Invalid /></Grid>);
    const g = document.getElementById('none')!;
    expect([g.getAttribute('aria-invalid'), g.getAttribute('aria-required'), input('x1').required]).toEqual(['true', 'true', true]);
    expect(g.className).toMatch(/dk-radio-group--invalid/);
    expect(wrap('x1').className).toMatch(/dk-radio--invalid/);
    await expect.poll(() => css(input('x1')).borderTopColor).toBe(color('var(--danger)'));
  });

  test('disabled group: every radio disabled, 50%, not-allowed; the unchecked one on surface-muted; clicks do nothing', async () => {
    await render(<Grid><RadioGroup id="dis" aria-label="Disabled" disabled defaultValue="p"><Radio id="p" value="p">P</Radio><Radio id="q" value="q">Q</Radio></RadioGroup></Grid>);
    expect([input('p').matches(':disabled'), input('q').matches(':disabled'), css(wrap('q')).opacity, css(wrap('q')).cursor]).toEqual([true, true, '0.5', 'not-allowed']);
    await expect.poll(() => css(input('q')).backgroundColor).toBe(color('var(--surface-muted)'));
    await userEvent.click(input('q'), { force: true });
    expect([input('p').checked, input('q').checked, document.getElementById('dis')!.getAttribute('aria-disabled')]).toEqual([true, false, 'true']);
  });

  test('on its own: name and defaultChecked as usual; an unknown size falls back to md; keyboard focus: a 2px focus-ring outline 2px out, like Button, with a transparent gap', async () => {
    await render(<Grid><button id="before">Before</button><Solo /></Grid>);
    expect([input('s1').checked, input('s1').name, wrap('s2').dataset.size]).toEqual([true, 'solo', 'md']);
    await userEvent.click(input('s2'));
    await expect.poll(() => input('s2').checked).toBe(true);
    expect(input('s1').checked).toBe(false);
    await userEvent.unhover(input('s2'));
    input('s1').focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Tab}');
    expect(document.activeElement!.id).toBe('s2');
    const ring = color('var(--focus-ring)');
    await expect.poll(() => css(input('s2')).outlineColor).toBe(ring);
    const s = css(input('s2'));
    expect(`${s.outlineStyle} ${s.outlineWidth} ${s.outlineOffset} ${s.boxShadow}`).toBe('solid 2px 2px none');
  });

  test('hover: field-border-hover; invalid keeps the danger border', async () => {
    await render(<Grid><Numbers /><Invalid /></Grid>);
    await userEvent.hover(input('x2'));
    await expect.poll(() => css(input('x2')).borderTopColor).toBe(color('var(--danger)'));
    await userEvent.hover(input('n1'));
    await expect.poll(() => css(input('n1')).borderTopColor).toBe(color('var(--field-border-hover)'));
  });

  test('in a Field group: a fieldset and legend described by the hint and error; the error makes the RadioGroup invalid; a disabled Field group disables its radios', async () => {
    await render(<Grid>
      <Field group label="Plan" hint="You can change it later." error="Pick a plan.">
        <RadioGroup id="fg"><Radio id="f1" value="free">Free</Radio><Radio id="f2" value="pro">Pro</Radio></RadioGroup>
      </Field>
      <Field group label="Off" disabled><RadioGroup><Radio id="o1" value="o">O</Radio></RadioGroup></Field>
    </Grid>);
    const g = document.getElementById('fg')!, fs = g.closest('fieldset')!;
    expect(fs.querySelector('legend')!.textContent).toBe('Plan');
    expect(fs.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent).join('|')).toBe('You can change it later.|Pick a plan.');
    expect(g.getAttribute('aria-invalid')).toBe('true');
    expect(wrap('f1').className).toMatch(/dk-radio--invalid/);
    expect([input('o1').matches(':disabled'), css(wrap('o1')).opacity]).toEqual([true, '0.5']);
  });

  test('contrast in all six themes: label and description 4.5:1; border, checked fill, dot, focus ring and invalid border 3:1', () => {
    expect(lowContrast([
      ['label', 'var(--text)', 'var(--surface)', 4.5],
      ['description', 'var(--text-muted)', 'var(--surface)', 4.5],
      ['border', 'var(--field-border)', 'var(--field)', 3],
      ['border on page', 'var(--field-border)', 'var(--surface)', 3],
      ['checked fill', 'var(--primary)', 'var(--surface)', 3],
      ['dot on fill', 'var(--on-primary)', 'var(--primary)', 3],
      ['dot on hover fill', 'var(--on-primary)', 'var(--primary-hover)', 3],
      ['focus', 'var(--focus-ring)', 'var(--surface)', 3],
      ['invalid', 'var(--danger)', 'var(--surface)', 3],
    ])).toEqual([]);
  });

  test('pressed: the circle shrinks to 90% while the row is held, on scale alone, and springs back; not when disabled (ED1)', async () => {
    await withMotion(async () => {
      await render(<RadioGroup aria-label="Press"><Radio id="pr" value="a">Press me</Radio><Radio id="pq" value="b" disabled>Off</Radio></RadioGroup>);
      const dot = (id: string) => (document.getElementById(id) as HTMLElement).parentElement as HTMLElement;   // the control around the input
      expect(css(dot('pr')).transitionProperty).toBe('scale');
      await press(dot('pr').closest('label')!, () => expect.poll(() => css(dot('pr')).scale).toBe('0.9'));
      await expect.poll(() => css(dot('pr')).scale).toBe('none');
      await press(dot('pq').closest('label')!, () => expect(css(dot('pq')).scale).toBe('none'));
    });
  });
});
