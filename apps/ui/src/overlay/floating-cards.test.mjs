// den-scene-v1/07 (scope as changed 2026-10-01): the 400px sidebar becomes floating 320px cards over the
// scene, and the three bottom overlays are rebuilt. Real browser test of the mounted App (Vite dev server,
// headless Chromium) with /state, /metrics, /requests and the event stream stubbed, the same way
// scene/tally-expand.test.mjs does it. Numbers and copy come from docs/design/2026-10-01-iso-den.md
// (sections 3 to 5, 7) and the ticket's Comments; nothing here reads camera internals.
//
// Markup contract the developer must meet (everything else is free):
//   overlay roots   data-overlay="logo" | "needs-you" | "stations" | "zoom" | "intent" | "timeline" on the
//                   element that is the visible pill or card (its box is what the geometry tests measure)
//   logo pill       contains an h1 "Dim Sum Den" and the text "Live" (the Live text colour is `qi`)
//   Needs you       a region (section) named /^Needs you/ (digest: "Needs you, 3 waiting"); its header is the first
//                   button[aria-expanded] in the card (name contains "Needs you"; the count shows beside it);
//                   open when at least 1 request waits. First request: eyebrow "<Station> · <role> · <ticket>",
//                   title "<ticket> wants <gate> approval", a code/pre preview well, Approve and Deny buttons
//                   (names start "Approve" / "Deny") each holding a key-hint element whose whole text is "a" / "d",
//                   a "Note" textarea, then one row per other waiting request with a relative time ("2 min").
//                   A waiting request is a ticket whose `gate` is "merge" or "dispatch" (as gates-model.mjs does today).
//   keys            `a` approve, `d` deny (POST /requests {kind: "<gate>-approve" | "<gate>-reject", ref}), `m` focuses the
//                   Note field, `j` / `k` show the next / previous waiting request. They fire only when focus is inside the
//                   Needs you card and not in a text field, and never inside the Tally dialog.
//                   (`m`, `j`, `k` meanings are QA's reading of the ticket: the ApprovalCard spec lives in a design-system
//                   artifact this cell may not open. Flagged in the handoff for designer confirmation.)
//   Stations card   a region named /^Stations/, closed by default (header = first button[aria-expanded], aria-expanded
//                   "false", body not visible). Open stations are buttons data-station-pill="pass|steamers|tea|pantry|
//                   front-of-house" in that order (text: name, count, and "waiting" when one waits); then dormant,
//                   non-interactive dashed pills data-station-pill="cubs|library|drum". Header summary "5 open · N ready".
//                   Overline "Next on the susan" then up to 3 rows (chip "P1" + title), or "The susan is empty."
//   zoom switcher   <nav aria-label="Zoom level"> holding the four level buttons (text exactly "1 · Den", "2 · Station",
//                   "3 · Panda", "4 · Workspace"; current one has aria-current="true" and `qi` text) plus two buttons
//                   aria-label "Zoom in" and "Zoom out". The nav carries data-zoom="<number>", the live dolly factor
//                   (digest section 1: [0.55, 1.2], default 1, smaller is closer). Wheel, pinch, + and - keys, and the
//                   Zoom in/out buttons all move that one value.
//   intent bar      input placeholder "Give the den an intent…", a "Ctrl K" hint, a Send button, an autonomy toggle button
//                   (name contains "utonomy"), and the text "Current intent" above.
//   timeline        "Live", a time (h:mm), and the caption "Drag back to replay the den's history".
//   no sidebar      no aside, no .panel, no "Plan usage" text, no role=meter inside the cards.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
import { buildLaunchOptions } from "../../../ci-cd/launch-options.mjs";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const ZOOM_NEAREST = 0.55; // digest section 1: dolly factor range, smaller is closer
const ZOOM_FARTHEST = 1.2;
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ configFile: "apps/ui/vite.config.mjs", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  base = server.resolvedUrls.local[0];
  browser = await chromium.launch(buildLaunchOptions());
  const warm = await openApp({});
  await warm.context.close();
}, { timeout: 120000 });

after(async () => {
  await browser?.close();
  await server?.close();
});

const ticket = (n, slug, extra = {}) => ({
  ref: `demo/${n}-${slug}`, feature: "demo", title: slug, type: "feature", status: "claimed", ready: false,
  holder: null, lastCell: null, gate: null, blockedBy: [], priority: "P1", effectivePriority: "P1", bumped: false, ...extra,
});

function fixture() {
  const since = new Date(Date.now() - 2 * 60_000).toISOString();
  return {
    schema: 1, seq: 1, usage: { fiveHour: 79, weekly: 41, sampledAt: new Date(Date.now() - 12 * 60_000).toISOString() }, requests: [],
    tickets: [
      ticket("01", "add-login", { holder: { cell: "developer", since } }),
      ticket("02", "verify-it", { holder: { cell: "qa", since }, gate: "merge" }),
      ticket("03", "ship-it", { holder: { cell: "designer", since }, gate: "dispatch", status: "in-review" }),
      ticket("04", "odd-job", { holder: { cell: "intern", since } }),
      ticket("05", "next-up", { status: "ready", ready: true, effectivePriority: "P0", priority: "P0" }),
      ticket("06", "later-on", { status: "ready", ready: true, effectivePriority: "P2", priority: "P2" }),
    ],
    frontier: ["demo/05-next-up", "demo/06-later-on"],
  };
}
const quietSnapshot = () => ({ schema: 1, seq: 1, tickets: [], frontier: [], usage: null, requests: [] });

async function openApp({ snapshot = fixture(), viewport = DESKTOP, hasTouch = false } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", hasTouch });
  const page = await context.newPage();
  const errors = [];
  const posts = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  await page.route((url) => url.pathname === "/requests", (r) => {
    const req = r.request();
    if (req.method() === "POST") {
      posts.push(JSON.parse(req.postData() ?? "{}"));
      return r.fulfill({ status: 202, json: {} });
    }
    return r.fulfill({ json: [] });
  });
  await page.goto(base);
  // The app is up once the Tally pill (ticket 05) is on screen; the overlays may not exist yet, and then
  // the tests below fail on their own assertions rather than in setup.
  await page.locator("button.chip-tally").waitFor({ state: "visible", timeout: 30000 });
  await page.locator('[data-overlay="logo"]').waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
  page.setDefaultTimeout(5000);
  return {
    page, context, errors, posts,
    logo: page.locator('[data-overlay="logo"]'),
    needs: page.locator('[data-overlay="needs-you"]'),
    stations: page.locator('[data-overlay="stations"]'),
    zoom: page.locator('[data-overlay="zoom"]'),
    intent: page.locator('[data-overlay="intent"]'),
    timeline: page.locator('[data-overlay="timeline"]'),
  };
}

const header = (card) => card.locator("button[aria-expanded]").first();
const zoomValue = async (zoom) => Number(await zoom.getAttribute("data-zoom"));
const token = (page, name) =>
  page.evaluate((n) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--${n})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, name);
const colourOf = (locator) => locator.evaluate((el) => getComputedStyle(el).color);
const withApp = (opts, fn) => async () => {
  const app = await openApp(opts);
  try {
    await fn(app);
    assert.deepEqual(app.errors, [], "no page errors");
  } finally {
    await app.context.close();
  }
};

// ---- Layout: floating cards, no sidebar, positions from digest section 4 ---------------------------------

test("no sidebar: no aside or .panel, the scene fills the viewport, and there is no plan usage meter in the cards (criteria: sidebar gone, no usage meter)", { timeout: 90000 }, withApp({}, async ({ page, logo, needs, stations }) => {
  assert.equal(await page.locator("aside").count(), 0);
  assert.equal(await page.locator(".panel").count(), 0);
  const scene = await page.locator('main[aria-label="Den scene"]').boundingBox();
  assert.ok(near(scene.x, 0) && near(scene.width, DESKTOP.width), `scene spans the full width, got x ${scene.x} w ${scene.width}`);
  assert.equal(await page.getByText(/Plan usage/i).count(), 0, "no 'Plan usage' text anywhere");
  for (const card of [logo, needs, stations]) assert.equal(await card.locator('[role="meter"]').count(), 0, "no meter in a card");
}));

test("DOM order is logo pill, Needs you, Stations & queue (criterion: order, as changed 2026-10-01)", { timeout: 90000 }, withApp({}, async ({ page }) => {
  const order = await page.evaluate(() => {
    const idx = (n) => [...document.querySelectorAll("[data-overlay]")].findIndex((e) => e.dataset.overlay === n);
    const h1 = document.querySelector("h1");
    const el = (n) => document.querySelector(`[data-overlay="${n}"]`);
    const before = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      h1InLogo: !!h1 && !!el("logo") && el("logo").contains(h1) && h1.textContent.trim() === "Dim Sum Den",
      logoBeforeNeeds: before(el("logo"), el("needs-you")),
      needsBeforeStations: before(el("needs-you"), el("stations")),
      all: ["logo", "needs-you", "stations", "zoom", "intent", "timeline"].map(idx),
    };
  });
  assert.equal(order.h1InLogo, true, "the logo pill holds the h1 'Dim Sum Den'");
  assert.equal(order.logoBeforeNeeds, true);
  assert.equal(order.needsBeforeStations, true);
  assert.ok(order.all.every((i) => i >= 0), "all six overlays exist");
}));

test("desktop geometry at 1440 x 900 follows digest section 4: 16px gutters, 320px cards, 10px gap, 580px intent bar, 220px timeline", { timeout: 90000 }, withApp({}, async ({ logo, needs, stations, zoom, intent, timeline }) => {
  const [l, n, s, z, i, t] = await Promise.all([logo, needs, stations, zoom, intent, timeline].map((x) => x.boundingBox()));
  assert.ok(near(l.x, 16) && near(l.y, 16) && near(l.height, 48), `logo ${JSON.stringify(l)}`);
  assert.ok(near(n.x + n.width, DESKTOP.width - 16) && near(n.width, 320) && near(n.y, 16), `needs ${JSON.stringify(n)}`);
  assert.ok(near(s.x, n.x) && near(s.width, 320), `stations column ${JSON.stringify(s)}`);
  assert.ok(near(s.y, n.y + n.height + 10), `stations sits 10px under Needs you: ${s.y} vs ${n.y + n.height + 10}`);
  assert.ok(near(z.x, 16) && near(z.y + z.height, DESKTOP.height - 16), `zoom ${JSON.stringify(z)}`);
  assert.ok(near(i.width, 580) && near(i.x + i.width / 2, DESKTOP.width / 2) && near(i.y + i.height, DESKTOP.height - 16), `intent ${JSON.stringify(i)}`);
  assert.ok(near(t.width, 220) && near(t.x + t.width, DESKTOP.width - 16) && near(t.y + t.height, DESKTOP.height - 16), `timeline ${JSON.stringify(t)}`);
}));

test("logo pill shows 'Dim Sum Den' and a Live badge in qi", { timeout: 90000 }, withApp({}, async ({ page, logo }) => {
  await logo.getByText("Live", { exact: true }).waitFor({ state: "visible" });
  assert.equal(await colourOf(logo.getByText("Live", { exact: true })), await token(page, "qi"));
  assert.equal((await logo.locator("h1").textContent()).trim(), "Dim Sum Den");
}));

// ---- Needs you ---------------------------------------------------------------------------------------------

test("Needs you: open with waiting requests, named with the count, count pill, eyebrow, title, code well, key hints, other rows with an age (criterion: Needs you contents, key hints visible)", { timeout: 90000 }, withApp({}, async ({ needs }) => {
  assert.match((await needs.getAttribute("aria-label")) ?? (await needs.evaluate((e) => e.getAttribute("aria-labelledby") && document.getElementById(e.getAttribute("aria-labelledby")).textContent)), /^Needs you(, 2 waiting)?/);
  assert.equal(await header(needs).getAttribute("aria-expanded"), "true", "open when at least 1 waits");
  assert.match(await header(needs).textContent(), /Needs you/);
  assert.match(await header(needs).textContent(), /\b2\b/, "count pill shows 2");
  const text = await needs.innerText();
  assert.match(text, /Tea · qa · .*02-verify-it/, "eyebrow: Station · role · ticket");
  assert.match(text, /02-verify-it.* wants merge approval/, "title: <id> wants <action>");
  assert.ok((await needs.locator("code, pre").count()) >= 1, "code preview well");
  const approve = needs.getByRole("button", { name: /^Approve/ });
  const deny = needs.getByRole("button", { name: /^Deny/ });
  await approve.waitFor({ state: "visible" });
  await deny.waitFor({ state: "visible" });
  const hint = (btn, key) => btn.evaluate((el, k) => [...el.querySelectorAll("*")].some((c) => c.children.length === 0 && c.textContent.trim() === k && c.getClientRects().length > 0), key);
  assert.equal(await hint(approve, "a"), true, "Approve shows key hint a");
  assert.equal(await hint(deny, "d"), true, "Deny shows key hint d");
  assert.match(text, /03-ship-it|ship-it/, "second waiting request is a row");
  assert.match(text, /\b2 min\b/, "relative time on the row");
  assert.doesNotMatch(text, /wants dispatch approval[\s\S]*Approve/, "only the first request has buttons");
}));

test("'a' approves and 'd' denies the top request when focus is on the card, through POST /requests (criterion: Approve/Deny respond to a/d)", { timeout: 90000 }, withApp({}, async ({ page, needs, posts }) => {
  await header(needs).focus();
  await page.keyboard.press("a");
  await expectPost(posts, { kind: "merge-approve", ref: "demo/02-verify-it" });
  posts.length = 0;
  await header(needs).focus();
  await page.keyboard.press("d");
  await expectPost(posts, { kind: "merge-reject", ref: "demo/02-verify-it" });
}));

test("typing 'a' or 'd' in the Note field is text, not a decision; 'm' moves focus to the Note field", { timeout: 90000 }, withApp({}, async ({ page, needs, posts }) => {
  await header(needs).focus();
  await page.keyboard.press("m");
  const note = needs.getByRole("textbox", { name: /note/i });
  assert.equal(await note.evaluate((el) => el === document.activeElement), true, "m focuses the Note field");
  await page.keyboard.type("add");
  assert.equal(await note.inputValue(), "add");
  await page.waitForTimeout(150);
  assert.deepEqual(posts, [], "nothing was filed while typing");
}));

test("'j' and 'k' step through the waiting requests; the next 'a' acts on the one shown", { timeout: 90000 }, withApp({}, async ({ page, needs, posts }) => {
  await header(needs).focus();
  assert.match(await needs.innerText(), /02-verify-it.* wants merge approval/);
  await page.keyboard.press("j");
  await needs.getByText(/ship-it.* wants dispatch approval/).first().waitFor({ state: "visible" });
  await page.keyboard.press("a");
  await expectPost(posts, { kind: "dispatch-approve", ref: "demo/03-ship-it" });
  await page.keyboard.press("k");
  await needs.getByText(/verify-it.* wants merge approval/).first().waitFor({ state: "visible" });
}));

test("card keys are card-scoped: 'a' does nothing from the scene or from inside the Tally dialog", { timeout: 90000 }, withApp({}, async ({ page, needs, posts }) => {
  assert.equal(await needs.getByRole("button", { name: /^Approve/ }).count(), 1, "precondition: the card is there with a request to act on");
  await page.locator('main[aria-label="Den scene"]').focus();
  await page.keyboard.press("a");
  await page.locator("button.chip-tally").click();
  await page.getByRole("dialog", { name: "Tally" }).waitFor({ state: "visible" });
  await page.keyboard.press("a");
  await page.keyboard.press("d");
  await page.waitForTimeout(200);
  assert.deepEqual(posts, [], "no request filed from outside the card");
}));

test("Needs you collapses and reopens from its header (aria-expanded flips, body hides); with nothing waiting it says so and shows no count (criterion: collapsible; empty state)", { timeout: 90000 }, async () => {
  const app = await openApp({});
  try {
    const { needs } = app;
    const approve = needs.getByRole("button", { name: /^Approve/ });
    await header(needs).click();
    assert.equal(await header(needs).getAttribute("aria-expanded"), "false");
    assert.equal(await approve.isVisible(), false, "collapsed body is hidden");
    await header(needs).click();
    assert.equal(await header(needs).getAttribute("aria-expanded"), "true");
    assert.equal(await approve.isVisible(), true);
  } finally {
    await app.context.close();
  }
  const quiet = await openApp({ snapshot: quietSnapshot() });
  try {
    if ((await header(quiet.needs).getAttribute("aria-expanded")) === "false") await header(quiet.needs).click();
    await quiet.needs.getByText("Nothing is waiting on you.").waitFor({ state: "visible" });
    assert.equal(await quiet.needs.getByRole("button", { name: /^Approve/ }).count(), 0);
    assert.doesNotMatch(await header(quiet.needs).textContent(), /\d/, "no count pill when nothing waits");
  } finally {
    await quiet.context.close();
  }
});

// ---- Stations & queue ----------------------------------------------------------------------------------------

test("Stations & queue is closed by default and opens from its header (criterion: collapsible, default closed)", { timeout: 90000 }, withApp({}, async ({ stations }) => {
  assert.equal(await header(stations).getAttribute("aria-expanded"), "false");
  assert.equal(await stations.locator('[data-station-pill="steamers"]').isVisible(), false);
  await header(stations).click();
  assert.equal(await header(stations).getAttribute("aria-expanded"), "true");
  await stations.locator('[data-station-pill="steamers"]').waitFor({ state: "visible" });
  await header(stations).click();
  assert.equal(await header(stations).getAttribute("aria-expanded"), "false");
}));

test("open stations: one pill each in order with name and count; a pill shows '· waiting' in lantern only when one of its pandas waits (criterion: waiting pill)", { timeout: 90000 }, withApp({}, async ({ page, stations }) => {
  await header(stations).click();
  const ids = await stations.locator("[data-station-pill]").evaluateAll((els) => els.map((e) => e.dataset.stationPill));
  assert.deepEqual(ids, ["pass", "steamers", "tea", "pantry", "front-of-house", "cubs", "library", "drum"]);
  const pill = (id) => stations.locator(`[data-station-pill="${id}"]`);
  assert.match(await pill("steamers").innerText(), /Steamers\s*1\b/);
  assert.match(await pill("pass").innerText(), /\bPass\b/);
  assert.match(await pill("pantry").innerText(), /Pantry\s*0\b/);
  assert.match(await pill("front-of-house").innerText(), /Front of House\s*1\b/);
  for (const id of ["tea", "front-of-house"]) {
    assert.match(await pill(id).innerText(), /·\s*waiting/, `${id} has a waiting panda`);
  }
  for (const id of ["pass", "steamers", "pantry"]) {
    assert.doesNotMatch(await pill(id).innerText(), /waiting/, `${id} has none waiting`);
  }
  const waitingText = pill("tea").getByText(/waiting/);
  assert.equal(await colourOf(waitingText), await token(page, "lantern"), "waiting is lantern");
  for (const id of ["pass", "steamers", "tea", "pantry", "front-of-house"]) {
    assert.equal(await pill(id).evaluate((e) => e.tagName), "BUTTON", `${id} pill is a button`);
  }
}));

test("dormant stations are dashed, non-interactive pills: Library and Drum 'coming online', Cubs 'N asleep' (criterion: dormant pills)", { timeout: 90000 }, withApp({}, async ({ stations }) => {
  await header(stations).click();
  const pill = (id) => stations.locator(`[data-station-pill="${id}"]`);
  assert.match(await pill("library").innerText(), /coming online/);
  assert.match(await pill("drum").innerText(), /coming online/);
  assert.match(await pill("cubs").innerText(), /\b1 asleep\b/, "one cub in the fixture");
  for (const id of ["cubs", "library", "drum"]) {
    const info = await pill(id).evaluate((e) => ({ tag: e.tagName, style: getComputedStyle(e).borderTopStyle, tabindex: e.getAttribute("tabindex") }));
    assert.equal(info.style, "dashed", `${id} border`);
    assert.notEqual(info.tag, "BUTTON");
    assert.equal(info.tabindex, null, `${id} is not a tab stop`);
  }
  assert.doesNotMatch(await pill("tea").innerText(), /coming online|asleep/);
}));

test("summary and queue: '5 open · N ready', 'Next on the susan', rows with a P-chip and title; an empty susan says so (criterion: Queue contents)", { timeout: 90000 }, async () => {
  const app = await openApp({});
  try {
    await header(app.stations).click();
    const text = await app.stations.innerText();
    assert.match(text, /5 open · 2 ready/);
    assert.match(text, /Next on the susan/i);
    assert.match(text, /P0[\s\S]*next-up/);
    assert.match(text, /P2[\s\S]*later-on/);
    assert.ok(text.indexOf("next-up") < text.indexOf("later-on"), "frontier order kept");
  } finally {
    await app.context.close();
  }
  const quiet = await openApp({ snapshot: quietSnapshot() });
  try {
    await header(quiet.stations).click();
    await quiet.stations.getByText("The susan is empty.").waitFor({ state: "visible" });
    assert.match(await quiet.stations.innerText(), /0 ready/);
  } finally {
    await quiet.context.close();
  }
});

test("clicking an open station pill zooms to that station (level 2 · Station becomes current)", { timeout: 90000 }, withApp({}, async ({ stations, zoom }) => {
  await header(stations).click();
  await stations.locator('[data-station-pill="tea"]').click();
  await zoom.getByRole("button", { name: "2 · Station" }).waitFor({ state: "visible" });
  assert.equal(await zoom.getByRole("button", { name: "2 · Station" }).getAttribute("aria-current"), "true");
  assert.ok((await zoomValue(zoom)) < 1, "closer than the Level 1 framing");
}));

// ---- Zoom switcher and free zoom -----------------------------------------------------------------------------

test("zoom switcher labels are exactly 1 · Den, 2 · Station, 3 · Panda, 4 · Workspace; Level 1 is current in qi; + and - have aria-labels (criterion: labels)", { timeout: 90000 }, withApp({}, async ({ page, zoom }) => {
  const nav = page.getByRole("navigation", { name: "Zoom level" });
  assert.equal(await nav.count(), 1);
  const levels = await zoom.locator("button").evaluateAll((bs) => bs.map((b) => b.textContent.trim()).filter((t) => /^\d ·/.test(t)));
  assert.deepEqual(levels, ["1 · Den", "2 · Station", "3 · Panda", "4 · Workspace"]);
  assert.equal(await zoom.getByRole("button", { name: "Zoom in" }).count(), 1);
  assert.equal(await zoom.getByRole("button", { name: "Zoom out" }).count(), 1);
  const den = zoom.getByRole("button", { name: "1 · Den" });
  assert.equal(await den.getAttribute("aria-current"), "true");
  assert.equal(await colourOf(den), await token(page, "qi"), "current level is qi");
  assert.equal(await colourOf(zoom.getByRole("button", { name: "2 · Station" })), await token(page, "ink-muted"));
  assert.equal(await zoomValue(zoom), 1, "starts at the Level 1 framing");
}));

test("clicking a level makes it current and dollies in (Level 3 is closer than Level 2, which is closer than Level 1)", { timeout: 90000 }, withApp({}, async ({ zoom }) => {
  await zoom.getByRole("button", { name: "2 · Station" }).click();
  const two = await zoomValue(zoom);
  assert.equal(await zoom.getByRole("button", { name: "2 · Station" }).getAttribute("aria-current"), "true");
  await zoom.getByRole("button", { name: "3 · Panda" }).click();
  const three = await zoomValue(zoom);
  assert.equal(await zoom.getByRole("button", { name: "3 · Panda" }).getAttribute("aria-current"), "true");
  assert.ok(three < two && two < 1, `levels dolly in: 1 > ${two} > ${three}`);
  assert.ok(three >= ZOOM_NEAREST, "within the clamp");
}));

test("+ and - buttons step the same zoom the wheel and keys use, and clamp at [0.55, 1.2] (scope 2026-10-01: clamp test)", { timeout: 90000 }, withApp({}, async ({ page, zoom }) => {
  const zin = zoom.getByRole("button", { name: "Zoom in" });
  const zout = zoom.getByRole("button", { name: "Zoom out" });
  await zin.click();
  const afterIn = await zoomValue(zoom);
  assert.ok(afterIn < 1, `Zoom in moves closer, got ${afterIn}`);
  await zout.click();
  assert.ok(near(await zoomValue(zoom), 1, 1e-6), "Zoom out undoes it");
  for (let i = 0; i < 40; i++) await zin.click();
  assert.ok(near(await zoomValue(zoom), ZOOM_NEAREST, 1e-6), `clamped at ${ZOOM_NEAREST}, got ${await zoomValue(zoom)}`);
  for (let i = 0; i < 40; i++) await zout.click();
  assert.ok(near(await zoomValue(zoom), ZOOM_FARTHEST, 1e-6), `clamped at ${ZOOM_FARTHEST}, got ${await zoomValue(zoom)}`);
  await page.locator('main[aria-label="Den scene"]').focus();
  await page.keyboard.press("+");
  assert.ok((await zoomValue(zoom)) < ZOOM_FARTHEST, "the + key moves the same zoom");
}));

test("scroll wheel over the scene zooms freely and clamps at both ends (scope 2026-10-01: wheel, clamp)", { timeout: 90000 }, withApp({}, async ({ page, zoom }) => {
  await page.mouse.move(DESKTOP.width / 2, DESKTOP.height / 2);
  await page.mouse.wheel(0, -200);
  const closer = await zoomValue(zoom);
  assert.ok(closer < 1 && closer >= ZOOM_NEAREST, `wheel up zooms in: ${closer}`);
  await page.mouse.wheel(0, -100000);
  await page.waitForTimeout(100);
  assert.ok(near(await zoomValue(zoom), ZOOM_NEAREST, 1e-6), "a huge scroll in stops at the nearest limit");
  await page.mouse.wheel(0, 100000);
  await page.waitForTimeout(100);
  assert.ok(near(await zoomValue(zoom), ZOOM_FARTHEST, 1e-6), "a huge scroll out stops at the farthest limit");
}));

test("two-finger pinch zooms: spreading the fingers moves closer, pinching in moves back, both clamped (scope 2026-10-01: pinch)", { timeout: 90000 }, async () => {
  const app = await openApp({ hasTouch: true });
  try {
    const { page, context, zoom } = app;
    const cdp = await context.newCDPSession(page);
    const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map((p, id) => ({ x: p[0], y: p[1], id })) });
    const cx = DESKTOP.width / 2;
    const cy = DESKTOP.height / 2 - 100;
    const gesture = async (from, to) => {
      await touch("touchStart", [[cx - from, cy], [cx + from, cy]]);
      for (let i = 1; i <= 10; i++) {
        const d = from + ((to - from) * i) / 10;
        await touch("touchMove", [[cx - d, cy], [cx + d, cy]]);
      }
      await touch("touchEnd", []);
    };
    const start = await zoomValue(zoom);
    await gesture(40, 200);
    const spread = await zoomValue(zoom);
    assert.ok(spread < start && spread >= ZOOM_NEAREST, `spread zooms in: ${start} to ${spread}`);
    await gesture(300, 20);
    const pinched = await zoomValue(zoom);
    assert.ok(pinched > spread && pinched <= ZOOM_FARTHEST, `pinch zooms out: ${spread} to ${pinched}`);
    assert.equal(await page.locator('main[aria-label="Den scene"]').evaluate((el) => getComputedStyle(el).touchAction), "none", "the browser leaves the gesture to the scene");
  } finally {
    await app.context.close();
  }
});

// ---- Intent bar and timeline ---------------------------------------------------------------------------------

test("intent bar: autonomy toggle, input with the exact placeholder, Ctrl K hint, Send, and a 'Current intent' pill above (criterion: placeholder)", { timeout: 90000 }, withApp({}, async ({ page, intent }) => {
  const input = intent.getByPlaceholder("Give the den an intent…");
  assert.equal(await input.count(), 1);
  assert.equal(await input.getAttribute("placeholder"), "Give the den an intent…");
  assert.ok((await intent.getByRole("button", { name: /utonomy/ }).count()) >= 1, "autonomy toggle");
  assert.equal(await intent.getByRole("button", { name: /^Send/ }).count(), 1);
  assert.ok((await intent.getByText("Ctrl K").count()) >= 1, "Ctrl K hint");
  const label = intent.getByText(/Current intent/i).first();
  await label.waitFor({ state: "visible" });
  const [l, i] = await Promise.all([label.boundingBox(), input.boundingBox()]);
  assert.ok(l.y + l.height <= i.y + 1, "the Current intent pill sits above the input");
}));

test("timeline: Live, a time, and the replay caption", { timeout: 90000 }, withApp({}, async ({ timeline }) => {
  const text = await timeline.innerText();
  assert.match(text, /Live/);
  assert.match(text, /\b\d{1,2}:\d{2}\b/);
  assert.match(text, /Drag back to replay the den's history/);
}));

// ---- Phone width -----------------------------------------------------------------------------------------------

test("phone (390 px): cards stack under the logo pill at full width less the gutters, start collapsed, opening one closes the other; zoom switcher and timeline hide; intent bar spans 100vw - 32px", { timeout: 90000 }, async () => {
  const app = await openApp({ viewport: PHONE });
  try {
    const { needs, stations, logo, zoom, timeline, intent } = app;
    assert.equal(await header(needs).getAttribute("aria-expanded"), "false", "collapsed with no selected panda");
    assert.equal(await header(stations).getAttribute("aria-expanded"), "false");
    const [l, n, s, i] = await Promise.all([logo, needs, stations, intent].map((x) => x.boundingBox()));
    assert.ok(near(n.x, 16) && near(n.width, PHONE.width - 32), `needs ${JSON.stringify(n)}`);
    assert.ok(n.y >= l.y + l.height - 1, "Needs you sits under the logo pill");
    assert.ok(s.y >= n.y + n.height - 1 && near(s.x, 16) && near(s.width, PHONE.width - 32), `stations ${JSON.stringify(s)}`);
    assert.ok(near(i.x, 16) && near(i.width, PHONE.width - 32), `intent ${JSON.stringify(i)}`);
    assert.equal(await zoom.isVisible(), false, "zoom switcher hides on phone");
    assert.equal(await timeline.isVisible(), false, "timeline hides on phone");
    await header(needs).click();
    assert.equal(await header(needs).getAttribute("aria-expanded"), "true");
    await header(stations).click();
    assert.equal(await header(stations).getAttribute("aria-expanded"), "true");
    assert.equal(await header(needs).getAttribute("aria-expanded"), "false", "opening one closes the other");
  } finally {
    await app.context.close();
  }
});

// ---- Keyboard, focus ring, accessible names, den words ---------------------------------------------------------

test("every control is keyboard-reachable in the digest tab order with a 2px focus-ring outline at 2px offset (criterion: keyboard, focus ring)", { timeout: 120000 }, async () => {
  const app = await openApp({});
  try {
    const { page, needs, stations } = app;
    if ((await header(stations).getAttribute("aria-expanded")) === "false") await header(stations).click();
    assert.equal(await header(needs).getAttribute("aria-expanded"), "true");
    const ring = await token(page, "focus-ring");
    // Interactive elements that must be reachable, in the overlays.
    const unreachable = await page.evaluate(() =>
      [...document.querySelectorAll('[data-overlay] :is(button, a[href], input, textarea, select, [role="slider"])')]
        .filter((e) => e.getClientRects().length > 0 && (e.tabIndex < 0 || e.disabled))
        .map((e) => e.outerHTML.slice(0, 80)));
    assert.deepEqual(unreachable, [], "no visible control is removed from the tab order");
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    const seen = [];
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const a = document.activeElement;
        const cs = getComputedStyle(a);
        return {
          overlay: a.closest("[data-overlay]")?.dataset.overlay ?? null,
          text: (a.getAttribute("aria-label") ?? a.textContent ?? "").trim().slice(0, 30),
          width: cs.outlineWidth, style: cs.outlineStyle, offset: cs.outlineOffset, color: cs.outlineColor,
        };
      });
      seen.push(info);
    }
    const overlaySeq = [];
    for (const s of seen) if (s.overlay && overlaySeq.at(-1) !== s.overlay) overlaySeq.push(s.overlay);
    const first = (name) => overlaySeq.indexOf(name);
    for (const name of ["needs-you", "stations", "zoom", "intent"]) assert.ok(first(name) >= 0, `${name} is reachable by Tab; saw ${overlaySeq}`);
    assert.ok(first("needs-you") < first("stations") && first("stations") < first("zoom") && first("zoom") < first("intent"), `tab order Needs you, Stations, zoom, intent; saw ${overlaySeq}`);
    const labels = seen.filter((s) => s.overlay === "zoom").map((s) => s.text);
    for (const want of ["1 · Den", "2 · Station", "3 · Panda", "4 · Workspace", "Zoom in", "Zoom out"]) assert.ok(labels.includes(want), `Tab reaches ${want}`);
    const inCards = seen.filter((s) => s.overlay);
    assert.ok(inCards.length >= 10, `walked ${inCards.length} overlay stops`);
    for (const s of inCards) {
      assert.equal(s.width, "2px", `${s.overlay} "${s.text}" outline width`);
      assert.equal(s.style, "solid", `${s.overlay} "${s.text}" outline style`);
      assert.equal(s.offset, "2px", `${s.overlay} "${s.text}" outline offset`);
      assert.equal(s.color, ring, `${s.overlay} "${s.text}" outline colour is focus-ring`);
    }
  } finally {
    await app.context.close();
  }
});

// Stand-in for axe (not a dependency; adding one is a security gate): the rules axe would flag on these
// overlays, checked through Playwright's accessibility tree and the DOM.
test("accessibility basics: every button, link and field has a name, ids are unique, landmarks are named, aria-controls resolve, and den words only (criterion: axe finds no serious issues; den words)", { timeout: 90000 }, withApp({}, async ({ page, stations }) => {
  await header(stations).click();
  const tree = await page.locator("body").ariaSnapshot();
  const unnamed = tree.split("\n").filter((line) => /^\s*- (button|link|textbox|slider|combobox|checkbox|switch)\b/.test(line) && !/^\s*- \w+ "/.test(line));
  assert.deepEqual(unnamed, [], "controls without an accessible name");
  const dom = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    const broken = [...document.querySelectorAll("[aria-controls]")].filter((e) => !document.getElementById(e.getAttribute("aria-controls"))).map((e) => e.outerHTML.slice(0, 80));
    const unnamedRegions = [...document.querySelectorAll('section, nav, [role="region"]')].filter((e) => !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby")).map((e) => e.outerHTML.slice(0, 80));
    const words = /\b(organism|organ|cell|cells|genome|apoptosis|endocrine)\b/i;
    const biology = [...document.querySelectorAll("[data-overlay]")].flatMap((root) => [root, ...root.querySelectorAll("*")])
      .flatMap((e) => [e.getAttribute("aria-label"), e.children.length === 0 ? e.textContent : null, e.getAttribute("placeholder")])
      .filter((t) => t && words.test(t));
    return { dupes, broken, unnamedRegions, biology, h1: document.querySelectorAll("h1").length };
  });
  assert.deepEqual(dom.dupes, [], "duplicate ids");
  assert.deepEqual(dom.broken, [], "aria-controls pointing nowhere");
  assert.deepEqual(dom.unnamedRegions, [], "landmarks need a name");
  assert.deepEqual(dom.biology, [], "no biology words in visible labels");
  assert.equal(dom.h1, 1, "one h1");
}));

async function expectPost(posts, want) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && posts.length === 0) await new Promise((r) => setTimeout(r, 50));
  assert.equal(posts.length, 1, `exactly one POST /requests, got ${JSON.stringify(posts)}`);
  assert.equal(posts[0].kind, want.kind);
  assert.equal(posts[0].ref, want.ref);
}
