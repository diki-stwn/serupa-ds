import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, tabTo } from '../../../tools/test/vitest/helpers';
import { PasswordInput } from './PasswordInput';

// The button at a point just outside each edge of b (hit testing rounds to whole pixels, so 0.75px before the start
// and 0.25px after the end both land 1px out): the 24px box behind it (WCAG 2.5.8) takes presses there.
const reach = (b: HTMLElement) => {
  const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return [[r.left - 0.75, cy], [r.right + 0.25, cy], [cx, r.top - 0.75], [cx, r.bottom + 0.25]].map(([x, y]) => document.elementFromPoint(x, y)?.closest('button') === b);
};

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const box = (id: string) => field(id).parentElement as HTMLElement;
const toggle = (id: string) => field(id).nextElementSibling as HTMLButtonElement;
const eye = (id: string) => (toggle(id).querySelector<HTMLElement>('[data-icon]'))?.dataset.icon;
// Transitions still running (a theme change can cancel one and start another, so poll rather than await .finished).
const settled = () => expect.poll(() => document.getAnimations().length).toBe(0);

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

const Wrap = ({ children }: { children: React.ReactNode }) => <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>;
const Main = ({ pref }: { pref?: React.Ref<HTMLInputElement> }) => <>
  <label htmlFor="pw">Password</label>
  <PasswordInput id="pw" ref={pref} className="extra" style={{ marginTop: '2px' }} placeholder="Your password" leftIcon="lock" />
</>;

describe('PasswordInput', () => {
  test('a press on the box (the side padding, the icon) focuses the field with the caret at the end; the reveal button still toggles (GE1)', async () => {
    await render(<div style={{ width: '300px' }}><PasswordInput id="pp" size="lg" leftIcon="lock" aria-label="Password" defaultValue="secret" /><button id="pp-away">away</button></div>);
    const y = box('pp').getBoundingClientRect().height / 2;
    for (const x of [2, 20]) {
      (document.getElementById('pp-away') as HTMLElement).focus();
      await userEvent.click(box('pp'), { position: { x, y } });
      expect([x, document.activeElement === field('pp'), field('pp').selectionStart]).toEqual([x, true, 6]);
    }
    await userEvent.click(toggle('pp'));
    expect(field('pp').type).toBe('text');
  });

  test('Input\'s box (32px, md) around a type="password" field, autocomplete current-password, no spellcheck; ref to the input, className and style to the box', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Wrap><Main pref={ref} /></Wrap>);
    const i = field('pw'), b = box('pw');
    expect([i.type, i.getAttribute('autocomplete'), ref.current === i, i.spellcheck, i.placeholder, i.labels![0].textContent]).toEqual(['password', 'current-password', true, false, 'Your password', 'Password']);
    expect([b.className, b.dataset.component, b.style.marginTop, b.getBoundingClientRect().height]).toEqual(['dk-input dk-password-input dk-input--size-md extra', 'password-input', '2px', 32]);
    expect((b.querySelector('.dk-input__icon--left .dk-icon') as HTMLElement).dataset.icon).toBe('lock');
  });

  test('the show/hide button: type button, "Show password", aria-pressed="false", controls the field, an eye icon', async () => {
    await render(<Wrap><Main /></Wrap>);
    const t = toggle('pw');
    expect([t.type, t.getAttribute('aria-label'), t.getAttribute('aria-pressed'), t.getAttribute('aria-controls'), eye('pw')]).toEqual(['button', 'Show password', 'false', 'pw', 'visibility']);
  });

  test('keyboard table: Tab goes to the field, then the show button; pressing Caps Lock in the field shows "Caps Lock is on" (FH1)', async () => {
    await render(<Wrap><button id="kb-before">before</button><PasswordInput id="kc" aria-label="Password" /></Wrap>);
    document.getElementById('kb-before')!.focus();
    await userEvent.tab();
    const order = [document.activeElement === field('kc')];
    // The key itself, as a browser reports it: the keydown that turns Caps Lock on already has it on, the one that turns it off has it off.
    const caps = (on: boolean) => field('kc').dispatchEvent(new KeyboardEvent('keydown', { key: 'CapsLock', bubbles: true, modifierCapsLock: on }));
    const hint = () => { const d = field('kc').getAttribute('aria-describedby'); return d ? document.getElementById(d)!.textContent : null; };
    caps(true);
    await expect.poll(hint).toBe('Caps Lock is on');
    caps(false);
    await expect.poll(hint).toBe(null);
    await userEvent.tab();
    order.push(document.activeElement === toggle('kc'));
    expect(order).toEqual([true, true]);
  });

  test('pressing it shows the text (type text, aria-pressed true, eye crossed out) and the field keeps focus; Enter and Space on the button toggle it; it shows a 2px focus ring', async () => {
    await render(<Wrap><Main /></Wrap>);
    await userEvent.fill(field('pw'), 'hunter2');
    field('pw').focus();
    await userEvent.click(toggle('pw'));
    expect([field('pw').type, field('pw').value, toggle('pw').getAttribute('aria-pressed'), eye('pw'), document.activeElement === field('pw')]).toEqual(['text', 'hunter2', 'true', 'visibility_off', true]);
    await tabTo(toggle('pw'));
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => field('pw').type).toBe('password');
    await userEvent.keyboard('[Space]');
    await expect.poll(() => field('pw').type).toBe('text');
    expect([css(toggle('pw')).outlineStyle, css(toggle('pw')).outlineWidth]).toEqual(['solid', '2px']);
  });

  test('defaultVisible starts shown; autoComplete and toggleLabel are yours; size lg is 44px', async () => {
    await render(<Wrap><PasswordInput id="pnew" aria-label="New" autoComplete="new-password" defaultVisible size="lg" toggleLabel="Show the new password" /></Wrap>);
    expect([field('pnew').type, field('pnew').getAttribute('autocomplete'), toggle('pnew').getAttribute('aria-label'), Math.round(box('pnew').getBoundingClientRect().height)])
      .toEqual(['text', 'new-password', 'Show the new password', 44]);
  });

  test('controlled: onVisibleChange gets the new state, the parent sets it', async () => {
    const calls: boolean[] = [];
    function Controlled() {
      const [v, setV] = React.useState(true);
      return <PasswordInput id="pctl" aria-label="Ctl" visible={v} onVisibleChange={(x) => { calls.push(x); setV(x); }} />;
    }
    await render(<Wrap><Controlled /></Wrap>);
    await userEvent.click(toggle('pctl'));
    expect([field('pctl').type, calls.join()]).toEqual(['password', 'false']);
  });

  test('invalid: aria-invalid and the danger border; size sm is 24px; disabled: the field and the button; an unknown size falls back to md', async () => {
    await render(<Wrap>
      <PasswordInput id="pinv" aria-label="Inv" invalid size="sm" />
      {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
      <PasswordInput id="pdis" aria-label="Dis" disabled size="huge" />
    </Wrap>);
    expect([field('pinv').getAttribute('aria-invalid'), box('pinv').className.includes('dk-input--invalid'), Math.round(box('pinv').getBoundingClientRect().height)]).toEqual(['true', true, 24]);
    expect([field('pdis').disabled, toggle('pdis').disabled, box('pdis').className.includes('dk-input--disabled'), box('pdis').dataset.size]).toEqual([true, true, true, 'md']);
  });

  test('the token --password-input-toggle overrides one field; the eye icon follows the field\'s icon size: 14, 16, 20px', async () => {
    await render(<Wrap>
      <PasswordInput id="ptok" aria-label="Tok" style={{ '--password-input-toggle': 'rgb(1, 2, 3)' } as React.CSSProperties} />
      <PasswordInput id="pinv" aria-label="Inv" invalid size="sm" />
      <PasswordInput id="pw" aria-label="Md" />
      <PasswordInput id="pnew" aria-label="New" size="lg" />
    </Wrap>);
    await expect.poll(() => css(toggle('ptok')).color).toBe('rgb(1, 2, 3)');
    expect(['pinv', 'pw', 'pnew'].map((id) => css(toggle(id).querySelector('[data-icon]')).fontSize)).toEqual(['14px', '16px', '20px']);
  });

  test('contrast: the text 4.5:1 and the eye icon 3:1 on the field in all six themes', async () => {
    await render(<Wrap><PasswordInput id="pnew" aria-label="New" defaultVisible size="lg" /></Wrap>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // Colors ease after a theme change; read the end state.
      void css(box('pnew')).backgroundColor; void css(toggle('pnew')).color;
      await settled();
      const bg = css(box('pnew')).backgroundColor;
      for (const [name, fg, min] of [['text', css(field('pnew')).color, 4.5], ['eye icon', css(toggle('pnew')).color, 3]] as const) {
        const r = contrast(fg, bg); n++;
        if (r < min) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
    expect(n).toBe(12);
  });

  test('Caps Lock on while typing: "Caps Lock is on" shows before the eye, describes the field and is read out once; off again, or leaving the field, hides it (Q3)', async () => {
    await render(<><PasswordInput id="cl" aria-label="Password" /><PasswordInput id="nocl" capsLockHint={false} aria-label="Other" /></>);
    const key = (id: string, type: string, caps: boolean) => field(id).dispatchEvent(new KeyboardEvent(type, { key: 'a', bubbles: true, modifierCapsLock: caps }));
    const hint = (id: string) => box(id).querySelector<HTMLElement>('.dk-password-input__caps');
    field('cl').focus();
    key('cl', 'keydown', true);
    await expect.poll(() => hint('cl')?.textContent).toBe('Caps Lock is on');
    expect([field('cl').getAttribute('aria-describedby'), hint('cl')!.nextElementSibling!.className === 'dk-password-input__toggle']).toEqual([hint('cl')!.id, true]);
    await expect.poll(() => document.querySelector('[data-dk-announcer]')?.textContent).toMatch(/Caps Lock is on\.?$/);
    key('cl', 'keyup', true);
    key('cl', 'keydown', false);
    await expect.poll(() => hint('cl')).toBe(null);
    expect(field('cl').hasAttribute('aria-describedby')).toBe(false);
    key('cl', 'keydown', true);
    await expect.poll(() => !!hint('cl')).toBe(true);
    field('cl').blur();
    await expect.poll(() => hint('cl')).toBe(null);
    field('nocl').focus();
    key('nocl', 'keydown', true);
    expect(hint('nocl')).toBe(null);
  });

  test('showing and hiding keeps the caret and the selection where they were, so typing goes on there (BW1)', async () => {
    await render(<PasswordInput id="pcar" aria-label="Password" />);
    await userEvent.click(field('pcar'));
    await userEvent.keyboard('secret{ArrowLeft}{ArrowLeft}');
    await userEvent.click(toggle('pcar'));
    await userEvent.keyboard('X');
    expect([field('pcar').type, field('pcar').value]).toEqual(['text', 'secrXet']);
    field('pcar').setSelectionRange(1, 4, 'backward');
    await userEvent.click(toggle('pcar'));
    const f = field('pcar');
    // WebKit can move the selection after the new type is applied; the component puts it back on the next frame
    await expect.poll(() => [f.type, f.selectionStart, f.selectionEnd, f.selectionDirection, document.activeElement === f]).toEqual(['password', 1, 4, 'backward', true]);
  });

  test('pasting works: nothing blocks it, so a password manager or a pasted password fills the field (WCAG 3.3.8)', async () => {
    await render(<PasswordInput id="pp" aria-label="Password" />);
    field('pp').focus();
    const data = new DataTransfer();
    data.setData('text/plain', 'correct horse');
    const ev = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
    field('pp').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
  test('size sm: show/hide is 22px but takes presses over 24px (WCAG 2.5.8), past each edge, without moving anything', async () => {
    await render(<div style={{ width: '320px', padding: '8px' }}><PasswordInput id="hb" aria-label="Password" size="sm" /></div>);
    const buttons = [document.querySelector<HTMLElement>('#hb')!.closest('.dk-input')!.querySelector<HTMLElement>('.dk-password-input__toggle')!];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(Math.round(b.getBoundingClientRect().height)).toBeLessThan(24);
      expect(reach(b)).toEqual([true, true, true, true]);
    }
  });
});
