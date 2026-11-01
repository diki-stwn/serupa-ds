import { afterEach, describe, expect, test } from 'vitest';

let host: HTMLElement | null = null;
afterEach(() => { host?.remove(); host = null; });

describe('base.css: Japanese headings (24)', () => {
  test('a heading in lang="ja" breaks between phrases where the browser can; Japanese paragraphs and other headings keep the normal breaks', () => {
    host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = '<section lang="ja"><h2 id="ja-h">今日はいい天気ですね</h2><p id="ja-p">今日はいい天気ですね</p></section><h2 id="en-h" lang="en">Hello</h2>';
    const wb = (id: string) => getComputedStyle(document.getElementById(id)!).wordBreak;
    // Chrome 119+ has auto-phrase; elsewhere the value is dropped and the heading keeps the normal breaks.
    const phrase = CSS.supports('word-break', 'auto-phrase') ? 'auto-phrase' : 'normal';
    expect([wb('ja-h'), wb('ja-p'), wb('en-h')]).toEqual([phrase, 'normal', 'normal']);
  });
});
