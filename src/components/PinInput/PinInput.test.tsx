import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { PinInput } from './PinInput';

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const root = (id: string) => el(id).closest('.dk-pin-input') as HTMLElement;
const boxes = (id: string) => [...root(id).querySelectorAll<HTMLElement>('.dk-pin-input__box')];
// A shared color, as the browser computes it.
const resolve = (name: string) => { const s = document.createElement('span'); s.style.color = `var(${name})`; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; };
const shown = (id: string) => boxes(id).map((b) => b.textContent || '_').join('');

describe('PinInput', () => {
  test('one native text field over six aria-hidden boxes; ref and props go to the <input>, className and style to the wrapper', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<PinInput id="p" ref={ref} aria-label="Code" name="code" className="extra" style={{ margin: '3px' }} data-x="y" />);
    const i = el('p'), r = root('p');
    expect([page.getByRole('textbox', { name: 'Code' }).element() === i, ref.current === i, i.type, i.name, i.dataset.x, i.inputMode, i.autocomplete, i.pattern, r.className, r.style.margin, r.dataset.component, boxes('p').length, r.querySelector('.dk-pin-input__boxes')!.getAttribute('aria-hidden')])
      .toEqual([true, true, 'text', 'code', 'y', 'numeric', 'one-time-code', '[0-9]{6}', 'dk-pin-input dk-pin-input--size-md extra', '3px', 'pin-input', 6, 'true']);
  });

  test('typing fills the boxes one by one and drops what isn\'t a digit; Backspace empties the last; onValueChange, then onComplete when full', async () => {
    const changes: string[] = [], done = vi.fn();
    await render(<PinInput id="p" aria-label="Code" length={4} onValueChange={(v) => changes.push(v)} onComplete={done} />);
    await userEvent.click(el('p'));
    await userEvent.keyboard('1a2');
    expect([shown('p'), el('p').value]).toEqual(['12__', '12']);
    await userEvent.keyboard('{Backspace}');
    expect(shown('p')).toBe('1___');
    await userEvent.keyboard('987');
    expect([shown('p'), changes.join(), done.mock.calls]).toEqual(['1987', '1,12,1,19,198,1987', [['1987']]]);
    await userEvent.keyboard('5');
    expect(el('p').value).toBe('1987');
  });

  test('a paste or a phone\'s autofill (the whole text at once) fills every box, dropping spaces and dashes and what doesn\'t fit', async () => {
    const done = vi.fn();
    await render(<PinInput id="p" aria-label="Code" onComplete={done} />);
    await userEvent.fill(el('p'), '123-456 789');
    expect([shown('p'), done.mock.calls]).toEqual(['123456', [['123456']]]);
  });

  test('the caret stays at the end, and the box it\'s in gets the focus ring (the last one once full)', async () => {
    await render(<PinInput id="p" aria-label="Code" length={3} defaultValue="4" />);
    expect(root('p').querySelector('.dk-pin-input__box--active')).toBeNull();
    await userEvent.click(el('p'), { position: { x: 4, y: 4 } });
    expect([el('p').selectionStart, boxes('p').findIndex((b) => b.classList.contains('dk-pin-input__box--active'))]).toEqual([1, 1]);
    const b = css(boxes('p')[1]);
    expect(b.boxShadow).not.toBe('none');
    await userEvent.keyboard('{Home}');
    await expect.poll(() => el('p').selectionStart).toBe(1);
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => el('p').selectionStart).toBe(1);
    await userEvent.keyboard('56');
    expect(boxes('p').findIndex((x) => x.classList.contains('dk-pin-input__box--active'))).toBe(2);
  });

  test('controlled: the value shows and the boxes follow it; alphanumeric keeps letters', async () => {
    function C() { const [v, setV] = React.useState('ab'); return <PinInput id="p" aria-label="Code" type="alphanumeric" length={4} value={v} onValueChange={setV} />; }
    await render(<C />);
    expect([shown('p'), el('p').inputMode, el('p').pattern]).toEqual(['ab__', 'text', '[0-9A-Za-z]{4}']);
    await userEvent.click(el('p'));
    await userEvent.keyboard('-Z9');
    expect(shown('p')).toBe('abZ9');
  });

  test('mask: a password field with a dot in each filled box', async () => {
    await render(<PinInput id="p" aria-label="PIN" length={4} mask defaultValue="27" />);
    expect([el('p').type, shown('p'), el('p').value]).toEqual(['password', '••__', '27']);
  });

  test('in a Field: labelled and described by it; its error makes every box danger-bordered and sets aria-invalid', async () => {
    await render(<Field label="Verification code" hint="Sent to your phone." error="That code has expired."><PinInput defaultValue="1" /></Field>);
    const i = page.getByRole('textbox', { name: 'Verification code' }).element() as HTMLInputElement;
    expect([i.getAttribute('aria-invalid'), !!i.getAttribute('aria-describedby')]).toEqual(['true', true]);
    const box = i.closest('.dk-pin-input')!.querySelector<HTMLElement>('.dk-pin-input__box')!;
    expect(css(box).borderTopColor).toBe(resolve('--danger'));
  });

  test('a form submits the code by name, and a reset puts the default back', async () => {
    await render(<form id="f"><PinInput id="p" aria-label="Code" name="code" defaultValue="12" /></form>);
    await userEvent.click(el('p'));
    await userEvent.keyboard('34');
    expect(new FormData(document.getElementById('f') as HTMLFormElement).get('code')).toBe('1234');
    (document.getElementById('f') as HTMLFormElement).reset();
    await expect.poll(() => shown('p')).toBe('12____');
  });

  test('sizes: square boxes at 24, 32 and 44px, 8px apart; disabled is faded and can\'t be typed in', async () => {
    await render(<div>
      <PinInput id="s" aria-label="S" size="sm" length={2} /><PinInput id="m" aria-label="M" length={2} /><PinInput id="l" aria-label="L" size="lg" length={2} />
      <PinInput id="d" aria-label="D" disabled length={2} />
    </div>);
    const dim = (id: string) => { const r = boxes(id)[0].getBoundingClientRect(), r2 = boxes(id)[1].getBoundingClientRect(); return [r.width, r.height, r2.left - r.right]; };
    expect([dim('s'), dim('m'), dim('l')]).toEqual([[24, 24, 8], [32, 32, 8], [44, 44, 8]]);
    expect([el('d').disabled, css(root('d')).opacity]).toEqual([true, '0.5']);
  });

  test('right to left: the code still reads left to right', async () => {
    await render(<div dir="rtl"><PinInput id="p" aria-label="Code" length={3} defaultValue="12" /></div>);
    const b = boxes('p');
    expect(b[0].getBoundingClientRect().left).toBeLessThan(b[1].getBoundingClientRect().left);
  });

  test('contrast in all six themes: characters 4.5:1 on the box; border, focus ring and danger border 3:1 on the surface', async () => {
    await render(<div style={{ background: 'var(--surface)' }} id="bg"><PinInput id="p" aria-label="Code" defaultValue="1" /><PinInput id="v" aria-label="Bad" invalid /></div>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const b = css(boxes('p')[0]), surface = css(root('p').parentElement).backgroundColor;
      expect(contrast(b.color, b.backgroundColor), th + ' text').toBeGreaterThanOrEqual(4.5);
      expect(contrast(b.borderTopColor, surface), th + ' border').toBeGreaterThanOrEqual(3);
      expect(contrast(css(boxes('v')[0]).borderTopColor, surface), th + ' invalid').toBeGreaterThanOrEqual(3);
      expect(contrast(resolve('--focus-ring'), surface), th + ' ring').toBeGreaterThanOrEqual(3);
    }
  });
});
