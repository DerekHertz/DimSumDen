// showcase-v1/03: the tally face is a pure view-model over dashboardModel (small charts, chalk layout).
// "Spills" replaces "incidents" on the face only; the panel Dashboard keeps its own wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TALLY_LABEL, TALLY_ARIA_LABEL, tallyFace } from "./tally-face.mjs";
import { dashboardModel } from "../panel/dashboard-model.mjs";

const metrics = {
  throughput: { windows: Array.from({ length: 14 }, (_, i) => ({ start: `2026-09-${10 + i}T00:00:00Z`, resolved: i })) },
  tokensByCell: { developer: { perTicket: 90000 }, qa: { perTicket: 30000 }, scout: { perTicket: 5000 } },
  incidentsByTool: { Bash: { perTicket: 2 }, Read: { perTicket: 1 }, Edit: { perTicket: 0.5 } },
};
const face = tallyFace(dashboardModel(metrics));

test("Tally is labelled Tally, with an accessible name that says it opens the dashboard", () => {
  assert.equal(TALLY_LABEL, "Tally");
  assert.match(TALLY_ARIA_LABEL, /^Tally/);
  assert.match(TALLY_ARIA_LABEL, /dashboard/i);
  assert.equal(face.title, "Tally");
});

test("three small charts, in dashboard order, incidents read as spills", () => {
  assert.deepEqual(face.charts.map((c) => c.id), ["throughput", "tokens", "incidents"]);
  assert.deepEqual(face.charts.map((c) => c.title), ["Resolved", "Tokens", "Spills"]);
  const all = [face.title, ...face.charts.flatMap((c) => [c.title, c.emptyText ?? "", ...c.bars.flatMap((b) => [b.label, b.valueText])])].join(" ").toLowerCase();
  assert.ok(!all.includes("incident"), "no 'incident' text on the tally face");
});

test("bars carry the model's fractions; vertical shows the last 8 windows, horizontal the top 4", () => {
  const [throughput, tokens, spills] = face.charts;
  assert.equal(throughput.orientation, "vertical");
  assert.equal(throughput.bars.length, 8);
  assert.equal(throughput.bars.at(-1).fraction, 1);
  assert.equal(tokens.orientation, "horizontal");
  assert.deepEqual(tokens.bars.map((b) => b.label), ["developer", "qa", "scout"]);
  assert.equal(tokens.bars[0].fraction, 1);
  assert.ok(Math.abs(tokens.bars[1].fraction - 1 / 3) < 1e-9);
  assert.deepEqual(spills.bars.map((b) => b.valueText), ["2", "1", "0.5"]);
  const many = tallyFace(dashboardModel({ tokensByCell: Object.fromEntries("abcdef".split("").map((k, i) => [k, { perTicket: 10 - i }])) }));
  assert.equal(many.charts[1].bars.length, 4);
});

test("no data: every chart is empty and says so; nothing throws", () => {
  const empty = tallyFace(dashboardModel(null));
  assert.ok(empty.charts.every((c) => c.empty && c.bars.length === 0 && c.emptyText === "No data yet"));
});

test("chart panels sit inside the face, side by side, and never overlap", () => {
  const rects = face.charts.map((c) => c.rect);
  for (const r of rects) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 && r.y + r.h <= 1, JSON.stringify(r));
    assert.ok(r.w > 0.2 && r.h > 0.4);
  }
  for (let i = 0; i < rects.length - 1; i++) assert.ok(rects[i].x + rects[i].w <= rects[i + 1].x, "panels do not overlap");
  assert.ok(face.titleRect.y + face.titleRect.h <= Math.min(...rects.map((r) => r.y)), "title above the panels");
});


// Stele placement and face colours are covered in tally-stele.test.mjs.

test("wiring: Tally is a keyboard-reachable chip and a clickable mesh that opens the dashboard without scrolling the page", async () => {
  const { readFileSync } = await import("node:fs");
  const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
  const chips = read("./ChipLayer.jsx");
  assert.match(chips, /TALLY_ARIA_LABEL/);
  assert.match(chips, /onOpenTally/);
  assert.match(read("./TallyFace.jsx"), /onClick/);
  const app = read("../App.jsx");
  assert.match(app, /onOpenTally=\{openDashboard\}/);
  assert.match(app, /useMetrics/);
  assert.doesNotMatch(app, /scrollIntoView/, "the page must never scroll");
  assert.match(app, /preventScroll: true/);
  assert.doesNotMatch(read("../styles.css") + chips + app, /Today's board/);
});
