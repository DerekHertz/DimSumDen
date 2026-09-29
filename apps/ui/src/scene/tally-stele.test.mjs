// Ticket showcase-v1/07: Tally becomes a stone stele on the leafy mound behind Bao, right side.
// Expected values are hand-worked literals from the designer spec (handoffs/07-designer.md), not
// recomputed from the module. Contract for TALLY (name kept):
//   { x, z, groundY, plinth: {width, height, depth}, tablet: {width, height, depth} }
// plinth bottom sits 0.1 below groundY; the tablet stands on the plinth top.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TALLY, BAO, TABLE, STALL_CENTERS, placeCell } from "./banquet-layout.mjs";
import { groveLayout } from "./grove-layout.mjs";
import { roamObstacles } from "./roam.mjs";
import { TALLY_LABEL, TALLY_ARIA_LABEL } from "./tally-face.mjs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const CAM = { x: 0, y: 4.2, z: 11.5 }; // default camera (camera-rig BASE_Y, BASE_Z)
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} != ${b}`);

// Mound ellipsoid (grove-layout mound; grove.mjs squashes z to half the radius): hand-worked.
const MOUND = { x: 0, z: -6.0, rx: 3.2, ry: 1.8, rz: 1.6 };
const moundH = (x, z) => {
  const q = 1 - ((x - MOUND.x) / MOUND.rx) ** 2 - ((z - MOUND.z) / MOUND.rz) ** 2;
  return q > 0 ? MOUND.ry * Math.sqrt(q) : 0;
};
// Screen position of a world point from the default camera: perspective divide by depth.
const project = (x, y, z) => ({ x: (x - CAM.x) / (CAM.z - z), y: (y - CAM.y) / (CAM.z - z) });

test("the grove mound still has the numbers this spec relies on", () => {
  const { mound } = groveLayout(1);
  assert.deepEqual([mound.x, mound.z, mound.radius, mound.height], [0, -6.0, 3.2, 1.8]);
});

test("stele stands at x 2.3, z -6.0 with groundY on the mound surface (about 1.2516)", () => {
  assert.equal(TALLY.x, 2.3);
  assert.equal(TALLY.z, -6.0);
  close(TALLY.groundY, 1.2516, 0.002, "groundY from the mound ellipse");
});

test("stele is a tablet 0.7 x 1.0 x 0.12 on a plinth 0.9 x 0.2 x 0.35, with no roof or posts", () => {
  assert.deepEqual(TALLY.tablet, { width: 0.7, height: 1.0, depth: 0.12 });
  assert.deepEqual(TALLY.plinth, { width: 0.9, height: 0.2, depth: 0.35 });
  assert.equal(TALLY.faceBottom, undefined, "the pagoda slate's hanging face is gone");
  assert.ok(TALLY.tablet.width < 1.6, "smaller than the old 1.6 wide slate");
  const top = TALLY.groundY - 0.1 + TALLY.plinth.height + TALLY.tablet.height;
  assert.ok(top > 2.2 && top < 2.5, `tablet top ${top} stays below the near leaves`);
  const src = read("./TallyFace.jsx");
  assert.doesNotMatch(src, /roofTriangles|stall-roof/, "no roof");
});

test("the plinth footprint lies on the mound: all four corners are over the surface", () => {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = TALLY.x + (sx * TALLY.plinth.width) / 2;
      const z = TALLY.z + (sz * TALLY.plinth.depth) / 2;
      assert.ok(moundH(x, z) > 0, `corner ${x},${z} is off the mound`);
    }
  }
});

test("from the default camera nothing in the market sits behind the stele: it is farther than every stall, cell perch, Bao and the table", () => {
  const nearestZ = [
    BAO.position[2] - 0.875 * BAO.scale, // Bao's back face
    TABLE.z - TABLE.radius,
    ...Object.values(STALL_CENTERS).map((c) => c.z),
    ...["orchestrator", "product", "architect", "developer", "qa", "security", "designer"].map((t) => placeCell(t, 0).z),
  ];
  const steleFront = TALLY.z + TALLY.plinth.depth / 2;
  for (const z of nearestZ) assert.ok(z > steleFront, `something at z ${z} is not in front of the stele (front ${steleFront})`);
});

test("the stele's left edge, projected to Bao's depth, clears Bao's right edge (1.4) by at least 0.1", () => {
  const y = TALLY.groundY + 0.2 + TALLY.tablet.height / 2;
  const left = TALLY.x - TALLY.tablet.width / 2; // 1.95
  const f = (CAM.z - BAO.position[2]) / (CAM.z - TALLY.z);
  const projected = CAM.x + f * (left - CAM.x);
  assert.ok(y > 0);
  assert.ok(projected - BAO.scale * 1 >= 0.1, `tablet left edge lands at ${projected} at Bao's depth`);
  const plinthLeft = CAM.x + f * (TALLY.x - TALLY.plinth.width / 2 - CAM.x);
  assert.ok(plinthLeft > BAO.scale * 1 + 0.05, `plinth left edge lands at ${plinthLeft}`);
});

test("near bamboo (minX 2.8, z -5.2..-4) does not cover the face: the stele's right edge projects under 2.6 at z -4.6", () => {
  const right = TALLY.x + TALLY.plinth.width / 2; // 2.75
  const f = (CAM.z + 4.6) / (CAM.z - TALLY.z);
  assert.ok(CAM.x + f * (right - CAM.x) < 2.6);
});

test("the stele's screen box does not overlap the Steamers or Front of House cell perches or any Pass perch", () => {
  const b = {
    x0: project(TALLY.x - TALLY.plinth.width / 2, 0, TALLY.z).x,
    x1: project(TALLY.x + TALLY.plinth.width / 2, 0, TALLY.z).x,
    y0: project(0, TALLY.groundY - 0.1, TALLY.z).y,
    y1: project(0, TALLY.groundY + 0.1 + TALLY.tablet.height, TALLY.z).y,
  };
  for (const [type, slots] of [["designer", [0, 1, 2]], ["architect", [0, 1]], ["orchestrator", [0]]]) {
    for (const s of slots) {
      const p = placeCell(type, s);
      const q = project(p.x, p.y, p.z);
      const hit = q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1;
      assert.ok(!hit, `${type}#${s} perch projects onto the stele`);
    }
  }
});

test("roaming pandas: the old Tally obstacle at (-3.0, 0.3) is gone from the grass", () => {
  const covered = (x, z) =>
    roamObstacles({}).some((o) =>
      o.kind === "circle" ? Math.hypot(x - o.x, z - o.z) < o.r : x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1,
    );
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
