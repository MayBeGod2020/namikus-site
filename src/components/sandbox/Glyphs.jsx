import { useEffect, useMemo, useState } from "react";
import { BLOCKS, charOf, codepoints, hex, isSpace } from "../../lib/fontParse.js";
import { copyText } from "../../lib/util.jsx";
import { useFaceInfo, NoInfo, SubsetNote } from "./useFaceInfo.jsx";

const CHUNK = 480;

function Cells({ list, sel, onSel }) {
  const [n, setN] = useState(Math.min(CHUNK, list.length));
  return (
    <>
      <div className="gg">
        {list.slice(0, n).map((c) => {
          const sp = isSpace(c);
          return (
            <button key={c} className={"gc" + (sp ? " sp" : "") + (sel === c ? " on" : "")} title={hex(c)} onClick={() => onSel(c)}>
              {sp ? "пробел" : charOf(c)}
            </button>
          );
        })}
      </div>
      {n < list.length && <button className="gmore" onClick={() => setN(n + CHUNK)}>Показать ещё ({list.length - n})</button>}
    </>
  );
}

function Block({ name, list, open: open0, sel, onSel }) {
  const [open, setOpen] = useState(open0);
  return (
    <details className="gb" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{name}<span>{list.length}</span></summary>
      {open && <Cells list={list} sel={sel} onSel={onSel} />}
    </details>
  );
}

export default function Glyphs({ face, onInsert }) {
  const info = useFaceInfo(face);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { setSel(null); setMsg(""); }, [face]);

  /* знаки по блокам Юникода */
  const { cps, groups } = useMemo(() => {
    if (!info) return { cps: [], groups: [] };
    const cps = codepoints(info), B = {}, other = [];
    cps.forEach((c) => {
      const i = BLOCKS.findIndex((b) => c >= b[0] && c <= b[1]);
      if (i > -1) (B[i] = B[i] || []).push(c); else other.push(c);
    });
    const groups = Object.keys(B).map(Number).sort((a, b) => a - b).map((k) => [BLOCKS[k][2], B[k]]);
    if (other.length) groups.push(["Прочее", other]);
    return { cps, groups };
  }, [info]);

  if (!face) return <div className="empty">Для этого шрифта нет файла.</div>;
  if (info === undefined) return <div className="empty">Читаю шрифт…</div>;
  if (!info) return <NoInfo />;

  const sp = sel != null && isSpace(sel);
  return (
    <>
      <div className="gi">Знаков: {cps.length}{info.glyphs ? " · глифов в файле: " + info.glyphs : ""} · {face.label}</div>
      <SubsetNote face={face} />
      <div className="gp">
        {sel == null ? <div className="big sp">Нажмите на знак</div> : (
          <>
            <div className={"big" + (sp ? " sp" : "")}>{sp ? "пробел" : charOf(sel)}</div>
            <div className="meta">
              {hex(sel)} · &amp;#{sel};<br />
              <button onClick={() => { onInsert(String.fromCodePoint(sel)); setMsg("Добавлено в текст на холсте"); }}>Добавить в текст</button>
              <button onClick={() => copyText(String.fromCodePoint(sel)).then(() => setMsg("Скопировано"), () => setMsg("Не удалось скопировать"))}>Копировать</button>
              <span>{msg}</span>
            </div>
          </>
        )}
      </div>
      <div>
        {cps.length ? groups.map(([name, list], i) => (
          <Block key={face.family + face.s + name} name={name} list={list} open={i === 0} sel={sel} onSel={(c) => { setSel(c); setMsg(""); }} />
        )) : <div className="empty">В файле нет знаков с кодами Unicode.</div>}
      </div>
    </>
  );
}
