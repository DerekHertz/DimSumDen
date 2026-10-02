// den-scene-v1/11 (option B, Soft bun), part 2: the Pass seats touch Bao's posed mesh, through his idle clip and his breathing (T9, and T13's seats half).
// Measured on the real panda.glb through bao-rig.fixture.mjs. The surface is the posed fur mesh; a Pass panda's lowest point is the lowest
// posed vertex of a cook-scale panda placed the way Den.jsx places one (at.y + footLift).
//
// Interface the developer builds in apps/ui/src/scene/bao-seats.mjs (pure but for reading three bones; imports banquet-layout.mjs):
//   bakeBaoSeats(bao)               bao = Bao's cloned glb scene (the Object3D inside the positioned group), posed at sit_still with the pose
//                                   table applied and world matrices updated. For orchestrator, product and architect, slots 0 to 2, takes the
//                                   rest column (x, z) from placeCell, finds the top of the posed mesh in that column (a downward ray, or the
//                                   highest posed vertex), and stores it as (bone, offset in that bone's space). The rail bakes the same way
//                                   on the head bone, from the crown at x 0. Returns an opaque object.
//   seatWorld(baked, cellType, slot)  world { x, y, z } of that seat NOW, from the bones' current matrixWorld. Orchestrator seats are the rail
//                                   top (a panda's base stands on it); product and architect seats are the arm-top surface.
//   railWorld(baked)                world { x, y, z } of the rail's centre now (RAIL.height thick, so top = y + height / 2).
// A Pass panda's seat moves with its bone every frame: bake once, then call seatWorld after the pose is applied.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { RAIL, placeCell } from "./banquet-layout.mjs";
import { clipDuration, footLiftFor, loadPandaGltf, lowestY, newFigure, poseFigure, surfaceY, worldTriangles } from "./bao-rig.fixture.mjs";

const seats = () => import("./bao-seats.mjs");
const pose = () => import("./bao-pose.mjs");
const BAO_AT = { position: [0, 2.1, -3.3], scale: 2.1 };
const TOL = 0.02;
const SEATS = [["orchestrator", 0], ["orchestrator", 1], ["orchestrator", 2], ["product", 0], ["product", 1], ["product", 2], ["architect", 0], ["architect", 1], ["architect", 2]];

async function setup() {
  const { applyBaoPose } = await pose();
  const { bakeBaoSeats } = await seats();
  const gltf = await loadPandaGltf();
  const bao = newFigure(gltf);
  const at = (clip, time) => { poseFigure(bao, { clip, time, ...BAO_AT, override: applyBaoPose }); return worldTriangles(bao); };
  at("sit_still", 0);
  const baked = bakeBaoSeats(bao.object);
  // A cook's lowest posed vertex relative to the seat it is placed on (Den.jsx puts it at at.y + footLift).
  const cook = poseFigure(newFigure(gltf), { clip: "sit_still", position: [0, footLiftFor(gltf), 0], scale: 0.3 });
  return { gltf, bao, at, baked, cookFoot: lowestY(worldTriangles(cook)) };
}

test("T9: at rest the seats are the designer's measured seats (within 0.03 model units) and sit in the layout's columns", async () => {
  const { seatWorld, railWorld } = await seats();
  const { baked } = await setup();
  const table = { orchestrator: [0, 4.2714, -3.6885], product: [-1.722, 2.289, -3.384], architect: [1.722, 2.289, -3.384] };
  for (const [type, p] of Object.entries(table)) {
    const s = seatWorld(baked, type, 0);
    [s.x, s.y, s.z].forEach((v, k) => assert.ok(Math.abs(v - p[k]) <= 0.03 * 2.1, `${type} axis ${k}: ${v.toFixed(4)} vs ${p[k]}`));
  }
  for (const [type, slot] of SEATS) {
    const s = seatWorld(baked, type, slot), l = placeCell(type, slot);
    assert.ok(Math.abs(s.x - l.x) <= TOL && Math.abs(s.z - l.z) <= TOL, `${type}#${slot} column (${s.x.toFixed(3)}, ${s.z.toFixed(3)}) vs layout (${l.x.toFixed(3)}, ${l.z.toFixed(3)})`);
  }
  const rail = railWorld(baked);
  assert.ok(Math.abs(rail.y - 4.2465) <= 0.063 && Math.abs(rail.z - -3.6885) <= 0.063 && Math.abs(rail.x) <= 0.02, `rail centre ${JSON.stringify(rail)}`);
});

const SAMPLES = [["sit_still", 0]];
const breatheAt = (gltf) => [0, 0.25, 0.5, 0.75].map((f) => ["breathe", f * clipDuration(gltf, "breathe")]);

test("T9: every Pass panda's lowest point is within 0.02 of Bao's posed surface at its seat, at sit_still and four samples of breathe", async () => {
  const { seatWorld, railWorld } = await seats();
  const { gltf, at, baked, cookFoot } = await setup();
  let worst = 0;
  for (const [clip, time] of [...SAMPLES, ...breatheAt(gltf)]) {
    const tris = at(clip, time);
    for (const [type, slot] of SEATS.filter(([t]) => t !== "orchestrator")) {
      const s = seatWorld(baked, type, slot);
      const surface = surfaceY(tris, s.x, s.z);
      assert.notEqual(surface, null, `${clip}@${time.toFixed(2)} ${type}#${slot}: the column at (${s.x.toFixed(3)}, ${s.z.toFixed(3)}) misses Bao; report the numbers, do not clamp`);
      const gap = s.y + cookFoot - surface;
      worst = Math.max(worst, Math.abs(gap));
      assert.ok(Math.abs(gap) <= TOL, `${clip}@${time.toFixed(2)} ${type}#${slot}: the panda's lowest point is ${gap.toFixed(4)} from Bao's surface`);
    }
  }
  assert.ok(worst <= TOL, `worst ${worst}`);
});

test("T9: the orchestrator chain: panda base on the rail top within 0.02, rail underside on the crown (x 0) within 0.02, through breathe", async () => {
  const { seatWorld, railWorld } = await seats();
  const { gltf, at, baked, cookFoot } = await setup();
  for (const [clip, time] of [...SAMPLES, ...breatheAt(gltf)]) {
    const tris = at(clip, time);
    const rail = railWorld(baked);
    const crown = surfaceY(tris, rail.x, rail.z);
    assert.notEqual(crown, null, `${clip}@${time.toFixed(2)}: no head under the rail`);
    const under = rail.y - RAIL.height / 2;
    assert.ok(Math.abs(under - crown) <= TOL, `${clip}@${time.toFixed(2)}: rail underside ${under.toFixed(4)} vs crown ${crown.toFixed(4)}`);
    for (const slot of [0, 1, 2]) {
      const s = seatWorld(baked, "orchestrator", slot);
      const base = s.y + cookFoot, top = rail.y + RAIL.height / 2;
      assert.ok(Math.abs(base - top) <= TOL, `${clip}@${time.toFixed(2)} orchestrator#${slot}: base ${base.toFixed(4)} vs rail top ${top.toFixed(4)}`);
    }
  }
});

test("T9: the seats follow the bones: breathing lifts the head, and the orchestrator seat rises with it instead of staying where it was baked", async () => {
  const { seatWorld } = await seats();
  const { gltf, at, baked } = await setup();
  const rest = seatWorld(baked, "orchestrator", 0).y;
  const ys = breatheAt(gltf).map(([clip, time]) => { at(clip, time); return seatWorld(baked, "orchestrator", 0).y; });
  const spread = Math.max(...ys) - Math.min(...ys);
  assert.ok(spread > 0.02, `the head moves about 0.05 world over breathe; the seat moved ${spread.toFixed(4)}`);
  assert.ok(Number.isFinite(rest));
});

test("T13: under reduced motion the held pose is sit_still and the seats equal their rest seats", async () => {
  const { seatWorld } = await seats();
  const { at, baked } = await setup();
  const rest = SEATS.map(([t, s]) => seatWorld(baked, t, s));
  const director = createCharacterDirector({ reducedMotion: true });
  director.setState("bao", "idle", 0);
  const cmd = director.tick("bao", 7);
  at(cmd.clip, 0.6);
  SEATS.forEach(([t, s], i) => {
    const now = seatWorld(baked, t, s);
    for (const k of ["x", "y", "z"]) assert.ok(Math.abs(now[k] - rest[i][k]) <= 0.005, `${t}#${s} ${k}: ${now[k]} vs rest ${rest[i][k]}`);
  });
});

// The renderer's side of the contract can only be seen in a browser (same-frame ordering is human-verified), but the wiring must exist.
test("wiring: Den.jsx poses and re-faces Bao only, after the mixer; the rail and bell read the seat store in Market.jsx", () => {
  const den = fs.readFileSync(new URL("./Den.jsx", import.meta.url), "utf8");
  const market = fs.readFileSync(new URL("./Market.jsx", import.meta.url), "utf8");
  for (const needle of ["./bao-pose.mjs", "./bao-seats.mjs", "applyBaoPose", "faceFor", "softenPatches", "bakeBaoSeats", "seatWorld"]) assert.ok(den.includes(needle), `Den.jsx mentions ${needle}`);
  assert.ok(den.indexOf("mixer.update(dt)") < den.indexOf("applyBaoPose("), "the pose override runs after mixer.update(dt)");
  assert.ok(market.includes("./bao-seats.mjs") && market.includes("railWorld"), "Market.jsx places the rail from the seat store");
});
