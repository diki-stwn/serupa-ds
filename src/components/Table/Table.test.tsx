import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press } from '../../../tools/test/vitest/helpers';
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
  return <Table id="tsort" caption="Usage" captionHidden>
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
    const head = document.querySelector('.dk-table__head') as HTMLElement, frame = head.closest('.dk-table') as HTMLElement;
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
