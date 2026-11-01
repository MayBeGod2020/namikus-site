import { LBL, cssOf, faceList, familyOf, styles } from "../../lib/catalog.js";
import { asset, loadFace, previewInfo } from "../../lib/fontLoader.js";
import { parseFont, unzipFonts } from "../../lib/fontParse.js";

/*
  «Начертание» в песочнице:
  { label, family, weight, style, src: "pf" | "zip" | "file", s?, w, i, info: () => Promise<сведения о знаках> }
*/

/* облегчённые копии из public/pf (кириллица + латиница) */
export function previewFaces(f) {
  let L = faceList(f);
  const ss = styles(f);
  if (!L) {
    L = ss.slice()
      .sort((a, b) => parseInt(a) - parseInt(b) || (a.slice(-1) === "i") - (b.slice(-1) === "i"))
      .map((s) => ({ l: ss.length > 1 ? LBL[s] || s : "Основное", fam: familyOf(f), s }));
  }
  return L.map((x) => {
    const { weight, style } = cssOf(x.s);
    return {
      label: x.l, family: x.fam, weight, style, src: "pf", s: x.s, w: weight, i: style === "italic",
      load: () => loadFace(x.fam, x.s),
      info: () => previewInfo(x.fam, x.s),
    };
  });
}

let seq = 0;
/* шрифт из файла (своего или из zip): регистрируем под уникальным именем */
export async function makeFace(buf, fname, src) {
  let info = null;
  try { info = await parseFont(buf); } catch (e) {}
  const family = "sbz" + ++seq;
  try {
    const ff = new FontFace(family, buf.slice(0));
    await ff.load();
    document.fonts.add(ff);
  } catch (e) {
    return null;
  }
  const label = (info && info.name) || fname.replace(/^.*\//, "").replace(/\.\w+$/, "");
  return {
    label, family, weight: 400, style: "normal", src, w: info ? info.w : 400, i: info ? info.i : false,
    load: () => Promise.resolve(true),
    info: () => Promise.resolve(info),
  };
}

/* полный файл шрифта из fonts/*.zip */
const zipCache = {};
export function zipFaces(url) {
  if (zipCache[url]) return zipCache[url];
  return (zipCache[url] = fetch(asset(url))
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(unzipFonts)
    .then(async (fl) => {
      const out = [];
      for (const x of fl) {
        const f = await makeFace(x.data.buffer.slice(x.data.byteOffset, x.data.byteOffset + x.data.byteLength), x.name, "zip");
        if (f) out.push(f);
      }
      if (!out.length) throw new Error("нет шрифтов в архиве");
      out.sort((a, b) => a.w - b.w || a.i - b.i || (a.label < b.label ? -1 : 1));
      return out;
    })
    .catch((e) => { delete zipCache[url]; throw e; }));
}

export const zipUrlOf = (f) => (f.meta.u && /^fonts\/.+\.zip$/i.test(f.meta.u) ? f.meta.u : null);

/* ближайшее по жирности и наклону начертание */
export function pickFace(faces, h) {
  let best = null, sc = 1e9;
  faces.forEach((x) => {
    const s = Math.abs(x.w - (h.w || 400)) + (!!x.i !== !!h.i ? 1000 : 0) + (h.fam && x.src === "pf" && x.family !== h.fam ? 5000 : 0);
    if (s < sc) { sc = s; best = x; }
  });
  return best;
}
