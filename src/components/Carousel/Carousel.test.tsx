import * as React from 'react';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, color, contrast, keepMotion } from '../../../tools/test/vitest/helpers';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';
import { Carousel } from './Carousel';

// About motion: transitions and animations stay on for this file (setup.ts turns them off elsewhere).
keepMotion();

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const focused = () => document.activeElement!.getAttribute('aria-label');

/** Flips the page's @media rules that match `feature` on (and its opposite off) until the returned function is called. */
function emulate(on: RegExp, off: RegExp | null): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSMediaRule && (on.test(r.media.mediaText) || (off && off.test(r.media.mediaText)))) {
        flipped.push([r.media, r.media.mediaText]);
        let t = r.media.mediaText.replace(new RegExp(`\\(\\s*${on.source}\\s*\\)`, 'g'), '(min-width: 0px)');
        if (off) t = t.replace(new RegExp(`\\(\\s*${off.source}\\s*\\)`, 'g'), '(max-width: -1px)');
        r.media.mediaText = t;
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* another origin */ } }
  return () => { for (const [m, t] of flipped) m.mediaText = t; };
}
const REDUCE = /prefers-reduced-motion\s*:\s*reduce/, NO_PREF = /prefers-reduced-motion\s*:\s*no-preference/;

// The script ran the page with reduced motion (slides change at once), so the slide positions can be read
// straight after a change; one test below turns it off. Errors logged by React count as failures.
let motion = () => {};
const errors: string[] = [];
beforeAll(() => {
  motion = emulate(REDUCE, NO_PREF);
  vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a.map(String).join(' ')); });
});
afterAll(() => { motion(); vi.restoreAllMocks(); });

const slides = (n: number, p: string) => Array.from({ length: n }, (_, i) => <div key={i} style={{ height: 120, background: '#ddd' }}><a href={'#' + p + i}>Link {i + 1}</a></div>);
const svg = (c: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="${c}"/></svg>`);
const changes: number[] = [];
let setCtl: (i: number) => void = () => {};
function Ctl() {
  const [i, set] = React.useState(1);
  setCtl = set;
  return <Carousel id="ctl" label="Controlled" index={i} onIndexChange={(n) => { changes.push(n); }}>{slides(3, 'c')}</Carousel>;
}
function App({ carRef }: { carRef?: React.Ref<HTMLElement> }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '400px' }}>
    <Carousel id="car" label="Photos" ref={carRef} className="extra" data-x="y">{slides(4, 'a')}</Carousel>
    <Carousel id="loop" label="Loop" loop defaultIndex={0} slideLabel={(i, n) => `Photo ${i + 1} / ${n}`} previousLabel="Back" nextLabel="Forward">{slides(3, 'l')}</Carousel>
    <Ctl />
    <Carousel id="one" label="One">{slides(1, 'o')}</Carousel>
    <Carousel id="bare" label="Bare" arrows={false} dots={false} defaultIndex={9}>{slides(3, 'b')}</Carousel>
    <div dir="rtl"><Carousel id="rtl" label="RTL">{slides(3, 'r')}</Carousel></div>
    <Carousel id="pics" label="Pictures">{['#c00', '#0c0', '#00c'].map((c) => <img key={c} alt={c} style={{ display: 'block', width: '100%', height: 120 }} src={svg(c)} />)}</Carousel>
    <div style={{ direction: 'rtl' }}><Carousel id="cssrtl" label="CSS RTL" defaultIndex={1}>{slides(3, 'x')}</Carousel></div>
    <Carousel id="fixed" label="Fixed" index={0} onIndexChange={() => {}}>{slides(3, 'f')}</Carousel>
    <Carousel id="tok" label="Tokens" style={{ '--carousel-dot-active': 'rgb(1, 2, 3)', '--carousel-radius': '3px' } as React.CSSProperties}>{slides(2, 't')}</Carousel>
  </div>;
}

function state(id: string) {
  const c = el(id), v = c.querySelector('.dk-carousel__viewport')!.getBoundingClientRect(), sl = slidesOf(c);
  return {
    index: +c.dataset.index!,
    shown: sl.findIndex((s) => Math.abs(s.getBoundingClientRect().left - v.left) < 1),
    active: sl.findIndex((s) => s.hasAttribute('data-active')),
    inert: sl.map((s) => (s.inert ? 1 : 0)).join(''),
    hidden: sl.map((s) => (s.getAttribute('aria-hidden') === 'true' ? 1 : 0)).join(''),
    dots: [...c.querySelectorAll<HTMLElement>('.dk-carousel__dot')].map((d) => (d.getAttribute('aria-current') === 'true' ? 'C' : '-') + d.tabIndex).join(' '),
    prev: c.querySelector<HTMLButtonElement>('.dk-carousel__arrow--prev')?.disabled,
    next: c.querySelector<HTMLButtonElement>('.dk-carousel__arrow--next')?.disabled,
  };
}
const arrow = (id: string, which: 'prev' | 'next') => q(`#${id} .dk-carousel__arrow--${which}`);
// The slides, found as people find them: the groups described as slides.
const slidesOf = (c: Element) => [...c.querySelectorAll<HTMLElement>('[role=group][aria-roledescription]')];
const dot = (id: string, n: number) => el(id).querySelectorAll<HTMLElement>('.dk-carousel__dot')[n];
/** A mouse swipe across the viewport, from its middle (40px down) by dx, or from the middle of `from`. */
async function swipe(id: string, dx: number, from?: HTMLElement) {
  const v = q(`#${id} .dk-carousel__viewport`);
  v.scrollIntoView({ block: 'center' });
  const r = v.getBoundingClientRect(), s = from ? from.getBoundingClientRect() : null;
  const x = s ? s.left + s.width / 2 - r.left : r.width / 2, y = s ? s.top + s.height / 2 - r.top : 40;
  await userEvent.dragAndDrop(from || v, v, { sourcePosition: s ? { x: s.width / 2, y: s.height / 2 } : { x, y }, targetPosition: { x: x + dx, y }, force: true });
}

describe('Carousel', () => {
  test('the slide and dot names and the role descriptions come from labels, so SerupaProvider translates them: "korsel", "2 dari 3" in Indonesian', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Carousel id="cid" label="Foto">{slides(3, 'i')}</Carousel></SerupaProvider>);
    const c = el('cid');
    expect([...c.querySelectorAll('.dk-carousel__dot')].map((x) => x.getAttribute('aria-label'))).toEqual(['1 dari 3', '2 dari 3', '3 dari 3']);
    const s = slidesOf(c)[0];
    expect([c.getAttribute('aria-roledescription'), s.getAttribute('aria-roledescription'), s.getAttribute('aria-label')]).toEqual(['korsel', 'slide', '1 dari 3']);
  });

  test('a <section> region (roledescription carousel, named by label); slides are groups named "1 of 4" in a polite live region, as wide as it; buttons and dots are named; ref, className and props reach it', async () => {
    const ref = React.createRef<HTMLElement>();
    await render(<App carRef={ref} />);
    const c = el('car'), s = slidesOf(c)[0];
    expect([c.tagName, c.getAttribute('aria-roledescription'), c.getAttribute('aria-label'), c.dataset.component, c.dataset.x]).toEqual(['SECTION', 'carousel', 'Photos', 'carousel', 'y']);
    expect([s.getAttribute('role'), s.getAttribute('aria-roledescription'), s.getAttribute('aria-label'), c.querySelector('.dk-carousel__track')!.getAttribute('aria-live')]).toEqual(['group', 'slide', '1 of 4', 'polite']);
    expect([...c.querySelectorAll('.dk-carousel__arrow')].map((x) => x.getAttribute('aria-label'))).toEqual(['Previous slide', 'Next slide']);
    expect([...c.querySelectorAll('.dk-carousel__dot')].map((x) => x.getAttribute('aria-label'))).toEqual(['1 of 4', '2 of 4', '3 of 4', '4 of 4']);
    expect(ref.current).toBe(c);
    expect(c.className).toMatch(/extra/);
    expect(Math.round(s.getBoundingClientRect().width)).toBe(Math.round(c.getBoundingClientRect().width));
  });

  test('starts on the first slide: only it is shown and reachable (the rest inert and hidden), its dot is current and the only one in the Tab order; previous is hidden, not just greyed', async () => {
    await render(<App />);
    expect(state('car')).toEqual({ index: 0, shown: 0, active: 0, inert: '0111', hidden: '0111', dots: 'C0 --1 --1 --1', prev: true, next: false });
    expect(getComputedStyle(arrow('car', 'prev')).visibility).toBe('hidden');
  });

  test('next moves one slide at a time and hides at the last slide (no loop); previous goes back, and a dot goes to its slide', async () => {
    await render(<App />);
    await userEvent.click(arrow('car', 'next'));
    await userEvent.click(arrow('car', 'next'));
    expect(state('car')).toMatchObject({ index: 2, shown: 2, inert: '1101', dots: '--1 --1 C0 --1' });
    await userEvent.click(arrow('car', 'next'));
    expect(state('car')).toMatchObject({ index: 3, next: true, prev: false });
    await userEvent.click(arrow('car', 'prev'));
    await userEvent.click(dot('car', 0));
    expect(state('car')).toMatchObject({ index: 0, shown: 0 });
  });

  test('on the dots, ArrowRight moves to the next slide and its dot takes focus; End and Home go to the last and first; the arrows stop at the ends without loop; Tab leaves the dots in one step', async () => {
    await render(<App />);
    dot('car', 0).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect([state('car').index, focused()]).toEqual([2, '3 of 4']);
    const seen: number[] = [];
    for (const k of ['{End}', '{ArrowRight}', '{Home}', '{ArrowLeft}']) { await userEvent.keyboard(k); seen.push(state('car').index); }
    expect(seen).toEqual([3, 3, 0, 0]);
    await userEvent.tab();
    expect(document.activeElement!.className).not.toMatch(/dk-carousel__dot/);
  });

  test('loop: previous from the first goes to the last and next from the last to the first (buttons and keys); labels can be changed', async () => {
    await render(<App />);
    const c = el('loop');
    expect([arrow('loop', 'prev').getAttribute('aria-label'), arrow('loop', 'next').getAttribute('aria-label'), slidesOf(c)[0].getAttribute('aria-label')]).toEqual(['Back', 'Forward', 'Photo 1 / 3']);
    const seen: number[] = [];
    await userEvent.click(arrow('loop', 'prev')); seen.push(state('loop').index);
    await userEvent.click(arrow('loop', 'next')); seen.push(state('loop').index);
    dot('loop', 0).focus();
    await userEvent.keyboard('{ArrowLeft}'); seen.push(state('loop').index);
    expect(seen).toEqual([2, 0, 2]);
    expect(state('loop').prev).toBe(false);
  });

  test('controlled: index decides, a press only calls onIndexChange, and a new index moves it', async () => {
    await render(<App />);
    changes.length = 0;
    await userEvent.click(arrow('ctl', 'next'));
    expect([state('ctl').index, changes]).toEqual([1, [2]]);
    setCtl(0);
    await expect.poll(() => state('ctl').index).toBe(0);
    expect(state('ctl').shown).toBe(0);
  });

  test('one slide: no buttons and no dots; arrows={false} and dots={false} leave them out; an index past the end shows the last slide', async () => {
    await render(<App />);
    expect([el('one').querySelectorAll('button').length, slidesOf(el('one'))[0].inert]).toEqual([0, false]);
    expect([el('bare').querySelectorAll('button').length, el('bare').dataset.index]).toEqual([0, '2']);
  });

  test('a swipe of 40px or more moves one slide (left = next, right = previous)', async () => {
    await render(<App />);
    const seen: number[] = [];
    for (const dx of [-120, 120]) { await swipe('car', dx); seen.push(state('car').index); }
    expect(seen).toEqual([1, 0]);
  });

  test('RTL: slides run right to left, next sits on the left with a flipped chevron, and a swipe to the right goes forward; CSS direction alone (no dir attribute) shows the right slide', async () => {
    await render(<App />);
    await userEvent.click(arrow('rtl', 'next'));
    const c = el('rtl'), v = c.querySelector('.dk-carousel__viewport')!.getBoundingClientRect(), sl = slidesOf(c).map((s) => s.getBoundingClientRect());
    expect(sl.findIndex((r) => Math.abs(r.left - v.left) < 1)).toBe(1);
    expect(sl[0].left).toBeGreaterThan(sl[1].left);
    expect(arrow('rtl', 'prev').getBoundingClientRect().left).toBeGreaterThan(arrow('rtl', 'next').getBoundingClientRect().left);
    expect(getComputedStyle(c.querySelector('.dk-carousel__ltr')!).display).toBe('none');
    await swipe('rtl', 120);
    expect(state('rtl').index).toBe(2);
    expect(state('cssrtl').shown).toBe(1);
  });

  /** A mouse drag across the viewport through `path`: [dx from the start, ms after the move before]. */
  const trace = async (id: string, path: [number, number][], up = true) => {
    const v = q(`#${id} .dk-carousel__viewport`);
    v.scrollIntoView({ block: 'center' });
    const r = v.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 40;
    const ev = (name: string, cx: number) => v.dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerId: 9, isPrimary: true, pointerType: 'mouse', button: 0, buttons: 1, clientX: cx, clientY: y }));
    ev('pointerdown', x);
    let at = 0;
    for (const [dx, ms] of path) { await new Promise((f) => setTimeout(f, ms)); ev('pointermove', x + dx); at = dx; }
    if (up) ev('pointerup', x + at);
  };

  test('a flick changes the slide though it is shorter than 40px; the same distance slowly springs back (EN1)', async () => {
    await render(<App />);
    await trace('car', [[-9, 100], [-10, 100], [-24, 10], [-38, 10]]);
    await expect.poll(() => state('car').index).toBe(1);
    await trace('car', [[-10, 100], [-20, 100], [-30, 100]]);
    expect(state('car').index).toBe(1);
  });

  test('past the first slide without loop the drag meets resistance (EN1): 200px moves the track less than 120px', async () => {
    await render(<App />);
    await trace('car', [[40, 50], [120, 50], [200, 50]], false);
    const moved = parseFloat(el('car').style.getPropertyValue('--dk-carousel-drag'));
    q('#car .dk-carousel__viewport').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 9 }));
    expect([moved > 0, moved < 120]).toEqual([true, true]);
  });

  test('loop with motion: next from the last slide carries on forward to the first, and previous from the first back to the last, instead of rewinding (EN1)', async () => {
    motion();
    try {
      await render(<App />);
      const c = el('loop'), t = q('#loop .dk-carousel__track'), x = () => new DOMMatrix(getComputedStyle(t).transform).m41;
      for (let i = 0; i < 2; i++) { await userEvent.click(arrow('loop', 'next')); await Promise.all(t.getAnimations().map((a) => a.finished)); }
      expect(state('loop').index).toBe(2);
      const from = x();
      await userEvent.click(arrow('loop', 'next'));
      await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
      // Moving on (further left), with the first slide standing in after the last.
      expect([x() < from, slidesOf(c)[0].dataset.wrap, state('loop').index]).toEqual([true, 'after', 0]);
      await Promise.all(t.getAnimations().map((a) => a.finished));
      await expect.poll(() => slidesOf(c)[0].dataset.wrap).toBe(undefined);
      await expect.poll(() => t.hasAttribute('data-snap')).toBe(false);
      expect([state('loop').shown, Math.round(x())]).toEqual([0, 0]);
      await userEvent.click(arrow('loop', 'prev'));
      await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
      expect([x() > 0, slidesOf(c)[2].dataset.wrap, state('loop').index]).toEqual([true, 'before', 2]);
      await Promise.all(t.getAnimations().map((a) => a.finished));
      await expect.poll(() => slidesOf(c)[2].dataset.wrap).toBe(undefined);
      await expect.poll(() => state('loop').shown).toBe(2);
    } finally { motion = emulate(REDUCE, NO_PREF); }
  });

  test('reduced motion: slides change at once; without it they move in 300ms', async () => {
    await render(<App />);
    expect(getComputedStyle(q('#car .dk-carousel__track')).transitionDuration).toBe('0s');
    motion();
    try { expect(getComputedStyle(q('#car .dk-carousel__track')).transitionDuration).toBe('0.3s'); } finally { motion = emulate(REDUCE, NO_PREF); }
  });

  test('component tokens (--carousel-dot-active, --carousel-radius) override one carousel; dots are 8px, the current one 24px wide, each in a 24px target', async () => {
    await render(<App />);
    expect([getComputedStyle(q('#tok .dk-carousel__dot[aria-current="true"]'), '::before').backgroundColor, getComputedStyle(q('#tok .dk-carousel__viewport')).borderTopLeftRadius]).toEqual(['rgb(1, 2, 3)', '3px']);
    const d = q('#car .dk-carousel__dot:not([aria-current])'), r = d.getBoundingClientRect(), a = getComputedStyle(d, '::before'), cur = getComputedStyle(q('#car .dk-carousel__dot[aria-current="true"]'), '::before');
    expect([Math.round(r.width), Math.round(r.height), a.width, a.height, cur.width]).toEqual([24, 24, '8px', '8px', '24px']);
  });

  test('contrast: the dots and the button icons keep 3:1 in all six themes', async () => {
    await render(<App />);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bc = getComputedStyle(arrow('car', 'next'));
      for (const [k, r] of [
        ['dot', contrast(getComputedStyle(q('#car .dk-carousel__dot:not([aria-current])'), '::before').backgroundColor, 'var(--surface)')],
        ['current dot', contrast(getComputedStyle(q('#car .dk-carousel__dot[aria-current="true"]'), '::before').backgroundColor, 'var(--surface)')],
        ['button icon', contrast(bc.color, bc.backgroundColor)],
      ] as const) { n++; if (r < 3) low.push(`${th} ${k}: ${r.toFixed(2)}`); }
    }
    expect([low, n]).toEqual([[], 18]);
  });

  test('a mouse swipe over a picture works (the picture\'s own drag is stopped); a swipe that starts on a link doesn\'t follow it', async () => {
    await render(<App />);
    await swipe('pics', -120);
    expect(state('pics').index).toBe(1);
    const h0 = location.hash;
    await swipe('car', -120, q('#car .dk-carousel__slide[data-active] a'));
    expect(location.hash).toBe(h0);
  });

  test('a cancelled touch (the browser scrolls instead) puts the slide back and doesn\'t change it', async () => {
    await render(<App />);
    const i0 = state('car').index, v = q('#car .dk-carousel__viewport'), o = { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientY: v.getBoundingClientRect().top + 40 };
    v.dispatchEvent(new PointerEvent('pointerdown', { ...o, clientX: 300 }));
    v.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: 250 }));
    v.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: 180 }));
    v.dispatchEvent(new PointerEvent('pointercancel', { ...o, clientX: 180 }));
    await expect.poll(() => el('car').style.getPropertyValue('--dk-carousel-drag')).toBe('0px');
    expect(state('car').index).toBe(i0);
  });

  test('without loop, reaching the last slide moves focus to Previous (and the first, to Next), so focus isn\'t lost; when a controlled parent keeps the index, focus stays on the current dot', async () => {
    await render(<App />);
    arrow('car', 'next').focus();
    await userEvent.keyboard('{Enter}{Enter}{Enter}');
    expect([el('car').dataset.index, focused()]).toEqual(['3', 'Previous slide']);
    await userEvent.keyboard('{Enter}{Enter}{Enter}');
    expect([el('car').dataset.index, focused()]).toEqual(['0', 'Next slide']);
    dot('fixed', 0).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([el('fixed').dataset.index, focused()]).toEqual(['0', '1 of 3']);
  });

  test('forced colors: dots in CanvasText, the current one in Highlight', async () => {
    await render(<App />);
    const restore = emulate(/forced-colors\s*:\s*active/, null);
    try {
      const fc = [getComputedStyle(q('#car .dk-carousel__dot:not([aria-current])'), '::before').backgroundColor, getComputedStyle(q('#car .dk-carousel__dot[aria-current="true"]'), '::before').backgroundColor];
      expect(fc[0]).not.toBe(fc[1]);
      expect(fc).not.toContain('rgba(0, 0, 0, 0)');
      expect(fc).toEqual([color('CanvasText'), color('Highlight')]);
    } finally { restore(); }
  });

  test('perView={3}: three slides share the width, 16px apart, all three reachable; next moves one slide and stops when the last is in view; the dots count pages, named "1–3 of 7"', async () => {
    await render(<div style={{ width: '432px' }}><Carousel id="pv" label="Products" perView={3}>{slides(7, 'p')}</Carousel></div>);
    const sl = [...el('pv').querySelectorAll('[aria-roledescription="slide"]')].map((s) => s.getBoundingClientRect());
    expect([Math.round(sl[0].width), Math.round(sl[1].left - sl[0].right)]).toEqual([133, 16]);
    expect(state('pv')).toMatchObject({ index: 0, inert: '0001111', hidden: '0001111', dots: 'C0 --1 --1', prev: true, next: false });
    expect([0, 1, 2].map((n) => dot('pv', n).getAttribute('aria-label'))).toEqual(['1–3 of 7', '4–6 of 7', '5–7 of 7']);
    await userEvent.click(arrow('pv', 'next'));
    expect(state('pv')).toMatchObject({ index: 1, shown: 1, inert: '1000111', dots: 'C0 --1 --1' });
    await userEvent.click(dot('pv', 2));
    expect(state('pv')).toMatchObject({ index: 4, shown: 4, inert: '1111000', dots: '--1 --1 C0', next: true });
    dot('pv', 2).focus();
    await userEvent.keyboard('{Home}');
    expect(state('pv')).toMatchObject({ index: 0, dots: 'C0 --1 --1' });
    await userEvent.keyboard('{ArrowRight}');
    expect([state('pv').index, document.activeElement === dot('pv', 1)]).toEqual([3, true]);
  });

  test('perView as { base, md }: one slide on a phone, two from 768px up, following the width as it changes; as many slides as fit or fewer: no buttons, no dots', async () => {
    const w = window.innerWidth, h = window.innerHeight;
    try {
      await page.viewport(500, 700);
      await render(<><Carousel id="rv" label="Reviews" perView={{ base: 1, md: 2 }}>{slides(4, 'v')}</Carousel><Carousel id="few" label="Few" perView={3}>{slides(2, 'w')}</Carousel></>);
      expect(state('rv').dots.split(' ').length).toBe(4);
      await page.viewport(900, 700);
      await expect.poll(() => state('rv').dots.split(' ').length).toBe(2);
      expect(state('rv').inert).toBe('0011');
      expect([el('few').querySelectorAll('button').length, state('few').inert]).toEqual([0, '00']);
    } finally { await page.viewport(w, h); }
  });

  test('no errors on the page', () => {
    expect(errors).toEqual([]);
  });

  test('slides inside a Fragment are slides of their own', async () => {
    await render(<Carousel id="cfrag" label="Photos"><div>A</div><><div>B</div><div>C</div></></Carousel>);
    expect(el('cfrag').querySelectorAll('.dk-carousel__dot').length).toBe(3);
  });
});
