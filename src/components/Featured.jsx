import { FONTS } from "../lib/catalog.js";

export default function Featured() {
  return (
    <div className="feat">
      <a className="f" href="#fonts">
        <span className="ic a">Aa</span>
        <span className="t">Шрифты<small>{FONTS.length}</small></span>
      </a>
      <a className="f fb" href="#guide">
        <span className="ic">
          <span className="bk">
            <span className="bk-r" />
            <span className="bk-c"><span className="bk-f" /><span className="bk-b" /></span>
          </span>
        </span>
        <span className="t">Руководство по вёрстке<small>статья</small></span>
      </a>
      <a className="f" href="https://boosty.to/namikus" target="_blank" rel="noopener">
        <span className="ic bo">
          <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
            <circle cx="23" cy="23" r="23" fill="#f15f2c" />
            <text x="23" y="31" textAnchor="middle" fontFamily="Manrope,sans-serif" fontWeight="700" fontSize="24" fill="#fff">Б</text>
          </svg>
        </span>
        <span className="t">Мой бусти</span>
      </a>
    </div>
  );
}
