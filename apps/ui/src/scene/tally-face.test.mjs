// showcase-v1/03: the tally face is a pure view-model over dashboardModel (small charts, chalk layout).
// "Spills" replaces "incidents" on the face only; the panel Dashboard keeps its own wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TALLY_LABEL, TALLY_ARIA_LABEL, tallyFace } from "./tally-face.mjs";
import { dashboardModel } from "../panel/dashboard-model.mjs";
import { TALLY, CUB_BASKET, CUB_BASKET_RADIUS, STALL_CENTERS, stallCenterX, stallWidth, placeCell, counterTop } from "./banquet-layout.mjs";

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


// Placement: Tally stands beside Bao, between him and the table and the back-right stall (Front of House).
// Footprints are boxes {x0, x1, z0, z1}; the posts and roof are inside x +- (width / 2 + 0.15).
const box = (cx, cz, w, d) => ({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
const tally = box(TALLY.x, TALLY.z, TALLY.width + 0.3, TALLY.depth + 0.3);
const gap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));

test("Tally is clear of Bao, his shoulder cells, the table, the Steamers and Tea stalls and the cub basket", () => {
  const bao = box(0, -2.4, 2 * 1.37 + 2 * 0.6, 1.75 * 1.4); // body plus shoulder cells (outer edge 2.24)
  assert.ok(gap(tally, bao) >= 1.0, `Bao gap ${gap(tally, bao)}`);
  const nearest = { x: tally.x1, z: Math.max(tally.z0, Math.min(0, tally.z1)) };
  assert.ok(Math.hypot(nearest.x, nearest.z) - 1.8 >= 0.15, "table top radius 1.8");
  for (const [station, count] of [["steamers", 6], ["tea", 6]]) {
    const c = STALL_CENTERS[station];
    const stall = box(stallCenterX(station, count), c.z, stallWidth(count) + 0.3, 1.3);
    assert.ok(gap(tally, stall) >= 0.45, `${station} gap ${gap(tally, stall)}`);
  }
  assert.ok(Math.hypot(TALLY.x - CUB_BASKET.x, TALLY.z - CUB_BASKET.z) - CUB_BASKET_RADIUS >= 1.5);
});

test("Tally sits left of Bao between the table and the back-left Steamers stall in x, and between the Steamers and Tea rows in z", () => {
  assert.ok(TALLY.x < -1.8 && TALLY.x > STALL_CENTERS.steamers.x);
  assert.ok(TALLY.z > STALL_CENTERS.steamers.z && TALLY.z < STALL_CENTERS.tea.z);
});

test("the slate hangs high enough that the sight line from the default camera to Steamers cells passes under it", () => {
  const cam = { x: 0, y: 4.2, z: 11.5 };
  const headY = counterTop("steamers") + 0.6;
  const tz = STALL_CENTERS.steamers.z;
  let checked = 0;
  for (const slot of [0, 1, 2]) {
    const tx = placeCell("developer", slot).x;
    const f = (cam.z - TALLY.z) / (cam.z - tz);
    const x = cam.x + f * (tx - cam.x);
    const y = cam.y + f * (headY - cam.y);
    if (Math.abs(x - TALLY.x) <= TALLY.width / 2 + 0.15) {
      checked++;
      assert.ok(y <= TALLY.faceBottom - 0.05, `slot ${slot}: sight line y ${y.toFixed(2)} meets the slate (bottom ${TALLY.faceBottom})`);
    }
  }
  assert.ok(checked > 0, "at least one cell is behind the slate, so the check bites");
});

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
