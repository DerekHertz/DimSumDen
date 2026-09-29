// Ticket showcase-v1/01 fix round: camera pan (x only) and zoom limits. Pure clamp and step math.
// Expected values are hand-worked literals from the limits (pan +-5, zoom 0.55..1.2, key step 0.5).
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./camera-rig.mjs");

test("limits are the agreed literals", async () => {
  const { PAN_LIMIT, ZOOM_MIN, ZOOM_MAX } = await load();
  assert.equal(PAN_LIMIT, 5);
  assert.equal(ZOOM_MIN, 0.55);
  assert.equal(ZOOM_MAX, 1.2);
});

test("clampPan holds x within +-5", async () => {
  const { clampPan } = await load();
  assert.equal(clampPan(0), 0);
  assert.equal(clampPan(3.2), 3.2);
  assert.equal(clampPan(9), 5);
  assert.equal(clampPan(-9), -5);
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
  assert.equal(keyPan(4.8, "ArrowRight"), 5);
  assert.equal(keyPan(-5, "ArrowLeft"), -5);
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
  assert.equal(dragPan(4.5, -1000, 1000, 1), 5);
});

test("cameraPosition: x is the pan, y fixed, z is 11.5 times the zoom factor", async () => {
  const { cameraPosition } = await load();
  assert.deepEqual(cameraPosition(2, 0.5), [2, 4.2, 5.75]);
});
