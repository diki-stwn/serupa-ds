import { afterEach, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

let host: HTMLElement | null = null;
const mount = (html: string) => { host = document.body.appendChild(document.createElement('div')); host.innerHTML = html; return host; };
const css = (id: string) => getComputedStyle(document.getElementById(id)!);
afterEach(() => { host?.remove(); host = null; });

describe('base.css: a bare link looks and behaves like Link (PT1)', () => {
  test('underlined at Link\'s 1px with its offset, in the --link-text color; a section\'s --link-text reaches it as it reaches Link', () => {
    mount('<p><a id="bl-a" href="#x">Docs</a> <a id="bl-l" class="dk-link" href="#y">Link</a></p><p style="--link-text: rgb(1, 2, 3)"><a id="bl-tinted" href="#z">Tinted</a> <a id="bl-tl" class="dk-link" href="#w">Link</a></p>');
    expect([css('bl-a').textDecorationLine, css('bl-a').textDecorationThickness, css('bl-a').textUnderlineOffset]).toEqual(['underline', '1px', '2px']);
    expect(css('bl-a').color).toBe(css('bl-l').color);
    expect([css('bl-tinted').color, css('bl-tl').color]).toEqual(['rgb(1, 2, 3)', 'rgb(1, 2, 3)']);
  });

  test('a long URL wraps at 320px instead of widening the page (WCAG 1.4.10), as it does in Link', async () => {
    await page.viewport(320, 640);
    try {
      const url = 'https://example.com/search?query=a-very-long-unbroken-query-string-that-keeps-going';
      mount(`<p id="bl-p" style="max-width: 100%"><a id="bl-long" href="${url}">${url}</a></p>`);
      expect(document.getElementById('bl-long')!.getBoundingClientRect().width).toBeLessThanOrEqual(320);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    } finally { await page.viewport(1000, 800); }
  });

  test('an <a> with no href reads as text: the color around it and no underline', () => {
    mount('<p id="bl-text" style="color: rgb(9, 8, 7)"><a id="bl-anchor" name="top">Top</a></p>');
    expect([css('bl-anchor').color, css('bl-anchor').textDecorationLine]).toEqual(['rgb(9, 8, 7)', 'none']);
  });

  test('a class still wins: zero specificity', () => {
    mount('<a id="bl-cls" class="text-danger" href="#q">Danger</a><span id="bl-ref" class="text-danger">x</span>');
    expect(css('bl-cls').color).toBe(css('bl-ref').color);
  });
});
