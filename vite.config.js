import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — сайт работает из любой папки (GitHub Pages, хостинг, подпапка)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020", assetsInlineLimit: 0 },
});
