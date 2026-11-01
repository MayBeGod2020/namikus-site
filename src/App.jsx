import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Featured from "./components/Featured.jsx";
import Catalog from "./components/Catalog.jsx";
import Articles, { ARTICLES } from "./components/Articles.jsx";
import UpButton from "./components/UpButton.jsx";
import { go, store } from "./lib/util.jsx";

// статьи и песочница грузятся отдельными кусками — главная открывается быстрее
const Article = lazy(() => import("./components/Article.jsx"));
const Sandbox = lazy(() => import("./components/sandbox/Sandbox.jsx"));

/* #fonts, #articles, #tools, #sandbox/Имя, #guide, #guide/раздел */
function parseHash() {
  let v = location.hash.slice(1), sec = null;
  const sl = v.indexOf("/");
  if (sl > -1) { sec = v.slice(sl + 1); v = v.slice(0, sl); }
  if (ARTICLES[v]) return { page: "article", id: v, sec };
  const page = ["fonts", "articles", "tools", "sandbox"].includes(v) ? v : "fonts";
  let name = null;
  if (page === "sandbox" && sec) { try { name = decodeURIComponent(sec); } catch (e) {} }
  return { page, name };
}

function initialTheme() {
  const t = store("th");
  if (t && t !== "cute") return t;
  return window.matchMedia && matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
}

function Tools() {
  return (
    <>
      <h1 className="pg">Инструменты</h1>
      <div className="al">
        <div className="ar">
          <a href="#sandbox">Песочница шрифтов</a>
          <small>Примерьте любой шрифт на своей картинке, посмотрите все его глифы и узнайте, какие языки он поддерживает</small>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [theme, setThemeState] = useState(initialTheme);
  const [author, setAuthor] = useState(null);
  const [sbOpened, setSbOpened] = useState(route.page === "sandbox");
  const sbHint = useRef(null);

  useEffect(() => {
    const f = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  useEffect(() => { if (route.page === "sandbox") setSbOpened(true); }, [route.page]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const setTheme = (t) => { setThemeState(t); store("th", t); };
  const openSandbox = useCallback((name, hint) => { sbHint.current = hint || {}; go("sandbox/" + encodeURIComponent(name)); }, []);
  const goAuthor = (n) => { setAuthor(n); go("articles"); };

  const { page } = route;
  return (
    <>
      <div className="page">
        <Header page={page} theme={theme} setTheme={setTheme} />
        {page !== "sandbox" && <Featured />}

        {/* каталог не размонтируется: фильтры и выбранные начертания сохраняются при переходах */}
        <section hidden={page !== "fonts"}><Catalog onSandbox={openSandbox} /></section>
        {page === "articles" && <section><Articles author={author} setAuthor={setAuthor} /></section>}
        {page === "tools" && <section><Tools /></section>}
        <Suspense fallback={<div className="empty">Загрузка…</div>}>
          {page === "article" && <section><Article key={route.id} id={route.id} sec={route.sec} onAuthor={goAuthor} /></section>}
          {sbOpened && <Sandbox active={page === "sandbox"} name={route.name} hint={sbHint} />}
        </Suspense>
      </div>
      <UpButton />
    </>
  );
}
