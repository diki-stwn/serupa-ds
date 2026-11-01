import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { color, css, lowContrast } from '../../../tools/test/vitest/helpers';
import { Link } from './Link';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const el = (id: string) => document.getElementById(id) as HTMLAnchorElement;
const underline = (id: string) => { const s = css(el(id)); return { color: s.color, line: s.textDecorationLine, thickness: s.textDecorationThickness, offset: s.textUnderlineOffset }; };
const away = () => userEvent.hover(document.body, { position: { x: 5, y: 600 } });
const RouterLink = React.forwardRef<HTMLAnchorElement, { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ to, ...p }, ref) {
  return <a {...p} ref={ref} href={'#router' + to} data-router="" />;
});

function Para({ r }: { r?: React.Ref<HTMLAnchorElement> }) {
  return <div style={{ maxWidth: '480px', fontSize: '16px' }}>
    <p style={{ color: 'rgb(9, 8, 7)' }}>Read <Link id="ldef" href="#a" ref={r} className="extra" data-x="y">the guide</Link> or <Link id="lneu" href="#b" tone="neutral">the notes</Link>.</p>
    <button id="after">after</button>
  </div>;
}

describe('Link', () => {
  test('external says "(opens in a new tab)" in the provider\'s words: "(terbuka di tab baru)" under id-ID', async () => {
    await render(<><Link id="ext-en" href="#" external>Docs</Link><SerupaProvider locale="id-ID" labels={idLabels}><Link id="ext-id" href="#" external>Dokumen</Link></SerupaProvider></>);
    expect([el('ext-en').textContent, el('ext-id').textContent]).toEqual(['Docs (opens in a new tab)', 'Dokumen (terbuka di tab baru)']);
  });

  test('keyboard table: Tab reaches the link; Enter follows it (FH1)', async () => {
    location.hash = '';
    await render(<div><button id="kb-before">before</button><Link id="kb-l" href="#kb-followed">Guide</Link></div>);
    document.getElementById('kb-before')!.focus();
    await userEvent.tab();
    const at = document.activeElement?.id;
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => location.hash).toBe('#kb-followed');
    expect(at).toBe('kb-l');
    location.hash = '';
  });

  test('defaults: an inline <a>; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLAnchorElement>();
    await render(<Para r={r} />);
    const e = el('ldef');
    expect([e.tagName, e.getAttribute('href'), e.className, e.dataset.component, r.current === e, e.dataset.x, e.target, css(e).display]).toEqual(['A', '#a', 'dk-link extra', 'link', true, 'y', '', 'inline']);
  });

  test('primary, underlined 1px, 2px below the text; on hover primary-hover and the underline thickens to 2px', async () => {
    await render(<Para />);
    const primary = color('var(--primary)');
    expect(underline('ldef')).toEqual({ color: primary, line: 'underline', thickness: '1px', offset: '2px' });
    await userEvent.hover(el('ldef'));
    await expect.poll(() => underline('ldef').color).toBe(color('var(--primary-hover)'));
    expect(underline('ldef').color).not.toBe(primary);
    expect(underline('ldef').thickness).toBe('2px');
    await away();
  });

  test('tone="neutral": the surrounding text\'s color, still underlined', async () => {
    await render(<Para />);
    const s = underline('lneu');
    expect([s.color, s.line]).toEqual(['rgb(9, 8, 7)', 'underline']);
  });

  test('underline="hover": no underline until hovered', async () => {
    await render(<Link id="lhov" href="#c" underline="hover">Pricing</Link>);
    const before = underline('lhov').line;
    await userEvent.hover(el('lhov'));
    await expect.poll(() => underline('lhov').line).toBe('underline');
    expect(before).toBe('none');
    await away();
  });

  test('tone="neutral" with underline="hover" warns once: it looks like plain text until hovered (CB1); either alone doesn\'t', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<><Link href="#a" tone="neutral">Terms</Link><Link href="#b" underline="hover">Pricing</Link></>);
    expect(warn).not.toHaveBeenCalled();
    await render(<><Link href="#c" tone="neutral" underline="hover">Help</Link><Link href="#d" tone="neutral" underline="hover">Docs</Link></>);
    expect([warn.mock.calls.length, String(warn.mock.calls[0][0])]).toEqual([1, expect.stringContaining('looks like plain text')]);
    warn.mockRestore();
  });

  test('unknown tone and underline fall back to primary and always', async () => {
    await render(<Link id="lbad" href="#d" tone={'gold' as never} underline={'never' as never}>Bad</Link>);
    expect(el('lbad').className).toBe('dk-link');
  });

  test('external: target _blank, rel keeps yours and adds noopener noreferrer, a 1em hidden new-tab icon and "(opens in a new tab)" for screen readers', async () => {
    await render(<div style={{ fontSize: '16px' }}><Link id="lext" href="https://example.com" external rel="me">Example</Link></div>);
    const e = el('lext'), i = e.querySelector<HTMLElement>('.dk-link__icon')!, v = e.querySelector('.dk-visually-hidden')!;
    expect([e.target, e.rel, i.dataset.icon, i.getAttribute('aria-hidden'), v.textContent, css(i).fontSize]).toEqual(['_blank', 'me noopener noreferrer', 'open_in_new', 'true', ' (opens in a new tab)', '16px']);
    expect(v.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    // The link's text: its words, the note, and the hidden icon's ligature name.
    expect(e.textContent.replace('open_in_new', '')).toBe('Example (opens in a new tab)');
  });

  test('external with your target="_self" (or _parent, _top) stays in the tab, so it doesn\'t say "opens in a new tab" or show the icon; rel still gets noopener noreferrer (L8E63)', async () => {
    await render(<div><Link id="lself" href="https://example.com" external target="_self">Example</Link><Link id="lnamed" href="https://example.com" external target="help">Help</Link></div>);
    const e = el('lself');
    expect([e.target, e.rel, e.textContent, e.querySelector('svg, [data-icon]')]).toEqual(['_self', 'noopener noreferrer', 'Example', null]);
    expect(el('lnamed').textContent.replace('open_in_new', '')).toBe('Help (opens in a new tab)');
  });

  test('external: the new-tab icon stays on the line of the last word at every width (GF1)', async () => {
    const widths: number[] = [];
    for (let w = 90; w <= 200; w += 5) widths.push(w);
    await render(<>{widths.map((w) => <p key={w} id={'lw' + w} style={{ width: w + 'px', margin: 0 }}>See <Link href="#g" external>Read the guide</Link></p>)}</>);
    const apart = widths.filter((w) => {
      const i = document.querySelector('#lw' + w + ' .dk-link__icon')!, icon = i.getBoundingClientRect();
      // The last letter before the icon.
      const r = document.createRange(), t = i.parentElement!.firstChild!;
      r.setStart(t, t.textContent!.length - 1); r.setEnd(t, t.textContent!.length);
      return Math.abs(r.getBoundingClientRect().top - icon.top) > icon.height / 2;
    });
    expect(apart).toEqual([]);
  });

  test('external: a last word longer than the line breaks inside it rather than running past a narrow box (GR71)', async () => {
    await render(<p id="llong" style={{ width: '120px', margin: 0 }}>See <Link href="#g" external>Donaudampfschifffahrtsgesellschaft</Link></p>);
    const p = el('llong'), a = p.querySelector('a')!;
    expect([a.getBoundingClientRect().right <= p.getBoundingClientRect().right + 1, p.scrollWidth <= p.clientWidth + 1]).toEqual([true, true]);
  });

  test('as: renders your router link with className and the rest', async () => {
    await render(<Link id="lrouter" as={RouterLink} to="/settings">Settings</Link>);
    const e = el('lrouter');
    expect([e.hasAttribute('data-router'), e.getAttribute('href'), e.className]).toEqual([true, '#router/settings', 'dk-link']);
  });

  test('as is typed (G10): the props and ref of the element it names, an <a>\'s by default', async () => {
    const a = React.createRef<HTMLAnchorElement>(), r = React.createRef<HTMLAnchorElement>(), b = React.createRef<HTMLButtonElement>(), wrong = React.createRef<HTMLAnchorElement>();
    await render(<>
      <Link id="lt-a" href="#a" ref={a}>A</Link>
      <Link id="lt-r" as={RouterLink} to="/r" ref={r}>Router</Link>
      <Link id="lt-b" as="button" type="button" ref={b} tone="neutral">Button</Link>
      {/* @ts-expect-error RouterLink needs to */}
      <Link id="lt-x" as={RouterLink}>No to</Link>
      {/* @ts-expect-error an <a> has no to */}
      <Link id="lt-y" href="#y" to="/y">Stray to</Link>
      {/* @ts-expect-error a <button>'s ref isn't an anchor's */}
      <Link id="lt-z" as="button" ref={wrong}>Ref</Link>
    </>);
    const is = (n: Element | null, id: string) => n === el(id);
    expect([is(a.current, 'lt-a'), is(r.current, 'lt-r'), is(b.current, 'lt-b'), el('lt-r').getAttribute('href'), el('lt-b').tagName]).toEqual([true, true, true, '#router/r', 'BUTTON']);
  });

  test('autoFocus focuses the link once it mounts (React does it only for form controls), also with as; the ref still reaches it', async () => {
    const r = React.createRef<HTMLAnchorElement>();
    await render(<><Link id="laf" href="#f" autoFocus ref={r}>Skip</Link><Link id="lafr" as={RouterLink} to="/x">Router</Link></>);
    await expect.poll(() => document.activeElement?.id).toBe('laf');
    expect([r.current === el('laf'), el('laf').hasAttribute('autofocus')]).toEqual([true, false]);
    (document.activeElement as HTMLElement).blur();
    await render(<Link id="lafr2" as={RouterLink} to="/y" autoFocus>Router</Link>);
    await expect.poll(() => document.activeElement?.id).toBe('lafr2');
  });

  test('tokens (--link-text, --link-thickness, --link-offset) override one link', async () => {
    await render(<Link id="ltok" href="#e" style={{ '--link-text': 'rgb(1, 2, 3)', '--link-thickness': '3px', '--link-offset': '5px' } as React.CSSProperties}>Tokens</Link>);
    const s = underline('ltok');
    expect([s.color, s.thickness, s.offset]).toEqual(['rgb(1, 2, 3)', '3px', '5px']);
  });

  test('a long URL as the link text wraps inside a flex row or a grid column too, rather than widening it (GP3)', async () => {
    const url = 'https://example.com/a/very/long/path/that/never/breaks/on/its/own';
    await render(<div style={{ width: 200 }}>
      <div id="lrow" style={{ display: 'flex', gap: 8 }}><Link id="lflex" href="#u">{url}</Link><span>x</span></div>
      <div id="lgrid" style={{ display: 'grid', gridTemplateColumns: 'auto' }}><Link id="lcell" href="#u">{url}</Link></div>
    </div>);
    const fits = (id: string, box: string) => Math.round(el(id).getBoundingClientRect().right) <= Math.round((document.getElementById(box) as HTMLElement).getBoundingClientRect().right) && (document.getElementById(box) as HTMLElement).scrollWidth <= 200;
    expect([fits('lflex', 'lrow'), fits('lcell', 'lgrid'), css(el('lflex')).overflowWrap]).toEqual([true, true, 'anywhere']);
  });

  test('keyboard focus: a 2px ring, 2px out', async () => {
    await render(<Para />);
    // Arrive by keyboard (Tab away and back) so the link matches :focus-visible.
    el('ldef').focus();
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    const s = css(el('ldef'));
    expect([document.activeElement === el('ldef'), s.outlineStyle, s.outlineWidth, s.outlineOffset]).toEqual([true, 'solid', '2px', '2px']);
  });

  test('contrast: link text (4.5:1), on hover, and its focus ring (3:1) on surface in all six themes', () => {
    expect(lowContrast([
      ['link', 'var(--link-text, var(--primary))', 'var(--surface)', 4.5],
      ['hover', 'var(--link-text-hover, var(--primary-hover))', 'var(--surface)', 4.5],
      ['focus ring', 'var(--link-focus-ring, var(--focus-ring))', 'var(--surface)', 3],
    ])).toEqual([]);
  });
});
