// Ticket showcase-v1/01 fix round: a stall roof sits on its four posts. Pure geometry; worked literals.
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./stall-roof.mjs");

test("four posts stand at the stall corners, inset 0.05 from the front and back edges", async () => {
  const { postPositions } = await load();
  assert.deepEqual(postPositions(2.25, 1), [
    [-1.125, -0.45], [1.125, -0.45], [1.125, 0.45], [-1.125, 0.45],
  ]);
});

test("post height reaches the upturned roof corners: eave 1.7 plus upturn 0.1", async () => {
  const { POST_BASE, EAVE_Y, UPTURN, postHeight } = await load();
  assert.equal(POST_BASE, 0.5);
  assert.equal(EAVE_Y, 1.7);
  assert.equal(UPTURN, 0.1);
  assert.ok(Math.abs(postHeight() - 1.3) < 1e-9);
});

test("roof corners line up with post tops exactly", async () => {
  const { postPositions, roofRing, EAVE_Y, UPTURN } = await load();
  const posts = postPositions(2.25, 1);
  const ring = roofRing(2.25, 1);
  const corners = ring.filter((_, i) => i % 2 === 0);
  assert.equal(corners.length, 4);
  corners.forEach((c, i) => {
    assert.equal(c[0], posts[i][0]);
    assert.equal(c[2], posts[i][1]);
    assert.ok(Math.abs(c[1] - (EAVE_Y + UPTURN)) < 1e-9);
  });
});

test("edge midpoints sit at eave height, below the upturned corners", async () => {
  const { roofRing, EAVE_Y } = await load();
  const mids = roofRing(2.25, 1).filter((_, i) => i % 2 === 1);
  assert.equal(mids.length, 4);
  mids.forEach((m) => assert.equal(m[1], EAVE_Y));
});

test("apex is centred and 0.7 above the eave; the triangles close the ring (8 triangles)", async () => {
  const { roofApex, roofTriangles } = await load();
  assert.deepEqual(roofApex(), [0, 2.4, 0]);
  const tris = roofTriangles(2.25, 1);
  assert.equal(tris.length, 8 * 9);
});
