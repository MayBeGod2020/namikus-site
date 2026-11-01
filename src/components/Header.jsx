import { useRef, useState } from "react";
import { Logo } from "./Icons.jsx";
import { reducedMotion } from "../lib/util.jsx";

const NAV = [
  ["fonts", "Главная", ["fonts"]],
  ["tools", "Инструменты", ["tools", "sandbox"]],
  ["articles", "Статьи", ["articles", "article"]],
];
const THEMES = [["light", "Белая"], ["dark", "Чёрная"], ["read", "Чтение"]];
const FX_COLORS = ["#e8533a", "#f7c600", "#2f6fd6", "#2a9d6f", "#e0334c"];

function fx(txt, x, y, css, cls) {
  const e = document.createElement("div");
  e.className = "fx" + (cls ? " " + cls : "");
  e.textContent = txt;
  e.style.cssText = `left:${x}px;top:${y}px;` + (css || "");
  document.body.appendChild(e);
  return e;
}
function fly(e, dx, dy, rot, ms, s0, s1) {
  e.animate(
    [
      { transform: `translate(-50%,-50%) scale(${s0})`, opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${s1}) rotate(${rot}deg)`, opacity: 0 },
    ],
    { duration: ms, easing: "cubic-bezier(.2,.7,.3,1)" }
  ).onfinish = () => e.remove();
}

/* пять анимаций по очереди при клике на «Сайт Намикуса» */
function useBrandFx() {
  const brand = useRef(null), logo = useRef(null), title = useRef(null), n = useRef(-1);
  const play = () => {
    if (reducedMotion()) return;
    const an = (n.current = (n.current + 1) % 5);
    const br = brand.current, r = br.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (an === 0) {
      title.current.querySelectorAll(".ch").forEach((c, k) =>
        c.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12px) rotate(-8deg)" }, { transform: "translateY(0)" }], { duration: 520, delay: k * 45, easing: "ease-out" })
      );
    } else if (an === 1) {
      logo.current.animate([{ transform: "rotate(0) scale(1)" }, { transform: "rotate(200deg) scale(1.35)" }, { transform: "rotate(360deg) scale(1)" }], { duration: 750, easing: "cubic-bezier(.3,1.4,.5,1)" });
    } else if (an === 2) {
      const W = ["БАХ!", "ПАФ!", "ДЗЫНЬ!", "БАМ!", "ХРУМ!", "ТЫЩ!"];
      for (let i = 0; i < 6; i++) {
        const ang = ((i * 60 + Math.random() * 30) * Math.PI) / 180, d = 90 + Math.random() * 60;
        const e = fx(W[i], cx, cy, `font-family:Underdog,sans-serif;font-size:${18 + Math.random() * 10}px;color:${FX_COLORS[i % 5]}`);
        fly(e, Math.cos(ang) * d, Math.sin(ang) * d, Math.random() * 40 - 20, 900, 0.3, 1.2);
      }
    } else if (an === 3) {
      const P = ["Привет!", "Бьём чуждый цен хвощ!", "Хвощ!", "Ну что, шрифты?"];
      const b = fx(P[Math.floor(Math.random() * P.length)], r.right + 8, r.bottom - 4, "", "bal");
      b.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.12)", opacity: 1, offset: 0.5 }, { transform: "scale(1)", opacity: 1 }], { duration: 380, easing: "ease-out" });
      setTimeout(() => { b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => b.remove(); }, 1300);
    } else {
      br.animate([{ transform: "rotate(0)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(3deg)" }, { transform: "rotate(-2deg)" }, { transform: "rotate(0)" }], { duration: 420 });
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
        const c = fx("", cx, cy, `width:8px;height:8px;border-radius:${Math.random() > 0.5 ? "50%" : "1px"};background:${FX_COLORS[i % 5]}`);
        fly(c, Math.cos(a) * d, Math.sin(a) * d + 40, Math.random() * 360, 900 + Math.random() * 400, 1, 0.8);
      }
    }
  };
  return { brand, logo, title, play };
}

const letters = (w) => w.split("").map((c, i) => <span className="ch" key={i}>{c}</span>);

export default function Header({ page, theme, setTheme }) {
  const { brand, logo, title, play } = useBrandFx();
  const [lang, setLang] = useState("ru");
  return (
    <header className="top">
      <a className="brand" ref={brand} href="#fonts" onClick={play}>
        <span className="logo" ref={logo}><Logo /></span>
        <span ref={title}>{letters("Сайт")}<br />{letters("Намикуса")}</span>
      </a>
      <nav className="links">
        {NAV.map(([href, label, pages]) => (
          <a key={href} href={"#" + href} className={pages.includes(page) ? "cur" : undefined}>{label}</a>
        ))}
      </nav>
      <div className="tools">
        <span>
          {THEMES.map(([t, label], i) => (
            <span key={t}>{i > 0 && "/"}<button className={theme === t ? "on" : undefined} onClick={() => setTheme(t)}>{label}</button></span>
          ))}
        </span>
        <span>
          <button className={lang === "ru" ? "on" : undefined} onClick={() => setLang("ru")}>Ру</button>/
          <button className={lang === "en" ? "on" : undefined} onClick={() => setLang("en")}>Англ</button>
        </span>
      </div>
    </header>
  );
}
