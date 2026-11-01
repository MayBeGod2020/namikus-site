import previews from "../data/previews.json";
import { cssOf } from "./catalog.js";

/*
  Раньше все ~550 файлов шрифтов лежали внутри index.html в base64 (27 МБ) и грузились разом.
  Теперь каждое начертание — отдельный .woff2 в public/pf/, и он скачивается
  только когда карточка шрифта появляется на экране.
*/
const BASE = import.meta.env.BASE_URL;
export const asset = (p) => BASE + p;

function faceFile(fam, s) {
  const { weight, style } = cssOf(s);
  const L = previews[fam];
  if (!L) return null;
  return L.find((x) => +x[0] === weight && x[1] === style) || null;
}

const cache = new Map();
/* загрузить одно начертание превью; resolve — когда шрифт готов к отрисовке */
export function loadFace(fam, s) {
  const key = fam + "|" + s;
  if (cache.has(key)) return cache.get(key);
  const x = faceFile(fam, s);
  let p = Promise.resolve(false);
  if (x) {
    const ff = new FontFace(fam, `url(${asset("pf/" + x[2])}) format("woff2")`, { weight: x[0], style: x[1], display: "swap" });
    p = ff.load().then((f) => { document.fonts.add(f); return true; }).catch(() => false);
  }
  cache.set(key, p);
  return p;
}

/* сведения о знаках шрифта превью (посчитаны заранее, лежат в public/pfinfo/) */
const infoCache = new Map();
export function previewInfo(fam, s) {
  const x = faceFile(fam, s);
  if (!x) return Promise.resolve(null);
  const name = x[2].replace(/\.\w+$/, "");
  if (!infoCache.has(name)) {
    infoCache.set(name, fetch(asset("pfinfo/" + name + ".json"))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return null;
        const set = new Set();
        j.r.forEach(([a, b]) => { for (let c = a; c <= b; c++) set.add(c); });
        return { set, glyphs: j.g, name: j.n, w: j.w, i: j.i };
      })
      .catch(() => null));
  }
  return infoCache.get(name);
}

/* один IntersectionObserver на все карточки — дёшево даже для сотен элементов */
let io = null;
const handlers = new WeakMap();
export function whenVisible(el, cb) {
  if (!("IntersectionObserver" in window)) { cb(); return () => {}; }
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const h = handlers.get(e.target);
        io.unobserve(e.target);
        handlers.delete(e.target);
        if (h) h();
      });
    }, { rootMargin: "600px 0px" });
  }
  handlers.set(el, cb);
  io.observe(el);
  return () => { handlers.delete(el); io.unobserve(el); };
}
