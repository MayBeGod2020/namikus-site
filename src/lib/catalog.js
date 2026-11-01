import catalog from "../data/catalog.json";

/*
  Формат записи шрифта в src/data/catalog.json — тот же, что был в index.html:
  [название, автор, теги, метки (n новинка, r доработано, f бесплатно для коммерции, s для учёбы),
   размер превью, вид ("ext"/"own"), {u: ссылка, lic, pf: файл превью, st: начертания, cp, vr, aw, pop}]
*/
export const FONTS = catalog.fonts.map((f, ix) => ({
  name: f[0],
  author: f[1],
  tags: f[2],
  marks: f[3],
  size: f[4],
  kind: f[5],
  meta: f[6] || {},
  ix,
}));

export const COLS = catalog.cols;
export const AWARDS = catalog.awards;

export const LEG = [["n", "Новинка!"], ["r", "Доработано"], ["f", "Бесплатно для коммерции"], ["s", "Бесплатно для учёбы"]];
export const BOOST = "https://boosty.to/namikus";
export const AWARD_COLORS = { g: "#d4a838", s: "#a9a9a9" };

export const DEF = "Экс-граф?\nПлюш изъят.\nБьём чуждый\nцен хвощ!";
export const PANGRAMS = [
  ["Русские", ["Съешь же ещё этих мягких французских булок, да выпей чаю", "В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!", DEF]],
  ["English", ["The quick brown fox jumps over the lazy dog", "Pack my box with five dozen liquor jugs", "Sphinx of black quartz, judge my vow"]],
];

export const LBL = {
  "300n": "Тонкое", "400n": "Обычное", "500n": "Среднее", "600n": "Полужирное", "600i": "Полужирный курсив",
  "700n": "Жирное", "900n": "Чёрное", "300i": "Тонкий курсив", "400i": "Курсив", "500i": "Средний курсив",
  "700i": "Жирный курсив", "900i": "Чёрный курсив",
};

/* "700i" → { weight: 700, style: "italic" } */
export const cssOf = (s) => ({ weight: parseInt(s), style: s.slice(-1) === "i" ? "italic" : "normal" });

export function styles(f) {
  return f.kind === "own" ? ["400n", "700n", "400i", "700i"] : f.meta.st || ["400n", "700n"];
}
/* начертание по умолчанию */
export function dst(f) {
  const x = styles(f);
  return x.includes("400n") ? "400n" : x[0];
}
/* начертание с учётом глобальных кнопок «Ж» и «К» */
export function curSt(f, gst) {
  return gst && styles(f).includes(gst) ? gst : dst(f);
}
export const familyOf = (f) => f.meta.pf || f.name;

/* ===== начертания-версии: один шрифт, несколько файлов-семейств (Oblique One, Two …) ===== */
const vrOf = (f) => f.meta.vr || [];
export const vrText = (f) => vrOf(f).map((x) => x.n).join(" ").toLowerCase();

export function faceList(f) {
  const v = vrOf(f);
  if (!v.length) return null;
  const fam = familyOf(f), bs = styles(f), L = [];
  bs.forEach((s) => L.push({ l: bs.length > 1 ? LBL[s] || s : f.meta.bl || "Основное", fam, s }));
  v.forEach((x) => {
    const st = x.st && x.st.length ? x.st : ["400n"];
    const d = st.includes("400n") ? "400n" : st[0];
    st.forEach((s) => L.push({ l: x.n + (st.length > 1 && s !== d ? " · " + (LBL[s] || s) : ""), fam: x.pf || x.n, s, d: s === d }));
  });
  return L;
}

/* ===== фильтры и сортировка ===== */
export const TYPES = (COLS.flat().find((g) => g[0] === "Тип") || [, []])[1];
const typeRank = (f) => f.tags.reduce((r, t) => { const i = TYPES.indexOf(t); return i > -1 && i < r ? i : r; }, TYPES.length);
const popOf = (f) => f.meta.pop || 0;

export function filterFonts({ term, authors, tags, marks, sort }) {
  term = term.trim().toLowerCase();
  const list = FONTS.filter((f) =>
    (f.name.toLowerCase().includes(term) || vrText(f).includes(term)) &&
    (!authors.length || authors.includes(f.author)) &&
    tags.every((t) => f.tags.includes(t)) &&
    marks.every((l) => f.marks.includes(l))
  );
  if (sort === "type") list.sort((a, b) => typeRank(a) - typeRank(b) || a.ix - b.ix);
  else if (sort === "new") list.sort((a, b) => b.ix - a.ix);
  else if (sort === "old") list.sort((a, b) => a.ix - b.ix);
  else if (sort === "pop") list.sort((a, b) => popOf(b) - popOf(a) || b.ix - a.ix);
  return list;
}

export const findFont = (name) => FONTS.find((f) => f.name === name) || null;
