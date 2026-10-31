// The Foundations/Contrast matrix page: every color pair in tools/tokens/contrast-pairs.mjs (the list
// tools/test/foundation.mjs checks) with its WCAG contrast ratio in each theme, normal and with more contrast,
// worked out from tokens.json on each build.
import * as React from 'react';
import tokens from '../tokens.json';
import { PAIRS } from '../tools/tokens/contrast-pairs.mjs';
import { contrastRatio } from '../src/internal/color';

type Value = string | Record<string, string>;
type ColorToken = { name: string; value: Value; contrastMore?: string | { light: string; dark: string } };
const C = (tokens as unknown as { color: { tokens: ColorToken[]; themes: { id: string; name: string }[] } }).color;
const BY_NAME = new Map(C.tokens.map((t) => [t.name, t]));

// A token's color in a theme, following references ({zinc-900}) to the hex; with more contrast, a token's
// contrastMore pair (its light or dark half, by the theme's mode) takes the place of its value.
function hex(name: string, theme: string, more: boolean, depth = 0): string {
  const t = BY_NAME.get(name);
  if (!t || depth > 8) return '';
  const mode = theme.endsWith('-dark') ? 'dark' : 'light';
  const cm = more ? t.contrastMore : undefined;
  const v = cm ? (typeof cm === 'string' ? cm : cm[mode]) : typeof t.value === 'string' ? t.value : t.value[theme] ?? Object.values(t.value)[0];
  const ref = /^\{([^}]+)\}$/.exec(v)?.[1];
  return ref ? hex(ref, theme, more, depth + 1) : v;
}

const cell: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', textAlign: 'left' };
const fmt = (r: number | null) => (r === null ? '?' : r.toFixed(2));

/** Each pair's ratio in every theme: pass or fail against what it needs, and the ratio with more contrast. */
export function ContrastMatrix() {
  const rows = PAIRS.map(([fg, bg, need, what]) => ({ fg, bg, need, what, themes: C.themes.map((th) => {
    const f = hex(fg, th.id, false), b = hex(bg, th.id, false);
    return { th, f, b, normal: contrastRatio(f, b), more: contrastRatio(hex(fg, th.id, true), hex(bg, th.id, true)) };
  }) }));
  const failing = rows.flatMap((r) => r.themes.filter((t) => t.normal === null || t.normal < r.need)).length;
  return <div className="sb-unstyled" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <p style={{ margin: 0 }}>{PAIRS.length} pairs in {C.themes.length} themes: {failing ? `${failing} below what they need.` : 'every one meets what it needs.'}</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead><tr><th style={cell}>Pair</th><th style={cell}>Needs</th>{C.themes.map((th) => <th key={th.id} style={cell}>{th.name}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={`${r.fg} ${r.bg} ${r.need}`}>
          <td style={cell}><div><code>{r.fg}</code> on <code>{r.bg}</code></div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.what}</div></td>
          <td style={cell}>{r.need}:1</td>
          {r.themes.map((t) => {
            const ok = t.normal !== null && t.normal >= r.need;
            return <td key={t.th.id} style={cell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                {/* Text for a text pair; a ring for a 3:1 one (an icon, border or focus ring), which isn't text. */}
                <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: t.b, color: t.f, fontWeight: 600 }}>
                  {r.need >= 4.5 ? 'Aa' : <span style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${t.f}` }} />}
                </span>
                <span>{fmt(t.normal)}</span>
                <span style={{ color: ok ? 'var(--success-text)' : 'var(--danger-text)', fontWeight: 600 }}>{ok ? 'Pass' : 'Fail'}</span>
              </div>
              {t.more !== t.normal && <div style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>More contrast: {fmt(t.more)}</div>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
