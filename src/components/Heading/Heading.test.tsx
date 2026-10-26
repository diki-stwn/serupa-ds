import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Heading, type HeadingLevel } from './Heading';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

describe('Heading', () => {
  test('defaults: an <h2>; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLHeadingElement>();
    await render(<Heading id="hdef" ref={r} className="extra" data-x="y">Default</Heading>);
    const e = el('hdef');
    expect([e.tagName, e.className, e.dataset.component, r.current === e, e.dataset.x]).toEqual(['H2', 'dk-heading dk-heading--2 extra', 'heading', true, 'y']);
  });

  test('levels: h1 3xl to h6 sm with the scale\'s line heights, font-semibold, no margins, 2xl and up tracked tight', async () => {
    await render(<>{LEVELS.map((l) => <Heading key={l} id={`h${l}`} level={l}>Level {l}</Heading>)}</>);
    const got = LEVELS.map((l) => { const e = el(`h${l}`), s = css(e); return [e.tagName, s.fontSize, s.lineHeight, s.fontWeight, s.marginTop, s.letterSpacing].join(' '); });
    expect(got).toEqual(['H1 30px 36px 600 0px -0.75px', 'H2 24px 32px 600 0px -0.6px', 'H3 20px 28px 600 0px normal', 'H4 18px 28px 600 0px normal', 'H5 16px 24px 600 0px normal', 'H6 14px 20px 600 0px normal']);
  });

  test('levels 1 to 4 render the type-heading-1 to -4 roles exactly', async () => {
    const roles = ['type-heading-1', 'type-heading-2', 'type-heading-3', 'type-heading-4'];
    await render(<>{[1, 2, 3, 4].map((l) => <Heading key={l} id={`hr${l}`} level={l as HeadingLevel}>Level {l}</Heading>)}{roles.map((r) => <p key={r} id={r} className={r}>Role</p>)}</>);
    const keys = ['fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'letterSpacing'] as const;
    const of = (e: HTMLElement) => keys.map((k) => css(e)[k]);
    expect([1, 2, 3, 4].map((l) => of(el(`hr${l}`)))).toEqual(roles.map((r) => of(el(r))));
  });

  test('an unknown level falls back to h2, an unknown size is ignored', async () => {
    await render(<Heading id="hbad" level={9 as never} size={'huge' as never}>Bad</Heading>);
    expect([el('hbad').tagName, el('hbad').className].join(' ')).toBe('H2 dk-heading dk-heading--2');
  });

  test('size: an h1 can look lg (and loses the tight tracking), an h4 can look 4xl', async () => {
    await render(<><Heading id="hsize" level={1} size="lg">Small h1</Heading><Heading id="hbig" level={4} size="4xl">Big h4</Heading></>);
    const s = css(el('hsize')), g = css(el('hbig'));
    expect([el('hsize').tagName, s.fontSize, s.lineHeight, s.letterSpacing]).toEqual(['H1', '18px', '28px', 'normal']);
    expect([g.fontSize, g.lineHeight, g.letterSpacing]).toEqual(['36px', '40px', '-0.9px']);
  });

  test('tokens (--heading-size-3, --heading-text) override one heading', async () => {
    await render(<Heading id="htok" level={3} style={{ '--heading-size-3': '11px', '--heading-text': 'rgb(1, 2, 3)' } as React.CSSProperties}>Tokens</Heading>);
    const s = css(el('htok'));
    expect([s.fontSize, s.color]).toEqual(['11px', 'rgb(1, 2, 3)']);
  });

  test('--heading-line-height-1 sets the line height that goes with a --heading-size-1 override (an h1 at text-4xl gets 40px, not 36px)', async () => {
    await render(<Heading id="hlh" level={1} style={{ '--heading-size-1': 'var(--text-4xl)', '--heading-line-height-1': 'var(--text-4xl--line-height)' } as React.CSSProperties}>Tall</Heading>);
    const s = css(el('hlh'));
    expect([s.fontSize, s.lineHeight]).toEqual(['36px', '40px']);
  });

  test('contrast: a heading keeps 4.5:1 on surface in all six themes', async () => {
    await render(<Heading id="h1" level={1}>Level 1</Heading>);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const r = contrast(css(el('h1')).color, 'var(--surface)');
      if (r < 4.5) low.push(`${th} heading ${r.toFixed(2)}`);
    }
    expect(low).toEqual([]);
  });
});
