import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Highlight, highlightRanges } from './Highlight';

let errors: MockInstance<typeof console.error>;
beforeEach(() => { errors = vi.spyOn(console, 'error'); });
afterEach(() => { expect(errors).not.toHaveBeenCalled(); errors.mockRestore(); });

const el = (id: string) => document.getElementById(id) as HTMLElement;
const marks = (id: string) => [...el(id).querySelectorAll('mark')].map((m) => m.textContent);

describe('Highlight', () => {
  test('marks the match in <mark>, keeps the rest as text; ref, className and props reach the <span>', async () => {
    const ref = React.createRef<HTMLSpanElement>();
    await render(<Highlight id="h" ref={ref} className="extra" data-x="y" query="pau">São Paulo</Highlight>);
    expect([el('h').tagName, el('h').className, el('h').dataset.component, el('h').dataset.x, ref.current === el('h'), el('h').innerHTML])
      .toEqual(['SPAN', 'dk-highlight extra', 'highlight', 'y', true, 'São <mark class="dk-highlight__mark">Pau</mark>lo']);
  });

  test('ignores case, accents and width, and marks the text as written: lodz → Łódź, strasse → Straße, sao → São, a decomposed é whole, full-width tokyo', async () => {
    await render(<>
      <Highlight id="a" query="lodz">Łódź, Poland</Highlight>
      <Highlight id="b" query="strasse">Straße des 17. Juni</Highlight>
      <Highlight id="c" query="SAO">São Paulo</Highlight>
      <Highlight id="d" query="cafe">{'Café Nero'}</Highlight>
      <Highlight id="e" query="tokyo">ｔｏｋｙｏ tower</Highlight>
    </>);
    expect(['a', 'b', 'c', 'd', 'e'].map(marks)).toEqual([['Łódź'], ['Straße'], ['São'], ['Café'], ['ｔｏｋｙｏ']]);
  });

  test('every match, not only the first (touching ones as one mark); words marks each word wherever it is; a list of terms; overlapping matches merge; an empty query marks nothing', async () => {
    await render(<>
      <Highlight id="all" query="an">Banana plantation</Highlight>
      <Highlight id="words" query="york new" words>New York, New Jersey</Highlight>
      <Highlight id="list" query={['ber', 'lin']}>Berlin</Highlight>
      <Highlight id="phrase" query="york new">New York</Highlight>
      <Highlight id="none" query="  ">Nothing</Highlight>
    </>);
    expect(['all', 'words', 'list', 'phrase', 'none'].map(marks)).toEqual([['anan', 'an'], ['New', 'York', 'New'], ['Berlin'], [], []]);
    expect(el('none').textContent).toBe('Nothing');
  });

  test('highlightRanges: [start, end) offsets into the text, sorted and merged', () => {
    expect([highlightRanges('Łódź, Poland', 'lodz'), highlightRanges('Straße', 'ss'), highlightRanges('aaaa', ['aa', 'a']), highlightRanges('', 'x'), highlightRanges('x', '')])
      .toEqual([[[0, 4]], [[4, 5]], [[0, 4]], [], []]);
  });

  test('a match is semibold, not only tinted; its text keeps 4.5:1 on the tint in all six themes; Mark and MarkText would apply in forced colors', async () => {
    await render(<p style={{ background: 'var(--surface)' }}><Highlight id="c" query="match">a match here</Highlight></p>);
    const m = el('c').querySelector('mark')!;
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const r = contrast(css(m).color, css(m).backgroundColor);
      if (r < 4.5) low.push(`${th} ${r.toFixed(2)}`);
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
    expect([low, css(m).fontWeight]).toEqual([[], '600']);
  });

  test('in an option or menu item a match keeps the text\'s weight (typing doesn\'t widen the letters) and is underlined instead', async () => {
    await render(<div role="listbox" aria-label="Cities">
      <div role="option" aria-selected="false" style={{ fontWeight: 400 }}><Highlight id="o" query="par">Paris</Highlight></div>
      <div role="menuitem" style={{ fontWeight: 500 }}><Highlight id="i" query="par">Parma</Highlight></div>
    </div>);
    const o = el('o').querySelector('mark')!, i = el('i').querySelector('mark')!;
    const before = el('o').getBoundingClientRect().width;
    expect([css(o).fontWeight, css(o).textDecorationLine, css(i).fontWeight, css(i).textDecorationLine]).toEqual(['400', 'underline', '500', 'underline']);
    await render(<div role="option" aria-selected="false" style={{ fontWeight: 400 }}><Highlight id="w" query="">Paris</Highlight></div>);
    expect(Math.abs(el('w').getBoundingClientRect().width - before)).toBeLessThan(0.1);   // splitting the text can move it by a subpixel
  });
});
