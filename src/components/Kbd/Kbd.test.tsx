import * as React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Kbd } from './Kbd';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const caps = (id: string) => [...el(id).querySelectorAll<HTMLElement>('.dk-kbd__key')];
// What each keycap shows, with its name for screen readers in brackets when it has one.
const keys = (id: string) => caps(id).map((k) => k.textContent + (k.title ? `(${k.title})` : '')).join(' ');
// What a screen reader reads: the text that isn't aria-hidden.
const spoken = (id: string) => {
  const c = el(id).cloneNode(true) as HTMLElement;
  c.querySelectorAll('[aria-hidden]').forEach((x) => x.remove());
  return [...c.querySelectorAll('.dk-kbd__key')].map((k) => k.textContent).join(' + ');
};

// Kbd reads the platform after its first render; these stand in for a Windows PC or a Mac.
function device(platform: string, userAgent: string) {
  vi.spyOn(Navigator.prototype, 'platform', 'get').mockReturnValue(platform);
  vi.spyOn(Navigator.prototype, 'userAgent', 'get').mockReturnValue(userAgent);
  if ('userAgentData' in Navigator.prototype) vi.spyOn(Navigator.prototype as unknown as { userAgentData: unknown }, 'userAgentData', 'get').mockReturnValue(undefined);
}
const windows = () => device('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
afterEach(() => { vi.restoreAllMocks(); });

const Keys = () => <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
  <Kbd id="combo" keys={['mod', 'shift', 'P']} />
  <Kbd id="arrows" keys={['up', 'enter']} />
  <Kbd id="sm" size="sm" keys={['alt', 'F4']} />
</div>;

describe('Kbd', () => {
  test('one key: a <kbd> holding a 24px keycap <kbd>, at least square, in the sans font, "Esc" read as "Escape"; ref and className reach the outer <kbd>', async () => {
    windows();
    const r = React.createRef<HTMLElement>();
    await render(<><Kbd id="one" ref={r} className="extra">Esc</Kbd><Kbd id="k">k</Kbd></>);
    const e = el('one'), k = caps('one')[0];
    expect([e.tagName, k.tagName, e.textContent, spoken('one'), r.current === e, e.dataset.component]).toEqual(['KBD', 'KBD', 'EscEscape', 'Escape', true, 'kbd']);
    expect(e.className).toMatch(/extra/);
    expect([k.offsetHeight, k.offsetWidth >= 24]).toEqual([24, true]);
    expect(css(e).fontFamily).toMatch(/Inter/);
    expect(keys('k')).toBe('K');
  });

  test('key names are read in the provider\'s words: "Panah atas" and "Spasi" under id-ID', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Kbd id="kid" keys={['up', 'space']} /></SerupaProvider>);
    expect(spoken('kid')).toBe('Panah atas + Spasi');
  });

  test('a combination: one keycap per key, with a hidden + between them', async () => {
    windows();
    await render(<Keys />);
    expect(caps('combo').length).toBe(3);
    expect([...el('combo').querySelectorAll('.dk-kbd__plus')].map((x) => x.textContent + x.getAttribute('aria-hidden'))).toEqual(['+true', '+true']);
  });

  test('elsewhere than Apple: mod is Ctrl, shift is Shift, alt is Alt; arrows and Enter show as symbols with their names read out; sm is 20px', async () => {
    windows();
    await render(<Keys />);
    expect(keys('combo')).toBe('CtrlControl(Control) Shift P');
    expect(keys('sm')).toMatch(/^Alt/);
    expect(spoken('arrows')).toBe('Up arrow + Enter');
    expect(keys('arrows')).toMatch(/^↑/);
    expect(caps('sm')[0].offsetHeight).toBe(20);
  });

  test('on Apple devices: mod is ⌘ (read "Command"), shift ⇧, alt ⌥ (read "Option")', async () => {
    device('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    await render(<Keys />);
    expect(keys('combo')).toMatch(/^⌘Command\(Command\) ⇧Shift\(Shift\) P/);
    expect([spoken('combo'), spoken('sm')]).toEqual(['Command + Shift + P', 'Option + F4']);
  });

  test('inline in a sentence it sits with the text (centered within 3px of the words)', async () => {
    windows();
    await render(<p id="para" style={{ margin: 0 }}>Press <Kbd id="inline">/</Kbd> to search.</p>);
    const r = document.createRange(), text = el('para').firstChild!;
    r.setStart(text, 0); r.setEnd(text, 5);
    const word = r.getBoundingClientRect(), key = caps('inline')[0].getBoundingClientRect();
    expect(Math.abs((word.top + word.bottom) / 2 - (key.top + key.bottom) / 2)).toBeLessThanOrEqual(3);
  });

  test('contrast: labels and the + keep 4.5:1 in all six themes; --kbd-bg overrides one key', async () => {
    windows();
    await render(<><Keys /><Kbd id="tok" style={{ '--kbd-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}>T</Kbd></>);
    const k = caps('combo')[0], plus = el('combo').querySelector('.dk-kbd__plus')!, low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const [name, fg, bg] of [['label', css(k).color, css(k).backgroundColor], ['+', css(plus).color, 'var(--surface)']] as const) {
        const r = contrast(fg, bg);
        if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
    expect(css(caps('tok')[0]).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
