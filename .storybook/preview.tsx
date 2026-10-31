import * as React from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import { addons } from 'storybook/internal/preview-api';
import '../tokens.css';
import '../src/styles/base.css';
import '../src/styles/index.css';
import './docs.css';
import tokens from '../tokens.json';
import * as ALL_ICONS from '../src/material/icons';
import { registerIcons } from '../src/icons';

// Every icon name draws at once in Storybook (apps load the full set the first time they need it).
registerIcons(ALL_ICONS);

// The brands come from tokens.json's themes ("<brand>-<mode>"), the one list every theme name is made from,
// so a brand added there shows up here with no edit (ADR-0003).
const BRANDS = [...new Set(tokens.color.themes.map((t: { id: string }) => t.id.replace(/-(light|dark)$/, '')))];
const DEFAULT_BRAND = BRANDS[0];

// The toolbar picks a brand and a mode; together they are the page's data-theme, as theme.js sets it. Contrast
// and density set data-contrast and data-density, the page's other theme axes; their defaults leave the attribute off,
// so the system's own "more contrast" setting still applies, as it would in an app.
// Docs pages without stories (Foundations, Introduction) run no decorator, so the globals are also followed
// straight from the channel; the theme then paints the whole page (see docs.css).
const apply = (g: Record<string, unknown> | undefined) => {
  if (!g) return;
  document.documentElement.setAttribute('data-theme', `${g.brand || DEFAULT_BRAND}-${g.mode || 'light'}`);
  document.documentElement.setAttribute('dir', g.dir === 'rtl' ? 'rtl' : 'ltr');
  axes(g);
};
const axes = (g: Record<string, unknown>) => {
  const html = document.documentElement;
  if (g.contrast === 'more') html.setAttribute('data-contrast', 'more'); else html.removeAttribute('data-contrast');
  if (g.density === 'compact' || g.density === 'comfortable') html.setAttribute('data-density', g.density); else html.removeAttribute('data-density');
  slow(Number(g.motion) || 1);
};
// Slow motion (KW21): ×4 or ×10 multiplies every --duration-* and --delay-* token, so a transition can be watched frame
// by frame. Components time their motion from these tokens, in CSS and in JavaScript (Accordion reads its own
// transition back), so all of it slows together. The values are read from tokens.css once and set inline on <html>.
let base: Array<[string, number]> | null = null;
const slow = (times: number) => {
  const html = document.documentElement;
  if (!base) {
    const found = new Map<string, number>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }   // another origin's stylesheet can't be read
      const walk = (list: CSSRuleList) => {
        for (const r of Array.from(list)) {
          if ('cssRules' in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
          if (!(r instanceof CSSStyleRule) || r.selectorText !== ':root') continue;
          for (const name of Array.from(r.style)) {
            // "200ms", or ".2s" once the build has minified it
            const t = /^--(duration|delay)-/.test(name) && /^(\d*\.?\d+)(ms|s)$/.exec(r.style.getPropertyValue(name).trim());
            if (t && !found.has(name)) found.set(name, parseFloat(t[1]) * (t[2] === 's' ? 1000 : 1));
          }
        }
      };
      walk(rules);
    }
    if (!found.size) return;   // the stylesheets haven't loaded yet: the next globals change tries again
    base = [...found];
  }
  for (const [name, ms] of base) {
    if (times === 1) html.style.removeProperty(name); else html.style.setProperty(name, `${ms * times}ms`);
  }
};
const channel = addons.getChannel();
channel.on('setGlobals', (e: { globals?: Record<string, unknown> }) => apply(e.globals));   // already merged, with a story's own globals on top
channel.on('globalsUpdated', (e: { globals?: Record<string, unknown> }) => apply(e.globals));

const WithTheme: Decorator = (Story, context) => {
  const theme = `${context.globals.brand || DEFAULT_BRAND}-${context.globals.mode || 'light'}`;
  const dir = context.globals.dir === 'rtl' ? 'rtl' : 'ltr';
  const { contrast, density, motion } = context.globals;
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', dir);
    axes({ contrast, density, motion });
  }, [theme, dir, contrast, density, motion]);
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Brand',
      toolbar: { title: 'Brand', icon: 'paintbrush', dynamicTitle: true, items:
        BRANDS.map((b) => ({ value: b, title: b[0].toUpperCase() + b.slice(1) })) },
    },
    mode: {
      description: 'Light or dark',
      toolbar: { title: 'Mode', icon: 'contrast', dynamicTitle: true, items: [
        { value: 'light', title: 'Light', icon: 'sun' }, { value: 'dark', title: 'Dark', icon: 'moon' }] },
    },
    // Right-to-left (Arabic, Hebrew…): the whole page's dir, so every story can be checked mirrored.
    dir: {
      description: 'Text direction',
      toolbar: { title: 'Direction', icon: 'transfer', dynamicTitle: true, items: [
        { value: 'ltr', title: 'Left to right' }, { value: 'rtl', title: 'Right to left' }] },
    },
    contrast: {
      description: 'Contrast',
      toolbar: { title: 'Contrast', icon: 'eye', dynamicTitle: true, items: [
        { value: 'default', title: 'Default contrast' }, { value: 'more', title: 'More contrast' }] },
    },
    density: {
      description: 'Density',
      toolbar: { title: 'Density', icon: 'component', dynamicTitle: true, items: [
        { value: 'compact', title: 'Compact' }, { value: 'default', title: 'Default density' }, { value: 'comfortable', title: 'Comfortable' }] },
    },
    // Slow motion: every duration and delay token ×4 or ×10, to judge an animation frame by frame.
    motion: {
      description: 'Motion speed',
      toolbar: { title: 'Motion', icon: 'time', dynamicTitle: true, items: [
        { value: '1', title: 'Motion ×1' }, { value: '4', title: 'Slow motion ×4' }, { value: '10', title: 'Slow motion ×10' }] },
    },
  },
  initialGlobals: { brand: DEFAULT_BRAND, mode: 'light', dir: 'ltr', contrast: 'default', density: 'default', motion: '1' },
  decorators: [WithTheme],
  parameters: {
    layout: 'padded',
    controls: { expanded: true, sort: 'requiredFirst' },
    backgrounds: { disabled: true },   // the theme sets the page background (surface)
    a11y: { context: '#storybook-root' },
    // The docs pages and the Foundations pages keep their reading order; the component groups and the
    // components in them go A-Z. Stories in one component keep the order of their file. Storybook turns this
    // function into a string and runs it on its own, so it can't use anything from outside it or TypeScript types.
    options: {
      storySort: (a, b) => {
        const order = ['Introduction', 'Getting started', 'Foundations', 'Components', 'Versioning and tools', 'Changelog'];
        const foundations = ['Colors', 'Themes', 'Typography', 'Spacing', 'Layout', 'Corner radius', 'Effects and borders', 'Elevation and layers', 'Motion',
          'Content and voice', 'Accessibility', 'Utility classes', 'Icons'];
        const at = (list, name) => { const i = list.indexOf(name); return i < 0 ? list.length : i; };
        const x = a.title.split('/'), y = b.title.split('/');
        if (x[0] !== y[0]) return at(order, x[0]) - at(order, y[0]);
        if (x[0] === 'Foundations') return at(foundations, x[1]) - at(foundations, y[1]);
        if (x[0] !== 'Components') return 0;
        for (let i = 1; i < Math.min(x.length, y.length); i++) {
          const c = x[i].localeCompare(y[i], 'en', { sensitivity: 'base' });
          if (c) return c;
        }
        return x.length - y.length;
      },
    },
  },
};
export default preview;
