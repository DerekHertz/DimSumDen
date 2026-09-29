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
