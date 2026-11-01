import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press, settle, withMotion } from '../../../tools/test/vitest/helpers';
import { idLabels } from '../../internal/labels';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';
import { SerupaProvider } from '../../internal/provider';
import { Table, TableActionBar, TableBody, TableCell, TableFoot, TableHead, TableHeaderCell, TableRow, TableSelectCell, type SortDirection } from './Table';

const ROWS: Array<[string, string, number]> = [['Ada', 'Admin', 1200], ['Grace', 'Editor', 30], ['Linus', 'Viewer', 450]];
const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const bg = (v: string) => { const d = document.createElement('div'); d.style.background = v; document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
const away = () => userEvent.hover(document.body, { position: { x: 880, y: 5 } });
const NONE = 'rgba(0, 0, 0, 0)';

function Sortable() {
  const [s, set] = React.useState<SortDirection>('none');
  const sorted = ROWS.slice().sort((a, b) => (s === 'none' ? 0 : (s === 'ascending' ? 1 : -1) * (a[2] - b[2])));
  return <Table id="tsort" caption="Usage" hideCaption>
    <TableHead><TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell id="hsort" align="end" sort={s} onSort={() => set(s === 'ascending' ? 'descending' : 'ascending')}>Calls</TableHeaderCell></TableRow></TableHead>
    <TableBody>{sorted.map((r) => <TableRow key={r[0]}><TableCell>{r[0]}</TableCell><TableCell align="end">{r[2]}</TableCell></TableRow>)}</TableBody>
  </Table>;
}
const body = (sel?: boolean) => <TableBody>{ROWS.map((r, i) => <TableRow key={r[0]} selected={sel ? i === 1 : undefined} data-i={i}><TableCell>{r[0]}</TableCell><TableCell><Text as="span" tone="muted">{r[1]}</Text></TableCell><TableCell align="end">{r[2]}</TableCell></TableRow>)}</TableBody>;
const head = () => <TableHead><TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell><TableHeaderCell align="end">Calls</TableHeaderCell></TableRow></TableHead>;

function App(props: { tref?: React.Ref<HTMLTableElement> }) {
  return <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Table id="tdef" ref={props.tref} className="extra" caption="Team members" containerProps={{ 'data-frame': 'f' } as React.HTMLAttributes<HTMLDivElement>}>
      {head()}{body(true)}
      <TableFoot><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell align="end">1680</TableCell></TableRow></TableFoot>
    </Table>
    <Table id="tsm" size="sm" striped>{head()}{body()}</Table>
    <Sortable />
    <div style={{ width: '200px' }}><Table id="twide" caption="Wide" style={{ minWidth: '500px' }}>{head()}{body()}</Table></div>
    <Table id="tsticky" stickyHeader containerProps={{ style: { maxHeight: '120px' }, 'aria-label': 'Sticky' }}>
      {head()}<TableBody>{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <TableRow key={i}><TableCell>{'Row ' + i}</TableCell><TableCell>x</TableCell><TableCell>{i}</TableCell></TableRow>)}</TableBody>
    </Table>
    {/* @ts-expect-error: an unknown size and align, as plain JavaScript could pass */}
    <Table id="tbad" size="xl"><TableBody><TableRow><TableCell align="middle">x</TableCell></TableRow></TableBody></Table>
    <Table id="ttok" style={{}} containerProps={{ style: { '--table-header-bg': 'rgb(1, 2, 3)', '--table-padding-x': '20px' } as React.CSSProperties }}>{head()}{body()}</Table>
  </div>;
}
const setup = async (tref?: React.Ref<HTMLTableElement>) => {
  await render(<App tref={tref} />);
  // the frame turns into a region once its ResizeObserver has measured it
  await expect.poll(() => el('twide').parentElement!.getAttribute('role')).toBe('region');
};

describe('Table', () => {
  test('a native <table> in a frame; caption, scope="col" headers; ref and className on the table, containerProps on the frame; a table that fits adds no tab stop or region', async () => {
    const ref = React.createRef<HTMLTableElement>();
    await setup(ref);
    const t = el('tdef') as HTMLTableElement, f = t.parentElement!;
    expect([t.tagName, t.className, ref.current === t, f.className, f.dataset.component, f.dataset.frame, t.caption?.textContent]).toEqual(['TABLE', 'dk-table__table extra', true, 'dk-table', 'table', 'f', 'Team members']);
    expect([...t.querySelectorAll('th')].map((x) => x.scope)).toEqual(['col', 'col', 'col']);
    expect([f.getAttribute('tabindex'), f.getAttribute('role')]).toEqual([null, null]);
  });

  test('a containerProps aria-label stays off a frame that fits (a div without a role can\'t be named), and names it once it scrolls', async () => {
    await render(<div style={{ width: '200px' }}>
      <Table id="tfit" containerProps={{ 'aria-label': 'Fits' }}><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>
      <Table id="tover" containerProps={{ 'aria-label': 'Wide' }}><TableBody><TableRow><TableCell><div style={{ width: '600px' }}>wide</div></TableCell></TableRow></TableBody></Table>
    </div>);
    const fit = el('tfit').parentElement!, over = el('tover').parentElement!;
    await expect.poll(() => over.getAttribute('role')).toBe('region');
    expect([fit.hasAttribute('aria-label'), fit.getAttribute('role'), over.getAttribute('aria-label')]).toEqual([false, null, 'Wide']);
  });

  test('a number in a cell is written in the locale\'s digits, ungrouped as given; text and FormattedNumber-style strings stay as they are (GR44)', async () => {
    const cells = (locale?: string) => {
      const t = <Table caption="Calls"><TableBody><TableRow><TableCell id={`n-${locale}`}>{1204}</TableCell><TableCell>{'Q3 2026'}</TableCell><TableCell>{0}</TableCell></TableRow></TableBody></Table>;
      return locale ? <SerupaProvider locale={locale}>{t}</SerupaProvider> : t;
    };
    await render(<>{cells('ar-EG')}{cells('en-US')}</>);
    const text = (locale: string) => [...document.getElementById(`n-${locale}`)!.closest('tr')!.querySelectorAll('td')].map((c) => c.textContent);
    expect([text('ar-EG'), text('en-US')]).toEqual([['١٢٠٤', 'Q3 2026', '٠'], ['1204', 'Q3 2026', '0']]);
  });

  test('the frame: a 1px border, 8px corners, scrolls on overflow; the table fills it', async () => {
    await setup();
    const s = css(el('tdef').parentElement);
    expect([s.borderTopWidth, s.borderTopStyle, s.borderTopLeftRadius, s.overflowX, css(el('tdef')).width]).toEqual(['1px', 'solid', '8px', 'auto', '598px']);
  });

  test('cells: 12px padding, text-sm, a 1px line below; no double line at the bottom of the body', async () => {
    await setup();
    const c = css(q('#tdef td'));
    expect([c.paddingTop, c.paddingLeft, c.fontSize, c.borderBottomWidth]).toEqual(['12px', '12px', '14px', '1px']);
    expect(css(q('#tdef tbody tr:last-child td')).borderBottomWidth).toBe('0px');
  });

  test('header: surface-muted, muted text, font-medium; align="end": right-aligned, tabular digits', async () => {
    await setup();
    const h = css(q('#tdef th')), e = css(q('#tdef td.dk-table__cell--end'));
    expect([h.backgroundColor, h.color, h.fontWeight]).toEqual([bg('var(--surface-muted)'), color('var(--text-muted)'), '500']);
    expect([e.textAlign, e.fontVariantNumeric]).toEqual(['end', 'tabular-nums']);
  });

  test('selected: shaded, a 2px primary bar at its start; no aria-selected (ignored in a table: TableSelectCell says it)', async () => {
    await setup();
    const r = q('#tdef [data-i="1"]'), bar = css(r.firstElementChild).boxShadow;
    expect([r.hasAttribute('aria-selected'), q('#tdef [data-i="0"]').hasAttribute('aria-selected')]).toEqual([false, false]);
    await expect.poll(() => css(r).backgroundColor).toBe(bg('var(--surface-muted)'));
    expect(bar).toMatch(/2px 0px 0px 0px inset$/);
    expect(bar).toContain(color('var(--primary)'));
  });

  test('TableSelectCell: a narrow cell with a checkbox named by label (a <th scope="col"> with header); checked, indeterminate, onChange, name and ref reach it; a checked row is shaded with the bar, uncontrolled too', async () => {
    const r = React.createRef<HTMLInputElement>(), picks: string[] = [];
    function Pick() {
      const [sel, set] = React.useState<string[]>(['Grace']);
      const all = sel.length === ROWS.length;
      return <Table id="tsel" caption="Pick">
        <TableHead><TableRow><TableSelectCell header label="Select all rows" checked={all} indeterminate={!all && sel.length > 0} onChange={() => set(all ? [] : ROWS.map((x) => x[0]))} /><TableHeaderCell>Name</TableHeaderCell></TableRow></TableHead>
        <TableBody>{ROWS.map((x, i) => <TableRow key={x[0]} data-i={i} selected={sel.includes(x[0])}>
          <TableSelectCell label={'Select ' + x[0]} name="who" value={x[0]} ref={i === 0 ? r : undefined} cellProps={{ 'data-c': 'c' } as React.TdHTMLAttributes<HTMLTableCellElement>} checked={sel.includes(x[0])}
            onChange={(e) => { picks.push(x[0]); set(e.target.checked ? [...sel, x[0]] : sel.filter((n) => n !== x[0])); }} />
          <TableCell>{x[0]}</TableCell></TableRow>)}</TableBody>
      </Table>;
    }
    await render(<><Pick /><Table id="tun"><TableBody><TableRow data-i="u"><TableSelectCell label="Select Ada" /><TableCell>Ada</TableCell></TableRow></TableBody></Table></>);
    const boxes = [...el('tsel').querySelectorAll<HTMLInputElement>('input[type=checkbox]')], head = q('#tsel thead .dk-table__select');
    expect([head.tagName, head.getAttribute('scope'), boxes.map((b) => b.getAttribute('aria-label')).join('|'), boxes.map((b) => b.checked).join(), boxes[0].indeterminate, r.current === boxes[1], boxes[1].name, boxes[1].value, (boxes[1].closest('td') as HTMLElement).dataset.c])
      .toEqual(['TH', 'col', 'Select all rows|Select Ada|Select Grace|Select Linus', 'false,false,true,false', true, true, 'who', 'Ada', 'c']);
    expect(Math.round(head.getBoundingClientRect().width) < 48).toBe(true);
    await userEvent.click(boxes[1]);
    expect([picks, boxes.map((b) => b.checked).join(), q('#tsel [data-i="0"]').classList.contains('dk-table__row--selected')]).toEqual([['Ada'], 'false,true,true,false', true]);
    await userEvent.click(boxes[0]);
    expect([boxes.map((b) => b.checked).join(), boxes[0].indeterminate]).toEqual(['true,true,true,true', false]);
    const u = q('#tun [data-i="u"]');
    await userEvent.click(u.querySelector('input')!);
    await expect.poll(() => css(u).backgroundColor).toBe(bg('var(--surface-muted)'));
    expect(css(u.firstElementChild).boxShadow).toMatch(/2px 0px 0px 0px inset$/);
  });

  test('a body row shades on hover', async () => {
    await setup();
    const r = q('#tdef [data-i="2"]');
    expect(css(r).backgroundColor).toBe(NONE);
    await userEvent.hover(r.querySelector('td')!);
    await expect.poll(() => css(r).backgroundColor).toBe(bg('var(--surface-muted)'));
    await away();
  });

  test('footer: a line above, font-medium', async () => {
    await setup();
    const f = css(q('#tdef tfoot td'));
    expect([f.borderTopWidth, f.fontWeight]).toEqual(['1px', '500']);
  });

  test('size sm: 8px top and bottom; striped: every other row shaded, unchanged on hover; no aria-selected', async () => {
    await setup();
    const rows = [...el('tsm').querySelectorAll('tbody tr')];
    expect(css(q('#tsm td')).paddingTop).toBe('8px');
    await expect.poll(() => rows.map((x) => css(x).backgroundColor)).toEqual([NONE, bg('var(--surface-muted)'), NONE]);
    expect(rows[0].hasAttribute('aria-selected')).toBe(false);
    await userEvent.hover(rows[0].querySelector('td')!);
    await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    await Promise.all(rows[0].getAnimations().map((a) => a.finished));
    expect(css(rows[0]).backgroundColor).toBe(NONE);
    await away();
  });

  test('sortable header: a button inside the th, no aria-sort until sorted; a hidden caption still names the table', async () => {
    await setup();
    const th = el('hsort'), b = th.querySelector('button')!;
    expect([th.getAttribute('aria-sort'), b.type, b.textContent, b.querySelector<HTMLElement>('[data-icon]')?.dataset.icon]).toEqual([null, 'button', 'Calls', 'unfold_more']);
    expect(q('#tsort caption').getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  test('pressing it calls onSort: aria-sort and the arrow follow the order', async () => {
    await setup();
    const state = () => [el('hsort').getAttribute('aria-sort'), [...el('tsort').querySelectorAll('tbody tr td:first-child')].map((x) => x.textContent).join(), q('#hsort .dk-icon').dataset.icon];
    q('#hsort button').focus();
    await userEvent.keyboard('{Enter}');
    expect(state()).toEqual(['ascending', 'Grace,Linus,Ada', 'arrow_upward']);
    await userEvent.keyboard(' ');
    expect(state()).toEqual(['descending', 'Ada,Linus,Grace', 'arrow_downward']);
  });

  test('a new order is read out ("Sorted by Calls, ascending."), not on the first render; Indonesian words (180)', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await setup();
    await new Promise((r) => setTimeout(r, 700));
    expect(said.filter((t) => /Sorted/.test(t))).toEqual([]);
    q('#hsort button').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => said.at(-1)).toMatch(/Sorted by Calls, ascending\.$/);
    await userEvent.keyboard(' ');
    await expect.poll(() => said.at(-1)).toMatch(/Sorted by Calls, descending\.$/);
    seen.disconnect();
    expect(idLabels.tableSorted('Jumlah', 'ascending')).toBe('Diurutkan menurut Jumlah, naik.');
  });

  test('print: the frame shows the whole table, the header repeats on each page and rows aren\'t split (201)', () => {
    const rules: CSSStyleRule[] = [];
    const walk = (list: CSSRuleList, inPrint: boolean) => { for (const r of Array.from(list)) { if (r instanceof CSSMediaRule) walk(r.cssRules, inPrint || /print/.test(r.conditionText)); else if (r instanceof CSSStyleRule) { if (inPrint) rules.push(r); } else if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules, inPrint); } };
    for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules, false); } catch { /* another origin */ } }
    const get = (sel: string) => rules.find((r) => r.selectorText === sel)?.style;
    expect([get('.dk-table')?.overflow, get('.dk-table__head')?.display, get('.dk-table__row')?.breakInside, get('.dk-card')?.breakInside]).toEqual(['visible', 'table-header-group', 'avoid', 'avoid']);
  });

  test('the sort button fills the header, lines up with align="end", and shows a focus ring', async () => {
    await setup();
    // Firefox shows a ring after script focus only once the keyboard has moved focus, so Tab away and back.
    q('#hsort button').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    const b = q('#hsort button'), s = css(b);
    expect(document.activeElement).toBe(b);
    expect(Math.round(b.getBoundingClientRect().width)).toBe(Math.round(b.parentElement!.getBoundingClientRect().width));
    expect([s.justifyContent, s.outlineStyle]).toEqual(['flex-end', 'solid']);
  });

  test('a table too wide for its frame scrolls, and the frame becomes a focusable region named by the caption', async () => {
    await setup();
    const f = el('twide').parentElement!;
    expect([f.getAttribute('tabindex'), f.getAttribute('role'), f.getAttribute('aria-labelledby') === q('#twide caption').id, f.scrollWidth > f.clientWidth]).toEqual(['0', 'region', true, true]);
  });

  test('keyboard table: with focus on the scrolling frame, the arrow keys scroll the table (FH1)', async () => {
    await setup();
    const f = el('twide').parentElement!;
    f.focus();
    await userEvent.keyboard('{ArrowRight}');
    // WebKit scrolls smoothly: let the scroll end before the key back, or it starts from partway
    await expect.poll(async () => { const x = f.scrollLeft; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); return x > 0 && f.scrollLeft === x; }).toBe(true);
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => f.scrollLeft).toBe(0);
  });

  test('stickyHeader: the header stays at the top while the frame scrolls; the region takes its name from containerProps', async () => {
    await setup();
    const f = el('tsticky').parentElement!, th = f.querySelector('th')!;
    f.scrollTop = 80;
    await expect.poll(() => f.scrollTop).toBe(80);
    expect(Math.round(th.getBoundingClientRect().top - f.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
    expect([css(th).position, f.getAttribute('aria-label'), f.getAttribute('tabindex')]).toEqual(['sticky', 'Sticky', '0']);
  });

  test('stickyHeader with link rows: a row scrolled under the header stays under it, so its checkbox and button don\'t paint over the header or take its clicks (GR76)', async () => {
    await render(<Table id="tlsh" stickyHeader containerProps={{ style: { maxHeight: '240px' }, 'aria-label': 'Projects' }}>
      <TableHead><TableRow><TableSelectCell header label="Select all" /><TableHeaderCell>Project</TableHeaderCell><TableHeaderCell>Actions</TableHeaderCell></TableRow></TableHead>
      <TableBody>{Array.from({ length: 12 }, (_, i) => <TableRow key={i} href={'#p' + i}><TableSelectCell label={'Select Project ' + i} /><TableCell>{'Project ' + i}</TableCell><TableCell><Button size="sm" variant="ghost">{'Edit ' + i}</Button></TableCell></TableRow>)}</TableBody>
    </Table>);
    const f = el('tlsh').parentElement!;
    f.scrollTop = 85;
    await expect.poll(() => f.scrollTop).toBe(85);
    const at = (name: string) => { const b = f.querySelector<HTMLElement>(`[aria-label="${name}"]`)!.getBoundingClientRect(); const x = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) as HTMLElement; return x.getAttribute('aria-label') || x.textContent; };
    const edit = [...f.querySelectorAll('thead th')][2].getBoundingClientRect(), hit = document.elementFromPoint(edit.left + 12, edit.top + edit.height / 2) as HTMLElement;
    expect([at('Select all'), hit.closest('thead') !== null]).toEqual(['Select all', true]);
  });

  test('stickyHeader: the header lifts with a shadow once rows scroll under it, and is flat at the top (KW16); without scroll-state queries it stays flat', async () => {
    await setup();
    const f = el('tsticky').parentElement!, th = f.querySelector('th')!;
    // A shadow shows when one of its colors isn't fully transparent.
    const lifted = () => (css(th).boxShadow.match(/rgba?\([^)]*\)/g) || []).some((c) => { const n = c.match(/[\d.]+/g)!; return n.length < 4 || Number(n[3]) > 0; });
    const lifts = CSS.supports('container-type: scroll-state');
    await withMotion(async () => {
      f.scrollTop = 0;
      await expect.poll(lifted).toBe(false);
      f.scrollTop = 80;
      if (lifts) await expect.poll(lifted).toBe(true);
      else { await settle(100); expect(lifted()).toBe(false); }
      f.scrollTop = 0;
      await expect.poll(lifted).toBe(false);
    });
  });

  test('unknown size and align fall back to md and start', async () => {
    await setup();
    expect([el('tbad').parentElement!.className, q('#tbad td').className]).toEqual(['dk-table', 'dk-table__cell']);
  });

  test('Table tokens (--table-header-bg, --table-padding-x) override one table', async () => {
    await setup();
    const c = css(q('#ttok th'));
    expect([c.backgroundColor, c.paddingLeft]).toEqual(['rgb(1, 2, 3)', '20px']);
  });

  test('contrast: text and muted text on plain, hovered, striped and selected rows, and the header, keep 4.5:1; the selected bar and the select checkbox outline 3:1; all six themes', async () => {
    await setup();
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const surf = bg('var(--surface)'), muted = bg('var(--surface-muted)');
      const text = css(q('#tdef td')).color, mt = css(q('#tdef td .dk-text')).color, hd = css(q('#tdef th')).color;
      const pairs: Array<[string, string, string]> = [['text', text, surf], ['muted text', mt, surf], ['text on a shaded row', text, muted], ['muted text on a shaded row', mt, muted], ['header', hd, muted]];
      for (const [name, fg, on] of pairs) { const r = contrast(fg, on); n++; if (r < 4.5) low.push(`${th} ${name}: ${r.toFixed(2)}`); }
      const bar = contrast('var(--primary)', muted); n++;
      if (bar < 3) low.push(`${th} selected bar: ${bar.toFixed(2)}`);
      const box = contrast('var(--field-border)', muted); n++;   // a TableSelectCell's unchecked box, on a shaded row
      if (box < 3) low.push(`${th} checkbox outline on a shaded row: ${box.toFixed(2)}`);
    }
    still.remove();
    expect([low, n]).toEqual([[], 42]);
  });
});

describe('Table: stickyHeader and focus', () => {
  test('walking up the rows with Shift+Tab, no focused link ends up under the sticky header (WCAG 2.4.11); the frame measures the header into --dk-table-head', async () => {
    const rows = []; for (let i = 0; i < 40; i++) rows.push(<TableRow key={i}><TableCell>Invoice {i}</TableCell><TableCell><a href={'#e' + i} id={'e' + i}>Edit</a></TableCell></TableRow>);
    await render(<Table stickyHeader caption="Invoices" containerProps={{ style: { maxHeight: '240px' } }}>
      <TableHead><TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Action</TableHeaderCell></TableRow></TableHead>
      <TableBody>{rows}</TableBody>
    </Table>);
    const head = document.querySelector('thead') as HTMLElement, frame = head.closest('[data-component="table"]') as HTMLElement;
    await expect.poll(() => frame.style.getPropertyValue('--dk-table-head')).toBe(head.getBoundingClientRect().height + 'px');
    el('e39').focus();
    const covered: number[] = [];
    for (let i = 38; i >= 0; i--) {
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      await new Promise((r) => requestAnimationFrame(r));   // where it is by the next frame, which is what people see
      expect(document.activeElement!.id).toBe('e' + i);
      // The header cells are what stick (the <thead> box itself scrolls away).
      if (document.activeElement!.getBoundingClientRect().top < head.querySelector('th')!.getBoundingClientRect().bottom - 1) covered.push(i);
    }
    expect(covered).toEqual([]);
  });

  test('pressed: a sortable header held down fills with pressed at once (ED1)', async () => {
    await render(<Sortable />);
    const b = el('hsort').querySelector('button') as HTMLButtonElement;
    expect(css(b).backgroundColor).not.toBe(color('var(--pressed)'));
    await press(b, () => expect.poll(() => css(b).backgroundColor).toBe(color('var(--pressed)')));
  });
});

function Picker(props: { log: string[] }) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const all = picked.length === ROWS.length;
  return <>
    <TableActionBar id="bar" count={picked.length} onClear={() => setPicked([])}>
      <Button size="sm" variant="outline" onClick={() => { props.log.push('delete ' + picked.join(',')); setPicked([]); }}>Delete</Button>
    </TableActionBar>
    <Table caption="People">
      <TableHead><TableRow><TableSelectCell header label="Select all rows" checked={all} indeterminate={!all && picked.length > 0} onChange={() => setPicked(all ? [] : ROWS.map((r) => r[0]))} /><TableHeaderCell>Name</TableHeaderCell></TableRow></TableHead>
      <TableBody>{ROWS.map((r) => <TableRow key={r[0]} selected={picked.includes(r[0])}>
        <TableSelectCell label={'Select ' + r[0]} checked={picked.includes(r[0])} onChange={() => setPicked((l) => (l.includes(r[0]) ? l.filter((x) => x !== r[0]) : [...l, r[0]]))} />
        <TableCell>{r[0]}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </>;
}
const box = (name: string) => document.querySelector(`input[aria-label="${name}"]`) as HTMLInputElement;
const barButton = (name: string) => [...el('bar').querySelectorAll('button')].find((b) => b.textContent === name) as HTMLButtonElement;

describe('TableActionBar (62)', () => {
  test('hidden with nothing selected; "2 selected", the actions and "Clear selection" while rows are; a group named by the count', async () => {
    const log: string[] = [];
    await render(<Picker log={log} />);
    expect(el('bar').hidden).toBe(true);
    await userEvent.click(box('Select Ada'));
    await userEvent.click(box('Select Linus'));
    await expect.poll(() => el('bar').hidden).toBe(false);
    expect(el('bar').getAttribute('role')).toBe('group');
    expect(document.getElementById(el('bar').getAttribute('aria-labelledby')!)?.textContent).toBe('2 selected');
    expect([...el('bar').querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Delete', 'Clear selection']);
    await userEvent.click(barButton('Delete'));
    expect(log).toEqual(['delete Ada,Linus']);
    await expect.poll(() => el('bar').hidden).toBe(true);
  });

  test('hiding with focus in it (Clear, or an action that empties the selection) moves focus to the table\'s "Select all", not the page', async () => {
    await render(<Picker log={[]} />);
    await userEvent.click(box('Select Grace'));
    barButton('Clear selection').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('bar').hidden).toBe(true);
    expect(document.activeElement).toBe(box('Select all rows'));
    expect(box('Select Grace').checked).toBe(false);
    await userEvent.click(box('Select all rows'));
    barButton('Delete').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('bar').hidden).toBe(true);
    expect(document.activeElement).toBe(box('Select all rows'));
  });

  test('inside a shadow root, Clear with focus in the bar moves focus to "Select all" too, not the page (GR95)', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      await render(<Picker log={[]} />, { container: inner });
      const sr = host.shadowRoot!, cb = (name: string) => sr.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)!;
      cb('Select Grace').click();
      await expect.poll(() => sr.getElementById('bar')!.hidden).toBe(false);
      [...sr.getElementById('bar')!.querySelectorAll('button')].find((b) => b.textContent === 'Clear selection')!.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => sr.getElementById('bar')!.hidden).toBe(true);
      expect(sr.activeElement).toBe(cb('Select all rows'));
    } finally { host.remove(); }
  });

  test('a new count is read out ("3 selected"), not on the first render or at 0; Indonesian words', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    await render(<Picker log={[]} />);
    await new Promise((r) => setTimeout(r, 300));
    expect(said.filter((t) => /selected/.test(t))).toEqual([]);
    await userEvent.click(box('Select all rows'));
    await expect.poll(() => said.at(-1)).toMatch(/3 selected$/);
    seen.disconnect();
    expect([idLabels.tableSelected(3), idLabels.clearSelection]).toEqual(['3 dipilih', 'Hapus pilihan']);
  });

  test('GR55: a bar rendered only while rows are selected reads out its first count', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    const screen = await render(<div />);
    await screen.rerender(<TableActionBar id="bar" count={1} />);
    await expect.poll(() => said.at(-1)).toMatch(/1 selected$/);
    seen.disconnect();
  });

  test('no "Clear selection" without onClear; clearLabel renames it; Indonesian labels from the provider', async () => {
    const screen = await render(<TableActionBar id="bar" count={1}><Button size="sm">Export</Button></TableActionBar>);
    expect([...el('bar').querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Export']);
    await screen.rerender(<TableActionBar id="bar" count={1} onClear={() => {}} clearLabel="Deselect" />);
    expect(barButton('Deselect')).toBeTruthy();
    await screen.rerender(<SerupaProvider labels={idLabels}><TableActionBar id="bar" count={4} onClear={() => {}} /></SerupaProvider>);
    expect(el('bar').textContent).toBe('4 dipilihHapus pilihan');
  });

  test('contrast: the count reads 4.5:1 on the bar in all six themes', async () => {
    await render(<TableActionBar id="bar" count={2} />);
    const count = el('bar').firstElementChild as HTMLElement;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(count).color, css(el('bar')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('TableRow href (TF3)', () => {
  function Linked(p: { onEdit?: () => void; markSecond?: boolean; onClick?: () => void; target?: string }) {
    return <Table caption="Users"><TableBody>
      <TableRow id="r1" href="#ada" target={p.target} onClick={p.onClick}>
        <TableSelectCell label="Select Ada" />
        <TableCell id="c1">Ada</TableCell>
        <TableCell id="c2" link={p.markSecond}>Admin</TableCell>
        <TableCell><Button size="sm" onClick={p.onEdit}>Edit</Button></TableCell>
      </TableRow>
      <TableRow id="r2"><TableCell>Grace</TableCell></TableRow>
    </TableBody></Table>;
  }

  test('one real link, in the first TableCell by default (not the select cell), named by its text; a row without href has none', async () => {
    const s = await render(<Linked />);
    const links = s.container.getElementsByTagName('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('#ada');
    expect(links[0].parentElement!.id).toBe('c1');
    await expect.element(s.getByRole('link', { name: 'Ada' })).toBeInTheDocument();
    expect(el('r2').getElementsByTagName('a')).toHaveLength(0);
  });

  test('link marks the cell that holds it instead; target="_blank" adds rel="noopener noreferrer"', async () => {
    const s = await render(<Linked markSecond target="_blank" />);
    const a = s.getByRole('link').element() as HTMLAnchorElement;
    expect(a.parentElement!.id).toBe('c2');
    expect(a.target).toBe('_blank');
    expect(a.rel).toBe('noopener noreferrer');
  });

  test("the link's area covers the row: a click anywhere in it follows the link; the Edit button and the checkbox still work on their own", async () => {
    const onEdit = vi.fn();
    const s = await render(<Linked onEdit={onEdit} />);
    const a = s.getByRole('link').element() as HTMLAnchorElement;
    const follow = vi.fn((e: Event) => e.preventDefault());
    a.addEventListener('click', follow);
    const row = el('r1').getBoundingClientRect(), cover = getComputedStyle(a, '::after');
    expect(cover.position).toBe('absolute');
    // A point in the Role cell (not the link's text) hits the link's stretched area.
    const c2 = el('c2').getBoundingClientRect();
    expect(document.elementFromPoint(c2.right - 4, c2.top + c2.height / 2)).toBe(a);
    expect(document.elementFromPoint(row.left + row.width / 2, row.top + 1)).toBe(a);
    await userEvent.click(el('c2'), { position: { x: c2.width - 4, y: c2.height / 2 }, force: true });   // the link is on top, as elementFromPoint says
    expect(follow).toHaveBeenCalledTimes(1);
    await s.getByRole('button', { name: 'Edit' }).click();
    expect(onEdit).toHaveBeenCalledTimes(1);
    await s.getByRole('checkbox', { name: 'Select Ada' }).click();
    await expect.element(s.getByRole('checkbox', { name: 'Select Ada' })).toBeChecked();
    expect(follow).toHaveBeenCalledTimes(1);
  });

  test('the keyboard reaches the link with Tab and follows it with Enter; the row shows its focus ring', async () => {
    const s = await render(<Linked />);
    const a = s.getByRole('link').element() as HTMLAnchorElement;
    const follow = vi.fn((e: Event) => e.preventDefault());
    a.addEventListener('click', follow);
    (s.getByRole('checkbox', { name: 'Select Ada' }).element() as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(a);
    expect(css(el('r1')).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Enter}');
    expect(follow).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(s.getByRole('button', { name: 'Edit' }).element());
    expect(css(el('r1')).outlineStyle).toBe('none');
  });

  test('onClick on a row without href warns once (mouse only); with href it does not', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls = () => warn.mock.calls.filter(([m]) => /TableRow: onClick/.test(String(m)));
    await render(<><Linked onClick={() => {}} /><Table caption="T"><TableBody><TableRow onClick={() => {}}><TableCell>x</TableCell></TableRow><TableRow onClick={() => {}}><TableCell>y</TableCell></TableRow></TableBody></Table></>);
    expect(calls()).toHaveLength(1);
    expect(String(calls()[0][0])).toMatch(/give the row an href/);
    warn.mockRestore();
  });
});

describe('Table: no negative zero (GR84)', () => {
  test('a cell holding -0 shows 0, and a real negative keeps its minus', async () => {
    await render(<Table id="tnz"><TableBody><TableRow><TableCell id="cz">{-0}</TableCell><TableCell id="cn">{-2}</TableCell></TableRow></TableBody></Table>);
    // In the locale the tests run in: ar-EG writes 0 as ٠ and its minus with a direction mark.
    const minus = /[-\u2212]/;
    const zero = document.getElementById('cz')!.textContent;
    expect(zero).not.toMatch(minus);
    expect(Number(zero.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[^\d]/g, ''))).toBe(0);
    expect(document.getElementById('cn')!.textContent).toMatch(minus);
  });
});
