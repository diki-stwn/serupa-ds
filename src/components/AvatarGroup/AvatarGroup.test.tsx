import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css } from '../../../tools/test/vitest/helpers';
import { Avatar, type AvatarSize } from '../Avatar/Avatar';
import { Tooltip } from '../Tooltip/Tooltip';
import { AvatarGroup } from './AvatarGroup';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const P = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds'];
const av = (n: number) => P.slice(0, n).map((x) => <Avatar key={x} name={x} size="lg" />);
const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const kids = (e: Element) => [...e.children] as HTMLElement[];
const more = (id: string) => el(id).querySelector<HTMLElement>('.dk-avatar-group__more');
const lap = (a: Element, b: Element) => Math.round(a.getBoundingClientRect().right - b.getBoundingClientRect().left);

/** Applies the stylesheets' @media (forced-colors: active) rules, as Windows High Contrast would, until the returned function is called. */
function forcedColors(): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && /forced-colors:\s*active/.test(r.media.mediaText)) { flipped.push([r.media, r.media.mediaText]); r.media.mediaText = 'all'; }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
  return () => { for (const [m, t] of flipped) m.mediaText = t; };
}

const Col = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>{children}</div>;

describe('AvatarGroup', () => {
  test('the "+N" avatar is named in the provider\'s words: "2 lainnya" under id-ID', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><AvatarGroup label="Tim" max={3}>{av(5)}</AvatarGroup></SerupaProvider>);
    expect(document.querySelector('.dk-avatar-group__more')!.getAttribute('aria-label')).toBe('2 lainnya');
  });

  test('a role="group" <div> named by label, with each avatar keeping its own name; no "+N" when all fit; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLDivElement>();
    await render(<AvatarGroup id="all" label="Assigned to" ref={r} className="extra" data-x="y">{av(3)}</AvatarGroup>);
    const g = el('all'), a = kids(g).map((i) => i.querySelector('.dk-avatar')!);
    expect([g.tagName, g.getAttribute('role'), g.getAttribute('aria-label'), a.length, a.map((e) => e.getAttribute('aria-label')).join('|'), !!more('all'), r.current === g, g.dataset.x, g.dataset.component])
      .toEqual(['DIV', 'group', 'Assigned to', 3, 'Ada Lovelace|Grace Hopper|Alan Turing', false, true, 'y', 'avatar-group']);
    expect(g.className).toMatch(/extra/);
  });

  test('max={3} of 5: three avatars, then "+2" (role img, "2 more") at the end; max={0}: only "+2"; avatars in a fragment count one by one', async () => {
    await render(<Col>
      <AvatarGroup id="max" max={3}>{av(5)}</AvatarGroup>
      <AvatarGroup id="zero" max={0}>{av(2)}</AvatarGroup>
      <AvatarGroup id="frag" max={2}><>{av(4)}</></AvatarGroup>
    </Col>);
    const g = el('max'), m = more('max')!;
    expect([g.querySelectorAll('.dk-avatar:not(.dk-avatar-group__more)').length, m.textContent, m.getAttribute('role'), m.getAttribute('aria-label'), m.querySelector('[aria-hidden="true"]') !== null, g.lastElementChild!.contains(m)])
      .toEqual([3, '+2', 'img', '2 more', true, true]);
    expect([el('zero').children.length, el('zero').textContent]).toEqual([1, '+2']);
    expect([el('frag').querySelectorAll('.dk-avatar:not(.dk-avatar-group__more)').length, more('frag')!.textContent]).toEqual([2, '+2']);
  });

  test('total={120} with 4 avatars: 116 more (written "99+"), and moreLabel names it; at xs, past 9, "+N" reads "9+" so it fits, and its name keeps the exact count', async () => {
    await render(<Col>
      <AvatarGroup id="tot" total={120} moreLabel={(n) => n + ' other members'}>{av(4)}</AvatarGroup>
      <AvatarGroup id="big" size="xs" total={120}>{av(4)}</AvatarGroup>
    </Col>);
    expect([more('tot')!.textContent, more('tot')!.getAttribute('aria-label')]).toEqual(['99+', '116 other members']);
    const m = more('big')!, s = m.querySelector('.dk-avatar__initials')!;
    expect([s.textContent, m.getAttribute('aria-label'), s.getBoundingClientRect().width <= m.getBoundingClientRect().width]).toEqual(['9+', '116 more', true]);
  });

  test('a negative max shows all, a total below the count is ignored, other children are dropped, and an unknown size is md', async () => {
    // @ts-expect-error: an unknown size, as plain JavaScript could pass
    await render(<AvatarGroup id="neg" max={-2} total={1} size="huge">{av(2)}text{null}</AvatarGroup>);
    const g = el('neg');
    expect([g.children.length, more('neg'), g.dataset.size, g.hasAttribute('aria-label')]).toEqual([2, null, 'md', false]);
  });

  test('size wins over each avatar\'s own (lg) and sets the "+N" too; overlap is 8px at xs/sm, 12px at md/lg and 16px at xl', async () => {
    await render(<Col>{SIZES.map((s) => <AvatarGroup key={s} data-s={s} size={s} max={2}>{av(3)}</AvatarGroup>)}</Col>);
    const want: Record<string, [number, number]> = { xs: [24, 8], sm: [32, 8], md: [40, 12], lg: [48, 12], xl: [64, 16] };
    for (const s of SIZES) {
      const g = document.querySelector(`[data-s="${s}"]`)!, a = kids(g);
      expect([s, Math.round(a[0].getBoundingClientRect().width), lap(a[0], a[1]), lap(a[1], a[2]), [...g.querySelectorAll<HTMLElement>('.dk-avatar')].map((e) => e.dataset.size).join('')])
        .toEqual([s, want[s][0], want[s][1], want[s][1], s.repeat(3)]);
    }
  });

  test('every avatar, "+N" included, has a 2px surface ring; earlier avatars sit on top of the next one; every status dot shows, not only the last one', async () => {
    await render(<Col>
      <AvatarGroup id="max" max={3}>{av(5)}</AvatarGroup>
      <AvatarGroup id="all">{av(3)}</AvatarGroup>
      <AvatarGroup id="st">{P.slice(0, 3).map((x) => <Avatar key={x} name={x} status="online" />)}</AvatarGroup>
    </Col>);
    const surface = color('var(--surface)');
    for (const i of kids(el('max'))) {
      const r = css(i.querySelector('.dk-avatar__frame')).boxShadow;
      expect(r).toContain(surface);
      expect(r).toMatch(/0px 0px 0px 2px/);
    }
    const a = kids(el('all')), r = a[0].getBoundingClientRect();
    expect(a[0].contains(document.elementFromPoint(r.right - 3, r.top + r.height / 2))).toBe(true);
    expect([...el('st').querySelectorAll('.dk-avatar__status')].map((d) => { const b = d.getBoundingClientRect(); return d === document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); })).toEqual([true, true, true]);
  });

  test('avatars wrapped in a Tooltip or a link still overlap, get the ring and take the group size; the Tooltip still opens on hover', async () => {
    await render(<AvatarGroup id="wrap" size="sm">
      <Tooltip content="Ada Lovelace"><Avatar name="Ada Lovelace" tabIndex={0} /></Tooltip>
      <a href="#g"><Avatar name="Grace Hopper" size="xl" /></a>
      <Avatar name="Alan Turing" />
    </AvatarGroup>);
    const a = [...el('wrap').querySelectorAll<HTMLElement>('.dk-avatar')];
    expect([a.length, a.map((e) => e.dataset.size).join(), lap(a[0], a[1]), lap(a[1], a[2]), css(a[0].querySelector('.dk-avatar__frame')).boxShadow !== 'none', Math.round(a[0].getBoundingClientRect().width)])
      .toEqual([3, 'sm,sm,sm', 8, 8, true, 32]);
    await userEvent.hover(a[0]);
    await expect.poll(() => (el('wrap').querySelector<HTMLElement>('[role="tooltip"]'))?.hidden).toBe(false);
  });

  test('RTL: the row runs right to left with the same overlap', async () => {
    await render(<div dir="rtl"><AvatarGroup id="rtl">{av(2)}</AvatarGroup></div>);
    const a = kids(el('rtl')).map((e) => e.getBoundingClientRect());
    expect([Math.round(a[1].right - a[0].left), a[1].left < a[0].left]).toEqual([12, true]);
  });

  test('component tokens (--avatar-group-overlap-md, --avatar-group-ring) override one group', async () => {
    await render(<AvatarGroup id="tok" style={{ '--avatar-group-overlap-md': '20px', '--avatar-group-ring': 'rgb(1, 2, 3)' } as React.CSSProperties}>{av(2)}</AvatarGroup>);
    const a = kids(el('tok'));
    expect([lap(a[0], a[1]), css(a[0].querySelector('.dk-avatar__frame')).boxShadow.includes('rgb(1, 2, 3)')]).toEqual([20, true]);
  });

  test('contrast: the "+N" text keeps 4.5:1 on its background in all six themes', async () => {
    await render(<AvatarGroup id="max" max={3}>{av(5)}</AvatarGroup>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const f = css(more('max')!.querySelector('.dk-avatar__frame')), r = contrast(f.color, f.backgroundColor); n++;
      if (r < 4.5) low.push(`${th} +N: ${r.toFixed(2)}`);
    }
    expect([low, n]).toEqual([[], 6]);
  });

  // DS1: "+N" was a span, so keyboard and touch users could never see who's behind it.
  test('showMore: "+2" is a button with the same name that Tab reaches; it opens a popover listing the hidden people by name, then "N more" for the unloaded ones', async () => {
    await render(<><button>before</button><AvatarGroup id="sm" label="Team" max={3} total={7} showMore>{av(5)}</AvatarGroup></>);
    const b = more('sm')!;
    expect([b.tagName, b.getAttribute('aria-label'), b.getAttribute('aria-expanded')]).toEqual(['BUTTON', '4 more', 'false']);
    await userEvent.click(document.querySelector('button')!);
    await userEvent.tab();
    expect(document.activeElement).toBe(b);
    expect(css(b).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => b.getAttribute('aria-expanded')).toBe('true');
    const pop = document.getElementById(b.getAttribute('aria-controls')!)!;
    expect([pop.getAttribute('aria-label'), [...pop.querySelectorAll('li')].map((li) => li.lastChild!.textContent)]).toEqual(['4 more', ['Katherine Johnson', 'Linus Torvalds', '2 more']]);
    // The list's avatars have alt="", so each name is read once.
    expect(pop.querySelectorAll('[role="img"]').length).toBe(0);
    // Unstyled, it keeps its list role in Safari too (FU1).
    expect(pop.querySelector('ul')!.getAttribute('role')).toBe('list');
  });

  test('onMore: "+N" is a button that calls it (and wins over showMore); without either it stays one image', async () => {
    const onMore = vi.fn();
    await render(<><AvatarGroup id="om" max={3} onMore={onMore} showMore>{av(5)}</AvatarGroup><AvatarGroup id="st" max={3}>{av(5)}</AvatarGroup></>);
    await userEvent.click(more('om')!);
    expect([onMore.mock.calls.length, more('om')!.getAttribute('aria-expanded'), more('st')!.tagName, more('st')!.getAttribute('role')]).toEqual([1, null, 'SPAN', 'img']);
  });

  test('contrast: the "+N" button keeps 4.5:1 on hover in all six themes', async () => {
    await render(<AvatarGroup id="hv" max={3} onMore={() => {}}>{av(5)}</AvatarGroup>);
    await userEvent.hover(more('hv')!);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const f = css(more('hv')!.firstElementChild), r = contrast(f.color, f.backgroundColor);
      if (r < 4.5) low.push(`${th}: ${r.toFixed(2)}`);
    }
    expect(low).toEqual([]);
  });

  test('forced colors: no ring, each avatar keeps its border', async () => {
    const restore = forcedColors();
    try {
      await render(<AvatarGroup id="max" max={3}>{av(5)}</AvatarGroup>);
      const c = css(el('max').querySelector('.dk-avatar__frame'));
      expect([c.boxShadow, c.borderTopStyle]).toEqual(['none', 'solid']);
    } finally { restore(); }
  });

  test('no errors on the page (nor console errors)', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<Col>
      <AvatarGroup max={3}>{av(5)}</AvatarGroup>
      <AvatarGroup max={-2} total={1}>{av(2)}text{null}</AvatarGroup>
      <AvatarGroup size="sm"><Tooltip content="Ada"><Avatar name="Ada Lovelace" tabIndex={0} /></Tooltip><a href="#g"><Avatar name="Grace Hopper" /></a></AvatarGroup>
      <AvatarGroup max={2}><>{av(4)}</></AvatarGroup>
    </Col>);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
