import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, forcedColors, keepMotion, press, withMotion } from '../../../tools/test/vitest/helpers';
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
    expect([Math.round(n.getBoundingClientRect().top), css(n).zIndex, n.querySelector('nav')!.getAttribute('aria-label'), css(n.querySelector('.dk-navbar__inner')).maxWidth]) // lg: 1024px of content plus 32px padding each side
      .toEqual([0, '40', 'Docs', '1088px']);
  });

  test('sticky: no shadow at the top of the page; scrolled under, the bar lifts with the shadow-scrolled token, tied to the scroll (149)', async () => withMotion(async () => {
    await render(<div>
      <Navbar id="nlift" sticky brand="Docs"><NavbarLink href="#a">A</NavbarLink></Navbar>
      <div style={{ height: '2000px' }} />
    </div>);
    const n = el('nlift'), shadow = () => css(n).boxShadow;
    // At the start of the range the shadow is there at zero strength: fully transparent, nothing drawn.
    const shows = () => shadow() !== 'none' && !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*$/.test(shadow());
    window.scrollTo(0, 0);
    await expect.poll(() => window.scrollY).toBe(0);
    expect(shows()).toBe(false);
    // Half a bar height down (64px bar), half the shadow: it follows the scroll.
    window.scrollTo(0, 32);
    await expect.poll(() => window.scrollY).toBe(32);
    await expect.poll(shows).toBe(true);
    const half = shadow();
    // Past the first bar height, the whole token, not a share of it.
    const probe = document.createElement('div'); probe.style.boxShadow = 'var(--shadow-md)'; document.body.append(probe);
    const full = css(probe).boxShadow;
    probe.remove();
    expect(half).not.toBe(full);
    window.scrollTo(0, 600);
    await expect.poll(() => window.scrollY).toBe(600);
    await expect.poll(shadow).toBe(full);
    // A bar that isn't sticky never lifts.
    n.classList.remove('dk-navbar--sticky');
    expect(shows()).toBe(false);
  }));

  test('sticky: Tab to a field above the screen scrolls it into view below the bar, not under it (WCAG 2.4.11); the page padding follows the bar and goes away with it', async () => {
    const r = await render(<div>
      <Navbar id="nfocus" sticky brand="Docs"><NavbarLink href="#a">A</NavbarLink></Navbar>
      <div style={{ height: '900px' }} />
      <input id="above" aria-label="Above" />
      <div style={{ height: '2000px' }} />
    </div>);
    const field = el('above'), bar = el('nfocus');
    expect(getComputedStyle(document.documentElement).scrollPaddingTop).toBe(Math.round(bar.getBoundingClientRect().height) + 'px');
    // Scroll so the field sits just under the top edge, behind the bar, then focus it.
    window.scrollTo(0, field.offsetTop - 20);
    await expect.poll(() => Math.round(field.getBoundingClientRect().top)).toBe(20);
    field.focus();
    await expect.poll(() => field.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom - 1);
    await r.rerender(<div><Navbar id="nfocus" brand="Docs" /></div>);
    expect(getComputedStyle(document.documentElement).scrollPaddingTop).toBe('auto');
    expect(document.documentElement.style.getPropertyValue('--dk-navbar-offset')).toBe('');
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
    expect([b.getAttribute('aria-label'), b.getAttribute('aria-expanded'), b.getAttribute('aria-controls') === q('#nav nav').id, b.querySelector<HTMLElement>('[data-icon]')?.dataset.icon, Math.round(b.getBoundingClientRect().right)])
      .toEqual(['Menu', 'false', true, 'menu', 484]);
    expect(q('#nsticky .dk-navbar__toggle').getAttribute('aria-label')).toBe('Open the menu');
  });

  test('small screens with wide actions: the brand shrinks and ends in an ellipsis, so the menu button stays on screen and nothing scrolls sideways (GH1)', async () => {
    await render(<Navbar id="nav" brand={<a href="#home" id="brand">Serupa Analytics</a>} actions={<><Button size="sm">Sign in</Button><Button size="sm">Start free trial</Button></>}>
      <NavbarLink href="#dash">Dashboard</NavbarLink>
    </Navbar>);
    for (const w of [390, 320]) {
      await resize(w);
      const b = el('brand');
      expect([w, Math.round(toggle().getBoundingClientRect().right) <= w, document.documentElement.scrollWidth <= w, b.scrollWidth > b.clientWidth, css(b).textOverflow]).toEqual([w, true, true, true, 'ellipsis']);
    }
    await resize(1100);
    expect(el('brand').scrollWidth > el('brand').clientWidth).toBe(false);
  });

  test('320px: a brand given as plain text ends in an ellipsis too, and never runs under the actions (GR79, GR81)', async () => {
    await render(<Navbar id="nav" brand="Kommunikationsplattform" actions={<><Button size="sm" variant="ghost" id="act">Sign in</Button><Button size="sm">Start free trial</Button></>}>
      <NavbarLink href="#dash">Dashboard</NavbarLink>
    </Navbar>);
    await resize(320);
    // A string brand gets a span of its own, so the ellipsis rule reaches it (GR81): text-overflow on the flex
    // brand box itself never reaches its anonymous text, which was cut off with no ellipsis.
    const b = q('#nav .dk-navbar__brand > span');
    expect(b?.textContent).toBe('Kommunikationsplattform');
    expect([Math.round(b.getBoundingClientRect().right) <= Math.round(el('act').getBoundingClientRect().left), b.scrollWidth > b.clientWidth, css(b).overflow, css(b).textOverflow, document.documentElement.scrollWidth <= 320]).toEqual([true, true, 'hidden', 'ellipsis', true]);
    await resize(1100);
    expect(b.scrollWidth > b.clientWidth).toBe(false);
  });

  test('320px, menu open: a link with a long unbroken word wraps inside the panel, not cut off or scrolled sideways (RF1)', async () => {
    await render(<Navbar id="nav" brand="Serupa"><NavbarLink href="#a">Dashboard</NavbarLink><NavbarLink href="#w" id="lw">Donaudampfschifffahrtsgesellschaftskapitänskajüte</NavbarLink></Navbar>);
    await resize(320);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    const nav = q('#nav nav'), a = el('lw');
    expect([nav.scrollWidth <= nav.clientWidth, a.scrollWidth <= a.clientWidth, Math.round(a.getBoundingClientRect().right) <= 320, document.documentElement.scrollWidth <= 320]).toEqual([true, true, true, true]);
  });

  test('keyboard table: Enter or Space on the menu button opens or closes the menu (FH1)', async () => {
    await render(<Main />);
    await resize(500);
    toggle().focus();
    const seen: Array<string | null> = [];
    for (const k of ['{Enter}', '{Enter}', '[Space]', '[Space]']) { await userEvent.keyboard(k); seen.push(toggle().getAttribute('aria-expanded')); }
    expect(seen).toEqual(['true', 'false', 'true', 'false']);
  });

  test('pressing it opens the links in a full-width panel under the bar, one per line; the icon becomes close', async () => {
    await render(<Main />);
    await resize(500);
    await userEvent.click(toggle());
    await expect.poll(() => vis('#nav nav')).toBe(true);
    const n = el('nav'), nav = n.querySelector('nav')!, r = nav.getBoundingClientRect(), top = [...nav.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top));
    const gap = Math.round(r.top - n.getBoundingClientRect().bottom);
    expect([toggle().getAttribute('aria-expanded'), toggle().querySelector<HTMLElement>('[data-icon]')?.dataset.icon, Math.round(r.width), top[0] < top[1] && top[1] < top[2]]).toEqual(['true', 'close', 500, true]);
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

  test('small screen, sticky, more links than fit: the open menu ends at the bottom of the screen and scrolls, so the last link can be reached', async () => {
    await page.viewport(375, 400);
    await expect.poll(() => window.innerWidth).toBe(375);
    const links = []; for (let i = 0; i < 25; i++) links.push(<NavbarLink key={i} href={'#l' + i} id={'l' + i}>Link {i}</NavbarLink>);
    await render(<div style={{ height: '2000px' }}><Navbar id="nav" sticky brand="Docs">{links}</Navbar></div>);
    await userEvent.click(toggle());
    const panel = q('#nav .dk-navbar__nav');
    await expect.poll(() => vis('#nav .dk-navbar__nav')).toBe(true);
    expect([Math.round(panel.getBoundingClientRect().bottom) <= 400, panel.scrollHeight > panel.clientHeight, css(panel).overscrollBehaviorY]).toEqual([true, true, 'contain']);
    el('l24').focus();
    await expect.poll(() => el('l24').getBoundingClientRect().bottom <= 400).toBe(true);
  });

  test('links inside a Fragment each get their own list item', async () => {
    await render(<Navbar id="nfrag" brand="Acme"><NavbarLink href="/">Home</NavbarLink><><NavbarLink href="/a">A</NavbarLink><NavbarLink href="/b">B</NavbarLink></>{false}</Navbar>);
    expect([...el('nfrag').querySelectorAll('.dk-navbar__links > li')].map((li) => li.textContent)).toEqual(['Home', 'A', 'B']);
  });

  test('pressed: a link held down fills with pressed at once, with no fade in (ED1)', async () => {
    await render(<Main />);
    await press(el('lp'), () => {
      expect([css(el('lp')).backgroundColor, css(el('lp')).transitionDuration.split(',')[0].trim()]).toEqual([color('var(--pressed)'), '0s']);
    });
  });
});

describe('Navbar panel motion (GH2)', () => {
  keepMotion();
  test('the small-screen panel fades in, and fades out after the menu button before it goes back between brand and actions', async () => {
    await resize(375);
    await render(<Main />);
    const nav = () => q('#nav nav');
    const fades = () => nav().getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty).sort().join();
    await userEvent.click(toggle());
    expect(fades()).toMatch(/opacity/);
    await expect.poll(() => getComputedStyle(nav()).opacity).toBe('1');
    await userEvent.keyboard('{Escape}');
    // Closing: still shown, after the button and inert, while it fades.
    expect([vis('#nav nav'), !!(toggle().compareDocumentPosition(nav()) & Node.DOCUMENT_POSITION_FOLLOWING), nav().inert]).toEqual([true, true, true]);
    expect(fades()).toMatch(/opacity/);
    await expect.poll(() => !!(toggle().compareDocumentPosition(nav()) & Node.DOCUMENT_POSITION_PRECEDING)).toBe(true);
    expect([vis('#nav nav'), nav().inert]).toEqual([false, false]);
  });
});
