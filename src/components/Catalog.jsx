import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { COLS, LEG, PANGRAMS, filterFonts } from "../lib/catalog.js";
import { sampleText } from "../lib/sampleText.js";
import { store } from "../lib/util.jsx";
import FontCard from "./FontCard.jsx";
import Lightbox from "./Lightbox.jsx";
import { Search } from "./Icons.jsx";

const SORTS = [["type", "По типам"], ["new", "Новые"], ["old", "Старые"], ["pop", "Популярные"]];
const EXAMPLES = "С примерами";

const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function loadLikes() {
  try { return JSON.parse(store("lk") || "{}"); } catch (e) { return {}; }
}

/* всплывающий список панграмм под редактируемым образцом */
function Pangrams({ anchor, onClose }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect(), el = ref.current;
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - 326)) + "px";
    el.style.top = Math.min(r.bottom + 8, innerHeight - el.offsetHeight - 8) + "px";
  });
  return (
    <div id="pg" ref={ref}>
      {PANGRAMS.map(([g, list]) => (
        <div key={g}>
          <h4>{g}</h4>
          {list.map((t) => (
            <button key={t} onMouseDown={(e) => e.preventDefault()} onClick={() => { sampleText.set(t); onClose(); }}>{t}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Catalog({ onSandbox }) {
  const [term, setTerm] = useState("");
  const [authors, setAuthors] = useState([]);
  const [tags, setTags] = useState([]);
  const [marks, setMarks] = useState([]);
  const [sort, setSort] = useState("type");
  const [lower, setLower] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [likes, setLikes] = useState(loadLikes);
  const [lb, setLb] = useState(null);
  const [editing, setEditing] = useState(null);
  const hideT = useRef(0);

  const gst = bold || italic ? (bold ? "700" : "400") + (italic ? "i" : "n") : null;
  const list = useMemo(() => filterFonts({ term, authors, tags, marks, sort }), [term, authors, tags, marks, sort]);
  const anySel = authors.length + tags.length + marks.length > 0;

  const onLike = useCallback((n) => setLikes((L) => {
    const x = { ...L };
    if (x[n]) delete x[n]; else x[n] = 1;
    store("lk", JSON.stringify(x));
    return x;
  }), []);
  const onAward = useCallback((name, i) => setLb({ name, i }), []);
  const closeLb = useCallback(() => setLb(null), []);
  const onEditing = useCallback((el) => {
    clearTimeout(hideT.current);
    if (el) setEditing(el);
    else hideT.current = setTimeout(() => setEditing(null), 150);
  }, []);

  useEffect(() => {
    const f = () => setEditing(null);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const reset = () => { setAuthors([]); setTags([]); setMarks([]); };

  return (
    <div className="cat">
      <div className="side">
        <div className="search">
          <input type="search" placeholder="Поиск по названию…" aria-label="Поиск" value={term} onChange={(e) => setTerm(e.target.value)} />
          <span><Search /></span>
        </div>
        <div className="stb">
          <button id="rst" className={anySel ? "on" : undefined} onClick={reset}>Сбросить выбор</button>
          <span className="stg">
            <button id="ex" aria-pressed={tags.includes(EXAMPLES)} title="Шрифты с примерами использования" onClick={() => setTags(toggle(tags, EXAMPLES))}>С примерами</button>
            <button title="Регистр у всех шрифтов" onClick={() => setLower(!lower)}>Регистр: {lower ? "Aa" : "AA"}</button>
            <button className="fs" aria-pressed={bold} title="Жирное у всех шрифтов, где оно есть" onClick={() => setBold(!bold)}><b>Ж</b></button>
            <button className="fs" aria-pressed={italic} title="Курсив у всех шрифтов, где он есть" onClick={() => setItalic(!italic)}><i>К</i></button>
          </span>
        </div>
        <div className="fcols">
          {COLS.map((col, ci) => (
            <div key={ci}>
              {col.map(([title, opts, kind]) => {
                const sel = kind === "a" ? authors : tags, set = kind === "a" ? setAuthors : setTags;
                return [
                  <div className="gh" key={title}>{title}</div>,
                  ...opts.map((v) => (
                    <button key={title + v} className="opt" aria-pressed={sel.includes(v)} onClick={() => set(toggle(sel, v))}>{v}</button>
                  )),
                ];
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="main">
        <div className="lrow">
          <div className="legend">
            {LEG.map(([k, label]) => (
              <button key={k} className="opt in" aria-pressed={marks.includes(k)} onClick={() => setMarks(toggle(marks, k))}>{label}</button>
            ))}
          </div>
          <span className="tg">
            <span className="gh">Порядок</span>
            {SORTS.map(([k, label]) => (
              <button key={k} className="tgb" aria-pressed={sort === k} onClick={() => setSort(k)}>{label}</button>
            ))}
          </span>
        </div>
        <div className={"grid" + (lower ? " lc" : "")}>
          {list.length ? list.map((f) => (
            <FontCard key={f.ix} f={f} gst={gst} liked={!!likes[f.name]}
              onLike={onLike} onAward={onAward} onSandbox={onSandbox} onEditing={onEditing} />
          )) : <div className="empty">Ничего не найдено</div>}
        </div>
      </div>

      {editing && <Pangrams anchor={editing} onClose={() => setEditing(null)} />}
      {lb && <Lightbox name={lb.name} start={lb.i} onClose={closeLb} />}
    </div>
  );
}
