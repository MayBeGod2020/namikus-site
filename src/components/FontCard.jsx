import { memo, useEffect, useRef, useState } from "react";
import { AWARDS, LBL, cssOf, curSt, faceList, familyOf, styles } from "../lib/catalog.js";
import { asset, loadFace, whenVisible } from "../lib/fontLoader.js";
import { sampleText } from "../lib/sampleText.js";
import { DEF } from "../lib/catalog.js";
import { copyText } from "../lib/util.jsx";
import { CopyIcon, Heart } from "./Icons.jsx";

const thumb = (file) => (file.startsWith("awards/") ? asset("awards/thumb/" + file.slice(7)) : asset(file));

function badgeOf(f) {
  if (f.kind === "ext" && !f.meta.pf) return "превью временное";
  if (f.marks.includes("n")) return "Новинка!";
  if (f.marks.includes("r")) return "Доработано";
  return "";
}

/* редактируемый образец: текст общий для всех карточек */
function Sample({ fam, s, size, onEditing }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => whenVisible(ref.current, () => setVisible(true)), []);
  useEffect(() => {
    if (!visible) return;
    let live = true;
    setReady(false);
    loadFace(fam, s).then(() => live && setReady(true));
    return () => { live = false; };
  }, [visible, fam, s]);

  useEffect(() => {
    ref.current.textContent = sampleText.get();
    return sampleText.subscribe((t, src) => {
      if (src !== ref.current && ref.current.textContent !== t) ref.current.textContent = t;
    });
  }, []);

  const { weight, style } = cssOf(s);
  return (
    <div
      ref={ref}
      className={"sample" + (ready ? "" : " wait")}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      style={{ fontFamily: `'${fam}',sans-serif`, fontSize: Math.round(size * 1.2), fontWeight: weight, fontStyle: style }}
      onInput={(e) => { sampleText.set(e.currentTarget.textContent, e.currentTarget); onEditing(e.currentTarget); }}
      onBlur={(e) => { onEditing(null); if (!e.currentTarget.textContent.trim()) sampleText.set(DEF); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === "Escape") onEditing(null);
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/\s+/g, " "));
      }}
    />
  );
}

function FontCard({ f, gst, liked, onLike, onAward, onSandbox, onEditing }) {
  const [pick, setPick] = useState(null); // выбранное в карточке начертание {fam, s, i}
  const [copied, setCopied] = useState(false);
  useEffect(() => setPick(null), [gst]);

  const faces = faceList(f), sts = styles(f), base = curSt(f, gst);
  const fam = pick ? pick.fam : familyOf(f);
  const s = pick ? pick.s : base;
  const aw = AWARDS[f.name];
  const badge = badgeOf(f);

  let facesOn = -1;
  if (faces) {
    if (pick) facesOn = pick.i;
    else faces.forEach((x, i) => { if (facesOn < 0 && i < sts.length && x.s === base) facesOn = i; });
  }

  const copy = () => {
    copyText(f.meta.cp || f.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  const { weight, style } = cssOf(s);

  return (
    <div className="card">
      <div className="hd">
        <button className="nm" title="Скопировать название" onClick={copy}>
          {f.name}<span className="ci">{copied ? "✓" : <CopyIcon />}</span>
        </button>
        {badge && <span className="badge">{badge}</span>}
        {aw && (
          <span className="aw">
            {aw.map((a, i) => (
              <button key={i} className="awb" title="Пример использования" aria-label="Пример использования" onClick={() => onAward(f.name, i)}>
                <img className="awt" src={thumb(a[3])} alt="" loading="lazy" width="22" height="22" />
              </button>
            ))}
          </span>
        )}
        <button className={"lk" + (liked ? " on" : "")} title="Любимый шрифт" aria-label="Любимый шрифт" onClick={() => onLike(f.name)}>
          <Heart />
        </button>
      </div>

      <Sample fam={fam} s={s} size={f.size} onEditing={onEditing} />

      <div className="ctl">
        {f.meta.lic ? <span>{f.meta.lic}</span> : f.marks.includes("f") ? <span>Бесплатно для коммерции</span> : null}
        {f.kind === "own" ? <button>Скачать</button>
          : f.meta.u ? <a href={/^https?:/.test(f.meta.u) ? f.meta.u : asset(f.meta.u)} target="_blank" rel="noopener">Скачать</a> : null}
        <button title="Примерить шрифт, посмотреть глифы и языки" onClick={() => onSandbox(f.name, { w: weight, i: style === "italic", fam })}>Песочница</button>
        {faces ? (
          <span className="sty">
            {faces.map((x, i) => (
              <button key={i} aria-pressed={i === facesOn} onClick={() => setPick({ fam: x.fam, s: x.s, i })}>{x.l}</button>
            ))}
          </span>
        ) : sts.length > 1 ? (
          <span className="sty">
            {sts.map((v) => (
              <button key={v} aria-pressed={v === s} onClick={() => setPick({ fam: familyOf(f), s: v, i: -1 })}>{LBL[v] || v}</button>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default memo(FontCard);
