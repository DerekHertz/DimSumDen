// den-scene-v1/05: the Tally expands into an in-place card (user, 2026-10-01). Real browser test of the
// mounted App (Vite dev server, headless Chromium) with /state, /metrics and the event stream stubbed.
// Spec: handoffs/05-designer-spec-2.md (section 11 lists the criteria; section numbers are cited below).
//
// Markup contract the developer must meet (everything else is free):
//   pill      button.chip-tally, aria-label "Tally: open the dashboard", aria-expanded, aria-controls=<dialog id>,
//             aria-haspopup="dialog"
//   card      role="dialog" aria-modal="false" labelled by its "Tally" heading, class "tally-card", inside main.scene
//   heading   the "Tally" heading takes focus on open (an h1-h6 inside the dialog)
//   close     a button named "Close Tally"
//   body      role="region" aria-label="Tally metrics", tabindex 0, overflow-y auto
//   rows      one element per rod with data-rod = five-hour|week|served|tokens|spills, in that order, carrying
//             data-counted="<0..10>"; the 5 h and Week rows contain an element with data-mark="80"
//   sections  h3 "The rods" and h3 "Pipeline" (the existing <Dashboard> renders under the second)
//   meters    exactly two role="meter" in the scene at any time: hidden twins when closed, the card's
//             5 h and Week rows when open (the sidebar's own usage meter is outside the scene)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
import * as THREE from "three";
import { buildLaunchOptions } from "../../../ci-cd/launch-options.mjs";
import { TALLY } from "./banquet-layout.mjs";
import { cameraPosition } from "./camera-rig.mjs";

const TALLY_RODS_CAPTION = "Tally rods: Served 1 bead = 1 ticket this window; Tokens 1 bead = 20k per ticket; Spills 1 bead = 0.1 per ticket.";
const VIEW = { width: 1280, height: 800 };
const PILL = 'button.chip-tally';
const metricsOk = () => ({
  throughput: { windows: [{ start: "2026-09-30T00:00:00Z", resolved: 3 }, { start: "2026-09-30T05:00:00Z", resolved: 6 }] },
  tokensByCell: { developer: { perTicket: 120000 }, qa: { perTicket: 48000 } },
  incidentsByTool: { Bash: { perTicket: 0.2 }, Read: { perTicket: 0.1 } },
});
const usageAt = (fiveHour, weekly) => ({ fiveHour, weekly, sampledAt: new Date(Date.now() - 12 * 60_000).toISOString() });

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ configFile: "apps/ui/vite.config.mjs", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  base = server.resolvedUrls.local[0];
  browser = await chromium.launch(buildLaunchOptions());
  // Warm the dev server so Vite's dependency pre-bundling does not reload a page mid-test.
  const warm = await openApp({});
  await warm.page.close();
}, { timeout: 120000 });

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openApp({ usage = usageAt(79, 41), metrics = metricsOk(), metricsStatus = 200, reducedMotion = "no-preference", quiet = false } = {}) {
  const context = await browser.newContext({ viewport: VIEW, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // One active ticket by default: with none, the "den is quiet" caption is shown (see the quiet-den test).
  const active = { ref: "demo/01-add-login", feature: "demo", title: "add-login", type: "feature", status: "claimed", ready: false, holder: { cell: "developer", since: "2026-09-29T05:00:00.000Z" }, lastCell: null, gate: null, blockedBy: [] };
  const snapshot = { schema: 1, seq: 1, tickets: quiet ? [] : [active], frontier: [], usage, requests: [] };
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
  await page.route((url) => url.pathname === "/metrics", (r) =>
    metricsStatus === 200 ? r.fulfill({ json: metrics }) : r.fulfill({ status: metricsStatus, body: "boom" }));
  await page.goto(base);
  await page.locator(PILL).waitFor({ state: "visible", timeout: 30000 });
  page.setDefaultTimeout(8000);
  return { page, context, errors, pill: page.locator(PILL), scene: page.locator('main[aria-label="Den scene"]') };
}

const dialogOf = (page) => page.getByRole("dialog", { name: "Tally" });
const scrollState = (page) =>
  page.evaluate(() => ({ doc: document.scrollingElement.scrollTop, panel: document.querySelector(".panel").scrollTop }));
const focusInfo = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return { tag: a.tagName, text: a.textContent.trim().slice(0, 40), cls: a.className, inDialog: !!a.closest('[role="dialog"]') };
  });
const settle = (page) => page.waitForTimeout(450);

// Screen position of a world point at the default camera, in page pixels (the scene starts at x 0, y 0).
function screenOf(sceneBox, x, y, z) {
  const cam = new THREE.PerspectiveCamera(38, sceneBox.width / sceneBox.height, 0.1, 100);
  cam.rotation.set(-0.2, 0, 0);
  const [cx, cy, cz] = cameraPosition(0, 1);
  cam.position.set(cx, cy, cz);
  cam.updateMatrixWorld();
  const p = new THREE.Vector3(x, y, z).project(cam);
  return { x: sceneBox.x + ((p.x + 1) / 2) * sceneBox.width, y: sceneBox.y + ((1 - p.y) / 2) * sceneBox.height };
}

test("click on the pill opens the card in place: dialog shown, aria-expanded true, focus on the Tally heading, nothing scrolls (criterion 1)", { timeout: 90000 }, async () => {
  const { page, pill, context, errors } = await openApp();
  try {
    assert.equal(await pill.getAttribute("aria-label"), "Tally: open the dashboard");
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
    assert.equal(await pill.getAttribute("aria-haspopup"), "dialog");
    assert.equal(await dialogOf(page).count(), 0, "closed: no dialog");
    const before = await scrollState(page);
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    assert.equal(await pill.getAttribute("aria-expanded"), "true");
    assert.equal(await pill.getAttribute("aria-controls"), await dialog.getAttribute("id"));
    assert.equal(await dialog.getAttribute("aria-modal"), "false");
    assert.ok(await dialog.evaluate((el) => !!el.closest('main[aria-label="Den scene"]')), "card is inside the scene");
    const f = await focusInfo(page);
    assert.match(f.tag, /^H[1-6]$/, "focus moves to a heading");
    assert.equal(f.text, "Tally");
    assert.equal(f.inDialog, true);
    assert.deepEqual(await scrollState(page), before, "document and .panel scrollTop unchanged");
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

for (const key of ["Enter", "Space"]) {
  test(`${key} on the focused pill opens the card without scrolling the page (criterion 1)`, { timeout: 90000 }, async () => {
    const { page, pill, context } = await openApp();
    try {
      await pill.focus();
      const before = await scrollState(page);
      await page.keyboard.press(key);
      await dialogOf(page).waitFor({ state: "visible" });
      assert.equal(await pill.getAttribute("aria-expanded"), "true");
      assert.equal((await focusInfo(page)).text, "Tally");
      assert.deepEqual(await scrollState(page), before);
    } finally {
      await context.close();
    }
  });
}

test("a quiet den (no active tickets, caption showing) does not block the pill: it still opens the card", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp({ quiet: true });
  try {
    assert.equal(await page.locator(".scene-empty").count(), 1, "the quiet caption is showing");
    await pill.click();
    await dialogOf(page).waitFor({ state: "visible" });
  } finally {
    await context.close();
  }
});

test("a click on the abacus in the scene opens the card, and clicking it again leaves it open (criterion 2)", { timeout: 90000 }, async () => {
  const { page, pill, scene, context } = await openApp();
  try {
    const box = await scene.boundingBox();
    const mid = screenOf(box, TALLY.x, TALLY.groundY + TALLY.leg.height + TALLY.frame.height / 2, TALLY.z);
    await page.mouse.click(mid.x, mid.y);
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    assert.equal(await pill.getAttribute("aria-expanded"), "true");
    await settle(page);
    await page.mouse.click(mid.x, mid.y);
    await settle(page);
    assert.equal(await dialog.isVisible(), true, "a stray click on the 3D object never closes the view");
    assert.equal(await pill.getAttribute("aria-expanded"), "true");
  } finally {
    await context.close();
  }
});

test("Esc, the Close button and the pill each close the card and return focus to the pill (criterion 3)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp();
  try {
    const dialog = dialogOf(page);
    // Esc with focus inside the card
    await pill.click();
    await dialog.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
    assert.ok((await focusInfo(page)).cls.includes("chip-tally"), "Esc returns focus to the pill");
    // Close button
    await pill.click();
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: "Close Tally" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
    assert.ok((await focusInfo(page)).cls.includes("chip-tally"), "Close returns focus to the pill");
    // The pill again toggles it shut
    await pill.click();
    await dialog.waitFor({ state: "visible" });
    await pill.click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
    assert.ok((await focusInfo(page)).cls.includes("chip-tally"));
  } finally {
    await context.close();
  }
});

test("document-level Esc closes the card even when focus is elsewhere (criterion 3)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp();
  try {
    await pill.click();
    await dialogOf(page).waitFor({ state: "visible" });
    await page.evaluate(() => document.querySelector("main").focus());
    await page.keyboard.press("Escape");
    await dialogOf(page).waitFor({ state: "hidden" });
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
  } finally {
    await context.close();
  }
});

test("an outside pointerdown (the scene canvas) closes the card and does not move focus to the pill (criterion 3)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp();
  try {
    await pill.click();
    await dialogOf(page).waitFor({ state: "visible" });
    await settle(page);
    await page.mouse.move(60, 500);
    await page.mouse.down();
    await page.mouse.up();
    await dialogOf(page).waitFor({ state: "hidden" });
    assert.equal(await pill.getAttribute("aria-expanded"), "false");
    assert.ok(!(await focusInfo(page)).cls.includes("chip-tally"), "focus is not forced to the pill");
  } finally {
    await context.close();
  }
});

test("exactly two role=meter in the scene, closed and open, with the exact percent in the name (criterion 4)", { timeout: 90000 }, async () => {
  const { page, pill, scene, context } = await openApp({ usage: usageAt(79, 41) });
  try {
    const read = (loc) =>
      loc.evaluateAll((els) => els.map((e) => ({
        label: e.getAttribute("aria-label"),
        min: e.getAttribute("aria-valuemin"),
        max: e.getAttribute("aria-valuemax"),
        now: e.getAttribute("aria-valuenow"),
        tabindex: e.getAttribute("tabindex"),
      })));
    const want = [
      { label: "5-hour window 79%", min: "0", max: "100", now: "79", tabindex: null },
      { label: "Week 41%", min: "0", max: "100", now: "41", tabindex: null },
    ];
    assert.deepEqual(await read(scene.getByRole("meter")), want, "closed: the hidden twins");
    assert.equal(await page.locator("aside").getByRole("meter").count(), 1, "the sidebar usage meter stays in 05 (07 removes it)");
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    const open = await read(scene.getByRole("meter"));
    assert.equal(open.length, 2, "open: still exactly two in the scene");
    assert.deepEqual(open.map((m) => [m.label, m.now]), [["5-hour window 79%", "79"], ["Week 41%", "41"]]);
    assert.equal(await dialog.getByRole("meter").count(), 2, "open: they are the card's rows");
    for (const m of open) assert.deepEqual([m.min, m.max], ["0", "100"]);
  } finally {
    await context.close();
  }
});

test("card rows: five in order with the counted-bead counts and the 80% mark on 5 h and Week only (criterion 5)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp({ usage: usageAt(79, 41) });
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    const rows = await dialog.locator("[data-rod]").evaluateAll((els) =>
      els.map((e) => ({
        id: e.getAttribute("data-rod"),
        counted: e.getAttribute("data-counted"),
        mark: e.querySelectorAll('[data-mark="80"]').length,
        text: e.innerText.replace(/\s+/g, " "),
      })));
    assert.deepEqual(rows.map((r) => r.id), ["five-hour", "week", "served", "tokens", "spills"]);
    assert.deepEqual(rows.map((r) => r.counted), ["8", "4", "6", "4", "3"]);
    assert.deepEqual(rows.map((r) => r.mark > 0), [true, true, false, false, false]);
    const [five, week, served, tokens, spills] = rows;
    assert.match(five.text, /5 h/); assert.match(five.text, /79%/);
    assert.match(week.text, /Week/); assert.match(week.text, /41%/);
    assert.match(served.text, /Served/); assert.match(served.text, /6 tickets/);
    assert.match(tokens.text, /Tokens/); assert.match(tokens.text, /84k \/ ticket/);
    assert.match(spills.text, /Spills/); assert.match(spills.text, /0\.3 \/ ticket/);
    const text = await dialog.innerText();
    assert.ok(text.includes(TALLY_RODS_CAPTION), "the scale caption lives in the card");
    assert.match(text, /Sampled 12 min ago/);
    assert.equal(await dialog.getByRole("heading", { name: "The rods" }).count(), 1);
    assert.equal(await dialog.getByRole("heading", { name: "Pipeline" }).count(), 1);
    assert.equal(await dialog.locator("figure.chart").count(), 3, "the three Dashboard charts are in the card");
    const region = dialog.getByRole("region", { name: "Tally metrics" });
    assert.equal(await region.getAttribute("tabindex"), "0");
    assert.equal(await region.evaluate((el) => getComputedStyle(el).overflowY), "auto");
  } finally {
    await context.close();
  }
});

test("usage at 96 shows At limit and ten counted beads; 86 shows Wind down; below 80 shows neither (criterion 5)", { timeout: 90000 }, async () => {
  for (const [fiveHour, status, counted] of [[96, "At limit", "10"], [86, "Wind down", "9"], [79, null, "8"]]) {
    const { page, pill, context } = await openApp({ usage: usageAt(fiveHour, 41) });
    try {
      await pill.click();
      const row = dialogOf(page).locator('[data-rod="five-hour"]');
      await row.waitFor({ state: "visible" });
      assert.equal(await row.getAttribute("data-counted"), counted, `${fiveHour}%`);
      const text = await row.innerText();
      if (status) assert.match(text, new RegExp(status), `${fiveHour}%`);
      else assert.doesNotMatch(text, /At limit|Wind down/);
    } finally {
      await context.close();
    }
  }
});

test("no usage sample: 5 h and Week read 'not sampled' with no valuenow and no Sampled line (criterion 6)", { timeout: 90000 }, async () => {
  const { page, pill, scene, context } = await openApp({ usage: null });
  try {
    const labels = () => scene.getByRole("meter").evaluateAll((els) => els.map((e) => [e.getAttribute("aria-label"), e.getAttribute("aria-valuenow")]));
    assert.deepEqual(await labels(), [["5-hour window not sampled", null], ["Week not sampled", null]], "closed twins");
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    assert.deepEqual(await labels(), [["5-hour window not sampled", null], ["Week not sampled", null]], "open rows");
    for (const id of ["five-hour", "week"]) {
      const row = dialog.locator(`[data-rod="${id}"]`);
      assert.equal(await row.getAttribute("data-counted"), "0");
      assert.match(await row.innerText(), /not sampled/);
    }
    assert.doesNotMatch(await dialog.innerText(), /Sampled \d+ min ago/);
  } finally {
    await context.close();
  }
});

test("metrics loading (empty): Served, Tokens and Spills read 'no data' and the charts say 'No data yet' (criterion 6)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp({ metrics: {} });
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    for (const id of ["served", "tokens", "spills"]) {
      const row = dialog.locator(`[data-rod="${id}"]`);
      assert.equal(await row.getAttribute("data-counted"), "0", id);
      assert.match(await row.innerText(), /no data/, id);
    }
    assert.match(await dialog.innerText(), /No data yet/);
    assert.equal(await dialog.locator('[data-rod="five-hour"]').getAttribute("data-counted"), "8", "usage unaffected");
  } finally {
    await context.close();
  }
});

test("metrics error: three rows read 'unavailable', the alert with Retry stays in the Pipeline section, usage rows unaffected (criterion 6)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp({ metricsStatus: 500 });
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    for (const id of ["served", "tokens", "spills"]) {
      const row = dialog.locator(`[data-rod="${id}"]`);
      assert.equal(await row.getAttribute("data-counted"), "0", id);
      assert.match(await row.innerText(), /unavailable/, id);
    }
    const alert = dialog.getByRole("alert");
    assert.match(await alert.innerText(), /Metrics unavailable/);
    assert.equal(await alert.getByRole("button", { name: "Retry" }).count(), 1);
    assert.match(await dialog.locator('[data-rod="five-hour"]').innerText(), /79%/);
  } finally {
    await context.close();
  }
});

test("arrow keys, + and - pressed inside the card do not reach the camera rig (criterion 7)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp();
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    const prevented = (selector, key) =>
      page.evaluate(([sel, k]) => {
        const target = sel === "main" ? document.querySelector("main") : document.querySelector(sel);
        const ev = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
        target.dispatchEvent(ev);
        return ev.defaultPrevented;
      }, [selector, key]);
    for (const key of ["ArrowLeft", "ArrowRight", "+", "-"]) {
      assert.equal(await prevented('[role="dialog"] button[aria-label="Close Tally"]', key), false, `${key} on Close`);
      assert.equal(await prevented('[role="dialog"] [role="region"]', key), false, `${key} on the scroll region`);
    }
    // Control: the same key on the scene itself does move the camera (so the probe is valid).
    assert.equal(await prevented("main", "ArrowRight"), true, "ArrowRight on the scene is handled by the camera rig");
  } finally {
    await context.close();
  }
});

test("placement: above the pill with 8px gap, inside the scene with a 16px margin, 480px wide, at least 280px tall (spec 3)", { timeout: 90000 }, async () => {
  const { page, pill, scene, context } = await openApp();
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    await settle(page);
    const d = await dialog.boundingBox();
    const s = await scene.boundingBox();
    const p = await pill.boundingBox();
    assert.ok(Math.abs(d.width - 480) <= 1, `width ${d.width}`);
    assert.ok(d.height >= 279, `height ${d.height}`);
    assert.ok(d.x >= s.x + 15 && d.x + d.width <= s.x + s.width - 15, "inside the scene horizontally with margin");
    assert.ok(d.y >= s.y + 15, `top ${d.y}`);
    assert.ok(d.y + d.height <= p.y - 6, `card bottom ${d.y + d.height} sits above the pill top ${p.y}`);
  } finally {
    await context.close();
  }
});

test("reduced motion: the card shows with no transform transition and no animation (criterion 8)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp({ reducedMotion: "reduce" });
  try {
    await pill.click();
    const dialog = dialogOf(page);
    await dialog.waitFor({ state: "visible" });
    const style = await dialog.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { prop: cs.transitionProperty, anim: cs.animationName };
    });
    assert.doesNotMatch(style.prop, /transform|all/, `transition-property ${style.prop}`);
    assert.equal(style.anim, "none");
  } finally {
    await context.close();
  }
});

test("the sidebar has no Pipeline slot, keeps its usage slot, and the Dashboard charts are mounted once (criterion 9)", { timeout: 90000 }, async () => {
  const { page, pill, context } = await openApp();
  try {
    const sidebar = () =>
      page.evaluate(() => ({
        h2: [...document.querySelectorAll("aside h2")].map((h) => h.textContent.trim()),
        dashboardSlot: document.querySelectorAll('aside [data-slot="dashboard"]').length,
        charts: document.querySelectorAll("aside figure.chart").length,
      }));
    const closed = await sidebar();
    assert.ok(closed.h2.includes("Plan usage (5 h)"), `usage slot stays: ${closed.h2}`);
    assert.ok(!closed.h2.some((h) => /Pipeline/.test(h)), `no Pipeline slot: ${closed.h2}`);
    assert.equal(closed.dashboardSlot, 0);
    assert.equal(closed.charts, 0);
    await pill.click();
    await dialogOf(page).waitFor({ state: "visible" });
    const ids = await page.evaluate(() => [...document.querySelectorAll('[id^="chart-title-"]')].map((e) => e.id));
    assert.equal(ids.length, 3, `chart title ids: ${ids}`);
    assert.equal(new Set(ids).size, 3, "no duplicate chart ids");
    assert.equal((await sidebar()).charts, 0, "still none in the sidebar when the card is open");
  } finally {
    await context.close();
  }
});
