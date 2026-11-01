"""Material Symbols (Rounded, filled, weight 400) as SVG data, drawn from the icon font.

    python3 tools/icons/material.py           write src/material/icons.ts, part/ and parts.ts
    python3 tools/icons/material.py --check   exit 1 if any is out of date

The source is tools/icons/source/MaterialSymbolsRounded-Filled.woff2, the font Serupa shipped up to 5.x, so every
name that worked then still works and every icon looks the same. Each glyph is read at the font's default optical
size (24) on its 960-unit grid and written as one SVG path for viewBox "0 -960 960 960".

src/material/part/NN.ts  the icons in PARTS files of about the same size, in name order: each icon a named export
                       (`add` is Add, `arrow_forward` ArrowForward, `10k` Icon10k).
src/material/icons.ts  all of them (export * from each part) and the MaterialIconName type. Published as serupa-ds/icons.
src/material/parts.ts  the first name in each part, and loadPart(name): src/icons.ts loads only the part that holds a
                       name it meets, about 90 KB, instead of the whole table (2.7 MB).

The font doesn't change, so this only needs running to rebuild icons.ts from scratch; the icons the components draw
themselves (src/material/builtin.ts) come from icons.ts with node tools/icons/builtin.mjs, which needs no Python.
Needs fontTools and brotli (python3 -m pip install fonttools brotli).
"""
import os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

P = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FONT = os.path.join(P, 'tools', 'icons', 'source', 'MaterialSymbolsRounded-Filled.woff2')
# How many files the table is cut into: about 90 KB each (25 KB gzipped), so one unknown name costs one of those.
PARTS = 32


def export_name(name):
    pascal = ''.join(w[:1].upper() + w[1:] for w in name.split('_'))
    return 'Icon' + pascal if pascal[:1].isdigit() else pascal


def num(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def fmt(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    if s in ('-0', ''):
        s = '0'
    return s.replace('0.', '.', 1) if s.startswith('0.') else s.replace('-0.', '-.', 1)


def compact(d):
    """Absolute path commands (as SVGPathPen writes them) to relative ones with the shortest numbers."""
    out, prev, cx, cy, sx, sy, last = '', '', 0.0, 0.0, 0.0, 0.0, ''
    for cmd, args in re.findall(r'([MLHVQCZ])([^MLHVQCZ]*)', d):
        n = [float(x) for x in re.findall(r'-?\d*\.?\d+', args)]
        if cmd == 'Z':
            out += 'z'; prev, last, cx, cy = 'z', 'z', sx, sy
            continue
        if cmd == 'H':
            rel = [n[-1] - cx]; cx = n[-1]
        elif cmd == 'V':
            rel = [n[-1] - cy]; cy = n[-1]
        else:
            step = {'M': 2, 'L': 2, 'Q': 4, 'C': 6}[cmd]
            rel = []
            for i in range(0, len(n), step):
                for j in range(0, step, 2):
                    rel += [n[i + j] - cx, n[i + j + 1] - cy]
                cx, cy = n[i + step - 2], n[i + step - 1]
            if cmd == 'M':   # a subpath starts at its first point; any further pairs are lines
                sx, sy = n[0], n[1]
        c = cmd.lower()
        if c != last or c == 'm':
            out += c; prev = c
        for v in rel:
            t = fmt(v)
            if not (prev.isalpha() or t.startswith('-') or (t.startswith('.') and '.' in prev)):
                out += ' '
            out += t; prev = t
        last = c
    return out


def paths(font):
    """Every icon name in the font, mapped to its outline as SVG path data."""
    rev = {g: chr(u) for u, g in font.getBestCmap().items()}
    glyphs = font.getGlyphSet()
    # After the ligature (rlig) picks an icon, a single substitution (rclt) swaps some for their filled drawing.
    swap = {}
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', None) == 1:
                swap.update(st.mapping)
    out = {}
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', None) != 4:
                continue
            for first, ligs in st.ligatures.items():
                for lig in ligs:
                    name = rev.get(first, '?') + ''.join(rev.get(c, '?') for c in lig.Component)
                    if not re.fullmatch(r'[a-z0-9_]+', name):
                        continue
                    pen = SVGPathPen(glyphs, ntos=num)
                    glyphs[swap.get(lig.LigGlyph, lig.LigGlyph)].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))   # font y points up, SVG y down
                    d = compact(pen.getCommands())
                    if d:
                        out[name] = d
    return out




def main():
    icons = paths(TTFont(FONT))
    names = sorted(icons)
    seen = {}
    for n in names:
        e = export_name(n)
        if e in seen:
            sys.exit(f'{n} and {seen[e]} both export {e}')
        seen[e] = n
    head = '/* Generated by tools/icons/material.py from Material Symbols Rounded (Apache 2.0); edit that script, not this. */\n'
    lines = [f'export const {export_name(n)}: IconData = {{ name: "{n}", d: "{icons[n]}" }};\n' for n in names]
    # Cut into PARTS runs of about the same number of bytes, so each part a page loads costs about the same.
    total, parts, cur, size = sum(len(l) for l in lines), [], [], 0
    for n, l in zip(names, lines):
        if cur and size >= total * (len(parts) + 1) / PARTS:
            parts.append(cur)
            cur = []
        cur.append((n, l))
        size += len(l)
    parts.append(cur)
    assert len(parts) == PARTS, len(parts)
    out = {}
    for i, part in enumerate(parts):
        out[f'src/material/part/{i:02}.ts'] = head + 'import type { IconData } from "../types";\n\n' + ''.join(l for _, l in part)
    out['src/material/icons.ts'] = head + ''.join(f'export * from "./part/{i:02}";\n' for i in range(PARTS)) + (
        '\n/** Every Material Symbol name, for autocomplete. */\nexport type MaterialIconName =\n' + ''.join(f'  | "{n}"\n' for n in names)[:-1] + ';\n')
    out['src/material/parts.ts'] = head + (
        'import type { IconData } from "./types";\n\n'
        '/** The first name in each part (src/material/part/), in order. */\n'
        'const FIRST = [' + ', '.join(f'"{p[0][0]}"' for p in parts) + '];\n'
        '// One import per part, written out so a bundler sees each one and makes it a chunk of its own.\n'
        'const PARTS: Array<() => Promise<Readonly<Record<string, IconData>>>> = [\n'
        + ''.join(f'  () => import("./part/{i:02}"),\n' for i in range(PARTS)) + '];\n\n'
        '/** The part that would hold a name: the last one whose first name sorts at or before it. */\n'
        'export function partOf(name: string): number {\n'
        '  let i = 0;\n'
        '  while (i + 1 < FIRST.length && FIRST[i + 1] <= name) i++;\n'
        '  return i;\n'
        '}\n\n'
        '/** Loads the part of the icon table that would hold a name. */\n'
        'export function loadPart(name: string): Promise<Readonly<Record<string, IconData>>> {\n'
        '  return PARTS[partOf(name)]();\n'
        '}\n')
    if '--check' in sys.argv:
        stale = [f for f, s in out.items() if not os.path.exists(os.path.join(P, f)) or open(os.path.join(P, f)).read() != s]
        if stale:
            sys.exit('Out of date: ' + ', '.join(stale) + '. Run python3 tools/icons/material.py')
        print(f'Material icons are up to date ({len(names)} icons)')
        return
    os.makedirs(os.path.join(P, 'src', 'material', 'part'), exist_ok=True)
    for f in os.listdir(os.path.join(P, 'src', 'material', 'part')):
        if f'src/material/part/{f}' not in out:
            os.remove(os.path.join(P, 'src', 'material', 'part', f))
    for f, s in out.items():
        open(os.path.join(P, f), 'w').write(s)
    print(f'Wrote src/material/icons.ts, parts.ts and part/ ({len(names)} icons in {PARTS} parts); '
          'now run node tools/icons/builtin.mjs')


if __name__ == '__main__':
    main()
