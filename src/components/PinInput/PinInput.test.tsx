import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, server, userEvent } from 'vitest/browser';
import { THEMES, contrast, css, withMotion } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { PinInput } from './PinInput';
const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const root = (id: string) => el(id).closest('[data-component="pin-input"]') as HTMLElement;
const boxes = (id: string) => [...root(id).querySelectorAll<HTMLElement>(':scope > span[aria-hidden] > span')];
// A shared color, as the browser computes it.
const resolve = (name: string) => { const s = document.createElement('span'); s.style.color = `var(${name})`; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; };
const shown = (id: string) => boxes(id).map((b) => b.textContent || '_').join('');

describe('PinInput', () => {
  // EI1: forced colors repainted the hidden field's selected code ("381") in HighlightText over the first box.
  test('forced colors: the hidden field stays transparent with its code selected, so the boxes show only their own digits', async () => {
    if (server.browser !== 'chromium') return;
    const session = cdp() as unknown as { send: (m: string, p: object) => Promise<unknown> };
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
    try {
      await render(<PinInput aria-label="Code" length={4} defaultValue="381" />);
      const f = document.querySelector<HTMLInputElement>('input[aria-label="Code"]')!;
      f.focus(); f.select();
      const sel = getComputedStyle(f, '::selection');
      expect([getComputedStyle(f).color, sel.color, sel.backgroundColor]).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);
    } finally { await session.send('Emulation.setEmulatedMedia', { features: [] }); }
  });

  test('one native text field over six aria-hidden boxes; ref and props go to the <input>, className and style to the wrapper', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<PinInput id="p" ref={ref} aria-label="Code" name="code" className="extra" style={{ margin: '3px' }} data-x="y" />);
    const i = el('p'), r = root('p');
    expect([page.getByRole('textbox', { name: 'Code' }).element() === i, ref.current === i, i.type, i.name, i.dataset.x, i.inputMode, i.getAttribute('autocomplete'), i.pattern, r.className, r.style.margin, r.dataset.component, boxes('p').length, r.querySelector('.dk-pin-input__boxes')!.getAttribute('aria-hidden')])
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

  test('digits from an Arabic, Persian or Bengali keyboard or a Japanese IME (full width) are kept, as the code they are: ٤٥٦ is 456 (GR42)', async () => {
    const done = vi.fn();
    await render(<div><PinInput id="ar" aria-label="Code" length={4} onComplete={done} /><PinInput id="an" aria-label="Code" type="alphanumeric" length={4} /></div>);
    await userEvent.fill(el('ar'), '١٢۳٤');
    expect([shown('ar'), el('ar').value, done.mock.calls]).toEqual(['1234', '1234', [['1234']]]);
    await userEvent.fill(el('ar'), '５৬７8');
    expect(shown('ar')).toBe('5678');
    await userEvent.fill(el('an'), 'ＡＢ１২');
    expect(shown('an')).toBe('AB12');
  });

  test('select all and type, or paste, replaces the whole code', async () => {
    await render(<PinInput id="p" aria-label="Code" length={4} defaultValue="12" />);
    await userEvent.fill(el('p'), '9876');
    expect(shown('p')).toBe('9876');
    el('p').select();
    await userEvent.keyboard('5');
    expect(shown('p')).toBe('5___');
  });

  test('L8E105: a whole code pasted after a part typed replaces it, instead of being added after it and cut off', async () => {
    const done = vi.fn();
    await render(<div><input id="l8e105src" defaultValue="483 921" /><PinInput id="p" aria-label="Code" onComplete={done} /></div>);
    el('l8e105src').select();
    await userEvent.copy();
    await userEvent.click(el('p'));
    await userEvent.keyboard('12');
    await userEvent.paste();
    expect([shown('p'), done.mock.calls]).toEqual(['483921', [['483921']]]);
  });

  test('a part of a code pasted is added to what is typed', async () => {
    await render(<div><input id="l8e105src" defaultValue="34" /><PinInput id="p" aria-label="Code" length={4} /></div>);
    el('l8e105src').select();
    await userEvent.copy();
    await userEvent.click(el('p'));
    await userEvent.keyboard('12');
    await userEvent.paste();
    expect(shown('p')).toBe('1234');
  });

  test('focused from code (the caret at the start), typing still adds to the end', async () => {
    await render(<PinInput id="p" aria-label="Code" length={4} defaultValue="12" />);
    el('p').focus();
    el('p').setSelectionRange(0, 0);
    await userEvent.keyboard('3');
    expect(shown('p')).toBe('123_');
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
    const box = i.closest('[data-component="pin-input"]')!.querySelector<HTMLElement>(':scope > span[aria-hidden] > span')!;
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

  test('in a narrow column the boxes shrink together and stay square, down to 24px, so six lg or eight md boxes fit 288px (a 320px screen with 16px gutters) (GJ3)', async () => {
    await render(<div style={{ width: '288px' }}><PinInput id="n6" aria-label="Code" size="lg" /><PinInput id="n8" aria-label="Code" length={8} /><PinInput id="w4" aria-label="Code" length={4} /><div style={{ width: '100px' }}><PinInput id="t8" aria-label="Code" length={8} /></div></div>);
    const sizes = (id: string) => boxes(id).map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    const right = (id: string) => Math.round(Math.max(...boxes(id).map((b) => b.getBoundingClientRect().right)) - root(id).parentElement!.getBoundingClientRect().left);
    for (const id of ['n6', 'n8']) expect([right(id) <= 288, sizes(id).every(([w, h]) => w === h && w >= 24 && w === sizes(id)[0][0])]).toEqual([true, true]);
    // Room to spare: full size. Less room than 24px boxes need: they stay 24px or more and wrap inside the column (RF1).
    expect([sizes('w4')[0], sizes('t8').every(([w, h]) => w === h && w >= 24), right('t8') <= 100]).toEqual([[32, 32], true, true]);
  });

  test('a code too long for one row even at 24px wraps onto a second row, so at 320px the page doesn\'t scroll sideways (RF1, WCAG 1.4.10)', async () => {
    await page.viewport(320, 640);
    await render(<div id="box" style={{ width: '200px' }}><PinInput id="w12" aria-label="Code" length={12} defaultValue="492817" /></div>);
    const b = boxes('w12'), r = b.map((x) => x.getBoundingClientRect()), box = el('box').getBoundingClientRect();
    expect([el('box').scrollWidth <= 201, r.every((x) => x.right <= box.right + 1 && Math.round(x.width) === Math.round(x.height) && x.width >= 24)]).toEqual([true, true]);
    expect(r[11].top).toBeGreaterThan(r[0].top);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
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

  test('the focus ring moves to the next box at once as you type (no transition in); the box it leaves fades out', () => withMotion(async () => {
    await render(<PinInput id="pm" aria-label="Code" length={3} />);
    const shadows = (b: HTMLElement) => b.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === 'box-shadow').length;
    el('pm').focus();
    await expect.poll(() => boxes('pm')[0].classList.contains('dk-pin-input__box--active')).toBe(true);
    expect([shadows(boxes('pm')[0]), css(boxes('pm')[0]).boxShadow]).toEqual([0, expect.stringMatching(/0px 0px 0px 1px/)]);
    await userEvent.keyboard('7');
    await expect.poll(() => boxes('pm')[1].classList.contains('dk-pin-input__box--active')).toBe(true);
    expect([shadows(boxes('pm')[1]), shadows(boxes('pm')[0])]).toEqual([0, 1]);
  }));

  test('with Alt, Ctrl or ⌘ the arrows are left to the browser (Alt+← goes back a page) (L8E29)', async () => {
    await render(<PinInput id="mk" aria-label="Code" length={4} defaultValue="12" />);
    const t = document.querySelector('#mk input, input#mk') as HTMLElement;
    t.focus();
    expect([modified(t, 'ArrowLeft'), modified(t, 'Home')]).toEqual([[false, false, false], [false, false, false]]);
  });
});
