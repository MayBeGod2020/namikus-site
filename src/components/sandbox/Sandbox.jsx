import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FONTS, dst, findFont } from "../../lib/catalog.js";
import { sampleText } from "../../lib/sampleText.js";
import { store } from "../../lib/util.jsx";
import { IcCanvas, IcCenterX, IcCenterY, IcClose, IcFontFile, IcGlyphs, IcImage, IcLangs } from "../Icons.jsx";
import { makeFace, pickFace, previewFaces, zipFaces, zipUrlOf } from "./faces.js";
import Glyphs from "./Glyphs.jsx";
import Langs from "./Langs.jsx";

const TABS = [["canvas", "Холст", IcCanvas], ["glyphs", "Все глифы", IcGlyphs], ["langs", "Поддерживаемые языки", IcLangs]];

export default function Sandbox({ active, name, hint }) {
  const [font, setFont] = useState(null);
  const [faces, setFaces] = useState([]);
  const [face, setFace] = useState(null);
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("canvas");
  const [q, setQ] = useState("");
  const [size, setSize] = useState(44);
  const [color, setColor] = useState("#111111");
  const [upper, setUpper] = useState(false);
  const [cx, setCx] = useState(false);
  const [cy, setCy] = useState(false);
  const [alignC, setAlignC] = useState(false);
  const [guides, setGuides] = useState([false, false]);
  const [img, setImg] = useState(null);
  const [drop, setDrop] = useState(false);
  const tok = useRef(0), own = useRef(false);
  const stage = useRef(null), cv = useRef(null), tbw = useRef(null), tb = useRef(null);

  /* ----- выбор шрифта ----- */
  const choose = useCallback((f, h = {}) => {
    const my = ++tok.current;
    own.current = false;
    if (h.w == null) { const d = dst(f); h = { ...h, w: parseInt(d), i: d.slice(-1) === "i" }; }
    const pf = previewFaces(f);
    setFont(f);
    setFaces(pf);
    setFace(pickFace(pf, h));
    store("sbf", f.name);
    try { history.replaceState(null, "", "#sandbox/" + encodeURIComponent(f.name)); } catch (e) {}

    const z = zipUrlOf(f), hasPf = !!f.meta.pf;
    if (z && /^https?:$/.test(location.protocol)) {
      setNote("Загружаю полный файл шрифта…");
      zipFaces(z).then((fl) => {
        if (my !== tok.current) return;
        setFace((cur) => pickFace(fl, { w: cur ? cur.w : h.w, i: cur ? cur.i : h.i }));
        setFaces(fl);
        setNote("Показан полный файл шрифта.");
      }).catch(() => {
        if (my !== tok.current) return;
        setNote(hasPf ? "Не удалось загрузить полный файл — показана облегчённая копия (кириллица и латиница)." : "Не удалось загрузить файл шрифта.");
      });
    } else if (z) {
      setNote("Полный файл шрифта подгружается только при открытии сайта по ссылке (не как локального файла). Пока показана облегчённая копия.");
    } else if (hasPf) {
      setNote("Для этого шрифта на сайте есть только облегчённая копия (кириллица и латиница). Чтобы увидеть все глифы, откройте файл шрифта.");
    } else {
      setNote("Для этого шрифта на сайте нет файла: превью, глифы и языки недоступны. Откройте файл шрифта, чтобы посмотреть их.");
    }
  }, []);

  /* вход в песочницу: #sandbox/Имя, кнопка «Песочница» в карточке или последний открытый шрифт */
  useEffect(() => {
    if (!active) return;
    const h = hint.current;
    hint.current = null;
    if (h) tb.current.textContent = sampleText.get();
    const f = (name && findFont(name)) || font || findFont(store("sbf")) || FONTS[0];
    if (f !== font || own.current || h) choose(f, h || {});
  }, [active, name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { tb.current.textContent = sampleText.get(); }, []);
  useEffect(() => { if (face) face.load(); }, [face]);

  const openOwn = async (file) => {
    if (!file) return;
    const fc = await makeFace(await file.arrayBuffer(), file.name, "file");
    if (!fc) { setNote("Не удалось прочитать файл шрифта."); return; }
    ++tok.current;
    own.current = true;
    setFaces([fc]);
    setFace(fc);
    setNote("Свой файл: " + fc.label + ". Он остаётся только в вашем браузере.");
  };

  /* ----- холст: выключка по центру ----- */
  const place = useCallback(() => {
    const c = cv.current, w = tbw.current;
    if (!c || !c.clientWidth) return;
    if (cx) w.style.left = Math.max(0, Math.round((c.clientWidth - w.offsetWidth) / 2)) + "px";
    if (cy) w.style.top = Math.max(0, Math.round((c.clientHeight - w.offsetHeight) / 2)) + "px";
  }, [cx, cy]);
  useLayoutEffect(place, [place, size, upper, face, img, tab]);
  useEffect(() => {
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(place);
    ro.observe(cv.current);
    ro.observe(tbw.current);
    return () => ro.disconnect();
  }, [place]);

  const focusStage = () => { if (tab === "canvas") stage.current.scrollIntoView({ block: "start" }); };

  const readImg = (f) => {
    if (!f || f.type.indexOf("image/") !== 0) return;
    const r = new FileReader();
    r.onload = () => setImg(r.result);
    r.readAsDataURL(f);
  };
  useEffect(() => {
    if (!active) return;
    const paste = (e) => {
      const it = e.clipboardData && e.clipboardData.items;
      if (!it) return;
      for (const x of it) if (x.type.indexOf("image/") === 0) { e.preventDefault(); readImg(x.getAsFile()); return; }
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [active]);

  /* перетаскивание текста с примагничиванием к центру */
  const drag = (e) => {
    e.preventDefault();
    const d = e.currentTarget, sx = e.clientX, sy = e.clientY, w = tbw.current, ox = w.offsetLeft, oy = w.offsetTop, SN = 10;
    d.setPointerCapture(e.pointerId);
    d.onpointermove = (m) => {
      const W = cv.current.clientWidth, H = cv.current.clientHeight;
      let l = Math.max(0, ox + m.clientX - sx), t = Math.max(22, oy + m.clientY - sy);
      const cl = (W - w.offsetWidth) / 2, ct = (H - w.offsetHeight) / 2, snapX = Math.abs(l - cl) < SN, snapY = Math.abs(t - ct) < SN;
      if (snapX) l = Math.max(0, Math.round(cl));
      if (snapY) t = Math.max(0, Math.round(ct));
      w.style.left = l + "px";
      w.style.top = t + "px";
      setCx(snapX); setCy(snapY); setGuides([snapX, snapY]);
    };
    d.onpointerup = () => { d.onpointermove = null; setGuides([false, false]); };
  };

  const insert = (ch) => {
    const el = tb.current, r = document.createRange(), last = el.lastElementChild;
    r.selectNodeContents(last && last.tagName === "DIV" ? last : el);
    r.collapse(false);
    r.insertNode(document.createTextNode(ch));
    place();
  };

  /* ----- список шрифтов с поиском ----- */
  const term = q.trim().toLowerCase();
  const options = term ? FONTS.filter((f) => f.name.toLowerCase().includes(term)) : FONTS;
  const pickFromList = (ix) => { setQ(""); choose(FONTS[ix]); };

  const fam = face ? `'${face.family}',sans-serif` : `'${font ? font.name : ""}',sans-serif`;
  const vars = { "--sbff": fam, "--sbfw": face ? face.weight : 400, "--sbfs": face ? face.style : "normal" };

  return (
    <section hidden={!active} style={vars}>
      <a className="back" href="#fonts">← Каталог</a>
      <div className="cat" style={{ paddingTop: 18 }}>
        <div className="side sbp">
          <div className="ibr">
            {TABS.map(([t, title, Icon]) => (
              <button key={t} className="ib" aria-pressed={tab === t} title={title} aria-label={title}
                onClick={() => { setTab(t); if (t !== "canvas") window.scrollTo(0, 0); else requestAnimationFrame(focusStage); }}>
                <Icon />
              </button>
            ))}
          </div>
          <div className="search">
            <input type="search" placeholder="Поиск шрифта…" aria-label="Поиск шрифта" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && options.length) pickFromList(options[0].ix); }} />
          </div>
          <select aria-label="Шрифт" size={term && options.length > 1 ? Math.min(8, options.length) : undefined}
            value={font && options.includes(font) ? font.ix : ""} onChange={(e) => e.target.value !== "" && pickFromList(+e.target.value)}>
            {font && !options.includes(font) && <option value="" disabled>—</option>}
            {options.map((f) => <option key={f.ix} value={f.ix}>{f.name}</option>)}
          </select>
          <select aria-label="Начертание" disabled={faces.length < 2} value={Math.max(0, faces.indexOf(face))} onChange={(e) => setFace(faces[+e.target.value])}>
            {faces.map((x, i) => <option key={i} value={i}>{x.label}</option>)}
          </select>
          <div className="sbr">
            <input type="range" min="14" max="320" value={size} aria-label="Размер" onChange={(e) => setSize(+e.target.value)} />
            <output>{size} px</output>
          </div>
          <div className="ibr">
            <input type="color" value={color} className="ib" title="Цвет текста" aria-label="Цвет текста" onChange={(e) => setColor(e.target.value)} />
            <button className="ib" aria-pressed={upper} title="Все буквы заглавные" aria-label="Заглавные" onClick={() => setUpper(!upper)}>{upper ? "AA" : "Aa"}</button>
            <button className="ib" aria-pressed={cx} title="Центр по горизонтали" aria-label="Центр по горизонтали" onClick={() => { setCx(!cx); setAlignC(!cx); }}><IcCenterX /></button>
            <button className="ib" aria-pressed={cy} title="Центр по вертикали" aria-label="Центр по вертикали" onClick={() => setCy(!cy)}><IcCenterY /></button>
          </div>
          <div className="ibr">
            <label className="ib" title="Вставить картинку (или Ctrl+V, или перетащить файл)">
              <IcImage />
              <input type="file" accept="image/*" hidden onChange={(e) => { readImg(e.target.files[0]); e.target.value = ""; }} />
            </label>
            <button className="ib" title="Убрать картинку" aria-label="Убрать картинку" onClick={() => setImg(null)}><IcClose /></button>
            <label className="ib" title="Открыть свой файл шрифта">
              <IcFontFile />
              <input type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={(e) => { openOwn(e.target.files[0]); e.target.value = ""; }} />
            </label>
          </div>
          <div className="sbn">{note}</div>
        </div>

        <div className="main">
          <div hidden={tab !== "canvas"}>
            <div ref={stage} className={"stage" + (drop ? " drop" : "")}
              onDragOver={(e) => { e.preventDefault(); setDrop(true); }}
              onDragLeave={() => setDrop(false)}
              onDrop={(e) => { e.preventDefault(); setDrop(false); readImg(e.dataTransfer.files[0]); }}>
              <div ref={cv} className={"cv" + (img ? " hasimg" : "")}>
                {img && <img src={img} alt="" onLoad={() => { place(); focusStage(); }}
                  onError={() => { setImg(null); setNote("Не удалось открыть картинку."); }} />}
                <div className="tbw" ref={tbw}>
                  <span className="dh" onPointerDown={drag}>⠿ перетащить</span>
                  <div className="tb" ref={tb} contentEditable suppressContentEditableWarning spellCheck={false}
                    style={{ fontFamily: fam, fontWeight: face ? face.weight : 400, fontStyle: face ? face.style : "normal",
                      fontSize: size, color, textTransform: upper ? "uppercase" : "none", textAlign: alignC ? "center" : "left" }}
                    onInput={place}
                    onPaste={(e) => {
                      const t = e.clipboardData && e.clipboardData.getData("text");
                      if (t) { e.preventDefault(); document.execCommand("insertText", false, t); }
                    }} />
                </div>
                {!img && <div className="hint">Вставьте картинку (кнопка слева, Ctrl+V или перетащите файл) — она встанет по высоте экрана, а текст можно печатать поверх неё</div>}
                <div className="gdx" hidden={!guides[0]} />
                <div className="gdy" hidden={!guides[1]} />
              </div>
            </div>
          </div>
          {tab === "glyphs" && <Glyphs face={face} onInsert={insert} />}
          {tab === "langs" && <div className="lg"><Langs face={face} /></div>}
        </div>
      </div>
    </section>
  );
}
