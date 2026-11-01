import { DEF } from "./catalog.js";

/*
  Общий текст образца для всех карточек. Хранится вне React-состояния:
  при наборе текста обновляются только DOM-узлы образцов, а не 350 компонентов разом.
*/
let text = DEF;
const subs = new Set();

export const sampleText = {
  get: () => text,
  set(t, source = null) {
    text = t;
    subs.forEach((fn) => fn(t, source));
  },
  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};
