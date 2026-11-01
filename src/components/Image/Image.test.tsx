import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, keepMotion } from '../../../tools/test/vitest/helpers';
import { Image, type ImageProps } from './Image';

const PIC = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#3b82f6"/></svg>');
// A path the test server doesn't have: the picture fails to load.
const BROKEN = '/__no-such-picture__/none.png';
const frame = (id: string) => document.querySelector(`[data-testid=${id}]`) as HTMLElement;
// In the frame: the picture (or the button that views it), then the fallback span when it failed, then the remove button.
const FALLBACK = ':scope > :is(img, picture) + span', REMOVE = ':scope > button:not([aria-haspopup])';
const box = (id: string) => {
  const f = frame(id), r = f.getBoundingClientRect(), i = f.querySelector('img');
  return { w: Math.round(r.width), h: Math.round(r.height), state: f.dataset.state, fit: i && css(i).objectFit, radius: css(f).borderTopLeftRadius };
};
const Pic = ({ id, frameStyle, frameClass, imgRef, ...p }: Partial<ImageProps> & { id: string; frameStyle?: React.CSSProperties; frameClass?: string; imgRef?: React.Ref<HTMLImageElement> }) =>
  <Image src={PIC} alt="" {...p} ref={imgRef} frameProps={{ 'data-testid': id, className: frameClass, style: { width: 200, ...frameStyle } } as React.HTMLAttributes<HTMLSpanElement>} />;
const Row = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '16px', width: '900px' }}>{children}</div>;

function Viewer({ removed }: { removed: () => void }) {
  return <Pic id="view" fullSrc={PIC + '#full'} alt="Harbor at dusk" ratio="video" viewable onRemove={removed} />;
}
const dialog = () => frame('view').querySelector('dialog') as HTMLDialogElement;
const viewBtn = () => frame('view').querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement;
const finished = () => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));

describe('Image', () => {
  test('an <img> with alt and loading="lazy" in a frame; ref and className go to the img, frameProps to the frame', async () => {
    const r = React.createRef<HTMLImageElement>();
    await render(<Pic id="auto" frameClass="frame-extra" alt="A blue banner" className="extra" imgRef={r} />);
    const f = frame('auto'), i = f.querySelector('img')!;
    expect([r.current === i, /extra/.test(i.className), /frame-extra/.test(f.className), i.alt, i.loading, f.dataset.component]).toEqual([true, true, true, 'A blue banner', 'lazy', 'image']);
  });

  test('renders where there is no matchMedia (jsdom, where apps run unit tests) instead of throwing (L8E45)', async () => {
    vi.stubGlobal('matchMedia', undefined);
    try {
      const screen = await render(<Image src="/a.png" alt="Bare" />);
      expect(screen.container.querySelector('img')?.alt).toBe('Bare');
    } finally { vi.unstubAllGlobals(); }
  });

  test('ratio: auto keeps the picture\'s shape (200×100), square 200×200, 4:3 200×150, video 200×113, 2 → 200×100; cover by default, contain when asked; rounded 8px unless rounded={false}', async () => {
    await render(<Row>
      <Pic id="auto" alt="A blue banner" />
      <Pic id="square" alt="Square" ratio="square" />
      <Pic id="four" alt="Four by three" ratio="4:3" fit="contain" />
      <Pic id="video" alt="Wide" ratio="video" rounded={false} />
      <Pic id="num" alt="Two to one" ratio={2} />
    </Row>);
    const ids = ['auto', 'square', 'four', 'video', 'num'];
    await expect.poll(() => ids.map((id) => frame(id).dataset.state)).toEqual(ids.map(() => 'loaded'));
    const s = Object.fromEntries(ids.map((id) => [id, box(id)]));
    expect(ids.map((id) => s[id].h)).toEqual([100, 200, 150, 113, 100]);
    expect(ids.every((id) => s[id].w === 200)).toBe(true);
    expect([s.square.fit, s.four.fit]).toEqual(['cover', 'contain']);
    expect([s.square.radius, s.video.radius]).toEqual(['8px', '0px']);
  });

  test('ratio auto with width and height: the frame has their shape while the picture loads, so the text under it doesn\'t move; it shrinks to a narrower container', async () => {
    const slow = `/__slow-picture__.svg?${crypto.randomUUID()}`;
    await render(<div style={{ width: '300px' }}>
      <Image src={slow} alt="Slow" width={800} height={600} frameProps={{ 'data-testid': 'sized' } as React.HTMLAttributes<HTMLSpanElement>} />
      <p id="after-pic">Below</p>
    </div>);
    const before = Math.round(document.getElementById('after-pic')!.getBoundingClientRect().top);
    expect([frame('sized').dataset.state, box('sized').w, box('sized').h]).toEqual(['loading', 300, 225]);
    await expect.poll(() => frame('sized').dataset.state, { timeout: 5000 }).toBe('loaded');
    expect([box('sized').w, box('sized').h, Math.round(document.getElementById('after-pic')!.getBoundingClientRect().top)]).toEqual([300, 225, before]);
  });

  test('loading and decoding: lazy and async by default; priority loads at once with fetchpriority="high"; your own props win', async () => {
    await render(<Row>
      <Pic id="lazy" alt="Lazy" ratio="square" />
      <Pic id="hero" alt="Hero" ratio="video" priority />
      <Pic id="own" alt="Own" ratio="square" priority loading="lazy" decoding="sync" />
    </Row>);
    const img = (id: string) => frame(id).querySelector('img')!;
    const at = (id: string) => [img(id).getAttribute('loading'), img(id).getAttribute('decoding'), img(id).getAttribute('fetchpriority')];
    expect([at('lazy'), at('hero'), at('own')]).toEqual([['lazy', 'async', null], ['eager', 'async', 'high'], ['lazy', 'sync', 'high']]);
  });

  test('while loading: the picture is hidden and the frame shows the placeholder fill; then it appears', async () => {
    // The test server sends this picture after a second (vitest.config.ts), so it is still loading at first.
    await render(<Pic id="slow" alt="Slow" ratio="square" src={`/__slow-picture__.svg?${crypto.randomUUID()}`} />);
    const f = frame('slow');
    // Hidden from the first frame after mount (server HTML shows it: below).
    await expect.poll(() => css(f.querySelector('img')).opacity).toBe('0');
    expect([f.dataset.state, css(f).backgroundColor]).toEqual(['loading', color('var(--surface-muted)')]);
    await expect.poll(() => box('slow').state, { timeout: 5000 }).toBe('loaded');
    await expect.poll(() => css(f.querySelector('img')).opacity).toBe('1');
  });

  test('server HTML, before any script runs: the picture isn\'t hidden (it paints as it arrives, also with no JavaScript), above the loading sweep', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(<Image src={`/__slow-picture__.svg?${crypto.randomUUID()}`} alt="Hero" ratio="video" frameProps={{ style: { width: 200 } }} />);
    const f = host.querySelector('[data-component=image]') as HTMLElement, i = f.querySelector('img')!;
    expect([f.dataset.state, css(i).opacity, css(i).position]).toEqual(['loading', '1', 'relative']);
    host.remove();
  });

  test('on error: a broken-image icon named by the alt text (role="img") keeps the frame; fallback replaces the icon', async () => {
    await render(<Row>
      <Pic id="broken" src={BROKEN} alt="Team photo" ratio="square" />
      <Pic id="custom" src={BROKEN} alt="Logo" ratio="square" fallback={<span className="my-fallback">No logo</span>} />
    </Row>);
    await expect.poll(() => [frame('broken').dataset.state, frame('custom').dataset.state]).toEqual(['error', 'error']);
    const f = frame('broken'), fb = f.querySelector(FALLBACK)!;
    expect([css(f.querySelector('img')).visibility, fb.getAttribute('role'), fb.getAttribute('aria-label'), fb.querySelector<HTMLElement>('[data-icon]')?.dataset.icon, Math.round(f.getBoundingClientRect().height)])
      .toEqual(['hidden', 'img', 'Team photo', 'broken_image', 200]);
    expect(frame('custom').querySelector(FALLBACK)!.textContent).toBe('No logo');
  });

  test('on error, what was passed to the picture stays: className, style, id, data-* and the ref, and the frame keeps the size they gave it (GJ1)', async () => {
    const ref = React.createRef<HTMLImageElement>();
    const size = (id: string) => { const r = document.getElementById(id)!.closest('[data-component="image"]')!.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    await render(<Row>
      <Image id="gcls" src={BROKEN} alt="Team" ratio="video" className="w-48" data-x="y" ref={ref} />
      <Image id="gsty" src={BROKEN} alt="Team" ratio="video" style={{ width: 240 }} />
      <Image id="gnone" src={BROKEN} alt="Team" ratio="video" />
    </Row>);
    await expect.poll(() => document.getElementById('gnone')?.closest('[data-component="image"]')?.getAttribute('data-state')).toBe('error');
    await expect.poll(() => document.getElementById('gcls')?.closest('[data-component="image"]')?.getAttribute('data-state')).toBe('error');
    const i = document.getElementById('gcls') as HTMLImageElement;
    expect([ref.current === i, i.dataset.x, i.classList.contains('w-48'), size('gcls'), size('gsty'), size('gnone')[0] >= 48])
      .toEqual([true, 'y', true, [192, 108], [240, 135], true]);
  });

  test('with a fixed ratio and no size of its own, the frame takes its container\'s width: loading, broken and loaded are the same shape, so nothing jumps (GR21)', async () => {
    const slow = `/__slow-picture__.svg?${crypto.randomUUID()}`;
    const size = (id: string) => { const r = document.getElementById(id)!.closest('[data-component="image"]')!.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const state = (id: string) => document.getElementById(id)!.closest('[data-component="image"]')!.getAttribute('data-state');
    await render(<div style={{ width: 300 }}>
      <Image id="fslow" src={slow} alt="Slow" ratio="video" />
      <Image id="fbroken" src={BROKEN} alt="Broken" ratio="video" />
      <Image id="fok" src={PIC} alt="Loaded" ratio="video" />
      <Image id="fsmall" src={PIC} alt="Own width" ratio="video" className="w-24" />
    </div>);
    await expect.poll(() => [state('fbroken'), state('fok'), state('fsmall')]).toEqual(['error', 'loaded', 'loaded']);
    expect([state('fslow'), size('fslow'), size('fbroken'), size('fok'), size('fsmall')]).toEqual(['loading', [300, 169], [300, 169], [300, 169], [96, 54]]);
  });

  test('a new src starts over: a broken picture given a good src loads it; a slow one replaced before it arrives shows the new one, and the old answer changes nothing', async () => {
    const slow = `/__slow-picture__.svg?${crypto.randomUUID()}`;
    const r = await render(<Pic id="next" alt="Team photo" ratio="square" src={BROKEN} />);
    await expect.poll(() => box('next').state).toBe('error');
    await r.rerender(<Pic id="next" alt="Team photo" ratio="square" src={PIC} />);
    await expect.poll(() => [box('next').state, frame('next').querySelector('img')?.getAttribute('src')]).toEqual(['loaded', PIC]);
    await r.rerender(<Pic id="next" alt="Team photo" ratio="square" src={slow} />);
    expect(box('next').state).toBe('loading');
    await r.rerender(<Pic id="next" alt="Team photo" ratio="square" src={BROKEN} />);
    await expect.poll(() => box('next').state).toBe('error');
    // The slow picture's answer comes after a second: by then nothing shows it, and the error stays.
    await new Promise((done) => setTimeout(done, 1300));
    const i = frame('next').querySelector('img');
    expect([box('next').state, i?.getAttribute('src'), i && css(i).visibility]).toEqual(['error', BROKEN, 'hidden']);
  });

  test('viewable: the picture is a button named "View image: <alt>" with a zoom-in cursor; the remove button is "Remove image: <alt>"', async () => {
    await render(<Viewer removed={() => {}} />);
    const b = viewBtn();
    expect([b.getAttribute('aria-label'), b.getAttribute('aria-haspopup'), css(b).cursor, frame('view').querySelector(REMOVE)!.getAttribute('aria-label')])
      .toEqual(['View image: Harbor at dusk', 'dialog', 'zoom-in', 'Remove image: Harbor at dusk']);
  });

  test('Enter opens a Dialog titled with the alt text, showing fullSrc, with focus inside; Escape closes it and focus returns to the picture', async () => {
    await render(<Viewer removed={() => {}} />);
    viewBtn().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => dialog().open).toBe(true);
    await finished();
    const d = dialog(), full = d.querySelector<HTMLImageElement>('img')!;
    // The Dialog is titled with the alt text, so the picture is alt="" (not read twice).
    expect([d.querySelector('h2')!.textContent, full.getAttribute('src')!.endsWith('#full'), full.getAttribute('alt'), d.contains(document.activeElement)]).toEqual(['Harbor at dusk', true, '', true]);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog().open).toBe(false);
    expect(document.activeElement).toBe(viewBtn());
  });

  test('the viewer: with no fullSrc it shows the largest srcSet candidate; its stage has the picture\'s shape (width and height, 2:1) and the placeholder fill while the picture loads', async () => {
    const slow = `/__slow-picture__.svg?${crypto.randomUUID()}`;
    await render(<Pic id="set" alt="Harbor" ratio="video" viewable width={400} height={200} srcSet={`${PIC}#small 400w, ${slow} 1600w, ${PIC}#mid 800w`} />);
    await userEvent.click(frame('set').querySelector('button')!);
    const stage = () => frame('set').querySelector<HTMLElement>('dialog [data-state]')!;
    await expect.poll(() => stage()).toBeTruthy();
    const r = stage().getBoundingClientRect();
    expect([stage().querySelector('img')!.getAttribute('src'), stage().dataset.state, css(stage()).backgroundColor, Math.round(r.width / r.height)]).toEqual([slow, 'loading', color('var(--surface-muted)'), 2]);
    await expect.poll(() => stage().dataset.state, { timeout: 5000 }).toBe('loaded');
  });

  test('the viewer: a full-size picture that fails shows the fallback (named by the alt text), not the browser\'s broken image', async () => {
    await render(<Pic id="vb" alt="Harbor" ratio="video" viewable fullSrc={BROKEN} />);
    await expect.poll(() => frame('vb').dataset.state).toBe('loaded');
    await userEvent.click(frame('vb').querySelector('button')!);
    await expect.poll(() => frame('vb').querySelector<HTMLElement>('dialog [data-state]')?.dataset.state).toBe('error');
    const fb = frame('vb').querySelector('dialog [role=img]')!;
    expect([fb.getAttribute('role'), fb.getAttribute('aria-label'), !!fb.querySelector('svg'), frame('vb').querySelector('dialog img')]).toEqual(['img', 'Harbor', true, null]);
  });

  test('a click opens it too, and the × closes it', async () => {
    await render(<Viewer removed={() => {}} />);
    await userEvent.click(viewBtn());
    await expect.poll(() => dialog().open).toBe(true);
    await finished();
    await userEvent.click(dialog().querySelector('button[aria-label="Close"]')!);
    await expect.poll(() => dialog().open).toBe(false);
  });

  test('onRemove in a gallery: once the picture is gone, focus goes to the next one\'s ×, else the one before, not to the page', async () => {
    function Gallery() {
      const [left, setLeft] = React.useState(['a', 'b', 'c']);
      return <Row>{left.map((k) => <Pic key={k} id={'g' + k} src={PIC} alt={'Photo ' + k} ratio="square" style={{ width: '120px' }} onRemove={() => setLeft((l) => l.filter((x) => x !== k))} />)}</Row>;
    }
    await render(<Gallery />);
    const x = (k: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="Remove image: Photo ${k}"]`)!;
    x('a').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement).toBe(x('b'));
    x('c').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement).toBe(x('b'));
  });

  test('onRemove: the remove button calls it without opening the viewer, 8px from the top end corner', async () => {
    let removed = 0;
    await render(<Viewer removed={() => { removed++; }} />);
    const rm = frame('view').querySelector(REMOVE)!;
    await userEvent.click(rm);
    expect([removed, dialog().open]).toEqual([1, false]);
    const f = frame('view').getBoundingClientRect(), r = rm.getBoundingClientRect();
    expect([Math.round(r.top - f.top), Math.round(f.right - r.right)]).toEqual([8, 8]);
  });

  test('contrast: the fallback icon and the remove button\'s icon keep 3:1 in all six themes', async () => {
    await render(<Row><Pic id="broken" src={BROKEN} alt="Team photo" ratio="square" /><Viewer removed={() => {}} /></Row>);
    await expect.poll(() => frame('broken').dataset.state).toBe('error');
    const f = frame('broken'), fb = f.querySelector(FALLBACK)!, rm = frame('view').querySelector(REMOVE)!, low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // The remove button's colors transition into the new theme: read them once that's done.
      await finished();
      for (const [name, fg, bg] of [['fallback icon', css(fb).color, css(f).backgroundColor], ['remove icon', css(rm).color, css(rm).backgroundColor]] as const) {
        const r = contrast(fg, bg);
        if (r < 3) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('--image-radius overrides one image', async () => {
    await render(<Pic id="tok" alt="Token" ratio="square" frameStyle={{ '--image-radius': '3px' } as React.CSSProperties} />);
    expect(box('tok').radius).toBe('3px');
  });
});

describe('Image loading motion', () => {
  keepMotion();

  test('once the script runs, a lazy picture still loading a frame later is hidden and fades in (opacity, 200ms) when it arrives; a priority one is never hidden', async () => {
    await render(<><Pic id="lazy" alt="Lazy" ratio="square" src={`/__slow-picture__.svg?${crypto.randomUUID()}`} />
      <Pic id="hero" alt="Hero" ratio="square" priority src={`/__slow-picture__.svg?${crypto.randomUUID()}`} /></>);
    const img = (id: string) => frame(id).querySelector('img')!;
    await expect.poll(() => css(img('lazy')).opacity).toBe('0');
    expect([frame('lazy').dataset.state, frame('hero').dataset.state, css(img('hero')).opacity]).toEqual(['loading', 'loading', '1']);
    await expect.poll(() => frame('lazy').dataset.state, { timeout: 5000 }).toBe('loaded');
    expect([css(img('lazy')).transitionProperty, css(img('lazy')).transitionDuration, css(img('hero')).transitionDuration]).toEqual(['opacity', '0.2s', '0s']);
  });

  test('a server-rendered picture still loading when the page hydrates stays shown (it may have painted in part); one mounted later on the client is hidden', async () => {
    const ui = <Image src={`/__slow-picture__.svg?${crypto.randomUUID()}`} alt="Hero" ratio="video" frameProps={{ style: { width: 200 } }} />;
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(ui);
    const root = hydrateRoot(host, ui);
    await render(<Pic id="client" alt="Client" ratio="square" src={`/__slow-picture__.svg?${crypto.randomUUID()}`} />);
    await expect.poll(() => css(frame('client').querySelector('img')).opacity).toBe('0');
    const f = host.querySelector('[data-component=image]') as HTMLElement;
    expect([f.dataset.state, css(f.querySelector('img')).opacity]).toEqual(['loading', '1']);
    root.unmount(); host.remove();
  });

  test('a lazy picture that fails after it was hidden drops the fade class, so a broken frame is the same however late it fails', async () => {
    await render(<Pic id="late" alt="Late" ratio="square" src={`/__slow-picture__.svg?broken&${crypto.randomUUID()}`} />);
    await expect.poll(() => css(frame('late').querySelector('img')).opacity).toBe('0');
    await expect.poll(() => frame('late').dataset.state, { timeout: 5000 }).toBe('error');
    expect(frame('late').classList.contains('dk-image--fades')).toBe(false);
  });

  test('while loading: a lighter band sweeps through the fill every 2s (ease-move, forever) on translate, a layer three frames wide behind the remove button; the frame itself stays opaque (EE1)', async () => {
    await render(<Pic id="sweep" alt="Slow" ratio="square" onRemove={() => {}} src={`/__slow-picture__.svg?${crypto.randomUUID()}`} />);
    const f = frame('sweep'), s = getComputedStyle(f, '::before');
    expect(`${s.animationName} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationIterationCount}`).toBe('dk-image-sweep 2s cubic-bezier(0.65, 0, 0.35, 1) infinite');
    expect([Math.round(parseFloat(s.width) / f.getBoundingClientRect().width), s.pointerEvents, css(f).opacity, css(f).animationName]).toEqual([3, 'none', '1', 'none']);
    const run = f.getAnimations({ subtree: true }).find((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === 'dk-image-sweep')!;
    // read the band where the sweep ends (Firefox hands back the keyframe's var() unresolved): two frames on,
    // a percentage of the band, three frames wide, or a length
    run.pause();
    run.currentTime = 1999;
    const t = getComputedStyle(f, '::before').translate;
    const moved = t.endsWith('%') ? parseFloat(t) / 100 * 3 : parseFloat(t) / f.getBoundingClientRect().width;
    run.play();
    expect(Math.round(moved)).toBe(2);
    await expect.poll(() => f.dataset.state, { timeout: 5000 }).toBe('loaded');
    expect(getComputedStyle(f, '::before').content).toBe('none');
  });
  test('sizes (H9): a lazy picture whose srcSet lists widths gets sizes="auto" (with the given sizes after it as the fallback); x descriptors, priority or a sizes already starting with auto are left alone', async () => {
    const W = `${PIC}#a 400w, ${PIC}#b 800w`, X = `${PIC}#a 1x, ${PIC}#b 2x`;
    await render(<Row>
      <Pic id="w" srcSet={W} />
      <Pic id="given" srcSet={W} sizes="(max-width: 600px) 100vw, 200px" />
      <Pic id="already" srcSet={W} sizes="auto, 50vw" />
      <Pic id="x" srcSet={X} />
      <Pic id="hero" srcSet={W} sizes="100vw" priority />
      <Pic id="eager" srcSet={W} loading="eager" />
    </Row>);
    const sizes = (id: string) => frame(id).querySelector('img')!.getAttribute('sizes');
    expect(['w', 'given', 'already', 'x', 'hero', 'eager'].map(sizes)).toEqual(['auto', 'auto, (max-width: 600px) 100vw, 200px', 'auto, 50vw', null, '100vw', null]);
  });

  test('sources (H9): a <picture> with one <source> each ahead of the <img>, the first matching one shown; the frame lays out exactly as without; sizes="auto" on lazy width lists', async () => {
    const WIDE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#ef4444"/></svg>');
    await render(<Row>
      <Pic id="plain" alt="Plain" ratio="video" />
      <Pic id="src" alt="Art directed" ratio="video" sources={[
        { srcSet: `${WIDE} 400w`, media: '(min-width: 1px)', width: 400, height: 200 },
        { srcSet: PIC, type: 'image/x-never' },
      ]} />
    </Row>);
    const f = frame('src'), i = f.querySelector('img')!;
    const list = [...f.querySelectorAll('picture > source')].map((s) => [s.getAttribute('media'), s.getAttribute('type'), s.getAttribute('sizes'), s.getAttribute('width')]);
    expect(list).toEqual([['(min-width: 1px)', null, 'auto', '400'], [null, 'image/x-never', null, null]]);
    expect(i.parentElement!.tagName).toBe('PICTURE');
    await expect.poll(() => f.dataset.state).toBe('loaded');
    expect(i.currentSrc).toBe(WIDE);
    expect(box('src')).toEqual({ ...box('plain') });
    expect([...frame('plain').querySelectorAll('picture')].length).toBe(0);
  });
  test('darkSrc (115): shown in a dark theme, not in a light one, and again when the theme changes; the viewer opens the one shown', async () => {
    const DARK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#18181b"/></svg>');
    const Themed = ({ theme }: { theme: string }) => <div data-theme={theme}><Pic id="dark" alt="Chart" ratio="video" darkSrc={DARK} viewable /></div>;
    const screen = await render(<Themed theme="blue-dark" />);
    const i = () => frame('dark').querySelector('img')!;
    expect(frame('dark').querySelector('picture > source')!.getAttribute('srcset')).toBe(DARK);
    await expect.poll(() => i().currentSrc).toBe(DARK);
    await screen.rerender(<Themed theme="blue-light" />);
    await expect.poll(() => i().currentSrc).toBe(PIC);
    // A theme set on the page without a render of the Image.
    frame('dark').parentElement!.setAttribute('data-theme', 'violet-dark');
    await expect.poll(() => i().currentSrc).toBe(DARK);
    await expect.poll(() => frame('dark').dataset.state).toBe('loaded');
    await userEvent.click(frame('dark').querySelector('button')!);
    const full = document.querySelector('dialog img') as HTMLImageElement;
    expect(full.getAttribute('src')).toBe(DARK);
  });

  test('dim (115): a loaded photo is a shade darker in a dark theme only, and the remove button stays above the layer', async () => {
    await render(<Row>
      <div data-theme="blue-dark"><Pic id="night" alt="" ratio="video" dim onRemove={() => {}} /></div>
      <div data-theme="blue-light"><Pic id="day" alt="" ratio="video" dim /></div>
      <div data-theme="blue-dark"><Pic id="plain" alt="" ratio="video" /></div>
    </Row>);
    for (const id of ['night', 'day', 'plain']) await expect.poll(() => frame(id).dataset.state).toBe('loaded');
    const layer = (id: string) => getComputedStyle(frame(id), '::after');
    expect(layer('night').content).toBe('""');
    expect(layer('night').backgroundColor).toBe('color(srgb 0 0 0 / 0.2)');
    expect(layer('day').backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(layer('plain').content).toBe('none');
    const x = frame('night').querySelector('button')!.getBoundingClientRect();
    expect(document.elementFromPoint(x.left + x.width / 2, x.top + x.height / 2)!.closest('button')).toBe(frame('night').querySelector('button'));
  });

  test('saving data (196): only a priority picture loads at once, and each takes the smallest version in its srcSet', async () => {
    const SMALL = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#22c55e"/></svg>');
    const list = `${SMALL} 200w, ${PIC} 400w`;
    Object.defineProperty(navigator, 'connection', { configurable: true, value: Object.assign(new EventTarget(), { saveData: true }) });
    try {
      await render(<Row>
        <Pic id="eager" alt="" ratio="video" loading="eager" srcSet={list} sizes="200px" />
        <Pic id="hero" alt="" ratio="video" priority srcSet={`${SMALL} 1x, ${PIC} 2x`} />
        <Pic id="art" alt="" ratio="video" sources={[{ srcSet: list, media: '(min-width: 1px)' }]} />
      </Row>);
      const img = (id: string) => frame(id).querySelector('img')!;
      expect([img('eager').getAttribute('loading'), img('eager').getAttribute('srcset'), img('eager').getAttribute('sizes')]).toEqual(['lazy', SMALL, null]);
      expect([img('hero').getAttribute('loading'), img('hero').getAttribute('srcset')]).toEqual(['eager', SMALL]);
      const source = frame('art').querySelector('source')!;
      expect([source.getAttribute('srcset'), source.getAttribute('sizes')]).toEqual([SMALL, null]);
      await expect.poll(() => img('hero').currentSrc).toBe(SMALL);
    } finally {
      delete (navigator as { connection?: unknown }).connection;
    }
    await render(<Pic id="normal" alt="" ratio="video" loading="eager" srcSet={list} sizes="200px" />);
    expect([frame('normal').querySelector('img')!.getAttribute('loading'), frame('normal').querySelector('img')!.getAttribute('srcset')]).toEqual(['eager', list]);
  });
});
