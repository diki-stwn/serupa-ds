import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { Dialog } from '../Dialog/Dialog';
import { InlineEdit } from './InlineEdit';

const root = (id: string) => document.getElementById(id) as HTMLDivElement;
const view = (id: string) => root(id).querySelector(':scope > :is(button, span):first-child') as HTMLElement;
// The words shown: the view's own span (the hidden words are VisuallyHidden, the pencil an Icon).
const TEXT = ':scope > span:not([data-component]):not([data-icon])';
const input = (id: string) => root(id).querySelector<HTMLInputElement>('input');
const said = () => document.querySelector<HTMLElement>('[data-dk-announcer]')!.textContent;
const Box = ({ children }: { children: React.ReactNode }) => <div style={{ width: '320px', display: 'grid', gap: '12px', background: 'var(--surface)' }}>{children}</div>;

function Controlled({ calls }: { calls: string[] }) {
  const [v, setV] = React.useState('Apollo');
  return <><InlineEdit id="ctl" label="Project name" value={v} onValueChange={(n) => { calls.push(n); setV(n); }} /><output id="ctl-out">{v}</output></>;
}

describe('InlineEdit', () => {
  test('switching to another window or tab mid-edit keeps the field open and saves nothing; leaving it then saves (L8E25)', async () => {
    const saved: string[] = [];
    await render(<><InlineEdit id="wb" label="Name" defaultValue="Atlas" onValueChange={(v) => saved.push(v)} /><button id="wbn">Next</button></>);
    await userEvent.click(view('wb'));
    await expect.poll(() => document.activeElement).toBe(input('wb'));
    await userEvent.keyboard('Atlas 2');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    input('wb')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    input('wb')!.dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([!!input('wb'), saved]).toEqual([true, []]);
    await userEvent.click(document.getElementById('wbn')!);
    await expect.poll(() => input('wb')).toBeNull();
    expect(saved).toEqual(['Atlas 2']);
  });

  test('inside a shadow root, switching windows mid-edit keeps the field open too, and an Enter whose check settles later puts focus back on the button (GR95)', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    const saved: string[] = [];
    const pending: Array<(m: string | null) => void> = [];
    try {
      await render(<InlineEdit id="sh" label="Name" defaultValue="Atlas" onValueChange={(v) => saved.push(v)} validate={() => new Promise<string | null>((res) => { pending.push(res); })} />, { container: inner });
      const sr = host.shadowRoot!, field = () => sr.querySelector<HTMLInputElement>('input');
      sr.querySelector<HTMLElement>('button')!.click();
      await expect.poll(() => sr.activeElement?.tagName).toBe('INPUT');
      await userEvent.keyboard('Atlas 2');
      field()!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      field()!.dispatchEvent(new FocusEvent('blur'));
      await new Promise((r) => setTimeout(r, 30));
      expect([!!field(), pending.length]).toEqual([true, 0]);
      await userEvent.keyboard('{Enter}');
      pending[0](null);
      await expect.poll(() => field()).toBeNull();
      await expect.poll(() => sr.activeElement?.tagName).toBe('BUTTON');
      expect(saved).toEqual(['Atlas 2']);
    } finally { host.remove(); }
  });

  test('the text in a button named "label: text, Edit"; a click opens an Input named by label with the text selected; ref and props reach the outer div', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Box><InlineEdit id="a" ref={ref} className="extra" data-x="y" label="Project name" defaultValue="Apollo" /></Box>);
    const b = view('a');
    expect([b.tagName, b.getAttribute('type'), b.textContent, root('a').dataset.state, root('a').dataset.component, ref.current === root('a'), root('a').className, root('a').dataset.x])
      .toEqual(['BUTTON', 'button', 'Project name: Apollo, Edit', 'viewing', 'inline-edit', true, 'dk-inline-edit dk-inline-edit--size-md extra', 'y']);
    expect(css(b.querySelector(TEXT)).position).not.toBe('absolute');
    await userEvent.click(b);
    const i = input('a')!;
    expect([root('a').dataset.state, document.activeElement === i, i.getAttribute('aria-label'), i.value, i.selectionStart, i.selectionEnd]).toEqual(['editing', true, 'Project name', 'Apollo', 0, 6]);
  });

  test('Enter saves and puts focus back on the button; Escape puts the text back; both from the keyboard alone', async () => {
    const calls: string[] = [], cancels: number[] = [];
    await render(<Box><InlineEdit id="k" label="Name" defaultValue="Apollo" onValueChange={(v) => calls.push(v)} onCancel={() => cancels.push(1)} /></Box>);
    view('k').focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(input('k'));
    await userEvent.keyboard('{Control>}a{/Control}Artemis{Enter}');
    expect([input('k'), document.activeElement === view('k'), view('k').textContent, calls]).toEqual([null, true, 'Name: Artemis, Edit', ['Artemis']]);
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Control>}a{/Control}Gemini{Escape}');
    expect([input('k'), document.activeElement === view('k'), view('k').textContent, calls, cancels]).toEqual([null, true, 'Name: Artemis, Edit', ['Artemis'], [1]]);
  });

  test('leaving the field saves, once, without taking focus back; an unchanged text calls nothing', async () => {
    const calls: string[] = [];
    await render(<Box><InlineEdit id="b" label="Name" defaultValue="Apollo" onValueChange={(v) => calls.push(v)} /><button id="next">Next</button></Box>);
    await userEvent.click(view('b'));
    await userEvent.fill(input('b')!, 'Apollo 11');
    await userEvent.click(document.getElementById('next')!);
    expect([input('b'), document.activeElement?.id, view('b').textContent, calls]).toEqual([null, 'next', 'Name: Apollo 11, Edit', ['Apollo 11']]);
    await userEvent.click(view('b'));
    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual(['Apollo 11']);
  });

  test('keyboard table: Tab leaves the field, which saves (FH1)', async () => {
    const calls: string[] = [];
    await render(<Box><InlineEdit id="kt" label="Name" defaultValue="Apollo" onValueChange={(v) => calls.push(v)} /><button id="kt-next">Next</button></Box>);
    view('kt').focus();
    await userEvent.keyboard('{Enter}{Control>}a{/Control}Orion');
    await userEvent.tab();
    expect([input('kt'), document.activeElement?.id, view('kt').textContent, calls]).toEqual([null, 'kt-next', 'Name: Orion, Edit', ['Orion']]);
  });

  test('controlled: value and onValueChange', async () => {
    const calls: string[] = [];
    await render(<Controlled calls={calls} />);
    await userEvent.click(view('ctl'));
    await userEvent.fill(input('ctl')!, 'Artemis');
    await userEvent.keyboard('{Enter}');
    expect([calls, document.getElementById('ctl-out')!.textContent, view('ctl').textContent]).toEqual([['Artemis'], 'Artemis', 'Project name: Artemis, Edit']);
  });

  test('validate: an error keeps the field open, invalid and described by the message; typing clears it; a valid text saves', async () => {
    const calls: string[] = [];
    await render(<Box><InlineEdit id="v" label="Slug" defaultValue="apollo" onValueChange={(x) => calls.push(x)} validate={(x) => (x.includes(' ') ? 'Use dashes instead of spaces.' : null)} /></Box>);
    await userEvent.click(view('v'));
    await userEvent.fill(input('v')!, 'apollo plan');
    await userEvent.keyboard('{Enter}');
    const i = input('v')!, err = root('v').querySelector(':scope > div[id]')!;
    expect([i.getAttribute('aria-invalid'), i.getAttribute('aria-describedby') === err.id, err.textContent, document.activeElement === i, calls]).toEqual(['true', true, 'Use dashes instead of spaces.', true, []]);
    await userEvent.fill(i, 'apollo-plan');
    expect([i.hasAttribute('aria-invalid'), root('v').querySelector('[data-icon="error"]')]).toEqual([false, null]);
    await userEvent.keyboard('{Enter}');
    expect([input('v'), calls]).toEqual([null, ['apollo-plan']]);
  });

  test('a failed save is said, since focus stays in the field and its description isn\'t read again; each try is said, even with the same words', async () => {
    await render(<Box><InlineEdit id="va" label="Slug" defaultValue="apollo" validate={(x) => (x.includes(' ') ? 'Use dashes instead of spaces.' : null)} /></Box>);
    await userEvent.click(view('va'));
    await userEvent.fill(input('va')!, 'apollo plan');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => announcerIdle() && said()).toBe('Use dashes instead of spaces.');
    document.querySelector<HTMLElement>('[data-dk-announcer]')!.textContent = '';
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => announcerIdle() && said()).toBe('Use dashes instead of spaces.');
  });

  test('leaving the field with a failing text keeps it open with the message, says it, and leaves focus where it went', async () => {
    const calls: string[] = [];
    await render(<Box><InlineEdit id="vb" label="Slug" defaultValue="apollo" onValueChange={(x) => calls.push(x)} validate={(x) => (x.includes(' ') ? 'Use dashes instead of spaces.' : null)} /><button id="vb-next">Next</button></Box>);
    await userEvent.click(view('vb'));
    await userEvent.fill(input('vb')!, 'apollo plan');
    await userEvent.click(document.getElementById('vb-next')!);
    const i = input('vb')!;
    expect([document.activeElement?.id, i.value, i.getAttribute('aria-invalid'), document.getElementById(i.getAttribute('aria-describedby')!)!.textContent, calls])
      .toEqual(['vb-next', 'apollo plan', 'true', 'Use dashes instead of spaces.', []]);
    await expect.poll(() => announcerIdle() && said()).toBe('Use dashes instead of spaces.');
  });

  test('validate can return a Promise: busy until it settles, only the latest check counts, Escape drops it', async () => {
    const calls: string[] = [];
    const pending: Array<(m: string | null) => void> = [];
    const check = () => new Promise<string | null>((res) => { pending.push(res); });
    await render(<Box><InlineEdit id="vp" label="Slug" defaultValue="apollo" onValueChange={(x) => calls.push(x)} validate={check} /></Box>);
    await userEvent.click(view('vp'));
    await userEvent.fill(input('vp')!, 'taken');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => input('vp')!.getAttribute('aria-busy')).toBe('true');
    pending[0]('That slug is taken.');
    await expect.poll(() => input('vp')!.getAttribute('aria-invalid')).toBe('true');
    expect([input('vp')!.hasAttribute('aria-busy'), document.getElementById(input('vp')!.getAttribute('aria-describedby')!)!.textContent, calls]).toEqual([false, 'That slug is taken.', []]);
    await expect.poll(() => announcerIdle() && said()).toBe('That slug is taken.');
    // A check whose text was edited since doesn't count.
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('-2');
    pending[1](null);
    await new Promise((r) => setTimeout(r, 50));
    expect([input('vp')!.value, input('vp')!.hasAttribute('aria-busy'), calls]).toEqual(['taken-2', false, []]);
    await userEvent.keyboard('{Enter}');
    pending[2](null);
    await expect.poll(() => input('vp')).toBe(null);
    expect([calls, document.activeElement === view('vp'), view('vp').textContent]).toEqual([['taken-2'], true, 'Slug: taken-2, Edit']);
    // Escape while a check runs puts the text back, and its answer is ignored.
    await userEvent.keyboard(' ');
    await userEvent.fill(input('vp')!, 'later');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Escape}');
    pending[3](null);
    await new Promise((r) => setTimeout(r, 50));
    expect([input('vp'), calls, view('vp').textContent]).toEqual([null, ['taken-2'], 'Slug: taken-2, Edit']);
  });

  test('Enter with an async validate, then Tab away while it runs: the save goes through and focus stays where the person went (GD3)', async () => {
    const calls: string[] = [];
    let done: (m: string | null) => void = () => {};
    await render(<Box><InlineEdit id="vt" label="Slug" defaultValue="apollo" onValueChange={(x) => calls.push(x)} validate={() => new Promise<string | null>((res) => { done = res; })} /><button id="vt-next">Next</button></Box>);
    await userEvent.click(view('vt'));
    await userEvent.fill(input('vt')!, 'apollo-2');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement?.id).toBe('vt-next');
    done(null);
    await expect.poll(() => input('vt')).toBe(null);
    await new Promise((r) => setTimeout(r, 50));
    expect([calls, document.activeElement?.id]).toEqual([['apollo-2'], 'vt-next']);
  });

  test('an empty value with no placeholder shows its pencil, so the button can be found (GD4); with text or a placeholder the pencil waits for hover or focus', async () => {
    await render(<Box><InlineEdit id="eb" label="Notes" defaultValue="" /><InlineEdit id="ep" label="Notes" defaultValue="" placeholder="Add notes" /><InlineEdit id="et" label="Notes" defaultValue="Ready" /></Box>);
    // The pencil is the button's last child.
    const pencil = (id: string) => css(view(id).lastElementChild).opacity;
    expect([pencil('eb'), pencil('ep'), pencil('et')]).toEqual(['1', '0', '0']);
  });

  test('validate\'s Promise rejected: the field stays open with the text, not busy and with no message', async () => {
    const calls: string[] = [];
    await render(<Box><InlineEdit id="vr" label="Slug" defaultValue="apollo" onValueChange={(x) => calls.push(x)} validate={() => Promise.reject(new Error('offline'))} /></Box>);
    await userEvent.click(view('vr'));
    await userEvent.fill(input('vr')!, 'gemini');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => input('vr')!.hasAttribute('aria-busy')).toBe(false);
    expect([input('vr')!.value, input('vr')!.hasAttribute('aria-invalid'), calls]).toEqual(['gemini', false, []]);
  });

  test('Escape inside a Dialog cancels the edit and leaves the dialog open', async () => {
    const asks: boolean[] = [];
    await render(<Dialog open title="Rename" onOpenChange={(o) => asks.push(o)}><InlineEdit id="d" label="Name" defaultValue="Apollo" /></Dialog>);
    await userEvent.click(view('d'));
    await userEvent.keyboard('{Escape}');
    expect([input('d'), asks]).toEqual([null, []]);
  });

  test('editing and onEditingChange (controlled); disabled and readOnly show the text without a button; placeholder when empty', async () => {
    const changes: boolean[] = [];
    await render(<SerupaProvider labels={{ edit: 'Ubah' }}><Box>
      <InlineEdit id="e" label="Name" defaultValue="Apollo" editing onEditingChange={(x) => changes.push(x)} />
      <InlineEdit id="dis" label="Name" defaultValue="Apollo" disabled />
      <InlineEdit id="ro" label="Name" defaultValue="Apollo" readOnly />
      <InlineEdit id="ph" label="Description" placeholder="Add a description" />
    </Box></SerupaProvider>);
    expect([root('e').dataset.state, document.activeElement === input('e')]).toEqual(['editing', true]);
    await userEvent.keyboard('{Enter}');
    expect([changes, root('e').dataset.state]).toEqual([[false], 'editing']);
    expect([view('dis').tagName, view('dis').textContent, view('ro').tagName, root('ro').querySelector('button')]).toEqual(['SPAN', 'Apollo', 'SPAN', null]);
    expect([view('ph').textContent, view('ph').querySelector('.dk-inline-edit__text--placeholder') != null]).toEqual(['Description: Add a description, Ubah', true]);
  });

  test('opened by the editing prop: the field starts from the current text, not a draft from before or the text at first (L8E53)', async () => {
    let set: (e: { editing: boolean; value: string }) => void = () => {};
    function Own() {
      const [s, setS] = React.useState({ editing: false, value: 'Apollo' });
      set = setS;
      return <InlineEdit id="op" label="Name" value={s.value} editing={s.editing} onEditingChange={(editing) => setS((x) => ({ ...x, editing }))} validate={(v) => (v ? null : 'Required')} />;
    }
    await render(<Own />);
    set({ editing: true, value: 'Gemini' });
    await expect.poll(() => input('op')?.value).toBe('Gemini');
    await userEvent.clear(input('op')!);
    await userEvent.keyboard('{Enter}');
    expect([root('op').textContent, input('op')!.getAttribute('aria-invalid')]).toEqual(['Required', 'true']);
    // Closed from outside (a Menu's Rename again, say), with the empty draft and its error still there.
    set({ editing: false, value: 'Gemini' });
    await expect.poll(() => input('op')).toBe(null);
    set({ editing: true, value: 'Mercury' });
    await expect.poll(() => input('op')?.value).toBe('Mercury');
    expect([root('op').textContent, input('op')!.getAttribute('aria-invalid')]).toEqual(['', null]);
  });

  test('opening moves nothing: the button and the field have the same height at sm, md and lg, and the text starts at the same x', async () => {
    const out: string[] = [];
    await render(<Box>{(['sm', 'md', 'lg'] as const).map((s) => <InlineEdit key={s} id={'s-' + s} size={s} label="Name" defaultValue="Apollo" />)}</Box>);
    for (const size of ['sm', 'md', 'lg'] as const) {
      const b = view('s-' + size).getBoundingClientRect(), x = (view('s-' + size).querySelector(TEXT) as HTMLElement).getBoundingClientRect().left;
      await userEvent.click(view('s-' + size));
      const box = input('s-' + size)!.parentElement!.getBoundingClientRect(), fx = input('s-' + size)!.getBoundingClientRect().left;
      out.push(`${size} ${Math.round(b.height)} ${Math.round(box.height)} ${Math.round(x - fx)}`);
      await userEvent.keyboard('{Escape}');
    }
    expect(out).toEqual(['sm 24 24 0', 'md 32 32 0', 'lg 44 44 0']);
  });

  test('contrast: the text and placeholder keep 4.5:1 on the page and on the hover background, in all six themes', async () => {
    await render(<Box><InlineEdit id="c" label="Name" defaultValue="Apollo" /><InlineEdit id="cp" label="Name" placeholder="Add a name" /><div id="hover-bg" style={{ background: 'var(--surface-muted)' }} /></Box>);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
      const page = css(root('c').parentElement).backgroundColor, hover = css(document.getElementById('hover-bg')).backgroundColor;
      for (const [id, need] of [['c', 4.5], ['cp', 4.5]] as const) {
        const fg = css(view(id).querySelector(TEXT)).color;
        for (const [where, bg] of [['page', page], ['hover', hover]]) { const r = contrast(fg, bg); if (r < need) low.push(`${th} ${id} on ${where} ${r.toFixed(2)}`); }
      }
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('no errors or warnings while rendering', async () => {
    const error = vi.spyOn(console, 'error'), warn = vi.spyOn(console, 'warn');
    await render(<InlineEdit label="Name" defaultValue="Apollo" />);
    expect([error.mock.calls, warn.mock.calls]).toEqual([[], []]);
    error.mockRestore(); warn.mockRestore();
  });
  test('autoFocus focuses the edit button, not the wrapper', async () => {
    await render(<><InlineEdit id="ia" label="Name" defaultValue="Apollo" autoFocus /></>);
    await expect.poll(() => document.activeElement).toBe(view('ia'));
    expect(root('ia').hasAttribute('autofocus')).toBe(false);
  });

  test('autoFocus with editing: the field takes focus', async () => {
    await render(<InlineEdit id="ib" label="Name" defaultValue="Apollo" editing autoFocus />);
    await expect.poll(() => document.activeElement).toBe(input('ib'));
  });

});
