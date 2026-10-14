// den-mvp/11 (ADR 0026 decision 7): the recovery page in a real browser, with the UI links pointing at a release that
// does not load. The page signs in with a launch code, shows both builds, and its button rolls back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { buildLaunchOptions } from "../../ci-cd/launch-options.mjs";
import { startBridge } from "../server.mjs";
import { makeStateFixture } from "../bridge-fixture.mjs";
import { CODE } from "../bridge-auth-helpers.mjs";
import { SHA_A, SHA_B, liveReleases } from "./release-test-helpers.mjs";

test("/recover loads when the live build has no index.html, loads nothing from the UI build, and its button rolls back", { timeout: 90_000 }, async () => {
  let fx, denState, bridge, browser;
  try {
    fx = await makeStateFixture();
    denState = await mkdtemp(path.join(tmpdir(), "den-recover-"));
    await liveReleases(denState, [SHA_A, SHA_B], { [SHA_B]: { index: false } });
    bridge = await startBridge({ root: fx.root, port: 0, denState, uiDir: path.join(denState, "no-such-build"), auth: { launchCode: CODE } });
    browser = await chromium.launch(buildLaunchOptions());
    const page = await browser.newPage();
    const asked = [];
    page.on("request", (r) => asked.push(`${r.method()} ${new URL(r.url()).pathname}`));
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    // Not signed in: both builds are shown and the button is off, with the reason in words.
    await page.goto(`${bridge.url}/recover`);
    const back = page.getByRole("button", { name: /Go back to the previous build/ });
    await page.waitForFunction(() => document.getElementById("live").textContent.includes("live since"));
    assert.match(await page.locator("#live").textContent(), new RegExp(`^${SHA_B.slice(0, 12)} `));
    assert.equal(await page.locator("#previous").textContent(), SHA_A.slice(0, 12));
    assert.equal(await back.isDisabled(), true);
    assert.match(await page.getByRole("status").textContent(), /Read-only/);

    // Signed in with the launch code: the code leaves the address bar, and the button names the build it goes back to.
    await page.goto(`${bridge.url}/recover#code=${CODE}`);
    await page.reload(); // a goto that changes only the fragment does not load the page again
    await page.waitForFunction(() => !document.getElementById("back").disabled);
    assert.equal(new URL(page.url()).hash, "");
    assert.equal(await back.textContent(), `Go back to the previous build (${SHA_A.slice(0, 12)})`);
    await back.click();
    await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Done"));
    assert.match(await page.locator("#live").textContent(), new RegExp(`^${SHA_A.slice(0, 12)} `));
    assert.match(await page.locator("#undone").textContent(), new RegExp(`build ${SHA_B.slice(0, 12)} was rolled back`));

    const state = await (await fetch(`${bridge.url}/state`)).json();
    assert.equal(state.build.live.sha, SHA_A);
    assert.equal(state.build.rolledBack.sha, SHA_B);
    assert.match(await (await fetch(`${bridge.url}/`)).text(), new RegExp(`den ${SHA_A.slice(0, 12)}`), "the den loads again");
    assert.deepEqual([...new Set(asked)].sort(), ["GET /recover", "GET /recover/script", "GET /state", "POST /build/rollback", "POST /session"]);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await bridge?.close();
    await fx?.cleanup();
    if (denState) await rm(denState, { recursive: true, force: true });
  }
});
