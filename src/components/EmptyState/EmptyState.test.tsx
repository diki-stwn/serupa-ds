import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { EmptyState } from './EmptyState';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const part = (id: string, name: string) => el(id).querySelector<HTMLElement>(`.dk-empty-state__${name}`);
const rect = (e: Element) => e.getBoundingClientRect();
const near = (a: number, b: number) => Math.abs(a - b) <= 1;

function Projects({ r }: { r?: React.Ref<HTMLDivElement> }) {
  return <EmptyState id="edef" ref={r} className="extra" data-x="y" icon="folder_open" title="No projects yet" description="Create a project to start tracking your work."
    actions={[<Button key="n" id="act">New project</Button>, <Button key="i" variant="outline">Import</Button>]} />;
}

describe('EmptyState', () => {
  test('centered, 48px padding; ref, className and attributes reach it', async () => {
    const r = React.createRef<HTMLDivElement>();
    await render(<div style={{ width: '600px' }}><Projects r={r} /></div>);
    const e = el('edef'), i = part('edef', 'icon')!, s = css(e);
    expect([e.className, e.dataset.component, r.current === e, e.dataset.x]).toEqual(['dk-empty-state extra', 'empty-state', true, 'y']);
    expect([s.paddingTop, s.textAlign]).toEqual(['48px', 'center']);
    expect(near((rect(i).left + rect(i).right) / 2, (rect(e).left + rect(e).right) / 2)).toBe(true);
  });

  test('a 24px icon in a 48px circle, hidden from screen readers', async () => {
    await render(<Projects />);
    const i = part('edef', 'icon')!;
    expect([i.getAttribute('aria-hidden'), i.offsetWidth, i.offsetHeight, css(i).borderRadius, css(i.querySelector('[data-icon]')).fontSize]).toEqual(['true', 48, 48, '9999px', '24px']);
  });

  test('an <h3> title (text-base, semibold), a <p> description (text-sm, at most 384px), then the actions, stacked 16px apart', async () => {
    await render(<Projects />);
    const t = part('edef', 'title')!, d = part('edef', 'description')!;
    expect([t.tagName, css(t).fontSize, css(t).fontWeight, d.tagName, css(d).fontSize, css(part('edef', 'text')).maxWidth]).toEqual(['H3', '16px', '600', 'P', '14px', '384px']);
    expect(el('edef').querySelectorAll('.dk-empty-state__actions button').length).toBe(2);
    const top = ['icon', 'title', 'description', 'actions'].map((n) => rect(part('edef', n)!).top);
    expect(top[0] < top[1] && top[1] < top[2] && top[2] < top[3]).toBe(true);
    expect(near(top[1] - (top[0] + 48), 16)).toBe(true);
  });

  test('size sm, dashed, headingLevel 4: 24px padding, a 40px circle, a text-sm <h4>, a 1px dashed frame with 8px corners; nothing for missing parts', async () => {
    await render(<EmptyState id="esm" size="sm" variant="dashed" icon="search_off" title="No results" headingLevel={4} />);
    const s = css(el('esm')), t = part('esm', 'title')!;
    expect([s.paddingTop, part('esm', 'icon')!.offsetWidth, t.tagName, css(t).fontSize]).toEqual(['24px', 40, 'H4', '14px']);
    expect([s.borderTopStyle, s.borderTopWidth, s.borderTopLeftRadius]).toEqual(['dashed', '1px', '8px']);
    expect([part('esm', 'description'), part('esm', 'actions')]).toEqual([null, null]);
  });

  test('an element as the icon (an illustration) shows at its own size, without the circle', async () => {
    await render(<EmptyState id="ecustom" icon={<svg width={80} height={60} />} title="Custom art" />);
    const i = part('ecustom', 'icon')!;
    expect([rect(i).width, rect(i).height, css(i).backgroundColor]).toEqual([80, 60, 'rgba(0, 0, 0, 0)']);
  });

  test('unknown size, variant and headingLevel fall back to md, plain and h3; no icon when none is given', async () => {
    await render(<EmptyState id="ebad" size={'xl' as never} variant={'boxed' as never} headingLevel={9 as never} title="Bad" />);
    expect([el('ebad').className, !!el('ebad').querySelector('h3'), part('ebad', 'icon')]).toEqual(['dk-empty-state', true, null]);
  });

  test('tokens (--empty-state-icon-box, --empty-state-title-color) override one empty state; the actions are reachable with the keyboard', async () => {
    await render(<><EmptyState id="etok" title="T" icon="inbox" style={{ '--empty-state-icon-box': '64px', '--empty-state-title-color': 'rgb(1, 2, 3)' } as React.CSSProperties} /><Projects /></>);
    expect([part('etok', 'icon')!.offsetWidth, css(part('etok', 'title')).color]).toEqual([64, 'rgb(1, 2, 3)']);
    el('act').focus();
    expect(document.activeElement).toBe(el('act'));
  });

  test('announce: the title and description are said politely as it appears, once; without announce nothing is said (FK1)', async () => {
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    const heard: string[] = [];
    const watch = new MutationObserver(() => { const a = document.querySelector('[data-dk-announcer]'); if (a && a.textContent !== heard[heard.length - 1]) heard.push(a.textContent || ''); });
    watch.observe(document.body, { childList: true, characterData: true, subtree: true });
    try {
      const Results = ({ q, found }: { q: string; found: boolean }) => found ? <p>3 projects</p>
        : <EmptyState id="none" announce icon="search_off" title={`No results for “${q}”`} description="Try another word or clear the filters" />;
      const r = await render(<Results q="m" found />);
      await r.rerender(<Results q="mars" found={false} />);
      await expect.poll(() => heard.filter(Boolean).join(' | '), { timeout: 3000 }).toBe('No results for “mars”. Try another word or clear the filters.');
      const region = document.querySelector('[data-dk-announcer]')!;
      expect([region.getAttribute('role'), region.getAttribute('aria-live')]).toEqual(['status', 'polite']);
      await r.rerender(<Results q="marsx" found={false} />);
      await r.rerender(<EmptyState title="Nothing here" />);
      await new Promise((res) => setTimeout(res, 700));
      expect(heard.filter(Boolean)).toEqual(['No results for “mars”. Try another word or clear the filters.']);
      expect(el('none')).toBeNull();
    } finally {
      watch.disconnect();
    }
  });

  test('announce with suggestions: the searches are said apart ("Did you mean: mars, maze."), not run together into one word (L8E62)', async () => {
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    const heard: string[] = [];
    const watch = new MutationObserver(() => { const a = document.querySelector('[data-dk-announcer]'); if (a && a.textContent) heard.push(a.textContent); });
    watch.observe(document.body, { childList: true, characterData: true, subtree: true });
    try {
      await render(<EmptyState announce title="No results for “marz”" suggestions={['mars', 'maze']} onSuggestion={() => {}} />);
      await expect.poll(() => heard[heard.length - 1], { timeout: 3000 }).toBe('No results for “marz”. Did you mean: mars, maze.');
    } finally {
      watch.disconnect();
    }
  });

  test('suggestions: "Did you mean:" and a link button per search that calls onSuggestion, 24px tall; plain text without onSuggestion (64)', async () => {
    const picked: string[] = [];
    await render(<>
      <EmptyState id="esug" title="No results for “marz”" suggestions={['mars', '', 'maze']} onSuggestion={(s) => picked.push(s)} />
      <EmptyState id="etxt" title="No results" suggestions={['mars']} />
    </>);
    const line = part('esug', 'suggestions')!;
    const buttons = [...line.querySelectorAll('button')];
    expect([line.tagName, line.textContent, buttons.map((b) => b.textContent)]).toEqual(['P', 'Did you mean:marsmaze', ['mars', 'maze']]);
    expect(line.parentElement!.className).toBe('dk-empty-state__text');
    expect(buttons.every((b) => b.offsetHeight >= 24 && css(b).textDecorationLine === 'underline')).toBe(true);
    buttons[1].click();
    expect(picked).toEqual(['maze']);
    const plain = part('etxt', 'suggestions')!;
    expect([plain.querySelector('button'), plain.querySelector('strong')!.textContent]).toEqual([null, 'mars']);
  });

  test('onClearFilters: a "Clear filters" button after the actions (sm in a small empty state) that calls it; Indonesian labels (64)', async () => {
    let cleared = 0;
    await render(<>
      <EmptyState id="eclr" size="sm" title="No results" actions={<Button id="other">New search</Button>} onClearFilters={() => cleared++} />
      <EmptyState id="eonly" title="No results" onClearFilters={() => cleared++} />
      <Button id="smref" size="sm">x</Button>
      <SerupaProvider labels={idLabels}><EmptyState id="eid" title="Tidak ada hasil" suggestions={['mars']} onClearFilters={() => cleared++} /></SerupaProvider>
    </>);
    const btns = [...part('eclr', 'actions')!.querySelectorAll('button')];
    expect([btns.map((b) => b.textContent.replace(/filter_alt_off/, '').trim()), btns[1].offsetHeight]).toEqual([['New search', 'Clear filters'], el('smref').offsetHeight]);
    btns[1].click();
    part('eonly', 'actions')!.querySelector('button')!.click();
    expect(cleared).toBe(2);
    expect([part('eid', 'suggestions')!.firstElementChild!.textContent, part('eid', 'actions')!.textContent.replace(/filter_alt_off/, '').trim()]).toEqual(['Mungkin maksud Anda:', 'Hapus filter']);
  });

  test('contrast: title and description 4.5:1 on surface, the icon 3:1 on its circle, in all six themes', async () => {
    await render(<Projects />);
    const i = part('edef', 'icon')!, low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const [name, fg, bg, need] of [['title', css(part('edef', 'title')).color, 'var(--surface)', 4.5], ['description', css(part('edef', 'description')).color, 'var(--surface)', 4.5], ['icon', css(i).color, css(i).backgroundColor, 3]] as const) {
        const r = contrast(fg, bg);
        if (r < need) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });
  test('a long action label wraps in a narrow box (200px) instead of widening the state past it (GR71)', async () => {
    await render(<div style={{ width: '200px' }}><EmptyState id="esn" title="No projects" description="Start one." actions={<Button>Create your first project from a template</Button>} /></div>);
    const b = el('esn').querySelector('button') as HTMLElement;
    expect([el('esn').getBoundingClientRect().width <= 201, b.getBoundingClientRect().right <= el('esn').getBoundingClientRect().right + 1, b.getBoundingClientRect().height > 40]).toEqual([true, true, true]);
    expect(b.textContent).toBe('Create your first project from a template');
  });
  test('a long "Did you mean" suggestion wraps in a narrow box (200px) instead of running past it (GR71)', async () => {
    await render(<div style={{ width: '200px' }}><EmptyState id="esw" title="No results" suggestions={['quarterly revenue forecast spreadsheet']} onSuggestion={() => {}} /></div>);
    const b = el('esw').querySelector('button') as HTMLElement;
    const box = el('esw').getBoundingClientRect();
    expect([box.width <= 201, b.getBoundingClientRect().right <= box.right + 1, b.scrollWidth <= b.clientWidth + 1, b.getBoundingClientRect().height > 30]).toEqual([true, true, true, true]);
  });
});
