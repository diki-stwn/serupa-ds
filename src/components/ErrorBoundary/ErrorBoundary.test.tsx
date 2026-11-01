import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { ErrorBoundary } from './ErrorBoundary';

// React reports every caught error with console.error; these tests crash on purpose, so those are expected.
let errors: { mockRestore(): void };
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { errors.mockRestore(); });

let broken = true;
function Widget({ label = 'Chart' }: { label?: string }) {
  if (broken) throw new Error('boom');
  return <button id="widget">{label}</button>;
}

describe('ErrorBoundary', () => {
  test('no error: renders the children as they are, with nothing around them', async () => {
    broken = false;
    await render(<div id="host"><ErrorBoundary><Widget /></ErrorBoundary></div>);
    expect(document.getElementById('host')!.innerHTML).toBe('<button id="widget">Chart</button>');
  });

  test('a render error: a danger Alert (role alert) with the default words and Try again; onError gets the error and the component stack; the rest of the page stays', async () => {
    broken = true;
    const onError = vi.fn<(error: unknown, info: React.ErrorInfo) => void>();
    await render(<div><p id="other">Still here</p><ErrorBoundary onError={onError} className="extra"><Widget /></ErrorBoundary></div>);
    const box = document.querySelector('[data-component="error-boundary"]') as HTMLElement;
    expect([box.className, box.querySelector('[role=alert]')?.textContent]).toEqual(['dk-error-boundary extra', expect.stringContaining('Something went wrong')]);
    expect(box.textContent).toContain("This part of the page couldn't load.");
    await expect.element(page.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect([(onError.mock.calls[0]?.[0] as Error).message, typeof onError.mock.calls[0]?.[1].componentStack]).toEqual(['boom', 'string']);
    expect(document.getElementById('other')!.textContent).toBe('Still here');
  });

  test('Try again renders the children again (and onReset runs); if they still fail, the fallback comes back', async () => {
    broken = true;
    const onReset = vi.fn();
    await render(<ErrorBoundary onReset={onReset}><Widget /></ErrorBoundary>);
    await userEvent.click(page.getByRole('button', { name: 'Try again' }));
    expect([onReset.mock.calls.length, !!document.querySelector('[data-component="error-boundary"]')]).toEqual([1, true]);
    broken = false;
    await userEvent.click(page.getByRole('button', { name: 'Try again' }));
    await expect.element(page.getByRole('button', { name: 'Chart' })).toBeInTheDocument();
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  test('focus: a crash that took focus with it moves focus to the fallback; focus elsewhere on the page stays put', async () => {
    broken = false;
    function Page({ crash }: { crash: boolean }) {
      return <><input id="elsewhere" /><ErrorBoundary>{crash ? <Thrower /> : <Widget />}</ErrorBoundary></>;
    }
    function Thrower(): React.ReactElement { throw new Error('boom'); }
    const r = await render(<Page crash={false} />);
    (document.getElementById('widget') as HTMLElement).focus();
    await r.rerender(<Page crash />);
    const box = document.querySelector('[data-component="error-boundary"]') as HTMLElement;
    await expect.poll(() => document.activeElement).toBe(box);
    expect(box.tabIndex).toBe(-1);
    await r.rerender(<Page crash={false} />);
    await r.rerender(<><input id="elsewhere2" autoFocus /><ErrorBoundary><Thrower /></ErrorBoundary></>);
    expect(document.activeElement?.id).toBe('elsewhere2');
  });

  test('resetKeys: a change clears the error; the same keys don\'t', async () => {
    broken = true;
    const r = await render(<ErrorBoundary resetKeys={['/a']}><Widget /></ErrorBoundary>);
    broken = false;
    await r.rerender(<ErrorBoundary resetKeys={['/a']}><Widget /></ErrorBoundary>);
    expect(!!document.querySelector('[data-component="error-boundary"]')).toBe(true);
    await r.rerender(<ErrorBoundary resetKeys={['/b']}><Widget /></ErrorBoundary>);
    await expect.element(page.getByRole('button', { name: 'Chart' })).toBeInTheDocument();
  });

  test('fallback: an element, or a function of { error, reset }; title and description replace the default words; Indonesian words from the provider', async () => {
    broken = true;
    await render(<>
      <div id="el"><ErrorBoundary fallback={<p>Nope</p>}><Widget /></ErrorBoundary></div>
      <div id="fn"><ErrorBoundary fallback={({ error, reset }) => <button onClick={reset}>{(error as Error).message}</button>}><Widget /></ErrorBoundary></div>
      <div id="txt"><ErrorBoundary title="Couldn't load the chart" description="The rest still works."><Widget /></ErrorBoundary></div>
      <div id="id"><SerupaProvider labels={idLabels}><ErrorBoundary><Widget /></ErrorBoundary></SerupaProvider></div>
    </>);
    const text = (id: string) => document.getElementById(id)!.textContent;
    expect([text('el'), text('fn'), text('txt'), text('id')]).toEqual(['Nope', 'boom', "Couldn't load the chartThe rest still works.Try again", 'Terjadi kesalahanBagian halaman ini tidak dapat dimuat.Coba lagi']);
  });

  test('focus after recovering (FL1): Try again, a custom fallback\'s reset() and resetKeys move focus from the gone fallback to the first focusable part of what came back, not to <body>', async () => {
    broken = true;
    const r = await render(<div><input id="before" /><ErrorBoundary resetKeys={['/a']}><Widget /></ErrorBoundary><input id="after" /></div>);
    const again = page.getByRole('button', { name: 'Try again' });
    (again.element() as HTMLElement).focus();
    broken = false;
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('widget');
    // A custom fallback's reset(); the recovered content has its focusable part inside a wrapper.
    broken = true;
    await r.rerender(<div><input id="before" /><ErrorBoundary key="fn" fallback={({ reset }) => <button id="retry" onClick={reset}>Retry</button>}><p><Widget label="Map" /></p></ErrorBoundary><input id="after" /></div>);
    (document.getElementById('retry') as HTMLElement).focus();
    broken = false;
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => (document.activeElement as HTMLElement | null)?.textContent).toBe('Map');
    // resetKeys while focus is in the fallback.
    broken = true;
    await r.rerender(<div><input id="before" /><ErrorBoundary key="keys" resetKeys={['/a']}><Widget /></ErrorBoundary><input id="after" /></div>);
    (page.getByRole('button', { name: 'Try again' }).element() as HTMLElement).focus();
    broken = false;
    await r.rerender(<div><input id="before" /><ErrorBoundary key="keys" resetKeys={['/b']}><Widget /></ErrorBoundary><input id="after" /></div>);
    await expect.poll(() => document.activeElement?.id).toBe('widget');
  });

  test('inside a shadow root, Try again moves focus to what came back too, not the page (GR95)', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      broken = true;
      await render(<div><input id="before" /><ErrorBoundary><Widget /></ErrorBoundary></div>, { container: inner });
      const sr = host.shadowRoot!;
      const again = [...sr.querySelectorAll('button')].find((b) => b.textContent === 'Try again')!;
      again.focus();
      broken = false;
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => sr.activeElement?.id).toBe('widget');
    } finally { host.remove(); }
  });

  test('focus after recovering goes to the first part in the Tab order and shown: past a hidden button and a tab that isn\'t the current one (L8E24)', async () => {
    broken = true;
    function Views(): React.ReactElement {
      if (broken) throw new Error('boom');
      return <div><button style={{ display: 'none' }}>Hidden</button><div role="tablist" aria-label="Views"><button role="tab" tabIndex={-1}>One</button><button role="tab" id="cur" aria-selected="true">Two</button></div></div>;
    }
    await render(<div><input id="before" /><ErrorBoundary><Views /></ErrorBoundary></div>);
    (page.getByRole('button', { name: 'Try again' }).element() as HTMLElement).focus();
    broken = false;
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('cur');
  });

  test('L8E76 focus after recovering skips a control in a disabled <fieldset>, which can\'t take focus', async () => {
    broken = true;
    function Form(): React.ReactElement {
      if (broken) throw new Error('boom');
      return <div><fieldset disabled><legend>Locked</legend><button type="button">Off</button></fieldset><button type="button" id="on">On</button></div>;
    }
    await render(<div><input id="before" /><ErrorBoundary><Form /></ErrorBoundary></div>);
    (page.getByRole('button', { name: 'Try again' }).element() as HTMLElement).focus();
    broken = false;
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('on');
  });

  test('focus after recovering (FL1): content with nothing focusable takes focus itself for that one move (tabIndex -1, gone on blur); focus elsewhere on the page stays put', async () => {
    broken = true;
    function Text(): React.ReactElement { if (broken) throw new Error('boom'); return <p id="plain">Saved.</p>; }
    const r = await render(<div><input id="before" /><ErrorBoundary resetKeys={['/a']}><Text /></ErrorBoundary></div>);
    (page.getByRole('button', { name: 'Try again' }).element() as HTMLElement).focus();
    broken = false;
    await userEvent.keyboard('{Enter}');
    const p = document.getElementById('plain') as HTMLElement;
    await expect.poll(() => document.activeElement).toBe(p);
    expect(p.tabIndex).toBe(-1);
    (document.getElementById('before') as HTMLElement).focus();
    expect(p.hasAttribute('tabindex')).toBe(false);
    // Focus outside the fallback when resetKeys clear it: left where it is.
    broken = true;
    await r.rerender(<div><input id="before" /><ErrorBoundary key="b" resetKeys={['/a']}><Text /></ErrorBoundary></div>);
    (document.getElementById('before') as HTMLElement).focus();
    broken = false;
    await r.rerender(<div><input id="before" /><ErrorBoundary key="b" resetKeys={['/b']}><Text /></ErrorBoundary></div>);
    await expect.element(page.getByText('Saved.')).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('before');
  });
});
