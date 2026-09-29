// Ticket showcase-v1/01 fix round: camera pan (x only) and zoom limits. Pure clamp and step math.
// Expected values are hand-worked literals from the limits (pan +-9, zoom 0.55..1.2, key step 0.5).
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./camera-rig.mjs");

test("limits are the agreed literals", async () => {
  const { PAN_LIMIT, ZOOM_MIN, ZOOM_MAX } = await load();
  assert.equal(PAN_LIMIT, 9);
  assert.equal(ZOOM_MIN, 0.55);
  assert.equal(ZOOM_MAX, 1.2);
});

test("clampPan holds x within +-9", async () => {
  const { clampPan } = await load();
  assert.equal(clampPan(0), 0);
  assert.equal(clampPan(3.2), 3.2);
  assert.equal(clampPan(12), 9);
  assert.equal(clampPan(-12), -9);
});

test("clampZoom holds the factor within 0.55..1.2", async () => {
  const { clampZoom } = await load();
  assert.equal(clampZoom(1), 1);
  assert.equal(clampZoom(0.1), 0.55);
  assert.equal(clampZoom(3), 1.2);
});

test("keyPan steps by 0.5 and stops at the edge; other keys do nothing", async () => {
  const { keyPan } = await load();
  assert.equal(keyPan(0, "ArrowRight"), 0.5);
  assert.equal(keyPan(0, "ArrowLeft"), -0.5);
  assert.equal(keyPan(8.8, "ArrowRight"), 9);
  assert.equal(keyPan(-9, "ArrowLeft"), -9);
  assert.equal(keyPan(1, "ArrowUp"), 1);
});

test("keyZoom: plus zooms in (smaller factor), minus zooms out, clamped", async () => {
  const { keyZoom } = await load();
  assert.equal(keyZoom(1, "+"), 0.9);
  assert.equal(keyZoom(1, "="), 0.9);
  assert.equal(keyZoom(1, "-"), 1.1);
  assert.equal(keyZoom(0.6, "+"), 0.55);
  assert.equal(keyZoom(1.15, "-"), 1.2);
  assert.equal(keyZoom(1, "a"), 1);
});

test("wheelZoom: scrolling down (positive deltaY) zooms out, up zooms in, clamped", async () => {
  const { wheelZoom } = await load();
  assert.equal(wheelZoom(1, 100), 1.1);
  assert.equal(wheelZoom(1, -100), 0.9);
  assert.equal(wheelZoom(1, 100000), 1.2);
  assert.equal(wheelZoom(1, -100000), 0.55);
});

test("dragPan: dragging right moves the camera left, scaled by zoom, clamped", async () => {
  const { dragPan } = await load();
  // 100 px at 1000 px wide, zoom 1: 100/1000 * 12 = 1.2 world units, opposite the drag
  assert.ok(Math.abs(dragPan(0, 100, 1000, 1) + 1.2) < 1e-9);
  assert.ok(Math.abs(dragPan(0, -100, 1000, 0.5) - 0.6) < 1e-9);
  assert.equal(dragPan(8.5, -1000, 1000, 1), 9);
});

test("cameraPosition: x is the pan, y fixed, z is 11.5 times the zoom factor", async () => {
  const { cameraPosition } = await load();
  assert.deepEqual(cameraPosition(2, 0.5), [2, 4.2, 5.75]);
});

// showcase-v1/04: the pan limit follows the viewport so the widest stall's outer edge stays reachable.
// Worked by hand: half-width at the stall row = (11.5 * zoom + 1.6) * tan(19 deg) * aspect, and the
// widest stall (12 cells, steamers) ends at x = 8.175 + 4.5 = 12.675, so limit = max(0, 12.675 - half-width).
test("panLimit: narrow window pans further than a wide one", async () => {
  const { panLimit } = await load();
  assert.ok(Math.abs(panLimit(1, 1) - 8.1642) < 1e-3);
  assert.ok(Math.abs(panLimit(0.5, 1) - 10.4196) < 1e-3);
  assert.equal(panLimit(3, 1), 0);
});

test("panLimit: zoomed in pans further than zoomed out", async () => {
  const { panLimit } = await load();
  assert.ok(Math.abs(panLimit(1.5, 0.55) - 8.5815) < 1e-3);
  assert.ok(Math.abs(panLimit(1.5, 1.2) - 4.721) < 1e-3);
});

test("panLimit: the widest stall's outer edge is always inside the view at the limit", async () => {
  const { panLimit, visibleHalfWidth, WIDEST_STALL_EDGE } = await load();
  assert.ok(Math.abs(WIDEST_STALL_EDGE - 12.675) < 1e-9);
  for (const aspect of [0.4, 0.8, 1.3, 1.8, 2.4, 3.5]) {
    for (const zoom of [0.55, 0.8, 1, 1.2]) {
      const limit = panLimit(aspect, zoom);
      assert.ok(limit >= 0);
      assert.ok(limit + visibleHalfWidth(aspect, zoom) >= WIDEST_STALL_EDGE - 1e-9, `aspect ${aspect} zoom ${zoom}`);
    }
  }
});

test("clampPan, keyPan and dragPan take an optional limit", async () => {
  const { clampPan, keyPan, dragPan } = await load();
  assert.equal(clampPan(7, 3), 3);
  assert.equal(clampPan(-7, 3), -3);
  assert.equal(keyPan(2.8, "ArrowRight", 3), 3);
  assert.equal(dragPan(0, -10000, 1000, 1, 3), 3);
  assert.equal(clampPan(7, 0), 0);
});

test("MAX_STALL_CELLS matches the scene's cell cap", async () => {
  const { MAX_STALL_CELLS } = await import("./banquet-layout.mjs");
  const { MAX_PLUSH } = await import("./scene-from-state.mjs");
  assert.equal(MAX_STALL_CELLS, MAX_PLUSH);
});
