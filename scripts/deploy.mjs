// Публикует собранную папку dist/ в ветку gh-pages (оттуда её раздаёт GitHub Pages).
// Запуск: npm run deploy
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });
const remote = execSync("git remote get-url origin").toString().trim();

writeFileSync("dist/.nojekyll", ""); // чтобы GitHub не обрабатывал файлы Jekyll'ом
sh("git -c core.longpaths=true init -q -b gh-pages", "dist");
sh("git config core.longpaths true", "dist"); // длинные пути на Windows
sh("git add -A", "dist");
sh('git commit -q -m "Deploy"', "dist");
sh(`git push -f ${remote} gh-pages`, "dist");
console.log("Опубликовано в ветку gh-pages");
