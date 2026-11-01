import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { expect, test } from 'vitest';
import { SerupaProvider } from './provider';
import { storiesToRun } from '../../tools/test/vitest/stories';
import { fiberOf, fromStory } from '../../tools/test/vitest/storyOwner';

// Numbers a component writes itself follow the locale (GR20, GR22, GR24: three components wrote String(n) where Badge,
// Pagination and Meter use displayNumber, and each was found by hand). Every story is drawn in ar-EG, whose digits are
// Arabic-Indic (٠١٢), so an ASCII digit on screen is one the component didn't localize, unless the story wrote it as
// text itself (a label, a name, "Q3 report"): a digit run found in one of the story file's strings or JSX text is
// the story's.
const sources = import.meta.glob<string>('../components/*/*.stories.tsx', { eager: true, query: '?raw', import: 'default' });
const storyText = (name: string) => {
  const src = Object.entries(sources).find(([f]) => f.split('/').at(-2) === name)?.[1] || '';
  // Quoted strings end on their line (an apostrophe in a comment can't pair with one lines later); templates may not.
  return [...src.matchAll(/'[^'\n]*'|"[^"\n]*"|`[^`]*`|>[^<>]+</g)].map((m) => m[0]).join('\n');
};
// The element holding the text was made by the story file (a wrapper's caption, a list it maps), found from where
// React's development build says the element was made (tools/test/vitest/storyOwner.ts, shared with the strict-CSP
// sweep): its text is the story's.
const byStory = (el: Element) => { const f = fiberOf(el); return !!f && fromStory(f); };
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// Latin digits on purpose, each with its reason: a component, or one story as "<Component>/<Story>".
const LATIN: Record<string, string> = {
  Calendar: 'the grid is Gregorian with Latin digits, so its title and days are too (Calendar.tsx, formats())',
  'CommandPalette/LongText': "the story's own generated labels ('Project number ' + n)",
  'FormattedNumber/Locales': 'each number passes its own locale',
  'Meter/CustomValue': "the story's formatValue writes the text", 'Meter/HighIsGood': "the story's formatValue", 'Meter/LowIsGood': "the story's formatValue",
  'Progress/Tones': "the story's formatValue", 'Slider/Marks': "the story's formatValue",
  'Table/StickyHeader': 'invoice numbers (INV-1001) are codes, not amounts',
  VirtualList: "the story's generated people: their names, emails and years are numbered so 10,000 rows differ",
  'Checkbox/Group': "the story's hint, `${teams.length} picked`",
  PhoneInput: 'the field and its value are ASCII digits, so the calling codes beside them (+20, Egypt (+20)) match what people type and dial (GR45)',
  // A label pack's text (the provider's labels, English and Indonesian) is the app's words: an app with an Arabic
  // pack writes its own digits there.
  ErrorSummary: 'the title is the label pack\'s errorSummaryTitle(n)', Stepper: "the compact summary is the label pack's stepOf(n, total)",
};
// What still writes ASCII digits, until its fix lands. None now.
const KNOWN = new Set<string>([]);

for (const [name, list] of storiesToRun()) {
  test(`${name} stories write their numbers in the locale's digits (ar-EG)`, async () => {
    const own = storyText(name), found: string[] = [];
    for (const [exportName, ui] of list) {
      if (KNOWN.has(name) || KNOWN.has(`${name}/${exportName}`) || LATIN[name] || LATIN[`${name}/${exportName}`]) continue;
      // React records where an element was made for only 10,000 elements a second; start the count again.
      const internals = Reflect.get(React, '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE') as { recentlyCreatedOwnerStacks?: number } | undefined;
      if (internals) internals.recentlyCreatedOwnerStacks = 0;
      const host = document.body.appendChild(document.createElement('div'));
      const root = createRoot(host);
      flushSync(() => root.render(<SerupaProvider locale="ar-EG">{ui}</SerupaProvider>));
      await frame();
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const parent = n.parentElement!;
        if (parent.closest('script, style, template') || byStory(parent)) continue;
        for (const m of (n.nodeValue || '').matchAll(/\d[\d.,:]*/g)) {
          if (!own.includes(m[0].replace(/[.,:]+$/, ''))) found.push(`${exportName}: "${m[0]}" in <${parent.tagName.toLowerCase()}${parent.className ? '.' + String(parent.className).split(' ')[0] : ''}>`);
        }
      }
      root.unmount();
      host.remove();
    }
    expect([...new Set(found)]).toEqual([]);
  });
}
