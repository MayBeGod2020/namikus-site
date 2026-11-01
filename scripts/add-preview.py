"""
Добавить превью шрифта на сайт.

  python scripts/add-preview.py <id> <файл шрифта> [вес] [стиль]

  python scripts/add-preview.py a400 MyFont-Regular.ttf
  python scripts/add-preview.py a400 MyFont-Bold.ttf 700
  python scripts/add-preview.py a400 MyFont-Italic.ttf 400 italic

Скрипт урезает шрифт до кириллицы + латиницы + знаков, сохраняет .woff2 в public/pf/,
сведения о знаках в public/pfinfo/ и прописывает начертание в src/data/previews.json.
Потом в src/data/catalog.json у шрифта укажите "pf": "<id>" и "st": ["400n", "700n", ...].

Нужно: pip install fonttools brotli
"""
import json, sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
fid, src = sys.argv[1], sys.argv[2]
w = sys.argv[3] if len(sys.argv) > 3 else "400"
st = sys.argv[4] if len(sys.argv) > 4 else "normal"
name = f"{fid}-{w}{st[0]}"

# латиница, кириллица, пунктуация, валюты, стрелки, знаки для комиксов
UNICODES = "U+0020-024F,U+0300-036F,U+0400-052F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-215F,U+2190-21FF,U+2600-27BF"

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
font = subset.load_font(src, opts)
sub = subset.Subsetter(opts)
sub.populate(unicodes=subset.parse_unicodes(UNICODES))
sub.subset(font)
out = ROOT / "public" / "pf" / (name + ".woff2")
subset.save_font(font, str(out), opts)

f = TTFont(out)
ranges = []
for c in sorted(f.getBestCmap() or {}):
    if ranges and ranges[-1][1] == c - 1:
        ranges[-1][1] = c
    else:
        ranges.append([c, c])
info = {
    "r": ranges,
    "g": f["maxp"].numGlyphs,
    "n": f["name"].getDebugName(4) or f["name"].getDebugName(1) or "",
    "w": f["OS/2"].usWeightClass if "OS/2" in f else 400,
    "i": bool(f["OS/2"].fsSelection & 1) if "OS/2" in f else False,
}
(ROOT / "public" / "pfinfo" / (name + ".json")).write_text(json.dumps(info, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

pj = ROOT / "src" / "data" / "previews.json"
previews = json.loads(pj.read_text(encoding="utf-8"))
faces = [x for x in previews.get(fid, []) if not (x[0] == w and x[1] == st)]
faces.append([w, st, out.name])
previews[fid] = faces
pj.write_text(json.dumps(previews, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"готово: {out.name}, {out.stat().st_size // 1024} КБ")
