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

test("everything stands behind Bao's back and clear of the stalls", () => {
  const g = groveLayout(3);
  const baoBack = BAO.position[2] - 0.875 * BAO.scale;
  const all = [...g.far, ...g.mid, ...g.near, ...g.tufts];
  for (const s of all) assert.ok(s.z < baoBack, `z ${s.z} is behind Bao's back ${baoBack}`);
  for (const l of g.leaves) assert.ok(l.z < baoBack);
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
