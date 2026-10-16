// The connected Garden & Desk mounts its native Meshy scene and local model package.
// Retain the previous standalone-build removal checks and legacy pure scene regressions.
// Browser checks use real compressed models; only bridge responses and WebGL drawing are stubbed.
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
  assert.match(run.stdout, /# tests 16\b/, "all 16 tests of the three files run");
});

// ---------------------------------------------------------------- criterion 1: the live app mounts the ported scene

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ configFile: "apps/ui/vite.config.mjs", configLoader: "native", server: { port: 0, host: "127.0.0.1" }, logLevel: "silent" });
  await server.listen();
  base = server.resolvedUrls.local[0];
  browser = await chromium.launch(buildLaunchOptions());
}, { timeout: 120000 });

after(async () => {
  await browser?.close();
  await server?.close();
});

const snapshot = { schema: 1, seq: 1, tickets: [], agents: [], frontier: [], usage: null, requests: [] };
const assets = JSON.parse(readFileSync(join(UI, 'public/den/manifest.json'), 'utf8')).assets;

async function openGarden({ viewport = { width: 1440, height: 900 }, failModels = false } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await lightenScene(context);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], loaded = [], modelResponses = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => loaded.push(new URL(request.url()).pathname));
  page.on("response", response => { if (new URL(response.url()).pathname.startsWith('/den/models/')) modelResponses.push(response); });
  await page.addInitScript(snap => {
    window.__eventStreams = 0;
    class FakeEventSource {
      constructor() {
        window.__eventStreams++;
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
  await page.route(url => url.pathname === '/state', route => route.fulfill({ json: snapshot }));
  await page.route(url => url.pathname === '/metrics', route => route.fulfill({ json: { throughput: { windows: [] }, tokensByCell: {}, incidentsByTool: {} } }));
  await page.route(url => url.pathname === '/requests', route => route.fulfill({ json: [] }));
  await page.route(url => url.pathname === '/session', route => route.fulfill({ status: 404, json: {} }));
  if (failModels) await page.route(url => url.pathname.startsWith('/den/models/'), route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto(base);
  return { context, page, errors, loaded, modelResponses };
}

const ready = page => page.waitForFunction(() => document.querySelector('.den-entry button') && document.querySelector('.den-entry button').getAttribute('aria-disabled') !== 'true', null, { timeout: 60000 });

test("the native garden loads approved local Bao, scenery, wardrobe and all fourteen role props without an iframe or page error", { timeout: 90000 }, async () => {
  const { context, page, errors, loaded, modelResponses } = await openGarden();
  try {
    await ready(page);
    const native = ['/src/scene/meshy/MeshyDen.jsx', '/src/scene/meshy/world.mjs', '/src/scene/meshy/actors.mjs'];
    assert.deepEqual(native.filter(path => !loaded.includes(path)), [], 'the native Meshy world is loaded');
    assert.ok(!loaded.includes('/src/scene/procedural/RestaurantDen.jsx'), 'old procedural scene is not mounted');
    assert.equal(await page.locator('iframe').count(), 0, 'no embedded preview server');
    assert.equal(await page.locator('.forest-canvas canvas').count(), 1);
    const missing = Object.values(assets).filter(asset => !loaded.includes(asset.url));
    assert.deepEqual(missing.map(asset => asset.url), [], 'all models come from the checked-in manifest');
    const props = Object.values(assets).filter(asset => asset.kind === 'prop');
    assert.equal(props.length, 14);
    assert.equal(new Set(props.map(asset => asset.roleId)).size, 14);
    assert.ok(modelResponses.length >= Object.keys(assets).length);
    for (const response of modelResponses) assert.equal(response.status(), 200, response.url());
    const bytes = await modelResponses.find(response => new URL(response.url()).pathname === assets.bao.url).body();
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'glTF', 'Chromium exposes the real decoded GLB model bytes');
    const packaged = readFileSync(join(UI, 'public', assets.bao.url));
    assert.equal(packaged[0], 0x1f, 'the checked-in model is gzip compressed');
    assert.equal(packaged[1], 0x8b);
    assert.equal(await page.evaluate(() => window.__eventStreams), 1, 'one shared live stream');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("phone garden and desk remain separate and all fourteen permanent residents can be browsed without horizontal overflow", { timeout: 90000 }, async () => {
  const { context, page, errors } = await openGarden({ viewport: { width: 390, height: 844 } });
  try {
    await ready(page);
    await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: 'Pandas', exact: true }).click();
    const residents = page.getByRole('region', { name: 'Residents and visitors' });
    await residents.waitFor({ state: 'visible' });
    assert.equal(await residents.getByRole('button').count(), 14, 'quiet snapshots keep every role at home');
    const layout = await page.evaluate(() => {
      const garden = document.querySelector('main.scene').getBoundingClientRect();
      const desk = document.querySelector('aside[aria-label="Your desk"]').getBoundingClientRect();
      return { garden: { bottom: garden.bottom, width: garden.width }, desk: { top: desk.top, width: desk.width }, viewport: innerWidth, bodyWidth: document.body.scrollWidth, shellWidth: document.querySelector('.forest-shell').scrollWidth };
    });
    assert.ok(layout.desk.top >= layout.garden.bottom, 'desk starts below the garden');
    assert.ok(layout.garden.width <= layout.viewport && layout.desk.width <= layout.viewport);
    assert.ok(layout.bodyWidth <= layout.viewport && layout.shellWidth <= layout.viewport, JSON.stringify(layout));
    assert.equal(await page.evaluate(() => window.__eventStreams), 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("a failed model load explains the garden failure and leaves live desk navigation available", { timeout: 60000 }, async () => {
  const { context, page, errors } = await openGarden({ failModels: true });
  try {
    const alert = page.getByRole('alert').filter({ hasText: 'garden models could not load' });
    await alert.waitFor({ state: 'visible' });
    assert.match(await alert.innerText(), /Your board controls are still available at the desk/);
    assert.equal(await page.locator('.den-entry button').getAttribute('aria-disabled'), 'true');
    await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: 'Pandas', exact: true }).click();
    assert.equal(await page.getByRole('region', { name: 'Residents and visitors' }).getByRole('button').count(), 14);
    assert.equal(await page.evaluate(() => window.__eventStreams), 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
