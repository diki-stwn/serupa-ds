import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Navbar, NavbarLink } from './Navbar';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const vis = (sel: string) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; };
const toggle = () => q('#nav .dk-navbar__toggle') as HTMLButtonElement;
const RouterLink = React.forwardRef<HTMLAnchorElement, { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ to, ...p }, ref) {
  return <a {...p} ref={ref} href={'#router' + to} data-router="" />;
});
const resize = async (w: number) => { await page.viewport(w, 700); await expect.poll(() => window.innerWidth).toBe(w); };
const away = () => userEvent.hover(document.body, { position: { x: 5, y: 600 } });

// The bar spans the page: no body padding, a 1100px wide screen.
beforeEach(async () => { document.body.style.padding = '0'; document.body.style.margin = '0'; await resize(1100); });
afterEach(async () => {
  document.body.style.padding = '16px'; document.body.style.margin = '';
  window.scrollTo(0, 0);
  history.replaceState(null, '', location.pathname + location.search);
  await page.viewport(900, 700);
});

function Main({ r, lr }: { r?: React.Ref<HTMLElement>; lr?: React.Ref<HTMLAnchorElement> }) {
  return <Navbar id="nav" ref={r} className="extra" data-x="y" brand={<a href="#home" id="brand">Serupa</a>} actions={<Button size="sm" id="act">Sign in</Button>}>
    <NavbarLink href="#dash" active ref={lr}>Dashboard</NavbarLink>
    <NavbarLink href="#projects" id="lp">Projects</NavbarLink>
    <NavbarLink as={RouterLink} {...{ to: '/team' }} id="lr">Team</NavbarLink>
  </Navbar>;
}

describe('Navbar', () => {
  test('a <header> with a <nav aria-label="Main"> list; 64px tall plus a 1px line; refs and props reach it', async () => {
    const r = React.createRef<HTMLElement>(), lr = React.createRef<HTMLAnchorElement>();
    await render(<Main r={r} lr={lr} />);
    const n = el('nav'), nav = n.querySelector('nav')!;
    expect([n.tagName, n.className, n.dataset.component, r.current === n, n.dataset.x, n.getBoundingClientRect().height, css(n).borderBottomWidth, nav.getAttribute('aria-label'), nav.querySelectorAll('li').length, lr.current?.tagName])
      .toEqual(['HEADER', 'dk-navbar extra', 'navbar', true, 'y', 65, '1px', 'Main', 3, 'A']);
  });

  test('wide screens: brand, links, then actions on the right, in a Container xl (1280px max, padded); no menu button', async () => {
    await render(<Main />);
    const [b, n, a] = ['#brand', '#nav nav', '#act'].map((s) => Math.round(q(s).getBoundingClientRect().left));
    expect(b < n && n < a && a > 900).toBe(true);
    const inner = q('#nav .dk-navbar__inner');
    expect([Math.round(inner.getBoundingClientRect().width), css(inner).paddingLeft]).toEqual([1100, '32px']);
    expect(vis('#nav .dk-navbar__toggle')).toBe(false);
  });

  test('links: muted text-sm font-medium; hover and the current page (aria-current="page") are shaded and text-colored', async () => {
    await render(<Main />);
    const cur = q('#nav [aria-current]');
    expect([cur.textContent, cur.getAttribute('aria-current')]).toEqual(['Dashboard', 'page']);
    const ls = css(el('lp')), rest = { color: ls.color, fontSize: ls.fontSize, fontWeight: ls.fontWeight, bg: ls.backgroundColor };
    const active = { color: css(cur).color, bg: css(cur).backgroundColor };
    expect([rest.fontSize, rest.fontWeight, rest.bg]).toEqual(['14px', '500', 'rgba(0, 0, 0, 0)']);
    expect(active.bg).not.toBe(rest.bg);
    expect(active.color).not.toBe(rest.color);
    await userEvent.hover(el('lp'));
    await expect.poll(() => [css(el('lp')).backgroundColor, css(el('lp')).color]).toEqual([active.bg, active.color]);
    await away();
  });

  test('forced colors: the current page keeps a 2px CanvasText outline, since the shading is dropped; other links have none', async () => {
    await render(<Main />);
    const cur = q('#nav [aria-current]');
    const r = await forcedColors(async (active) => (active ? [css(cur).outlineStyle, css(cur).outlineWidth, css(el('lp')).outlineStyle] : null));
    if (r) expect(r).toEqual(['solid', '2px', 'none']);
  });

  test('as: a router link with the link styles', async () => {
    await render(<Main />);
    const a = el('lr');
    expect([a.hasAttribute('data-router'), a.getAttribute('href'), a.className]).toEqual([true, '#router/team', 'dk-navbar__link']);
  });

  test('keyboard: Tab goes brand, links, actions; links show a focus ring', async () => {
    await render(<Main />);
    el('brand').focus();
    await userEvent.keyboard('{Tab}{Tab}');
    expect([document.activeElement?.id, css(document.activeElement).outlineStyle]).toEqual(['lp', 'solid']);
  });

  test('a Navbar with no links has no nav and no menu button; an unknown size falls back to xl', async () => {
    await render(<Navbar id="nbare" brand="Only a brand" size={'huge' as never} />);
    const n = el('nbare');
    expect([n.querySelector('nav'), n.querySelector('.dk-navbar__toggle'), n.querySelector('.dk-navbar__inner')!.className])
      .toEqual([null, null, 'dk-navbar__inner dk-container dk-container--padded dk-container--xl']);
  });

  test('sticky: stays at the top (z-40) while the page scrolls; aria-label names the nav; size lg', async () => {
    await render(<div>
      <Main />
      <Navbar id="nsticky" sticky size="lg" aria-label="Docs" menuLabel="Open the menu" brand="Docs"><NavbarLink href="#a">A</NavbarLink></Navbar>
      <div style={{ height: '2000px' }} />
    </div>);
    window.scrollTo(0, 600);
    await expect.poll(() => window.scrollY).toBe(600);
    const n = el('nsticky');
    expect([Math.round(n.getBoundingClientRect().top), css(n).zIndex, n.querySelector('nav')!.getAttribute('aria-label'), css(n.querySelector('.dk-navbar__inner')).maxWidth])
      .toEqual([0, '40', 'Docs', '1024px']);
  });

  test('tokens (--navbar-height, --navbar-link-text) override one navbar', async () => {
    await render(<Navbar id="ntok" style={{ '--navbar-height': '48px', '--navbar-link-text': 'rgb(1, 2, 3)' } as React.CSSProperties}><NavbarLink href="#t">T</NavbarLink></Navbar>);
    expect([q('#ntok .dk-navbar__inner').getBoundingClientRect().height, css(q('#ntok .dk-navbar__link')).color]).toEqual([48, 'rgb(1, 2, 3)']);
  });

  test('below 768px: the links hide behind a menu button (aria-expanded, aria-controls), at the right; menuLabel names the button', async () => {
    await render(<><Main /><Navbar id="nsticky" menuLabel="Open the menu" brand="Docs"><NavbarLink href="#a">A</NavbarLink></Navbar></>);
    await resize(500);
    const b = toggle();
    expect(vis('#nav nav')).toBe(false);
    expect([b.getAttribute('aria-label'), b.getAttribute('aria-expanded'), b.getAttribute('aria-controls') === q('#nav nav').id, b.querySelector<HTMLElement>('.dk-icon')?.dataset.icon, Math.round(b.getBoundingClientRect().right)])
      .toEqual(['Menu', 'false', true, 'menu', 484]);
    expect(q('#nsticky .dk-navbar__toggle').getAttribute('aria-label')).toBe('Open the menu');
  });

  test('pressing it opens the links in a full-width panel under the bar, one per line; the icon becomes close', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    const n = el('nav'), nav = n.querySelector('nav')!, r = nav.getBoundingClientRect(), top = [...nav.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top));
    const gap = Math.round(r.top - n.getBoundingClientRect().bottom);
    expect([toggle().getAttribute('aria-expanded'), toggle().querySelector<HTMLElement>('.dk-icon')?.dataset.icon, Math.round(r.width), top[0] < top[1] && top[1] < top[2]]).toEqual(['true', 'close', 500, true]);
    expect(gap <= 0 && gap >= -1).toBe(true);
  });

  test('open, Tab goes from the menu button into the links, in order (WCAG 2.4.3); Tab past the last one leaves the header and closes the menu', async () => {
    await render(<><Main /><button id="after">After</button></>);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) { await userEvent.tab(); seen.push((document.activeElement as HTMLElement).textContent || ''); }
    expect(seen).toEqual(['Dashboard', 'Projects', 'Team', 'After']);
    expect([toggle().getAttribute('aria-expanded'), vis('#nav nav')]).toEqual(['false', false]);
  });

  test('open, Shift+Tab from the first link goes back to the menu button, and the menu stays open', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect([document.activeElement === toggle(), toggle().getAttribute('aria-expanded')]).toEqual([true, 'true']);
  });

  test('closed, and on wide screens, Tab still goes brand, links, actions', async () => {
    await render(<Main />);
    el('brand').focus();
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) { await userEvent.tab(); seen.push((document.activeElement as HTMLElement).textContent || ''); }
    expect(seen).toEqual(['Dashboard', 'Projects', 'Team', 'Sign in']);
  });

  test('Escape closes it and returns focus to the menu button', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    el('lp').focus();
    await userEvent.keyboard('{Escape}');
    expect([toggle().getAttribute('aria-expanded'), document.activeElement === toggle(), vis('#nav nav')]).toEqual(['false', true, false]);
  });

  test('a press outside the bar closes it; a press inside it does not', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    el('brand').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(vis('#nav nav')).toBe(true);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await expect.poll(() => [toggle().getAttribute('aria-expanded'), vis('#nav nav')]).toEqual(['false', false]);
  });

  test('following a link closes it', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    await userEvent.click(el('lp'));
    expect([vis('#nav nav'), location.hash]).toEqual([false, '#projects']);
  });

  test('growing past 768px closes it, so it\'s closed when the screen shrinks again', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    await resize(1000);
    await expect.poll(() => el('nav').dataset.state).toBe('closed');
    await resize(500);
    expect(vis('#nav nav')).toBe(false);
  });

  test('contrast: links, and the current page and hovered links (text on the shaded background), keep 4.5:1 in all six themes', async () => {
    await render(<Main />);
    const cur = q('#nav [aria-current]'), low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // The links' colors transition into the new theme: read them once that's done.
      await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
      for (const [name, fg, bg] of [['link', css(el('lp')).color, css(el('nav')).backgroundColor], ['current page and hovered links', css(cur).color, css(cur).backgroundColor]] as const) {
        const r = contrast(fg, bg);
        if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('links inside a Fragment each get their own list item', async () => {
    await render(<Navbar id="nfrag" brand="Acme"><NavbarLink href="/">Home</NavbarLink><><NavbarLink href="/a">A</NavbarLink><NavbarLink href="/b">B</NavbarLink></>{false}</Navbar>);
    expect([...el('nfrag').querySelectorAll('.dk-navbar__links > li')].map((li) => li.textContent)).toEqual(['Home', 'A', 'B']);
  });
});
