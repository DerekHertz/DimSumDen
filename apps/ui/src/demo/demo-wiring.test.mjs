// den-v1/09: Demo mode makes no request and reads no token (AC 4), plus the wiring and copy the controller tests cannot see.
// Layout, motion, contrast, focus staying on the button, the badge and strip look are human-verified (no browser-measurement tests).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createDemoMode } from "./demo-mode.mjs";
import { createDemoReplay } from "./demo-replay.mjs";
import { demoCard } from "./demo-card.mjs";
import { DEMO_FIXTURE } from "./demo-fixture.mjs";
import { createApprovalReview } from "../overlay/approval-review.mjs";
import { createMessageComposer } from "../overlay/message-composer.mjs";
import { clock, cardsOf } from "./demo-test-helpers.mjs";

const here = new URL("./", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const demoSources = () => readdirSync(here).filter((f) => /\.(mjs|js|jsx)$/.test(f) && !/\.test\.|test-helpers/.test(f)).map((f) => read(`./${f}`)).join("\n");
const uiSources = () => ["../App.jsx", ...readdirSync(new URL("../overlay/", import.meta.url)).filter((f) => f.endsWith(".jsx")).map((f) => `../overlay/${f}`)].map(read).join("\n");

describe("no request, no token", () => {
  test("the demo modules contain no network or credential primitive and do not import the session or bridge client", () => {
    const src = demoSources();
    assert.ok(src.length > 0, "no demo modules yet");
    assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|EventSource|WebSocket|sendBeacon|Bearer|localStorage|sessionStorage/);
    assert.doesNotMatch(src, /from\s+["'][^"']*(session|bridge-client)[^"']*["']/);
  });

  test("a whole demo run (enter, two loops, cards, R, T, E, Q, leave) touches no network global, storage or bridge client", () => {
    const touched = [];
    const names = ["fetch", "EventSource", "WebSocket", "XMLHttpRequest", "sessionStorage", "localStorage"];
    const saved = new Map(names.map((n) => [n, Object.getOwnPropertyDescriptor(globalThis, n)]));
    for (const n of names) Object.defineProperty(globalThis, n, { configurable: true, get() { touched.push(n); throw new Error(`demo touched ${n}`); } });
    const calls = [];
    const client = { getApproval() { calls.push("getApproval"); throw new Error("bridge"); }, decide() { calls.push("decide"); throw new Error("bridge"); }, sendMessage() { calls.push("sendMessage"); throw new Error("bridge"); } };
    try {
      const c = clock();
      const loc = { pathname: "/", search: "", hash: "" };
      const history = { replaceState(_s, _t, url) { const u = new URL(String(url), "http://den.test/"); loc.pathname = u.pathname; loc.search = u.search; } };
      const mode = createDemoMode({ location: loc, history, replay: createDemoReplay({ now: c.now }) });
      const review = createApprovalReview({ client, now: c.now, hooks: {} });
      const composer = createMessageComposer({ client, hooks: {} });
      mode.enter();
      for (let ms = 0; ms < DEMO_FIXTURE.loopMs * 2; ms += 500) {
        c.at(ms); mode.tick();
        const { snapshot, transcripts } = mode.getState();
        for (const card of cardsOf(snapshot).map((x) => demoCard(x, { transcripts }))) {
          assert.equal(review.open(card, { mode: "walk", demo: true }).opened, false);
          assert.equal(composer.open(card, { mode: "walk", demo: true }).opened, false);
          review.key({ key: "e" }, { card, mode: "walk", demo: true });
          composer.key({ key: "t" }, { card, mode: "walk", demo: true });
        }
      }
      mode.leave();
    } finally {
      for (const [n, d] of saved) { if (d) Object.defineProperty(globalThis, n, d); else delete globalThis[n]; }
    }
    assert.deepEqual(touched, []);
    assert.deepEqual(calls, []);
  });
});

describe("wiring and copy", () => {
  test("App builds Demo mode from the demo module, shows the replayed transcripts, and routes cards through demoCard", () => {
    const app = read("../App.jsx");
    assert.match(app, /demo\/demo-mode|useDemoMode/);
    assert.doesNotMatch(app, /<TranscriptPanel[^>]*transcripts=\{live\.transcripts\}/, "Demo R would open an empty live buffer");
    assert.match(app + read("../scene/procedural/RestaurantDen.jsx"), /demoCard/);
  });
  test("the control, the strip and the polite announcement exist with the signed-off copy", () => {
    const src = uiSources() + demoSources();
    for (const text of ["Watch the demo", "Leave demo", "Demo mode · recorded events, looping", "Demo mode on. Playing recorded events.", "Demo mode off. Showing the live den.", "Demo mode: no transcript recorded", "Demo mode: actions are off"]) {
      assert.ok(src.includes(text), `missing: ${text}`);
    }
    assert.match(src, /aria-live=["']polite["']/);
  });
  test("the existing ?demo=handoff stays", () => {
    assert.match(read("../handoff-state.js"), /"handoff"/);
  });
});
