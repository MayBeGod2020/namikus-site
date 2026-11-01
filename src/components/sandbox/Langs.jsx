import { useState } from "react";
import { checkLangs } from "../../lib/fontParse.js";
import { useFaceInfo, NoInfo, SubsetNote } from "./useFaceInfo.jsx";

export default function Langs({ face }) {
  const info = useFaceInfo(face);
  const [only, setOnly] = useState(false);

  if (!face) return <div className="empty">Для этого шрифта нет файла.</div>;
  if (info === undefined) return <div className="empty">Читаю шрифт…</div>;
  if (!info) return <NoInfo />;

  const R = checkLangs(info.set);
  const full = R.filter((r) => r.ok && r.g !== "Знаки и символы" && r.g !== "Другие письменности").map((r) => r.n);
  let g = "";
  const rows = [];
  R.forEach((r) => {
    if (only && !r.ok) return;
    if (r.g !== g) { g = r.g; rows.push(<div key={"g" + g} className="gh lgh">{g}</div>); }
    const st = r.cjk ? (r.have ? r.have + " знаков" : "нет")
      : r.ok ? "полностью"
      : r.g === "Другие письменности" ? (r.have ? r.have + " из " + r.tot : "нет")
      : r.miss.length === r.tot ? "нет" : r.tot - r.miss.length + " из " + r.tot;
    rows.push(
      <div key={r.n} className={"lr " + (r.ok ? "ok" : st === "нет" ? "no" : "")}>
        <span>{r.n}</span>
        <span className="ls">{st}</span>
        {!r.ok && r.miss.length > 0 && r.miss.length < r.tot && (
          <span className="lm">
            Нет знаков: {r.miss.slice(0, 40).map((c, i) => <span key={i}>{c}</span>)}
            {r.miss.length > 40 ? " и ещё " + (r.miss.length - 40) : ""}
          </span>
        )}
      </div>
    );
  });

  return (
    <>
      <p className="lsum">
        {full.length ? <>Поддерживает полностью: <b>{full.join(", ")}</b>.</> : "Ни один из проверяемых языков не поддерживается полностью."}
      </p>
      <SubsetNote face={face} />
      <div className="tg" style={{ margin: "8px 0 0" }}>
        <button className="tgb" aria-pressed={only} onClick={() => setOnly(!only)}>Только поддерживаемые</button>
      </div>
      {rows}
    </>
  );
}
