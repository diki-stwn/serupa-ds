import { describe, expect, test } from 'vitest';

// Rules every component's CSS keeps (ideas 170 and 181), checked on the loaded stylesheets rather than one
// component at a time, so a new component can't miss them.
function rules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const r of Array.from(list)) {
      if (r instanceof CSSStyleRule) { out.push(r); if (r.cssRules && r.cssRules.length) walk(r.cssRules); }
      else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch { /* another origin */ } }
  return out.filter((r) => /\.dk-/.test(r.selectorText));
}

describe('touch and scroll rules in every component', () => {
  test('whatever shows a pointer cursor (a button, a toggle, an option) has touch-action set, so a tap isn\'t held back waiting for a double-tap zoom (170)', () => {
    const missing = rules().filter((r) => r.style.cursor === 'pointer' && !r.style.touchAction).map((r) => r.selectorText);
    expect(missing).toEqual([]);
  });

  test('every scrolling area (lists, menus, pop-ups, dialog bodies, tables, tab lists) stops scroll chaining: reaching its end doesn\'t scroll the page (181)', () => {
    const scrolls = (v: string) => v === 'auto' || v === 'scroll';
    const missing = rules().filter((r) => (scrolls(r.style.overflow) || scrolls(r.style.overflowY) || scrolls(r.style.overflowX))
      && !r.style.overscrollBehavior && !r.style.overscrollBehaviorX && !r.style.overscrollBehaviorY && !r.style.overscrollBehaviorInline && !r.style.overscrollBehaviorBlock).map((r) => r.selectorText);
    expect(missing).toEqual([]);
  });
});
