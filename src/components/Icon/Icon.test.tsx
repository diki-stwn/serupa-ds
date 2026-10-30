import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { iconPoints, settle } from '../../../tools/test/vitest/helpers';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { loadIcon } from '../../icons';
import { Close } from '../../material/builtin';
import { NAMED_ICONS } from '../../material/named';
import { Checkbox } from '../Checkbox/Checkbox';
import { Loader } from '../Loader/Loader';
import { Progress } from '../Progress/Progress';
import { Rating } from '../Rating/Rating';
import { Icon } from './Icon';

const path = (id: string) => document.querySelector(`#${id} svg path`);

describe('Icon', () => {
  test('before the stylesheet arrives, every inline svg is 1em, not the width of its container (FEC7)', () => {
    const html = renderToString(<div>
      <Icon icon={Close} /><Icon name="close" /><Checkbox defaultChecked aria-label="Done" />
      {(['ring', 'spokes', 'dots', 'pixel'] as const).map((v) => <Loader key={v} variant={v} />)}
      <Progress variant="circle" value={40} aria-label="Upload" /><Rating defaultValue={3} aria-label="Score" />
    </div>);
    // A shadow root keeps the page's stylesheets out, as if bundle.css hadn't loaded.
    const host = document.createElement('div');
    host.style.cssText = 'width:600px;font-size:16px';
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = html;
    const svgs = [...root.querySelectorAll('svg')];
    expect(svgs.length).toBeGreaterThan(8);
    for (const svg of svgs) expect(Math.round(svg.getBoundingClientRect().width), svg.outerHTML.slice(0, 80)).toBe(16);
    host.remove();
  });

  test('an imported icon draws on the first render, on the server too', async () => {
    expect(renderToString(<Icon icon={Close} />)).toContain(`d="${Close.d}"`);
    await render(<Icon id="imported" icon={Close} />);
    expect(path('imported')).not.toBeNull();
  });

  test("a component's own icons draw on the first render, on the server too", async () => {
    expect(renderToString(<Checkbox defaultChecked aria-label="Done" />)).toContain('<path d="');
    await render(<Checkbox id="done" defaultChecked aria-label="Done" />);
    expect(document.querySelector('.dk-checkbox__icon svg path')).not.toBeNull();
  });

  test("a component icon's name loads from the small chunk, then draws", async () => {
    expect(NAMED_ICONS.some((d) => d.name === 'close')).toBe(true);
    await render(<Icon id="close" name="close" />);
    await vi.waitFor(() => expect(path('close')).not.toBeNull());
  });

  test('any other Material Symbol loads the full set once, then draws', async () => {
    expect(NAMED_ICONS.some((d) => d.name === 'sports_cricket')).toBe(false);
    await render(<Icon id="cricket" name="sports_cricket" />);
    await vi.waitFor(() => expect(path('cricket')).not.toBeNull());
  });

  test('an unknown name stays an empty box and warns once the full set has loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<Icon id="unknown" name="not_a_real_icon" />);
    await vi.waitFor(() => expect(warn.mock.calls.some((c) => String(c[0]).includes('"not_a_real_icon"'))).toBe(true));
    await settle(50);
    expect(document.querySelector('#unknown svg')).toBeNull();
    warn.mockRestore();
  });

  test('a name in another spelling (the export\'s "Home", "arrow-forward", "Looks3") warns with the snake_case name to use (GN4)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<><Icon name="Home" /><Icon name="arrow-forward" /><Icon name="Looks3" /><Icon name="Nonsense_Thing" /></>);
    const said = (n: string) => warn.mock.calls.map((c) => String(c[0])).find((m) => m.includes(`"${n}"`));
    await vi.waitFor(() => expect(said('Nonsense_Thing')).toBeTruthy());
    expect(said('Home')).toContain('Did you mean "home"?');
    expect(said('arrow-forward')).toContain('Did you mean "arrow_forward"?');
    expect(said('Looks3')).toContain('Did you mean "looks_3"?');
    expect([said('Nonsense_Thing')!.includes('Did you mean'), said('Nonsense_Thing')!.includes('Foundations/Icons')]).toEqual([false, true]);
    warn.mockRestore();
  });

  test('size: a number and a number as a string are px ("20" doesn\'t fall back to 24px); a CSS length is kept', async () => {
    await render(<>
      <Icon id="sn" name="close" size={20} />
      <Icon id="ss" name="close" size="20" />
      <Icon id="sd" name="close" size=" 18.5 " />
      <Icon id="sl" name="close" size="2rem" />
    </>);
    const fs = (id: string) => getComputedStyle(document.getElementById(id)!).fontSize;
    expect(['sn', 'ss', 'sd', 'sl'].map(fs)).toEqual(['20px', '20px', '18.5px', '32px']);
  });

  test('mirror: in right-to-left text a directional icon (arrow_forward, chevron_right) flips to point the way reading goes; others don\'t; true flips any, false none', async () => {
    const fwd = { name: 'arrow_forward', d: 'M0 0' }, home = { name: 'home', d: 'M0 0' };
    await render(<>
      <p dir="rtl"><Icon id="r1" icon={fwd} /><Icon id="r2" icon={Close} /><Icon id="r3" icon={fwd} mirror={false} /><Icon id="r4" icon={home} mirror /></p>
      <p><Icon id="l1" icon={fwd} /><Icon id="l2" icon={home} mirror /></p>
    </>);
    const scale = (id: string) => getComputedStyle(document.querySelector(`#${id} svg`)!).scale;
    expect([iconPoints(document.getElementById('r1')!), scale('r2'), scale('r3'), scale('r4'), iconPoints(document.getElementById('l1')!), scale('l2')])
      .toEqual(['left', 'none', 'none', '-1 1', 'right', 'none']);
  });

  test('a decorative Icon is aria-hidden; with aria-label it is role="img"', async () => {
    await render(<><Icon id="deco" name="home" /><Icon id="meaning" name="error" aria-label="Error" /></>);
    expect(document.getElementById('deco')!.getAttribute('aria-hidden')).toBe('true');
    expect(document.getElementById('meaning')!.getAttribute('role')).toBe('img');
  });

  test('hydrating: an icon this page loaded but the server never had is drawn right after the hydration, not during it', async () => {
    expect(await loadIcon('schedule')).toBeTruthy();   // loaded here (another island, say), not registered
    const ui = <Icon id="hyd" name="schedule" />;
    const host = document.createElement('div');
    host.innerHTML = renderToString(ui);
    expect(host.querySelector('svg')).toBeNull();   // the server's box is empty
    document.body.appendChild(host);
    const errors: string[] = [];
    const root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) });
    await expect.poll(() => !!host.querySelector('#hyd svg')).toBe(true);
    expect(errors).toEqual([]);
    root.unmount(); host.remove();
  });
});
