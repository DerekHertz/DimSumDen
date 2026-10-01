// den-scene-v1/03: pagoda roof geometry. Pure; worked literals from the designer spec.
// Seam: roofTriangles (tiered tiles) and eaveTrimTriangles (thin band under the eave line) in stall-roof.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EAVE_Y, RISE, UPTURN, POST_SIZE, roofApex, roofRing, roofTriangles } from "./stall-roof.mjs";
import { FRONT_ROOF } from "./banquet-layout.mjs";

const verts = (flat) => Array.from({ length: flat.length / 3 }, (_, i) => flat.slice(i * 3, i * 3 + 3));
const near = (a, b) => Math.abs(a - b) < 1e-9;
const W = 2.25, D = 1;

test("height budget is unchanged: EAVE_Y 1.7, RISE 0.7, UPTURN 0.1, FRONT_ROOF eave 1.4 rise 0.4", () => {
  assert.equal(EAVE_Y, 1.7);
  assert.equal(RISE, 0.7);
  assert.equal(UPTURN, 0.1);
  assert.deepEqual(FRONT_ROOF, { eave: 1.4, rise: 0.4 });
});

for (const [label, roof] of [["back", undefined], ["front", FRONT_ROOF]]) {
  const eave = roof?.eave ?? EAVE_Y;
  const px = W / 2 - POST_SIZE / 2, pz = D / 2 - POST_SIZE / 2;
  const onPerimeter = ([x, , z]) => near(Math.abs(x), px) || near(Math.abs(z), pz);

  test(`${label} roof: perimeter corner vertices sit higher than mid-edge vertices by at least UPTURN`, () => {
    const outer = verts(roofTriangles(W, D, roof)).filter(onPerimeter);
    const corners = outer.filter(([x, , z]) => near(Math.abs(x), px) && near(Math.abs(z), pz));
    const mids = outer.filter(([x, , z]) => !(near(Math.abs(x), px) && near(Math.abs(z), pz)));
    assert.ok(corners.length > 0 && mids.length > 0);
    const lowCorner = Math.min(...corners.map((v) => v[1]));
    const highMid = Math.max(...mids.map((v) => v[1]));
    assert.ok(lowCorner - highMid >= UPTURN - 1e-9, `corner ${lowCorner} vs mid ${highMid}`);
  });

  test(`${label} roof: every ring point is a vertex and nothing rises above the apex`, () => {
    const vs = verts(roofTriangles(W, D, roof));
    for (const r of roofRing(W, D, roof)) assert.ok(vs.some((v) => v.every((c, i) => near(c, r[i]))), `ring point ${r}`);
    const apex = roofApex(roof);
    assert.ok(vs.some((v) => v.every((c, i) => near(c, apex[i]))));
    assert.ok(vs.every((v) => v[1] <= apex[1] + 1e-9));
  });

  test(`${label} roof: each face has a middle tier ring strictly between eave and apex (tile tiers)`, () => {
    const apex = roofApex(roof);
    const mid = verts(roofTriangles(W, D, roof)).filter((v) => !onPerimeter(v) && v[1] < apex[1] - 1e-9);
    assert.ok(mid.length >= 8, `expected a mid ring of vertices, found ${mid.length}`);
    assert.ok(mid.every((v) => v[1] > eave && v[1] < apex[1]));
  });
}

test("eave trim: a 0.03-tall strip that follows the ring just under it", async () => {
  const mod = await import("./stall-roof.mjs");
  assert.equal(mod.EAVE_TRIM_HEIGHT, 0.03);
  assert.equal(typeof mod.eaveTrimTriangles, "function", "eaveTrimTriangles(width, depth, roof) is the trim seam");
  for (const roof of [undefined, FRONT_ROOF]) {
    const ring = roofRing(W, D, roof);
    const vs = verts(mod.eaveTrimTriangles(W, D, roof));
    assert.ok(vs.length > 0 && vs.length % 3 === 0);
    for (const v of vs) {
      const r = ring.find((p) => near(p[0], v[0]) && near(p[2], v[2]));
      assert.ok(r, `trim vertex ${v} is off the ring`);
      assert.ok(near(v[1], r[1]) || near(v[1], r[1] - 0.03), `trim vertex y ${v[1]} vs ring ${r[1]}`);
    }
    for (const r of ring) assert.ok(vs.some((v) => near(v[0], r[0]) && near(v[2], r[2])), "trim covers every ring point");
  }
});
