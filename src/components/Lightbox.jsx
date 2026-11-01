import { useEffect, useRef, useState } from "react";
import { AWARDS } from "../lib/catalog.js";
import { asset } from "../lib/fontLoader.js";

const Z = 2.5;

/* просмотр примеров использования шрифта, с лупой */
export default function Lightbox({ name, start, onClose }) {
  const L = AWARDS[name];
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const img = useRef(null), lens = useRef(null);
  const step = (d) => setI((x) => (x + d + L.length) % L.length);

  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && L.length > 1) step(-1);
      if (e.key === "ArrowRight" && L.length > 1) step(1);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [L, onClose]);

  const hideLens = () => { if (lens.current) lens.current.style.display = "none"; };
  useEffect(hideLens, [i, zoom]);

  const move = (e) => {
    if (!zoom) return;
    const im = img.current, r = im.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, l = lens.current.style;
    if (x < 0 || y < 0 || x > r.width || y > r.height) { l.display = "none"; return; }
    l.display = "block";
    l.left = x - 85 + "px";
    l.top = y - 85 + "px";
    l.backgroundImage = `url("${im.src}")`;
    l.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    l.backgroundPosition = `${85 - x * Z}px ${85 - y * Z}px`;
  };

  const a = L[i];
  return (
    <div id="lb" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lbb lbx" aria-label="Закрыть" onClick={onClose}>×</button>
      {L.length > 1 && <button className="lbb" aria-label="Назад" onClick={() => step(-1)}>‹</button>}
      <div className="lbs">
        <div className={"zw" + (zoom ? " zoom" : "")} onPointerMove={move} onPointerLeave={hideLens}>
          <img ref={img} src={asset(a[3])} alt="" onClick={() => setZoom(!zoom)} />
          <div className="lens" ref={lens} />
        </div>
        <div className="lbc">
          {a[1] && <a href={a[2] || "#"} target="_blank" rel="noopener">{a[1]}</a>}
          <span>Пример использования · {name} · {i + 1} / {L.length}</span>
        </div>
        <button className="lbb lbz" onClick={() => setZoom(!zoom)}>{zoom ? "Лупа включена" : "Лупа"}</button>
      </div>
      {L.length > 1 && <button className="lbb" aria-label="Вперёд" onClick={() => step(1)}>›</button>}
    </div>
  );
}
