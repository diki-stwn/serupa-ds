import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Alert, type AlertTone } from './Alert';

const TONES: AlertTone[] = ['info', 'success', 'warning', 'danger', 'neutral'];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const tone = (t: string) => document.querySelector(`[data-t="${t}"]`) as HTMLElement;
const iconName = (e: Element) => (e.querySelector<HTMLElement>(':scope > span[aria-hidden] [data-icon]'))?.dataset.icon;

/** Applies the stylesheets' @media (forced-colors: active) rules, as Windows High Contrast would, until the returned function is called. */
function forcedColors(): () => void {
  const flipped: Array<[MediaList, string]> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSMediaRule && /forced-colors:\s*active/.test(r.media.mediaText)) { flipped.push([r.media, r.media.mediaText]); r.media.mediaText = 'all'; }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
  return () => { for (const [m, t] of flipped) m.mediaText = t; };
}

const Tones = () => <>{TONES.map((t) => <Alert key={t} data-t={t} tone={t} title={'Title ' + t} actions={<Button size="sm" variant="secondary">Act</Button>}>{'Message ' + t}</Alert>)}</>;
const Box = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>{children}</div>;

describe('Alert', () => {
  // 191: a long word breaks where its language hyphenates it, before overflow-wrap cuts it anywhere.
  test('the title and message hyphenate in the language around them, and a long word still never overflows (191)', async () => {
    await render(<div lang="de" style={{ width: '240px' }}><Alert id="hy" title="Donaudampfschifffahrtsgesellschaftskapitän">Rechtsschutzversicherungsgesellschaften</Alert></div>);
    const a = el('hy');
    const parts = [...a.querySelectorAll<HTMLElement>('*')].filter((e) => e.children.length === 0 && /Donau|Rechts/.test(e.textContent ?? ''));
    expect([parts.length, ...parts.map((e) => css(e).hyphens), parts[0].closest('[lang]')!.getAttribute('lang'), parts.every((e) => e.scrollWidth <= e.clientWidth), a.scrollWidth <= a.clientWidth]).toEqual([2, 'auto', 'auto', 'de', true, true]);
    expect(css(parts[0]).getPropertyValue('hyphenate-limit-chars')).toBe('10 4 4');
  });

  test('defaults: an info alert (role status) with the info icon, hidden from screen readers; no title or close button; ref, className and props reach it', async () => {
    const r = React.createRef<HTMLDivElement>();
    await render(<Alert id="def" ref={r} className="extra" data-x="y">Plain message</Alert>);
    const e = el('def');
    expect([e.tagName, e.className, e.dataset.component, e.dataset.tone, e.getAttribute('role'), r.current === e, e.dataset.x]).toEqual(['DIV', 'dk-alert dk-alert--info extra', 'alert', 'info', 'status', true, 'y']);
    expect([iconName(e), e.querySelector(':scope > span[aria-hidden]')!.getAttribute('aria-hidden'), !!e.querySelector(':scope > div > p'), e.querySelector('.dk-alert__message')!.textContent, !!e.querySelector('button')])
      .toEqual(['info', 'true', false, 'Plain message', false]);
  });

  test('tones: info and success and neutral are status, warning and danger are alert; each has its own icon', async () => {
    await render(<Tones />);
    expect(TONES.map((t) => tone(t).getAttribute('role') + ':' + iconName(tone(t)))).toEqual(['status:info', 'status:check_circle', 'alert:warning', 'alert:error', 'status:info']);
  });

  test('an unknown tone falls back to info; role can be overridden; icon={false} removes it, an icon name replaces it; no children means no message', async () => {
    await render(<>
      {/* @ts-expect-error: an unknown tone, as plain JavaScript could pass */}
      <Alert id="bad" tone="gold">Bad</Alert>
      <Alert id="noicon" icon={false} title="No icon" />
      <Alert id="named" icon="bolt">Named icon</Alert>
      <Alert id="role" tone="danger" role="status">Quiet danger</Alert>
    </>);
    expect([el('bad').dataset.tone, el('role').getAttribute('role')]).toEqual(['info', 'status']);
    expect([el('noicon').querySelector(':scope > span[aria-hidden]'), iconName(el('named')), el('noicon').querySelector('.dk-alert__message')]).toEqual([null, 'bolt', null]);
  });

  test('layout: 12px by 16px padding, a 1px border, 8px corners, 12px between icon and content, text-sm; the icon is 20px, as tall as the first line', async () => {
    await render(<Alert id="def">Plain message</Alert>);
    const s = css(el('def'));
    expect([s.paddingTop, s.paddingLeft, s.borderTopWidth, s.borderTopLeftRadius, s.columnGap, s.fontSize, s.lineHeight, s.display]).toEqual(['12px', '16px', '1px', '8px', '12px', '14px', '20px', 'flex']);
    expect(css(el('def').querySelector(':scope > span[aria-hidden] > [data-icon]')).fontSize).toBe('20px');
  });

  test('title: font-semibold, no margin; actions in a row under the message; backgrounds: each tone\'s -subtle color (neutral: surface-muted)', async () => {
    await render(<Box><Tones /></Box>);
    const ti = css(tone('info').querySelector(':scope > div > p'));
    expect([ti.fontWeight, ti.marginTop, css(tone('info').querySelector('.dk-alert__actions')).display]).toEqual(['600', '0px', 'flex']);
    for (const [t, bg] of [['info', 'info-subtle'], ['success', 'success-subtle'], ['warning', 'warning-subtle'], ['danger', 'danger-subtle'], ['neutral', 'surface-muted']]) {
      expect([t, css(tone(t)).backgroundColor]).toEqual([t, color(`var(--${bg})`)]);
    }
  });

  test('dismiss: a 24×24 ghost button named "Dismiss" (dismissLabel changes it) with a close icon; Enter calls onDismiss', async () => {
    let dismissed = 0;
    function App() {
      const [shown, setShown] = React.useState(true);
      return <Box>
        {shown ? <Alert id="dis" tone="success" onDismiss={() => { dismissed++; setShown(false); }}>Saved</Alert> : null}
        <Alert id="dl" onDismiss={() => {}} dismissLabel="Close notice">Label</Alert>
      </Box>;
    }
    await render(<App />);
    const b = el('dis').querySelector('button')!, r = b.getBoundingClientRect();
    expect([b.getAttribute('aria-label'), b.type, (b.querySelector('[data-icon]') as HTMLElement).dataset.icon, r.width, r.height, el('dl').querySelector('button')!.getAttribute('aria-label')])
      .toEqual(['Dismiss', 'button', 'close', 24, 24, 'Close notice']);
    await expect.element(page.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    b.focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => dismissed).toBe(1);
    expect(document.getElementById('dis')).toBe(null);
  });

  test('component tokens (--alert-bg-info, --alert-radius, --alert-padding-x) override one alert', async () => {
    await render(<Alert id="tok" style={{ '--alert-bg-info': 'rgb(1, 2, 3)', '--alert-radius': '3px', '--alert-padding-x': '7px' } as React.CSSProperties}>Tokens</Alert>);
    const s = css(el('tok'));
    expect([s.backgroundColor, s.borderTopLeftRadius, s.paddingLeft]).toEqual(['rgb(1, 2, 3)', '3px', '7px']);
  });

  test('contrast: title and message 4.5:1, icon 3:1, on all five tones in all six themes', async () => {
    await render(<Box><Tones /></Box>);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const t of TONES) {
        const e = tone(t), bg = css(e).backgroundColor;
        for (const [sel, min] of [['.dk-alert__title', 4.5], ['.dk-alert__message', 4.5], ['.dk-alert__icon', 3]] as const) {
          const r = contrast(css(e.querySelector(sel)).color, bg); n++;
          if (r < min) low.push(`${th} ${t} ${sel}: ${r.toFixed(2)}`);
        }
      }
    }
    expect([low, n]).toEqual([[], 90]);
  });

  test('forced colors: a visible border', async () => {
    const restore = forcedColors();
    try {
      await render(<Alert id="def">Plain message</Alert>);
      const s = css(el('def'));
      expect(s.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(s.borderTopStyle).toBe('solid');
    } finally { restore(); }
  });

  test('no errors or React warnings', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<Box><Tones /><Alert onDismiss={() => {}}>x</Alert></Box>);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('focus after dismissing (DQ1)', () => {
  function Page({ keep, move }: { keep?: boolean; move?: boolean }) {
    const [shown, setShown] = React.useState(true);
    return <>
      <button type="button" id="before">Before</button>
      {shown ? <Alert title="Saved" onDismiss={() => { if (move) document.getElementById('before')!.focus(); if (!keep) setShown(false); }} /> : null}
      <button type="button" id="after">After</button>
    </>;
  }
  const dismiss = () => (document.querySelector('[aria-label="Dismiss"]') as HTMLElement);

  test('the focused × moves focus to the next focusable element after the alert, not the page', async () => {
    await render(<Page />);
    dismiss().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('after');
  });

  test('skips what isn\'t in the Tab order: tabs after it go to the selected one, not the first (L8E23)', async () => {
    function Tabbed() {
      const [shown, setShown] = React.useState(true);
      return <>{shown ? <Alert title="Saved" onDismiss={() => setShown(false)} /> : null}
        <div role="tablist" aria-label="Views"><button type="button" role="tab" id="t1" tabIndex={-1}>One</button><button type="button" role="tab" id="t2" aria-selected="true">Two</button></div></>;
    }
    await render(<Tabbed />);
    dismiss().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('t2');
  });

  test('L8E75 skips a control that can\'t take focus, in a disabled <fieldset>: focus goes to the next one that can', async () => {
    function Fenced() {
      const [shown, setShown] = React.useState(true);
      return <>{shown ? <Alert title="Saved" onDismiss={() => setShown(false)} /> : null}
        <fieldset disabled><legend>Locked</legend><button type="button" id="off">Off</button></fieldset><button type="button" id="on">On</button></>;
    }
    await render(<Fenced />);
    dismiss().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('on');
  });

  test('with nothing after it, focus goes to the element before it', async () => {
    function Last() {
      const [shown, setShown] = React.useState(true);
      return <><button type="button" id="before">Before</button>{shown ? <Alert title="Saved" onDismiss={() => setShown(false)} /> : null}</>;
    }
    await render(<Last />);
    dismiss().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement?.id).toBe('before');
  });

  test('leaves focus alone when onDismiss moves it, or keeps the alert', async () => {
    await render(<Page move />);
    dismiss().focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 30));
    expect(document.activeElement?.id).toBe('before');
    await render(<Page keep />);
    const x = document.querySelectorAll<HTMLElement>('[aria-label="Dismiss"]');
    x[x.length - 1].focus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 30));
    expect(document.activeElement).toBe(x[x.length - 1]);
  });
});

describe('Alert inside a shadow root (GR60)', () => {
  test('dismissing with the focused × moves focus to the next control in the shadow root, not to the page', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    function Own() {
      const [shown, setShown] = React.useState(true);
      return <>{shown ? <Alert onDismiss={() => setShown(false)}>Saved</Alert> : null}<button>After</button></>;
    }
    try {
      await render(<Own />, { container: inner });
      const root = host.shadowRoot!;
      (root.querySelector('button') as HTMLElement).focus();   // the Alert's ×, the first button
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => root.activeElement && root.activeElement.textContent).toBe('After');
    } finally { host.remove(); }
  });
  test('a long action label wraps onto more lines in a narrow box (240px), whole, not cut with an ellipsis (GR74)', async () => {
    const label = 'Review the three invoices that failed to send';
    await render(<div style={{ width: '240px' }}><Alert id="aw" title="Sync failed" actions={<><Button size="sm" variant="secondary">Retry</Button><Button size="sm" id="awreview">{label}</Button></>}>Some items didn’t sync.</Alert></div>);
    const b = el('awreview'), r = b.getBoundingClientRect(), q = el('aw').getBoundingClientRect();
    const text = [...b.querySelectorAll('*')].find((x) => x.textContent === label) as HTMLElement;
    expect([r.right <= q.right + 0.5, text.scrollWidth <= text.clientWidth + 1, r.height > 30, b.textContent]).toEqual([true, true, true, label]);
    expect(b.previousElementSibling!.getBoundingClientRect().height).toBe(24);
  });
});
