import { describe, expect, test } from 'vitest';
import { withMotion } from '../../tools/test/vitest/helpers';

/** Applies the page's prefers-reduced-motion: reduce rules (and drops the no-preference ones). Returns the undo. */
function reduceMotion() {
  const undo: Array<() => void> = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.media.mediaText)) {
        const was = r.media.mediaText;
        r.media.mediaText = was.replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, '(min-width: 0px)').replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, '(max-width: -1px)');
        undo.push(() => { r.media.mediaText = was; });
      }
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* another origin */ } }
  return () => undo.forEach((f) => f());
}

describe('base.css: reduced motion', () => {
  // GD6: the page-wide rule was !important in dk.base, so it beat every component's own reduced-motion fade.
  test('page elements lose their transitions; a component keeps the short fade its own reduced-motion rule gives it, but no color or movement', () => withMotion(() => {
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = '<p id="bm-page" style="transition: opacity 300ms"></p><div class="dk-combobox__popup" id="bm-popup"><span id="bm-inner" style="transition: opacity 300ms"></span></div><b class="dk-zz" id="bm-color" style="transition: background-color 300ms, translate 300ms"></b>';
    const restore = reduceMotion();
    try {
      const dur = (id: string) => getComputedStyle(document.getElementById(id)!).transitionDuration;
      const props = (id: string) => getComputedStyle(document.getElementById(id)!).transitionProperty;
      expect([dur('bm-page'), dur('bm-popup'), props('bm-popup').split(', ')[0], dur('bm-inner')]).toEqual(['0s', '0.15s', 'opacity', '0s']);
      expect(props('bm-color')).not.toMatch(/background-color|translate/);
      expect(getComputedStyle(document.getElementById('bm-page')!).scrollBehavior).toBe('auto');
    } finally { restore(); host.remove(); }
  }));
});
