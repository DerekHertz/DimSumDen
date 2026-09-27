// Ticket 07, design bounce round 2 (HIGH-2): every Brain prop sat inside the paw. These tests pin
// the designer's numeric targets (handoffs/07-designer-2.md) as world-space bounds, measured on the
// exported panda.glb and prop glbs with the prop attached at identity under its socket, the way
// dev-scene.mjs attaches it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PROP_ASSETS } from "./panda-contract.mjs";
import { PAW_RADIUS, clipDuration, measurePlacement, parseGlb, transformPoint, worldMatrices } from "./prop-placement.mjs";

const load = (path) => parseGlb(readFileSync(new URL(`../../public/models/${path}`, import.meta.url)));
const panda = load("panda.glb");
const props = Object.fromEntries(Object.entries(PROP_ASSETS).map(([type, spec]) => [type, { ...spec, glb: load(spec.file) }]));
const atRest = (type) => measurePlacement(panda, props[type].glb, props[type].socket);
const alongWorld = (placement, axis) => placement.axes.reduce((best, a) => (Math.abs(a.dir[axis]) > Math.abs(best.dir[axis]) ? a : best));
const inRange = (value, [lo, hi], what) => assert.ok(value >= lo && value <= hi, `${what} is ${value.toFixed(3)}, want ${lo} to ${hi}`);

for (const type of Object.keys(PROP_ASSETS)) {
  test(`${type}: at least 60% of the prop's box lies outside the paw`, () => {
    const { fractionOutside } = atRest(type);
    assert.ok(fractionOutside >= 0.6, `${(fractionOutside * 100).toFixed(0)}% outside the ${PAW_RADIUS} paw sphere`);
  });

  test(`${type}: the grip point sits on the paw surface, not buried in it or floating off it`, () => {
    inRange(atRest(type).nearDistance, [0.17, 0.23], "closest point of the prop to the socket");
  });

  test(`${type}: the prop is not hidden behind its paw from the front camera, all through the habit loop`, () => {
    const { clip, socket, glb } = props[type];
    const end = clipDuration(panda, clip);
    for (let i = 0; i <= 8; i++) {
      const time = (end * i) / 8;
      const [x, y, z] = measurePlacement(panda, glb, socket, { clip, time }).centreOffset;
      const clearOfPaw = Math.hypot(x, y) >= PAW_RADIUS;
      const inFront = z >= 0.1;
      assert.ok(clearOfPaw || inFront, `${clip} at ${time.toFixed(2)} s: centre offset ${[x, y, z].map((v) => v.toFixed(3))}`);
    }
  });
}

test("fan: upright, its face to the camera, blade radius 0.24 to 0.28, rising above the paw", () => {
  const fan = atRest("orchestrator");
  const thin = fan.axes.reduce((a, b) => (b.extent < a.extent ? b : a));
  assert.ok(Math.abs(thin.dir[2]) > 0.9, `thin axis ${thin.dir.map((v) => v.toFixed(2))} is not on world Z`);
  inRange(alongWorld(fan, 1).extent, [0.24, 0.28], "blade radius (extent on world Y)");
  assert.ok(fan.centreOffset[1] > 0, "the blade hangs below the paw instead of rising above it");
});

test("scroll: its length runs across the paw, not along the forearm, centred just outside the paw", () => {
  const scroll = atRest("product");
  const long = scroll.axes.reduce((a, b) => (b.extent > a.extent ? b : a));
  // The forearm runs from the arm's joint to the paw socket. At rest it points forward and down,
  // toward the camera, not along world X.
  const rest = worldMatrices(panda);
  const [joint, paw] = ["arm_L", "paw_L"].map((n) => transformPoint(rest.get(n), [0, 0, 0]));
  const forearm = paw.map((v, i) => v - joint[i]);
  const along = Math.abs(long.dir.reduce((s, v, i) => s + v * forearm[i], 0)) / Math.hypot(...forearm);
  assert.ok(along < 0.3, `scroll length is ${(along * 100).toFixed(0)}% along the forearm`);
  inRange(scroll.centreDistance, [0.22, 0.26], "scroll centre from the socket");
});

test("blueprint: the sheet stands up facing the camera, centred about 0.32 from the socket", () => {
  const sheet = atRest("architect");
  const thin = sheet.axes.reduce((a, b) => (b.extent < a.extent ? b : a));
  assert.ok(Math.abs(thin.dir[2]) > 0.9, `thin axis ${thin.dir.map((v) => v.toFixed(2))} is not on world Z`);
  inRange(sheet.centreDistance, [0.28, 0.35], "blueprint centre from the socket");
});
