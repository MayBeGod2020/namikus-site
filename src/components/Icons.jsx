const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <rect x="4.5" y="1.5" width="8" height="9" rx="1" />
    <path d="M9.5 12.5h-7a1 1 0 0 1-1-1v-8" />
  </svg>
);

export const Heart = () => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <path d="M7 12.2S1.5 8.6 1.5 5a3 3 0 0 1 5.5-1.6A3 3 0 0 1 12.5 5c0 3.6-5.5 7.2-5.5 7.2z" />
  </svg>
);

export const Search = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
);

export const LinkIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...line}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </svg>
);

export const Check = () => (
  <svg viewBox="0 0 24 24" strokeWidth="2.4" {...line}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" {...line}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

/* иконки панели песочницы, 15×15 */
const I = ({ children }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" strokeWidth="1.3" {...line}>{children}</svg>
);
export const IcCanvas = () => <I><rect x="2" y="3" width="12" height="10" rx="1" /><path d="M4 11l3-3 2 2 2-3 3 4" /></I>;
export const IcGlyphs = () => <I><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></I>;
export const IcLangs = () => <I><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c-2.5 2.2-2.5 9.8 0 12M8 2c2.5 2.2 2.5 9.8 0 12" /></I>;
export const IcCenterX = () => <I><path d="M8 1.5v13" strokeDasharray="1.6 1.6" /><path d="M4 5h8M5.5 8h5M3 11h10" /></I>;
export const IcCenterY = () => <I><path d="M1.5 8h13" strokeDasharray="1.6 1.6" /><path d="M5 4v8M8 2.5v11M11 4v8" /></I>;
export const IcImage = () => <I><rect x="2" y="3" width="12" height="10" rx="1" /><circle cx="6" cy="7" r="1" /><path d="M3 12l3.5-3 2.5 2 2-2 2 2" /></I>;
export const IcClose = () => <I><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></I>;
export const IcFontFile = () => <I><path d="M4 1.5h5l3 3v10H4z" /><path d="M9 1.5v3h3" /><path d="M6 12l1.5-4 1.5 4M6.6 10.7h1.8" /></I>;

/* звёздочка-логотип */
function star(R, r, cx, cy) {
  let s = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r : R;
    s += (i ? "L" : "M") + (cx + d * Math.cos(a)).toFixed(1) + " " + (cy + d * Math.sin(a)).toFixed(1);
  }
  return s + "Z";
}
export const Logo = () => (
  <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
    <path d={star(22, 9, 23, 23.5)} fill="none" stroke="#e0334c" strokeWidth="1.4" strokeLinejoin="round" />
    <path d={star(7, 3, 23, 24.5)} fill="#e0334c" />
  </svg>
);
