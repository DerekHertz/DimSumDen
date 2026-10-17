// ci-cd/05: cloud sessions have Chromium 1194 but Playwright wants another build.
// PW_CHROMIUM_PATH points the browser launchers at the preinstalled binary.
//
// Contract for apps/ci-cd/launch-options.mjs:
//   export function buildLaunchOptions(channel, env = process.env)
//     env.PW_CHROMIUM_PATH set (non-empty): { executablePath, args: [swiftshader flags] }, channel ignored
//     unset or empty: channel ? { channel } : {}   (today's behaviour)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLOUD_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const { buildLaunchOptions } = await import("./launch-options.mjs");

test("PW_CHROMIUM_PATH set: launches that executable with the swiftshader flags", () => {
  const opts = buildLaunchOptions(undefined, { PW_CHROMIUM_PATH: CLOUD_CHROME });
  assert.equal(opts.executablePath, CLOUD_CHROME);
  assert.deepEqual(opts.args, ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]);
});

test("PW_CHROMIUM_PATH set: the channel is not passed alongside the executable", () => {
  const opts = buildLaunchOptions("chrome", { PW_CHROMIUM_PATH: CLOUD_CHROME });
  assert.equal(opts.executablePath, CLOUD_CHROME);
  assert.equal("channel" in opts, false);
});

test("PW_CHROMIUM_PATH unset: options are unchanged (channel, or empty for bundled)", () => {
  assert.deepEqual(buildLaunchOptions("chrome", {}), { channel: "chrome" });
  assert.deepEqual(buildLaunchOptions("msedge", {}), { channel: "msedge" });
  assert.deepEqual(buildLaunchOptions(undefined, {}), {});
});

test("PW_CHROMIUM_PATH empty string counts as unset", () => {
  assert.deepEqual(buildLaunchOptions("chrome", { PW_CHROMIUM_PATH: "" }), { channel: "chrome" });
  assert.deepEqual(buildLaunchOptions(undefined, { PW_CHROMIUM_PATH: "" }), {});
});

test("defaults to process.env when no env is passed", () => {
  const saved = process.env.PW_CHROMIUM_PATH;
  try {
    process.env.PW_CHROMIUM_PATH = CLOUD_CHROME;
    assert.equal(buildLaunchOptions(undefined).executablePath, CLOUD_CHROME);
    delete process.env.PW_CHROMIUM_PATH;
    assert.deepEqual(buildLaunchOptions("chrome"), { channel: "chrome" });
  } finally {
    if (saved === undefined) delete process.env.PW_CHROMIUM_PATH;
    else process.env.PW_CHROMIUM_PATH = saved;
  }
});

for (const launcher of ["smoke.mjs", "smoke-ui.mjs"]) {
  test(`${launcher} builds its launch options with launch-options.mjs`, () => {
    const src = fs.readFileSync(path.join(HERE, launcher), "utf8");
    assert.match(src, /import\s*\{[^}]*buildLaunchOptions[^}]*\}\s*from\s*["']\.\/launch-options\.mjs["']/);
    assert.match(src, /buildLaunchOptions\(/);
  });
}

// PW_GPU=1 with a display (WSLg): headed Chromium on the real card through Mesa's D3D12 driver, window off-screen.
// Headless Chromium always falls back to SwiftShader, so the GPU path has to be headed. No display: today's behaviour.
const GUI = { PW_GPU: "1", DISPLAY: ":0" };

test("PW_GPU=1 with a display: headed, D3D12 GL, off-screen window", () => {
  const opts = buildLaunchOptions(undefined, GUI);
  assert.equal(opts.headless, false);
  assert.ok(opts.args.includes("--use-angle=gl"));
  assert.ok(opts.args.includes("--ignore-gpu-blocklist"));
  assert.ok(opts.args.some((a) => a.startsWith("--window-position=-")));
  assert.equal(opts.env.GALLIUM_DRIVER, "d3d12");
  assert.match(opts.env.LD_LIBRARY_PATH, /^\/usr\/lib\/wsl\/lib/);
});

test("PW_GPU=1: keeps the channel, keeps the caller's env and LD_LIBRARY_PATH", () => {
  const opts = buildLaunchOptions("chrome", { ...GUI, LD_LIBRARY_PATH: "/opt/x", HOME: "/h" });
  assert.equal(opts.channel, "chrome");
  assert.equal(opts.env.HOME, "/h");
  assert.equal(opts.env.LD_LIBRARY_PATH, "/usr/lib/wsl/lib:/opt/x");
});

test("PW_GPU=1 with PW_CHROMIUM_PATH: the executable stays, the GPU flags replace swiftshader", () => {
  const opts = buildLaunchOptions(undefined, { ...GUI, PW_CHROMIUM_PATH: CLOUD_CHROME });
  assert.equal(opts.executablePath, CLOUD_CHROME);
  assert.equal(opts.args.includes("--use-angle=swiftshader"), false);
  assert.equal(opts.headless, false);
});

test("PW_GPU=1 under Wayland only (no DISPLAY) still counts as a display", () => {
  assert.equal(buildLaunchOptions(undefined, { PW_GPU: "1", WAYLAND_DISPLAY: "wayland-0" }).headless, false);
});

test("PW_GPU unset, not 1, or no display: today's options", () => {
  assert.deepEqual(buildLaunchOptions("chrome", { DISPLAY: ":0" }), { channel: "chrome" });
  assert.deepEqual(buildLaunchOptions("chrome", { PW_GPU: "0", DISPLAY: ":0" }), { channel: "chrome" });
  assert.deepEqual(buildLaunchOptions(undefined, { PW_GPU: "1" }), {});
});
