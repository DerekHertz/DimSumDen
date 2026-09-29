// showcase-v1/03: the board face is a pure view-model over dashboardModel (small charts, chalk layout).
// "Spills" replaces "incidents" on the face only; the panel Dashboard keeps its own wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD_LABEL, BOARD_ARIA_LABEL, boardFace } from "./board-face.mjs";
import { dashboardModel } from "../panel/dashboard-model.mjs";
import { TODAYS_BOARD, CUB_BASKET, CUB_BASKET_RADIUS, STALL_CENTERS, stallCenterX, stallWidth, placeCell, counterTop } from "./banquet-layout.mjs";

const metrics = {
  throughput: { windows: Array.from({ length: 14 }, (_, i) => ({ start: `2026-09-${10 + i}T00:00:00Z`, resolved: i })) },
  tokensByCell: { developer: { perTicket: 90000 }, qa: { perTicket: 30000 }, scout: { perTicket: 5000 } },
  incidentsByTool: { Bash: { perTicket: 2 }, Read: { perTicket: 1 }, Edit: { perTicket: 0.5 } },
};
const face = boardFace(dashboardModel(metrics));

test("the board is labelled Today's board, with an accessible name that says it opens the dashboard", () => {
  assert.equal(BOARD_LABEL, "Today's board");
  assert.match(BOARD_ARIA_LABEL, /^Today's board/);
  assert.match(BOARD_ARIA_LABEL, /dashboard/i);
  assert.equal(face.title, "Today's board");
});

test("three small charts, in dashboard order, incidents read as spills", () => {
  assert.deepEqual(face.charts.map((c) => c.id), ["throughput", "tokens", "incidents"]);
  assert.deepEqual(face.charts.map((c) => c.title), ["Resolved", "Tokens", "Spills"]);
  const all = [face.title, ...face.charts.flatMap((c) => [c.title, c.emptyText ?? "", ...c.bars.flatMap((b) => [b.label, b.valueText])])].join(" ").toLowerCase();
  assert.ok(!all.includes("incident"), "no 'incident' text on the board face");
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
  const many = boardFace(dashboardModel({ tokensByCell: Object.fromEntries("abcdef".split("").map((k, i) => [k, { perTicket: 10 - i }])) }));
  assert.equal(many.charts[1].bars.length, 4);
});

test("no data: every chart is empty and says so; nothing throws", () => {
  const empty = boardFace(dashboardModel(null));
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

// Placement (ADR 0013: Today's board stands front right). Sight lines use the default camera (0, 4.2, 11.5).
test("the board stands front right, inside the default view, clear of the cub basket and cub row", () => {
  const half = TODAYS_BOARD.width / 2;
  assert.ok(TODAYS_BOARD.x > 0 && TODAYS_BOARD.z > CUB_BASKET.z);
  assert.ok(TODAYS_BOARD.x - half >= CUB_BASKET_RADIUS + 0.5);
  const cubRowEdge = Math.abs(placeCell("mystery", 2, 3).x) + 0.35; // three cubs
  assert.ok(TODAYS_BOARD.x - half >= cubRowEdge + 0.4);
});

test("the board stays clear of the Pantry stall at its widest plausible size (six cells)", () => {
  const pantryFront = STALL_CENTERS.pantry.z + 0.5;
  assert.ok(TODAYS_BOARD.z - TODAYS_BOARD.depth / 2 - pantryFront >= 0.8);
  assert.ok(stallCenterX("pantry", 6) - stallWidth(6) / 2 > 0, "pantry stays right of centre");
});

test("the slate hangs high enough that the sight line to the Pantry's cells passes under it", () => {
  const cam = { x: 0, y: 4.2, z: 11.5 };
  const headY = counterTop("pantry") + 0.6;
  const tz = STALL_CENTERS.pantry.z;
  for (const slot of [0, 1, 2]) {
    const tx = placeCell("security", slot).x;
    const f = (cam.z - TODAYS_BOARD.z) / (cam.z - tz);
    const x = cam.x + f * (tx - cam.x);
    const y = cam.y + f * (headY - cam.y);
    if (Math.abs(x - TODAYS_BOARD.x) <= TODAYS_BOARD.width / 2) {
      assert.ok(y <= TODAYS_BOARD.faceBottom - 0.05, `slot ${slot}: sight line y ${y.toFixed(2)} meets the slate (bottom ${TODAYS_BOARD.faceBottom})`);
    }
  }
});

test("wiring: the board is a keyboard-reachable chip and a clickable mesh that opens the dashboard", async () => {
  const { readFileSync } = await import("node:fs");
  const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
  const chips = read("./ChipLayer.jsx");
  assert.match(chips, /BOARD_ARIA_LABEL/);
  assert.match(chips, /onOpenBoard/);
  assert.match(read("./BoardFace.jsx"), /onClick/);
  const app = read("../App.jsx");
  assert.match(app, /onOpenBoard=\{openDashboard\}/);
  assert.match(app, /useMetrics/);
});
