import { useEffect, useState } from "react";

/* сведения о знаках начертания: undefined — читаем, null — не удалось, объект — готово */
export function useFaceInfo(face) {
  const [info, setInfo] = useState(undefined);
  useEffect(() => {
    if (!face) return;
    let live = true;
    setInfo(undefined);
    face.info().then((x) => live && setInfo(x || null), () => live && setInfo(null));
    return () => { live = false; };
  }, [face]);
  return info;
}

export const NoInfo = () => (
  <div className="empty">
    Не удалось прочитать файл этого шрифта. Откройте файл шрифта слева (кнопка «Открыть файл шрифта…»), и здесь появятся глифы и языки.
  </div>
);

export const SubsetNote = ({ face }) =>
  face && face.src === "pf" ? (
    <div className="gi">Это облегчённая копия шрифта (кириллица и латиница): знаков других письменностей в ней может не быть.</div>
  ) : null;
