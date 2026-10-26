import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SearchInput } from './SearchInput';

// The button at a point just outside each edge of b (hit testing rounds to whole pixels, so 0.75px before the start
// and 0.25px after the end both land 1px out): the 24px box behind it (WCAG 2.5.8) takes presses there.
const reach = (b: HTMLElement) => {
  const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return [[r.left - 0.75, cy], [r.right + 0.25, cy], [cx, r.top - 0.75], [cx, r.bottom + 0.25]].map(([x, y]) => document.elementFromPoint(x, y)?.closest('button') === b);
};

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const box = (id: string) => field(id).parentElement as HTMLElement;
const clearBtn = (id: string) => box(id).querySelector<HTMLButtonElement>('button[aria-controls]');
// Transitions still running (a theme change can cancel one and start another, so poll rather than await .finished).
const settled = () => expect.poll(() => document.getAnimations().length).toBe(0);

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

const Wrap = ({ children }: { children: React.ReactNode }) => <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>;
const Main = ({ calls, sref, loading }: { calls: string[]; sref?: React.Ref<HTMLInputElement>; loading?: boolean }) => <>
  <label htmlFor="q">Search projects</label>
  <SearchInput id="q" ref={sref} className="extra" placeholder="Search projects" loading={loading} onSearch={(v) => { calls.push('search:' + v); }} />
</>;
function Controlled({ calls, now }: { calls: string[]; now: { value: string } }) {
  const [v, setV] = React.useState('atlas');
  now.value = v;
  return <SearchInput id="sctl" aria-label="Ctl" value={v} onChange={(e) => { calls.push('change:' + e.target.value); setV(e.target.value); }} onClear={() => { calls.push('clear'); }} />;
}

describe('SearchInput', () => {
  test('a press on the box (the search icon, the side padding) focuses the field with the caret at the end; a press on clear still clears (GE1)', async () => {
    await render(<div style={{ width: '300px' }}><SearchInput id="sp" size="lg" aria-label="Find" defaultValue="cats" /><button id="sp-away">away</button></div>);
    const y = box('sp').getBoundingClientRect().height / 2;
    for (const x of [2, 20]) {
      (document.getElementById('sp-away') as HTMLElement).focus();
      await userEvent.click(box('sp'), { position: { x, y } });
      expect([x, document.activeElement === field('sp'), field('sp').selectionStart]).toEqual([x, true, 4]);
    }
    await userEvent.click(clearBtn('sp')!);
    expect(field('sp').value).toBe('');
  });

  test('Input\'s box (32px) around a type="search" field with a search icon at the start and no clear button yet; ref to the input, className to the box', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Wrap><Main calls={[]} sref={ref} /></Wrap>);
    const i = field('q'), b = box('q'), ic = b.querySelector('.dk-search-input__icon')!;
    expect([i.type, i.getAttribute('enterkeyhint'), ref.current === i, b.className, b.dataset.component, b.getBoundingClientRect().height, i.labels![0].textContent])
      .toEqual(['search', 'search', true, 'dk-input dk-search-input dk-input--size-md extra', 'search-input', 32, 'Search projects']);
    expect([(ic.querySelector('[data-icon]') as HTMLElement).dataset.icon, ic.getAttribute('aria-hidden'), clearBtn('q')]).toEqual(['search', 'true', null]);
  });

  test('typing shows a × named "Clear search" controlling the field; Enter calls onSearch; the × clears the field, hides itself and keeps focus; Escape clears it (uncontrolled)', async () => {
    const calls: string[] = [];
    await render(<Wrap><Main calls={calls} /></Wrap>);
    await userEvent.click(field('q'));
    await userEvent.keyboard('road');
    await expect.poll(() => clearBtn('q')).not.toBeNull();
    expect([clearBtn('q')!.getAttribute('aria-label'), clearBtn('q')!.getAttribute('aria-controls'), clearBtn('q')!.type]).toEqual(['Clear search', 'q', 'button']);
    await userEvent.keyboard('{Enter}');
    expect(calls.join()).toBe('search:road');
    await userEvent.click(clearBtn('q')!);
    expect([field('q').value, clearBtn('q'), document.activeElement!.id]).toEqual(['', null, 'q']);
    await userEvent.keyboard('ab');
    await expect.poll(() => clearBtn('q')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => clearBtn('q')).toBeNull();
    expect(field('q').value).toBe('');
  });

  test('keyboard table: Tab reaches the field, then the × once there\'s text, then goes on (FH1)', async () => {
    await render(<Wrap><button id="kb-before">before</button><SearchInput id="kb-q" aria-label="Search" /><button id="kb-after">after</button></Wrap>);
    document.getElementById('kb-before')!.focus();
    await userEvent.tab();
    const empty = document.activeElement?.id;
    await userEvent.keyboard('road');
    await expect.poll(() => clearBtn('kb-q')).not.toBeNull();
    await userEvent.tab();
    const x = document.activeElement === clearBtn('kb-q');
    await userEvent.tab();
    expect([empty, x, document.activeElement?.id]).toEqual(['kb-q', true, 'kb-after']);
  });

  test('controlled: the × fires onChange with "" and then onClear, and the value follows; Escape clears it too, without reaching listeners outside (a dialog stays open)', async () => {
    const calls: string[] = [], now = { value: '' };
    await render(<Wrap><Controlled calls={calls} now={now} /></Wrap>);
    await userEvent.click(clearBtn('sctl')!);
    expect([calls.join(), now.value, clearBtn('sctl')]).toEqual(['change:,clear', '', null]);
    await userEvent.keyboard('x');
    await expect.poll(() => now.value).toBe('x');
    calls.length = 0;
    let outer = 0;
    const f = () => { outer++; };
    document.addEventListener('keydown', f);
    field('sctl').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', f);
    await expect.poll(() => calls.join()).toBe('change:,clear');
    expect(outer).toBe(0);
  });

  test('disabled: no clear button, even with text; lg: 44px, a 20px icon, clearLabel names the ×', async () => {
    await render(<Wrap>
      <SearchInput id="sdis" aria-label="Dis" disabled defaultValue="x" />
      <SearchInput id="slg" aria-label="Lg" size="lg" defaultValue="big" clearLabel="Clear" />
    </Wrap>);
    expect(clearBtn('sdis')).toBeNull();
    expect([Math.round(box('slg').getBoundingClientRect().height), clearBtn('slg')!.getAttribute('aria-label'), css(box('slg').querySelector('.dk-search-input__icon .dk-icon')).fontSize])
      .toEqual([44, 'Clear', '20px']);
  });

  test('loading: a 16px loader named "Searching" in place of the icon', async () => {
    const { rerender } = await render(<Wrap><Main calls={[]} /></Wrap>);
    await rerender(<Wrap><Main calls={[]} loading /></Wrap>);
    const ic = box('q').querySelector('.dk-search-input__icon')!, loader = () => ic.querySelector('[data-component=loader]');
    await expect.poll(loader).not.toBeNull();
    expect([loader()!.getAttribute('role'), loader()!.getAttribute('aria-label'), Math.round(loader()!.getBoundingClientRect().width), ic.getAttribute('aria-hidden')])
      .toEqual(['progressbar', 'Searching', 16, null]);
  });

  test('contrast: the icon and × keep 3:1 and the text 4.5:1 on the field in all six themes', async () => {
    await render(<Wrap><SearchInput id="slg" aria-label="Lg" size="lg" defaultValue="big" clearLabel="Clear" /></Wrap>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // Colors ease after a theme change; read the end state.
      for (const e of [box('slg'), ...box('slg').querySelectorAll('*')]) void css(e).color;
      await settled();
      const bg = css(box('slg')).backgroundColor;
      for (const [sel, min] of [['.dk-search-input__icon', 3], ['.dk-search-input__clear', 3], ['.dk-input__field', 4.5]] as const) {
        const r = contrast(css(box('slg').querySelector(sel)).color, bg); n++;
        if (r < min) low.push(`${th} ${sel} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
    expect(n).toBe(18);
  });

  test('the × is shaded on hover; --search-input-clear overrides one field', async () => {
    await render(<Wrap>
      <SearchInput id="slg" aria-label="Lg" size="lg" defaultValue="big" />
      <SearchInput id="stok" aria-label="Tok" defaultValue="x" style={{ '--search-input-clear': 'rgb(1, 2, 3)' } as React.CSSProperties} />
    </Wrap>);
    await userEvent.hover(clearBtn('slg')!);
    await expect.poll(() => css(clearBtn('slg')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    await expect.poll(() => css(clearBtn('stok')).color).toBe('rgb(1, 2, 3)');
  });
  test('form reset: the field empties (or goes back to defaultValue) and the × follows it, instead of staying on an empty field (Q1)', async () => {
    await render(<form id="rf"><SearchInput id="r1" aria-label="Search" /><SearchInput id="r2" aria-label="Search" defaultValue="apollo" /></form>);
    await userEvent.type(field('r1'), 'mars');
    await userEvent.fill(field('r2'), 'gemini');
    expect([!!clearBtn('r1'), !!clearBtn('r2')]).toEqual([true, true]);
    (document.getElementById('rf') as HTMLFormElement).reset();
    await expect.poll(() => !!clearBtn('r1')).toBe(false);
    expect([field('r1').value, field('r2').value, !!clearBtn('r2')]).toEqual(['', 'apollo', true]);
  });
  test('size sm: the clear button is 22px but takes presses over 24px (WCAG 2.5.8), past each edge, without moving anything', async () => {
    await render(<div style={{ width: '320px', padding: '8px' }}><SearchInput id="hb" aria-label="Search" size="sm" defaultValue="shoes" /></div>);
    const buttons = [document.querySelector<HTMLElement>('#hb')!.closest('.dk-input')!.querySelector<HTMLElement>('.dk-search-input__clear')!];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(Math.round(b.getBoundingClientRect().height)).toBeLessThan(24);
      expect(reach(b)).toEqual([true, true, true, true]);
    }
  });
});
