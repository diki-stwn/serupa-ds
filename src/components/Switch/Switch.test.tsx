import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, server, userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press, withMotion } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { Switch } from './Switch';

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
// The input (track), its label and thumb, measured.
const box = (id: string) => {
  const i = el(id), w = i.closest('label') as HTMLElement, c = css(i), lc = css(w), ir = i.getBoundingClientRect(), th = w.querySelector('.dk-switch__thumb')!, tr = th.getBoundingClientRect(), tx = w.querySelector('.dk-switch__label'), xr = tx && tx.getBoundingClientRect();
  return {
    tag: i.tagName + ':' + i.type + ':' + i.getAttribute('role'), root: w.tagName, wrap: w.className, w: ir.width, h: ir.height, app: c.appearance, bg: c.backgroundColor, r: c.borderTopLeftRadius, bs: c.boxShadow,
    fs: lc.fontSize, op: lc.opacity, cur: lc.cursor, size: w.dataset.size, comp: w.dataset.component, checked: i.checked, disabled: i.matches(':disabled'), thumb: tr.width, thumbBg: css(th).backgroundColor,
    startGap: Math.round((tr.left - ir.left) * 10) / 10, endGap: Math.round((ir.right - tr.right) * 10) / 10, vGap: Math.abs((tr.top + tr.height / 2) - (ir.top + ir.height / 2)),
    mid: xr ? Math.abs((ir.top + ir.height / 2) - (xr.top + Math.min(xr.height, parseFloat(lc.lineHeight)) / 2)) : 0, labelLeft: xr ? xr.left < ir.left : null,
  };
};
const away = () => userEvent.hover(document.body, { position: { x: 800, y: 650 } });
const still = () => { const s = document.createElement('style'); s.textContent = '.dk-switch * { transition: none !important; }'; document.head.appendChild(s); return s; };

let changes: boolean[] = [];
function App(props: { iref?: React.Ref<HTMLInputElement> }) {
  const [v, set] = React.useState(false);
  return <div style={{ display: 'grid', gap: '12px', width: '380px', justifyItems: 'start' }}>
    {/* @ts-expect-error: type and role, which plain JavaScript could pass, can't be changed */}
    <Switch id="md" ref={props.iref} checked={v} onChange={(e) => { changes.push(e.target.checked); set(e.target.checked); }} name="wifi" className="extra" data-x="y" type="radio" role="button">Wi-Fi</Switch>
    <Switch id="sm" size="sm">Small</Switch>
    <Switch id="lg" size="lg" defaultChecked>Large</Switch>
    {/* @ts-expect-error: an unknown size, as plain JavaScript could pass */}
    <Switch id="bad" size="xl">Bad size</Switch>
    <Switch id="desc" description="Pause notifications at night.">Quiet hours</Switch>
    <Switch id="start" labelPosition="start">Autoplay</Switch>
    <Switch id="bare" aria-label="Enable row" />
    <Switch id="inv" invalid>Two-step sign-in</Switch>
    <Switch id="dis" disabled>Disabled</Switch>
    <div dir="rtl"><Switch id="rtl" defaultChecked>RTL</Switch></div>
    <Field label="Backups" hint="Every night at 2 am."><Switch id="fld">Back up automatically</Switch></Field>
  </div>;
}
const setup = async (iref?: React.Ref<HTMLInputElement>) => { changes = []; await render(<App iref={iref} />); await document.fonts.ready; };

describe('Switch', () => {
  test('onCheckedChange gets the new state and the event after onChange; not while read-only or pending', async () => {
    const calls: string[] = [];
    await render(<div>
      <Switch id="occ" onChange={() => calls.push('change')} onCheckedChange={(v, e) => calls.push(v + ' ' + e.type)}>Wi-Fi</Switch>
      <Switch id="ocr" readOnly onCheckedChange={(v) => calls.push('ro ' + v)}>Locked</Switch>
      <Switch id="ocp" pending onCheckedChange={(v) => calls.push('busy ' + v)}>Saving</Switch>
    </div>);
    const sw = (id: string) => document.getElementById(id) as HTMLInputElement;
    await userEvent.click(sw('occ'));
    await userEvent.click(sw('occ'));
    await userEvent.click(sw('ocr'));
    await userEvent.click(sw('ocp'));
    expect(calls).toEqual(['change', 'true change', 'change', 'false change']);
  });

  test('a native checkbox with role="switch" (type and role can\'t be changed; no system look) in a <label class="dk-switch">; md: a 36 by 20px round track in field-border, a 16px thumb in field 2px from the start, centered on the label\'s first line', async () => {
    await setup();
    const s = still(), md = box('md');
    expect([md.tag, md.root, md.comp, md.app, md.w, md.h, md.bg, md.thumb, md.thumbBg, md.startGap, md.fs]).toEqual(['INPUT:checkbox:switch', 'LABEL', 'switch', 'none', 36, 20, color('var(--field-border)'), 16, color('var(--field)'), 2, '14px']);
    expect(parseFloat(md.r)).toBeGreaterThanOrEqual(10);
    expect(md.vGap).toBeLessThan(0.5);
    expect(md.mid).toBeLessThan(1);
    s.remove();
  });

  test('sizes: sm 28 by 16 with a 12px thumb and text-xs, lg 44 by 24 with a 20px thumb and text-base, each centered on the first line; an unknown size falls back to md', async () => {
    await setup();
    const sm = box('sm'), lg = box('lg');
    expect([sm.w, sm.h, sm.thumb, sm.fs]).toEqual([28, 16, 12, '12px']);
    expect([lg.w, lg.h, lg.thumb, lg.fs]).toEqual([44, 24, 20, '16px']);
    expect([sm.mid < 1, lg.mid < 1, box('bad').size]).toEqual([true, true, 'md']);
  });

  test('ref, name and attributes go to the <input>, className to the label; named by its label alone (not the description), or aria-label', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await setup(ref);
    const i = el('md');
    expect([ref.current === i, i.closest('label')!.classList.contains('extra'), i.dataset.x, i.name]).toEqual([true, true, 'y', 'wifi']);
    expect(page.getByRole('switch', { name: 'Wi-Fi', exact: true }).elements().length).toBe(1);
    expect(page.getByRole('switch', { name: 'Quiet hours', exact: true }).elements().length).toBe(1);
    expect(page.getByRole('switch', { name: 'Enable row', exact: true }).elements().length).toBe(1);
  });

  test('a click on the label turns a controlled switch on through onChange; on: a primary track and the thumb at the end (2px in) in on-primary', async () => {
    await setup();
    await userEvent.click(document.querySelector('label.extra .dk-switch__label')!);
    await away();
    expect([changes.join(), el('md').checked]).toEqual(['true', true]);
    await expect.poll(() => { const b = box('md'); return [b.bg, b.endGap, b.thumbBg]; }).toEqual([color('var(--primary)'), 2, color('var(--on-primary)')]);
  });

  test('Space flips it from the keyboard; it is announced as a checked switch', async () => {
    await setup();
    el('sm').focus();
    await userEvent.keyboard(' ');
    expect(el('sm').checked).toBe(true);
    await expect.element(page.getByRole('switch', { name: 'Small', checked: true })).toBeInTheDocument();
  });

  test('description: a muted second line in aria-describedby', async () => {
    await setup();
    const i = el('desc'), d = i.closest('label')!.querySelector('.dk-switch__description')!;
    expect([i.getAttribute('aria-describedby'), css(d).color]).toEqual([d.id, color('var(--text-muted)')]);
  });

  test('labelPosition="start" puts the label before the track; without a label, just the track (20px tall)', async () => {
    await setup();
    const st = box('start'), bare = box('bare');
    expect([st.labelLeft, box('md').labelLeft]).toEqual([true, false]);
    expect(st.wrap).toMatch(/dk-switch--label-start/);
    expect(bare.wrap).toMatch(/dk-switch--bare/);
    expect(el('bare').closest('label')!.getBoundingClientRect().height).toBe(20);
  });

  test('right-to-left: the thumb starts on the right and ends on the left', async () => {
    await setup();
    const i = el('rtl'), t = i.nextElementSibling!;
    await expect.poll(() => t.getBoundingClientRect().left - i.getBoundingClientRect().left).toBe(2);
    expect(i.checked).toBe(true);
  });

  test('hover: field-border-hover while off, primary-hover while on', async () => {
    await setup();
    await userEvent.hover(el('bad'));
    await expect.poll(() => box('bad').bg).toBe(color('var(--field-border-hover)'));
    await away();
    await userEvent.hover(el('lg'));
    await expect.poll(() => box('lg').bg).toBe(color('var(--primary-hover)'));
    await away();
  });

  test('keyboard focus: a 2px focus-ring outline 2px out, like Button, with a transparent gap', async () => {
    await setup();
    el('bad').focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Tab}');
    const ring = color('var(--focus-ring)');
    const a = document.activeElement!;
    await expect.poll(() => css(a).outlineColor).toBe(ring);
    const c = css(a);
    expect([a.id, c.outlineStyle, c.outlineWidth, c.outlineOffset, box('bad').bs]).toEqual(['bad', 'solid', '2px', '2px', 'none']);
  });

  test('invalid: aria-invalid, and a 2px danger edge on the grey off track, so it still reads as off', async () => {
    await setup();
    await expect.poll(() => box('inv').bg).toBe(color('var(--field-border)'));
    expect(css(el('inv')).boxShadow).toBe(`${color('var(--danger)')} 0px 0px 0px 2px inset`);
    expect(el('inv').getAttribute('aria-invalid')).toBe('true');
  });

  test('disabled: native disabled, 50%, not-allowed; clicks do nothing', async () => {
    await setup();
    await userEvent.click(el('dis'), { force: true });
    const d = box('dis');
    expect([d.disabled, d.op, d.cur, d.checked]).toEqual([true, '0.5', 'not-allowed', false]);
  });

  test('readOnly: focusable with aria-readonly; a click on the label or track and Space leave it as it was, onClick still runs, onChange doesn\'t, and an on switch is submitted', async () => {
    const onChange = vi.fn(), onClick = vi.fn();
    await render(<form id="ro-form"><Switch id="ro" name="wifi" readOnly defaultChecked onChange={onChange} onClick={onClick}>Wi-Fi</Switch><Switch id="ro2" readOnly>Bluetooth</Switch></form>);
    const lab = (id: string) => el(id).closest('label') as HTMLElement;
    expect([el('ro').getAttribute('aria-readonly'), lab('ro').className.includes('dk-switch--readonly'), css(lab('ro')).cursor]).toEqual(['true', true, 'default']);
    await userEvent.click(lab('ro'));
    await userEvent.click(el('ro2'));
    el('ro').focus();
    await userEvent.keyboard(' ');
    expect([el('ro').checked, el('ro2').checked, document.activeElement === el('ro'), onChange.mock.calls.length, onClick.mock.calls.length]).toEqual([true, false, true, 0, 2]);
    expect(new FormData(document.getElementById('ro-form') as HTMLFormElement).get('wifi')).toBe('on');
  });

  test('pending: aria-busy and a ring turning on the thumb; clicks and Space leave it, onChange doesn\'t run, it stays focusable and submitted, and the ring keeps 3:1 on the thumb on and off in all six themes', async () => {
    const onChange = vi.fn();
    function Saving() {
      const [on, setOn] = React.useState(false), [busy, setBusy] = React.useState(false);
      return <form id="pd-form">
        <Switch id="pd" name="sync" checked={on} pending={busy} onChange={(e) => { onChange(); setOn(e.currentTarget.checked); setBusy(true); }}>Sync</Switch>
        <Switch id="pd-on" defaultChecked pending>Backup</Switch>
        <button type="button" id="pd-done" onClick={() => { setBusy(false); }}>Saved</button>
      </form>;
    }
    await render(<Saving />);
    const lab = (id: string) => el(id).closest('label') as HTMLElement;
    expect([el('pd').hasAttribute('aria-busy'), lab('pd').querySelector('.dk-switch__spinner')]).toEqual([false, null]);
    await userEvent.click(lab('pd'));
    expect([el('pd').checked, el('pd').getAttribute('aria-busy'), el('pd').hasAttribute('aria-readonly'), css(lab('pd')).cursor, el('pd').tabIndex]).toEqual([true, 'true', false, 'progress', 0]);
    expect(withMotion(() => css(lab('pd').querySelector('.dk-switch__thumb > .dk-switch__spinner')).animationName)).toBe('spin');
    await userEvent.click(lab('pd'));
    el('pd').focus();
    await userEvent.keyboard(' ');
    expect([el('pd').checked, onChange.mock.calls.length, document.activeElement === el('pd')]).toEqual([true, 1, true]);
    expect(new FormData(document.getElementById('pd-form') as HTMLFormElement).get('sync')).toBe('on');
    await userEvent.click(el('pd-done'));
    expect([el('pd').hasAttribute('aria-busy'), lab('pd').querySelector('.dk-switch__spinner')]).toEqual([false, null]);
    await userEvent.click(lab('pd'));
    expect(el('pd').checked).toBe(false);
    // The ring sits inside the thumb.
    const t = lab('pd-on').querySelector('.dk-switch__thumb')!.getBoundingClientRect(), r = lab('pd-on').querySelector('.dk-switch__spinner')!.getBoundingClientRect();
    expect([r.width > 0, r.left >= t.left, r.right <= t.right, r.top >= t.top, r.bottom <= t.bottom]).toEqual([true, true, true, true, true]);
    const low: string[] = [];
    function Off() { return <Switch id="pd-off" pending>Off</Switch>; }
    await render(<Off />);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const id of ['pd-on', 'pd-off']) {
        const w = lab(id), ring = css(w.querySelector('.dk-switch__spinner')).borderBlockStartColor, bg = css(w.querySelector('.dk-switch__thumb')).backgroundColor;
        const c = contrast(ring, bg); if (c < 3) low.push(`${th} ${id}: ${c.toFixed(2)}`);
      }
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('readOnly and controlled (checked without onChange): no React warning, and it stays on', async () => {
    const warned: unknown[] = [], warn = console.error;
    console.error = (...a: unknown[]) => { warned.push(a[0]); };
    try { await render(<Switch id="roc" checked readOnly>Locked</Switch>); } finally { console.error = warn; }
    await userEvent.click(el('roc').closest('label') as HTMLElement);
    expect([el('roc').checked, warned]).toEqual([true, []]);
  });

  test('in a Field: labelled and described by the hint', async () => {
    await setup();
    const i = el('fld');
    expect([...i.labels!].map((l) => l.textContent).join('|')).toMatch(/Back up automatically/);
    expect(document.getElementById(i.getAttribute('aria-describedby')!)!.textContent).toBe('Every night at 2 am.');
  });

  test('the thumb slides in 100ms (motion-press: feedback for a toggle is 100ms or less, FI1), a press on it springs back over motion-release, and nothing animates with reduced motion', async () => {
    await setup();
    const dur = () => withMotion(() => css(document.querySelector('.dk-switch__thumb')).transitionDuration + '|' + css(document.querySelector('.dk-switch__input')).transitionDuration);
    expect(dur()).toBe('0.1s, 0.1s, 0.3s|0.1s');
    if (server.browser === 'chromium') {
      const session = cdp() as unknown as { send: (method: string, params: object) => Promise<unknown> };
      await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try { expect(dur()).toBe('0s|0s'); } finally { await session.send('Emulation.setEmulatedMedia', { features: [] }); }
    } else {
      // No media emulation outside Chromium: apply the reduced-motion rules as written, unconditionally.
      const rules = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } });
      const flat = (rs: CSSRule[]): CSSRule[] => rs.flatMap((r) => ('cssRules' in r ? [r, ...flat([...(r as CSSGroupingRule).cssRules])] : [r]));
      const rm = flat(rules).filter((r): r is CSSMediaRule => r instanceof CSSMediaRule && /prefers-reduced-motion:\s*reduce/.test(r.conditionText) && /dk-switch/.test(r.cssText));
      const s = document.createElement('style'); s.textContent = '@layer dk.components {' + rm.map((r) => [...r.cssRules].map((x) => x.cssText).join('')).join('') + '}'; document.head.appendChild(s);
      try { expect([rm.length, dur()]).toEqual([1, '0s|0s']); } finally { s.remove(); }
    }
  });

  test('contrast in all six themes: label and description 4.5:1; tracks on the page, thumbs on their tracks (rest and hover) and the focus ring 3:1', () => {
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const pairs: Array<[string, string, string, number]> = [['label', 'var(--text)', 'var(--surface)', 4.5], ['description', 'var(--text-muted)', 'var(--surface)', 4.5], ['off track', 'var(--field-border)', 'var(--surface)', 3], ['on track', 'var(--primary)', 'var(--surface)', 3], ['off thumb', 'var(--field)', 'var(--field-border)', 3], ['off thumb, hover', 'var(--field)', 'var(--field-border-hover)', 3], ['on thumb', 'var(--on-primary)', 'var(--primary)', 3], ['on thumb, hover', 'var(--on-primary)', 'var(--primary-hover)', 3], ['invalid edge', 'var(--danger)', 'var(--surface)', 3], ['focus', 'var(--focus-ring)', 'var(--surface)', 3]];
      for (const [n, fg, bg, need] of pairs) { const r = contrast(fg, bg); if (r < need) low.push(`${th} ${n} ${r.toFixed(2)}`); }
    }
    expect(low).toEqual([]);
  });

  test('no React warnings', async () => {
    const error = vi.spyOn(console, 'error'), warn = vi.spyOn(console, 'warn');
    await setup();
    await userEvent.click(document.querySelector('label.extra .dk-switch__label')!);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    error.mockRestore(); warn.mockRestore();
  });

  test('pressed: the thumb shrinks to 90% while the row is held and springs back; not when disabled (ED1)', async () => {
    await withMotion(async () => {
      await render(<><Switch id="ps">Press me</Switch><Switch id="pd" disabled>Off</Switch></>);
      const thumb = (id: string) => el(id).nextElementSibling as HTMLElement;
      expect(css(thumb('ps')).transitionProperty).toContain('scale');
      await press(el('ps').closest('label')!, () => expect.poll(() => css(thumb('ps')).scale).toBe('0.9'));
      await expect.poll(() => css(thumb('ps')).scale).toBe('none');
      await press(el('pd').closest('label')!, () => expect(css(thumb('pd')).scale).toBe('none'));
    });
  });
});
