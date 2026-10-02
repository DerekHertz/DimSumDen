// den-iso-v1/04 (qa bounce): build the dressing group and count what is in it. The source-regex tests in
// backdrop-dressing.test.mjs cannot see a dressing that builds nothing; this one can.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDressing, DRESSING_TOKENS } from "./dressing.mjs";
import { DORMANT_PADS, STONE_RING, bambooStalks, stepStones } from "./banquet-layout.mjs";

const tokens = Object.fromEntries(Object.entries(DRESSING_TOKENS));
const group = buildDressing(tokens);

test("the stepping stones are one instanced paver mesh with a stone per ring slot", () => {
  const paving = group.getObjectByName("stepping-stones");
  assert.ok(paving, "stepping-stones present");
  const n = stepStones().length; // the ring minus the steps the footprint rule drops
  assert.ok(n > 0 && n <= STONE_RING.count, "some stones survive, none added");
  assert.equal(paving.count, n);
  assert.equal(group.getObjectByName("stone-shadows").count, n);
});

test("each dormant pad is its own group with a fill and dashed outline, at its layout position", () => {
  const pads = group.children.filter((c) => c.name.startsWith("dormant-pad:"));
  assert.equal(pads.length, 2);
  for (const spec of DORMANT_PADS) {
    const pad = group.getObjectByName(`dormant-pad:${spec.id}`);
    assert.ok(pad, `${spec.id} pad present`);
    assert.equal(pad.position.x, spec.x);
    assert.equal(pad.position.z, spec.z);
    assert.ok(pad.children.length > 1, "fill plus dashes");
    assert.equal(pad.userData.label, spec.label);
  }
});

test("a bamboo group is built for every stalk bambooStalks() returns, each with a trunk", () => {
  const stalks = group.children.filter((c) => c.name.startsWith("bamboo:"));
  assert.ok(bambooStalks().length > 0);
  assert.equal(stalks.length, bambooStalks().length);
  for (const s of stalks) assert.ok(s.children.length >= 2, "trunk and leaves at least");
});
