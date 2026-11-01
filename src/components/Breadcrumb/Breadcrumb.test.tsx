import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, iconPoints } from '../../../tools/test/vitest/helpers';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
// The trail as written: each item's text, ">" for a separator.
const trail = (id: string) => [...el(id).querySelectorAll('li')].map((li) => (li.querySelector(':scope > span[aria-hidden="true"]') ? '> ' : '') + li.querySelector(':scope > :not([aria-hidden])')!.textContent).join(' ');
const shownIcons = (e: Element) => [...e.querySelectorAll<HTMLElement>('[data-icon]')].filter((i) => css(i).display !== 'none');

const RouterLink = React.forwardRef<HTMLAnchorElement, { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ to, ...p }, ref) {
  return <a {...p} ref={ref} href={'#router' + to} data-router="" />;
});

function Home({ r }: { r?: React.Ref<HTMLElement> }) {
  return <Breadcrumb id="bdef" ref={r} className="extra" data-x="y">
    <BreadcrumbItem href="#home" icon="home">Home</BreadcrumbItem>
    <BreadcrumbItem href="#projects">Projects</BreadcrumbItem>
    <BreadcrumbItem href="#ignored">Website</BreadcrumbItem>
  </Breadcrumb>;
}
const Slash = () => <Breadcrumb id="bslash" separator="slash" aria-label="You are here">
  <BreadcrumbItem href="#a">A</BreadcrumbItem>
  <BreadcrumbItem as={RouterLink} to="/b">B</BreadcrumbItem>
  <BreadcrumbItem>C</BreadcrumbItem>
</Breadcrumb>;

describe('Breadcrumb', () => {
  test('a <nav aria-label="Breadcrumb"> holding an <ol> with one <li> per page; ref, className and props reach the nav', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Home r={r} />);
    const n = el('bdef'), ol = n.firstElementChild!;
    expect([n.tagName, n.getAttribute('aria-label'), n.className, n.dataset.component, r.current === n, n.dataset.x, ol.tagName, ol.children.length])
      .toEqual(['NAV', 'Breadcrumb', 'dk-breadcrumb extra', 'breadcrumb', true, 'y', 'OL', 3]);
  });

  test('items are links; the last is the current page: text with aria-current="page" and no href', async () => {
    await render(<Home />);
    expect([...el('bdef').querySelectorAll('li > :not([aria-hidden])')].map((e) => [e.tagName, e.getAttribute('href'), e.getAttribute('aria-current')].join(' ')))
      .toEqual(['A #home ', 'A #projects ', 'SPAN  page']);
  });

  test('separators: a 16px chevron_right at the start of each item after the first, hidden from screen readers, 6px from the links on both sides; an item can have a 16px icon', async () => {
    await render(<Home />);
    const s = q('#bdef .dk-breadcrumb__separator'), vis = shownIcons(s);
    expect([s.getAttribute('aria-hidden'), vis.map((i) => i.dataset.icon).join(), css(vis[0]).fontSize, s.parentElement!.tagName]).toEqual(['true', 'chevron_right', '16px', 'LI']);
    expect([...el('bdef').querySelectorAll('li')].map((li) => li.querySelectorAll(':scope > span[aria-hidden="true"]').length)).toEqual([0, 1, 1]);
    const a = q('#bdef a').getBoundingClientRect(), sr = s.getBoundingClientRect(), b = el('bdef').querySelectorAll('a')[1].getBoundingClientRect();
    expect([Math.round(sr.left - a.right), Math.round(b.left - sr.right)]).toEqual([6, 6]);
    const i = q('#bdef .dk-breadcrumb__icon .dk-icon');
    expect([i.dataset.icon, css(i).fontSize]).toEqual(['home', '16px']);
  });

  test('links are muted text-sm, text-colored and underlined on hover; the current page is text, font-medium', async () => {
    await render(<Home />);
    const a = q('#bdef a'), muted = color('var(--text-muted)'), text = color('var(--text)');
    expect([css(a).color, css(a).textDecorationLine, css(a).fontSize]).toEqual([muted, 'none', '14px']);
    await userEvent.hover(a);
    await expect.poll(() => [css(a).color, css(a).textDecorationLine]).toEqual([text, 'underline']);
    await userEvent.unhover(a);
    const c = css(q('#bdef [aria-current]'));
    expect([c.color, c.fontWeight]).toEqual([text, '500']);
  });

  test('as is typed (G10): an item takes the props of the element as names (RouterLink needs to), an <a>\'s by default', () => {
    const typed = [
      <BreadcrumbItem key="1" as={RouterLink} to="/b">B</BreadcrumbItem>,
      // @ts-expect-error RouterLink needs to
      <BreadcrumbItem key="2" as={RouterLink}>B</BreadcrumbItem>,
      // @ts-expect-error an <a> has no to
      <BreadcrumbItem key="3" href="#b" to="/b">B</BreadcrumbItem>,
    ];
    expect(typed.length).toBe(3);
  });

  test('separator="slash", a custom aria-label, and a router link through as', async () => {
    await render(<Slash />);
    const n = el('bslash'), r = n.querySelector('[data-router]')!;
    expect([n.getAttribute('aria-label'), n.querySelector('li > span[aria-hidden="true"]')!.textContent, r.getAttribute('href'), r.className])
      .toEqual(['You are here', '/', '#router/b', 'dk-breadcrumb__item dk-breadcrumb__link']);
  });

  test('maxItems={3}: the first, "…" (a button named by expandLabel), then the last two; pressing it shows every item and moves focus to the first one it showed', async () => {
    await render(<Breadcrumb id="bmax" maxItems={3} expandLabel="Show all">
      {['Home', 'Org', 'Team', 'Projects', 'Website', 'Settings'].map((l) => <BreadcrumbItem key={l} href={'#' + l}>{l}</BreadcrumbItem>)}
    </Breadcrumb>);
    expect(trail('bmax')).toBe('Home > … > Website > Settings');
    const b = q('#bmax .dk-breadcrumb__more') as HTMLButtonElement;
    expect([b.tagName, b.type, b.getAttribute('aria-label')]).toEqual(['BUTTON', 'button', 'Show all']);
    b.focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => trail('bmax')).toBe('Home > Org > Team > Projects > Website > Settings');
    await expect.poll(() => document.activeElement!.textContent).toBe('Org');
  });

  test('collapse="menu": "…" (named "More pages") opens a menu of the hidden pages as links, and the trail stays collapsed', async () => {
    await render(<Breadcrumb id="bmenu" maxItems={3} collapse="menu">
      {['Home', 'Org', 'Team', 'Projects', 'Website', 'Settings'].map((l) => <BreadcrumbItem key={l} href={'#' + l} icon={l === 'Org' ? 'home' : undefined}>{l}</BreadcrumbItem>)}
    </Breadcrumb>);
    expect(trail('bmenu')).toBe('Home > … > Website > Settings');
    const b = q('#bmenu .dk-breadcrumb__more') as HTMLButtonElement;
    expect([b.getAttribute('aria-label'), b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded')]).toEqual(['More pages', 'menu', 'false']);
    await userEvent.click(b);
    const menu = await expect.poll(() => document.querySelector('[role="menu"]')).toBeTruthy().then(() => q('[role="menu"]'));
    const links = [...menu.querySelectorAll('[role="menuitem"]')];
    expect([menu.getAttribute('aria-label'), links.map((l) => [l.tagName, l.getAttribute('href'), l.textContent].join(' ')), !!links[0].querySelector('[data-icon]')])
      .toEqual(['More pages', ['A #Org Org', 'A #Team Team', 'A #Projects Projects'], true]);
    await expect.poll(() => document.activeElement).toBe(links[0]);
    expect(trail('bmenu')).toBe('Home > … > Website > Settings');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => document.activeElement).toBe(b);
  });

  test('collapse="menu": a hidden page given as a router link keeps its own props in the menu (to, target, data-*), so it still goes there (L8E64)', async () => {
    await render(<Breadcrumb id="brouter" maxItems={2} collapse="menu">
      <BreadcrumbItem href="#home">Home</BreadcrumbItem>
      <BreadcrumbItem as={RouterLink} to="/org" data-track="org">Org</BreadcrumbItem>
      <BreadcrumbItem href="#help" target="_blank">Help</BreadcrumbItem>
      <BreadcrumbItem href="#here">Here</BreadcrumbItem>
    </Breadcrumb>);
    await userEvent.click(q('#brouter .dk-breadcrumb__more'));
    await expect.poll(() => document.querySelectorAll('[role="menu"] [role="menuitem"]').length).toBe(2);
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[role="menu"] [role="menuitem"]')];
    expect(links.map((l) => [l.getAttribute('href'), l.dataset.track ?? '', l.target, l.textContent])).toEqual([['#router/org', 'org', '', 'Org'], ['#help', '', '_blank', 'Help']]);
    await userEvent.keyboard('{Escape}');
  });

  test('the "…" button is named "Show all pages" by default', async () => {
    await render(<Breadcrumb id="bdef" maxItems={2}>
      {['Home', 'Org', 'Team'].map((l) => <BreadcrumbItem key={l} href={'#' + l}>{l}</BreadcrumbItem>)}
    </Breadcrumb>);
    expect(q('#bdef .dk-breadcrumb__more').getAttribute('aria-label')).toBe('Show all pages');
  });

  test('unknown separator falls back to the chevron; maxItems below 2 is ignored; right to left: the chevron points left', async () => {
    await render(<>
      {/* @ts-expect-error: an unknown separator, as plain JavaScript could pass */}
      <Breadcrumb id="bbad" separator="arrow" maxItems={1}><BreadcrumbItem href="#a">A</BreadcrumbItem><BreadcrumbItem href="#b">B</BreadcrumbItem><BreadcrumbItem href="#c">C</BreadcrumbItem></Breadcrumb>
      <div dir="rtl"><Breadcrumb id="brtl"><BreadcrumbItem href="#a">A</BreadcrumbItem><BreadcrumbItem>B</BreadcrumbItem></Breadcrumb></div>
    </>);
    expect([el('bbad').querySelectorAll('li > :not([aria-hidden])').length, (q('#bbad li > span[aria-hidden="true"] [data-icon]')).dataset.icon]).toEqual([3, 'chevron_right']);
    expect([...el('brtl').querySelectorAll('li > span[aria-hidden="true"] [data-icon]')].map(iconPoints).join()).toBe('left');
  });

  test('keyboard focus: a 2px ring on the link', async () => {
    await render(<Home />);
    const a = q('#bdef a');
    a.focus();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(a);
    expect([css(a).outlineStyle, css(a).outlineWidth]).toEqual(['solid', '2px']);
  });

  test('Breadcrumb tokens (--breadcrumb-text, --breadcrumb-gap) override one breadcrumb', async () => {
    await render(<Breadcrumb id="btok" style={{ '--breadcrumb-text': 'rgb(1, 2, 3)', '--breadcrumb-gap': '11px' } as React.CSSProperties}><BreadcrumbItem href="#a">A</BreadcrumbItem><BreadcrumbItem>B</BreadcrumbItem></Breadcrumb>);
    expect([css(q('#btok a')).color, css(q('#btok ol')).columnGap]).toEqual(['rgb(1, 2, 3)', '11px']);
  });

  test('contrast: links, the current page and separators keep 4.5:1 on surface in all six themes', async () => {
    await render(<><Home /><Slash /></>);
    // Colors transition: read each theme's own, not a mid-transition blend of the last one.
    const still = document.createElement('style');
    still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
    document.head.appendChild(still);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const sel of ['#bdef a', '#bdef [aria-current]', '#bslash .dk-breadcrumb__separator']) {
        const r = contrast(css(q(sel)).color, 'var(--surface)'); n++;
        if (r < 4.5) low.push(`${th} ${sel}: ${r.toFixed(2)}`);
      }
    }
    still.remove();
    expect([low, n]).toEqual([[], 18]);
  });

  // DU1: a long unbroken label ran 16px past a 320px screen, "…" was a 16×20 target, an icon-only item was a
  // nameless link, and an empty Breadcrumb left an empty nav landmark.
  test('at 320px a long unbroken label wraps inside; "…" reaches 24×24 like the links; an icon-only item with no name warns once; no items renders nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<>
      <div style={{ width: '320px' }}><Breadcrumb id="narrow" maxItems={2}>
        <BreadcrumbItem href="#a">Files</BreadcrumbItem><BreadcrumbItem href="#b">Middle</BreadcrumbItem>
        <BreadcrumbItem>quarterly-report-final-version-2026-10-25-reviewed.pdf</BreadcrumbItem>
      </Breadcrumb></div>
      <Breadcrumb id="icons"><BreadcrumbItem href="#h" icon="home" /><BreadcrumbItem href="#h2" icon="home" /><BreadcrumbItem href="#ok" icon="home" aria-label="Home" /><BreadcrumbItem>Page</BreadcrumbItem></Breadcrumb>
      <Breadcrumb id="empty" />
    </>);
    const box = el('narrow').getBoundingClientRect();
    const far = Math.max(...[...el('narrow').querySelectorAll('li')].map((li) => Math.round(li.getBoundingClientRect().right)));
    expect(far).toBeLessThanOrEqual(Math.round(box.right));
    const more = el('narrow').querySelector('button')!, r = more.getBoundingClientRect();
    const reach = [[r.left - 3, (r.top + r.bottom) / 2], [(r.left + r.right) / 2, r.top - 1.5]].map(([x, y]) => document.elementFromPoint(x, y) === more);
    expect(reach).toEqual([true, true]);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('BreadcrumbItem has no accessible name')).length).toBe(1);
    expect(document.getElementById('empty')).toBeNull();
  });

  test('no errors or React warnings', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<><Home /><Slash /></>);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('items inside a Fragment count: the last one is the current page, with no React error', async () => {
    const errors: string[] = [], log = console.error;
    console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); };
    try {
      await render(<Breadcrumb id="bfrag"><BreadcrumbItem href="/">Home</BreadcrumbItem><><BreadcrumbItem href="/p">Projects</BreadcrumbItem><BreadcrumbItem>Website</BreadcrumbItem></></Breadcrumb>);
      expect(trail('bfrag')).toBe('Home > Projects > Website');
      expect(el('bfrag').querySelector('[aria-current="page"]')!.textContent).toBe('Website');
      expect(errors).toEqual([]);
    } finally { console.error = log; }
  });
});

describe('Breadcrumb on another page (L8E102)', () => {
  test('a trail expanded with "…" starts collapsed again once the trail changes (the layout, and Breadcrumb, stay mounted); it stayed expanded for every page after', async () => {
    const T = ({ at }: { at: string }) => <Breadcrumb id="l8e102" maxItems={3} expandLabel="Show all">
      <BreadcrumbItem href="#home">Home</BreadcrumbItem><BreadcrumbItem href="#a">A</BreadcrumbItem><BreadcrumbItem href="#b">B</BreadcrumbItem>
      <BreadcrumbItem href={'#c' + at}>C{at}</BreadcrumbItem><BreadcrumbItem href={'#d' + at}>D{at}</BreadcrumbItem>
    </Breadcrumb>;
    const r = await render(<T at="1" />);
    await userEvent.click(el('l8e102').querySelector('button[aria-label="Show all"]')!);
    expect(trail('l8e102')).toBe('Home > A > B > C1 > D1');
    await r.rerender(<T at="2" />);
    expect(trail('l8e102')).toBe('Home > … > C2 > D2');
    await r.rerender(<T at="2" />);
    expect(trail('l8e102')).toBe('Home > … > C2 > D2');
  });
});
