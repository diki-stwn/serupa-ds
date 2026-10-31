import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, withMotion, settled } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Popover } from './Popover';
import { Tooltip } from '../Tooltip/Tooltip';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const panel = (tid: string) => el(tid).nextElementSibling as HTMLElement;
// The title is the element that names the dialog (aria-labelledby).
const titleIn = (p: Element) => document.getElementById(p.getAttribute('aria-labelledby')!) as HTMLElement;
const isOpen = (tid: string) => { const p = panel(tid); return !!p && p.matches(':popover-open') && !p.hidden; };
const active = () => document.activeElement && document.activeElement.id;
const rect = (e: Element) => e.getBoundingClientRect();
// Distances in CSS px: the test page may be drawn scaled, which leaves layout px a fraction off.
const near = (a: number, b: number) => Math.abs(a - b) <= 1;

// Centered, so a 256px panel has room on both sides of its trigger.
function Share() {
  return <div style={{ display: 'flex', justifyContent: 'center' }}><Popover title="Share" className="extra" trigger={<Button id="tshare" variant="outline">Share</Button>}>
    {(close) => <div><input id="email" aria-label="Email" /><a href="#x" id="plink">Settings</a><Button id="done" onClick={close}>Done</Button></div>}
  </Popover></div>;
}

describe('Popover', () => {
  test('the panel takes the other HTML attributes and a ref: id, data-testid, aria-describedby, and an onKeyDown that can keep Escape (GJ2)', async () => {
    const ref = React.createRef<HTMLDivElement>();
    let keep = true;
    await render(<><p id="hint">Hint</p><Popover ref={ref} id="filters" data-testid="filters-pop" aria-describedby="hint" title="Filters" defaultOpen
      onKeyDown={(e) => { if (keep && e.key === 'Escape') e.preventDefault(); }} trigger={<Button id="pt">Filters</Button>}>
      <Button id="apply">Apply</Button>
    </Popover></>);
    const p = document.querySelector<HTMLElement>('[data-testid="filters-pop"]')!;
    expect(ref.current).toBe(p);
    expect(p.id).toBe('filters');
    expect(p.getAttribute('role')).toBe('dialog');
    expect(el('pt').getAttribute('aria-controls')).toBe('filters');
    expect(p.getAttribute('aria-describedby')).toBe('hint');
    expect(titleIn(p).textContent).toBe('Filters');
    await userEvent.keyboard('{Escape}');
    expect(isOpen('pt')).toBe(true);
    keep = false;
    await userEvent.keyboard('{Escape}');
    expect(isOpen('pt')).toBe(false);
  });
  test('defaultOpen: open on arrival, uncontrolled; Escape closes it by itself and tells onOpenChange(false)', async () => {
    const asks: boolean[] = [];
    await render(<Popover title="Share" defaultOpen onOpenChange={(v) => asks.push(v)} trigger={<Button id="tdef">Share</Button>}><input aria-label="Email" /></Popover>);
    await expect.poll(() => isOpen('tdef')).toBe(true);
    expect(el('tdef').getAttribute('aria-expanded')).toBe('true');
    panel('tdef').focus();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('tdef')).toBe(false);
    expect([asks.join(), el('tdef').getAttribute('aria-expanded')]).toEqual(['false', 'false']);
  });

  test('onOpenChange says why: trigger, close(), escape, outside, blur', async () => {
    const why: string[] = [];
    await render(<div><Button id="away">Away</Button><Popover title="Why" onOpenChange={(v, d) => why.push((v ? 'open ' : 'shut ') + d.reason)} trigger={<Button id="twhy">Why</Button>}>
      {(close) => <Button id="wdone" onClick={close}>Done</Button>}
    </Popover></div>);
    const reopen = async () => { await userEvent.click(el('twhy')); await expect.poll(() => isOpen('twhy')).toBe(true); };
    await reopen();
    await userEvent.click(el('wdone'));
    await expect.poll(() => isOpen('twhy')).toBe(false);
    await reopen();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('twhy')).toBe(false);
    await reopen();
    await userEvent.click(document.body, { position: { x: 5, y: 400 } });
    await expect.poll(() => isOpen('twhy')).toBe(false);
    await reopen();
    el('away').focus();
    await expect.poll(() => isOpen('twhy')).toBe(false);
    expect(why).toEqual(['open trigger', 'shut close', 'open trigger', 'shut escape', 'open trigger', 'shut outside', 'open trigger', 'shut blur']);
  });

  test('closed: the trigger has aria-haspopup="dialog" and aria-expanded="false"; the panel is hidden and empty', async () => {
    await render(<Share />);
    const b = el('tshare'), p = panel('tshare');
    expect([b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded'), b.getAttribute('aria-controls')]).toEqual(['dialog', 'false', null]);
    expect([p.getAttribute('role'), p.hidden, p.children.length]).toEqual(['dialog', true, 0]);
  });

  test('opening: a dialog named by its title in the top layer, centered under the trigger 8px away; 256px wide, 16px padding, 8px corners; focus on the first control', async () => {
    await render(<Share />);
    await userEvent.click(el('tshare'));
    await expect.poll(() => isOpen('tshare') && panel('tshare').contains(document.activeElement)).toBe(true);
    const b = el('tshare'), p = panel('tshare'), title = titleIn(p), s = getComputedStyle(p);
    expect(isOpen('tshare')).toBe(true);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(b.getAttribute('aria-controls')).toBe(p.id);
    expect(p.getAttribute('aria-labelledby')).toBe(title.id);
    expect([title.textContent, getComputedStyle(title).fontWeight, p.className, p.dataset.component]).toEqual(['Share', '600', 'dk-popover extra', 'popover']);
    expect(p.dataset.side).toBe('bottom');
    expect(near(rect(p).top - rect(b).bottom, 8)).toBe(true);
    expect(Math.abs((rect(p).left + rect(p).right) / 2 - (rect(b).left + rect(b).right) / 2)).toBeLessThanOrEqual(1);
    expect([p.offsetWidth, s.paddingTop, s.borderTopLeftRadius]).toEqual([256, '16px', '8px']);
    expect(active()).toBe('email');
  });

  test('Tab moves through the content; Escape closes it and returns focus to the trigger', async () => {
    await render(<Share />);
    await userEvent.click(el('tshare'));
    await userEvent.keyboard('{Tab}{Tab}');
    expect(active()).toBe('done');
    await userEvent.keyboard('{Escape}');
    expect(isOpen('tshare')).toBe(false);
    expect(active()).toBe('tshare');
    expect(el('tshare').getAttribute('aria-expanded')).toBe('false');
  });

  test('keyboard table: Space on the trigger opens it and moves focus inside (FH1)', async () => {
    await render(<Share />);
    el('tshare').focus();
    await userEvent.keyboard(' ');
    await expect.poll(() => isOpen('tshare')).toBe(true);
    expect(panel('tshare').contains(document.activeElement)).toBe(true);
  });

  test('Enter on the trigger opens it; a close() button inside closes it and returns focus; the trigger closes it again', async () => {
    await render(<Share />);
    el('tshare').focus();
    await userEvent.keyboard('{Enter}');
    expect(isOpen('tshare')).toBe(true);
    await userEvent.click(el('done'));
    expect(isOpen('tshare')).toBe(false);
    expect(active()).toBe('tshare');
    await userEvent.click(el('tshare'));
    await userEvent.click(el('tshare'));
    expect(isOpen('tshare')).toBe(false);
  });

  test('a click outside, or focus moving elsewhere, closes it', async () => {
    await render(<><Share /><button id="other">Other</button></>);
    await userEvent.click(el('tshare'));
    await userEvent.click(document.body, { position: { x: 800, y: 650 } });
    expect(isOpen('tshare')).toBe(false);
    await userEvent.click(el('tshare'));
    el('plink').focus();
    el('other').focus();
    await expect.poll(() => isOpen('tshare')).toBe(false);
    expect(active()).toBe('other');
  });

  test('the title is an <h2> by default (14px, 8px under it, no other margin); headingLevel sets its level, and an unknown one falls back to 2', async () => {
    await render(<div style={{ display: 'flex', gap: '200px', justifyContent: 'center' }}>
      <Popover title="Share" trigger={<Button id="th2">A</Button>}><p>One</p></Popover>
      <Popover title="Filters" headingLevel={4} trigger={<Button id="th4">B</Button>}><p>Two</p></Popover>
      <Popover title="Odd" headingLevel={9 as 2} trigger={<Button id="th9">C</Button>}><p>Three</p></Popover>
    </div>);
    const heading = (tid: string) => titleIn(panel(tid));
    const tags: string[] = [];
    for (const tid of ['th2', 'th4', 'th9']) {
      await userEvent.click(el(tid)); await expect.poll(() => isOpen(tid)).toBe(true);
      tags.push(heading(tid).tagName);
      expect(panel(tid).getAttribute('aria-labelledby')).toBe(heading(tid).id);
      const s = getComputedStyle(heading(tid));
      expect([s.fontSize, s.marginTop, s.marginBottom, s.marginInlineStart]).toEqual(['14px', '0px', '8px', '0px']);
    }
    expect(tags).toEqual(['H2', 'H4', 'H2']);
  });

  test('focus goes to the first control that can take it: past one hidden, in a closed <details>, in a disabled <fieldset> or out of the Tab order; Escape then closes it (L8E22)', async () => {
    await render(<Popover title="Filters" trigger={<Button id="tff">Filters</Button>}>
      <button id="ffh" style={{ display: 'none' }}>Hidden</button>
      <details><summary>More</summary><button id="ffd">Inside</button></details>
      <fieldset disabled><button id="ffx">Off</button></fieldset>
      <button id="ffn" tabIndex={-1}>Skipped</button>
      <input id="ffi" aria-label="Name" />
    </Popover>);
    await userEvent.click(el('tff'));
    await expect.poll(() => isOpen('tff')).toBe(true);
    expect(active()).toBe('ffi');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('tff')).toBe(false);
    expect(active()).toBe('tff');
  });

  test('aria-label names it without a title; right-start sits to the right, tops lined up; initialFocus="panel" focuses the panel', async () => {
    await render(<Popover aria-label="Info" placement="right-start" initialFocus="panel" trigger={<Button id="tinfo">Info</Button>}><p>Plain text, nothing to focus.</p></Popover>);
    await userEvent.click(el('tinfo'));
    await expect.poll(() => isOpen('tinfo') && panel('tinfo').dataset.side).toBe('right');
    const b = el('tinfo'), p = panel('tinfo');
    expect([p.getAttribute('aria-label'), p.dataset.side]).toEqual(['Info', 'right']);
    expect([near(rect(p).left - rect(b).right, 8), near(rect(p).top, rect(b).top)]).toEqual([true, true]);
    expect(document.activeElement).toBe(p);
  });

  test('a new placement while open moves it there', async () => {
    const { rerender } = await render(<Popover aria-label="Move" placement="bottom" trigger={<Button id="tmove">Move</Button>}><p>m</p></Popover>);
    await userEvent.click(el('tmove'));
    expect(panel('tmove').dataset.side).toBe('bottom');
    await rerender(<Popover aria-label="Move" placement="right" trigger={<Button id="tmove">Move</Button>}><p>m</p></Popover>);
    expect(panel('tmove').dataset.side).toBe('right');
  });

  test('controlled: onOpenChange gets each change, the parent sets it', async () => {
    const changes: boolean[] = [];
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return <Popover open={open} onOpenChange={(v) => { changes.push(v); setOpen(v); }} aria-label="Controlled" trigger={<Button id="tctl">Ctl</Button>}><p>c</p></Popover>;
    }
    await render(<Controlled />);
    await userEvent.click(el('tctl'));
    expect([isOpen('tctl'), changes.join()]).toEqual([true, 'true']);
    await userEvent.keyboard('{Escape}');
    expect([isOpen('tctl'), changes.join()]).toEqual([false, 'true,false']);
  });

  test("it flips to the top when there's no room below", async () => {
    await render(<div style={{ position: 'fixed', bottom: '8px', left: '40px' }}><Popover title="Low" trigger={<Button id="tlow">Low</Button>}><p>Flips up.</p></Popover></div>);
    await userEvent.click(el('tlow'));
    await expect.poll(() => isOpen('tlow') && panel('tlow').dataset.side).toBe('top');
    expect(rect(panel('tlow')).bottom).toBeLessThanOrEqual(rect(el('tlow')).top);
  });

  test('Popover tokens (--popover-width, --popover-padding) override one popover', async () => {
    await render(<Popover title="Tok" style={{ '--popover-width': '300px', '--popover-padding': '7px' } as React.CSSProperties} trigger={<Button id="ttok">Tok</Button>}><p>t</p></Popover>);
    await userEvent.click(el('ttok'));
    await expect.poll(() => [isOpen('ttok'), panel('ttok').offsetWidth, getComputedStyle(panel('ttok')).paddingTop]).toEqual([true, 300, '7px']);
  });

  test('contrast: text and title keep 4.5:1 on the panel in all six themes', async () => {
    await render(<Popover title="Tok" trigger={<Button id="tc">C</Button>}><p>t</p></Popover>);
    await userEvent.click(el('tc'));
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const p = panel('tc'), bg = getComputedStyle(p).backgroundColor;
      for (const [name, e] of [['text', p], ['title', titleIn(p)]] as const) {
        const r = contrast(getComputedStyle(e).color, bg);
        if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });
  test('a Tooltip around the trigger: the button gets aria-haspopup and a click opens the popover', async () => {
    await render(<Popover trigger={<Tooltip content="Filters"><Button id="tpt">Filter</Button></Tooltip>}><p id="tpc">Pick one</p></Popover>);
    const b = document.getElementById('tpt')!;
    expect([b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded')]).toEqual(['dialog', 'false']);
    await userEvent.click(b);
    await expect.poll(() => b.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(b.getAttribute('aria-controls')!)!.contains(document.getElementById('tpc'))).toBe(true);
  });

  test('the panel scales in from the point on its edge facing the trigger, level with the trigger\'s centre (EO1)', async () => {
    await render(<Share />);
    await userEvent.click(el('tshare'));
    await expect.poll(() => isOpen('tshare')).toBe(true);
    const p = panel('tshare'), b = rect(el('tshare')), r = rect(p);
    const [x, y] = getComputedStyle(p).transformOrigin.split(' ').map(parseFloat);
    expect([p.dataset.side, Math.round(y), near(r.left + x, b.left + b.width / 2)]).toEqual(['bottom', 0, true]);
  });
});

describe('Popover: motion (DZ1)', () => {
  const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
  const runs = (e: Element) => e.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => [(a).transitionProperty, ms(a)]).sort();
  test('opens with a transition and fades and shrinks out faster, its content kept (inert) until the fade ends; focus is back at once; reopened mid-way it turns back from where it is', async () => {
    await withMotion(async () => {
      await render(<Share />);
      await userEvent.click(el('tshare'));
      const p = panel('tshare');
      expect([runs(p), p.getAnimations().some((a) => a instanceof CSSAnimation)]).toEqual([[['opacity', 150], ['scale', 150]], false]);
      await settled(p);
      expect([getComputedStyle(p).opacity, getComputedStyle(p).scale]).toEqual(['1', 'none']);

      await userEvent.keyboard('{Escape}');
      expect([isOpen('tshare'), active()]).toEqual([false, 'tshare']);
      // Kept in the top layer while it fades only where overlay can be held (Chromium); elsewhere it closes at once.
      if (!CSS.supports('overlay', 'auto')) { expect(getComputedStyle(p).display).toBe('none'); return; }
      expect([getComputedStyle(p).display, p.inert, !!p.querySelector('#email'), runs(p)]).toEqual(['block', true, true, [['display', 100], ['opacity', 100], ['overlay', 100], ['scale', 100]]]);
      await settled(p);
      await expect.poll(() => p.querySelector('#email')).toBe(null);
      expect(getComputedStyle(p).display).toBe('none');

      await userEvent.click(el('tshare'));
      await settled(p);
      await userEvent.click(el('tshare'));
      await new Promise((ok) => setTimeout(ok, 40));
      const mid = Number(getComputedStyle(p).opacity);
      await userEvent.click(el('tshare'));
      expect([isOpen('tshare'), p.inert]).toEqual([true, false]);
      expect(Number(getComputedStyle(p).opacity)).toBeLessThan(1);
      expect(mid).toBeLessThan(1);
      await settled(p);
      expect(getComputedStyle(p).opacity).toBe('1');
    });
  });

  test('open on arrival (defaultOpen): there from the first frame, not faded in', async () => {
    await withMotion(async () => {
      await render(<Popover title="Share" defaultOpen trigger={<Button id="tarr">Share</Button>}><input aria-label="Email" /></Popover>);
      await expect.poll(() => isOpen('tarr')).toBe(true);
      expect([panel('tarr').getAnimations().length, getComputedStyle(panel('tarr')).opacity]).toEqual([0, '1']);
    });
  });
});
