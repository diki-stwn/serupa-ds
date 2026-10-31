import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Prose } from './Prose';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const top = (id: string) => parseFloat(css(el(id)).marginTop);
const HTML = `<h2 id="h">Title</h2><p id="p1">One</p><p id="p2">Two <a id="a" href="#x">link</a> <code id="c">x</code></p>
<ul id="ul"><li id="l1">A<ul id="ul2"><li>B</li></ul></li><li id="l2">C</li></ul><ol id="ol"><li>One</li></ol>
<h3 id="h3">Next</h3><blockquote id="q"><p>Quote</p></blockquote><pre id="pre"><code>${'x'.repeat(400)}</code></pre>
<table id="t"><tr><td>${'cell '.repeat(5)}</td><td>${'y'.repeat(300)}</td></tr></table><img id="img" alt="Broken" src="data:image/png;base64,">`;

describe('Prose', () => {
  test('a <div> by default, or as; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLElement>();
    await render(<><Prose id="x" ref={ref} className="extra" data-x="y">Hi</Prose><Prose id="y" as="article" /></>);
    const e = el('x');
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['DIV', true, 'dk-prose extra', 'y', 'prose']);
    expect(el('y').tagName).toBe('ARTICLE');
  });

  test('blocks are spaced from the one before, with more before a heading and none before the first; list items closer', async () => {
    await render(<Prose dangerouslySetInnerHTML={{ __html: HTML }} />);
    expect(top('h')).toBe(0);
    expect(top('p1')).toBe(12);   // after a heading
    expect(top('p2')).toBe(16);
    expect(top('h3')).toBe(32);
    expect(top('l2')).toBe(8);
  });

  test('lists get their markers and a logical indent back; nested bullets change', async () => {
    await render(<Prose dangerouslySetInnerHTML={{ __html: HTML }} />);
    expect([css(el('ul')).listStyleType, css(el('ul2')).listStyleType, css(el('ol')).listStyleType]).toEqual(['disc', 'circle', 'decimal']);
    expect(css(el('ul')).paddingInlineStart).toBe('24px');
  });

  test('a long code line and a wide table scroll in their own boxes, not the column', async () => {
    await render(<div style={{ width: 300 }}><Prose id="pr" dangerouslySetInnerHTML={{ __html: HTML }} /></div>);
    expect(el('pr').scrollWidth).toBeLessThanOrEqual(300);
    for (const id of ['pre', 't']) {
      expect(el(id).clientWidth, id).toBeLessThanOrEqual(300);
      expect(el(id).scrollWidth, id).toBeGreaterThan(el(id).clientWidth);
      expect(css(el(id)).overflowX, id).toBe('auto');
    }
    expect(el('img').getBoundingClientRect().width).toBeLessThanOrEqual(300);
    expect([css(el('img')).fontStyle]).toEqual(['italic']);
  });

  test('text, headings, quotes and markers read 4.5:1, and the visited shade 4.5:1 on surface and surface-muted, in all six themes', async () => {
    await render(<><Prose dangerouslySetInnerHTML={{ __html: HTML }} /><span id="v" style={{ color: 'var(--prose-link-visited, var(--link-visited))' }}>v</span></>);
    const page = (v: string) => { const d = document.createElement('div'); d.style.background = `var(--${v})`; document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const bg of ['surface', 'surface-muted']) {
        const b = page(bg);
        for (const id of ['p1', 'h', 'q', 'v']) expect(contrast(css(el(id)).color, b), `${th} ${id} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(getComputedStyle(el('l1'), '::marker').color, b), `${th} marker`).toBeGreaterThanOrEqual(4.5);
      }
      expect(css(el('v')).color, th).not.toBe(css(el('a')).color);
    }
  });
});
