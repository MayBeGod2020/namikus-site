import { useEffect, useState } from "react";
import { ArrowUp } from "./Icons.jsx";
import { reducedMotion } from "../lib/util.jsx";

export default function UpButton() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(window.scrollY > 500);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <button id="up" className={on ? "on" : undefined} aria-label="Наверх" title="Наверх"
      onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" })}>
      <ArrowUp />
    </button>
  );
}
