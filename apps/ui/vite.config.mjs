// ADR 0011 decision 10: Vite builds apps/ui to apps/ui/dist; the bridge serves it.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const bridge = "http://127.0.0.1:4317";

export default defineConfig({
  root: here,
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  oxc: { jsx: { runtime: "automatic" } },
  build: { outDir: fileURLToPath(new URL("./dist", import.meta.url)), emptyOutDir: true },
  server: {
    fs: { allow: [repoRoot] },
    proxy: { "/state": bridge, "/metrics": bridge, "/events": bridge, "/requests": bridge },
  },
});
