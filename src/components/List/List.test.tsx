import * as React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press } from '../../../tools/test/vitest/helpers';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { List, ListItem } from './List';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const bg = (v: string) => { const d = document.createElement('div'); d.style.background = v; document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
const RouterLink = React.forwardRef<HTMLAnchorElement, { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ to, ...p }, ref) {
  return <a {...p} ref={ref} href={'#router' + to} data-router="" />;
});
// Clicking the links changes the page's hash; put it back after each test.
afterEach(() => { history.replaceState(null, '', location.pathname + location.search); });

function People({ r, ir }: { r?: React.Ref<HTMLUListElement>; ir?: React.Ref<HTMLLIElement> }) {
  return <div style={{ width: '420px' }}>
    <List id="ldef" ref={r} className="extra" aria-label="People">
      <ListItem id="iada" ref={ir} title="Ada Lovelace" description="ada@example.com" leading={<Avatar name="Ada Lovelace" size="sm" />} trailing={<Badge>Admin</Badge>} />
      <ListItem id="iicon" title="Report.pdf" description="2 MB" leading="description" />
      <ListItem id="ionly" title="Just a title" />
    </List>
  </div>;
}

function Card({ clicks }: { clicks: string[] }) {
  return <div style={{ width: '420px' }}>
    <List id="lcard" variant="card" as="ol">
      <ListItem id="ilink" href="#files" title="Files" description="All your files" leading="folder" trailing={<IconButton icon="more_horiz" label="More" id="more" onClick={() => clicks.push('more')} />} />
      <ListItem id="ibtn" title="Open settings" onClick={() => clicks.push('btn')} selected={false} />
      <ListItem id="isel" href="#sel" title="Selected" selected />
      <ListItem id="irouter" as={RouterLink} linkProps={{ to: '/team' }} title="Team" />
      <ListItem id="idis" href="#dis" title="Disabled" disabled />
    </List>
  </div>;
}

describe('List', () => {
  test('a <ul> without bullets or padding; ref, className and props reach it; ListItem is an <li>', async () => {
    const r = React.createRef<HTMLUListElement>(), ir = React.createRef<HTMLLIElement>();
    await render(<People r={r} ir={ir} />);
    const l = el('ldef'), s = css(l);
    expect([l.tagName, l.className, l.dataset.component, r.current === l, ir.current?.tagName, l.getAttribute('aria-label'), s.listStyleType, s.paddingLeft])
      .toEqual(['UL', 'dk-list dk-list--divided extra', 'list', true, 'LI', 'People', 'none', '0px']);
  });

  test('an item: leading avatar, a text-sm font-medium title over a text-sm description, trailing meta at the end; 12px padding', async () => {
    await render(<People />);
    const li = el('iada'), m = li.querySelector('.dk-list__main')!, t = li.querySelector('.dk-list__title')!, tr = li.querySelector('.dk-list__trailing')!;
    const left = [li.querySelector('.dk-list__leading')!, t, tr].map((e) => Math.round(e.getBoundingClientRect().left));
    expect([m.tagName, `${css(m).paddingTop} ${css(m).paddingLeft}`, css(t).fontSize, css(t).fontWeight, css(li.querySelector('.dk-list__description')).fontSize, !!li.querySelector('.dk-list__leading .dk-avatar')])
      .toEqual(['DIV', '12px 12px', '14px', '500', '14px', true]);
    expect(Math.round(li.getBoundingClientRect().right - tr.getBoundingClientRect().right)).toBe(12);
    expect(left[0] < left[1] && left[1] < left[2]).toBe(true);
  });

  test('divided: a 1px line between items, none above the first', async () => {
    await render(<People />);
    expect([...el('ldef').children].map((li) => css(li).borderTopWidth)).toEqual(['0px', '1px', '1px']);
  });

  test('an icon name as leading: a 20px muted icon', async () => {
    await render(<People />);
    const i = q('#iicon .dk-list__leading .dk-icon');
    expect([i.dataset.icon, css(i).fontSize]).toEqual(['description', '20px']);
  });

  test('variant card, as ol: a bordered frame with 8px corners and 16px side padding', async () => {
    await render(<Card clicks={[]} />);
    const l = el('lcard'), s = css(l);
    expect([l.tagName, s.borderTopWidth, s.borderTopLeftRadius, css(l.querySelector('.dk-list__main')).paddingLeft]).toEqual(['OL', '1px', '8px', '16px']);
  });

  test('href: the main area is a link; trailing actions stay outside it (no nested controls)', async () => {
    await render(<Card clicks={[]} />);
    const m = q('#ilink .dk-list__main');
    expect([m.tagName, m.getAttribute('href'), m.contains(el('more')), m.textContent, m.querySelector<HTMLElement>('[data-icon]')?.dataset.icon]).toEqual(['A', '#files', false, 'FilesAll your files', 'folder']);
  });

  test('link and button items shade on hover; static items don\'t', async () => {
    await render(<><People /><Card clicks={[]} /></>);
    const shade = bg('var(--surface-muted)');
    expect(css(el('ilink')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await userEvent.hover(q('#ilink .dk-list__title'));
    await expect.poll(() => css(el('ilink')).backgroundColor).toBe(shade);
    await userEvent.hover(el('iada'));
    await expect.poll(() => css(el('ilink')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(css(el('iada')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  test('clicking the trailing action doesn\'t follow the link; clicking the row does', async () => {
    const clicks: string[] = [];
    await render(<Card clicks={clicks} />);
    await userEvent.click(el('more'));
    expect([clicks.join(), location.hash]).toEqual(['more', '']);
    await userEvent.click(q('#ilink .dk-list__title'));
    expect([clicks.join(), location.hash]).toEqual(['more', '#files']);
  });

  test('the whole row works where it lights up: a press on trailing meta ("3 days ago") follows the link or presses the button; a trailing action stays its own (GF2)', async () => {
    const clicks: string[] = [];
    await render(<div style={{ width: '420px' }}><List>
      <ListItem id="mlink" href="#doc" title="Doc" trailing={<span id="mmeta">3 days ago</span>} />
      <ListItem id="mbtn" title="Settings" onClick={() => clicks.push('row')} trailing={<span id="bmeta">Edited</span>} />
      <ListItem id="mboth" href="#both" title="Both" trailing={<><span id="cmeta">Today</span><IconButton icon="more_horiz" label="More" id="more2" onClick={() => clicks.push('more')} /></>} />
    </List></div>);
    const at = (id: string) => { const r = el(id).getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)!; };
    expect([at('mmeta').closest('a')?.getAttribute('href'), at('bmeta').closest('button')?.textContent, at('cmeta').closest('a')?.getAttribute('href'), at('more2').closest('button')?.id])
      .toEqual(['#doc', 'Settings', '#both', 'more2']);
    await userEvent.click(el('bmeta'), { force: true });
    await userEvent.click(el('more2'));
    await userEvent.click(el('mmeta'), { force: true });
    expect([clicks.join(), location.hash]).toEqual(['row,more', '#doc']);
  });

  test('onClick: the main area is a button (aria-pressed with selected), and Enter presses it', async () => {
    const clicks: string[] = [];
    await render(<Card clicks={clicks} />);
    const b = q<HTMLButtonElement>('#ibtn .dk-list__main');
    expect([b.tagName, b.type, b.getAttribute('aria-pressed')]).toEqual(['BUTTON', 'button', 'false']);
    b.focus();
    await userEvent.keyboard('{Enter}');
    expect(clicks).toEqual(['btn']);
  });

  test('keyboard focus: a 2px ring inside the row', async () => {
    await render(<Card clicks={[]} />);
    const b = q('#ibtn .dk-list__main');
    // Arrive by keyboard (Tab away and back) so it matches :focus-visible.
    b.focus();
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect([document.activeElement === b, css(b).outlineStyle, css(b).outlineWidth, css(b).outlineOffset]).toEqual([true, 'solid', '2px', '-2px']);
  });

  test('selected: aria-current, shaded, a 2px primary bar at the start', async () => {
    await render(<Card clicks={[]} />);
    const li = el('isel'), s = css(li);
    expect([li.querySelector('a')!.getAttribute('aria-current'), s.backgroundColor]).toEqual(['true', bg('var(--surface-muted)')]);
    expect(s.boxShadow).toMatch(/2px 0px 0px 0px inset$/);
    expect(s.boxShadow).toContain(color('var(--primary)'));
  });

  test('linkProps\' aria-current wins over selected\'s "true", so a nav list can mark the current page (GF3)', async () => {
    await render(<List aria-label="Pages">
      <ListItem id="gp" href="#home" title="Home" selected linkProps={{ 'aria-current': 'page' }} />
      <ListItem id="gs" href="#docs" title="Docs" selected />
      <ListItem id="gn" href="#blog" title="Blog" linkProps={{ 'aria-current': 'page' }} />
      <ListItem id="go" href="#about" title="About" />
    </List>);
    expect(['gp', 'gs', 'gn', 'go'].map((id) => el(id).querySelector('a')!.getAttribute('aria-current'))).toEqual(['page', 'true', 'page', null]);
  });

  test('as with linkProps: a router link', async () => {
    await render(<Card clicks={[]} />);
    const a = q('#irouter .dk-list__main');
    expect([a.hasAttribute('data-router'), a.getAttribute('href'), a.className]).toEqual([true, '#router/team', 'dk-list__main']);
  });

  test('disabled: no href, aria-disabled, out of the tab order, dimmed, clicks do nothing', async () => {
    await render(<Card clicks={[]} />);
    const a = q('#idis .dk-list__main');
    expect([a.getAttribute('href'), a.getAttribute('aria-disabled'), a.tabIndex, css(a).opacity]).toEqual([null, 'true', -1, '0.5']);
    await userEvent.click(q('#idis .dk-list__title'));
    expect(location.hash).toBe('');
  });

  test('disabled with a router link (as, linkProps.to): still no href, so a middle or Ctrl click can\'t open it either (L8E67)', async () => {
    await render(<List><ListItem id="irdis" as={RouterLink} linkProps={{ to: '/team', 'aria-label': 'Team page' }} title="Team" disabled /></List>);
    const a = q('#irdis .dk-list__main');
    expect([a.tagName, a.getAttribute('href'), a.getAttribute('aria-disabled'), a.getAttribute('aria-label'), a.tabIndex]).toEqual(['A', null, 'true', 'Team page', -1]);
  });

  test('divided={false}: no lines; unknown variant and as fall back to plain and ul', async () => {
    await render(<List id="lnodiv" divided={false} variant={'boxed' as never} as={'table' as never}><ListItem title="A" /><ListItem title="B" /></List>);
    const l = el('lnodiv');
    expect([l.tagName, l.className, css(l.children[1]).borderTopWidth]).toEqual(['UL', 'dk-list', '0px']);
  });

  test('tokens (--list-padding-y, --list-title-color) override one list', async () => {
    await render(<List id="ltok" style={{ '--list-padding-y': '5px', '--list-title-color': 'rgb(1, 2, 3)' } as React.CSSProperties}><ListItem title="T" /></List>);
    expect([css(q('#ltok .dk-list__main')).paddingTop, css(q('#ltok .dk-list__title')).color]).toEqual(['5px', 'rgb(1, 2, 3)']);
  });

  test('contrast: titles and descriptions keep 4.5:1 on plain and shaded rows, the selected bar 3:1, in all six themes', async () => {
    await render(<People />);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const title = css(q('#iada .dk-list__title')).color, desc = css(q('#iada .dk-list__description')).color;
      for (const [name, fg, back, need] of [
        ['title', title, 'var(--surface)', 4.5], ['description', desc, 'var(--surface)', 4.5],
        ['title on a shaded row', title, 'var(--surface-muted)', 4.5], ['description on a shaded row', desc, 'var(--surface-muted)', 4.5],
        ['selected bar', 'var(--primary)', 'var(--surface-muted)', 3],
      ] as const) {
        const r = contrast(fg, back);
        if (r < need) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('pressed: a link row held down fills with pressed; holding its trailing action doesn\'t', async () => {
    await render(<><People /><Card clicks={[]} /></>);
    const row = el('ilink');
    await press(q('#ilink .dk-list__title'), () => expect.poll(() => css(row).backgroundColor).toBe(color('var(--pressed)')));
    await press(el('more'), () => expect.poll(() => css(row).backgroundColor).not.toBe(color('var(--pressed)')));
  });

});
