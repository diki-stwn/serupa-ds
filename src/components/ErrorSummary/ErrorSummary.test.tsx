import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { ErrorSummary, type ErrorSummaryItem } from './ErrorSummary';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const ERRORS: ErrorSummaryItem[] = [
  { field: 'f-name', message: 'Enter your full name' },
  { field: 'f-plan-basic', message: 'Choose a plan' },
];

// A tall form: the summary on top, the fields far below it, so following a link has to scroll.
function Form({ errors = ERRORS, ...p }: { errors?: ErrorSummaryItem[] } & Partial<React.ComponentProps<typeof ErrorSummary>>) {
  return (
    <form noValidate>
      <ErrorSummary id="sum" errors={errors} {...p} />
      <div style={{ height: '150vh' }} />
      <label htmlFor="f-name" id="name-label">Full name</label>
      <input id="f-name" />
      <div style={{ height: '150vh' }} />
      <fieldset>
        <legend id="plan-legend">Plan</legend>
        <label><input type="radio" name="plan" id="f-plan-basic" /> Basic</label>
        <label><input type="radio" name="plan" id="f-plan-pro" /> Pro</label>
      </fieldset>
      <div style={{ height: '150vh' }} />
    </form>
  );
}

describe('ErrorSummary', () => {
  test('a box named by its heading, then a list of links to each field; ref, className and other props reach the box', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<ErrorSummary id="x" ref={ref} className="extra" data-x="y" autoFocus={false} errors={ERRORS} />);
    const e = el('x'), h = e.querySelector('h2')!;
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component, e.tabIndex]).toEqual(['DIV', true, 'dk-error-summary extra', 'y', 'error-summary', -1]);
    expect([e.getAttribute('aria-labelledby'), h.textContent]).toEqual([h.id, 'There are 2 problems']);
    expect(e.querySelector("ul")!.getAttribute("role")).toBe("list");   // list-style: none drops the list role in Safari
    expect([...e.querySelectorAll('li > a')].map((a) => [a.getAttribute('href'), a.textContent])).toEqual([['#f-name', 'Enter your full name'], ['#f-plan-basic', 'Choose a plan']]);
  });

  test('heading: one problem, a title, a level and a description; Indonesian from the provider; nothing with no errors', async () => {
    const screen = await render(<ErrorSummary id="s" autoFocus={false} errors={[ERRORS[0]]} />);
    expect(el('s').querySelector('h2')!.textContent).toBe('There is a problem');
    await screen.rerender(<ErrorSummary id="s" autoFocus={false} errors={ERRORS} title="Check your booking" headingLevel={3} description="Fix these first." />);
    expect([el('s').querySelector('h3')!.textContent, el('s').querySelector('h3 + div')!.textContent]).toEqual(['Check your booking', 'Fix these first.']);
    await screen.rerender(<SerupaProvider labels={idLabels}><ErrorSummary id="s" autoFocus={false} errors={ERRORS} /></SerupaProvider>);
    expect(el('s').querySelector('h2')!.textContent).toBe('Ada 2 masalah');
    await screen.rerender(<ErrorSummary id="s" errors={[]} />);
    expect(el('s')).toBeNull();
  });

  test('takes focus when it appears and when its errors change, not on other renders; autoFocus={false} leaves focus', async () => {
    const screen = await render(<Form errors={[]} />);
    (el('f-name') as HTMLInputElement).focus();
    await screen.rerender(<Form />);
    await expect.poll(() => document.activeElement).toBe(el('sum'));
    (el('f-name') as HTMLInputElement).focus();
    await screen.rerender(<Form description="Same errors, another render" />);
    expect(document.activeElement).toBe(el('f-name'));
    await screen.rerender(<Form errors={[ERRORS[1]]} />);
    await expect.poll(() => document.activeElement).toBe(el('sum'));
    await screen.rerender(<Form errors={[]} />);
    (el('f-name') as HTMLInputElement).focus();
    await screen.rerender(<Form autoFocus={false} />);
    expect(document.activeElement).toBe(el('f-name'));
  });

  test("a link focuses its field and scrolls its label (a radio's legend) to the top; a field that isn't there is a plain link", async () => {
    await render(<Form autoFocus={false} errors={[...ERRORS, { field: 'nowhere', message: 'Missing' }]} />);
    const links = [...el('sum').querySelectorAll('a')];
    await userEvent.click(links[0]);
    expect(document.activeElement).toBe(el('f-name'));
    await expect.poll(() => Math.round(el('name-label').getBoundingClientRect().top)).toBe(0);
    window.scrollTo(0, 0);
    await userEvent.click(links[1]);
    expect(document.activeElement).toBe(el('f-plan-basic'));
    await expect.poll(() => Math.round(el('plan-legend').getBoundingClientRect().top)).toBe(0);
    window.scrollTo(0, 0);
    await userEvent.click(links[2]);
    expect(location.hash).toBe('#nowhere');
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('its text and links read 4.5:1 on its background in all six themes', async () => {
    await render(<ErrorSummary id="c" autoFocus={false} errors={ERRORS} />);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = css(el('c')).backgroundColor;
      expect(contrast(css(el('c')).color, bg), th).toBeGreaterThanOrEqual(4.5);
      expect(contrast(css(el('c').querySelector('a')).color, bg), th + ' link').toBeGreaterThanOrEqual(4.5);
    }
  });
});
