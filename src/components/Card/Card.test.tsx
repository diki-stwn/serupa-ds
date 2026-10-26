import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, css, press, withMotion } from '../../../tools/test/vitest/helpers';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;

/** Applies the stylesheets' rules for a media feature (forced colors, reduced motion) as if it matched, until the returned function is called. */
function emulate(feature: 'forced-colors' | 'prefers-reduced-motion'): () => void {
  const on = feature === 'forced-colors' ? /forced-colors:\s*active/ : /prefers-reduced-motion:\s*reduce/;
  const off = feature === 'forced-colors' ? /forced-colors:\s*none/ : /prefers-reduced-motion:\s*no-preference/;
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && (on.test(r.media.mediaText) || off.test(r.media.mediaText))) {
        flipped.push([r.media, r.media.mediaText]);
        r.media.mediaText = on.test(r.media.mediaText) ? 'all' : 'not all';
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
  return () => { for (const [m, t] of flipped) m.mediaText = t; };
}

// Colors with alpha, composited over what's behind them, for WCAG contrast.
type RGBA = [number, number, number, number];
const rgb = (c: string): RGBA => { const m = (c.match(/[\d.]+/g) || []).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
const lum = (c: RGBA) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const over = (fg: RGBA, bg: RGBA): RGBA => (fg[3] >= 1 ? fg : fg.map((x, i) => (i < 3 ? x * fg[3] + bg[i] * (1 - fg[3]) : 1)) as RGBA);
const ratio = (a: RGBA, b: RGBA) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const Parts = () => <>
  <CardHeader title="Team plan" description="Up to 10 members" action={<Badge>Active</Badge>} />
  <CardBody>Body text</CardBody>
  <CardFooter><Button>Go</Button></CardFooter>
</>;
const Col = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>{children}</div>;
const Variants = () => <Col>
  <Card id="def"><Parts /></Card>
  <Card id="el" variant="elevated"><Parts /></Card>
  <Card id="fi" variant="filled"><Parts /></Card>
</Col>;

describe('Card', () => {
  test('defaults: a <div> card (outline, padding md) with header, body and footer; ref, className and other props reach it', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Card id="def" ref={r} className="extra" data-x="y"><Parts /></Card>);
    const e = el('def');
    expect([e.tagName, e.className, e.dataset.component, e.dataset.variant, r.current === e, e.dataset.x, [...e.children].map((c) => c.className).join(' | ')])
      .toEqual(['DIV', 'dk-card extra', 'card', 'outline', true, 'y', 'dk-card__header | dk-card__body | dk-card__footer']);
    expect([e.querySelector('.dk-card__title')!.tagName, e.querySelector('.dk-card__description')!.tagName, !!e.querySelector('.dk-card__header > .dk-card__action .dk-badge')]).toEqual(['H3', 'P', true]);
  });

  test('unknown variant, padding and element fall back to outline, md and <div>; as article and li; headingLevel sets the title\'s heading', async () => {
    await render(<Col>
      {/* @ts-expect-error: unknown values, as plain JavaScript could pass */}
      <Card id="bad" variant="glow" padding="xl" as="span">Bad</Card>
      <Card id="art" as="article"><CardHeader title="Level 2" headingLevel={2} /></Card>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}><Card id="li" as="li">Item</Card></ul>
    </Col>);
    expect([el('bad').tagName, el('bad').className, el('bad').dataset.variant]).toEqual(['DIV', 'dk-card', 'outline']);
    expect([el('art').tagName, el('li').tagName, q('#art .dk-card__title').tagName]).toEqual(['ARTICLE', 'LI', 'H2']);
  });

  test('outline: 20px padding, a 1px border, 12px corners, a hairline shadow, parts 16px apart, text-sm', async () => {
    await render(<Variants />);
    const s = css(el('def'));
    expect([s.paddingTop, s.paddingLeft, s.borderTopWidth, s.borderTopStyle, s.borderTopLeftRadius, s.rowGap, s.fontSize, s.lineHeight, s.display, s.flexDirection])
      .toEqual(['20px', '20px', '1px', 'solid', '12px', '16px', '14px', '20px', 'flex', 'column']);
    expect(s.boxShadow).toMatch(/1px 2px/);
  });

  test('elevated: a raised shadow on surface-raised, its 1px border-raised edge white on white in light; filled: surface-muted, no shadow, a transparent border', async () => {
    await render(<Variants />);
    const e = css(el('el')), f = css(el('fi'));
    expect(e.boxShadow).toMatch(/4px 6px -1px/);
    expect([e.backgroundColor, e.borderTopColor, e.borderTopWidth]).toEqual(['rgb(255, 255, 255)', 'rgb(255, 255, 255)', '1px']);
    expect([f.backgroundColor, f.borderTopColor]).toEqual([color('var(--surface-muted)'), 'rgba(0, 0, 0, 0)']);
    expect(f.boxShadow === 'none' || /0px 0px 0px 0px/.test(f.boxShadow)).toBe(true);
  });

  test('elevated in dark: one step up from the page (zinc-900 on zinc-950) with a zinc-800 edge, in every dark theme', async () => {
    await render(<Variants />);
    for (const th of THEMES.filter((t) => t.endsWith('-dark'))) {
      document.documentElement.setAttribute('data-theme', th);
      const e = css(el('el'));
      expect([th, e.backgroundColor, e.borderTopColor]).toEqual([th, color('var(--zinc-900)'), color('var(--zinc-800)')]);
      expect(e.backgroundColor).not.toBe(color('var(--surface)'));
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
  });

  test('padding sm 12px, lg 24px, none 0', async () => {
    await render(<Col><Card id="sm" padding="sm">S</Card><Card id="lg" padding="lg">L</Card><Card id="none" padding="none">N</Card></Col>);
    expect(['sm', 'lg', 'none'].map((id) => css(el(id)).paddingTop)).toEqual(['12px', '24px', '0px']);
  });

  test('title: text-base, font-semibold, no margins; description 4px under it', async () => {
    await render(<Card id="def"><Parts /></Card>);
    const s = css(q('#def .dk-card__title'));
    expect([s.fontSize, s.lineHeight, s.fontWeight, s.marginTop + s.marginBottom, css(q('#def .dk-card__description')).marginTop, css(q('#def .dk-card__heading')).rowGap])
      .toEqual(['16px', '24px', '600', '0px0px', '0px', '4px']);
  });

  test('an empty description and no action render nothing; header children go after the description', async () => {
    await render(<Col>
      <Card id="bare"><CardHeader title="Only a title" description="" /></Card>
      <Card id="kids"><CardHeader title="T"><span id="extra">More</span></CardHeader></Card>
    </Col>);
    expect([!!q('#bare .dk-card__description'), !!q('#bare .dk-card__action'), el('extra').parentElement!.className]).toEqual([false, false, 'dk-card__heading']);
  });

  test('footer: justify end (default, and for unknown values), start, between', async () => {
    await render(<Col>
      <Card id="def"><Parts /></Card>
      {/* @ts-expect-error: an unknown justify, as plain JavaScript could pass */}
      <Card id="jst"><CardFooter justify="start">a</CardFooter><CardFooter justify="between">b</CardFooter><CardFooter justify="up">c</CardFooter></Card>
    </Col>);
    expect([...el('jst').querySelectorAll('.dk-card__footer')].map((f) => css(f).justifyContent)).toEqual(['flex-start', 'space-between', 'flex-end']);
    expect(css(q('#def .dk-card__footer')).justifyContent).toBe('flex-end');
  });

  test('href: the card stays a <div> (or as), and its CardHeader title is the link, named by the title only; its area covers the card; target _blank adds rel="noopener noreferrer"; ref is the card', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Col><Card id="lnk" ref={r} href="#here" as="article" data-x="y"><CardHeader title="Atlas" description="Updated" /><CardBody>Six tasks</CardBody></Card><Card id="blank" href="#x" target="_blank"><CardHeader title="Out" /></Card></Col>);
    const e = el('lnk'), a = e.querySelector('a')!, box = e.getBoundingClientRect();
    expect([e.tagName, r.current === e, e.dataset.x, e.querySelectorAll('a').length, a.parentElement!.tagName, a.getAttribute('href'), a.textContent, css(a).textDecorationLine, el('blank').querySelector('a')!.getAttribute('rel'), el('blank').querySelector('a')!.target, el('blank').hasAttribute('target')])
      .toEqual(['ARTICLE', true, 'y', 1, 'H3', '#here', 'Atlas', 'none', 'noopener noreferrer', '_blank', false]);
    expect(e.className).toMatch(/dk-card--link/);
    // A click anywhere on the card lands on the link's stretched area.
    const hit = document.elementFromPoint(box.left + box.width / 2, box.bottom - 6)!;
    expect([hit === a, css(e).cursor]).toEqual([true, 'pointer']);
  });

  test('href with buttons inside: no button inside a link (valid HTML), the buttons sit above the link and don\'t follow it; Tab goes to the title link, then the buttons', async () => {
    const saves: number[] = [];
    await render(<Card id="act" href="#proj"><CardHeader title="Atlas" /><CardBody>Body</CardBody><CardFooter><Button id="save" onClick={() => saves.push(1)}>Save</Button></CardFooter></Card>);
    const b = el('save'), box = b.getBoundingClientRect();
    expect([b.closest('a'), document.elementFromPoint(box.left + 4, box.top + 4)!.closest('button') === b]).toEqual([null, true]);
    await userEvent.click(b);
    expect([saves, location.hash]).toEqual([[1], '']);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    expect(document.activeElement!.textContent).toBe('Atlas');
    await userEvent.tab();
    expect(document.activeElement).toBe(b);
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('href without a CardHeader title: an empty link over the card, named by the card\'s text (or aria-label); clicking the card follows it', async () => {
    await render(<Col><Card id="bare" href="#bare">Read the guide</Card><Card id="lab" href="#lab" aria-label="Open Beacon"><p>Beacon</p></Card></Col>);
    const a = el('bare').querySelector('a')!, a2 = el('lab').querySelector('a')!;
    expect([a.className, a.getAttribute('aria-labelledby'), a.textContent, a2.getAttribute('aria-label'), a2.hasAttribute('aria-labelledby'), el('lab').hasAttribute('aria-label')])
      .toEqual(['dk-card__link dk-card__link--cover', 'bare', '', 'Open Beacon', false, false]);
    await userEvent.click(el('bare'));
    expect(location.hash).toBe('#bare');
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('a linked card\'s body text and description sit above the link, so they can be selected; a plain click on them still follows the link, a click ending a selection doesn\'t (BO1)', async () => {
    await render(<Col><Card id="sel" href="#sel"><CardHeader title="Beacon" description="Status pages" /><CardBody><p id="selp">Copy this order number: 4417-22</p></CardBody></Card></Col>);
    const p = el('selp'), r = p.getBoundingClientRect();
    expect(document.elementFromPoint(r.left + 4, r.top + r.height / 2)).toBe(p);   // the text, not the link's area
    await userEvent.click(p);
    expect(location.hash).toBe('#sel');
    history.replaceState(null, '', location.pathname + location.search);
    const range = document.createRange(); range.selectNodeContents(p);
    getSelection()!.removeAllRanges(); getSelection()!.addRange(range);
    p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect([location.hash, getSelection()!.toString()]).toEqual(['', 'Copy this order number: 4417-22']);
    getSelection()!.removeAllRanges();
  });

  test('a Ctrl, Cmd or Shift click, or a middle click, on the body text opens the link in another tab and leaves this one; a plain click follows it here (ER1)', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const aux: number[] = [];
    await render(<Card id="mod" href="#mod" onAuxClick={(e) => aux.push(e.button)}><CardHeader title="Beacon" /><CardBody><p id="modp">Status pages</p></CardBody></Card>);
    const p = el('modp'), href = new URL('#mod', location.href).href;
    for (const key of ['ctrlKey', 'metaKey', 'shiftKey']) p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, [key]: true }));
    p.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    p.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 2 }));   // a right click: nothing
    expect([location.hash, open.mock.calls, aux]).toEqual(['', Array(4).fill([href, '_blank', 'noopener']), [1, 2]]);
    p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect([location.hash, open.mock.calls.length]).toEqual(['#mod', 4]);
    history.replaceState(null, '', location.pathname + location.search);
    open.mockRestore();
  });

  test('hover: a border-strong border', async () => {
    await render(<Card id="lnk" href="#here"><CardHeader title="Atlas" description="Updated" /></Card>);
    const before = css(el('lnk')).borderTopColor, strong = color('var(--border-strong)');
    expect(before).not.toBe(strong);
    await userEvent.hover(el('lnk'));
    await expect.poll(() => css(el('lnk')).borderTopColor).toBe(strong);
  });

  test('focus from the keyboard: the link takes it and the card shows a 2px focus-ring outline 2px outside', async () => {
    await render(<Col><Card id="def"><Parts /></Card><Card id="lnk" href="#here"><CardHeader title="Atlas" /></Card></Col>);
    q('#def button').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(q('#lnk a'));
    const s = css(el('lnk'));
    expect([s.outlineWidth, s.outlineStyle, s.outlineOffset, css(q('#lnk a')).outlineStyle]).toEqual(['2px', 'solid', '2px', 'none']);
  });

  test('component tokens (--card-bg, --card-radius, --card-padding-md) override one card', async () => {
    await render(<Card id="tok" style={{ '--card-bg': 'rgb(1, 2, 3)', '--card-radius': '3px', '--card-padding-md': '7px' } as React.CSSProperties}>Tokens</Card>);
    const s = css(el('tok'));
    expect([s.backgroundColor, s.borderTopLeftRadius, s.paddingTop]).toEqual(['rgb(1, 2, 3)', '3px', '7px']);
  });

  test('contrast: title, description and body keep 4.5:1 on all three variants in all six themes', async () => {
    await render(<Variants />);
    const still = document.createElement('style');
    still.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.appendChild(still);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const id of ['def', 'el', 'fi']) {
        const card = el(id), bg = rgb(css(card).backgroundColor);
        for (const sel of ['.dk-card__title', '.dk-card__description', '.dk-card__body']) {
          const r = ratio(over(rgb(css(card.querySelector(sel)).color), bg), bg); n++;
          if (r < 4.5) low.push(`${th} ${id} ${sel}: ${r.toFixed(2)}`);
        }
      }
    }
    still.remove();
    expect([low, n]).toEqual([[], 54]);
  });

  test('forced colors: outline, elevated and filled cards all show a border', async () => {
    const restore = emulate('forced-colors');
    try {
      await render(<Variants />);
      for (const id of ['def', 'el', 'fi']) {
        const s = css(el(id));
        expect([id, s.borderTopColor !== 'rgba(0, 0, 0, 0)', s.borderTopWidth]).toEqual([id, true, '1px']);
      }
    } finally { restore(); }
  });

  test('reduced motion: no transition on a linked card', async () => {
    const restore = emulate('prefers-reduced-motion');
    try {
      await render(<Card id="lnk" href="#here">Atlas</Card>);   // the cover link
      expect(`${css(el('lnk')).transitionProperty}/${css(el('lnk')).transitionDuration}`).toMatch(/^(all|none|opacity, display, overlay, content-visibility)\/0s$/);   // base.css may limit a component to its fades
    } finally { restore(); }
  });

  test('no errors or React warnings', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<Col><Variants /><Card href="#x" target="_blank">Out</Card><Card href="#y"><CardHeader title="T" /><CardFooter><Button>Save</Button></CardFooter></Card></Col>);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('pressed: a card with href shrinks to 97% while held and springs back; not while a button inside it is pressed (ED1)', async () => {
    await withMotion(async () => {
      await render(<Card id="pc" href="#pc"><CardHeader title="Atlas" /><CardFooter><Button id="pb">Save</Button></CardFooter></Card>);
      expect(css(el('pc')).transitionProperty).toContain('scale');
      await press(el('pc'), () => expect.poll(() => css(el('pc')).scale).toBe('0.97'), { x: 8, y: 8 });
      await expect.poll(() => css(el('pc')).scale).toBe('none');
      await press(el('pb'), () => expect(css(el('pc')).scale).toBe('none'));
    });
  });
});
