// showcase-v1/02: the grove layout generator is pure and seeded; counts per layer are fixed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GROVE_COUNTS, SWAY_PERIOD_S, groveLayout, swayAngle } from "./grove-layout.mjs";
import { BAO, STALL_CENTERS } from "./banquet-layout.mjs";

test("same seed gives the same layout, a different seed a different one", () => {
  assert.deepEqual(groveLayout(7), groveLayout(7));
  assert.notDeepEqual(groveLayout(7).far, groveLayout(8).far);
});

test("counts per layer match GROVE_COUNTS", () => {
  const g = groveLayout(1);
  for (const layer of ["far", "mid", "near"]) assert.equal(g[layer].length, GROVE_COUNTS[layer], layer);
  assert.equal(g.tufts.length, GROVE_COUNTS.tufts);
  assert.equal(g.leaves.length, (GROVE_COUNTS.mid + GROVE_COUNTS.near) * GROVE_COUNTS.leavesPerStalk);
  assert.deepEqual(GROVE_COUNTS, { far: 44, mid: 32, near: 18, leavesPerStalk: 3, tufts: 18 });
});

test("layers sit at increasing depth: far behind mid behind near", () => {
  const g = groveLayout(1);
  const zs = (l) => g[l].map((s) => s.z);
  assert.ok(Math.max(...zs("far")) < Math.min(...zs("mid")));
  assert.ok(Math.max(...zs("mid")) < Math.min(...zs("near")));
});

// den-scene-v1/11 T8 (A3 of the -2 spec): Bao grows to scale 2.1, so the old "everything behind his back" rule no longer
// holds (ground tufts and leaves stand beside and under him; the user picked the grove as rendered). The rule that
// stays is the one a stalk can break visibly: no far, mid or near stalk pokes through Bao's footprint box.
const baoBox = () => {
  const s = BAO.scale, z0 = BAO.position[2] - 0.875 * s, z1 = BAO.position[2] + 0.875 * s;
  return { x: s, z0, z1 };
};
const outsideBox = (p, box) => Math.hypot(Math.max(Math.abs(p.x) - box.x, 0), Math.max(box.z0 - p.z, p.z - box.z1, 0));

test("far, mid and near stalks stand at least 0.3 world outside Bao's footprint box, for seeds 1, 3, 5, 7 and 11", () => {
  const box = baoBox();
  assert.ok(Math.abs(box.z0 - -5.1375) < 1e-9 && Math.abs(box.z1 - -1.4625) < 1e-9, "the box is x +-2.1, z -5.1375 to -1.4625 at Bao's new place");
  for (const seed of [1, 3, 5, 7, 11]) {
    const g = groveLayout(seed);
    for (const s of [...g.far, ...g.mid, ...g.near]) {
      assert.ok(outsideBox(s, box) >= 0.3, `seed ${seed}: stalk at ${s.x.toFixed(2)}, ${s.z.toFixed(2)} is ${outsideBox(s, box).toFixed(3)} from Bao's box`);
    }
  }
});

test("every stall stands in front of Bao's back plane", () => {
  const baoBack = BAO.position[2] - 0.875 * BAO.scale;
  assert.ok(Math.abs(baoBack - -5.1375) < 1e-9, "Bao's back plane is z -5.1375");
  for (const c of Object.values(STALL_CENTERS)) assert.ok(c.z > baoBack);
});

test("the centre behind Bao stays clear of near and mid stalks", () => {
  const g = groveLayout(3);
  for (const s of [...g.mid, ...g.near]) assert.ok(Math.abs(s.x) >= 2.2, `stalk at x ${s.x}`);
});

test("the mound is behind Bao and lower than Bao's head", () => {
  const { mound } = groveLayout(1);
  assert.ok(mound.z < BAO.position[2] - 0.875 * BAO.scale);
  assert.ok(mound.height < BAO.position[1] + BAO.scale * 0.5);
});

test("stalks have node heights inside the stalk", () => {
  for (const s of groveLayout(5).near) {
    assert.ok(s.nodes.length >= 2);
    for (const y of s.nodes) assert.ok(y > 0 && y < s.h);
  }
});

test("sway is slower than dur-breath, bounded, and still under reduced motion", () => {
  assert.ok(SWAY_PERIOD_S >= 2.8 * 2.5, "well slower than dur-breath");
  assert.equal(swayAngle(1.234, true), 0);
  for (let t = 0; t < 20; t += 0.1) assert.ok(Math.abs(swayAngle(t, false)) <= 0.03 + 1e-9);
  assert.ok(Math.abs(swayAngle(SWAY_PERIOD_S / 4, false)) > 0.005);
  assert.ok(Math.abs(swayAngle(SWAY_PERIOD_S, false)) < 1e-9);
});
