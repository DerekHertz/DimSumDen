// Ticket den-scene-v1/05: the stone stele becomes a wooden suanpan abacus at TALLY (name kept).
// Expected values are hand-worked literals from the designer spec (handoffs/05-designer-spec.md), not
// recomputed from the module. Contract for TALLY:
//   { x, z, groundY, rotationY, frame: {width, height, depth, bar}, leg: {width, height} }
// The legs stand on groundY; the frame bottom sits at groundY + leg.height; the frame stands on the legs.
// R3F cannot render under node --test, so geometry criteria that live only in JSX read the source.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TALLY, BAO, TABLE, CUB_BASKET, CUB_BASKET_RADIUS, placeCell, tallyAnchor } from "./banquet-layout.mjs";
import { roamObstacles } from "./roam.mjs";
import { cameraPosition } from "./camera-rig.mjs";
import { TALLY_LABEL, TALLY_ARIA_LABEL } from "./tally-face.mjs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const CAM = { x: 0, y: 4.2, z: 11.5 }; // default camera (camera-rig BASE_Y, BASE_Z)
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} != ${b}`);
// Screen position of a world point from the default camera: perspective divide by depth.
const project = (x, y, z) => ({ x: (x - CAM.x) / (CAM.z - z), y: (y - CAM.y) / (CAM.z - z) });

const frameBottom = () => TALLY.groundY + TALLY.leg.height;
const frameTop = () => frameBottom() + TALLY.frame.height;

test("Tally face bearing points toward the actual shared default camera", () => {
  const [cx, , cz] = cameraPosition(0, 1);
  const bearing = Math.atan2(cx - TALLY.x, cz - TALLY.z);
  close(TALLY.rotationY, bearing, 1e-12, "Tally faces the current default camera");
});

test("the abacus stands beside the Cubs basket: x 1.8, z 3.0, on the floor, turned to the camera (about -0.165 rad)", () => {
  assert.equal(TALLY.x, 1.8);
  assert.equal(TALLY.z, 3.0);
  assert.equal(TALLY.groundY, 0);
  close(TALLY.rotationY, -0.165, 0.01, "rotationY faces the default camera");
});

test("frame is 1.1 wide x 1.4 tall x 0.12 deep with 0.08 bars, on two 0.08 x 0.15 legs: frame bottom 0.15, top 1.55", () => {
  assert.deepEqual(TALLY.frame, { width: 1.1, height: 1.4, depth: 0.12, bar: 0.08 });
  assert.equal(TALLY.leg.width, 0.08);
  assert.equal(TALLY.leg.height, 0.15);
  close(frameBottom(), 0.15, 1e-9, "frame bottom");
  close(frameTop(), 1.55, 1e-9, "frame top");
});

test("no stone stele geometry remains: no plinth or tablet in the layout, no stone colours or tablet meshes in TallyFace.jsx", () => {
  assert.equal(TALLY.plinth, undefined, "plinth gone");
  assert.equal(TALLY.tablet, undefined, "tablet gone");
  assert.equal(TALLY.faceBottom, undefined, "the pagoda slate's hanging face stays gone");
  const src = read("./TallyFace.jsx");
  assert.doesNotMatch(src, /roofTriangles|stall-roof/, "no roof");
  assert.doesNotMatch(src, /#4a4d4a/i, "stone tablet colour gone");
  assert.doesNotMatch(src, /#3d403d/i, "stone plinth colour gone");
  assert.doesNotMatch(src, /plinth|tablet/i, "no plinth or tablet geometry");
  assert.doesNotMatch(src, /drawFace|chart\.bars/, "no canvas chart face");
});

test("the abacus is low-poly wood: box frame and legs, cylinder rods, sphere beads, wood literals #8A5A34 and #4A2E1C", () => {
  const src = read("./TallyFace.jsx");
  assert.match(src, /boxGeometry/, "box frame and legs");
  assert.match(src, /cylinderGeometry/, "cylinder rods");
  assert.match(src, /sphereGeometry/, "sphere beads");
  assert.match(src, /#8A5A34/i, "wood");
  assert.match(src, /#4A2E1C/i, "wood-deep for rods and frame shadow");
});

test("bead colours follow the live system theme and come from tokens: station-steamers via stationHue; the model's colour names, not hard-coded teal", () => {
  const src = read("./TallyFace.jsx");
  assert.match(src, /stationHue/, "Tokens beads use the steamers station hue");
  assert.match(src, /theme/i, "theme follows the system, as the stalls do");
  assert.match(src, /tallyRods/, "the abacus draws from the tallyRods view-model");
  assert.doesNotMatch(src, /#3aced3/i, "old fixed qi-teal literal gone: counted beads follow the theme");
});

test("beads slide through beadSlide (240 ms, only on a change) and jump under reduced motion", () => {
  const src = read("./TallyFace.jsx");
  assert.match(src, /beadSlide/);
  assert.match(src, /prefers-reduced-motion/);
});

test("clicking any abacus mesh opens the Tally (onClick on the group); the stage is still passed through", () => {
  const src = read("./TallyFace.jsx");
  assert.match(src, /onClick/);
  assert.match(src, /name="tally"/);
});

test("grounded beside the basket: on the floor, level with the basket, 0.3+ clear of it, behind the cub row", () => {
  assert.equal(TALLY.groundY, 0);
  assert.equal(TALLY.z, CUB_BASKET.z);
  const frameLeft = TALLY.x - TALLY.frame.width / 2; // 1.25
  assert.ok(frameLeft - CUB_BASKET.x - CUB_BASKET_RADIUS >= 0.3, `gap to basket ${frameLeft - CUB_BASKET_RADIUS}`);
  const front = TALLY.z + TALLY.frame.depth / 2; // 3.06
  assert.ok(front <= 4.6 - 0.35, `frame front ${front} stays behind the cub row`);
});

test("from the default camera the abacus covers only floor: its top is below Bao's feet and the table top, and it is clear of the table, Bao and the stalls sideways", () => {
  const top = project(0, frameTop(), TALLY.z).y; // about -0.31
  const baoFeet = project(0, 0, BAO.position[2]).y; // about -0.302
  const tableTop = project(0, TABLE.height, TABLE.z).y; // -0.304
  assert.ok(top < baoFeet, `abacus top ${top} is not below Bao's feet ${baoFeet}`);
  assert.ok(top < tableTop, `abacus top ${top} is not below the table top ${tableTop}`);

  const left = project(TALLY.x - TALLY.frame.width / 2, 0, TALLY.z).x;
  const right = project(TALLY.x + TALLY.frame.width / 2, 0, TALLY.z).x;
  const tableRight = project(TABLE.x + TABLE.radius, 0, TABLE.z).x;
  const baoRight = project(BAO.scale * 1, 0, BAO.position[2]).x;
  const pantryInner = project(4.0 - 3 * 0.75 / 2, 0, 2.2).x;
  const fohInner = project(4.8 - 3 * 0.75 / 2, 0, -1.6).x;
  assert.ok(left > tableRight, `abacus left ${left} overlaps the table edge ${tableRight}`);
  assert.ok(left > baoRight, `abacus left ${left} overlaps Bao's right edge ${baoRight}`);
  assert.ok(right < pantryInner, `abacus right ${right} runs into the Pantry stall ${pantryInner}`);
  assert.ok(right < fohInner, `abacus right ${right} runs into Front of House ${fohInner}`);
});

test("the frame's left edge, projected to Bao's depth, clears Bao's right edge (1.4): lands at 1.5 or more", () => {
  const f = (CAM.z - BAO.position[2]) / (CAM.z - TALLY.z);
  const frameLeft = CAM.x + f * (TALLY.x - TALLY.frame.width / 2 - CAM.x);
  assert.ok(frameLeft >= 1.5, `frame left edge lands at ${frameLeft} at Bao's depth`);
});

test("cubs never cover the rods: a plush top (y 0.8) in the cub row projects below the frame bottom", () => {
  const plush = project(0, 0.8, 4.6).y; // -0.493
  const face = project(0, frameBottom(), TALLY.z).y; // -0.4765
  assert.ok(plush < face, `cub top ${plush} reaches the frame bottom ${face}`);
});

test("the abacus's screen box does not overlap any Pass perch, the Steamers/Front of House/Pantry perches, or the cub row", () => {
  const b = {
    x0: project(TALLY.x - TALLY.frame.width / 2, 0, TALLY.z).x,
    x1: project(TALLY.x + TALLY.frame.width / 2, 0, TALLY.z).x,
    y0: project(0, TALLY.groundY, TALLY.z).y,
    y1: project(0, frameTop(), TALLY.z).y,
  };
  const perches = [
    ["designer", [0, 1, 2]],
    ["architect", [0, 1]],
    ["orchestrator", [0]],
    ["product", [0, 1]],
    ["developer", [0, 1, 2]],
    ["security", [0, 1, 2]], // pantry#0..2
    ["cub", [0, 1, 2, 3, 4, 5, 6, 7]], // cub row slots 0..7
  ];
  for (const [type, slots] of perches) {
    for (const s of slots) {
      const p = placeCell(type, s, type === "cub" ? 8 : 3);
      const q = project(p.x, p.y, p.z);
      const hit = q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1;
      assert.ok(!hit, `${type}#${s} perch projects onto the abacus`);
    }
  }
});

test("prop clearance: the abacus footprint (1.8, 3.0) is blocked; the old Tally obstacle at (-3.0, 0.3) is gone", () => {
  const covered = (x, z) =>
    roamObstacles({}).some((o) =>
      o.kind === "circle" ? Math.hypot(x - o.x, z - o.z) < o.r : x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1,
    );
  assert.ok(covered(1.8, 3.0), "the abacus footprint remains available to scene-clearance callers");
  assert.ok(covered(1.25, 2.9) && covered(2.35, 3.1), "the whole frame footprint (1.1 wide, 0.12 deep) plus margin is covered");
  assert.ok(!covered(-3.0, 0.3), "the pagoda slate's footprint no longer blocks roamers");
});

test("the Tally pill anchors about 0.27 above the frame top, centred on it", () => {
  const a = tallyAnchor();
  assert.equal(a.x, TALLY.x);
  assert.equal(a.z, TALLY.z);
  close(a.y, frameTop() + 0.27, 0.02, "pill anchor height");
  close(a.y, 1.82, 0.02, "pill anchor height (literal)");
});

test("accessible name, label and click route are unchanged; 'spills' stays", () => {
  assert.equal(TALLY_LABEL, "Tally");
  assert.equal(TALLY_ARIA_LABEL, "Tally: open the dashboard");
  assert.match(read("./tally-face.mjs"), /spills/i);
  assert.match(read("./ChipLayer.jsx"), /TALLY_ARIA_LABEL/);
});
