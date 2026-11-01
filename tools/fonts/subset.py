# Splits Inter into one file per script (F6+145), so a page downloads only the scripts its text uses: the browser
# fetches an @font-face only when a character in its unicode-range is on the page. English needs the latin file
# alone, 1/4 of the whole font. The ranges are the ones Google Fonts uses for Inter, so they cover what each script
# needs (latin-ext for Polish, Turkish or Czech, vietnamese for its stacked accents), and "symbols" takes every
# other character Inter has (arrows, math, box drawing …), so nothing the full font draws goes missing.
#   pip install fonttools brotli
#   python3 -I tools/fonts/subset.py     writes fonts/InterVariable-<subset>.woff2 and their faces in tokens/serupa.tokens.json (then npm run tokens)
# Run it again only when the fonts in fonts/ change. All layout features, the variation axes and the names (with
# the licence) are kept, and each file keeps the glyphs its features reach, so "->" still turns into an arrow.
import json, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
FONTS = os.path.join(ROOT, "fonts")
SUBSETS = {
    "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    "cyrillic-ext": "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
    "cyrillic": "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
    "greek-ext": "U+1F00-1FFF",
    "greek": "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
    "vietnamese": "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
}

def parse(ranges):
    out = set()
    for part in ranges.split(","):
        a, _, b = part.strip()[2:].partition("-")
        out.update(range(int(a, 16), int(b or a, 16) + 1))
    return out

# The codes as U+ ranges. A gap of up to 64 codes is bridged when no other subset claims a code in it (a code there
# is one Inter doesn't draw, so a page using it would fetch this file for nothing), which keeps the list short
# without reaching into another script's block, Hangul or emoji.
def ranges(codes, claimed):
    out = []
    for c in sorted(codes):
        if out and c - out[-1][1] <= 64 and all(g not in claimed for g in range(out[-1][1] + 1, c)): out[-1][1] = c
        else: out.append([c, c])
    return ", ".join("U+%04X" % a if a == b else "U+%04X-%04X" % (a, b) for a, b in out)

faces = []
for source in ("InterVariable.woff2", "InterVariable-Italic.woff2"):
    font = TTFont(os.path.join(FONTS, source))
    have = set(font.getBestCmap())
    plan = {name: parse(r) & have for name, r in SUBSETS.items()}
    taken = set().union(*plan.values())
    claimed = set().union(*(parse(r) for r in SUBSETS.values()))
    # Everything else Inter draws, minus the controls and spaces the latin file already has.
    plan["symbols"] = have - taken
    stem = source[: -len(".woff2")]
    for name, codes in plan.items():
        if not codes: continue
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.notdef_outline = True
        options.glyph_names = False
        options.flavor = "woff2"
        sub = subset.Subsetter(options)
        f = TTFont(os.path.join(FONTS, source))
        sub.populate(unicodes=codes)
        sub.subset(f)
        out = "%s-%s.woff2" % (stem, name)
        f.save(os.path.join(FONTS, out))
        style = "italic" if "Italic" in source else "normal"
        faces.append({"family": "Inter", "file": "fonts/" + out, "weight": "100 900", "style": style, "unicodeRange": SUBSETS.get(name) or ranges(codes, claimed)})
        print("%-40s %6.1f KiB" % (out, os.path.getsize(os.path.join(FONTS, out)) / 1024))

# The token source's type.fonts lists the faces (tokens.json's, once npm run tokens has run), and tools/tokens/build.mjs
# writes an @font-face for each into tokens.css.
path = os.path.join(ROOT, "tokens", "serupa.tokens.json")
tokens = json.load(open(path, encoding="utf-8"))
tokens["$extensions"]["com.serupa"]["type"]["fonts"] = faces
open(path, "w", encoding="utf-8").write(json.dumps(tokens, indent=2, ensure_ascii=False) + "\n")
print("faces written to tokens/serupa.tokens.json: run npm run tokens")
