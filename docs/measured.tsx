// The Foundations/Measured page (E19): each component as it draws in this browser, with its height, corner radius,
// padding, text size and focus ring measured live and named by the token they land on. A value no token gives is
// marked "off scale", so a drift is visible to a designer reading the page, not only to a test.
// Nothing here is typed in: the numbers come from getComputedStyle and the focus rings from the loaded style sheets.
import * as React from 'react';
import { Accordion, AccordionItem } from '../src/components/Accordion/Accordion';
import { Alert } from '../src/components/Alert/Alert';
import { Badge } from '../src/components/Badge/Badge';
import { Button } from '../src/components/Button/Button';
import { Card } from '../src/components/Card/Card';
import { Checkbox } from '../src/components/Checkbox/Checkbox';
import { Combobox } from '../src/components/Combobox/Combobox';
import { CopyButton } from '../src/components/CopyButton/CopyButton';
import { DatePicker } from '../src/components/DatePicker/DatePicker';
import { IconButton } from '../src/components/IconButton/IconButton';
import { Input } from '../src/components/Input/Input';
import { Kbd } from '../src/components/Kbd/Kbd';
import { NumberInput } from '../src/components/NumberInput/NumberInput';
import { Pagination } from '../src/components/Pagination/Pagination';
import { PinInput } from '../src/components/PinInput/PinInput';
import { Progress } from '../src/components/Progress/Progress';
import { SegmentedControl } from '../src/components/SegmentedControl/SegmentedControl';
import { Select } from '../src/components/Select/Select';
import { Slider } from '../src/components/Slider/Slider';
import { Switch } from '../src/components/Switch/Switch';
import { Tab, TabList, Tabs } from '../src/components/Tabs/Tabs';
import { Textarea } from '../src/components/Textarea/Textarea';
import { ToggleButton } from '../src/components/ToggleButton/ToggleButton';

const OPTIONS = [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }];
// Each component at its defaults, with only the props it needs to draw.
const SAMPLES: [string, () => React.ReactElement][] = [
  ['Button', () => <Button>Save</Button>],
  ['IconButton', () => <IconButton icon="close" label="Close" />],
  ['ToggleButton', () => <ToggleButton>Bold</ToggleButton>],
  ['CopyButton', () => <CopyButton value="npm i serupa-ds">Copy</CopyButton>],
  ['Input', () => <Input aria-label="Name" placeholder="Name" />],
  ['Select', () => <Select aria-label="Status" options={[{ value: 'open', label: 'Open' }]} />],
  ['Combobox', () => <Combobox aria-label="Owner" placeholder="Owner" options={[{ value: 'ada', label: 'Ada' }]} />],
  ['DatePicker', () => <DatePicker aria-label="Due" />],
  ['NumberInput', () => <NumberInput aria-label="Seats" defaultValue={3} />],
  ['Textarea', () => <Textarea aria-label="Notes" />],
  ['PinInput', () => <PinInput aria-label="Code" length={4} />],
  ['SegmentedControl', () => <SegmentedControl aria-label="View" options={OPTIONS} defaultValue="list" />],
  ['Checkbox', () => <Checkbox>Remember me</Checkbox>],
  ['Switch', () => <Switch>Wi-Fi</Switch>],
  ['Slider', () => <Slider aria-label="Volume" defaultValue={40} />],
  ['Tabs', () => <Tabs defaultValue="a"><TabList aria-label="Sections"><Tab value="a">Overview</Tab><Tab value="b">Activity</Tab></TabList></Tabs>],
  ['Pagination', () => <Pagination count={5} defaultPage={2} />],
  ['Badge', () => <Badge>New</Badge>],
  ['Kbd', () => <Kbd>⌘K</Kbd>],
  ['Progress', () => <Progress aria-label="Upload" value={40} />],
  ['Alert', () => <Alert title="Saved">Your changes are live.</Alert>],
  ['Card', () => <Card>A card</Card>],
  ['Accordion', () => <Accordion><AccordionItem value="a" title="Shipping">Two days.</AccordionItem></Accordion>],
];

type Scale = [string, number][];
// Every token of a kind, resolved to px inside the sheet, so a density or theme that changes them is followed.
const scale = (within: Element, names: string[]): Scale => names.map((n) => {
  const probe = within.appendChild(document.createElement('div'));
  probe.style.blockSize = `var(--${CSS.escape(n)})`;
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return [n, px] as [string, number];
});
const SPACING = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16'].map((s) => `spacing-${s}`);
const ROUNDED = ['rounded-none', 'rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-4xl'];
const HEIGHTS = ['control-height-sm', 'control-height-md', 'control-height-lg'];
// A px value named by the token it equals; a radius at least half the box is a pill (rounded-full).
const named = (px: number, s: Scale) => s.find(([, v]) => Math.abs(v - px) < 0.5)?.[0];

// The drawn box: the first element with a border or a fill, from the outside in (as controlSizes.test.tsx finds it).
const drawn = (root: Element) => ([root, ...root.querySelectorAll('*')].find((e) => {
  const c = getComputedStyle(e);
  return parseFloat(c.borderTopWidth) > 0 || c.backgroundColor !== 'rgba(0, 0, 0, 0)';
}) ?? root) as HTMLElement;
// The deepest element that holds text, for the text size.
const texty = (root: Element) => ([...root.querySelectorAll('*')].reverse().find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
  ?? root.querySelector('input, textarea') ?? root) as HTMLElement;

// The selector without its :not(...) parts, so a hover rule that says :not(:focus-within) isn't read as a focus rule.
function withoutNot(sel: string): string {
  let out = '';
  for (let i = 0; i < sel.length; i++) {
    if (!sel.startsWith(':not(', i)) { out += sel[i]; continue; }
    let depth = 0;
    for (i += 4; i < sel.length; i++) { if (sel[i] === '(') depth++; else if (sel[i] === ')' && --depth === 0) break; }
  }
  return out;
}
// The focus ring each component declares: its :focus-visible and :focus-within rules in the loaded style sheets (not
// the forced-colors ones), and any rule that draws in a ring colour, with what they draw with and whether they read
// the focus-ring tokens or a literal.
function focusRing(root: Element): string {
  const classes = new Set([root, ...root.querySelectorAll('*')].flatMap((e) => [...e.classList].filter((c) => c.startsWith('dk-'))));
  const found: string[] = [];
  const read = (r: CSSStyleRule) => {
    const sel = withoutNot(r.selectorText);
    if (![...classes].some((c) => new RegExp(`\\.${c}(?:--[\\w-]+)?(?![\\w-])`).test(sel))) return;
    const outline = r.style.getPropertyValue('outline') || r.style.getPropertyValue('outline-width');
    const shadow = r.style.getPropertyValue('box-shadow');
    // A focus rule by its selector, or one a script turns on (PinInput's active box) that draws in a ring colour.
    if (!/:focus-visible|:focus-within/.test(sel) && !/-ring\)/.test(shadow + outline)) return;
    if (outline && !/transparent/.test(outline)) found.push(/--focus-ring-width/.test(outline) ? 'outline, ring tokens' : `outline, literal ${outline}`);
    if (shadow) found.push(/var\(--/.test(shadow) ? 'box-shadow, ring colour' : `box-shadow, literal ${shadow}`);
  };
  const walk = (list: CSSRuleList) => {
    for (const r of [...list]) {
      if (r instanceof CSSMediaRule && /forced-colors/.test(r.conditionText)) continue;
      if (r instanceof CSSStyleRule) read(r);
      if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of [...document.styleSheets]) {
    try { walk(sheet.cssRules); } catch { /* a style sheet from another origin can't be read */ }
  }
  const unique = [...new Set(found)];
  return unique.length ? unique.join('; ') : 'none of its own';
}

// A measured value and the token it lands on ('' when it needn't be one, such as a Card's height).
type Value = [string, string];
type Row = { height: Value; radius: Value; padding: Value; text: string; ring: string };
function measure(root: HTMLElement, sheet: Element): Row {
  const box = drawn(root);
  const c = getComputedStyle(box);
  const h = box.getBoundingClientRect().height;
  const r = parseFloat(c.borderTopLeftRadius);
  const p = parseFloat(c.paddingInlineStart);
  const t = getComputedStyle(texty(root));
  const hName = named(h, scale(sheet, HEIGHTS));
  const rName = r >= h / 2 && r > 0 ? 'rounded-full' : named(r, scale(sheet, ROUNDED));
  const pName = named(p, scale(sheet, SPACING));
  const px = (n: number) => `${Math.round(n * 100) / 100}px`;
  return {
    height: [px(h), hName ?? ''],
    radius: [rName === 'rounded-full' ? 'pill' : px(r), rName ?? 'off scale'],
    padding: [px(p), pName ?? 'off scale'],
    text: `${t.fontSize} / ${t.lineHeight}`,
    ring: focusRing(root),
  };
}

function Measured({ name, children }: { name: string; children: React.ReactElement }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [row, setRow] = React.useState<Row | null>(null);
  React.useEffect(() => {
    let live = true;
    // After the fonts load, so a text size and a height measure as they will stay.
    void document.fonts.ready.then(() => { if (live && ref.current) setRow(measure(ref.current.firstElementChild as HTMLElement ?? ref.current, ref.current.closest('[data-measured]')!)); });
    return () => { live = false; };
  }, []);
  return <tr>
    <th scope="row" style={cell}>{name}</th>
    <td style={{ ...cell, minInlineSize: 160 }}><div ref={ref} style={{ maxInlineSize: 240 }}>{children}</div></td>
    <td style={cell}>{shown(row?.height)}</td>
    <td style={cell}>{shown(row?.radius)}</td>
    <td style={cell}>{shown(row?.padding)}</td>
    <td style={cell}>{row?.text ?? '…'}</td>
    <td style={cell}>{row?.ring ?? '…'}</td>
  </tr>;
}
const shown = (v?: Value) => !v ? '…' : <>
  <span style={{ whiteSpace: 'nowrap' }}>{v[0]}</span>
  {v[1] && <><br />{v[1] === 'off scale' ? <strong>off scale</strong> : <code style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{v[1]}</code>}</>}
</>;
const cell: React.CSSProperties = { borderBlockEnd: '1px solid var(--border)', padding: '8px 8px 8px 0', textAlign: 'start', verticalAlign: 'middle', fontWeight: 'normal' };

/** Every sample component measured in this browser, at the density of the section it sits in. */
export function MeasuredStates() {
  return <div data-measured style={{ overflowX: 'auto' }}>
    <table className="sb-unstyled" style={{ borderCollapse: 'collapse', inlineSize: '100%', fontSize: 13 }}>
      <caption style={{ textAlign: 'start', paddingBlockEnd: 8 }}>Measured at the default size, in this browser and theme</caption>
      <thead><tr>{['Component', 'As drawn', 'Height', 'Corner radius', 'Padding (start)', 'Text size / line', 'Focus ring'].map((h) => <th key={h} scope="col" style={{ ...cell, fontWeight: 600 }}>{h}</th>)}</tr></thead>
      <tbody>{SAMPLES.map(([name, el]) => <Measured key={name} name={name}>{el()}</Measured>)}</tbody>
    </table>
  </div>;
}
