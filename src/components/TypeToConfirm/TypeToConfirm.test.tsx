import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { TypeToConfirm, type TypeToConfirmProps } from './TypeToConfirm';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const parts = (id: string) => {
  const root = el(id), input = root.querySelector('input')!, button = root.querySelector('button')!;
  return { root, input, button };
};
const described = (b: HTMLElement) => (b.getAttribute('aria-describedby') || '').split(' ').map((d) => document.getElementById(d)?.textContent).join(' ');
const Confirm = (p: Partial<TypeToConfirmProps> & { ref?: React.Ref<HTMLDivElement> }) => <TypeToConfirm id="t" phrase="acme/web" confirmLabel="Delete this repository" onConfirm={() => {}} {...p} />;

describe('TypeToConfirm', () => {
  test('a field labelled with the phrase and a destructive button; ref, className and other props reach the wrapper', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Confirm ref={ref} className="extra" data-x="y" hint="It can’t be undone." />);
    const { root, input, button } = parts('t');
    expect([root.tagName, ref.current === root, root.className, root.dataset.x, root.dataset.component]).toEqual(['DIV', true, 'dk-type-to-confirm extra', 'y', 'type-to-confirm']);
    expect(input.labels![0].textContent).toBe('To confirm, type acme/web');
    expect([input.autocomplete, input.spellcheck, input.getAttribute('autocapitalize'), input.getAttribute('autocorrect')]).toEqual(['off', false, 'off', 'off']);
    expect(described(input)).toContain('It can’t be undone.');
    expect([button.textContent.startsWith('Delete this repository'), button.getAttribute('aria-disabled'), button.disabled]).toEqual([true, 'true', false]);
    expect(described(button)).toContain('Type “acme/web” first');
  });

  test('the button works only once the phrase is typed (spaces around it ignored); Enter confirms; onMatch on each change', async () => {
    const confirm = vi.fn(), match = vi.fn();
    await render(<Confirm onConfirm={confirm} onMatch={match} />);
    const { input, button } = parts('t');
    button.click();   // aria-disabled: a press does nothing (Playwright won't press it at all)
    await userEvent.type(input, 'acme/we{Enter}');
    expect(confirm).not.toHaveBeenCalled();
    await userEvent.type(input, 'b ');
    await expect.poll(() => button.getAttribute('aria-disabled')).toBe(null);
    expect(match.mock.calls).toEqual([[true]]);
    await userEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(1);
    input.focus();
    await userEvent.keyboard('{Enter}');
    expect(confirm).toHaveBeenCalledTimes(2);
    await userEvent.type(input, 'x');
    await expect.poll(() => button.getAttribute('aria-disabled')).toBe('true');
    expect(match.mock.calls).toEqual([[true], [false]]);
  });

  test('case must match unless caseSensitive={false}; pasting works', async () => {
    const screen = await render(<Confirm />);
    await userEvent.type(parts('t').input, 'ACME/WEB');
    expect(parts('t').button.getAttribute('aria-disabled')).toBe('true');
    await screen.rerender(<Confirm caseSensitive={false} />);
    await expect.poll(() => parts('t').button.getAttribute('aria-disabled')).toBe(null);
    // Nothing blocks a paste: its default (inserting the text) goes ahead.
    const paste = new DataTransfer();
    paste.setData('text/plain', 'acme/web');
    const ev = new ClipboardEvent('paste', { clipboardData: paste, bubbles: true, cancelable: true });
    parts('t').input.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  test('disabled: the field and the button; Indonesian labels from the provider', async () => {
    const screen = await render(<Confirm disabled />);
    expect([parts('t').input.disabled, parts('t').button.getAttribute('aria-disabled') === 'true' || parts('t').button.disabled]).toEqual([true, true]);
    await screen.rerender(<SerupaProvider labels={idLabels}><Confirm /></SerupaProvider>);
    expect(parts('t').input.labels![0].textContent).toBe('Untuk mengonfirmasi, ketik acme/web');
    expect(described(parts('t').button)).toContain('Ketik “acme/web” dulu');
  });

  test('a promise from onConfirm: one press until it settles', async () => {
    let done = () => {};
    const confirm = vi.fn(() => new Promise<void>((r) => { done = r; }));
    await render(<Confirm onConfirm={confirm} />);
    const { input, button } = parts('t');
    await userEvent.type(input, 'acme/web');
    await userEvent.click(button);
    await userEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(1);
    await React.act(async () => { done(); });
  });
});
