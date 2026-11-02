import * as React from 'react';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { color, keepMotion, settled } from '../../../tools/test/vitest/helpers';
import * as Serupa from '../../index';
import { config, configure } from '../../internal/config';
import { Loader } from '../Loader/Loader';
import { Tooltip } from '../Tooltip/Tooltip';
import { Button, buttonClass } from './Button';

// About motion: transitions and animations stay on for this file (setup.ts turns them off elsewhere).
keepMotion();

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const attrs = (id: string) => Object.fromEntries([...el(id).attributes].map((a) => [a.name, a.value]));
const announcer = () => document.querySelector('[data-dk-announcer]') as HTMLElement;
const vars = (v: Record<string, string>) => v as React.CSSProperties;
const scale = (id: string) => getComputedStyle(el(id)).scale;
const translate = (sel: string) => getComputedStyle(q(sel)).translate;
const still = ['none', '1'], home = ['none', '0px'];
const frame = () => new Promise((ok) => requestAnimationFrame(() => ok(null)));
/** Waits for what is easing (finite animations and transitions) on an element and inside it to finish. */
async function eased(node: Element) {
  await frame(); await frame();
  await settled(node, { subtree: true });
}
/** Holds the mouse button down on an element for `ms` (a real press: :active, pointerdown), running `during` once the press has settled. */
async function hold<T>(target: Element, during: () => Promise<T> | T, { ms = 500, at, button }: { ms?: number; at?: { x: number; y: number }; button?: 'right' } = {}): Promise<T> {
  const down = new Promise((ok) => document.addEventListener('pointerdown', ok, { once: true, capture: true }));
  // userEvent calls start once awaited (then), so chain one now and look while the button is down.
  const click = userEvent.click(target, { delay: ms, position: at, button, force: true }).then(() => {});
  await Promise.race([down, new Promise((ok) => setTimeout(ok, ms / 2))]);   // a disabled control may get no pointerdown
  await eased(target);
  const out = await during();
  await click;
  return out;
}
/** Emulates prefers-reduced-motion: reduce (the CSS media rules and matchMedia) until the returned function is called. */
function reduceMotion(): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.media.mediaText)) {
        flipped.push([r.media, r.media.mediaText]);
        r.media.mediaText = r.media.mediaText.replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, '(min-width: 0px)').replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, '(max-width: -1px)');
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* another origin */ } }
  const mm = window.matchMedia;
  window.matchMedia = ((query: string) => (/prefers-reduced-motion:\s*reduce/.test(query) ? { ...mm.call(window, 'all'), matches: true, media: query } : mm.call(window, query)));
  return () => { for (const [m, t] of flipped) m.mediaText = t; window.matchMedia = mm; };
}

// Button warns once per page, so every warning is collected from the start of the file.
const warnings: string[] = [];
beforeAll(() => { vi.spyOn(console, 'warn').mockImplementation((m) => { warnings.push(String(m)); }); });

const log: string[] = [];
const take = () => log.splice(0);
// A router-style link component, as an app would register with configure({ link }).
const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink(p, ref) {
  return <a {...p} ref={ref} data-router="" onClick={(e) => { p.onClick?.(e); if (!e.defaultPrevented) { e.preventDefault(); log.push('router:' + p.href); } }} />;
});

let setLoading: (on: boolean) => void = () => {};
function App({ linkRef }: { linkRef?: React.Ref<HTMLAnchorElement> }) {
  const [loading, setL] = React.useState(false);
  setLoading = setL;
  return <div>
    <form id="other" action="about:blank" />
    <div id="pop" {...{ popover: '' }}>Popover</div>
    <dialog id="dlg">Dialog</dialog>
    <form id="f" onSubmit={(e) => { e.preventDefault(); log.push('submit'); }}>
      <input id="in" aria-label="Name" />
      <Button id="sub" type="submit" loading={loading} onClick={() => log.push('subclick')}>Save</Button>
    </form>
    <Button id="plain" onClick={() => log.push('plain')}>Plain</Button>
    <form onSubmit={(e) => { e.preventDefault(); log.push('BAD-submit'); }}><Button id="deftype">NoType</Button></form>
    <Button href="#x" id="link" ref={linkRef} loading={loading} onClick={() => log.push('btnclick')}>Link</Button>
    <Button href="https://example.com/" id="ext" target="_blank">External</Button>
    <Button href="#bad" id="dlink" disabled onClick={() => log.push('BAD-disabledlink')}>Off</Button>
    <Button id="dis" disabled variant="outline" size="lg" destructive onClick={() => log.push('BAD-dis')}>Dis</Button>
    <Button id="icononly" icon="settings" aria-label="Settings" loading={loading} />
    <Button id="left" leftIcon="save" loading={loading}>Save file</Button>
    <Button id="attrs" type="submit" form="other" formAction="/x" formMethod="post" formEncType="multipart/form-data" formNoValidate formTarget="_blank" name="intent" value="save">All</Button>
    <Button id="pbtn" popoverTarget="pop" popoverTargetAction="toggle">Pop</Button>
    <Button id="cbtn" commandfor="dlg" command="show-modal">Cmd</Button>
  </div>;
}
/** Renders App with links going through RouterLink (configure({ link })), and puts the default back afterwards. */
async function withRouter(run: (linkRef: React.RefObject<HTMLAnchorElement | null>) => Promise<void>) {
  const was = config.link;
  configure({ link: RouterLink });
  try {
    const linkRef = React.createRef<HTMLAnchorElement>();
    await render(<App linkRef={linkRef} />);
    take();
    await run(linkRef);
  } finally { config.link = was; setLoading(false); }
}

describe('Button', () => {
  test('type="submit" submits the form on click, and through Enter in a field; onClick runs; type defaults to "button" (never submits by accident)', async () => {
    await withRouter(async () => {
      await userEvent.click(el('sub'));
      expect(take()).toEqual(['subclick', 'submit']);
      el('in').focus();
      await userEvent.keyboard('{Enter}');
      expect(take()).toContain('submit');
      await userEvent.click(el('plain'));
      expect(take()).toEqual(['plain']);
      await userEvent.click(el('deftype'));
      expect(take()).toEqual([]);
    });
  });

  test('href renders an <a> through the configured link component, with the button classes and no type; onClick runs; the ref reaches it; target="_blank" gets rel="noopener noreferrer"', async () => {
    await withRouter(async (linkRef) => {
      await userEvent.click(el('link'));
      expect(take()).toEqual(['btnclick', 'router:#x']);
      const la = attrs('link');
      expect(el('link').tagName).toBe('A');
      expect(la.class).toMatch(/dk-btn/);
      expect(['type' in la, 'data-router' in la]).toEqual([false, true]);
      expect(linkRef.current).toBe(el('link'));
      expect(attrs('ext').rel).toBe('noopener noreferrer');
    });
  });

  test('a disabled link ignores clicks, has no href (not focusable, not listed as a link), role="link" and aria-disabled, and is skipped by Tab', async () => {
    await withRouter(async () => {
      el('dlink').click();
      expect(take()).toEqual([]);
      expect(location.hash).not.toContain('bad');
      const dl = attrs('dlink');
      expect(['href' in dl, dl.role, dl['aria-disabled'], 'disabled' in dl]).toEqual([false, 'link', 'true', false]);
      el('dlink').focus();
      expect(document.activeElement).not.toBe(el('dlink'));
    });
  });

  test('data attributes (component, variant, size, destructive, disabled) and native form attributes pass through', async () => {
    await withRouter(async () => {
      const da = attrs('dis'), aa = attrs('attrs');
      expect([da['data-component'], da['data-variant'], da['data-size'], 'data-destructive' in da, 'data-disabled' in da]).toEqual(['button', 'outline', 'lg', true, true]);
      expect([aa.form, aa.formaction, aa.formmethod, aa.formenctype, 'formnovalidate' in aa, aa.formtarget, aa.name, aa.value]).toEqual(['other', '/x', 'post', 'multipart/form-data', true, '_blank', 'intent', 'save']);
    });
  });

  test('popoverTarget opens a popover; command="show-modal" opens a dialog (where invoker commands are supported)', async () => {
    await withRouter(async () => {
      await userEvent.click(el('pbtn'));
      expect(el('pop').matches(':popover-open')).toBe(true);
      await userEvent.keyboard('{Escape}');
      if ('command' in HTMLButtonElement.prototype) {
        await userEvent.click(el('cbtn'));
        expect((el('dlg') as HTMLDialogElement).open).toBe(true);
        (el('dlg') as HTMLDialogElement).close();
      }
    });
  });

  test('loading: an announcer (status) exists before it starts; then clicks, Enter in a field, and Enter and Space on the button do nothing, it keeps focus and its name, says aria-busy and aria-disabled, and "Loading" is announced; a loading link doesn\'t navigate; afterwards it submits again', async () => {
    await withRouter(async () => {
      expect([announcer()?.getAttribute('role'), announcer()?.textContent]).toEqual(['status', '']);
      setLoading(true);
      await expect.poll(() => el('sub').hasAttribute('data-loading')).toBe(true);
      await userEvent.click(el('sub'), { force: true });
      expect(take()).toEqual([]);
      el('in').focus();
      await userEvent.keyboard('{Enter}');
      expect(take()).toEqual([]);
      el('sub').focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(take()).toEqual([]);
      expect(document.activeElement).toBe(el('sub'));
      const sa = attrs('sub');
      expect([sa['aria-busy'], sa['aria-disabled'], 'data-loading' in sa]).toEqual(['true', 'true', true]);
      const h0 = location.hash;
      await userEvent.click(el('link'), { force: true });
      expect(take()).toEqual([]);
      expect(location.hash).toBe(h0);
      // Every button that started loading at once is said, in one message.
      await expect.poll(() => announcer().textContent).toMatch(/(^|\. )Loading…$/);
      await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
      setLoading(false);
      await expect.poll(() => el('sub').hasAttribute('data-loading')).toBe(false);
      await userEvent.click(el('sub'));
      expect(take()).toContain('submit');
    });
  });

  test('a loading or disabled-with-reason button does nothing itself, but its click still reaches a parent\'s handler', async () => {
    const heard: string[] = [];
    await render(<div onClick={(e) => heard.push((e.target as HTMLElement).closest('[id^="b"]')?.id || '')}>
      <Button id="bl" loading onClick={() => heard.push('own')}>Save</Button>
      <Button id="bd" disabled disabledReason="Fill in the form first" onClick={() => heard.push('own')}>Send</Button>
    </div>);
    for (const id of ['bl', 'bd']) await userEvent.click(el(id), { force: true });
    expect(heard).toEqual(['bl', 'bd']);
  });

  test('disabledReason: with disabled it stays in the tab order (aria-disabled, no disabled attribute), the reason is its description and not its name, clicks and form submission do nothing; without disabled it is ignored; a disabled link with a reason is focusable too', async () => {
    const onClick = vi.fn(), onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    await render(<form onSubmit={onSubmit}>
      <input id="dr-in" />
      <Button id="dr" type="submit" disabled disabledReason="Fill in your name first" onClick={onClick}>Save</Button>
      <Button id="dr-on" disabledReason="Never shown">Save</Button>
      <Button id="dr-link" href="#x" disabled disabledReason="Not yet">Docs</Button>
    </form>);
    const b = el('dr');
    expect([b.hasAttribute('disabled'), b.getAttribute('aria-disabled'), document.getElementById(b.getAttribute('aria-describedby')!)?.textContent]).toEqual([false, 'true', 'Fill in your name first']);
    await expect.element(page.getByRole('button', { name: 'Save', exact: true, disabled: true })).toHaveAccessibleDescription('Fill in your name first');
    el('dr-in').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard('{Enter}');
    await userEvent.click(b, { force: true });
    el('dr-in').focus();
    await userEvent.keyboard('{Enter}');
    expect([onClick.mock.calls.length, onSubmit.mock.calls.length]).toEqual([0, 0]);
    expect([el('dr-on').hasAttribute('aria-describedby'), el('dr-on').hasAttribute('aria-disabled')]).toEqual([false, false]);
    expect([el('dr-link').tabIndex, el('dr-link').getAttribute('aria-disabled'), el('dr-link').hasAttribute('href')]).toEqual([0, 'true', false]);
    expect(getComputedStyle(b).opacity).toBe('0.5');
  });

  test('disabledReason in a Tooltip with the same words: focus shows the tooltip (a disabled button never could), and the reason is read once, from the tooltip', async () => {
    await render(<Tooltip content="Fill in your name first" delay={0}><Button id="drt" disabled disabledReason="Fill in your name first">Save</Button></Tooltip>);
    await userEvent.tab();
    expect(document.activeElement).toBe(el('drt'));
    const tip = document.querySelector('[role=tooltip]') as HTMLElement;
    await expect.poll(() => tip.dataset.state).toBe('open');
    expect([el('drt').getAttribute('aria-describedby'), el('drt').querySelector('[hidden]')]).toEqual([tip.id, null]);
  });

  test('onClick returning a promise: loading (aria-busy) until it settles, a second click meanwhile does nothing; resolved with successText, a check replaces the label for 2s and the text is announced; rejected, no success', async () => {
    let settle: Array<[() => void, () => void]> = [];
    const onClick = vi.fn(() => new Promise<void>((ok, no) => { settle.push([ok, no]); }));
    await render(<><Button id="pr" onClick={onClick} successText="Saved">Save</Button><Button id="pr2" onClick={onClick} successText="Saved">Send</Button></>);
    await userEvent.click(el('pr'));
    await expect.poll(() => el('pr').getAttribute('aria-busy')).toBe('true');
    await userEvent.click(el('pr'), { force: true });
    expect(onClick).toHaveBeenCalledTimes(1);
    settle[0][0]();
    await expect.poll(() => el('pr').hasAttribute('data-success')).toBe(true);
    expect([el('pr').hasAttribute('aria-busy'), !!el('pr').querySelector('.dk-btn__success .dk-btn__check')]).toEqual([false, true]);
    await expect.poll(() => getComputedStyle(el('pr').querySelector('.dk-btn__label')!).opacity).toBe('0');
    await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
    await expect.poll(() => announcer().textContent).toMatch(/Saved$/);
    await expect.poll(() => el('pr').hasAttribute('data-success'), { timeout: 3000 }).toBe(false);
    await userEvent.click(el('pr2'));
    settle[1][1]();
    await expect.poll(() => el('pr2').hasAttribute('aria-busy')).toBe(false);
    expect(el('pr2').hasAttribute('data-success')).toBe(false);
    settle = [];
  });

  // DW1: Button's own then(ok, fail) marked the promise handled, so a failed save never reached unhandledrejection.
  test('onClick with a promise that rejects: the rejection still reaches window\'s unhandledrejection once, as without Button', async () => {
    const seen: unknown[] = [];
    const on = (e: PromiseRejectionEvent) => { seen.push(e.reason); e.preventDefault(); };
    window.addEventListener('unhandledrejection', on);
    try {
      const boom = new Error('save failed');
      await render(<Button id="rj" onClick={() => Promise.reject(boom)}>Save</Button>);
      await userEvent.click(el('rj'));
      await expect.poll(() => seen.length).toBe(1);
      await new Promise((r) => setTimeout(r, 50));
      expect([seen.length, seen[0] === boom, el('rj').hasAttribute('aria-busy')]).toEqual([1, true, false]);
    } finally { window.removeEventListener('unhandledrejection', on); }
  });

  test('onClick with a quick promise (under 300ms): no loading flash and no "Loading" announced, but still no second click until it settles', async () => {
    let ok: () => void = () => {};
    const onClick = vi.fn(() => new Promise<void>((r) => { ok = r; }));
    await render(<Button id="qk" onClick={onClick}>Copy</Button>);
    const a = announcer(); a.textContent = '';
    await userEvent.click(el('qk'));
    await userEvent.click(el('qk'));
    expect([onClick.mock.calls.length, el('qk').hasAttribute('aria-busy')]).toEqual([1, false]);
    ok();
    await new Promise((r) => setTimeout(r, 400));
    expect([el('qk').hasAttribute('aria-busy'), a.textContent]).toEqual([false, '']);
    await userEvent.click(el('qk'));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  // EB1: a promise ending at 320ms showed the spinner for 20ms, cut off mid fade-in, then snapped back to the label.
  test('onClick with a promise ending just after 300ms: the spinner stays at least 500ms (until 800ms), and the success check follows it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      let ok: () => void = () => {};
      await render(<Button id="mn" onClick={() => new Promise<void>((r) => { ok = r; })} successText="Copied">Copy</Button>);
      const step = (ms: number) => React.act(async () => { vi.advanceTimersByTime(ms); });
      const state = () => el('mn').hasAttribute('aria-busy') ? 'busy' : el('mn').hasAttribute('data-success') ? 'success' : 'idle';
      await React.act(async () => el('mn').click());
      await step(300);
      expect(state()).toBe('busy');
      await step(20);
      await React.act(async () => ok());
      expect(state()).toBe('busy');      // resolved at 320ms: the spinner stays
      await step(470);
      expect(state()).toBe('busy');      // 790ms
      await step(10);
      expect(state()).toBe('success');   // 800ms: the spinner goes and the check follows
    } finally {
      await React.act(async () => { vi.advanceTimersByTime(5000); });   // the check's 2s and the announcer's timers run out
      vi.useRealTimers();
    }
  });

  test('type="submit" in a <form action> is loading while the form is sent (useFormStatus) and stops after; loading={false} overrides it; a plain button there doesn\'t load', async () => {
    let finish: () => void = () => {};
    const sent: string[] = [];
    const save = async (data: FormData) => { sent.push(data.get('title') as string); await new Promise<void>((r) => { finish = r; }); };
    await render(<>
      <form action={save}><input name="title" defaultValue="A" /><Button id="fsave" type="submit">Save</Button><Button id="fother">Other</Button></form>
      <form action={save}><input name="title" defaultValue="B" /><Button id="fown" type="submit" loading={false}>Save</Button></form>
    </>);
    const busy = (id: string) => document.getElementById(id)!.getAttribute('aria-busy');
    expect([busy('fsave'), busy('fother')]).toEqual([null, null]);
    await userEvent.click(document.getElementById('fsave')!);
    await expect.poll(() => busy('fsave')).toBe('true');
    expect([busy('fother'), sent]).toEqual([null, ['A']]);
    document.getElementById('fsave')!.click();   // loading: a second click doesn't send it again
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toEqual(['A']);
    React.act(() => finish());
    await expect.poll(() => busy('fsave')).toBe(null);
    await userEvent.click(document.getElementById('fown')!);
    await expect.poll(() => sent).toEqual(['A', 'B']);
    expect(busy('fown')).toBe(null);
    React.act(() => finish());
  });

  test('loading: one spinner, centered, on every kind of button; it is the Loader (ring: a quarter arc, turning)', async () => {
    await withRouter(async () => {
      setLoading(true);
      await expect.poll(() => document.querySelectorAll(':is(button, a) [data-component="loader"]').length).toBe(4);
      for (const id of ['sub', 'left', 'icononly']) await eased(el(id));
      const geo = ['sub', 'left', 'icononly'].map((id) => {
        const b = el(id).getBoundingClientRect(), s = el(id).querySelectorAll('[data-component="loader"]'), r = s[0].getBoundingClientRect();
        return { n: s.length, dx: Math.abs(Math.round(r.left + r.width / 2 - (b.left + b.width / 2))) <= 1, dy: Math.abs(Math.round(r.top + r.height / 2 - (b.top + b.height / 2))) <= 1 };
      });
      expect(geo).toEqual([{ n: 1, dx: true, dy: true }, { n: 1, dx: true, dy: true }, { n: 1, dx: true, dy: true }]);
      const s = q('#sub .dk-btn__spinner');
      expect([s.dataset.component, s.dataset.variant, getComputedStyle(s.querySelector('svg')!).animationName, getComputedStyle(s.querySelector('svg > circle:last-of-type')!).animationName]).toEqual(['loader', 'ring', 'spin', 'none']);
    });
  });

  test('the Loader in a loading Button: decorative, at the button icon size (16px md, 20px lg), centered, turning', async () => {
    await render(<><Button id="btn" loading>Save</Button><Button id="btnlg" loading size="lg">Save</Button></>);
    await eased(el('btn')); await eased(el('btnlg'));
    const bt = ['btn', 'btnlg'].map((id) => {
      const s = q(`#${id} .dk-btn__spinner`), r = s.getBoundingClientRect(), b = el(id).getBoundingClientRect();
      return [s.dataset.component, s.dataset.variant, s.getAttribute('aria-hidden'), Math.round(r.width), Math.abs(Math.round(r.left + r.width / 2 - (b.left + b.width / 2))) <= 1, Math.abs(Math.round(r.top + r.height / 2 - (b.top + b.height / 2))) <= 1, getComputedStyle(s.querySelector('svg')!).animationName];
    });
    expect(bt).toEqual([['loader', 'ring', 'true', 16, true, true, 'spin'], ['loader', 'ring', 'true', 20, true, true, 'spin']]);
  });

  test('the text side gets the extra 4px in both directions: after a left icon on the right in LTR, on the left in RTL (and the reverse for a right icon)', async () => {
    await render(<>
      <div dir="ltr"><Button id="l-ltr" leftIcon="save">Save</Button><Button id="r-ltr" rightIcon="arrow_forward">Next</Button></div>
      <div dir="rtl"><Button id="l-rtl" leftIcon="save">Save</Button><Button id="r-rtl" rightIcon="arrow_forward">Next</Button></div>
    </>);
    const pad = (id: string) => { const cs = getComputedStyle(el(id)); return [cs.paddingLeft, cs.paddingRight]; };
    expect(pad('l-ltr')).toEqual(['12px', '16px']);
    expect(pad('r-ltr')).toEqual(['16px', '12px']);
    expect(pad('l-rtl')).toEqual(['16px', '12px']);
    expect(pad('r-rtl')).toEqual(['12px', '16px']);
  });

  test('no warnings for correct use; it warns on an icon-only button without a label', async () => {
    expect(warnings).toEqual([]);
    await render(<Button icon="close" />);
    expect(warnings.join(' | ')).toMatch(/needs an aria-label/);
  });

  test('the API is Serupa\'s own: buttonClass and configure, none of the 1.0 names', () => {
    expect([typeof buttonClass, typeof Serupa.buttonClass, typeof Serupa.configure]).toEqual(['function', 'function', 'function']);
    expect('buttonVariants' in Serupa).toBe(false);
    expect('TailwindPalette' in window).toBe(false);
    expect(buttonClass()).toBe('dk-btn dk-btn--primary dk-btn--size-md');
  });

  test('Buttons and Loaders can be removed from the page (unmounted) without errors', async () => {
    const r = await render(<div><Button>A</Button><Button loading>B</Button><Loader delay={0} /><Loader /></div>);
    await new Promise((ok) => setTimeout(ok, 100));   // as the script did: while the loaders' timers are still pending
    expect(() => r.unmount()).not.toThrow();
  });

  test('component tokens: --button-radius and --button-height-md on a container change the buttons inside; --button-primary-bg on one button only that one; in a nested theme the defaults follow it', async () => {
    await render(<div>
      <div style={vars({ '--button-radius': 'var(--rounded-full)', '--button-height-md': 'var(--control-height-lg)' })}><Button id="pb">Pill</Button></div>
      <Button id="one" style={vars({ '--button-primary-bg': 'var(--emerald-600)' })}>One</Button>
      <Button id="plainb">Plain</Button>
      <div data-theme="violet-dark"><Button id="nested">Nested</Button><Button id="nested-d" destructive variant="outline">Del</Button></div>
    </div>);
    const g = (id: string) => getComputedStyle(el(id));
    const probe = (theme: string | null, prop: 'backgroundColor' | 'borderTopColor', v: string) => { const d = document.createElement('div'); if (theme) d.setAttribute('data-theme', theme); d.style[prop] = v; document.body.appendChild(d); const r = getComputedStyle(d)[prop]; d.remove(); return r; };
    await eased(document.body);
    expect(parseFloat(g('pb').borderTopLeftRadius)).toBeGreaterThan(1000);
    expect(g('pb').height).toBe('44px');
    expect(g('one').backgroundColor).toBe(probe(null, 'backgroundColor', 'var(--emerald-600)'));
    expect(g('plainb').backgroundColor).toBe(color('var(--primary)'));
    expect(g('nested').backgroundColor).toBe(probe('violet-dark', 'backgroundColor', 'var(--primary)'));
    expect(g('nested-d').borderTopColor).toBe(probe('violet-dark', 'borderTopColor', 'var(--danger-border)'));
  });

  test('a primary button given its own background and no hover color gets one from it (176): darker in a light theme, lighter in a dark one; a hover color given, or no background given, keeps its own', async () => {
    await render(<div>
      <Button id="own" style={vars({ '--button-primary-bg': 'var(--emerald-600)' })}>Own</Button>
      <div data-theme="blue-dark"><Button id="own-d" style={vars({ '--button-primary-bg': 'var(--emerald-600)' })}>Own dark</Button></div>
      <Button id="both" style={vars({ '--button-primary-bg': 'var(--emerald-600)', '--button-primary-bg-hover': 'var(--emerald-800)' })}>Both</Button>
      <Button id="plainh">Plain</Button>
    </div>);
    // Lightness in OKLCH, which the browser works the hover color out in.
    const lch = (c: string) => /oklch\(([\d.]+) ([\d.]+) ([\d.]+)/.exec(color(`oklch(from ${c} l c h)`))!.slice(1).map(Number);
    const hovered = async (id: string) => { await userEvent.hover(el(id)); await eased(el(id)); await expect.poll(() => el(id).getAnimations().length).toBe(0); return getComputedStyle(el(id)).backgroundColor; };
    const [l, , h] = lch('var(--emerald-600)');
    const [ll, , lh] = lch(await hovered('own')), [dl, , dh] = lch(await hovered('own-d'));
    // Its own hue still (not the theme's blue), one step darker or lighter.
    expect([ll < l - 0.05, dl > l + 0.08, Math.abs(lh - h) < 2, Math.abs(dh - h) < 2]).toEqual([true, true, true, true]);
    expect(await hovered('both')).toBe(color('var(--emerald-800)'));
    expect(await hovered('plainh')).toBe(color('var(--primary-hover)'));
    await userEvent.unhover(el('plainh'));
  });

  test('reduced motion: the spinner stands still and breathes, and it only fades in, without growing (EE1)', async () => {
    await render(<Button id="sub" loading>Save</Button>);
    const restore = reduceMotion();
    try {
      const s = getComputedStyle(q('#sub .dk-btn__spinner svg'));
      expect([`${s.animationName} ${s.animationDuration}`, getComputedStyle(q('#sub [data-component=loader]').parentElement!).animationName]).toEqual(['dk-loader-breathe 1.4s', 'dk-loader-in']);
    } finally { restore(); }
  });
});

// Micro-interactions (button-motion.mjs)
let setBusy: (on: boolean) => void = () => {};
function Motion() {
  const [busy, setB] = React.useState(false);
  setBusy = setB;
  const nudge = vars({ '--button-icon-nudge': 'var(--spacing-0\\.5)' });
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
    <Button id="press" variant="secondary" onClick={() => log.push('click')}>Press me</Button>
    <div style={nudge}><Button id="next" rightIcon="arrow_forward">Continue</Button></div>
    <Button id="plainright" rightIcon="expand_more">Options</Button>
    <Button id="back" leftIcon="arrow_back" variant="outline">Back</Button>
    <div dir="rtl" style={nudge}><Button id="rtl" rightIcon="arrow_forward">RTL</Button></div>
    <Button id="lnk" variant="link">Link style</Button>
    <Button id="dis" disabled>Disabled</Button>
    <Button id="busy" loading={busy} leftIcon="save">Save</Button>
    <Button id="big" size="lg" style={{ width: '240px' }}>Wide</Button>
    <Button id="nopress" style={vars({ '--button-press-scale': '1' })}>No press</Button>
    <div style={nudge}><div style={vars({ '--button-icon-nudge': '0px' })}><Button id="nonudge" rightIcon="arrow_forward">No nudge</Button></div></div>
    <Button id="mine" onPointerDown={() => log.push('mine-down')} onKeyDown={() => log.push('mine-key')} onKeyUp={() => log.push('mine-up')}>Mine</Button>
  </div>;
}

describe('Button micro-interactions', () => {
  test('press: held down, the button shrinks to 97% (scale-97); released, it comes back and the click still fires', async () => {
    await render(<Motion />);
    take();
    await hold(el('press'), () => expect.poll(() => scale('press')).toBe('0.97'), { ms: 1500 });
    await eased(el('press'));
    expect(still).toContain(scale('press'));
    expect(take()).toEqual(['click']);
  });

  test('press: animates scale only, down at --button-press-duration (100ms) with ease-settle (ease-out-expo), and comes back on release over motion-release (300ms) with ease-enter (ease-out-quart), never past full size', async () => {
    await render(<Motion />);
    const timing = () => { const s = getComputedStyle(el('press')), props = s.transitionProperty.split(', '), i = props.indexOf('scale'); return { i, props, d: s.transitionDuration.split(', ')[i], e: s.transitionTimingFunction.split(/, (?=c|l|e)/)[i] }; };
    const rest = timing(), down = await hold(el('press'), async () => { await expect.poll(() => getComputedStyle(el('press')).scale).toBe('0.97'); return timing(); }, { ms: 1000 });
    expect(rest.i).toBeGreaterThanOrEqual(0);
    expect([rest.d, down.d]).toEqual(['0.3s', '0.1s']);
    expect(rest.e).toMatch(/cubic-bezier\(0.25, 1, 0.5, 1\)/);
    expect(down.e).toMatch(/cubic-bezier\(0.16, 1, 0.3, 1\)/);
    const props = rest.props;
    expect([props.includes('all'), props.includes('width')]).toEqual([false, false]);
    // Let go: no overshoot, so it never grows past 100% on the way back.
    const seen: number[] = [];
    await hold(el('press'), () => expect.poll(() => scale('press')).toBe('0.97'), { ms: 1000 });
    const t0 = performance.now();
    while (performance.now() - t0 < 400) { seen.push(parseFloat(getComputedStyle(el('press')).scale) || 1); await frame(); }
    expect(Math.min(...seen)).toBeLessThan(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1);
  });

  test('press: Enter shows it too (data-pressed while the key is down); releasing clears it and the click fired once; moving focus away mid-press clears it', async () => {
    await render(<Motion />);
    take();
    el('press').focus();
    await userEvent.keyboard('{Enter>}');
    await expect.poll(() => scale('press')).toBe('0.97');
    expect(el('press').hasAttribute('data-pressed')).toBe(true);
    await userEvent.keyboard('{/Enter}');
    expect(el('press').hasAttribute('data-pressed')).toBe(false);
    expect(take()).toEqual(['click']);
    el('press').focus();
    await userEvent.keyboard('{Enter>}');
    el('next').focus();
    await userEvent.keyboard('{/Enter}');
    expect(el('press').hasAttribute('data-pressed')).toBe(false);
  });

  test('press: none on the link variant (it reads as text) or a disabled button; --button-press-scale: 1 turns it off', async () => {
    await render(<Motion />);
    for (const id of ['lnk', 'dis', 'nopress']) expect(still, id).toContain(await hold(el(id), () => scale(id), { ms: 300 }));
  });

  test('nudge: off by default; --button-icon-nudge: var(--spacing-0.5) slides a right icon 2px forward on hover (the other way in right-to-left text), never a left icon; 0 turns it off again inside an area that turned it on; back in place after hover', async () => {
    await render(<Motion />);
    const hovered = async (id: string, sel: string) => { await userEvent.hover(el(id)); await eased(el(id)); return translate(sel); };
    expect(await hovered('next', '#next .dk-btn__icon--right')).toBe('2px');
    expect(home).toContain(await hovered('back', '#back .dk-btn__icon--left'));
    expect(await hovered('rtl', '#rtl .dk-btn__icon--right')).toBe('-2px');
    expect(home).toContain(await hovered('plainright', '#plainright .dk-btn__icon--right'));
    expect(home).toContain(await hovered('nonudge', '#nonudge .dk-btn__icon--right'));
    await userEvent.unhover(el('nonudge'));
    await eased(el('next'));
    expect(home).toContain(translate('#next .dk-btn__icon--right'));
  });

  test('loading: the label fades and blurs out instead of vanishing while the spinner fades, sharpens and grows in; once faded, label and icon are hidden; the content fades back when done', async () => {
    await render(<Motion />);
    const label = q('#busy .dk-btn__label');
    expect(getComputedStyle(label).opacity).toBe('1');   // its style before loading, for the transition to start from
    // What starts on the label, heard as it starts (transitionrun), and its opacity each frame: neither depends on
    // catching the 150ms fade still running at one moment, which a slow engine (WebKit in CI) can miss.
    const ran: string[] = [], seen: number[] = [];
    label.addEventListener('transitionrun', (ev) => ran.push(ev.propertyName));
    await frame();
    setBusy(true);
    const t0 = performance.now();
    while (performance.now() - t0 < 400) { seen.push(parseFloat(getComputedStyle(label).opacity)); await frame(); }
    expect([...new Set(ran)].sort(), 'the label fades and blurs on transitions').toEqual(['filter', 'opacity']);
    expect(seen.some((o) => o > 0 && o < 1), 'part way through: ' + seen.join(' ')).toBe(true);
    expect(getComputedStyle(q('#busy .dk-btn__loader')).animationName).toBe('dk-btn-loader-in');
    // They cross as one change: the label blurs on its way out, the spinner starts blurred (blur-xs) and sharpens.
    const ld = q('#busy .dk-btn__loader'), grow = ld.getAnimations().find((a) => (a as CSSAnimation).animationName === 'dk-btn-loader-in')!;
    grow.pause();
    grow.currentTime = 0;
    const blurFrom = getComputedStyle(ld).filter;
    grow.play();
    expect(blurFrom).toBe('blur(4px)');
    await eased(el('busy'));
    expect([getComputedStyle(label).filter, getComputedStyle(ld).filter.replace('blur(0px)', 'none')]).toEqual(['blur(4px)', 'none']);
    expect([getComputedStyle(label).opacity, getComputedStyle(q('#busy .dk-btn__icon')).opacity, getComputedStyle(q('#busy .dk-btn__loader')).opacity]).toEqual(['0', '0', '1']);
    setBusy(false);
    await expect.poll(() => getComputedStyle(q('#busy .dk-btn__label')).opacity).toBe('1');
    await expect.poll(() => getComputedStyle(q('#busy .dk-btn__label')).filter).toBe('none');
  });

  test('no ripple: pressing adds nothing inside the button, and there is no ripple layer', async () => {
    await render(<Motion />);
    const kids = (id: string) => [...el(id).children].map((c) => c.className);
    const before = kids('big');
    expect(await hold(el('big'), () => kids('big'), { ms: 200, at: { x: 20, y: 10 } })).toEqual(before);
    expect(el('big').querySelector('[class*="ripple"]')).toBeNull();
  });

  test('loading: no press while busy; your onPointerDown, onKeyDown and onKeyUp still run', async () => {
    await render(<Motion />);
    setBusy(true);
    await expect.poll(() => el('busy').hasAttribute('data-loading')).toBe(true);
    expect(still).toContain(await hold(el('busy'), () => scale('busy'), { ms: 200 }));
    setBusy(false);
    take();
    await userEvent.click(el('mine'));
    el('mine').focus();
    await userEvent.keyboard('{Enter}');
    const mine = take();
    for (const k of ['mine-down', 'mine-key', 'mine-up']) expect(mine).toContain(k);
  });

  test('reduced motion: no press scale, no icon nudge; the spinner only fades in (no growing, no blur)', async () => {
    await render(<Motion />);
    const restore = reduceMotion();
    try {
      expect(still).toContain(await hold(el('press'), () => scale('press'), { ms: 300 }));
      await userEvent.hover(el('next'));
      await eased(el('next'));
      expect(home).toContain(translate('#next .dk-btn__icon--right'));
      setBusy(true);
      await expect.poll(() => document.querySelector('#busy > [aria-hidden] > [data-component="loader"]')).toBeTruthy();
      const ld = q('#busy .dk-btn__loader'), a = ld.getAnimations().find((x) => (x as CSSAnimation).animationName === 'dk-btn-loader-in');
      a?.pause();
      if (a) a.currentTime = 0;
      const from = [getComputedStyle(ld).scale, getComputedStyle(ld).filter];
      a?.play();
      expect(still).toContain(from[0]);
      expect(from[1]).toBe('none');
    } finally { restore(); setBusy(false); }
  });
});

describe('Button long labels (DV1)', () => {
  const LONG = 'Save every change to this very long document';

  test('wrap: a long label takes more lines and the button grows from its size height; nothing is cut', async () => {
    await render(<div style={{ width: '120px' }}>
      <Button id="w" wrap>{LONG}</Button>
      <Button id="ws" wrap size="sm">Short</Button>
    </div>);
    const b = el('w'), label = b.querySelector('span:not([aria-hidden])') as HTMLElement;
    expect([b.classList.contains('dk-btn--wrap'), b.getBoundingClientRect().height > 32, b.getBoundingClientRect().width <= 120, label.scrollWidth <= label.clientWidth]).toEqual([true, true, true, true]);
    // A short label keeps the size's height.
    expect(Math.round(el('ws').getBoundingClientRect().height)).toBe(24);
    expect(buttonClass({ wrap: true })).toContain('dk-btn--wrap');
  });

  test('a cut text label shows in full as the title; one that fits, or a button with its own name or wrap, gets none', async () => {
    function Box() {
      const [w, setW] = React.useState(400);
      return <div style={{ width: w + 'px' }}>
        <Button id="grow" onClick={() => setW(90)}>{LONG}</Button>
        <Button id="fits">OK</Button>
        <Button id="named" aria-label="Save">{LONG}</Button>
        <Button id="wrapped" wrap>{LONG}</Button>
      </div>;
    }
    await render(<Box />);
    expect(el('grow').hasAttribute('title')).toBe(false);
    el('grow').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('grow').getAttribute('title')).toBe(LONG);
    expect([document.activeElement?.id, el('fits').hasAttribute('title'), el('named').hasAttribute('title'), el('wrapped').hasAttribute('title')]).toEqual(['grow', false, false, false]);
  });
});

describe('Button in a flex row at 288px (GR5)', () => {
  test('a long label shrinks to its ellipsis instead of pushing its neighbour out; an icon-only button keeps its square; LTR and RTL', async () => {
    const long = 'Download the quarterly financial report as PDF';
    const row = (id: string, dir?: string) => <div id={id} dir={dir} style={{ display: 'flex', gap: '8px', width: '288px' }}>
      <Button>{long}</Button><Button variant="outline">Cancel</Button><Button icon="close" aria-label="Close" />
    </div>;
    await render(<div>{row('gr5')}{row('gr5r', 'rtl')}</div>);
    for (const id of ['gr5', 'gr5r']) {
      const r = document.getElementById(id)!, [dl, cancel, close] = [...r.children] as HTMLElement[], box = r.getBoundingClientRect();
      expect(r.scrollWidth).toBe(288);
      for (const b of [dl, cancel, close]) { const x = b.getBoundingClientRect(); expect(x.left >= box.left - 0.5 && x.right <= box.right + 0.5).toBe(true); }
      expect([dl.getAttribute('title'), close.getBoundingClientRect().width === close.getBoundingClientRect().height]).toEqual([long, true]);
    }
  });
});
