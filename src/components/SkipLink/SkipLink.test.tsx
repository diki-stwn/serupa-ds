import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { SkipLink } from './SkipLink';

const el = (id: string) => document.getElementById(id) as HTMLElement;

function Page(p: { target?: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; mainId?: string }) {
  return <>
    <SkipLink id="skip" target={p.target} onClick={p.onClick} />
    <nav aria-label="Site"><a id="n1" href="#a">A</a><a id="n2" href="#b">B</a></nav>
    <main id={p.mainId || 'main'}><p>Text</p><a id="inside" href="#c">Inside</a></main>
  </>;
}

describe('SkipLink', () => {
  test('a link to #main, "Skip to content"; ref, className and other props reach the <a>', async () => {
    const ref = React.createRef<HTMLAnchorElement>();
    await render(<SkipLink id="x" ref={ref} className="extra" data-x="y" />);
    const e = el('x');
    expect([e.tagName, e.textContent, e.getAttribute('href'), ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['A', 'Skip to content', '#main', true, 'dk-skip-link extra', 'y', 'skip-link']);
  });

  test('target and children change where it goes and what it says; Indonesian words from the provider', async () => {
    await render(<><SkipLink id="a" target="results">Skip to results</SkipLink><SerupaProvider labels={idLabels}><SkipLink id="b" /></SerupaProvider></>);
    expect([el('a').getAttribute('href'), el('a').textContent]).toEqual(['#results', 'Skip to results']);
    expect(el('b').textContent).toBe('Langsung ke konten');
  });

  test('hidden until it has focus, then shown at the top start of the viewport, above a sticky bar', async () => {
    await render(<Page />);
    const a = el('skip');
    expect(a.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(a);
    const r = a.getBoundingClientRect(), s = css(a);
    expect([s.position, Number(s.zIndex), r.top, r.left]).toEqual(['fixed', 50, 12, 12]);
    expect(r.width).toBeGreaterThan(40);
    expect(s.outlineStyle).toBe('solid');
  });

  test('Enter moves focus to main, which isn\'t focusable, for as long as it has focus; the next Tab goes on inside it', async () => {
    await render(<Page />);
    const main = el('main');
    el('skip').focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(location.hash).toBe('#main');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(el('inside'));
    expect(main.hasAttribute('tabindex')).toBe(false);
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('a focusable target keeps its own tabindex; onClick runs first and can stop it', async () => {
    const stop = vi.fn((e: React.MouseEvent) => e.preventDefault());
    await render(<><Page onClick={stop} target="n2" /></>);
    el('skip').focus();
    await userEvent.keyboard('{Enter}');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(el('skip'));
  });

  test('a missing target warns once in development, and the link is left to the browser', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Page mainId="content" />);
    const go = vi.fn((e: Event) => { expect(e.defaultPrevented).toBe(false); e.preventDefault(); });
    document.addEventListener('click', go);
    el('skip').click();
    el('skip').click();
    document.removeEventListener('click', go);
    expect(go).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.filter(([m]) => /SkipLink: no element with id "main"/.test(String(m)))).toHaveLength(1);
    warn.mockRestore();
  });

  test('a focusable target is focused as it is, without a tabindex', async () => {
    await render(<Page target="n2" />);
    el('skip').focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(el('n2'));
    expect(el('n2').hasAttribute('tabindex')).toBe(false);
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('its text reads 4.5:1 on its background in all six themes', async () => {
    await render(<Page />);
    el('skip').focus();
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(el('skip')).color, css(el('skip')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});
