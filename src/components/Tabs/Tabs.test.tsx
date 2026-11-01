import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press, withMotion } from '../../../tools/test/vitest/helpers';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';

const el = (id: string) => document.getElementById(id) as HTMLElement;
// "*" marks the selected tab, "0" the one in the Tab order; "+" a shown panel, "-" a hidden one, with its text.
const state = (id: string) => {
  const r = el(id);
  return [...r.querySelectorAll<HTMLElement>('[role="tab"]')].map((x) => (x.getAttribute('aria-selected') === 'true' ? '*' : '') + x.querySelector(':scope > span:not([aria-hidden])')!.textContent + (x.tabIndex === 0 ? '0' : '')).join(' ')
    + ' | ' + [...r.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map((x) => (x.hidden ? '-' : '+') + (x.textContent || (x.querySelector('input') ? 'input' : ''))).join(' ');
};
const focused = () => { const a = document.activeElement!, l = a.querySelector(':scope > span:not([aria-hidden])'); return l ? l.textContent : a.textContent; };
const selected = (id: string) => el(id).querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')!;

function Set3(p: { icon?: boolean; dis?: boolean }) {
  return <>
    <TabList aria-label="Sections">
      <Tab value="one" icon={p.icon ? 'home' : undefined}>One</Tab><Tab value="two" disabled={p.dis}>Two</Tab><Tab value="three x">Three</Tab>
    </TabList>
    <TabPanel value="one"><input aria-label="kept" /></TabPanel>
    <TabPanel value="two">Panel two</TabPanel>
    <TabPanel value="three x" keepMounted={false}>Panel three</TabPanel>
  </>;
}
let changes: string[] = [], setCtl: (v: string) => void = () => {};
function App(props: { tref?: React.Ref<HTMLDivElement> }) {
  const [c, set] = React.useState('two'); setCtl = set;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>
    <Tabs id="un" ref={props.tref} className="extra" onValueChange={(v) => { changes.push(v); }}><Set3 icon /></Tabs>
    <Tabs id="dv" defaultValue="three x" variant="pill" size="sm"><Set3 /></Tabs>
    <Tabs id="ctl" value={c} onValueChange={(v) => { changes.push('ctl:' + v); }}><Set3 /></Tabs>
    <Tabs id="dis" activation="manual"><Set3 dis /></Tabs>
    <div dir="rtl"><Tabs id="rtl"><Set3 /></Tabs></div>
    {/* @ts-expect-error: an unknown variant and size, as plain JavaScript could pass */}
    <Tabs id="bad" variant="boxed" size="xl" style={{ '--tabs-indicator': 'rgb(1, 2, 3)', '--tabs-height-md': '40px' } as React.CSSProperties}><Set3 /></Tabs>
  </div>;
}
const setup = async (tref?: React.Ref<HTMLDivElement>) => { changes = []; await render(<App tref={tref} />); await expect.poll(() => !!selected('un')).toBe(true); };

const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

describe('Tabs', () => {
  test('with Alt, Ctrl or ⌘ the arrow keys are left to the browser (Alt+← goes back a page) (L8E28)', async () => {
    await render(<Tabs id="mk" defaultValue="p"><TabList aria-label="X"><Tab value="p">P</Tab><Tab value="q">Q</Tab></TabList></Tabs>);
    const t = document.querySelector('#mk [role=tab]') as HTMLElement;
    t.focus();
    const before = t.getAttribute('aria-selected');
    expect([modified(t), modified(t, 'ArrowLeft'), document.activeElement === t, t.getAttribute('aria-selected') === before]).toEqual([[false, false, false], [false, false, false], true, true]);
  });

  test('roles: a tablist of type="button" tabs, each controlling its tabpanel (labelled by the tab, focusable); unique ids; ref and className reach Tabs', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await setup(ref);
    const r = el('un'), l = r.querySelector('[role="tablist"]')!, tab = r.querySelector<HTMLButtonElement>('[role="tab"]')!, pn = document.getElementById(tab.getAttribute('aria-controls')!)!;
    expect([l.getAttribute('aria-label'), tab.type, pn.getAttribute('role'), pn.getAttribute('aria-labelledby') === tab.id, pn.tabIndex]).toEqual(['Sections', 'button', 'tabpanel', true, 0]);
    expect([ref.current === r, r.dataset.component, tab.querySelector(':scope > [aria-hidden]')!.getAttribute('aria-hidden')]).toEqual([true, 'tabs', 'true']);
    expect(r.className).toMatch(/extra/);
    expect(new Set([...document.querySelectorAll('[role="tab"]')].map((x) => x.id)).size).toBe(18);
  });

  test('uncontrolled without defaultValue: the first tab is selected, the only one in the Tab order; other panels hidden', async () => {
    await setup();
    expect(state('un')).toBe('*One0 Two Three | +input -Panel two -');
  });

  test('defaultValue selects that tab; keepMounted={false} renders the panel only while selected', async () => {
    await setup();
    expect(state('dv')).toBe('One Two *Three0 | -input -Panel two +Panel three');
  });

  test('click selects and calls onValueChange', async () => {
    await setup();
    await userEvent.click(el('un').querySelector('[role="tab"]:nth-child(2)')!);
    expect([state('un'), changes.join()]).toEqual(['One *Two0 Three | -input +Panel two -', 'two']);
  });

  test('L8E107: the selected tab pressed again (a click, Enter, Space) calls no onValueChange, controlled or not', async () => {
    await setup();
    const tab = (id: string, n: number) => el(id).querySelector<HTMLElement>('[role="tab"]:nth-child(' + n + ')')!;
    await userEvent.click(tab('un', 1));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(tab('ctl', 2));
    await userEvent.click(tab('ctl', 3));
    expect(changes).toEqual(['ctl:three x']);
  });

  test('keys: arrows move and select (wrapping), Home and End jump to the ends; Tab goes on to the selected panel\'s content', async () => {
    await setup();
    await userEvent.click(el('un').querySelector('[role="tab"]:nth-child(2)')!);
    selected('un').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Three');
    expect(state('un')).toMatch(/^One Two \*Three0/);
    await userEvent.keyboard('{ArrowRight}'); expect(focused()).toBe('One');
    await userEvent.keyboard('{ArrowLeft}'); expect(focused()).toBe('Three');
    await userEvent.keyboard('{End}'); expect(focused()).toBe('Three');
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe('One');
    expect(state('un')).toMatch(/^\*One0/);
    await userEvent.keyboard('{Tab}');
    const a = document.activeElement!;
    expect(a.getAttribute('aria-label') === 'kept' || a.getAttribute('role') === 'tabpanel').toBe(true);
  });

  test('controlled: a click only asks (onValueChange); value decides', async () => {
    await setup();
    await userEvent.click(el('ctl').querySelector('[role="tab"]:nth-child(1)')!);
    expect(state('ctl')).toMatch(/^One \*Two0/);
    expect(changes).toContain('ctl:one');
    React.act(() => setCtl('three x'));
    expect(state('ctl')).toMatch(/^One Two \*Three0/);
  });

  test('keyboard table: Space selects the focused tab, as Enter does (FH1)', async () => {
    await setup();
    selected('dis').focus();
    await userEvent.keyboard('{ArrowRight}[Space]');
    expect(state('dis')).toMatch(/^One Two \*Three0/);
  });

  test('manual activation: arrows only move (skipping a disabled tab), Enter selects', async () => {
    await setup();
    selected('dis').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Three');
    expect(state('dis')).toMatch(/^\*One0/);
    await userEvent.keyboard('{Enter}');
    expect(state('dis')).toMatch(/^One Two \*Three0/);
    expect(el('dis').querySelector<HTMLButtonElement>('[role="tab"]:nth-child(2)')!.disabled).toBe(true);
  });

  test('right-to-left: ArrowLeft goes to the next tab', async () => {
    await setup();
    selected('rtl').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Two');
  });

  test('closing the selected tab (uncontrolled) selects the next enabled one, or else the previous; the list stays in the Tab order; controlled warns instead', async () => {
    const calls: string[] = [];
    function Closable(p: { controlled?: boolean }) {
      const [open, setOpen] = React.useState(['a', 'b', 'c', 'd']);
      const [v, setV] = React.useState('b');
      const extra = p.controlled ? { value: v, onValueChange: setV } : { defaultValue: 'b', onValueChange: (x: string) => calls.push(x) };
      return <div><Tabs id={p.controlled ? 'ctl' : 'cl'} {...extra}>
        <TabList aria-label="Files">{open.map((x) => <Tab key={x} value={x} disabled={x === 'c'}>{x.toUpperCase()}</Tab>)}</TabList>
        {open.map((x) => <TabPanel key={x} value={x}>Panel {x}</TabPanel>)}
      </Tabs>{open.map((x) => <button key={x} id={`${p.controlled ? 'c' : 'u'}-close-${x}`} onClick={() => setOpen((o) => o.filter((y) => y !== x))}>Close {x}</button>)}</div>;
    }
    await render(<Closable />);
    const sel = () => el('cl').querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.dataset.value;
    const stops = () => [...el('cl').querySelectorAll<HTMLElement>('[role="tab"]')].filter((t) => t.tabIndex === 0).map((t) => t.dataset.value).join();
    await userEvent.click(el('u-close-b'));   // the next one, c, is disabled: d
    expect([sel(), stops(), calls.join()]).toEqual(['d', 'd', 'd']);
    expect(el('cl').querySelector('[role="tabpanel"]:not([hidden])')!.textContent).toBe('Panel d');
    await userEvent.click(el('u-close-d'));   // nothing after it that's enabled: the previous, a
    expect([sel(), stops(), calls.join()]).toEqual(['a', 'a', 'd,a']);
    await userEvent.click(el('u-close-c'));   // not the selected one: nothing changes
    expect([sel(), calls.join()]).toEqual(['a', 'd,a']);

    const warn = console.warn, warned: string[] = [];
    console.warn = (m: string) => { warned.push(m); };
    try {
      await render(<Closable controlled />);
      await userEvent.click(el('c-close-b'));
      expect(el('ctl').querySelector('[role="tab"][aria-selected="true"]')).toBe(null);
      expect(warned.join()).toMatch(/Tabs: the selected tab "b" was removed/);
    } finally { console.warn = warn; }
    // Closing the focused tab from within (its own × or a Delete key the app handles): focus goes to the tab now
    // selected, not to the page. Focus elsewhere stays put.
    let close: (x: string) => void = () => {};
    function Own() {
      const [open, setOpen] = React.useState(['p', 'q', 'r']);
      close = (x) => setOpen((o) => o.filter((y) => y !== x));
      return <><Tabs id="own" defaultValue="q"><TabList aria-label="Docs">{open.map((x) => <Tab key={x} value={x}>{x.toUpperCase()}</Tab>)}</TabList></Tabs><button id="own-out">Out</button></>;
    }
    await render(<Own />);
    selected('own').focus();
    close('q');
    await expect.poll(() => [selected('own').dataset.value, document.activeElement === selected('own')]).toEqual(['r', true]);
    el('own-out').focus();
    close('r');
    await expect.poll(() => selected('own').dataset.value).toBe('p');
    expect(document.activeElement).toBe(el('own-out'));
    await render(<Tabs id="nomatch" defaultValue="zzz"><TabList aria-label="X"><Tab value="p">P</Tab><Tab value="q">Q</Tab></TabList></Tabs>);
    expect(el('nomatch').querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.dataset.value).toBe('p');
  });

  test('line: a 1px border under the row, 36px tabs (text-sm, font-medium, 12px sides), a 2px primary line under the selected one, whose label is darker; 16px icons', async () => {
    await setup();
    const r = el('un'), sel = selected('un'), other = r.querySelector('[aria-selected="false"]')!, a = getComputedStyle(sel, '::after'), s = css(sel);
    expect([css(r.querySelector('[role="tablist"]')).borderBottomWidth, sel.getBoundingClientRect().height, a.height, a.backgroundColor]).toEqual(['1px', 36, '2px', color('var(--primary)')]);
    expect([s.fontSize, s.fontWeight, s.paddingLeft, css(sel.querySelector('[data-icon]')).fontSize]).toEqual(['14px', '500', '12px', '16px']);
    await expect.poll(() => css(sel).color).not.toBe(css(other).color);
  });

  test('pill, size sm: 32px tabs, the selected one filled in primary with 6px corners, no row border or line', async () => {
    await setup();
    const sel = selected('dv'), s = css(sel);
    await expect.poll(() => getComputedStyle(sel, '::before').backgroundColor).toBe(color('var(--primary)'));
    expect([sel.getBoundingClientRect().height, css(el('dv').querySelector('[role="tablist"]')).borderBottomStyle, s.borderTopLeftRadius, getComputedStyle(sel, '::after').content]).toEqual([32, 'none', '6px', 'none']);
  });

  test('unknown variant and size fall back to line and md; --tabs-indicator and --tabs-height-md override', async () => {
    await setup();
    const sel = selected('bad');
    expect([el('bad').dataset.variant, Math.round(sel.getBoundingClientRect().height), getComputedStyle(sel, '::after').backgroundColor]).toEqual(['line', 40, 'rgb(1, 2, 3)']);
  });

  test('focus from the keyboard: a 2px focus-ring inside the tab', async () => {
    await setup();
    // Arrive by Tab (to the panel and back) so focus counts as keyboard focus in every engine, then rove with the arrows.
    selected('un').focus();
    await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}{ArrowRight}{ArrowLeft}');
    const a = document.activeElement as HTMLElement;
    expect([a.getAttribute('role'), !!a.closest('#un')]).toEqual(['tab', true]);
    expect(css(a).boxShadow).toMatch(/0px 0px 0px 2px inset|inset 0px 0px 0px 2px/);
  });

  test('contrast: labels 4.5:1, the selected line and pill 3:1 against surface, in all six themes', async () => {
    await setup();
    const still = document.createElement('style'); still.textContent = '* { transition: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const un = el('un').querySelector('[aria-selected="false"]')!, sel = selected('un'), pill = selected('dv');
      const checks: Array<[string, string, string, number]> = [['tab', css(un).color, 'var(--surface)', 4.5], ['selected', css(sel).color, 'var(--surface)', 4.5], ['line', getComputedStyle(sel, '::after').backgroundColor, 'var(--surface)', 3], ['pill', css(pill).color, getComputedStyle(pill, '::before').backgroundColor, 4.5], ['pill fill', getComputedStyle(pill, '::before').backgroundColor, 'var(--surface)', 3]];
      for (const [k, a, c, min] of checks) { const r = contrast(a, c); n++; if (r < min) low.push(`${th} ${k}: ${r.toFixed(2)}`); }
    }
    still.remove();
    expect([low, n]).toEqual([[], 30]);
  });

  test('L8E81: a tab hidden by CSS or the hidden attribute is skipped by the arrows, Home and End, and never selected from the keyboard', async () => {
    await render(<Tabs id="h" defaultValue="a">
      <TabList aria-label="Hidden"><Tab value="z" hidden>Z</Tab><Tab value="a">A</Tab><Tab value="x" style={{ display: 'none' }}>X</Tab><Tab value="b">B</Tab><Tab value="y" hidden>Y</Tab></TabList>
      <TabPanel value="z">pz</TabPanel><TabPanel value="a">pa</TabPanel><TabPanel value="x">px</TabPanel><TabPanel value="b">pb</TabPanel><TabPanel value="y">py</TabPanel>
    </Tabs>);
    selected('h').focus();
    const seen: (string | null)[] = [];
    for (const k of ['{ArrowRight}', '{ArrowRight}', '{ArrowLeft}', '{End}', '{Home}', '{ArrowLeft}']) { await userEvent.keyboard(k); seen.push(focused() + ':' + selected('h').dataset.value); }
    expect(seen).toEqual(['B:b', 'A:a', 'B:b', 'B:b', 'A:a', 'B:b']);
  });

  test('GR67: when the selected tab is hidden by CSS, the first shown tab takes the Tab stop, and gives it back once the selected one shows again', async () => {
    await render(<><button id="before">Before</button><Tabs id="hs" defaultValue="a">
      <TabList aria-label="Hidden selected"><Tab value="a">A</Tab><Tab value="b">B</Tab><Tab value="c" disabled>C</Tab></TabList>
      <TabPanel value="a">pa</TabPanel><TabPanel value="b">pb</TabPanel>
    </Tabs></>);
    const stops = () => Array.from(document.querySelectorAll<HTMLElement>('#hs [role="tab"]')).map((t) => t.tabIndex).join();
    expect(stops()).toBe('0,-1,-1');
    // A responsive class hides the selected tab: the next shown, enabled tab is reachable with Tab.
    (document.querySelector('#hs [data-value="a"]') as HTMLElement).style.display = 'none';
    await expect.poll(stops).toBe('0,0,-1');
    (document.getElementById('before') as HTMLElement).focus();
    await userEvent.tab();
    expect(focused()).toBe('B');
    (document.querySelector('#hs [data-value="a"]') as HTMLElement).style.display = '';
    await expect.poll(stops).toBe('0,-1,-1');
  });
});

// Server rendering: without defaultValue the first enabled tab is picked while rendering, so the HTML already
// has a selected tab in the Tab order and its panel visible. (aria-controls comes after mount, once the panels
// are known, since a tab row may have no TabPanel at all.)
describe('Tabs on the server', () => {
  test('uncontrolled with no defaultValue: the first enabled tab is selected in the HTML', () => {
    const html = renderToString(
      <Tabs>
        <TabList aria-label="Sections">
          <Tab value="a" disabled>A</Tab>
          <Tab value="b">B</Tab>
          <Tab value="c">C</Tab>
        </TabList>
        <TabPanel value="b">Panel B</TabPanel>
        <TabPanel value="c">Panel C</TabPanel>
      </Tabs>,
    );
    const box = document.createElement('div');
    box.innerHTML = html;
    const tabs = [...box.querySelectorAll('[role="tab"]')].map((t) => [t.getAttribute('aria-selected'), t.getAttribute('tabindex')]);
    expect(tabs).toEqual([['false', '-1'], ['true', '0'], ['false', '-1']]);
    expect([...box.querySelectorAll('[role="tabpanel"]')].map((p) => (p as HTMLElement).hidden)).toEqual([false, true]);
  });

  test('pressed: an unselected pill tab held down fills with pressed until it is selected', async () => {
    await setup();
    const t = el('dv').querySelector<HTMLElement>('[role="tab"][aria-selected="false"]')!;
    await press(t, () => expect.poll(() => css(t).backgroundColor).toBe(color('var(--pressed)')));
  });

  test('controlled with a value no tab has: the first enabled tab takes the Tab stop, so the list is still reachable', async () => {
    await render(<><button id="tb4">Before</button><Tabs id="tf" value="missing" onValueChange={() => undefined}>
      <TabList aria-label="Views"><Tab value="a" disabled>A</Tab><Tab value="b">B</Tab><Tab value="c">C</Tab></TabList>
      <TabPanel value="b">Panel B</TabPanel></Tabs><button id="ta4">After</button></>);
    const tabs = [...el('tf').querySelectorAll<HTMLElement>('[role="tab"]')];
    await expect.poll(() => tabs.map((t) => t.tabIndex).join()).toBe('-1,0,-1');
    expect(tabs.some((t) => t.getAttribute('aria-selected') === 'true')).toBe(false);
    el('tb4').focus();
    await userEvent.tab();
    expect(focused()).toBe('B');
  });

  test('a kept panel of another tab is hidden="until-found" with no height; find-in-page\'s beforematch selects its tab (CN1)', async () => {
    await setup();
    const panels = [...el('un').querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels.map((p) => p.getAttribute('hidden'))).toEqual([null, 'until-found', '']);   // three isn't kept: plainly hidden
    expect(Math.round(panels[1].getBoundingClientRect().height)).toBe(0);
    panels[1].dispatchEvent(new Event('beforematch'));
    await expect.poll(() => selected('un').textContent).toBe('Two');
    expect([changes, panels[1].hidden, panels[0].getAttribute('hidden')]).toEqual([['two'], false, 'until-found']);
    // A disabled tab's panel stays plainly hidden, so a match can't pick it.
    const dis = [...el('dis').querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(dis.map((p) => p.getAttribute('hidden'))).toEqual([null, '', '']);
  });

  test('only the shown panel is in the Tab order: a kept panel of another tab has no size to land on (CO1)', async () => {
    await setup();
    const panels = [...el('un').querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels.map((p) => p.tabIndex)).toEqual([0, -1, -1]);
    (el('un').querySelector('[role="tab"][aria-selected="true"]') as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(panels[0]);
    await userEvent.tab();
    expect(panels).not.toContain(document.activeElement);
    panels[1].dispatchEvent(new Event('beforematch'));
    await expect.poll(() => panels.map((p) => p.tabIndex)).toEqual([-1, 0, -1]);
  });

  test('overflow (O4): 20 tabs in 400px with the last selected: it is scrolled into view; the start edge fades while tabs are past it, the end only while tabs are past it; nothing fades when it fits', async () => {
    const many = Array.from({ length: 20 }, (_, i) => 'Tab ' + (i + 1));
    function Wide() {
      const [v, set] = React.useState('Tab 20');
      return <div style={{ width: '400px' }}>
        <Tabs id="ov" value={v} onValueChange={set}><TabList aria-label="Many">{many.map((t) => <Tab key={t} value={t}>{t}</Tab>)}</TabList></Tabs>
        <Tabs id="fit"><TabList aria-label="Few"><Tab value="a">A</Tab><Tab value="b">B</Tab></TabList></Tabs>
        <button id="first" onClick={() => set('Tab 1')}>first</button>
      </div>;
    }
    await render(<Wide />);
    const list = el('ov').querySelector<HTMLElement>('[role="tablist"]')!;
    // Polled: once the fonts load, the tabs change width and the list scrolls the selected one back into view.
    await expect.poll(() => { const box = list.getBoundingClientRect(), t = selected('ov').getBoundingClientRect(); return [list.scrollLeft > 0, t.right <= box.right + 0.5, t.left >= box.left]; }).toEqual([true, true, true]);
    await expect.poll(() => [list.hasAttribute('data-fade-before'), list.hasAttribute('data-fade-after')]).toEqual([true, false]);
    // The fade eases in (KW13): stops at 16% and 84% between clear and solid, so it has no hard line where it starts.
    expect([/linear-gradient/.test(css(list).maskImage), (css(list).maskImage.match(/0\.16\)/g) || []).length, (css(list).maskImage.match(/0\.84\)/g) || []).length]).toEqual([true, 2, 2]);
    await userEvent.click(el('first'));
    await expect.poll(() => [list.scrollLeft, list.hasAttribute('data-fade-before'), list.hasAttribute('data-fade-after')]).toEqual([0, false, true]);
    const fit = el('fit').querySelector<HTMLElement>('[role="tablist"]')!;
    expect([fit.hasAttribute('data-fade-before'), fit.hasAttribute('data-fade-after'), css(fit).maskImage]).toEqual([false, false, 'none']);
  });

  test('the fade grows in and shrinks away (177) once the list scrolls: its width is a typed property, so it transitions instead of jumping; on mount it is just there', async () => {
    await withMotion(async () => {
      await render(<div style={{ width: '200px' }}><Tabs id="fd"><TabList aria-label="Fade">{['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'].map((t) => <Tab key={t} value={t}>{t}</Tab>)}</TabList></Tabs></div>);
      const list = el('fd').querySelector<HTMLElement>('[role="tablist"]')!;
      // On mount the fade is just there; it eases once the list scrolls. (After the fonts: they scroll the selected tab back into view.)
      expect([list.hasAttribute('data-fade-after'), list.getAnimations().length]).toEqual([true, 0]);
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(r));
      // A first nudge, too small to fade anything, so the list counts as scrolled.
      list.scrollTo({ left: 1, behavior: 'instant' });
      await expect.poll(() => list.hasAttribute('data-scrolled')).toBe(true);
      // Read the moment the start fade turns on, before the transition can end.
      const on = new Promise<void>((r) => { const mo = new MutationObserver(() => { if (list.hasAttribute('data-fade-before')) { mo.disconnect(); r(); } }); mo.observe(list, { attributes: true }); });
      list.scrollTo({ left: 60, behavior: 'instant' });
      await on;
      const moving = list.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty);
      const mid = parseFloat(css(list).getPropertyValue('--dk-tabs-fade-a'));
      await Promise.all(list.getAnimations().map((a) => a.finished));
      expect([moving, mid >= 0 && mid < 32, css(list).getPropertyValue('--dk-tabs-fade-a')]).toEqual([['--dk-tabs-fade-a'], true, '32px']);
    });
  });

  test('orientation="vertical": aria-orientation vertical, the tabs in a column at the start with the line on their end side; ↓ and ↑ move and select (wrapping), ← → do nothing', async () => {
    await render(<Tabs id="ver" orientation="vertical"><Set3 /></Tabs>);
    const list = el('ver').querySelector<HTMLElement>('[role="tablist"]')!, tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect([list.getAttribute('aria-orientation'), el('ver').dataset.orientation, Math.round(tabs[1].getBoundingClientRect().left - tabs[0].getBoundingClientRect().left), tabs[1].getBoundingClientRect().top > tabs[0].getBoundingClientRect().top]).toEqual(['vertical', 'vertical', 0, true]);
    const panel = el('ver').querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!;
    expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(list.getBoundingClientRect().right);
    expect([css(list).borderInlineEndWidth, css(list).borderBottomWidth]).toEqual(['1px', '0px']);
    const line = getComputedStyle(tabs[0], '::after');
    expect([line.width, line.height === '2px']).toEqual(['2px', false]);
    tabs[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('Two');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Two');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect([focused(), selected('ver').textContent]).toEqual(['Three', 'Three']);
  });

  test('the line and the pill fill slide from the tab selected before (EG1): the line starts where it was, on translate and scale; the pill fill is cut from its shape to the new one, round corners kept (GO1); both come to rest in place', async () => {
    await withMotion(async () => {
      await setup();
      const tabs = [...el('un').querySelectorAll<HTMLElement>('[role="tab"]')];
      await userEvent.click(tabs[2]);
      const moves = tabs[2].getAnimations({ subtree: true }).filter((a): a is CSSTransition => a instanceof CSSTransition && (a.effect as KeyframeEffect).pseudoElement === '::after');
      const start = moves.find((a) => a.transitionProperty === 'translate'), shift = start ? parseFloat(String((start.effect as KeyframeEffect).getKeyframes()[0].translate)) : NaN;
      expect([moves.map((a) => a.transitionProperty).sort(), Math.round(shift)]).toEqual([['scale', 'translate'], Math.round(tabs[0].offsetLeft - tabs[2].offsetLeft)]);
      await Promise.all(moves.map((a) => a.finished));
      expect([getComputedStyle(tabs[2], '::after').translate, getComputedStyle(tabs[2], '::after').scale]).toEqual(['none', 'none']);

      const pills = [...el('dv').querySelectorAll<HTMLElement>('[role="tab"]')];
      const [from, to] = [pills[2], pills[0]];
      await userEvent.click(to);
      const cuts = to.getAnimations({ subtree: true }).filter((a): a is CSSTransition => a instanceof CSSTransition && (a.effect as KeyframeEffect).pseudoElement === '::before');
      const first = String((cuts[0]?.effect as KeyframeEffect | undefined)?.getKeyframes()[0].clipPath ?? '');
      const px = (c: string) => (c.match(/-?[\d.]+px/g) || []).slice(0, 4).map((n) => Math.round(parseFloat(n)));
      // Cut to the last tab: its start edge is where that tab starts, from this one's (the fill spans both).
      expect([cuts.map((a) => a.transitionProperty), px(first)[3], /round/.test(first), cuts.some((a) => a.transitionProperty === 'scale')]).toEqual([['clip-path'], Math.round(from.offsetLeft - to.offsetLeft), true, false]);
      await Promise.all(cuts.map((a) => a.finished));
      const rest = getComputedStyle(to, '::before'), r = to.getBoundingClientRect(), box = { w: parseFloat(rest.width), cut: px(rest.clipPath) };
      expect([Math.round(box.w - box.cut[1] - box.cut[3]), box.cut[0], box.cut[2], /round/.test(rest.clipPath)]).toEqual([Math.round(r.width), 0, 0, true]);
    });
  });
});

describe('Tabs indicator from the keyboard (KW1)', () => {
  test('an arrow moves the line and the pill fill at once, with no slide; a click after slides again', async () => {
    await withMotion(async () => {
      await setup();
      for (const id of ['un', 'dv']) {
        const tabs = [...el(id).querySelectorAll<HTMLElement>('[role="tab"]')];
        const on = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
        const runs = (t: HTMLElement) => t.getAnimations({ subtree: true }).filter((a) => a instanceof CSSTransition && /^(translate|scale|clip-path)$/.test(a.transitionProperty)).length;
        const was = on();
        was.focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect([id, on() !== was, runs(on())]).toEqual([id, true, 0]);
        await userEvent.click(was);
        expect([id, on() === was, runs(was) > 0]).toEqual([id, true, true]);
      }
    });
  });
});

describe('Tabs indicator after a keyboard pick, moved from elsewhere (GR61)', () => {
  test('controlled: an arrow moves the line at once; then a mouse click on an outside Next button slides it, with no data-instant', async () => {
    await withMotion(async () => {
      const order = ['a', 'b', 'c'];
      function App() {
        const [v, set] = React.useState('a');
        return <>
          <Tabs id="gr61" value={v} onValueChange={set}><TabList aria-label="Steps">{order.map((k) => <Tab key={k} value={k}>Step {k}</Tab>)}</TabList></Tabs>
          <button id="gr61-next" onClick={() => set(order[(order.indexOf(v) + 1) % order.length])}>Next</button>
        </>;
      }
      await render(<App />);
      const tabs = [...document.querySelectorAll<HTMLElement>('#gr61 [role="tab"]')];
      const on = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      const runs = (t: HTMLElement) => t.getAnimations({ subtree: true }).filter((a) => a instanceof CSSTransition && /^(translate|scale|clip-path)$/.test(a.transitionProperty)).length;
      tabs[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      expect([on() === tabs[1], tabs[1].hasAttribute('data-instant'), runs(tabs[1])]).toEqual([true, true, 0]);
      await userEvent.click(document.getElementById('gr61-next')!);
      expect([on() === tabs[2], tabs[2].hasAttribute('data-instant'), runs(tabs[2]) > 0]).toEqual([true, false, true]);
    });
  });
});

describe('Tabs indicator turned back mid-slide (GQ8)', () => {
  // The selected tab's transitions on one pseudo-element, held halfway.
  const slides = (t: HTMLElement, pseudo: string) => t.getAnimations({ subtree: true }).filter((a): a is CSSTransition => a instanceof CSSTransition && (a.effect as KeyframeEffect).pseudoElement === pseudo);
  const halfway = (all: CSSTransition[]) => { for (const a of all) { a.pause(); a.currentTime = Number(a.effect!.getTiming().duration) / 2; } };
  const nums = (v: string) => (v.match(/-?[\d.]+/g) || []).map(Number);
  test('picking another tab while the line or the fill is still sliding starts the new slide from where it has got to, not from the last tab (EH1)', async () => {
    await withMotion(async () => {
      await setup();
      const tabs = [...el('un').querySelectorAll<HTMLElement>('[role="tab"]')];
      await userEvent.click(tabs[2]);
      halfway(slides(tabs[2], '::after'));
      const at = tabs[2].offsetLeft + nums(getComputedStyle(tabs[2], '::after').translate)[0];
      expect(Math.abs(at - tabs[2].offsetLeft)).toBeGreaterThan(8);
      await userEvent.click(tabs[1]);
      const move = slides(tabs[1], '::after').find((a) => a.transitionProperty === 'translate')!;
      const from = tabs[1].offsetLeft + parseFloat(String((move.effect as KeyframeEffect).getKeyframes()[0].translate));
      expect(Math.abs(from - at)).toBeLessThan(1);

      const pills = [...el('dv').querySelectorAll<HTMLElement>('[role="tab"]')];   // Three is selected: slide to One
      await userEvent.click(pills[0]);
      const held = slides(pills[0], '::before');
      halfway(held);
      const span = (t: HTMLElement) => parseFloat(t.style.getPropertyValue('--dk-tabs-span-l')) || 0;
      const edge = pills[0].offsetLeft - span(pills[0]) + nums(getComputedStyle(pills[0], '::before').clipPath.split(' round')[0])[3];
      expect(Math.abs(edge - pills[0].offsetLeft)).toBeGreaterThan(8);
      await userEvent.click(pills[1]);
      const cut = slides(pills[1], '::before')[0];
      const first = nums(String((cut.effect as KeyframeEffect).getKeyframes()[0].clipPath).split(' round')[0]);
      expect(Math.abs(pills[1].offsetLeft - span(pills[1]) + first[3] - edge)).toBeLessThan(1);
    });
  });
});

describe('Tabs in a grid or flex row (GO2)', () => {
  test('a long tab row in a 320px grid track or flex row scrolls in its box instead of widening the row', async () => {
    const names = ['Overview', 'Members and permissions', 'Billing and invoices', 'Integrations', 'Audit log'];
    const row = (id: string) => <Tabs id={id} defaultValue="0"><TabList aria-label="Settings">{names.map((n, i) => <Tab key={i} value={String(i)}>{n}</Tab>)}</TabList>{names.map((n, i) => <TabPanel key={i} value={String(i)}>{n}</TabPanel>)}</Tabs>;
    await render(<div style={{ width: '320px' }}>
      <div id="go2-grid" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>{row('go2-g')}</div>
      <div id="go2-flex" style={{ display: 'flex' }}>{row('go2-f')}</div>
    </div>);
    for (const [box, tabs] of [['go2-grid', 'go2-g'], ['go2-flex', 'go2-f']]) {
      const list = document.querySelector<HTMLElement>(`#${tabs} [role="tablist"]`)!;
      expect([document.getElementById(box)!.scrollWidth, document.getElementById(tabs)!.getBoundingClientRect().width <= 320, list.scrollWidth > list.clientWidth]).toEqual([320, true, true]);
    }
  });
});

describe('Tabs inside a shadow root (GR60)', () => {
  test('the arrows, Home and End move focus and the selection, as on the page', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      await render(<Tabs defaultValue="a"><TabList aria-label="Shadow"><Tab value="a">A</Tab><Tab value="b">B</Tab><Tab value="c">C</Tab></TabList></Tabs>, { container: inner });
      const root = host.shadowRoot!, tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
      const at = () => [tabs.indexOf(root.activeElement as HTMLElement), tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')];
      tabs[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(at()).toEqual([1, 1]);
      await userEvent.keyboard('{End}');
      expect(at()).toEqual([2, 2]);
      await userEvent.keyboard('{Home}');
      expect(at()).toEqual([0, 0]);
    } finally { host.remove(); }
  });
});

describe('Tabs and form validation (L8E100)', () => {
  test('L8E100 a required field on a tab that is not selected: submitting the form selects its tab and focuses the field; the submit was stopped with nothing shown', async () => {
    let sent = 0;
    await render(<form onSubmit={(e) => { e.preventDefault(); sent++; }}>
      <Tabs defaultValue="one"><TabList aria-label="Steps"><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList>
        <TabPanel value="one">First</TabPanel><TabPanel value="two"><label htmlFor="l8e100-city">City</label><input id="l8e100-city" required /></TabPanel></Tabs>
      <button id="l8e100-go">Send</button>
    </form>);
    await expect.poll(() => document.getElementById('l8e100-city')!.closest('[hidden]')?.getAttribute('hidden')).toBe('until-found');
    await userEvent.click(document.getElementById('l8e100-go')!);
    await expect.poll(() => document.activeElement?.id).toBe('l8e100-city');
    expect([sent, document.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')]).toEqual([0, 'true']);
  });
});
