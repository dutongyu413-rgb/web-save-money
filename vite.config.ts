import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // GitHub Pages 会把项目发布到 /web-save-money/ 子路径；本地开发仍使用根路径。
  base: mode === "github-pages" ? "/web-save-money/" : "/",
  plugins: [react()],
  server: { port: 8417, strictPort: true },
  preview: { port: 8418, strictPort: true },
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
}));
