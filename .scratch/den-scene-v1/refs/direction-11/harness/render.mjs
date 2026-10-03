// Scratch render harness: real den scene (repo code, unmodified on disk) + an in-memory transform per option.
// usage: node render.mjs <configs.json> <outDir> [--measure]
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const WT = "/home/dhertzell/dimsumden/.claude/worktrees/agent-a3a7353aaf6862398";
const S = path.dirname(new URL(import.meta.url).pathname);
const imp = (p) => import(pathToFileURL(path.join(WT, p)).href);
const { createServer } = await imp("node_modules/vite/dist/node/index.js");
const { chromium } = await imp("node_modules/playwright/index.mjs");
const { makeStateFixture } = await imp("apps/bridge/bridge-fixture.mjs");
const { startBridge } = await imp("apps/bridge/server.mjs");
const { designerDirection } = await import(pathToFileURL(path.join(S, "plugin.mjs")).href);

const [cfgFile, outDir] = process.argv.slice(2);
const configs = JSON.parse(readFileSync(cfgFile, "utf8"));
mkdirSync(outDir, { recursive: true });

const fx = await makeStateFixture();
const bridge = await startBridge({ root: fx.root, port: 0 });
const vite = await createServer({
  configFile: false,
  root: path.join(WT, "apps/ui"),
  publicDir: path.join(WT, "apps/ui/public"),
  oxc: { jsx: { runtime: "automatic" } },
  plugins: [designerDirection()],
  logLevel: "error",
  server: { port: 5199, strictPort: true, fs: { allow: [WT, S] }, proxy: Object.fromEntries(["/state", "/metrics", "/events", "/requests"].map((k) => [k, bridge.url])) },
});
await vite.listen();
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const results = {};
try {
  for (const cfg of configs) {
    const ctx = await browser.newContext({ viewport: cfg.viewport ?? { width: 1440, height: 900 }, deviceScaleFactor: cfg.dsf ?? 1, reducedMotion: cfg.reducedMotion ? "reduce" : "no-preference", colorScheme: cfg.theme ?? "light" });
    await ctx.addInitScript((o) => { globalThis.__OPT = o; }, cfg.opt ?? null);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto("http://localhost:5199/", { waitUntil: "load" });
    await page.addStyleTag({ content: cfg.keepUi ? "/* ui kept */" : ".shell > :not(main), .chip-layer, .scene-caption { display: none !important; }" });
    await page.waitForTimeout(cfg.wait ?? 9000);
    if (cfg.opt?.measure) results[cfg.name] = await page.evaluate(() => globalThis.__surf ?? null);
    const clip = cfg.clip;
    await page.screenshot({ path: path.join(outDir, `${cfg.name}.png`), ...(clip ? { clip } : {}) });
    if (errors.length) console.log(cfg.name, "console errors:", errors.slice(0, 3));
    await ctx.close();
    console.log("rendered", cfg.name);
  }
} finally {
  await browser.close();
  await vite.close();
  await bridge.close?.();
}
if (Object.keys(results).length) writeFileSync(path.join(outDir, "surf.json"), JSON.stringify(results));
process.exit(0);
