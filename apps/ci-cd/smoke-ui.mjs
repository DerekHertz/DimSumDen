// dimsumden-ui-v0/13: `npm run smoke:ui`, the end-to-end smoke of bridge + UI on a fixture board.
// Builds the UI, starts the bridge on a disposable .scratch/ tree (the bridge test fixture),
// loads the UI with smoke.mjs --url (clean load), then drives it in a headless browser and checks
// the scene count, the queue order, a chart and one Approve round trip. One PASS/FAIL line per
// check; exits non-zero on any FAIL.
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeStateFixture, FEATURE, HANDLED_ID } from "../bridge/bridge-fixture.mjs";
import { startBridge } from "../bridge/server.mjs";
import { buildLaunchOptions } from "./launch-options.mjs";
import { lightenScene } from "./light-scene.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

// Expected values are literals worked out from the fixture (see bridge-fixture.mjs), not
// recomputed from the snapshot.
//  Scene: one plush and chip per active ticket (04 in-review, 05 blocked, 06 ready-for-human) = 3 chips.
//  Queued tickets (02, 07, 08) show only as baskets on the lazy susan (showcase-v1/04); the tally chip is not a cell chip.
const EXPECTED_CHIPS = 3;
//  Queue: frontier by priority. 02 is P0; 07 is P1 bumped to P0 by three orchestrator handoffs
//  newer than it; 08 has no priority (P2).
const EXPECTED_QUEUE_HEAD = ["02: Ready P0", "07: Bumpable", "08: Plain"];
const MERGE_REF = `${FEATURE}/04-review`;

const results = [];
function report(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}
async function check(name, fn) {
  try {
    const detail = await fn();
    report(name, true, detail);
  } catch (err) {
    report(name, false, err?.message ?? String(err));
  }
}
function expectEqual(actual, expected, what) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: expected ${e}, got ${a}`);
}

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: REPO_ROOT, shell: process.platform === "win32" });
    let out = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (out += c));
    child.once("error", (err) => resolve({ code: 1, out: String(err) }));
    child.once("exit", (code) => resolve({ code, out }));
  });
}

async function launch(chromium) {
  let last;
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch(buildLaunchOptions(channel));
    } catch (err) {
      last = err;
    }
  }
  throw last;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("smoke:ui: playwright not installed, run npm install && npx playwright install chromium");
    return 1;
  }

  const build = await runCommand("npm", ["run", "ui:build"]);
  if (build.code !== 0) {
    report("build", false, `npm run ui:build exited ${build.code}\n${build.out}`);
    return 1;
  }

  const fx = await makeStateFixture();
  // Drop the pending request on the merge ticket so its Approve button is live.
  const reqFile = path.join(fx.root, ".scratch", "_requests", "requests.jsonl");
  const kept = (await readFile(reqFile, "utf8")).split("\n").filter((l) => l && !l.includes(MERGE_REF));
  await writeFile(reqFile, kept.join("\n") + "\n");

  const bridge = await startBridge({ root: fx.root, port: 0 });
  let browser;
  try {
    const load = await runCommand("node", ["apps/ci-cd/smoke.mjs", "--url", `${bridge.url}/`]);
    report("load", load.code === 0, load.code === 0 ? "" : load.out.trim());

    browser = await launch(chromium);
    const context = await browser.newContext();
    // organism-infra/94: the software-rendered scene made the Tally click flake on CI. The clean load above (smoke.mjs
    // --url) already ran with real draws; these checks read the DOM, so draws are skipped here. See light-scene.mjs.
    await lightenScene(context);
    const page = await context.newPage();
    const requested = [];
    page.on("request", (r) => requested.push(r.url()));
    await page.goto(bridge.url, { waitUntil: "load" });
    await page.waitForSelector("[data-slot=queue] .qrow", { timeout: 15000 }).catch(() => {});

    await check("font: Long Cang is self-hosted, no Google Fonts request", async () => {
      const loaded = await page.evaluate(async () => {
        await document.fonts.load("44px 'Long Cang'");
        return document.fonts.check("44px 'Long Cang'") && [...document.fonts].some((f) => f.family.includes("Long Cang") && f.status === "loaded");
      });
      if (!loaded) throw new Error("Long Cang did not load from the bundled woff2");
      const google = requested.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u));
      if (google.length) throw new Error("Google Fonts requested: " + google.join(", "));
      return "bundled woff2, 0 Google requests";
    });

    await check("scene: one chip per active ticket", async () => {
      await page
        .waitForFunction((n) => document.querySelectorAll(".chip-layer .chip:not(.chip-tally)").length === n, EXPECTED_CHIPS, { timeout: 10000 })
        .catch(() => {});
      expectEqual(await page.locator(".chip-layer .chip:not(.chip-tally)").count(), EXPECTED_CHIPS, "chips");
      return `${EXPECTED_CHIPS} chips`;
    });

    await check("queue: frontier in priority order", async () => {
      const titles = await page.locator("[data-slot=queue] ul.qlist").first().locator(".qrow-title").allTextContents();
      expectEqual(titles, EXPECTED_QUEUE_HEAD, "frontier titles");
    });

    await check("chart: the Tally card opens in place and its pipeline charts render with an accessible title", async () => {
      await page.locator(".chip-tally").click({ timeout: 10000 });
      await page.waitForSelector(".tally-card figure.chart svg[role=img]", { timeout: 10000 });
      const n = await page.locator(".tally-card figure.chart svg[role=img]").count();
      if (n < 1) throw new Error("no chart rendered");
      const title = (await page.locator(".tally-card figure.chart figcaption").first().textContent())?.trim();
      if (!title) throw new Error("chart has no title");
      await page.keyboard.press("Escape");
      return `${n} charts`;
    });

    await check("approve: round trip writes a merge-approve request and the card shows it pending", async () => {
      const card = page.locator(".gate-card", { hasText: MERGE_REF });
      await card.getByRole("button", { name: "Approve merge" }).click();
      await card.getByText("Approval sent, waiting for the orchestrator").waitFor({ timeout: 10000 });
      const rows = (await readFile(reqFile, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
      const req = rows.find((r) => r.ref === MERGE_REF && r.id !== HANDLED_ID);
      expectEqual(req?.kind, "merge-approve", "request kind");
    });
  } finally {
    await browser?.close();
    await bridge.close();
    await fx.cleanup();
  }
  return results.every(Boolean) ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err.stack ?? String(err));
    process.exit(1);
  });
