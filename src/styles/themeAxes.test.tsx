import * as React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import tokens from '../../tokens.json';
import { render } from 'vitest-browser-react';
import { commands } from 'vitest/browser';
import { Button } from '../components/Button/Button';
import { Input } from '../components/Input/Input';
import { contrast, lowContrast, THEMES } from '../../tools/test/vitest/helpers';

// Theme axes (ADR-0011): data-brand and data-mode on an element without data-theme give the same colors as the
// flat data-theme="<brand>-<mode>" themes, through light-dark() pairs that the element's color-scheme resolves.
const root = document.documentElement;
type Tok = { name: string; value: unknown };
const varying = (tokens.color.tokens as Tok[]).filter((t) => t.value && typeof t.value === 'object' && new Set(Object.values(t.value)).size > 1).map((t) => t.name);

// The resolved color of every varying token on a probe inside `host`.
function read(host: HTMLElement): Record<string, string> {
  const probe = document.createElement('span');
  host.appendChild(probe);
  const out: Record<string, string> = {};
  for (const n of varying) { probe.style.color = `var(--${n})`; out[n] = getComputedStyle(probe).color; }
  probe.remove();
  return out;
}
const badge = (host: HTMLElement) => {
  const b = document.createElement('span');
  b.className = 'dk-badge dk-badge--subtle';
  b.setAttribute('data-tone', 'red');
  b.style.background = 'var(--dk-bdg-red-sbg)';
  host.appendChild(b);
  const c = getComputedStyle(b).backgroundColor;
  b.remove();
  return c;
};
const axes = (brand?: string, mode?: string) => {
  root.removeAttribute('data-theme');
  if (brand) root.setAttribute('data-brand', brand); else root.removeAttribute('data-brand');
  if (mode) root.setAttribute('data-mode', mode); else root.removeAttribute('data-mode');
};

afterEach(() => { for (const a of ['data-brand', 'data-mode', 'data-contrast', 'data-density']) root.removeAttribute(a); root.setAttribute('data-theme', 'blue-light'); });

describe('Theme axes', () => {
  test('data-brand + data-mode give exactly the colors of each data-theme', () => {
    for (const th of THEMES) {
      const [brand, mode] = th.split('-');
      root.setAttribute('data-theme', th);
      const flat = read(document.body), flatBadge = badge(document.body);
      axes(brand, mode);
      expect(read(document.body), th).toEqual(flat);
      expect(badge(document.body), th + ' badge').toBe(flatBadge);
      expect(getComputedStyle(root).colorScheme, th).toBe(mode);
    }
  });

  test('auto follows the color-scheme; a data-mode section switches inside the page', () => {
    root.setAttribute('data-theme', 'violet-dark');
    const dark = read(document.body);
    root.setAttribute('data-theme', 'violet-light');
    const light = read(document.body);
    axes('violet', 'auto');
    expect(getComputedStyle(root).colorScheme).toBe('light dark');
    const section = document.createElement('section');
    section.setAttribute('data-mode', 'dark');
    document.body.appendChild(section);
    expect(read(section)).toEqual(dark);
    section.setAttribute('data-mode', 'light');
    expect(read(section)).toEqual(light);
    section.remove();
  });

  test('a data-brand section takes its brand inside another', () => {
    root.setAttribute('data-theme', 'emerald-dark');
    const emeraldDark = read(document.body);
    axes('blue', 'dark');
    const section = document.createElement('section');
    section.setAttribute('data-brand', 'emerald');
    document.body.appendChild(section);
    expect(read(section)).toEqual(emeraldDark);
    section.remove();
  });

  test('a data-mode section switches in any page: with no axes on the root, or inside each data-theme, keeping that theme\'s brand; with data-brand too it takes that brand', () => {
    const flat: Record<string, Record<string, string>> = {};
    for (const th of THEMES) { root.setAttribute('data-theme', th); flat[th] = read(document.body); }
    const section = document.createElement('section');
    document.body.appendChild(section);
    const cases: Array<[string | null, string, string | null, string]> = [[null, 'dark', null, 'blue-dark'], [null, 'dark', 'emerald', 'emerald-dark']];
    for (const th of THEMES) {
      const [brand, mode] = th.split('-'), other = mode === 'light' ? 'dark' : 'light';
      cases.push([th, other, null, `${brand}-${other}`], [th, mode, null, th], [th, other, 'violet', `violet-${other}`]);
    }
    for (const [page, mode, brand, want] of cases) {
      if (page) root.setAttribute('data-theme', page); else axes();
      section.setAttribute('data-mode', mode);
      if (brand) section.setAttribute('data-brand', brand); else section.removeAttribute('data-brand');
      expect(read(section), `page ${page} section ${brand || ''} ${mode}`).toEqual(flat[want]);
      expect(getComputedStyle(section).colorScheme).toBe(mode);
    }
    section.remove();
  });

  test('data-contrast="more" on the page reaches a data-mode section', () => {
    root.setAttribute('data-theme', 'blue-dark');
    root.setAttribute('data-contrast', 'more');
    const strong = read(document.body);
    root.setAttribute('data-theme', 'blue-light');
    const section = document.createElement('section');
    section.setAttribute('data-mode', 'dark');
    document.body.appendChild(section);
    expect(read(section)).toEqual(strong);
    section.remove();
  });

  test('a root with neither attribute stays light, as before', () => {
    root.setAttribute('data-theme', 'blue-light');
    const flat = read(document.body);
    axes();
    expect(read(document.body)).toEqual(flat);
    expect(getComputedStyle(root).colorScheme).toBe('light');
  });
});

describe('Contrast axis', () => {
  // WCAG AAA text (7:1) and stronger boundaries, for people who ask their system for more contrast.
  const pairs: Array<[string, string, string, number]> = [
    ['text', 'var(--text)', 'var(--surface)', 7],
    ['muted text', 'var(--text-muted)', 'var(--surface)', 7],
    ['muted text on muted surface', 'var(--text-muted)', 'var(--surface-muted)', 7],
    ['placeholder', 'var(--placeholder)', 'var(--field)', 7],
    ['border', 'var(--border)', 'var(--surface)', 3],
    ['field border', 'var(--field-border)', 'var(--field)', 4.5],
    // Status text and icons (V6): on the page, on a raised card and on its own subtle fill (an Alert, a Badge).
    ...['success', 'warning', 'danger', 'info'].flatMap((s): Array<[string, string, string, number]> => [
      [`${s} text`, `var(--${s}-text)`, 'var(--surface)', 7],
      [`${s} text on a raised surface`, `var(--${s}-text)`, 'var(--surface-raised)', 7],
      [`${s} text on its subtle fill`, `var(--${s}-text)`, `var(--${s}-subtle)`, 7],
    ]),
    ...['success', 'warning', 'info'].map((s): [string, string, string, number] => [`${s} icon`, `var(--${s})`, 'var(--surface)', 4.5]),
  ];

  test('data-contrast="more": 7:1 text and stronger borders in all six themes', () => {
    expect(lowContrast(pairs)).not.toEqual([]);   // without it muted text is 4.5:1, so passing below is the attribute's work
    root.setAttribute('data-contrast', 'more');
    expect(lowContrast(pairs)).toEqual([]);
  });

  test('data-contrast="more": the focus ring is 3px instead of 2px, on any focused element', () => {
    const b = document.createElement('button');
    document.body.appendChild(b);
    b.style.outline = 'var(--focus-ring-width) solid';
    expect(getComputedStyle(b).outlineWidth).toBe('2px');
    root.setAttribute('data-contrast', 'more');
    expect(getComputedStyle(b).outlineWidth).toBe('3px');
    b.remove();
  });

  test('base.css: bare native controls and the caret take the brand color, and a nested theme its own', () => {
    const probe = (parent: HTMLElement) => {
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.style.color = 'var(--primary)';
      parent.appendChild(box);
      const st = getComputedStyle(box);
      return [st.accentColor, st.caretColor, st.color];
    };
    const section = document.createElement('section');
    section.setAttribute('data-theme', 'emerald-light');
    document.body.appendChild(section);
    const [outer, inner] = [probe(document.body), probe(section)];
    expect(outer).toEqual([outer[2], outer[2], outer[2]]);
    expect(inner).toEqual([inner[2], inner[2], inner[2]]);
    expect(inner[0]).not.toBe(outer[0]);
    document.querySelectorAll('input[type=checkbox]').forEach((x) => x.remove());
    section.remove();
  });

  test('works with the axes too, and outranks them', () => {
    for (const mode of ['light', 'dark']) {
      axes('violet', mode);
      const before = contrast('var(--text-muted)', 'var(--surface)');
      root.setAttribute('data-contrast', 'more');
      expect(contrast('var(--text-muted)', 'var(--surface)'), mode).toBeGreaterThan(Math.max(before, 7));
      root.removeAttribute('data-contrast');
    }
  });

  test('tokens.css follows prefers-contrast: more unless the page says data-contrast="normal"', async () => {
    const walk = (rules: CSSRuleList): CSSRule[] => [...rules].flatMap((r) => [r, ...('cssRules' in r ? walk((r as CSSGroupingRule).cssRules) : [])]);
    const all = [...document.styleSheets].flatMap((sh) => { try { return walk(sh.cssRules); } catch { return []; } });
    const media = all.filter((r) => r instanceof CSSMediaRule && r.conditionText.includes('prefers-contrast: more'));
    expect(media.map((r) => r.cssText).join('')).toContain(':root:not([data-contrast="normal"])');
  });
});

describe('Density axis', () => {
  test('data-density="compact": md and lg controls get shorter, sm keeps the 24px target; comfortable puts them back', async () => {
    root.setAttribute('data-density', 'compact');
    await render(<div>
      <Button id="b-md">Save</Button><Button id="b-sm" size="sm">Save</Button><Button id="b-lg" size="lg">Save</Button>
      <Input id="i-md" aria-label="Name" />
      <div data-density="comfortable"><Button id="b-back">Save</Button></div>
    </div>);
    const h = (id: string) => document.getElementById(id)!.getBoundingClientRect().height;
    expect([h('b-sm'), h('b-md'), h('b-lg'), h('b-back')]).toEqual([24, 28, 36, 32]);
    expect(document.getElementById('i-md')!.closest('.dk-input')!.getBoundingClientRect().height).toBe(28);
  });
  test('a nested data-mode section has its own text color and surface, not the page\'s; a class background still wins', async () => {
    axes('blue', 'light');
    await render(<div><p id="np-out">Outside</p><section id="np" data-mode="dark"><p id="np-in">Inside</p></section>
      <section id="np2" data-mode="dark" style={{ backgroundColor: 'rgb(1, 2, 3)' }} /></div>);
    const cs = (id: string) => getComputedStyle(document.getElementById(id)!);
    const dark = read(document.getElementById('np')!);
    expect(cs('np-in').color).toBe(dark.text);
    expect(cs('np-in').color).not.toBe(cs('np-out').color);
    expect(cs('np').backgroundColor).toBe(dark.surface);
    expect(cs('np2').backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('printing: a data-mode="dark" page prints its light colors; a flat dark theme keeps its backgrounds', async () => {
    axes('blue', 'dark');
    const screen = read(root);
    await commands.printMedia(true);
    try {
      axes('blue', 'dark');
      expect(getComputedStyle(root).colorScheme).toBe('light');
      expect(read(root).text).not.toBe(screen.text);
      axes();
      root.setAttribute('data-theme', 'blue-dark');
      expect([getComputedStyle(root).colorScheme, getComputedStyle(document.body).printColorAdjust]).toEqual(['dark', 'exact']);
    } finally { await commands.printMedia(false); }
  });

});
