// Ticket showcase-v1/01, ADR 0013: the pure placement module for the banquet market. Cell type and
// slot index in, world position out. Expected values are hand-worked literals from the anchor model
// in the ADR (stall centres, spacing 0.75, Bao at [0,1.4,-2.4] scale 1.4), not recomputed.
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./banquet-layout.mjs");
const near = (actual, expected, msg) => {
  assert.equal(actual.length, expected.length, msg);
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `${msg ?? ""} [${i}] ${v} != ${expected[i]}`));
};
const at = async (cellType, slot, count) => {
  const p = (await load()).placeCell(cellType, slot, count);
  return [p.x, p.y, p.z];
};

test("stationOf maps every cell type to its station", async () => {
  const { stationOf } = await load();
  const table = {
    orchestrator: "orchestrator", product: "product", architect: "architect",
    developer: "steamers", scout: "steamers", debugger: "steamers",
    qa: "tea", security: "pantry", designer: "front-of-house",
    mystery: "cubs",
  };
  for (const [cell, station] of Object.entries(table)) assert.equal(stationOf(cell), station, cell);
});

test("parsePerch splits station and slot", async () => {
  const { parsePerch } = await load();
  assert.deepEqual(parsePerch("front-of-house#2"), { station: "front-of-house", slot: 2 });
});

test("Pass perches: orchestrator on the crown, product left shoulder, architect right shoulder", async () => {
  near(await at("orchestrator", 0), [0, 2.856, -2.4], "orchestrator");
  near(await at("product", 0), [-1.54, 2.016, -2.155], "product");
  near(await at("architect", 0), [1.54, 2.016, -2.155], "architect");
});

test("Pass perches: a second cell of the same type steps 0.4 outward", async () => {
  near(await at("orchestrator", 1), [0.4, 2.856, -2.4]);
  near(await at("product", 1), [-1.94, 2.016, -2.155]);
  near(await at("architect", 1), [1.94, 2.016, -2.155]);
});

test("stalls: Steamers back-left, Front of House back-right, Tea front-left, Pantry front-right", async () => {
  near(await at("developer", 1), [-3.6, 0.6, -1.6], "steamers centre slot");
  near(await at("designer", 1), [3.6, 0.6, -1.6], "front of house");
  near(await at("qa", 1), [-3.6, 0.6, 2.2], "tea");
  near(await at("security", 1), [3.6, 0.6, 2.2], "pantry");
});

test("developer, scout and debugger share the Steamers slots", async () => {
  for (const c of ["developer", "scout", "debugger"]) near(await at(c, 0), [-4.35, 0.6, -1.6], c);
});

test("a stall's three slots are fixed anchors whatever the head count up to three", async () => {
  for (const count of [1, 2, 3, undefined]) {
    near(await at("qa", 0, count), [-4.35, 0.6, 2.2], `slot 0 of ${count}`);
    near(await at("qa", 2, count), [-2.85, 0.6, 2.2], `slot 2 of ${count}`);
  }
});

test("overflow: a stall with five cells widens its slots along the front, centred", async () => {
  near(await at("security", 0, 5), [2.1, 0.6, 2.2]);
  near(await at("security", 2, 5), [3.6, 0.6, 2.2]);
  near(await at("security", 4, 5), [5.1, 0.6, 2.2]);
});

test("stallWidth is 2.25 up to three cells, then 0.75 per cell", async () => {
  const { stallWidth } = await load();
  assert.equal(stallWidth(0), 2.25);
  assert.equal(stallWidth(3), 2.25);
  assert.equal(stallWidth(6), 4.5);
});

test("cubs (unknown cell types) queue in a row at the cub basket, front centre", async () => {
  near(await at("mystery", 1), [0, 0, 3.9]);
  near(await at("mystery", 0), [-0.75, 0, 3.9]);
});

test("landmarks: table at the centre, cub basket front centre", async () => {
  const { TABLE, CUB_BASKET, BAO } = await load();
  assert.deepEqual(TABLE, { x: 0, z: 0, radius: 1.3, height: 0.7 });
  assert.deepEqual(CUB_BASKET, { x: 0, z: 3.4 });
  assert.deepEqual(BAO, { position: [0, 1.4, -2.4], scale: 1.4 });
});

test("lazy susan: one basket per frontier ticket, first at the front of the table top", async () => {
  const { susanBaskets } = await load();
  const one = susanBaskets(1);
  assert.equal(one.length, 1);
  near([one[0].x, one[0].y, one[0].z], [0, 0.75, 0.85]);
  const four = susanBaskets(4);
  assert.equal(four.length, 4);
  near([four[1].x, four[1].y, four[1].z], [0.85, 0.75, 0], "quarter turn");
  near([four[2].x, four[2].y, four[2].z], [0, 0.75, -0.85], "half turn");
});

test("lazy susan: none for an empty frontier, capped at eight", async () => {
  const { susanBaskets, MAX_BASKETS } = await load();
  assert.deepEqual(susanBaskets(0), []);
  assert.equal(MAX_BASKETS, 8);
  assert.equal(susanBaskets(11).length, 8);
});
