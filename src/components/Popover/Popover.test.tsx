import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, settle } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Popover } from './Popover';
import { Tooltip } from '../Tooltip/Tooltip';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const panel = (tid: string) => el(tid).nextElementSibling as HTMLElement;
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

  test('closed: the trigger has aria-haspopup="dialog" and aria-expanded="false"; the panel is hidden and empty', async () => {
    await render(<Share />);
    const b = el('tshare'), p = panel('tshare');
    expect([b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded'), b.getAttribute('aria-controls')]).toEqual(['dialog', 'false', null]);
    expect([p.getAttribute('role'), p.hidden, p.children.length]).toEqual(['dialog', true, 0]);
  });

  test('opening: a dialog named by its title in the top layer, centered under the trigger 8px away; 256px wide, 16px padding, 8px corners; focus on the first control', async () => {
    await render(<Share />);
    await userEvent.click(el('tshare'));
    await settle(100);
    const b = el('tshare'), p = panel('tshare'), title = p.querySelector('.dk-popover__title') as HTMLElement, s = getComputedStyle(p);
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
    await settle(50);
    expect(isOpen('tshare')).toBe(false);
    expect(active()).toBe('other');
  });

  test('the title is an <h2> by default (14px, 8px under it, no other margin); headingLevel sets its level, and an unknown one falls back to 2', async () => {
    await render(<div style={{ display: 'flex', gap: '200px', justifyContent: 'center' }}>
      <Popover title="Share" trigger={<Button id="th2">A</Button>}><p>One</p></Popover>
      <Popover title="Filters" headingLevel={4} trigger={<Button id="th4">B</Button>}><p>Two</p></Popover>
      <Popover title="Odd" headingLevel={9 as 2} trigger={<Button id="th9">C</Button>}><p>Three</p></Popover>
    </div>);
    const heading = (tid: string) => panel(tid).querySelector('.dk-popover__title') as HTMLElement;
    const tags: string[] = [];
    for (const tid of ['th2', 'th4', 'th9']) {
      await userEvent.click(el(tid)); await settle(50);
      tags.push(heading(tid).tagName);
      expect(panel(tid).getAttribute('aria-labelledby')).toBe(heading(tid).id);
      const s = getComputedStyle(heading(tid));
      expect([s.fontSize, s.marginTop, s.marginBottom, s.marginInlineStart]).toEqual(['14px', '0px', '8px', '0px']);
    }
    expect(tags).toEqual(['H2', 'H4', 'H2']);
  });

  test('aria-label names it without a title; right-start sits to the right, tops lined up; initialFocus="panel" focuses the panel', async () => {
    await render(<Popover aria-label="Info" placement="right-start" initialFocus="panel" trigger={<Button id="tinfo">Info</Button>}><p>Plain text, nothing to focus.</p></Popover>);
    await userEvent.click(el('tinfo'));
    await settle(100);
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
    await settle(100);
    expect(panel('tlow').dataset.side).toBe('top');
    expect(rect(panel('tlow')).bottom).toBeLessThanOrEqual(rect(el('tlow')).top);
  });

  test('Popover tokens (--popover-width, --popover-padding) override one popover', async () => {
    await render(<Popover title="Tok" style={{ '--popover-width': '300px', '--popover-padding': '7px' } as React.CSSProperties} trigger={<Button id="ttok">Tok</Button>}><p>t</p></Popover>);
    await userEvent.click(el('ttok'));
    await settle(100);
    expect([panel('ttok').offsetWidth, getComputedStyle(panel('ttok')).paddingTop]).toEqual([300, '7px']);
  });

  test('contrast: text and title keep 4.5:1 on the panel in all six themes', async () => {
    await render(<Popover title="Tok" trigger={<Button id="tc">C</Button>}><p>t</p></Popover>);
    await userEvent.click(el('tc'));
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const p = panel('tc'), bg = getComputedStyle(p).backgroundColor;
      for (const [name, e] of [['text', p], ['title', p.querySelector('.dk-popover__title')!]] as const) {
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

});
