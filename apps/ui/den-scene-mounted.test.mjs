// den-layout/02: PR #162's restaurant scene becomes the den.
// Acceptance seams (ticket .scratch/den-layout/issues/02-scene-becomes-the-den.md):
//   1. the live app (vite dev server, headless Chromium) loads the ported scene modules and never the old
//      procedural Den.jsx, and mounts without a page error
//   2. package.json and the tree no longer carry the standalone review build
//   3. PR #162's three test files run green, each process inside a time budget well under CI's limit
// The static import-graph side of criterion 1 and the den-v1/08 rules live in reachability.test.mjs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";
import { buildLaunchOptions } from "../ci-cd/launch-options.mjs";
import { lightenScene } from "../ci-cd/light-scene.mjs";

const UI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(UI, "..", "..");

// ---------------------------------------------------------------- criterion 2: the standalone review build is gone

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

test("review:dev and review:build scripts are gone", () => {
  assert.equal(pkg.scripts["review:dev"], undefined);
  assert.equal(pkg.scripts["review:build"], undefined);
});

test("the standalone review build's files are gone: vite config, html entry, build script, entry module", () => {
  const present = [
    "apps/ui/review.vite.config.mjs",
    "apps/ui/review/index.html",
    "scripts/build-den-review.mjs",
    "apps/ui/src/review/main.jsx",
  ].filter((p) => existsSync(join(ROOT, p)));
  assert.deepEqual(present, []);
});

test("every file path a package.json script names exists (no script references a removed file)", () => {
  const missing = [];
  for (const [name, command] of Object.entries(pkg.scripts)) {
    for (const m of command.matchAll(/(?:^|[\s"'=])((?:apps|packages|scripts)\/[A-Za-z0-9_./-]+\.(?:mjs|js|jsx|json|html))(?=$|[\s"'])/g)) {
      if (!existsSync(join(ROOT, m[1]))) missing.push(`${name}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("live docs do not tell anyone to run the removed review scripts", () => {
  const walk = (dir) =>
    !existsSync(dir) ? [] : readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  const docs = [join(ROOT, "README.md"), ...walk(join(ROOT, "docs", "agents")), ...walk(join(UI, "assets-src"))].filter((f) => f.endsWith(".md") && existsSync(f));
  const stale = docs.filter((f) => /review:(dev|build)\b/.test(readFileSync(f, "utf8"))).map((f) => f.slice(ROOT.length + 1));
  assert.deepEqual(stale, []);
});

// ---------------------------------------------------------------- criterion 4: PR #162's three tests pass on main in time

test("PR #162's agents, review and restaurant test files pass on main, in one process under 90 s", () => {
  const files = [
    "apps/ui/src/review/agents.test.mjs",
    "apps/ui/src/review/review.test.mjs",
    "apps/ui/src/scene/procedural/restaurant.test.mjs",
  ];
  for (const f of files) assert.ok(existsSync(join(ROOT, f)), `${f} exists`);
  // A nested node --test must not inherit the outer runner's context, or it prints no TAP summary.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const started = Date.now();
  const run = spawnSync(process.execPath, ["--test", ...files], { cwd: ROOT, env, encoding: "utf8", timeout: 90_000, maxBuffer: 32 * 1024 * 1024 });
  const seconds = (Date.now() - started) / 1000;
  assert.equal(run.error, undefined, `the run did not time out (took ${seconds}s)`);
  assert.equal(run.status, 0, `exit ${run.status}\n${(run.stdout || "").split("\n").filter((l) => /^(not ok|# (pass|fail))/.test(l)).join("\n")}`);
  assert.match(run.stdout, /# fail 0\b/);
  assert.match(run.stdout, /# skipped 0\b/);
  assert.match(run.stdout, /# tests 20\b/, "all 20 tests of PR #162's three files run");
});

// ---------------------------------------------------------------- criterion 1: the live app mounts the ported scene

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ configFile: "apps/ui/vite.config.mjs", server: { port: 0, host: "127.0.0.1" }, logLevel: "silent" });
  await server.listen();
  base = server.resolvedUrls.local[0];
  browser = await chromium.launch(buildLaunchOptions());
}, { timeout: 120000 });

after(async () => {
  await browser?.close();
  await server?.close();
});

test("opening the app loads PR #162's scene modules, never the old Den.jsx, and mounts a canvas without a page error", async () => {
  const snapshot = { schema: 1, seq: 1, tickets: [], frontier: [], usage: null, requests: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await lightenScene(context);
  const page = await context.newPage();
  const errors = [];
  const loaded = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => loaded.push(new URL(r.url()).pathname));
  await page.addInitScript((snap) => {
    class FakeEventSource {
      constructor() {
        this.l = {};
        setTimeout(() => {
          this.onopen?.();
          for (const f of this.l.snapshot ?? []) f({ data: JSON.stringify(snap) });
        }, 0);
      }
      addEventListener(type, fn) { (this.l[type] ??= []).push(fn); }
      close() {}
    }
    window.EventSource = FakeEventSource;
  }, snapshot);
  await page.route((url) => url.pathname === "/state", (r) => r.fulfill({ json: snapshot }));
  await page.route((url) => url.pathname === "/metrics", (r) => r.fulfill({ json: { throughput: { windows: [] }, tokensByCell: {}, incidentsByTool: {} } }));
  await page.route((url) => url.pathname === "/requests", (r) => r.fulfill({ json: [] }));
  await page.route((url) => url.pathname === "/session", (r) => r.fulfill({ status: 404, json: {} }));
  try {
    await page.goto(base);
    await page.locator("canvas").first().waitFor({ state: "attached", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500); // a few frames, so an error in the scene's first updates would surface

    const ported = [
      "/src/scene/procedural/restaurant.mjs",
      "/src/review/agents.mjs",
      "/src/review/leisure.mjs",
      "/src/review/construction-pads.mjs",
      "/src/review/landscape.mjs",
      "/src/review/site-plan.mjs",
    ];
    const notLoaded = ported.filter((p) => !loaded.includes(p));
    assert.deepEqual(notLoaded, [], "the browser fetched every ported scene module");
    assert.ok(!loaded.includes("/src/scene/procedural/Den.jsx"), "the browser never fetched the old Den.jsx");
    assert.deepEqual(errors, [], "no uncaught page error while the scene mounts and runs");
    assert.ok((await page.locator("canvas").count()) >= 1, "a canvas is mounted");
  } finally {
    await context.close();
  }
});
