import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { CopyButton } from './CopyButton';

const el = (id: string) => document.getElementById(id) as HTMLButtonElement;
const said = () => document.querySelector('[data-dk-announcer]')?.textContent;
const shout = () => document.querySelector('[data-dk-announcer-assertive]')?.textContent;
const shown = (id: string) => [...el(id).querySelectorAll('.dk-copy-btn__label')].filter((s) => !s.hasAttribute('aria-hidden')).map((s) => s.textContent).join();
const icon = (id: string) => el(id).querySelector<HTMLElement>('.dk-icon')!.dataset.icon;

let clip: string[];
let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  clip = [];
  writeText = vi.fn(async (t: string) => { clip.push(t); });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => { vi.useRealTimers(); });

describe('CopyButton', () => {
  test('a <button> "Copy" (outline, sm, a copy icon); pressing it copies value, shows a check and "Copied", says "Copied", then goes back after 2s; ref and props reach the button', async () => {
    const ref = React.createRef<HTMLButtonElement>(), copied: string[] = [];
    await render(<CopyButton id="c1" value="sk_live_1" ref={ref} data-x="y" onCopy={(t) => copied.push(t)} />);
    const b = el('c1');
    expect([b.tagName, b.type, ref.current === b, b.dataset.x, b.dataset.variant, b.dataset.size, shown('c1'), icon('c1'), b.hasAttribute('data-copied')]).toEqual(['BUTTON', 'button', true, 'y', 'outline', 'sm', 'Copy', 'content_copy', false]);
    await userEvent.click(b);
    await expect.poll(() => b.hasAttribute('data-copied')).toBe(true);
    expect([clip, copied, shown('c1'), icon('c1')]).toEqual([['sk_live_1'], ['sk_live_1'], 'Copied', 'check']);
    await expect.poll(() => announcerIdle() && said()).toBe('Copied');
    await expect.poll(() => b.hasAttribute('data-copied'), { timeout: 3500 }).toBe(false);
    expect([shown('c1'), icon('c1')]).toEqual(['Copy', 'content_copy']);
  });

  test('the width stays the same while it shows "Copied" (both labels share one cell, the hidden one isn\'t read out)', async () => {
    await render(<CopyButton id="w" value="x">OK</CopyButton>);
    await document.fonts.ready; // a font that finishes loading between the two reads changes the width
    const before = el('w').getBoundingClientRect().width;
    await userEvent.click(el('w'));
    await expect.poll(() => el('w').hasAttribute('data-copied')).toBe(true);
    expect(el('w').getBoundingClientRect().width).toBe(before);
    expect([...el('w').querySelectorAll('.dk-copy-btn__label[aria-hidden]')].map((s) => s.textContent)).toEqual(['OK']);
  });

  test('value as a function (sync or async) is called on press; children, copiedLabel and timeout change the words and the time', async () => {
    let n = 0;
    await render(<>
      <CopyButton id="f1" value={() => 'v' + (++n)}>Copy link</CopyButton>
      <CopyButton id="f2" value={async () => 'later'} copiedLabel="Link copied" timeout={300} />
    </>);
    await userEvent.click(el('f1'));
    await userEvent.click(el('f2'));
    await expect.poll(() => clip).toEqual(['v1', 'later']);
    expect([shown('f1'), shown('f2')]).toEqual(['Copied', 'Link copied']);
    await expect.poll(() => el('f2').hasAttribute('data-copied'), { timeout: 1000 }).toBe(false);
    expect(el('f1').hasAttribute('data-copied')).toBe(true);
  });

  test('iconOnly: just the icon, named by children with a tooltip; the name becomes "Copied" while the check shows', async () => {
    await render(<CopyButton id="io" value="npm i serupa-ds" iconOnly variant="ghost">Copy the command</CopyButton>);
    const b = el('io');
    expect([b.getAttribute('aria-label'), b.title, b.querySelector('.dk-copy-btn__labels'), b.hasAttribute('data-icon-only')]).toEqual(['Copy the command', 'Copy the command', null, true]);
    await userEvent.click(b);
    await expect.poll(() => b.getAttribute('aria-label')).toBe('Copied');
  });

  test('when the browser refuses: no check, labels.copyFailed said assertively, onCopyError called; your onClick runs first and preventDefault stops the copy', async () => {
    writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    vi.spyOn(document, 'execCommand').mockReturnValue(false);
    const errs: unknown[] = [], clicks: string[] = [];
    await render(<>
      <CopyButton id="bad" value="x" onCopyError={(e) => errs.push(e)} onClick={() => clicks.push('bad')} />
      <CopyButton id="stop" value="y" onClick={(e) => { clicks.push('stop'); e.preventDefault(); }} />
    </>);
    await userEvent.click(el('bad'));
    await expect.poll(() => errs.length).toBe(1);
    await expect.poll(() => announcerIdle() && shout()).toBe("Couldn't copy. Select the text and copy it yourself.");
    expect([el('bad').hasAttribute('data-copied'), clicks]).toEqual([false, ['bad']]);
    writeText.mockReset();
    await userEvent.click(el('stop'));
    expect([clicks, writeText.mock.calls.length, el('stop').hasAttribute('data-copied')]).toEqual([['bad', 'stop'], 0, false]);
    vi.restoreAllMocks();
  });

  test('without the Clipboard API it falls back to execCommand("copy") and keeps focus on the button', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    await render(<CopyButton id="old" value="legacy" />);
    await userEvent.click(el('old'));
    await expect.poll(() => el('old').hasAttribute('data-copied')).toBe(true);
    expect([exec.mock.calls[0][0], document.activeElement === el('old'), document.querySelector('textarea')]).toEqual(['copy', true, null]);
    vi.restoreAllMocks();
  });

  test('labels follow the provider: "Salin", "Disalin" in Indonesian', async () => {
    await render(<SerupaProvider labels={idLabels}><CopyButton id="id" value="x" /></SerupaProvider>);
    expect(shown('id')).toBe('Salin');
    await userEvent.click(el('id'));
    await expect.poll(() => shown('id')).toBe('Disalin');
  });

  test('contrast: the check keeps 3:1 on outline, ghost and secondary buttons in all six themes', async () => {
    await render(<>{(['outline', 'ghost', 'secondary'] as const).map((v) => <CopyButton key={v} id={'v-' + v} variant={v} value="x" />)}</>);
    for (const v of ['outline', 'ghost', 'secondary']) { await userEvent.click(el('v-' + v)); }
    await expect.poll(() => document.querySelectorAll('[data-copied]').length).toBe(3);
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const v of ['outline', 'ghost', 'secondary']) {
        const b = el('v-' + v), bg = css(b).backgroundColor === 'rgba(0, 0, 0, 0)' ? 'var(--surface)' : css(b).backgroundColor;
        const r = contrast(css(b.querySelector('.dk-copy-btn__icon--done')).color, bg); n++;
        if (r < 3) low.push(`${th} ${v} ${r.toFixed(2)}`);
      }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light'); still.remove();
    expect([low, n]).toEqual([[], 18]);
  });
});
