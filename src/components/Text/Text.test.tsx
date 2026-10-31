import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Text, type TextSize, type TextTone, type TextWeight } from './Text';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const SIZES: TextSize[] = ['xs', 'sm', 'base', 'lg', 'xl'];
const TONES: TextTone[] = ['default', 'muted', 'primary', 'danger'];
const WEIGHTS: TextWeight[] = ['normal', 'medium', 'semibold', 'bold'];

describe('Text', () => {
  test('defaults: a <p> with no margins; ref and className reach it', async () => {
    const r = React.createRef<HTMLElement>();
    await render(<Text id="tdef" ref={r} className="extra">Default</Text>);
    const e = el('tdef');
    expect([e.tagName, e.className, r.current === e, css(e).marginTop]).toEqual(['P', 'dk-text extra', true, '0px']);
  });

  test('size, tone and weight follow the parent when unset', async () => {
    await render(<div style={{ fontSize: '13px', lineHeight: '17px', color: 'rgb(9, 8, 7)', fontWeight: 300 }}><Text as="span" id="tinh">Inherits</Text></div>);
    const s = css(el('tinh'));
    expect([s.fontSize, s.lineHeight, s.color, s.fontWeight]).toEqual(['13px', '17px', 'rgb(9, 8, 7)', '300']);
  });

  test('sizes: xs to xl with their line heights', async () => {
    await render(<>{SIZES.map((s) => <Text key={s} id={`s-${s}`} size={s}>{s}</Text>)}</>);
    expect(SIZES.map((s) => { const c = css(el(`s-${s}`)); return `${c.fontSize}/${c.lineHeight}`; })).toEqual(['12px/16px', '14px/20px', '16px/24px', '18px/28px', '20px/28px']);
  });

  test('weights: 400, 500, 600, 700', async () => {
    await render(<>{WEIGHTS.map((w) => <Text key={w} id={`w-${w}`} weight={w}>{w}</Text>)}</>);
    expect(WEIGHTS.map((w) => css(el(`w-${w}`)).fontWeight)).toEqual(['400', '500', '600', '700']);
  });

  test('unknown as, size, tone and weight fall back to <p> and inherit', async () => {
    await render(<Text id="tbad" as={'section' as never} size={'huge' as never} tone={'gold' as never} weight={'heavy' as never}>Bad</Text>);
    expect([el('tbad').tagName, el('tbad').className].join(' ')).toBe('P dk-text');
  });

  test('as label passes htmlFor', async () => {
    await render(<Text id="tlabel" as="label" htmlFor="x">Label</Text>);
    const e = el('tlabel') as HTMLLabelElement;
    expect([e.tagName, e.htmlFor]).toEqual(['LABEL', 'x']);
  });

  test('truncate: one line with an ellipsis, as a block even on a span', async () => {
    await render(<div style={{ width: '80px' }}><Text id="trunc" as="span" truncate>A very long line of text that will not fit</Text></div>);
    const e = el('trunc'), s = css(e);
    expect([s.display, s.whiteSpace, s.textOverflow, e.scrollWidth > e.clientWidth, e.clientWidth]).toEqual(['block', 'nowrap', 'ellipsis', true, 80]);
  });

  test('measure caps the line at 65ch of its own text, and only when asked (KW14)', async () => {
    const long = 'Running text on a wide page reads best when each line stops near sixty-five characters. '.repeat(4);
    await render(<div style={{ width: '1600px' }}><Text id="tm" size="base" measure>{long}</Text><Text id="tl" size="lg" measure>{long}</Text><Text id="tw">{long}</Text></div>);
    const ch = (id: string) => { const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:65ch'; el(id).appendChild(probe); const w = probe.getBoundingClientRect().width; probe.remove(); return Math.round(w); };
    const width = (id: string) => Math.round(el(id).getBoundingClientRect().width);
    expect([width('tm'), width('tl'), width('tw')]).toEqual([ch('tm'), ch('tl'), 1600]);
    expect(ch('tl')).toBeGreaterThan(ch('tm'));
  });

  test('the --text-color-muted token overrides one element', async () => {
    await render(<Text id="ttok" tone="muted" style={{ '--text-color-muted': 'rgb(1, 2, 3)' } as React.CSSProperties}>Tokens</Text>);
    expect(css(el('ttok')).color).toBe('rgb(1, 2, 3)');
  });

  test('one long word or URL wraps inside a flex row or a grid column too, rather than widening it (GP3)', async () => {
    const url = 'https://example.com/a/very/long/path/that/never/breaks/on/its/own';
    await render(<div style={{ width: 200 }}>
      <div id="trow" style={{ display: 'flex', gap: 8 }}><Text id="tflex">{url}</Text><span>x</span></div>
      <div id="tgrid" style={{ display: 'grid', gridTemplateColumns: 'auto' }}><Text id="tcell">{url}</Text></div>
    </div>);
    const fits = (id: string, box: string) => Math.round(el(id).getBoundingClientRect().right) <= Math.round(el(box).getBoundingClientRect().right) && el(box).scrollWidth <= 200;
    expect([fits('tflex', 'trow'), fits('tcell', 'tgrid'), css(el('tflex')).overflowWrap]).toEqual([true, true, 'anywhere']);
  });

  test('contrast: every tone keeps 4.5:1 on surface in all six themes', async () => {
    await render(<>{TONES.map((t) => <Text key={t} id={`t-${t}`} tone={t}>{t}</Text>)}</>);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const t of TONES) {
        const r = contrast(css(el(`t-${t}`)).color, 'var(--surface)');
        if (r < 4.5) low.push(`${th} ${t} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });
});
