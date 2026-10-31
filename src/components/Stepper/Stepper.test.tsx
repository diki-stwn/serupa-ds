import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors, press, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { Stepper, type StepperStep } from './Stepper';

// The tests that read digits say they mean en-US: with no locale, a count is in the browser's digits ("٣" in ar-EG).
const EnUS = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US">{children}</SerupaProvider>;

const STEPS: StepperStep[] = [{ title: 'Account', description: 'Email and password' }, { title: 'Profile', optional: true }, { title: 'Billing' }, { title: 'Review' }];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const lis = (id: string) => [...el(id).querySelectorAll('li')];
const rect = (e: Element) => e.getBoundingClientRect();
const steps = (id: string) => lis(id).map((li) => ({
  state: li.dataset.state, cur: li.getAttribute('aria-current'),
  ind: li.querySelector<HTMLElement>('.dk-stepper__indicator .dk-icon')?.dataset.icon || li.querySelector('.dk-stepper__indicator')!.textContent,
  text: li.querySelector('.dk-stepper__title')!.textContent, btn: !!li.querySelector('button'),
}));

let clicks: number[] = [], setCur: (n: number) => void = () => {};
function App(props: { sref?: React.Ref<HTMLElement> }) {
  const [c, set] = React.useState(2); setCur = set;
  return <div style={{ width: '640px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <Stepper id="st" steps={STEPS} current={c} ref={props.sref} className="extra" onStepClick={(i) => { clicks.push(i); set(i); }} />
    <Stepper id="err" steps={[{ title: 'Upload' }, { title: 'Check', status: 'error' }, { title: 'Done' }]} current={1} aria-label="Import" labels={{ error: 'needs attention' }} />
    <Stepper id="warn" steps={[{ title: 'Details' }, { title: 'Photos', status: 'warning' }, { title: 'Publish' }]} current={2} />
    <Stepper id="any" steps={STEPS} current={1} clickable="all" onStepClick={(i) => { clicks.push(i); }} />
    <Stepper id="ver" orientation="vertical" steps={STEPS} current={1} />
    <Stepper id="sm" size="sm" steps={STEPS} current={4} />
    <div dir="rtl"><Stepper id="rtl" steps={STEPS.slice(0, 3)} current={1} /></div>
    <Stepper id="tok" steps={STEPS.slice(0, 2)} current={0} style={{ '--stepper-active-bg': 'rgb(1, 2, 3)' } as React.CSSProperties} />
  </div>;
}
const setup = async (sref?: React.Ref<HTMLElement>) => { clicks = []; await render(<App sref={sref} />, { wrapper: EnUS }); };

describe('Stepper', () => {
  test('step numbers are written in the digits of the locale, as Calendar writes its days: ٣ ٤ in ar-EG', async () => {
    await render(<SerupaProvider locale="ar-EG"><Stepper id="sar" current={1} steps={[{ title: 'One' }, { title: 'Two' }, { title: 'Three' }, { title: 'Four' }]} /></SerupaProvider>);
    const shown = [...document.querySelectorAll('#sar .dk-stepper__indicator')].map((e) => e.textContent);
    expect(shown.slice(2)).toEqual(['٣', '٤']);
  });

  test('a <nav aria-label="Progress"> around an <ol> of 4 steps, 3 lines between them; description and "Optional"; ref and className reach the nav', async () => {
    const ref = React.createRef<HTMLElement>();
    await setup(ref);
    const n = el('st'), li = lis('st');
    expect([n.tagName, n.getAttribute('aria-label'), n.firstElementChild!.tagName, li.length, ref.current === n, n.dataset.component]).toEqual(['NAV', 'Progress', 'OL', 4, true, 'stepper']);
    expect(n.className).toMatch(/extra/);
    expect([li[0].querySelector('.dk-stepper__description')!.textContent, li[1].querySelector('.dk-stepper__optional')!.textContent, n.querySelectorAll('.dk-stepper__connector').length]).toEqual(['Email and password', 'Optional', 3]);
  });

  test('current=2: steps 1 and 2 complete with a check (read as "…, completed"), step 3 current with aria-current="step", step 4 upcoming with its number; with onStepClick only completed steps are buttons', async () => {
    await setup();
    const s = steps('st');
    expect(s.map((x) => x.state)).toEqual(['complete', 'complete', 'current', 'upcoming']);
    expect(s.map((x) => x.ind)).toEqual(['check', 'check', '3', '4']);
    expect([s[0].text, s[2].cur, s.filter((x) => x.cur).length]).toEqual(['Account, completed', 'step', 1]);
    expect(s.map((x) => x.btn)).toEqual([true, true, false, false]);
  });

  test('forced colors: the current and completed circles are Highlight with HighlightText, kept as is (no backplate hides the number or check)', async () => {
    await render(<Stepper id="hc" steps={STEPS} current={1} />);
    const ind = (i: number) => lis('hc')[i].querySelector('.dk-stepper__indicator')!;
    const r = await forcedColors((active) => active && [0, 1, 2].map((i) => css(ind(i)).forcedColorAdjust));
    if (r) expect(r).toEqual(['none', 'none', 'auto']);
  });

  test('clicking a completed step calls onStepClick with its index; it works from the keyboard too', async () => {
    await setup();
    await userEvent.click(el('st').querySelector('li:first-child button')!);
    expect([clicks.join(), steps('st')[0].state]).toEqual(['0', 'current']);
    React.act(() => setCur(2));
    el('st').querySelector<HTMLElement>('li:nth-child(2) button')!.focus();
    await userEvent.keyboard('{Enter}');
    expect(clicks.join()).toBe('0,1');
  });

  test('going back to a step keeps focus on it: the step it becomes holds focus, not the page, and Tab goes on from there (GN1)', async () => {
    function Back() { const [c, set] = React.useState(2); return <Stepper id="gn1" steps={STEPS} current={c} onStepClick={set} />; }
    await render(<Back />);
    el('gn1').querySelector<HTMLElement>('li:nth-child(2) button')!.focus();
    await userEvent.keyboard('{Enter}');
    const head = lis('gn1')[1].querySelector('[tabindex="-1"]')!;
    expect([steps('gn1')[1].state, document.activeElement === head, head.tagName, head.getAttribute('tabindex')]).toEqual(['current', true, 'DIV', '-1']);
    await userEvent.click(lis('gn1')[0].querySelector('button')!);
    expect([steps('gn1')[0].state, document.activeElement === lis('gn1')[0].querySelector('[tabindex="-1"]')]).toEqual(['current', true]);
  });

  test('keyboard table: Tab goes to each completed step\'s button and skips the rest; Space on one goes to that step; without onStepClick nothing takes focus (FH1)', async () => {
    const got: number[] = [];
    await render(<div><button id="kb-before">before</button><Stepper id="kb-st" steps={STEPS} current={2} onStepClick={(i) => got.push(i)} /><Stepper id="kb-plain" steps={STEPS} current={2} /><button id="kb-after">after</button></div>);
    el('kb-before').focus();
    const order: string[] = [];
    for (let i = 0; i < 3; i++) { await userEvent.tab(); order.push(document.activeElement?.closest('li')?.textContent?.slice(0, 7) || document.activeElement!.id); }
    await userEvent.tab({ shift: true });
    await userEvent.keyboard(' ');
    expect([order, got]).toEqual([['Account', 'Profile', 'kb-after'], [1]]);
  });

  test('horizontal: 32px circles; each 2px line sits level with the circles\' middle, 8px from the text and the next circle', async () => {
    await setup();
    const geo = lis('st').slice(0, 3).map((li) => {
      const i = rect(li.querySelector('.dk-stepper__indicator')!), c = rect(li.querySelector('.dk-stepper__connector')!), nx = rect(li.nextElementSibling!.querySelector('.dk-stepper__indicator')!), head = rect(li.querySelector('.dk-stepper__head')!);
      return [Math.round((c.top + c.bottom) / 2 - (i.top + i.bottom) / 2), c.height, Math.round(c.left - head.right), Math.round(nx.left - c.right), Math.round(i.width)];
    });
    expect(geo).toEqual([[0, 2, 8, 8, 32], [0, 2, 8, 8, 32], [0, 2, 8, 8, 32]]);
  });

  test('lines after completed steps are primary, others field-border; only the current circle has a ring', async () => {
    await setup();
    const li = lis('st'), c = (l: Element, s: string) => css(l.querySelector(s));
    expect(c(li[0], '.dk-stepper__connector').backgroundColor).not.toBe(c(li[2], '.dk-stepper__connector').backgroundColor);
    expect([c(li[2], '.dk-stepper__indicator').outlineStyle, c(li[0], '.dk-stepper__indicator').outlineStyle]).toEqual(['solid', 'none']);
  });

  test('status="error": danger circle with a mark, read as "…, needs attention" (labels); aria-label names the nav', async () => {
    await setup();
    const e = steps('err');
    expect([e[1].state, e[1].ind, e[1].text, el('err').getAttribute('aria-label')]).toEqual(['error', 'priority_high', 'Check, needs attention', 'Import']);
  });

  test('status="warning": a warning-subtle circle with a warning mark, read as "…, needs attention"; it wins over complete', async () => {
    await setup();
    const w = steps('warn');
    expect([w[1].state, w[1].ind, w[1].text, w[0].state]).toEqual(['warning', 'warning', 'Photos, needs attention', 'complete']);
    expect(css(lis('warn')[1].querySelector('.dk-stepper__indicator')).backgroundColor).not.toBe(css(lis('err')[1].querySelector('.dk-stepper__indicator')).backgroundColor);
  });

  test('clickable="all": every step but the current one is a button, upcoming ones too, and clicking one calls onStepClick', async () => {
    await setup();
    expect(steps('any').map((s) => s.btn)).toEqual([true, false, true, true]);
    await userEvent.click(lis('any')[3].querySelector('button')!);
    await userEvent.click(lis('any')[0].querySelector('button')!);
    expect(clicks).toEqual([3, 0]);
  });

  test('vertical: a 2px line runs down the middle of each circle, 8px from it and from the next', async () => {
    await setup();
    const v = lis('ver').slice(0, 3).map((li) => {
      const i = rect(li.querySelector('.dk-stepper__indicator')!), c = rect(li.querySelector('.dk-stepper__connector')!), nx = rect(li.nextElementSibling!.querySelector('.dk-stepper__indicator')!);
      return [Math.round((c.left + c.right) / 2 - (i.left + i.right) / 2), c.width, Math.round(c.top - i.bottom), Math.round(nx.top - c.bottom)];
    });
    expect(v).toEqual([[0, 2, 8, 8], [0, 2, 8, 8], [0, 2, 8, 8]]);
  });

  test('sm: 24px circles, text-xs; current=steps.length marks every step complete, with no current step', async () => {
    await setup();
    expect([rect(el('sm').querySelector('.dk-stepper__indicator')!).width, lis('sm').every((li) => li.dataset.state === 'complete'), !!el('sm').querySelector('[aria-current]'), css(el('sm').querySelector('.dk-stepper__title')).fontSize]).toEqual([24, true, false, '12px']);
  });

  test('right-to-left: steps run from the right', async () => {
    await setup();
    const li = lis('rtl');
    expect(rect(li[0]).left).toBeGreaterThan(rect(li[1]).left);
  });

  test('contrast: numbers and text keep 4.5:1, circles, rings and marks 3:1, in all six themes', async () => {
    await setup();
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor, li = lis('st'), err = lis('err')[1], warn = lis('warn')[1], c = (l: Element, s: string) => css(l.querySelector(s));
      const pairs: Array<[string, string, string, number]> = [
        ['upcoming number', c(li[3], '.dk-stepper__indicator').color, c(li[3], '.dk-stepper__indicator').backgroundColor, 4.5],
        ['upcoming ring', c(li[3], '.dk-stepper__indicator').borderTopColor, page, 3],
        ['current number', c(li[2], '.dk-stepper__indicator').color, c(li[2], '.dk-stepper__indicator').backgroundColor, 4.5],
        ['complete circle', c(li[0], '.dk-stepper__indicator').backgroundColor, page, 3],
        ['error mark', c(err, '.dk-stepper__indicator').color, c(err, '.dk-stepper__indicator').backgroundColor, 3],
        ['warning mark', c(warn, '.dk-stepper__indicator').color, c(warn, '.dk-stepper__indicator').backgroundColor, 3],
        ['warning ring', c(warn, '.dk-stepper__indicator').borderTopColor, page, 3],
        ['title', c(li[0], '.dk-stepper__title').color, page, 4.5],
        ['description', c(li[0], '.dk-stepper__description').color, page, 4.5]];
      for (const [k, fg, bg, min] of pairs) { const r = contrast(fg, bg); n++; if (r < min) low.push(`${th} ${k}: ${r.toFixed(2)}`); }
    }
    expect([low, n]).toEqual([[], 54]);
  });

  test('--stepper-active-bg overrides one stepper', async () => {
    await setup();
    expect(css(el('tok').querySelector('.dk-stepper__indicator')).backgroundColor).toBe('rgb(1, 2, 3)');
  });
  test('a long single word in a title wraps, in the line under the circles and in a vertical stepper, so 320px never scrolls sideways (RF1, WCAG 1.4.10)', async () => {
    const long = [{ title: 'Account' }, { title: 'Donaudampfschifffahrtsgesellschaftskapitänskajüte', optional: true }, { title: 'Review' }];
    await render(<div style={{ width: '320px' }}><Stepper id="lh" steps={long} current={1} /><Stepper id="lv" orientation="vertical" steps={long} current={1} /></div>);
    expect([el('lh').className.includes('dk-stepper--compact'), el('lh').scrollWidth <= 320, el('lv').scrollWidth <= 320]).toEqual([true, true, true]);
  });

  test('too narrow for the titles side by side (320px): circles only, "Step 3 of 4: Billing" under them, no sideways scroll; wide again: titles back', async () => {
    let setW: (w: number) => void = () => {};
    function Narrow() {
      const [w, set] = React.useState(320); setW = set;
      return <div id="box" style={{ width: w + 'px' }}><Stepper id="nar" steps={STEPS} current={2} /><Stepper id="nv" orientation="vertical" steps={STEPS} current={2} /></div>;
    }
    await render(<Narrow />);
    const n = el('nar');
    expect(n.className).toMatch(/dk-stepper--compact/);
    expect(n.scrollWidth).toBeLessThanOrEqual(320);
    const circles = [...n.querySelectorAll('.dk-stepper__indicator')].map(rect);
    for (let i = 1; i < circles.length; i++) expect(circles[i].left).toBeGreaterThanOrEqual(circles[i - 1].right);
    const summary = n.querySelector('.dk-stepper__summary') as HTMLElement;
    expect([summary.textContent, summary.getAttribute('aria-hidden')]).toEqual(['Step 3 of 4: Billing', 'true']);
    // The titles stay in the list for screen readers: clipped to 1px, not removed.
    const title = lis('nar')[0].querySelector('.dk-stepper__text') as HTMLElement;
    expect([title.textContent, rect(title).width <= 1, css(title).display !== 'none']).toEqual(['Account, completedEmail and password', true, true]);
    expect(el('nv').className).not.toMatch(/compact/);
    setW(720);
    await expect.poll(() => n.className).not.toMatch(/compact/);
    expect(n.querySelector('.dk-stepper__summary')).toBeNull();
    setW(320);
    await expect.poll(() => n.className).toMatch(/compact/);
  });

  test('eight steps in a 288px column: the lines shrink to 4px and the circles take the sm size, so the row fits; four steps keep the md circles (GN2)', async () => {
    const EIGHT = Array.from({ length: 8 }, (_, i) => ({ title: 'Step title ' + (i + 1) }));
    await render(<div style={{ width: '288px' }}><Stepper id="eight" steps={EIGHT} current={3} /><Stepper id="four" steps={STEPS} current={2} /></div>);
    const n = el('eight'), dots = (id: string) => [...el(id).querySelectorAll('li > * > :first-child')].map(rect);
    expect(n.className).toMatch(/dk-stepper--compact.*dk-stepper--tight/);
    expect(n.scrollWidth).toBeLessThanOrEqual(288);
    const d = dots('eight');
    expect(d.map((r) => r.width)).toEqual(Array(8).fill(24));
    for (let i = 1; i < d.length; i++) expect(d[i].left - d[i - 1].right).toBeGreaterThanOrEqual(8);
    expect(el('four').className).toMatch(/dk-stepper--compact/);
    expect(el('four').className).not.toMatch(/tight/);
    expect(dots('four').map((r) => r.width)).toEqual(Array(4).fill(32));
  });

  test('eight steps in a grid or flex item of a 320px page with 16px gutters fit too: the stepper takes the 288px it is given, LTR and RTL (GN2b)', async () => {
    const EIGHT = Array.from({ length: 8 }, (_, i) => ({ title: 'Step ' + (i + 1), description: 'Details for step ' + (i + 1) }));
    const page = (id: string, style: React.CSSProperties, dir?: string) => <div id={id + '-page'} dir={dir} style={{ width: '320px', padding: '0 16px', boxSizing: 'border-box', ...style }}><Stepper id={id} steps={EIGHT} current={3} /></div>;
    await render(<div>{page('gg', { display: 'grid' })}{page('gr', { display: 'grid' }, 'rtl')}{page('gf', { display: 'flex', flexDirection: 'column' })}</div>);
    for (const id of ['gg', 'gr', 'gf']) {
      await expect.poll(() => el(id).className).toMatch(/dk-stepper--tight/);
      expect([el(id).clientWidth, el(id).scrollWidth, el(id + '-page').scrollWidth]).toEqual([288, 288, 320]);
    }
  });

  test('pressed: a step\'s indicator shrinks to 95% while its head is held, on scale alone, and springs back (ED1)', async () => {
    await withMotion(async () => {
      await render(<Stepper id="sp" steps={STEPS} current={2} onStepClick={() => {}} />);
      const head = document.querySelector('#sp button') as HTMLButtonElement, dot = head.firstElementChild as HTMLElement;
      expect(css(dot).transitionProperty).toBe('scale');
      await press(head, () => expect.poll(() => css(dot).scale).toBe('0.95'));
      await expect.poll(() => css(dot).scale).toBe('none');
    });
  });
});

describe('Stepper before the script runs (GR62)', () => {
  const steps: StepperStep[] = [{ title: 'Account' }, { title: 'Profile', description: 'Your name and photo' }, { title: 'Review everything and confirm' }, { title: 'Done' }];
  // Lines in an element: its height over the line height.
  const lines = (e: HTMLElement) => Math.round(e.getBoundingClientRect().height / parseFloat(css(e).lineHeight));
  const words = (e: HTMLElement) => e.textContent.trim().split(/\s+/).length;
  test('server HTML on a 320px phone: no title breaks inside a word (one letter a line), and the row doesn\'t run off the page; once mounted it goes compact', async () => {
    await page.viewport(320, 640);
    const ui = <SerupaProvider locale="en-US"><Stepper steps={steps} current={1} /></SerupaProvider>;
    const host = document.createElement('div');
    host.style.width = '320px';
    host.innerHTML = renderToString(ui);
    document.body.append(host);
    try {
      const nav = host.querySelector<HTMLElement>('[data-component="stepper"]')!, titles = [...nav.querySelectorAll<HTMLElement>('.dk-stepper__list .dk-stepper__title')];
      expect([nav.hasAttribute('data-fit'), titles.every((t) => lines(t) <= words(t)), nav.scrollWidth <= 321]).toEqual([false, true, true]);
    } finally { host.remove(); }
    await render(<div style={{ width: '320px' }} id="gr62">{ui}</div>);
    const nav = document.querySelector<HTMLElement>('#gr62 [data-component="stepper"]')!;
    expect([nav.hasAttribute('data-fit'), nav.classList.contains('dk-stepper--compact')]).toEqual([true, true]);
    await page.viewport(900, 700);
  });
});
