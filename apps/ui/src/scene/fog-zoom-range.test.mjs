// den-scene-v1/07 (haze fix round): the grove fog must start beyond the market wherever the 07 controls can put the
// camera. grove.test.mjs checks the fog against the zoom and pan limits of two viewports; this one drives the real
// camera store (wheel, pinch, + and -, the level switcher, the station pills) the way the rig does (clampTarget each
// frame) over a wider spread of canvas sizes, since 07 makes the canvas the whole window. The market points come from
// the shared fixture; the camera comes from cameraConfig, never a literal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCameraStore } from "./camera-store.mjs";
import { clampTarget, pinchZoom, wheelZoom } from "./camera-rig.mjs";
import { STALL_CENTERS } from "./banquet-layout.mjs";
import { cameraConfig } from "./iso-projection.mjs";
import { FOG_NEAR } from "./grove.mjs";
import { marketPoints } from "./market-extent.fixture.mjs";

const SIZES = [[320, 480], [375, 667], [768, 1024], [1440, 900], [1920, 1080], [2560, 1440]];

/** Every goal the controls can set: the store after each kind of input, at its extremes. */
function goals() {
  const out = [];
  const take = (s) => out.push({ zoom: s.getZoom(), target: [...s.getTarget()] });
  for (const delta of [-1e6, -300, 0, 300, 1e6]) {
    const s = createCameraStore();
    s.setZoom(wheelZoom(s.getZoom(), delta));
    take(s);
  }
  for (const spread of [1e-6, 0.2, 5, 1e6]) {
    const s = createCameraStore();
    s.setZoom(pinchZoom(s.getZoom(), 100, 100 * spread));
    take(s);
  }
  for (const key of ["+", "-"]) {
    const s = createCameraStore();
    for (let i = 0; i < 40; i++) s.stepZoom(key);
    take(s);
  }
  for (const level of [1, 2, 3]) {
    const s = createCameraStore();
    s.goToLevel(level);
    take(s);
  }
  for (const id of Object.keys(STALL_CENTERS)) {
    const s = createCameraStore();
    s.goToStation(id);
    take(s);
  }
  // A far-out zoom with the look-at pushed to each pan corner (the rig clamps it every frame).
  for (const zoom of [0.55, 1.2]) for (const tx of [-1e3, 1e3]) for (const tz of [-1e3, 1e3]) out.push({ zoom, target: [tx, 0, tz] });
  return out;
}

test("every zoom and look-at the camera store can hold keeps the whole market inside fog.near, at every canvas size", () => {
  const points = marketPoints();
  let far = 0;
  for (const [width, height] of SIZES) {
    for (const goal of goals()) {
      const view = { width, height, zoom: goal.zoom };
      const target = clampTarget(goal.target, view);
      const [cx, cy, cz] = cameraConfig({ ...view, target }).position;
      for (const [x, y, z] of points) far = Math.max(far, Math.hypot(x - cx, y - cy, z - cz));
    }
  }
  assert.ok(far < FOG_NEAR, `the farthest market point is ${far.toFixed(2)} from the camera; fog.near is ${FOG_NEAR}`);
});
