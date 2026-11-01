import data from "../data/articles.json";
import { asset } from "../lib/fontLoader.js";

export const ARTICLES = data.articles;
export const IMG_SIZES = data.sizes || {};
const AUTH = data.authors || {};

export const authorsOf = (by) => String(by || "").replace(/^Авторы?:\s*/, "").split(/\s*,\s*/).filter(Boolean);

export function Avatar({ name, small }) {
  const cls = "av" + (small ? " s" : "");
  if (AUTH[name]) return <img className={cls} src={asset(AUTH[name])} alt="" />;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return <span className={cls} style={{ background: `hsl(${h},42%,46%)` }}>{(name.trim().charAt(0) || "?").toUpperCase()}</span>;
}

const LIST = Object.entries(ARTICLES).map(([key, a]) => ({ key, title: a.t, authors: authorsOf(a.by) }));
const ALL_AUTHORS = [...new Set(LIST.flatMap((a) => a.authors))];

export default function Articles({ author, setAuthor }) {
  return (
    <>
      <h1 className="pg">Статьи</h1>
      {ALL_AUTHORS.length > 0 && (
        <div className="afl">
          <span className="gh">Автор</span>
          {["", ...ALL_AUTHORS].map((n) => (
            <button key={n} type="button" className="afb" aria-pressed={(n || null) === author}
              onClick={() => setAuthor(n && author !== n ? n : null)}>
              {n && <Avatar name={n} small />}{n || "Все"}
            </button>
          ))}
        </div>
      )}
      <div className="al">
        {LIST.filter((a) => !author || a.authors.includes(author)).map((a) => (
          <div className="ar" key={a.key}>
            <a href={"#" + a.key}>{a.title}</a>
            <small>
              {a.authors.map((n) => <span className="au" key={n}><Avatar name={n} small />{n}</span>)}
            </small>
          </div>
        ))}
      </div>
    </>
  );
}
