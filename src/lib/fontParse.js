/* Чтение файла шрифта: таблицы, cmap, name, OS/2 — и распаковка zip. Без внешних библиотек. */

const tag = (d, o) => String.fromCharCode(d.getUint8(o), d.getUint8(o + 1), d.getUint8(o + 2), d.getUint8(o + 3));
const dv = (t) => new DataView(t.buffer, t.byteOffset, t.byteLength);
const inflate = (u8, fmt) =>
  new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream(fmt))).arrayBuffer().then((b) => new Uint8Array(b));

async function tables(buf) {
  const d = new DataView(buf), sig = tag(d, 0), T = {};
  let b = 0;
  if (sig === "wOF2") throw new Error("woff2");
  if (sig === "wOFF") {
    const n = d.getUint16(12);
    for (let i = 0; i < n; i++) {
      const o = 44 + i * 20, cl = d.getUint32(o + 8), ol = d.getUint32(o + 12), u = new Uint8Array(buf, d.getUint32(o + 4), cl);
      T[tag(d, o)] = cl < ol ? await inflate(u, "deflate") : u;
    }
    return T;
  }
  if (sig === "ttcf") b = d.getUint32(12);
  const n = d.getUint16(b + 4);
  for (let i = 0; i < n; i++) {
    const p = b + 12 + i * 16;
    T[tag(d, p)] = new Uint8Array(buf, d.getUint32(p + 8), d.getUint32(p + 12));
  }
  return T;
}

function cmap(t) {
  const d = dv(t), n = d.getUint16(2), S = new Set(), seen = {};
  for (let i = 0; i < n; i++) {
    const p = d.getUint16(4 + i * 8), e = d.getUint16(6 + i * 8), o = d.getUint32(8 + i * 8), sym = p === 3 && e === 0;
    if (!(p === 0 || (p === 3 && (e === 1 || e === 10)) || sym) || seen[o]) continue;
    seen[o] = 1;
    const add = (c) => { if (sym && c >= 0xf000 && c <= 0xf0ff) c -= 0xf000; S.add(c); };
    const fm = d.getUint16(o);
    if (fm === 4) {
      const sc = d.getUint16(o + 6) / 2, ec = o + 14, sa = ec + sc * 2 + 2, da = sa + sc * 2, ra = da + sc * 2;
      for (let k = 0; k < sc; k++) {
        const en = d.getUint16(ec + k * 2), st = d.getUint16(sa + k * 2), dl = d.getInt16(da + k * 2), ro = d.getUint16(ra + k * 2);
        for (let c = st; c <= en && c < 0xffff; c++) {
          let g;
          if (ro === 0) g = (c + dl) & 0xffff;
          else {
            const ad = ra + k * 2 + ro + (c - st) * 2;
            if (ad + 2 > t.length) continue;
            g = d.getUint16(ad);
            if (g) g = (g + dl) & 0xffff;
          }
          if (g) add(c);
        }
      }
    } else if (fm === 12 || fm === 13) {
      const ng = d.getUint32(o + 12);
      for (let k = 0; k < ng; k++) {
        const q = o + 16 + k * 12, s0 = d.getUint32(q), e0 = d.getUint32(q + 4), g0 = d.getUint32(q + 8);
        if (e0 - s0 > 0x20000 || e0 > 0x10ffff) continue;
        for (let c = s0; c <= e0; c++) if (fm === 13 || g0 + c - s0 > 0) add(c);
      }
    } else if (fm === 6) {
      const fc = d.getUint16(o + 6), ct = d.getUint16(o + 8);
      for (let k = 0; k < ct; k++) if (d.getUint16(o + 10 + k * 2)) add(fc + k);
    } else if (fm === 0) {
      for (let k = 0; k < 256; k++) if (t[o + 6 + k]) add(k);
    }
  }
  return S;
}

function names(t) {
  const d = dv(t), n = d.getUint16(2), so = d.getUint16(4), R = {}, P = {};
  for (let i = 0; i < n; i++) {
    const o = 6 + i * 12, p = d.getUint16(o), id = d.getUint16(o + 6), ln = d.getUint16(o + 8), of = so + d.getUint16(o + 10);
    if (![1, 2, 4, 16, 17].includes(id)) continue;
    const w = p === 3 ? 2 : p === 0 ? 1 : 0;
    if (P[id] >= w) continue;
    let s = "";
    if (p === 3 || p === 0) for (let j = 0; j + 1 < ln; j += 2) s += String.fromCharCode(d.getUint16(of + j));
    else for (let j = 0; j < ln; j++) s += String.fromCharCode(t[of + j]);
    if (s) { R[id] = s; P[id] = w; }
  }
  return R;
}

export async function parseFont(buf) {
  const T = await tables(buf);
  const set = T.cmap ? cmap(T.cmap) : new Set(), nm = T.name ? names(T.name) : {}, o = T["OS/2"], h = T.head;
  let w = 400, it = false;
  if (o && o.length >= 64) { const od = dv(o); w = od.getUint16(4); it = !!(od.getUint16(62) & 1); }
  else if (h && h.length >= 46) { const ms = dv(h).getUint16(44); if (ms & 1) w = 700; it = !!(ms & 2); }
  return { set, glyphs: T.maxp ? dv(T.maxp).getUint16(4) : 0, name: nm[4] || nm[1] || "", w: w || 400, i: it };
}

/* zip без библиотек (хватает deflate и stored) */
export async function unzipFonts(buf) {
  const d = new DataView(buf), u = new Uint8Array(buf), out = [];
  let i = buf.byteLength - 22;
  for (; i >= Math.max(0, buf.byteLength - 65557); i--) if (d.getUint32(i, true) === 0x06054b50) break;
  if (i < 0) throw new Error("zip");
  const n = d.getUint16(i + 10, true);
  let off = d.getUint32(i + 16, true);
  for (let k = 0; k < n; k++) {
    if (d.getUint32(off, true) !== 0x02014b50) break;
    const m = d.getUint16(off + 10, true), cs = d.getUint32(off + 20, true), nl = d.getUint16(off + 28, true),
      el = d.getUint16(off + 30, true), cl = d.getUint16(off + 32, true), lh = d.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u.subarray(off + 46, off + 46 + nl));
    off += 46 + nl + el + cl;
    if (!/\.(ttf|otf|woff2?)$/i.test(name) || /(^|\/)(__MACOSX|\._)/.test(name)) continue;
    const ds = lh + 30 + d.getUint16(lh + 26, true) + d.getUint16(lh + 28, true), raw = u.subarray(ds, ds + cs);
    out.push({ name, data: m === 0 ? raw.slice() : m === 8 ? await inflate(raw, "deflate-raw") : null });
  }
  return out.filter((x) => x.data);
}

/* ===== справочники для вкладок «Глифы» и «Языки» ===== */
export const BLOCKS = [[0x20,0x7F,"Основная латиница"],[0xA0,0xFF,"Латиница-1 (дополнение)"],[0x100,0x17F,"Латиница расширенная A"],[0x180,0x24F,"Латиница расширенная B"],[0x250,0x2AF,"Фонетические знаки (IPA)"],[0x2B0,0x2FF,"Модификаторы"],[0x300,0x36F,"Комбинируемые диакритики"],[0x370,0x3FF,"Греческий"],[0x400,0x52F,"Кириллица"],[0x530,0x58F,"Армянский"],[0x590,0x5FF,"Иврит"],[0x600,0x6FF,"Арабский"],[0x900,0x97F,"Деванагари"],[0xE00,0xE7F,"Тайский"],[0x10A0,0x10FF,"Грузинский"],[0x1AB0,0x1AFF,"Диакритики, расширение"],[0x1DC0,0x1DFF,"Диакритики, дополнение"],[0x1E00,0x1EFF,"Латиница расширенная доп."],[0x1F00,0x1FFF,"Греческий расширенный"],[0x2000,0x206F,"Знаки пунктуации"],[0x2070,0x209F,"Верхние и нижние индексы"],[0x20A0,0x20CF,"Валюты"],[0x20D0,0x20FF,"Диакритики для символов"],[0x2100,0x214F,"Буквоподобные символы"],[0x2150,0x218F,"Числовые формы"],[0x2190,0x21FF,"Стрелки"],[0x2200,0x22FF,"Математические операторы"],[0x2300,0x23FF,"Технические символы"],[0x2400,0x245F,"Управляющие картинки"],[0x2460,0x24FF,"Обрамлённые буквы и цифры"],[0x2500,0x257F,"Рамки"],[0x2580,0x259F,"Блочные элементы"],[0x25A0,0x25FF,"Геометрические фигуры"],[0x2600,0x26FF,"Разные символы"],[0x2700,0x27BF,"Дингбаты"],[0x2C60,0x2C7F,"Латиница расширенная C"],[0x2DE0,0x2DFF,"Кириллица расширенная A"],[0x2E00,0x2E7F,"Пунктуация, дополнение"],[0x3000,0x303F,"Знаки CJK"],[0x3040,0x309F,"Хирагана"],[0x30A0,0x30FF,"Катакана"],[0x3400,0x4DBF,"Иероглифы CJK, расширение A"],[0x4E00,0x9FFF,"Иероглифы CJK"],[0xA640,0xA69F,"Кириллица расширенная B"],[0xA720,0xA7FF,"Латиница расширенная D"],[0xAC00,0xD7AF,"Хангыль (слоги)"],[0xE000,0xF8FF,"Область частного использования"],[0xFB00,0xFB4F,"Лигатуры"],[0xFE20,0xFE2F,"Половинки диакритик"],[0xFF00,0xFFEF,"Полная и половинная ширина"],[0xFFF0,0xFFFF,"Специальные"],[0x1F300,0x1FAFF,"Эмодзи и пиктограммы"]];
const COMB = [[0x300,0x36F],[0x483,0x489],[0x1AB0,0x1AFF],[0x1DC0,0x1DFF],[0x20D0,0x20FF],[0x2DE0,0x2DFF],[0xA66F,0xA672],[0xA674,0xA67D],[0xFE20,0xFE2F]];
const inRanges = (L, c) => L.some((r) => c >= r[0] && c <= r[1]);
export const isSpace = (c) => c === 0x20 || c === 0xa0 || (c >= 0x2000 && c <= 0x200f) || c === 0x202f || c === 0x205f || c === 0x3000 || c === 0x2060 || c === 0xfeff;
export const hex = (c) => "U+" + c.toString(16).toUpperCase().padStart(4, "0");
export const charOf = (c) => (inRanges(COMB, c) ? "◌" : "") + String.fromCodePoint(c);
export const codepoints = (info) =>
  Array.from(info.set).filter((c) => c >= 0x20 && !(c >= 0x7f && c <= 0x9f) && c !== 0xfffe && c !== 0xffff && !(c >= 0xd800 && c <= 0xdfff)).sort((a, b) => a - b);

const LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const low = (s) => Array.from(s).map((c) => c.toLowerCase()).join("");
const LANGS = [
  ["Кириллица","Русский","АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"],
  ["Кириллица","Украинский","АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ"],
  ["Кириллица","Белорусский","АБВГДЕЁЖЗІЙКЛМНОПРСТУЎФХЦЧШЫЬЭЮЯ"],
  ["Кириллица","Болгарский","АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ"],
  ["Кириллица","Сербский (кириллица)","АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ"],
  ["Кириллица","Македонский","АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ"],
  ["Кириллица","Казахский","АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯ"],
  ["Кириллица","Монгольский","АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ"],
  ["Кириллица","Татарский","АӘБВГДЕЁЖҖЗИЙКЛМНҢОӨПРСТУҮФХҺЦЧШЩЪЫЬЭЮЯ"],
  ["Латиница","Английский",LAT],
  ["Латиница","Немецкий",LAT+"ÄÖÜ",low(LAT)+"äöüß",true],
  ["Латиница","Французский",LAT+"ÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ"],
  ["Латиница","Испанский",LAT+"ÁÉÍÑÓÚÜ¿¡"],
  ["Латиница","Итальянский",LAT+"ÀÈÉÌÒÙ"],
  ["Латиница","Португальский",LAT+"ÁÂÃÀÇÉÊÍÓÔÕÚ"],
  ["Латиница","Польский",LAT+"ĄĆĘŁŃÓŚŹŻ"],
  ["Латиница","Чешский",LAT+"ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ"],
  ["Латиница","Словацкий",LAT+"ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ"],
  ["Латиница","Венгерский",LAT+"ÁÉÍÓÖŐÚÜŰ"],
  ["Латиница","Румынский",LAT+"ĂÂÎȘȚ"],
  ["Латиница","Турецкий",LAT+"ÇĞİÖŞÜ",low(LAT)+"çğıöşü",true],
  ["Латиница","Шведский и финский",LAT+"ÅÄÖ"],
  ["Латиница","Датский и норвежский",LAT+"ÆØÅ"],
  ["Латиница","Литовский",LAT+"ĄČĘĖĮŠŲŪŽ"],
  ["Латиница","Латышский",LAT+"ĀČĒĢĪĶĻŅŠŪŽ"],
  ["Латиница","Эстонский",LAT+"ÄÕÖÜŠŽ"],
  ["Латиница","Хорватский",LAT+"ČĆŠŽĐ"],
  ["Греческий","Греческий","ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΆΈΉΊΌΎΏ"],
  ["Знаки и символы","Цифры","0123456789"],
  ["Знаки и символы","Основная пунктуация",".,:;!?'\"()-/"],
  ["Знаки и символы","Русская типографика","«»„“”—–…№"],
  ["Знаки и символы","Знаки для комиксов","‼⁉♪♥★☆"],
  ["Знаки и символы","Валюты","$€£¥₽"],
];
const SCRIPTS = [["Хирагана",[[0x3041,0x3096]]],["Катакана",[[0x30A1,0x30FA]]],["Корейский (хангыль, слоги)",[[0xAC00,0xD7A3]]],["Иероглифы CJK",[[0x4E00,0x9FFF]],1],["Арабский",[[0x621,0x64A]]],["Иврит",[[0x5D0,0x5EA]]],["Тайский",[[0xE01,0xE3A]]],["Деванагари",[[0x905,0x939]]],["Армянский",[[0x531,0x556],[0x561,0x586]]],["Грузинский",[[0x10D0,0x10FA]]]];

export function checkLangs(set) {
  const R = [];
  LANGS.forEach((L) => {
    const up = L[2], lo = L[4] ? L[3] : low(up);
    const need = [...new Set(Array.from(up + (L[1] === "Цифры" || L[0] === "Знаки и символы" ? "" : lo)))];
    const miss = need.filter((c) => !set.has(c.codePointAt(0)));
    R.push({ g: L[0], n: L[1], tot: need.length, miss, ok: !miss.length });
  });
  SCRIPTS.forEach((S) => {
    let tot = 0, have = 0;
    S[1].forEach((r) => { for (let c = r[0]; c <= r[1]; c++) { tot++; if (set.has(c)) have++; } });
    R.push({ g: "Другие письменности", n: S[0], tot, have, cjk: !!S[2], miss: [], ok: (have === tot && !S[2]) || (!!S[2] && have > 0) });
  });
  return R;
}
