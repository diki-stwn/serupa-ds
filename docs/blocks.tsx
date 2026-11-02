// Building blocks for the Storybook pages. Everything here reads tokens.json, README.md and the component
// guidelines at build time, so the documentation can't drift from the system.
import * as React from 'react';
import { Markdown } from '@storybook/addon-docs/blocks';
import tokens from '../tokens.json';
import readme from '../README.md?raw';
import foundations from './foundations.md?raw';
import * as MATERIAL from '../src/material/icons';
import { Icon } from '../src/components/Icon/Icon';
import { Button } from '../src/components/Button/Button';
import { SearchInput } from '../src/components/SearchInput/SearchInput';
import { CopyButton } from '../src/components/CopyButton/CopyButton';
import { customIcons, isIconData } from '../src/icons';
import { DEFAULT_LABELS, idLabels, type SerupaLabels } from '../src/internal/labels';
import labelsSource from '../src/internal/labels.ts?raw';
import { componentStatus } from './generated/status';
import { AnatomyDiagram, parseAnatomy, type Anatomy } from './anatomy';
// Each component's own words (src/components/<Name>/labels.ts), whose doc comments say where each is used too.
const componentLabelSources = Object.values(import.meta.glob('../src/components/*/labels.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);

type Token = { name: string; value: string | Record<string, string>; usage?: string };
type Group = { note?: string; tokens: Token[] };
type TypeStyle = { name: string; fontSize: string; lineHeight: string; fontWeight: string };
type TypeGroup = { name: string; note?: string; styles: TypeStyle[] };
const T = tokens as unknown as Record<string, Group> & { type: { groups: TypeGroup[] }; color: Group & { themes: { id: string; name: string }[] } };

// Each component's sidebar path (Components/Forms/Input), read from its stories' title, so links follow the grouping.
const storyFiles = import.meta.glob('../src/components/*/*.stories.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const docsId: Record<string, string> = {};
for (const src of Object.values(storyFiles)) {
  const title = /title: '([^']+)'/.exec(src)?.[1];
  if (title) docsId[title.split('/').pop()!] = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Links between component guides (../Loader/README.md) become links to their Storybook pages.
function relink(md: string): string {
  return md.replace(/\]\((?:\.\.\/)?(?:src\/components\/)?(\w+)\/README\.md(#[\w-]+)?\)/g, (_, name) => `](?path=/docs/${docsId[name] || `components-${name.toLowerCase()}`}--docs)`)
    .replace(/\]\(README\.md(#[\w-]+)?\)/g, '](?path=/docs/introduction--docs)');
}

// The guide in pieces, with the anatomy diagram after the "## Anatomy" heading and the text before its list.
function anatomyAt(md: string): (string | Anatomy)[] {
  const at = md.search(/^## Anatomy\s*$/m);
  if (at < 0) return [md];
  const end = md.slice(at + 1).search(/^## /m), section = end < 0 ? md.slice(at) : md.slice(at, at + 1 + end);
  const list = section.search(/^1\. /m), anatomy = parseAnatomy(section);
  if (list < 0 || !anatomy.parts.length) return [md];
  return [md.slice(0, at + list), anatomy, md.slice(at + list)];
}

/** A component's guidelines (its README.md), without the title the page already has. */
export function Guide({ source }: { source: string }) {
  const name = /^# (\w+)/.exec(source)?.[1];
  return <>
    {name && componentStatus[name] && <ComponentStatus status={componentStatus[name]} />}
    {anatomyAt(source.replace(/^# .*\n+/, '')).map((part, i) => (typeof part === 'string'
      ? <Markdown key={i}>{relink(part)}</Markdown>
      : <AnatomyDiagram key={i} {...part} />))}
  </>;
}

// What each status means to someone choosing a component, as README.md's Versioning section says it.
const STATUS_TEXT = {
  alpha: 'Still taking shape. Its props and behaviour may change in any release; try it, but pin the version you ship.',
  beta: 'Ready to use, but its API may still change in a minor release, and the changeset will say how.',
  deprecated: 'It keeps working until the next major release removes it. Its guide says what to use instead.',
} as const;
/** A component's status above its guide, when it isn't stable. */
export function ComponentStatus({ status }: { status: keyof typeof STATUS_TEXT }) {
  return <p role="note" className="sb-unstyled" style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 6, font: '14px/20px var(--font-sans)' }}>
    <strong style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em' }}>{status}</strong>
    <span>{STATUS_TEXT[status]}</span>
  </p>;
}

const ROOT = readme;
/** The README's introduction, before its first section. */
export function ReadmeIntro() {
  return <Markdown>{relink(ROOT.slice(0, ROOT.indexOf('\n## ')).replace(/^# .*\n+/, ''))}</Markdown>;
}
/** Sections of README.md and docs/foundations.md by their headings (## level), each with its subsections. */
export function ReadmeSections({ headings }: { headings: string[] }) {
  const parts = [ROOT, foundations].flatMap((md) => md.split(/\n(?=## )/));
  const md = headings.map((h) => parts.find((p) => p.startsWith(`## ${h}\n`)) || `> Missing README section: ${h}`).join('\n\n');
  return <Markdown>{relink(md)}</Markdown>;
}

const code = (s?: string) => (s || '').split(/`([^`]+)`/).map((x, i) => (i % 2 ? <code key={i}>{x}</code> : x));
const cell: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', textAlign: 'left' };
const val = (v: Token['value']) => (typeof v === 'string' ? v : Object.values(v)[0]);

/** Every token in a group, with its value, what it's for and a live preview. data-token-sheet marks each token block
 * for the visual snapshots (tools/test/visual.mjs), so a changed token value shows as a changed picture. */
export function TokenTable({ group, preview }: { group: string; preview?: 'space' | 'radius' | 'shadow' | 'duration' | 'none' }) {
  const g = T[group];
  const show = (t: Token) => {
    const v = `var(--${t.name})`;
    if (preview === 'space') return <div style={{ height: 12, width: v, background: 'var(--primary)', borderRadius: 2 }} />;
    if (preview === 'radius') return <div style={{ height: 40, width: 40, border: '2px solid var(--primary)', borderRadius: v }} />;
    if (preview === 'shadow') return <div style={{ height: 40, width: 64, background: 'var(--surface)', boxShadow: t.name.startsWith('text-') ? undefined : v, textShadow: t.name.startsWith('text-') ? v : undefined, borderRadius: 6, display: 'grid', placeItems: 'center' }}>{t.name.startsWith('text-') ? 'Aa' : ''}</div>;
    if (preview === 'duration' && /^(duration|delay)-/.test(t.name)) return <span className="dk-sb-pulse" style={{ display: 'inline-block', height: 12, width: 12, borderRadius: 6, background: 'var(--primary)', animationDuration: `calc(${v} * 2 + 200ms)` }} />;
    return null;
  };
  return <div data-token-sheet={group}>
    {g.note && <p>{code(g.note)}</p>}
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
      <thead><tr><th style={cell}>Token</th><th style={cell}>Value</th>{preview && preview !== 'none' && <th style={cell}>Preview</th>}<th style={cell}>Use</th></tr></thead>
      <tbody>{g.tokens.map((t) => <tr key={t.name}>
        <td style={cell}><code>--{t.name}</code></td><td style={cell}><code>{val(t.value)}</code></td>
        {preview && preview !== 'none' && <td style={cell}>{show(t)}</td>}<td style={cell}>{code(t.usage)}</td></tr>)}</tbody>
    </table>
  </div>;
}

const SHADES = /^([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)$/;
/** The palette: every color family, 50 to 950. */
export function Palette() {
  const fam: Record<string, Token[]> = {};
  for (const t of T.color.tokens) { const m = SHADES.exec(t.name); if (m && (typeof t.value === 'string' || Object.keys(t.value).length === 1)) (fam[m[1]] ||= []).push(t); }
  return <div data-token-sheet="palette" style={{ display: 'grid', gap: 8 }}>
    {Object.entries(fam).map(([f, list]) => <div key={f} style={{ display: 'grid', gridTemplateColumns: '80px repeat(11, 1fr)', gap: 4, alignItems: 'center', fontSize: 12 }}>
      <strong>{f}</strong>
      {list.map((t) => <div key={t.name} title={`--${t.name}: ${val(t.value)}`}><div style={{ height: 36, borderRadius: 6, background: `var(--${t.name})` }} /><div>{t.name.split('-')[1]}</div><code style={{ fontSize: 10 }}>{val(t.value)}</code></div>)}
    </div>)}
  </div>;
}

/** The alias colors: a live swatch in the theme picked in the toolbar, and the palette color in every theme. */
export function Aliases() {
  const themes = T.color.themes;
  const list = T.color.tokens.filter((t) => typeof t.value === 'object' && Object.keys(t.value).length > 1);
  return <table data-token-sheet="aliases" style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
    <thead><tr><th style={cell}>Alias</th><th style={cell}>Now</th>{themes.map((th) => <th key={th.id} style={cell}>{th.name}</th>)}<th style={cell}>Use</th></tr></thead>
    <tbody>{list.map((t) => <tr key={t.name}>
      <td style={cell}><code>--{t.name}</code></td>
      <td style={cell}><div style={{ height: 24, width: 40, borderRadius: 4, background: `var(--${t.name})`, border: '1px solid var(--border)' }} /></td>
      {themes.map((th) => <td key={th.id} style={cell}><code>{String((t.value as Record<string, string>)[th.id]).replace(/[{}]/g, '')}</code></td>)}
      <td style={cell}>{code(t.usage)}</td></tr>)}</tbody>
  </table>;
}

/** The type scale: each type-* style rendered in its own family, size, line height and weight. */
export function TypeScale() {
  return <div data-token-sheet="type-scale">{T.type.groups.map((g) => <div key={g.name} style={{ marginBottom: 24 }}>
    <h3>{g.name}</h3>{g.note && <p>{code(g.note)}</p>}
    {g.styles.map((s) => <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12 }}><code>{s.name}</code><br />{s.fontSize} / {s.lineHeight} · {s.fontWeight}</div>
      <div className={s.name}>The quick brown fox jumps over the lazy dog</div>
    </div>)}
  </div>)}</div>;
}

const MATERIAL_ICONS = (Object.values(MATERIAL) as unknown[]).filter(isIconData).sort((x, y) => x.name.localeCompare(y.name));

/** Every Material Symbol, plus your custom icons: search by name, and a click copies an icon's name. */
export function IconGallery() {
  const [q, setQ] = React.useState('');
  const [copied, setCopied] = React.useState('');
  const [limit, setLimit] = React.useState(240);
  const term = q.trim().toLowerCase().replace(/\s+/g, '_');
  React.useEffect(() => setLimit(240), [term]);
  const copy = (text: string) => {
    try { navigator.clipboard.writeText(text); } catch { /* no clipboard: the text still shows */ }
    setCopied(text);
  };
  const custom = customIcons.filter((n) => !term || n.includes(term));
  const material = MATERIAL_ICONS.filter((d) => !term || d.name.includes(term));
  const tile = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', font: 'inherit' } as const;
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 8 } as const;
  const label = { fontSize: 12, color: 'var(--text-muted)', overflowWrap: 'anywhere', textAlign: 'center' } as const;
  const heading = { margin: '0 0 8px', fontSize: 16, fontWeight: 600 } as const;
  const tileFor = (n: string, icon: React.ReactNode) => <button key={n} type="button" onClick={() => copy(n)} title={`<Icon name="${n}" />`} style={tile}>
    {icon}
    <span style={label}>{n}</span>
  </button>;
  // sb-unstyled: keeps Storybook's docs styles off the buttons.
  return <div className="sb-unstyled" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ maxWidth: 320 }}><SearchInput aria-label="Find an icon" placeholder="Find an icon, such as arrow" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <p role="status" style={{ margin: 0, minHeight: 20, color: 'var(--text-muted)' }}>{copied ? <>Copied <code>{copied}</code></> : 'Click an icon to copy its name.'}</p>
    {custom.length ? <section>
      <h3 style={heading}>Your custom icons</h3>
      <div style={grid}>{custom.map((n) => tileFor(n, <Icon name={n} />))}</div>
    </section> : null}
    <section>
      <h3 style={heading}>Material Symbols ({material.length})</h3>
      {material.length ? <div style={grid}>{material.slice(0, limit).map((d) => tileFor(d.name, <Icon icon={d} />))}</div> : <p style={{ margin: 0 }}>No icon matches.</p>}
      {material.length > limit ? <div style={{ marginTop: 8 }}><Button variant="secondary" size="sm" onClick={() => setLimit(limit + 480)}>Show more ({material.length - limit} left)</Button></div> : null}
    </section>
  </div>;
}

/** Icons at the system's sizes, with what each is for. */
export function IconSizes() {
  const sizes: [number, string][] = [[14, '`sm` buttons'], [16, '`md` buttons, inline with `text-sm`'], [20, '`lg` buttons, list rows'], [24, 'The default: toolbars, navigation'], [40, 'Empty states']];
  return <div className="sb-unstyled" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
    {sizes.map(([s, use]) => <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 140, textAlign: 'center', fontSize: 12 }}>
      <Icon name="favorite" size={s} /><strong>{s}px</strong><span style={{ color: 'var(--text-muted)' }}>{code(use)}</span>
    </div>)}
  </div>;
}

// Which components say each label: the doc comment above its key (or group of keys) in SerupaLabels.
const labelUse: Record<string, string> = {};
{
  let use = '';
  for (const source of [labelsSource, ...componentLabelSources]) for (const line of source.slice(source.indexOf('export interface '), source.indexOf('\n}\n')).split('\n').slice(1)) {
    const doc = /^\s*\/\*\*\s*(.*?)\s*\*\/$/.exec(line), key = /^\s*(\w+):/.exec(line);
    if (doc) use = doc[1]; else if (key) labelUse[key[1]] = use;
  }
}
const word = (v: SerupaLabels[keyof SerupaLabels]) => (typeof v === 'function' ? v('n' as unknown as number) : v);
/** Every word the components say on their own, in English and Indonesian, with where it's used. */
export function LabelTable() {
  return <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
    <thead><tr><th style={cell}>Key</th><th style={cell}>English</th><th style={cell}>Indonesian (<code>idLabels</code>)</th><th style={cell}>Where</th></tr></thead>
    <tbody>{(Object.keys(DEFAULT_LABELS) as (keyof SerupaLabels)[]).map((k) => <tr key={k}>
      <td style={cell}><code>{k}</code></td><td style={cell}>{word(DEFAULT_LABELS[k])}</td><td style={cell}>{word(idLabels[k])}</td><td style={cell}>{labelUse[k]}</td></tr>)}</tbody>
  </table>;
}

const LEVELS: [string, string, string, string][] = [
  ['Page', 'surface', 'transparent', 'none'], ['Resting', 'surface', 'border', 'shadow-xs'], ['Raised', 'surface-raised', 'border-raised', 'shadow-md'],
  ['Floating', 'surface-overlay', 'border-overlay', 'shadow-lg'], ['Modal', 'surface-overlay', 'border-overlay', 'shadow-xl'],
];
/** The elevation levels drawn with their tokens, on a light and a dark page side by side. */
export function ElevationLevels() {
  return <div data-token-sheet="elevation-levels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, margin: '16px 0 24px' }}>
    {(['light', 'dark'] as const).map((mode) => <div key={mode} data-theme={`blue-${mode}`} style={{ background: 'var(--surface)', color: 'var(--text)', padding: 24, borderRadius: 8, border: '1px solid var(--border)', display: 'grid', gap: 16 }}>
      {LEVELS.map(([name, bg, edge, shadow]) => <div key={name} style={{ background: `var(--${bg})`, border: `1px solid ${edge === 'transparent' ? 'transparent' : `var(--${edge})`}`, boxShadow: shadow === 'none' ? 'none' : `var(--${shadow})`, borderRadius: 8, padding: '12px 16px', fontSize: 14 }}>
        <strong>{name}</strong> <span style={{ color: 'var(--text-muted)' }}>{mode}: <code>{bg}</code>{shadow !== 'none' && <>, <code>{shadow}</code></>}</span>
      </div>)}
    </div>)}
  </div>;
}

// The token explorer's index: every shared token in tokens.json and every component token (<name>.tokens.json),
// with the components whose CSS reads it. Built once, when the page first draws.
type Found = { css: string; group: string; values: { theme?: string; ref?: string; value: string }[]; usage: string; usedBy: string[] };
const componentTokenFiles = import.meta.glob('../src/components/*/*.tokens.json', { import: 'default', eager: true }) as Record<string, Record<string, Record<string, unknown>>>;
const componentCss = import.meta.glob('../src/components/*/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const COLOR = new Map(T.color.tokens.map((t) => [t.name, t.value]));
// A color token's value in one theme, following references ({blue-600}) to the literal color.
function resolve(value: Token['value'], theme: string, depth = 0): string {
  const v = typeof value === 'string' ? value : value[theme] ?? Object.values(value)[0];
  const ref = /^\{([^}]+)\}$/.exec(v)?.[1];
  return ref && COLOR.has(ref) && depth < 8 ? resolve(COLOR.get(ref)!, theme, depth + 1) : v;
}
let INDEX: Found[] | undefined;
function tokenIndex(): Found[] {
  if (INDEX) return INDEX;
  const usedBy = new Map<string, Set<string>>();
  for (const [file, css] of Object.entries(componentCss)) {
    const name = file.split('/').at(-2)!;
    for (const m of css.matchAll(/var\(\s*(--[\w\\.-]+)/g)) {
      const v = m[1].replace(/\\/g, '');
      if (!usedBy.has(v)) usedBy.set(v, new Set());
      usedBy.get(v)!.add(name);
    }
  }
  const users = (css: string, own?: string) => [...new Set([...(usedBy.get(css) ?? []), ...(own ? [own] : [])])].sort();
  const out: Found[] = [];
  for (const [group, g] of Object.entries(T)) {
    if (!g || typeof g !== 'object' || !Array.isArray((g as Group).tokens)) continue;
    for (const t of (g as Group).tokens) {
      const css = `--${t.name}`;
      const values = typeof t.value === 'object' && Object.keys(t.value).length > 1
        ? T.color.themes.map((th) => ({ theme: th.name, ref: String((t.value as Record<string, string>)[th.id]).replace(/[{}]/g, ''), value: resolve(t.value, th.id) }))
        : [{ value: group === 'color' ? resolve(t.value, T.color.themes[0].id) : val(t.value) }];
      out.push({ css, group, values, usage: t.usage ?? '', usedBy: users(css) });
    }
  }
  for (const [file, json] of Object.entries(componentTokenFiles)) {
    const name = file.split('/').at(-2)!;
    for (const [group, entries] of Object.entries(Object.values(json)[0] as Record<string, Record<string, { $value: unknown; $description?: string; $extensions: { 'com.serupa': { cssVar: string } } }>>)) {
      if (group.startsWith('$')) continue;
      for (const [key, t] of Object.entries(entries)) {
        if (key.startsWith('$')) continue;
        const css = t.$extensions['com.serupa'].cssVar;
        const v = t.$value;
        const ref = typeof v === 'string' ? /^\{[^.}]+\.([^}]+)\}$/.exec(v)?.[1]?.replace(/_/g, '.') : undefined;
        const value = ref ? `--${ref}` : (v && typeof v === 'object' && (v as { alpha?: number }).alpha === 0 ? 'transparent' : typeof v === 'string' ? v : (v as { hex?: string })?.hex ?? JSON.stringify(v));
        out.push({ css, group: name, values: [{ value }], usage: t.$description ?? '', usedBy: users(css, name) });
      }
    }
  }
  return (INDEX = out);
}
// The text to paste into CSS: a dot (or a backslash) in a token name is escaped there (--spacing-1\.5), every one.
const asVar = (css: string) => `var(${css.replace(/[\\.]/g, '\\$&')})`;
const isColor = (v: string) => /^(#|rgb|hsl|oklch|oklab|color\(|transparent$)/.test(v);

/** Every token, shared and component: search by name, value, use or component, see its value in each theme and
 * which components read it, and copy it as var(--name). */
export function TokenExplorer() {
  const all = tokenIndex();
  const [q, setQ] = React.useState('');
  const [limit, setLimit] = React.useState(60);
  const term = q.trim().toLowerCase().replace(/^var\(|\)$/g, '');
  React.useEffect(() => setLimit(60), [term]);
  const hits = term ? all.filter((t) => [t.css, t.group, t.usage, ...t.usedBy, ...t.values.flatMap((v) => [v.value, v.ref ?? ''])].some((s) => s.toLowerCase().includes(term))) : all;
  const swatch = (v: string) => isColor(v) ? <span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, marginInlineEnd: 6, verticalAlign: 'middle', borderRadius: 3, border: '1px solid var(--border)', background: v }} /> : null;
  // sb-unstyled: keeps Storybook's docs styles off the controls.
  return <div className="sb-unstyled" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ maxWidth: 360 }}><SearchInput aria-label="Find a token" placeholder="Find a token, such as primary or Button" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <p role="status" style={{ margin: 0, color: 'var(--text-muted)' }}>{hits.length === all.length ? `${all.length} tokens.` : `${hits.length} of ${all.length} tokens match.`}</p>
    {hits.length ? <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead><tr><th style={cell}>Token</th><th style={cell}>Value</th><th style={cell}>Used by</th><th style={cell}>Use</th></tr></thead>
        <tbody>{hits.slice(0, limit).map((t) => <tr key={t.css}>
          <td style={cell}><div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><code>{t.css}</code><CopyButton value={asVar(t.css)} iconOnly size="sm" variant="ghost">{`Copy ${asVar(t.css)}`}</CopyButton></div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.group}</div></td>
          <td style={cell}>{t.values.map((v, i) => <div key={i} style={{ whiteSpace: 'nowrap' }}>
            {v.theme && <span style={{ color: 'var(--text-muted)' }}>{v.theme}: </span>}
            {swatch(v.value)}{v.ref && v.ref !== v.value ? <><code>{v.ref}</code> </> : null}<code>{v.value}</code>
          </div>)}</td>
          <td style={cell}>{t.usedBy.length ? t.usedBy.map((n, i) => <React.Fragment key={n}>{i ? ', ' : ''}<a href={`?path=/docs/${docsId[n] || `components-${n.toLowerCase()}`}--docs`} target="_top">{n}</a></React.Fragment>) : <span style={{ color: 'var(--text-muted)' }}>No component</span>}</td>
          <td style={cell}>{code(t.usage)}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p style={{ margin: 0 }}>No token matches.</p>}
    {hits.length > limit ? <div><Button variant="secondary" size="sm" onClick={() => setLimit(limit + 200)}>Show more ({hits.length - limit} left)</Button></div> : null}
  </div>;
}
