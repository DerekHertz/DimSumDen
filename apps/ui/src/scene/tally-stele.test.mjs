// Ticket showcase-v1/07: Tally is a stone stele on the front floor, beside the Cubs basket.
// Expected values are hand-worked literals from the designer revision (handoffs/07-designer-rev.md),
// not recomputed from the module. Contract for TALLY (name kept):
//   { x, z, groundY, rotationY, plinth: {width, height, depth}, tablet: {width, height, depth} }
// plinth bottom sits 0.02 below groundY; the tablet stands on the plinth top.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TALLY, BAO, TABLE, CUB_BASKET, CUB_BASKET_RADIUS, placeCell } from "./banquet-layout.mjs";
import { roamObstacles } from "./roam.mjs";
import { TALLY_LABEL, TALLY_ARIA_LABEL } from "./tally-face.mjs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const CAM = { x: 0, y: 4.2, z: 11.5 }; // default camera (camera-rig BASE_Y, BASE_Z)
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} != ${b}`);
// Screen position of a world point from the default camera: perspective divide by depth.
const project = (x, y, z) => ({ x: (x - CAM.x) / (CAM.z - z), y: (y - CAM.y) / (CAM.z - z) });

const plinthBottom = () => TALLY.groundY - 0.02;
const tabletBottom = () => plinthBottom() + TALLY.plinth.height;
const tabletTop = () => tabletBottom() + TALLY.tablet.height;

test("stele stands beside the Cubs basket: x 1.8, z 3.0, on the floor, turned to the camera (about -0.209 rad)", () => {
  assert.equal(TALLY.x, 1.8);
  assert.equal(TALLY.z, 3.0);
  assert.equal(TALLY.groundY, 0);
  close(TALLY.rotationY, -0.209, 0.01, "rotationY faces the default camera");
});

test("stele is a tablet 0.9 x 1.3 x 0.14 on a plinth 1.1 x 0.25 x 0.4, top about 1.55, with no roof or posts", () => {
  assert.deepEqual(TALLY.tablet, { width: 0.9, height: 1.3, depth: 0.14 });
  assert.deepEqual(TALLY.plinth, { width: 1.1, height: 0.25, depth: 0.4 });
  assert.equal(TALLY.faceBottom, undefined, "the pagoda slate's hanging face is gone");
  assert.ok(tabletTop() > 1.4 && tabletTop() < 1.7, `tablet top ${tabletTop()}`);
  const src = read("./TallyFace.jsx");
  assert.doesNotMatch(src, /roofTriangles|stall-roof/, "no roof");
});

test("grounded beside the basket: on the floor, level with the basket, 0.3+ clear of it, behind the cub row", () => {
  assert.equal(TALLY.groundY, 0);
  assert.equal(TALLY.z, CUB_BASKET.z);
  const plinthLeft = TALLY.x - TALLY.plinth.width / 2; // 0.95
  assert.ok(plinthLeft - CUB_BASKET.x - CUB_BASKET_RADIUS >= 0.3, `gap to basket ${plinthLeft - CUB_BASKET_RADIUS}`);
  const front = TALLY.z + TALLY.plinth.depth / 2; // 3.6
  assert.ok(front <= 4.6 - 0.35, `plinth front ${front} stays behind the cub row`);
});

test("from the default camera the stele covers only floor: its top is below Bao's feet and the table top, and it is clear of the table, Bao and the stalls sideways", () => {
  const top = project(0, tabletTop(), TALLY.z).y; // about -0.33
  const baoFeet = project(0, 0, BAO.position[2]).y; // about -0.302
  const tableTop = project(0, TABLE.height, TABLE.z).y; // -0.304
  assert.ok(top < baoFeet, `stele top ${top} is not below Bao's feet ${baoFeet}`);
  assert.ok(top < tableTop, `stele top ${top} is not below the table top ${tableTop}`);

  const left = project(TALLY.x - TALLY.plinth.width / 2, 0, TALLY.z).x; // 0.117
  const right = project(TALLY.x + TALLY.plinth.width / 2, 0, TALLY.z).x; // 0.253
  const tableRight = project(TABLE.x + TABLE.radius, 0, TABLE.z).x; // 0.113
  const baoRight = project(BAO.scale * 1, 0, BAO.position[2]).x; // 1.4 -> 0.1007
  const pantryInner = project(4.0 - 3 * 0.75 / 2, 0, 2.2).x; // 2.875 -> 0.309
  const fohInner = project(4.8 - 3 * 0.75 / 2, 0, -1.6).x; // 3.675 -> 0.2805
  assert.ok(left > tableRight, `stele left ${left} overlaps the table edge ${tableRight}`);
  assert.ok(left > baoRight, `stele left ${left} overlaps Bao's right edge ${baoRight}`);
  assert.ok(right < pantryInner, `stele right ${right} runs into the Pantry stall ${pantryInner}`);
  assert.ok(right < fohInner, `stele right ${right} runs into Front of House ${fohInner}`);
});

test("the plinth's left edge, projected to Bao's depth, clears Bao's right edge (1.4): lands at 1.5 or more", () => {
  const f = (CAM.z - BAO.position[2]) / (CAM.z - TALLY.z);
  const plinthLeft = CAM.x + f * (TALLY.x - TALLY.plinth.width / 2 - CAM.x);
  assert.ok(plinthLeft >= 1.5, `plinth left edge lands at ${plinthLeft} at Bao's depth`);
  const tabletLeft = CAM.x + f * (TALLY.x - TALLY.tablet.width / 2 - CAM.x);
  assert.ok(tabletLeft >= 1.5, `tablet left edge lands at ${tabletLeft} at Bao's depth`);
});

test("cubs never cover the face: a plush top (y 0.8) in the cub row projects below the tablet bottom", () => {
  const plush = project(0, 0.8, 4.6).y; // -0.493
  const face = project(0, tabletBottom(), TALLY.z).y; // -0.490
  assert.ok(plush < face, `cub top ${plush} reaches the tablet bottom ${face}`);
});

test("the stele's screen box does not overlap any Pass perch, the Steamers/Front of House/Pantry perches, or the cub row", () => {
  const b = {
    x0: project(TALLY.x - TALLY.plinth.width / 2, 0, TALLY.z).x,
    x1: project(TALLY.x + TALLY.plinth.width / 2, 0, TALLY.z).x,
    y0: project(0, plinthBottom(), TALLY.z).y,
    y1: project(0, tabletTop(), TALLY.z).y,
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
      assert.ok(!hit, `${type}#${s} perch projects onto the stele`);
    }
  }
});

test("prop clearance: the stele footprint (1.8, 3.0) is blocked; the old Tally obstacle at (-3.0, 0.3) is gone", () => {
  const covered = (x, z) =>
    roamObstacles({}).some((o) =>
      o.kind === "circle" ? Math.hypot(x - o.x, z - o.z) < o.r : x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1,
    );
  assert.ok(covered(1.8, 3.0), "the stele footprint remains available to scene-clearance callers");
  assert.ok(covered(1.25, 2.8) && covered(2.35, 3.2), "the whole plinth footprint plus margin is covered");
  assert.ok(!covered(-3.0, 0.3), "the pagoda slate's footprint no longer blocks roamers");
});

test("face: qi-teal glowing lines on stone, drawn on a basic material so they glow, with no slate or chalk-green bars", () => {
  const src = read("./TallyFace.jsx");
  assert.match(src, /#3aced3/i, "qi teal lines");
  assert.match(src, /#4a4d4a/i, "stone tablet colour");
  assert.match(src, /#3d403d/i, "stone plinth colour");
  assert.match(src, /meshBasicMaterial/, "face glows regardless of lighting");
  assert.doesNotMatch(src, /#2f3a3d/i, "old slate colour gone");
  assert.doesNotMatch(src, /#7fd0c8/i, "old bar colour gone");
});

test("accessible name, label and click/Enter route are unchanged; 'spills' stays", () => {
  assert.equal(TALLY_LABEL, "Tally");
  assert.equal(TALLY_ARIA_LABEL, "Tally: open the dashboard");
  assert.match(read("./tally-face.mjs"), /spills/);
  assert.match(read("./TallyFace.jsx"), /onClick/);
  assert.match(read("./ChipLayer.jsx"), /TALLY_ARIA_LABEL/);
  assert.match(read("../App.jsx"), /onOpenTally=\{openDashboard\}/);
});
