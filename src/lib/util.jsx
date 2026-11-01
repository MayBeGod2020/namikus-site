export function copyText(t) {
  const fallback = () => {
    const x = document.createElement("textarea");
    x.value = t;
    x.style.cssText = "position:fixed;left:-999px;top:0";
    document.body.appendChild(x);
    x.select();
    try { document.execCommand("copy"); } catch (e) {}
    x.remove();
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(fallback);
  } catch (e) {}
  fallback();
  return Promise.resolve();
}

export function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) {}
  return null;
}

export const reducedMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches);

/* ссылка внутри сайта: #fonts, #sandbox/Имя, #guide/раздел */
export const go = (hash) => { location.hash = hash; };

/* разметка статей: [текст](ссылка), **жирный**, *курсив* — в React-элементы, без innerHTML */
export function inline(s, keyBase = "") {
  const out = [];
  const re = /\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const key = keyBase + k++;
    if (m[1] != null) out.push(<a key={key} href={m[2]} target="_blank" rel="noopener">{m[1]}</a>);
    else if (m[3] != null) out.push(<b key={key}>{m[3]}</b>);
    else out.push(<i key={key}>{m[4]}</i>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
