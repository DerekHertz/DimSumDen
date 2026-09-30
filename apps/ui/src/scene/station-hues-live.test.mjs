// Exercise the real mounted Market and Three materials through system theme changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
import { buildLaunchOptions } from "../../../ci-cd/launch-options.mjs";

test("mounted stall trim follows light-dark-light system theme changes without reload", { timeout: 45000 }, async () => {
  const server = await createServer({ configFile: "apps/ui/vite.config.mjs", server: { port: 0, host: "127.0.0.1" } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch(buildLaunchOptions());
    const page = await browser.newPage({ colorScheme: "light" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(server.resolvedUrls.local[0] + "src/scene/station-hues.fixture.html");
    await page.waitForFunction(() => Object.keys(window.trimHues?.() ?? {}).length === 4);
    assert.deepEqual(errors, [], "fixture must mount real Market without runtime errors");
    const palettes = {
      light: { steamers: "#2759A2", tea: "#006E54", pantry: "#326A2D", "front-of-house": "#00658B" },
      dark: { steamers: "#87B9FF", tea: "#56D0AF", pantry: "#8ACB83", "front-of-house": "#55C6F4" },
    };
    const initial = await page.evaluate(() => window.trimHues());
    await page.emulateMedia({ colorScheme: "dark" });
    // Read after the browser has dispatched media-query changes and React has rendered.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const dark = await page.evaluate(() => window.trimHues());
    await page.emulateMedia({ colorScheme: "light" });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const restored = await page.evaluate(() => window.trimHues());
    assert.deepEqual({ initial, dark, restored }, { initial: palettes.light, dark: palettes.dark, restored: palettes.light });
    assert.equal(await page.evaluate(() => window.mounts), 1, "same Canvas remains mounted");
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});
