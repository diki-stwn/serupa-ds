import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { SaveStatus } from './SaveStatus';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const said = () => document.querySelector('[data-dk-announcer]')?.textContent;

describe('SaveStatus', () => {
  test('each status: its words, an icon hidden from screen readers, and Try again only after an error; props reach the <div>', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const retry = vi.fn();
    const screen = await render(<SaveStatus id="s" ref={ref} className="extra" data-x="y" status="idle" onRetry={retry} />);
    const e = el('s');
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component, e.dataset.state, e.textContent]).toEqual(['DIV', true, 'dk-save-status dk-save-status--idle extra', 'y', 'save-status', 'idle', '']);
    const idle = e.getBoundingClientRect().height;
    await screen.rerender(<SaveStatus id="s" status="saving" onRetry={retry} />);
    expect([e.textContent, e.querySelectorAll('button').length]).toEqual(['Saving…', 0]);
    expect(Math.round(e.getBoundingClientRect().height)).toBe(Math.round(idle));   // no jump from idle
    await screen.rerender(<SaveStatus id="s" status="saved" onRetry={retry} />);
    expect([e.textContent, e.querySelectorAll('button').length]).toEqual(['Saved', 0]);
    await screen.rerender(<SaveStatus id="s" status="error" onRetry={retry} />);
    expect(e.textContent).toBe('Couldn’t save' + 'Try again');
    await userEvent.click(e.querySelector('button')!);
    expect(retry).toHaveBeenCalledTimes(1);
    for (const icon of e.querySelectorAll('svg')) expect(icon.closest('[aria-hidden="true"]') || icon.getAttribute('aria-hidden')).toBeTruthy();
  });

  test('saved with savedAt says how long ago, in a <time>', async () => {
    await render(<SerupaProvider locale="en-US"><SaveStatus id="s" status="saved" savedAt={Date.now() - 2 * 60 * 1000} /></SerupaProvider>);   // pinned: the time follows the browser's language
    expect(el('s').textContent).toBe('Saved 2 minutes ago');
    expect(el('s').querySelector('time')).not.toBeNull();
  });

  test('announces "Saved" and the error once, politely, when the status changes to them; not "Saving…", not the first render', async () => {
    const screen = await render(<SaveStatus id="s" status="saved" />);
    await expect.poll(announcerIdle).toBe(true);
    expect(said() || '').not.toContain('Saved');
    await screen.rerender(<SaveStatus id="s" status="saving" />);
    await expect.poll(announcerIdle).toBe(true);
    expect(said() || '').not.toContain('Saving');
    await screen.rerender(<SaveStatus id="s" status="saved" savedAt={Date.now()} />);
    await expect.poll(() => announcerIdle() && said()).toBe('Saved');
    await screen.rerender(<SaveStatus id="s" status="error" errorText="Couldn’t save: you’re offline" />);
    await expect.poll(() => announcerIdle() && said()).toBe('Couldn’t save: you’re offline');
    expect(document.querySelector('[data-dk-announcer]')!.getAttribute('aria-live')).toBe('polite');
  });

  test('Indonesian labels from the provider', async () => {
    await render(<SerupaProvider labels={idLabels}><SaveStatus id="s" status="error" onRetry={() => {}} /></SerupaProvider>);
    expect(el('s').textContent).toBe('Gagal menyimpan' + 'Coba lagi');
  });

  test('its text, and the error, read 4.5:1 on the page in all six themes', async () => {
    await render(<div style={{ background: 'var(--surface)' }} id="page"><SaveStatus id="ok" status="saved" /><SaveStatus id="bad" status="error" /></div>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = css(el('page')).backgroundColor;
      expect(contrast(css(el('ok')).color, bg), th).toBeGreaterThanOrEqual(4.5);
      expect(contrast(css(el('bad')).color, bg), th + ' error').toBeGreaterThanOrEqual(4.5);
    }
  });
});
