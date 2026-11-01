import { useEffect, useMemo, useState } from "react";
import { ARTICLES, IMG_SIZES, Avatar, authorsOf } from "./Articles.jsx";
import { asset } from "../lib/fontLoader.js";
import { copyText, inline } from "../lib/util.jsx";
import { Check, LinkIcon } from "./Icons.jsx";

const slugOf = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "razdel";

/* разбор статьи: заголовки получают id и «слаги» для ссылок, из них же строится оглавление */
function buildModel(a) {
  const heads = [], groups = [], used = {};
  let n = 0, cur = null;
  const last = {};
  a.blocks.forEach((b) => {
    if (!/^h[1-6]$/.test(b[0])) return;
    const d = Math.max(0, +b[0][1] - 2), id = "s" + n++;
    let sg = slugOf(b[1]);
    if (used[sg]) sg += "-" + ++used[sg]; else used[sg] = 1;
    const h = { id, d, text: b[1], slug: sg, parent: d === 0 ? null : last[d - 1] || null, group: null };
    last[d] = id;
    if (d === 0 || !cur) { cur = { head: h, subs: [] }; groups.push(cur); }
    else { cur.subs.push(h); h.group = cur.head.id; }
    heads.push(h);
  });
  return { heads, groups, byId: Object.fromEntries(heads.map((h) => [h.id, h])) };
}

function Img({ b, onZoom }) {
  if (!b[2]) return <div className="fig">Иллюстрация: {b[1] || ""}</div>;
  const sz = IMG_SIZES[b[2]];
  return (
    <figure className="pic">
      <img src={asset(b[2])} alt={b[1] || ""} loading="lazy" decoding="async" width={sz && sz[0]} height={sz && sz[1]} onClick={() => onZoom(asset(b[2]))} />
      {b[1] && <figcaption>{b[1]}</figcaption>}
    </figure>
  );
}

function Block({ b, k, heads, onZoom }) {
  const t = b[0];
  if (t === "ph") return <p className="ph">Текст раздела пока не добавлен.</p>;
  if (t === "p") return <p>{inline(b[1], k)}</p>;
  if (t === "ol" || t === "ul") {
    const L = t;
    return <L>{b[1].map((x, i) => <li key={i}>{inline(x, k + "-" + i)}</li>)}</L>;
  }
  if (t === "img") return <Img b={b} onZoom={onZoom} />;
  if (t === "cols") {
    return (
      <div className="cols" style={{ gridTemplateColumns: `repeat(${b[1].length},minmax(0,1fr))` }}>
        {b[1].map((col, i) => (
          <div key={i}>{col.map((x, j) => <Block key={j} b={x} k={k + "c" + i + j} onZoom={onZoom} />)}</div>
        ))}
      </div>
    );
  }
  if (/^h[1-6]$/.test(t)) {
    const H = t, h = heads && heads.shift();
    return <H id={h ? h.id : undefined}>{b[1]}</H>;
  }
  return null;
}

function CopyLink({ url }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={"cp" + (ok ? " ok" : "")} title={ok ? "Ссылка скопирована" : "Скопировать ссылку на этот раздел"}
      aria-label="Скопировать ссылку на этот раздел"
      onClick={(e) => { e.stopPropagation(); copyText(url).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }); }}>
      {ok ? <Check /> : <LinkIcon />}
    </button>
  );
}

export default function Article({ id, sec, onAuthor }) {
  const a = ARTICLES[id];
  const model = useMemo(() => buildModel(a), [a]);
  const [shut, setShut] = useState(() => new Set());
  const [active, setActive] = useState(null);
  const [zoom, setZoom] = useState(null);
  const as = authorsOf(a.by);
  const pageUrl = location.href.split("#")[0];

  /* какой раздел сейчас на экране */
  useEffect(() => {
    const mark = () => {
      let cur = model.heads[0] && model.heads[0].id;
      for (const h of model.heads) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= 120) cur = h.id; else break;
      }
      setActive(cur);
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    return () => window.removeEventListener("scroll", mark);
  }, [model]);

  /* переход по ссылке на раздел: #guide/razdel */
  useEffect(() => {
    if (!sec) return;
    let s = sec;
    try { s = decodeURIComponent(sec); } catch (e) {}
    const h = model.heads.find((x) => x.slug === s) || model.heads.find((x) => x.slug === slugOf(s));
    if (!h) return;
    if (h.group) setShut((S) => { const x = new Set(S); x.delete(h.group); return x; });
    const go = () => { const el = document.getElementById(h.id); if (el) el.scrollIntoView({ block: "start" }); };
    requestAnimationFrame(go);
    const t = setTimeout(go, 250);
    return () => clearTimeout(t);
  }, [sec, model]);

  useEffect(() => {
    if (!zoom) return;
    const k = (e) => e.key === "Escape" && setZoom(null);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [zoom]);

  /* подсветка в оглавлении: текущий пункт (или его свёрнутая группа) и его родители */
  const lit = useMemo(() => {
    const act = new Set(), anc = new Set();
    let bar = active;
    const h = model.byId[active];
    if (h && h.group && shut.has(h.group)) bar = h.group;
    if (bar) {
      act.add(bar);
      for (let x = model.byId[bar].parent; x; x = model.byId[x].parent) anc.add(x);
    }
    return { act, anc };
  }, [active, shut, model]);

  const withSubs = model.groups.filter((g) => g.subs.length);
  const anyOpen = withSubs.some((g) => !shut.has(g.head.id));
  const toggleAll = () => setShut(anyOpen ? new Set(withSubs.map((g) => g.head.id)) : new Set());
  const toggle = (gid) => setShut((S) => { const x = new Set(S); x.has(gid) ? x.delete(gid) : x.add(gid); return x; });

  const row = (h) => (
    <div className="gr">
      <button className={`tl d${h.d}` + (lit.act.has(h.id) ? " act" : "") + (lit.anc.has(h.id) ? " anc" : "")}
        onClick={() => document.getElementById(h.id).scrollIntoView({ behavior: "smooth", block: "start" })}>
        {h.text}
      </button>
      <CopyLink url={pageUrl + "#" + id + "/" + encodeURIComponent(h.slug)} />
      {h.d === 0 && model.groups.find((g) => g.head === h)?.subs.length > 0 && (
        <button className={"car" + (shut.has(h.id) ? " shut" : "")} aria-label="Свернуть или развернуть раздел" onClick={() => toggle(h.id)}>▾</button>
      )}
    </div>
  );

  const heads = [...model.heads];
  return (
    <>
      <a className="back" href="#articles">← Статьи</a>
      <div className="guide">
        <nav className="toc" aria-label="Содержание">
          <div className="tch">
            <span className="gh">Содержание</span>
            {withSubs.length > 0 && <button onClick={toggleAll}>{anyOpen ? "Свернуть" : "Развернуть"}</button>}
          </div>
          <ul>
            {model.groups.map((g) => (
              <li key={g.head.id}>
                {row(g.head)}
                {g.subs.length > 0 && (
                  <ul className="sub" hidden={shut.has(g.head.id)}>
                    {g.subs.map((h) => <li key={h.id}>{row(h)}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <article className="art">
          <h1>{a.t}</h1>
          <p className="by">
            {as.length > 0 && (as.length > 1 ? "Авторы:" : "Автор:")}
            {as.map((n) => (
              <button key={n} type="button" className="au" title="Статьи автора" onClick={() => onAuthor(n)}>
                <Avatar name={n} />{n}
              </button>
            ))}
          </p>
          <div>
            {a.blocks.map((b, i) => <Block key={i} b={b} k={"b" + i} heads={heads} onZoom={setZoom} />)}
          </div>
        </article>
      </div>
      {zoom && <div id="zoom" onClick={() => setZoom(null)}><img src={zoom} alt="" /></div>}
    </>
  );
}
