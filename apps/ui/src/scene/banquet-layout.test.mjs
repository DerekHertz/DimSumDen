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
  near(await at("orchestrator", 0), [0, 2.688, -2.4], "orchestrator");
  near(await at("product", 0), [-1.54, 2.016, -2.155], "product");
  near(await at("architect", 0), [1.54, 2.016, -2.155], "architect");
});

test("Pass perches: a second cell of the same type steps 0.4 outward", async () => {
  near(await at("orchestrator", 1), [0.4, 2.688, -2.4]);
  near(await at("product", 1), [-1.94, 2.016, -2.155]);
  near(await at("architect", 1), [1.94, 2.016, -2.155]);
});

test("stalls: Steamers back-left, Front of House back-right, Tea front-left, Pantry front-right", async () => {
  near(await at("developer", 1), [-4.8, 1.1, -1.6], "steamers centre slot");
  near(await at("designer", 1), [4.8, 1.1, -1.6], "front of house");
  near(await at("qa", 1), [-4.0, 0.6, 2.2], "tea");
  near(await at("security", 1), [4.0, 0.6, 2.2], "pantry");
});

test("developer, scout and debugger share the Steamers slots", async () => {
  for (const c of ["developer", "scout", "debugger"]) near(await at(c, 0), [-5.55, 1.1, -1.6], c);
});

test("a stall's three slots are fixed anchors whatever the head count up to three", async () => {
  for (const count of [1, 2, 3, undefined]) {
    near(await at("qa", 0, count), [-4.75, 0.6, 2.2], `slot 0 of ${count}`);
    near(await at("qa", 2, count), [-3.25, 0.6, 2.2], `slot 2 of ${count}`);
  }
});

test("overflow: a stall with five cells widens outward along the front", async () => {
  near(await at("security", 0, 5), [3.25, 0.6, 2.2]);
  near(await at("security", 2, 5), [4.75, 0.6, 2.2]);
  near(await at("security", 4, 5), [6.25, 0.6, 2.2]);
});

test("stallWidth is 2.25 up to three cells, then 0.75 per cell", async () => {
  const { stallWidth } = await load();
  assert.equal(stallWidth(0), 2.25);
  assert.equal(stallWidth(3), 2.25);
  assert.equal(stallWidth(6), 4.5);
});

test("cubs (unknown cell types) queue in a row at the cub basket, front centre", async () => {
  near(await at("mystery", 1), [0, 0, 4.6]);
  near(await at("mystery", 0), [-0.75, 0, 4.6]);
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

// Fix round 2: clearances. Bao is about 1.95 wide (measured), scale 1.4, so his body reaches |x| 1.37;
// a shoulder cell in slot 1 stands at |x| 1.94, about 0.3 wide either side.
test("back stalls' roofs stay at least 1.0 clear of Bao and his shoulder cells", async () => {
  const { STALL_CENTERS, stallWidth } = await load();
  const shoulderOuter = 1.94 + 0.3;
  for (const key of ["steamers", "front-of-house"]) {
    const inner = Math.abs(STALL_CENTERS[key].x) - stallWidth(3) / 2;
    assert.ok(inner - shoulderOuter >= 1.0, `${key} inner edge ${inner}`);
  }
});

test("cub row stands clear of the cub basket (radius 0.55) by a cell's half width", async () => {
  const { CUB_BASKET, CUB_BASKET_RADIUS } = await load();
  const cub = await at("mystery", 1);
  assert.equal(CUB_BASKET_RADIUS, 0.55);
  assert.ok(cub[2] - CUB_BASKET.z >= CUB_BASKET_RADIUS + 0.35);
});

test("overflow widens outward: every stall's inner edge stays fixed, on both sides", async () => {
  const { STALL_CENTERS, stallCenterX, stallWidth } = await load();
  for (const station of Object.keys(STALL_CENTERS)) {
    const sign = Math.sign(STALL_CENTERS[station].x);
    const inner = (count) => stallCenterX(station, count) - sign * stallWidth(count) / 2;
    for (const count of [3, 5, 8]) assert.ok(Math.abs(inner(count) - inner(3)) < 1e-9, `${station} ${count}`);
  }
});

test("overflow, worked: Steamers with five cells grows left, its inner edge stays at -3.675", async () => {
  near([(await at("developer", 0, 5))[0]], [-7.05]);
  near([(await at("developer", 4, 5))[0]], [-4.05]);
});

// showcase-v1/04 (user browser check): the front stalls must not hide the back row from the default
// camera at (0, 4.2, 11.5). The sight line to each back cell's feet has to clear the front roof.
test("front-row roofs stay below the sight line from the default camera to every back-row cell", async () => {
  const { STALL_CENTERS, stallCenterX, stallWidth, counterTop, stallRoof } = await load();
  const cam = { x: 0, y: 4.2, z: 11.5 };
  const roof = stallRoof("tea");
  const apex = roof.eave + roof.rise;
  for (const [back, front] of [["steamers", "tea"], ["front-of-house", "pantry"]]) {
    const fz = STALL_CENTERS[front].z;
    const fx = stallCenterX(front, 3);
    const half = stallWidth(3) / 2;
    for (const slot of [0, 1, 2]) {
      const tx = (await at(back === "steamers" ? "developer" : "designer", slot))[0];
      const ty = counterTop(back) + 0.15;
      const tz = STALL_CENTERS[back].z;
      for (let z = fz - 0.5; z <= fz + 0.5; z += 0.05) {
        const f = (cam.z - z) / (cam.z - tz);
        const x = cam.x + f * (tx - cam.x);
        const y = cam.y + f * (ty - cam.y);
        if (Math.abs(x - fx) <= half) assert.ok(y >= apex + 0.1, `${back} slot ${slot}: sight line y ${y.toFixed(2)} at z ${z.toFixed(2)} is under the ${front} roof apex ${apex}`);
      }
    }
  }
});

test("the front stalls stand nearer the table than the back stalls, so the two rows stagger", async () => {
  const { STALL_CENTERS } = await load();
  assert.ok(Math.abs(STALL_CENTERS.tea.x) < Math.abs(STALL_CENTERS.steamers.x));
  assert.ok(Math.abs(STALL_CENTERS.pantry.x) < Math.abs(STALL_CENTERS["front-of-house"].x));
});

test("a front stall's cells still fit under its low roof eave", async () => {
  const { stallRoof, counterTop } = await load();
  const cellHeight = 0.6; // plush scale 0.3 on a 2-unit panda
  assert.ok(stallRoof("tea").eave - counterTop("tea") >= cellHeight + 0.15);
  assert.equal(stallRoof("steamers"), undefined);
});
