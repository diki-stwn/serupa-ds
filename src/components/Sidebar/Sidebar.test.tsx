import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { config, configure } from '../../internal/config';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press } from '../../../tools/test/vitest/helpers';
import { Badge } from '../Badge/Badge';
import { Sidebar, SidebarItem as I, SidebarSection as S } from './Sidebar';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const rect = (e: Element) => e.getBoundingClientRect();
const pick = (e: Element, ks: Array<keyof CSSStyleDeclaration>) => { const s = css(e); return ks.map((k) => s[k]); };
const away = () => userEvent.hover(document.body, { position: { x: 880, y: 680 } });

const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(function RouterLink({ to, ...p }, ref) {
  return <a {...p} ref={ref} href={'#router' + to} data-router="" />;
});

let setCollapsed: (v: boolean) => void = () => {};
function App(props: { sref?: React.Ref<HTMLElement>; iref?: React.Ref<HTMLAnchorElement> }) {
  const [collapsed, set] = React.useState(false); setCollapsed = set;
  return <div style={{ display: 'flex', height: '600px' }}>
    <Sidebar id="sb" ref={props.sref} className="extra" data-x="y" collapsed={collapsed} header={<strong id="hdr">Acme</strong>} footer={<span id="ftr">Ada</span>}>
      <S>
        <I href="#home" icon="home" label="Home" active id="ihome" ref={props.iref} />
        <I href="#inbox" icon="inbox" label="Inbox" badge={<Badge count={4} />} id="iinbox" />
      </S>
      <S title="Workspace">
        <I icon="folder" label="Projects" id="gproj">
          <I href="#web" label="Website" id="iweb" />
          <I href="#app" label="Mobile app" active={false} />
        </I>
        <I icon="group" label="Team" id="gteam" defaultOpen={false}>
          <I href="#members" label="Members" active id="imembers" />
        </I>
        <I as={RouterLink} {...{ to: '/reports' }} icon="bar_chart" label="Reports" id="irep" />
      </S>
    </Sidebar>
    <Sidebar id="sloose" aria-label="Docs"><I href="#x" label="Loose" icon="star" /><I href="#y" label="Item" /></Sidebar>
    <Sidebar id="stok" style={{ '--sidebar-width': '200px', '--sidebar-item-text': 'rgb(1, 2, 3)' } as React.CSSProperties}><I href="#t" label="T" /></Sidebar>
  </div>;
}

describe('Sidebar', () => {
  test('a <nav aria-label="Main">, 256px wide, the parent\'s height, a 1px inner edge; refs and props reach it', async () => {
    const sref = React.createRef<HTMLElement>(), iref = React.createRef<HTMLAnchorElement>();
    await render(<App sref={sref} iref={iref} />);
    const n = el('sb'), r = rect(n);
    expect([n.tagName, n.getAttribute('aria-label'), n.className, n.dataset.component, n.dataset.x]).toEqual(['NAV', 'Main', 'dk-sidebar extra', 'sidebar', 'y']);
    expect([sref.current === n, iref.current?.id]).toEqual([true, 'ihome']);
    expect([Math.round(r.width), Math.round(r.height), css(n).borderRightWidth]).toEqual([256, 600, '1px']);
  });

  test('header at the top, footer pinned to the bottom', async () => {
    await render(<App />);
    const top = rect(el('sb')).top;
    expect(rect(el('hdr')).top - top).toBeLessThan(30);
    expect(rect(el('ftr')).bottom - top).toBeGreaterThan(560);
  });

  test('items: links in list items, a 20px icon, text-sm font-medium, 8px by 12px padding; the current page has aria-current="page"', async () => {
    await render(<App />);
    const a = el('ihome'), s = css(a), icon = a.querySelector<HTMLElement>('.dk-icon')!;
    expect([a.tagName, a.parentElement!.tagName, a.getAttribute('aria-current'), icon.dataset.icon, css(icon).fontSize]).toEqual(['A', 'LI', 'page', 'home', '20px']);
    expect([s.fontSize, s.fontWeight, s.paddingTop, s.paddingLeft]).toEqual(['14px', '500', '8px', '12px']);
  });

  test('muted items, shaded and text-colored on hover; the current page the same', async () => {
    await render(<App />);
    const keys: Array<keyof CSSStyleDeclaration> = ['color', 'backgroundColor'];
    await expect.poll(() => pick(el('iinbox'), keys)[1]).toBe('rgba(0, 0, 0, 0)');
    const rest = pick(el('iinbox'), keys), current = pick(el('ihome'), keys);
    expect(current[0]).not.toBe(rest[0]);
    await userEvent.hover(el('iinbox'));
    await expect.poll(() => pick(el('iinbox'), keys)).toEqual(current);
    await away();
  });

  test('a badge sits at the end, 12px in', async () => {
    await render(<App />);
    const b = el('iinbox').querySelector('.dk-sidebar__badge')!;
    expect([b.textContent, Math.round(rect(el('iinbox')).right - rect(b).right)]).toEqual(['4', 12]);
  });

  test('a section title: muted text-xs, naming its list', async () => {
    await render(<App />);
    const s = el('sb').querySelectorAll('.dk-sidebar__section')[1], ti = s.querySelector('.dk-sidebar__section-title')!, ul = s.querySelector('ul')!;
    expect([ti.textContent, css(ti).fontSize, ul.getAttribute('aria-labelledby') === ti.id]).toEqual(['Workspace', '12px', true]);
  });

  test('a group is a button (aria-expanded, aria-controls), closed when no child is active; pressing it shows the nested items, lined up with its label, and the chevron turns', async () => {
    await render(<App />);
    const b = el('gproj'), list = el(b.getAttribute('aria-controls')!);
    expect([b.tagName, b.getAttribute('aria-expanded'), list.hidden]).toEqual(['BUTTON', 'false', true]);
    await userEvent.click(b);
    expect([b.getAttribute('aria-expanded'), rect(el('iweb')).height > 0]).toEqual(['true', true]);
    await expect.poll(() => css(b.querySelector('.dk-sidebar__chevron')).rotate).toBe('180deg');
    expect(Math.round(rect(b.querySelector('.dk-sidebar__label')!).left - rect(el('iweb').querySelector('.dk-sidebar__label')!).left)).toBe(0);
  });

  test('defaultOpen={false} keeps a group with the active page closed; the group is still text-colored', async () => {
    await render(<App />);
    expect([el('gteam').getAttribute('aria-expanded'), el('gteam').classList.contains('dk-sidebar__item--active')]).toEqual(['false', true]);
  });

  test('as: renders a router link', async () => {
    await render(<App />);
    expect([el('irep').hasAttribute('data-router'), el('irep').getAttribute('href')]).toEqual([true, '#router/reports']);
  });

  test('keyboard: Tab moves through items and groups, with a focus ring', async () => {
    await render(<App />);
    el('ihome').focus();
    await userEvent.keyboard('{Tab}{Tab}');
    expect([document.activeElement!.id, css(document.activeElement).outlineStyle]).toEqual(['gproj', 'solid']);
  });

  test('items placed directly in the Sidebar get a list; aria-label names it', async () => {
    await render(<App />);
    const n = el('sloose');
    expect([n.getAttribute('aria-label'), n.querySelectorAll('ul > li').length, n.querySelector('.dk-sidebar__body > ul') !== null]).toEqual(['Docs', 2, true]);
  });

  test('Sidebar tokens (--sidebar-width, --sidebar-item-text) override one sidebar', async () => {
    await render(<App />);
    const n = el('stok');
    await expect.poll(() => Math.round(rect(n).width)).toBe(200);
    expect(css(n.querySelector('a')).color).toBe('rgb(1, 2, 3)');
  });

  test('collapsed: a 64px rail of centered icons; labels, section titles and badges hidden on screen (still read); a dot on the icon of an item with a badge', async () => {
    await render(<App />);
    React.act(() => setCollapsed(true));
    await expect.poll(() => Math.round(rect(el('sb')).width)).toBe(64);
    const a = el('ihome'), r = rect(a), i = rect(a.querySelector('.dk-icon')!);
    expect(rect(a.querySelector('.dk-sidebar__label')!).width).toBeLessThanOrEqual(1);
    expect(Math.abs(Math.round((i.left + i.right) / 2 - (r.left + r.right) / 2))).toBeLessThanOrEqual(1);
    const badge = el('iinbox').querySelector('.dk-sidebar__badge')!, dot = el('iinbox').querySelector('.dk-sidebar__dot')!, icon = rect(el('iinbox').querySelector('.dk-icon')!), d = rect(dot);
    expect([rect(badge).width <= 1, badge.textContent, dot.getAttribute('aria-hidden'), Math.round(d.width), el('ihome').querySelector('.dk-sidebar__dot')]).toEqual([true, '4', 'true', 8, null]);
    expect([Math.round(d.top - icon.top), Math.round(d.right - icon.right)]).toEqual([-2, 2]);   // on the icon's top end corner
    expect(rect(el('sb').querySelector('.dk-sidebar__section-title')!).width).toBeLessThanOrEqual(1);
  });

  test('collapsed: focus shows the label as a tooltip to the right, and the tooltip names the link', async () => {
    await render(<App />);
    React.act(() => setCollapsed(true));
    await expect.poll(() => Math.round(rect(el('sb')).width)).toBe(64);
    el('ihome').focus();
    const tip = () => document.getElementById(el('ihome').getAttribute('aria-labelledby') || '');
    await expect.poll(() => tip()?.matches(':popover-open')).toBe(true);
    expect(tip()!.textContent).toBe('Home');
    expect(Math.round(rect(tip()!).left - rect(el('ihome')).right)).toBeGreaterThan(0);
  });

  test('collapsed: a group opens its items in a menu', async () => {
    await render(<App />);
    React.act(() => setCollapsed(true));
    await expect.poll(() => Math.round(rect(el('sb')).width)).toBe(64);
    await userEvent.click(el('sb').querySelector('.dk-sidebar__section:nth-child(2) li:first-child button')!);
    const menu = () => [...document.querySelectorAll('[role="menu"]')].find((x) => x.matches(':popover-open'));
    await expect.poll(() => !!menu()).toBe(true);
    expect([...menu()!.querySelectorAll('[role="menuitem"]')].map((i) => [i.tagName, i.getAttribute('href'), i.textContent].join(':'))).toEqual(['A:#web:Website', 'A:#app:Mobile app']);
    await userEvent.keyboard('{Escape}');
  });

  test('collapsed: a group button also shows its label as a tooltip on focus, and still opens its menu', async () => {
    await render(<Sidebar id="stip" collapsed>
      <I icon="folder" label="Docs" id="gtip"><I href="#intro" label="Intro" /></I>
    </Sidebar>);
    el('gtip').focus();
    const tip = () => document.getElementById((el('gtip').getAttribute('aria-labelledby') || '').split(' ').pop() || '');
    await expect.poll(() => tip()?.matches(':popover-open')).toBe(true);
    expect([tip()!.textContent, el('gtip').getAttribute('aria-haspopup')]).toEqual(['Docs', 'menu']);
    await userEvent.click(el('gtip'));
    await expect.poll(() => [...document.querySelectorAll('[role="menu"]')].some((x) => x.matches(':popover-open'))).toBe(true);
    await userEvent.keyboard('{Escape}');
  });

  test('the ref reaches a group item\'s button, expanded and in the rail', async () => {
    const open = React.createRef<HTMLAnchorElement>(), railed = React.createRef<HTMLAnchorElement>();
    await render(<>
      <Sidebar collapsed={false}><I ref={open} icon="folder" label="Docs" id="gref1"><I href="#a" label="A" /></I></Sidebar>
      <Sidebar collapsed><I ref={railed} icon="folder" label="Docs" id="gref2"><I href="#b" label="B" /></I></Sidebar>
    </>);
    expect([open.current === el('gref1'), railed.current === el('gref2'), el('gref2').tagName]).toEqual([true, true, 'BUTTON']);
  });

  test('links go through the app\'s configure({ link }) component; as still wins for one item (BL1)', async () => {
    const Marked = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Marked(p, r) { return <a {...p} ref={r} data-marked="" />; });
    const was = config.link;
    configure({ link: Marked });
    try {
      await render(<Sidebar><I href="#m" label="Marked" id="lm" /><I as="a" href="#p" label="Plain" id="lp" /></Sidebar>);
      expect([el('lm').hasAttribute('data-marked'), el('lp').hasAttribute('data-marked')]).toEqual([true, false]);
    } finally { config.link = was; }
  });

  test('a group opens and shows active when a grandchild is the current page', async () => {
    await render(<Sidebar id="snest" collapsed={false}>
      <I icon="folder" label="Docs" id="gdocs">
        <I label="Guides" id="gguides"><I href="#g1" label="Getting started" active id="ig1" /></I>
        <I as={RouterLink} {...{ to: '/api' }} label="API" />
      </I>
    </Sidebar>);
    // Expanded: Docs and Guides open, and both show as active, though only a grandchild is the current page.
    expect([el('gdocs').getAttribute('aria-expanded'), el('gguides').getAttribute('aria-expanded'), el('gdocs').classList.contains('dk-sidebar__item--active'), el('ig1').getAttribute('aria-current')]).toEqual(['true', 'true', true, 'page']);
  });

  test('collapsed rail menu: router links stay router links, and the current page is marked', async () => {
    await render(<Sidebar id="srail" collapsed>
      <I icon="folder" label="Docs" id="grail">
        <I href="#intro" label="Intro" active />
        <I as={RouterLink} {...{ to: '/api' }} label="API" target="_self" />
      </I>
    </Sidebar>);
    await userEvent.click(el('grail'));
    const menu = () => [...document.querySelectorAll('[role="menu"]')].find((x) => x.matches(':popover-open'));
    await expect.poll(() => !!menu()).toBe(true);
    const items = [...menu()!.querySelectorAll('[role="menuitem"]')];
    expect(items.map((i) => [i.tagName, i.getAttribute('href'), i.getAttribute('aria-current'), i.hasAttribute('data-router'), i.getAttribute('target')].join(':'))).toEqual(['A:#intro:page:false:', 'A:#router/api::true:_self']);
    await userEvent.keyboard('{Escape}');
  });

  test('contrast: items, the current page and hovered items, and section titles keep 4.5:1 in all six themes', async () => {
    await render(<App />);
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = css(el('sb')).backgroundColor, cur = css(el('ihome'));
      const pairs: Array<[string, string, string]> = [['item', css(el('iinbox')).color, bg], ['current page and hovered items', cur.color, cur.backgroundColor], ['section title', css(el('sb').querySelector('.dk-sidebar__section-title')).color, bg]];
      for (const [name, fg, on] of pairs) { const r = contrast(fg, on); n++; if (r < 4.5) low.push(`${th} ${name}: ${r.toFixed(2)}`); }
    }
    still.remove();
    expect([low, n]).toEqual([[], 18]);
  });

  test('contrast: the collapsed rail\'s badge dot keeps 3:1 on the sidebar and on the current page\'s highlight in all six themes', async () => {
    await render(<App />);
    React.act(() => setCollapsed(true));
    await expect.poll(() => el('iinbox').querySelector('.dk-sidebar__dot')).not.toBeNull();
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const dot = css(el('iinbox').querySelector('.dk-sidebar__dot')).backgroundColor;
      for (const [name, on] of [['sidebar', css(el('sb')).backgroundColor], ['highlight', color('var(--sidebar-item-bg-active, var(--highlight))')]]) {
        const r = contrast(dot, on); n++; if (r < 3) low.push(`${th} on ${name}: ${r.toFixed(2)}`);
      }
    }
    expect([low, n]).toEqual([[], 12]);
  });

  test('pressed: an item held down fills with pressed, one step past hover', async () => {
    await render(<App />);
    const i = el('iinbox');
    await press(i, () => expect.poll(() => css(i).backgroundColor).toBe(color('var(--pressed)')));
    await away();
  });

  test('nested items inside a Fragment count: a group with the current page inside opens on its own', async () => {
    await render(<Sidebar id="sfrag"><I href="/" icon="home" label="Home" /><I label="Teams" icon="group"><><I href="/t1" label="One" /><I href="/t2" label="Two" active /></></I></Sidebar>);
    const group = [...el('sfrag').querySelectorAll<HTMLElement>('[aria-expanded]')].find((b) => b.textContent.includes('Teams'))!;
    expect(group.getAttribute('aria-expanded')).toBe('true');
  });
});
