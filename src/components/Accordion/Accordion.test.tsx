import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Accordion, AccordionItem } from './Accordion';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const items = (id: string) => [...el(id).querySelectorAll<HTMLElement>(':scope > .dk-accordion__item')];
const state = (id: string) => items(id).map((i) => (i.dataset.state === 'open' ? 1 : 0)).join('');
const trigger = (id: string, n: number) => items(id)[n - 1].querySelector('.dk-accordion__trigger') as HTMLButtonElement;
const panel = (id: string, n = 1) => items(id)[n - 1].querySelector('.dk-accordion__panel') as HTMLElement;
const focused = () => document.activeElement!.querySelector('.dk-accordion__title')?.textContent;
// The open and close animation finished (the panel and the chevron).
const settled = (id: string) => Promise.all(el(id).getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));

function Faq({ r, ir }: { r?: React.Ref<HTMLDivElement>; ir?: React.Ref<HTMLDivElement> }) {
  return <div style={{ width: '480px' }}>
    <Accordion id="adef" ref={r} className="extra" data-x="y">
      <AccordionItem title="Shipping" ref={ir}><p style={{ margin: 0 }}>We ship in 2 days. <a href="#x" id="inner">Rates</a></p></AccordionItem>
      <AccordionItem title="Returns">Within 30 days.</AccordionItem>
      <AccordionItem title="Locked" disabled>Never</AccordionItem>
      <AccordionItem title="Warranty">One year.</AccordionItem>
    </Accordion>
  </div>;
}

describe('Accordion', () => {
  test('structure: an <h3> holding a button (aria-expanded, aria-controls) and a region labelled by it; refs and props reach the wrapper and item', async () => {
    const r = React.createRef<HTMLDivElement>(), ir = React.createRef<HTMLDivElement>();
    await render(<Faq r={r} ir={ir} />);
    const a = el('adef'), i = a.firstElementChild as HTMLElement, hd = i.firstElementChild!, b = hd.firstElementChild as HTMLButtonElement, pn = i.lastElementChild!;
    expect([a.className, a.dataset.component, r.current === a, ir.current === i, a.dataset.x]).toEqual(['dk-accordion extra', 'accordion', true, true, 'y']);
    expect([hd.tagName, b.tagName, b.type, b.getAttribute('aria-expanded'), b.getAttribute('aria-controls') === pn.id, pn.getAttribute('role'), pn.getAttribute('aria-labelledby') === b.id])
      .toEqual(['H3', 'BUTTON', 'button', 'false', true, 'region', true]);
  });

  test('uncontrolled with no defaultValue: everything closed; closed content is hidden="until-found" (no height, not rendered, out of the tab order) and a disabled item\'s is visibility hidden', async () => {
    await render(<Faq />);
    expect(state('adef')).toBe('0000');
    const content = (n: number) => panel('adef', n).querySelector('.dk-accordion__content') as HTMLElement;
    expect([content(1).getAttribute('hidden'), css(content(1)).contentVisibility, panel('adef').getBoundingClientRect().height, document.getElementById('inner')!.checkVisibility()]).toEqual(['until-found', 'hidden', 0, false]);
    expect([content(3).hasAttribute('hidden'), css(panel('adef', 3)).visibility]).toEqual([false, 'hidden']);
    (document.getElementById('inner') as HTMLElement).focus();
    expect(document.activeElement?.id).not.toBe('inner');
  });

  test('find-in-page: a match in a closed item (beforematch) opens it, and in type="single" closes the open one; closing hides it again once the animation ends; disabled items aren\'t searchable', () => withMotion(async () => {
    await render(<Faq />);
    const content = (n: number) => panel('adef', n).querySelector('.dk-accordion__content') as HTMLElement;
    await userEvent.click(trigger('adef', 2));
    expect(state('adef')).toBe('0100');
    await settled('adef');
    // What the browser does on a match: removes hidden, then fires beforematch on that element.
    content(4).removeAttribute('hidden');
    content(4).dispatchEvent(new Event('beforematch'));
    await new Promise(requestAnimationFrame);
    expect([state('adef'), content(4).hasAttribute('hidden')]).toEqual(['0001', false]);
    // Item 2 is closing: still shown while it shrinks, until-found after.
    expect(content(2).hasAttribute('hidden')).toBe(false);
    await settled('adef');
    await expect.poll(() => content(2).getAttribute('hidden')).toBe('until-found');
    content(3).dispatchEvent(new Event('beforematch'));
    await new Promise((r) => setTimeout(r, 50));
    expect(state('adef')).toBe('0001');
  }));

  test('showExpandAll (type="multiple"): "Expand all" opens every enabled item and becomes "Collapse all", which closes them; controlled gets the values; Indonesian words from the provider; not shown in type="single"', async () => {
    const onChange = vi.fn();
    await render(<div style={{ width: '480px' }}>
      <Accordion id="aall" type="multiple" showExpandAll onValueChange={onChange}>
        <AccordionItem title="A" value="a">1</AccordionItem>
        <AccordionItem title="B" value="b" disabled>2</AccordionItem>
        <AccordionItem title="C">3</AccordionItem>
      </Accordion>
      <SerupaProvider labels={idLabels}><Accordion id="aid" type="multiple" showExpandAll><AccordionItem title="A">1</AccordionItem></Accordion></SerupaProvider>
      <Accordion id="asingle" showExpandAll><AccordionItem title="A">1</AccordionItem></Accordion>
    </div>);
    const all = (id: string) => el(id).querySelector<HTMLButtonElement>('.dk-accordion__all');
    expect([all('aall')!.textContent, all('aall')!.type, all('aid')!.textContent, all('asingle')]).toEqual(['Expand all', 'button', 'Buka semua', null]);
    await userEvent.click(all('aall')!);
    expect([state('aall'), onChange.mock.lastCall?.[0], all('aall')!.textContent]).toEqual(['101', ['a', '2'], 'Collapse all']);
    await userEvent.click(trigger('aall', 1));
    expect([state('aall'), all('aall')!.textContent]).toEqual(['001', 'Expand all']);
    await userEvent.click(all('aall')!);
    await userEvent.click(all('aall')!);
    expect([state('aall'), onChange.mock.lastCall?.[0]]).toEqual(['000', []]);
  });

  test('opening animates the height (200ms), shows the content, sets aria-expanded and turns the chevron over', () => withMotion(async () => {
    await render(<Faq />);
    const pn = panel('adef'), heights: number[] = [];
    await userEvent.click(trigger('adef', 1));
    const rows = pn.getAnimations().find((a) => (a as CSSTransition).transitionProperty === 'grid-template-rows');
    expect(rows?.effect?.getComputedTiming().duration).toBe(200);
    // Sample the height every frame until the animation ends.
    let done = false;
    void rows!.finished.then(() => { done = true; });
    while (!done) { heights.push(pn.getBoundingClientRect().height); await new Promise(requestAnimationFrame); }
    await settled('adef');
    const full = pn.getBoundingClientRect().height;
    expect(heights.some((h) => h > 0 && h < full)).toBe(true);
    expect([css(pn).visibility, trigger('adef', 1).getAttribute('aria-expanded'), css(el('adef').querySelector('.dk-accordion__icon')).rotate]).toEqual(['visible', 'true', '180deg']);
  }));

  test('type="single": opening one closes the other; collapsible (default): the open one closes again; a disabled item doesn\'t open, and fades to 50%', async () => {
    await render(<Faq />);
    await userEvent.click(trigger('adef', 1));
    await userEvent.click(trigger('adef', 2));
    expect(state('adef')).toBe('0100');
    await userEvent.click(trigger('adef', 2));
    expect(state('adef')).toBe('0000');
    await userEvent.click(trigger('adef', 3), { force: true });
    expect(state('adef')).toBe('0000');
    expect([trigger('adef', 3).disabled, css(trigger('adef', 3)).opacity]).toEqual([true, '0.5']);
  });

  test('keyboard: Down and Up move between titles (skipping disabled, wrapping), Home and End go to the ends; Enter and Space toggle the focused item; the focus ring is 2px', async () => {
    await render(<Faq />);
    trigger('adef', 1).focus();
    const seen: Array<string | undefined> = [];
    for (const k of ['{ArrowDown}', '{ArrowDown}', '{ArrowDown}', '{Home}', '{End}', '{ArrowUp}']) { await userEvent.keyboard(k); seen.push(focused()); }
    expect(seen).toEqual(['Returns', 'Warranty', 'Shipping', 'Shipping', 'Warranty', 'Returns']);
    await userEvent.keyboard('{Enter}');
    expect(state('adef')).toBe('0100');
    expect([css(trigger('adef', 2)).outlineStyle, css(trigger('adef', 2)).outlineWidth]).toEqual(['solid', '2px']);
    await userEvent.keyboard(' ');
    expect(state('adef')).toBe('0000');
  });

  test('Tab goes into open content', async () => {
    await render(<Faq />);
    await userEvent.click(trigger('adef', 1));
    await settled('adef');
    trigger('adef', 1).focus();
    await userEvent.tab();
    expect(document.activeElement!.id).toBe('inner');
  });

  test('type="multiple" with defaultValue, headingLevel 2, variant card (frame, 8px corners, 16px side padding, no double line); items open and close independently', async () => {
    await render(<Accordion id="amulti" type="multiple" defaultValue={['x', 'y']} headingLevel={2} variant="card">
      <AccordionItem value="x" title="X">x</AccordionItem><AccordionItem value="y" title="Y">y</AccordionItem><AccordionItem value="z" title="Z">z</AccordionItem>
    </Accordion>);
    const a = el('amulti'), s = css(a);
    expect(state('amulti')).toBe('110');
    expect([a.querySelector('.dk-accordion__heading')!.tagName, a.className, s.borderTopWidth, s.borderTopLeftRadius, css(a.querySelector('.dk-accordion__trigger')).paddingLeft, css(a.lastElementChild).borderBottomWidth])
      .toEqual(['H2', 'dk-accordion dk-accordion--card', '1px', '8px', '16px', '0px']);
    await userEvent.click(trigger('amulti', 3));
    await userEvent.click(trigger('amulti', 1));
    expect(state('amulti')).toBe('011');
  });

  test('single with a two-item defaultValue opens only the first; collapsible={false}: the open item stays open (aria-disabled), and opening another replaces it', async () => {
    await render(<Accordion id="afixed" collapsible={false} defaultValue={['p', 'q']}><AccordionItem value="p" title="P">p</AccordionItem><AccordionItem value="q" title="Q">q</AccordionItem></Accordion>);
    expect(state('afixed')).toBe('10');
    await userEvent.click(trigger('afixed', 1), { force: true });
    expect([state('afixed'), trigger('afixed', 1).getAttribute('aria-disabled')]).toEqual(['10', 'true']);
    await userEvent.click(trigger('afixed', 2));
    expect(state('afixed')).toBe('01');
  });

  test('controlled: onValueChange gets the open values, the parent sets them', async () => {
    const calls: string[] = [];
    function Controlled() {
      const [v, setV] = React.useState(['b']);
      return <Accordion id="actl" type="multiple" value={v} onValueChange={(x) => { calls.push(x.join('+')); setV(x); }}>
        <AccordionItem value="a" title="A">a</AccordionItem><AccordionItem value="b" title="B">b</AccordionItem>
      </Accordion>;
    }
    await render(<Controlled />);
    await userEvent.click(trigger('actl', 1));
    expect([state('actl'), calls.join()]).toEqual(['11', 'b+a']);
  });

  test('unknown variant and headingLevel fall back to plain and h3; Accordion tokens (--accordion-title-color, --accordion-padding-y) override one accordion', async () => {
    await render(<>
      {/* @ts-expect-error: unknown values, as plain JavaScript could pass */}
      <Accordion id="abad" variant="boxed" headingLevel={9}><AccordionItem title="Bad">b</AccordionItem></Accordion>
      <Accordion id="atok" style={{ '--accordion-title-color': 'rgb(1, 2, 3)', '--accordion-padding-y': '7px' } as React.CSSProperties}><AccordionItem title="T">t</AccordionItem></Accordion>
    </>);
    expect([el('abad').className, el('abad').querySelector('.dk-accordion__heading')!.tagName]).toEqual(['dk-accordion', 'H3']);
    expect([css(trigger('atok', 1)).color, css(trigger('atok', 1)).paddingTop]).toEqual(['rgb(1, 2, 3)', '7px']);
  });

  test('contrast: titles and content keep 4.5:1, the chevron 3:1, on surface in all six themes', async () => {
    await render(<Faq />);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const [sel, min] of [['.dk-accordion__trigger', 4.5], ['.dk-accordion__content', 4.5], ['.dk-accordion__icon', 3]] as const) {
        const r = contrast(css(el('adef').querySelector(sel)).color, 'var(--surface)'); n++;
        if (r < min) low.push(`${th} ${sel}: ${r.toFixed(2)}`);
      }
    }
    expect([low, n]).toEqual([[], 18]);
  });

  test('no errors or React warnings', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<Faq />);
    await userEvent.click(trigger('adef', 1));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('items inside a Fragment are items of their own: unique ids, and each opens alone', async () => {
    const admin = true;
    await render(<Accordion id="afrag"><AccordionItem title="One">1</AccordionItem>{admin && <><AccordionItem title="Two">2</AccordionItem><AccordionItem title="Three">3</AccordionItem></>}</Accordion>);
    const ids = items('afrag').map((i) => i.querySelector('.dk-accordion__trigger')!.id);
    expect(new Set(ids).size).toBe(3);
    await userEvent.click(trigger('afrag', 2));
    expect(state('afrag')).toBe('010');
    expect(document.getElementById(trigger('afrag', 2).getAttribute('aria-controls')!)!.textContent).toBe('2');
  });
});
