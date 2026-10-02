// den-scene-v1/11 (option B, Soft bun), part 2: Bao's pose table, face rule, patch softening, reduced motion and the posed feet (T2, T10 to T13).
// These run against the shipped panda.glb through bao-rig.fixture.mjs: real rig, real clips, three's real skinning.
//
// Interface the developer builds in apps/ui/src/scene/bao-pose.mjs (pure: no React, no DOM):
//   BAO_POSE                       { root, head, ear_L, ear_R, arm_L, arm_R }: absolute [x, y, z] bone scales (designer spec, section 1)
//   applyBaoPose(object)           sets those scales on the named bones of a cloned panda scene; touches no other bone. Called per frame
//                                  after mixer.update(dt) (every clip writes scale on every bone, so the values are absolute)
//   faceFor(id, frame)             the atlas frame to show: for id "bao" only, "half_lidded" becomes "content_squint"; every other
//                                  frame, and every other id, passes through unchanged
//   softenPatches(geometry, jointNames)  a NEW BufferGeometry whose COLOR_0 is a clone, with Bao's eye patches moved halfway toward 0.06;
//                                  the input geometry and its attributes are never written (every other panda shares them)
import test from "node:test";
import assert from "node:assert/strict";
import { createCharacterDirector, STATE_MAP } from "../../../../packages/character-director/src/director.mjs";
import { BAO } from "./banquet-layout.mjs";
import { clipDuration, dominantJoints, jointNames, loadPandaGltf, lowestY, newFigure, poseFigure, worldTriangles } from "./bao-rig.fixture.mjs";

const pose = () => import("./bao-pose.mjs");
const TABLE = { root: [1, 0.96, 1], head: [1.2, 1.18, 1.18], ear_L: [1.05, 1.05, 1.05], ear_R: [1.05, 1.05, 1.05], arm_L: [1.1, 1.1, 1.1], arm_R: [1.1, 1.1, 1.1] };
const BAO_AT = { position: [0, 2.1, -3.3], scale: 2.1 };

test("T10: the pose table is the designer's, absolute, for exactly six bones", async () => {
  const { BAO_POSE } = await pose();
  assert.deepEqual(BAO_POSE, TABLE);
});

test("T10: applyBaoPose writes the table over whatever the clip wrote, on those six bones only", async () => {
  const { applyBaoPose } = await pose();
  const gltf = await loadPandaGltf();
  for (const [clip, time] of [["sit_still", 0], ["breathe", 0.7], ["paw_raise", 0.4]]) {
    const plain = poseFigure(newFigure(gltf), { clip, time });
    const posed = poseFigure(newFigure(gltf), { clip, time, override: applyBaoPose });
    for (const [bone, s] of Object.entries(TABLE)) {
      const got = posed.object.getObjectByName(bone).scale;
      assert.deepEqual([got.x, got.y, got.z].map((v) => Math.round(v * 1e6) / 1e6), s, `${clip}: ${bone} scale`);
    }
    for (const name of ["body", "leg_L", "leg_R", "paw_L", "paw_R", "hat"]) {
      assert.deepEqual(posed.object.getObjectByName(name).scale.toArray(), plain.object.getObjectByName(name).scale.toArray(), `${clip}: ${name} is not in the table and must keep the clip's scale`);
    }
  }
});

// Head width over body width of the posed mesh: x extent of the vertices whose dominant joint is head, over those of body.
function headOverBody(fig) {
  const [{ pos }] = worldTriangles(fig);
  const [mesh] = fig.fur;
  const names = jointNames(mesh), dom = dominantJoints(mesh.geometry);
  const ext = { head: [Infinity, -Infinity], body: [Infinity, -Infinity] };
  for (let i = 0; i < dom.length; i++) {
    const e = ext[names[dom[i]]];
    if (!e) continue;
    e[0] = Math.min(e[0], pos[i * 3]); e[1] = Math.max(e[1], pos[i * 3]);
  }
  return (ext.head[1] - ext.head[0]) / (ext.body[1] - ext.body[0]);
}

test("T10 harness check: the unposed panda's head is 0.68 of its body width (the number the designer measured 'today')", async () => {
  const fig = poseFigure(newFigure(await loadPandaGltf()), { clip: "sit_still", ...BAO_AT });
  const r = headOverBody(fig);
  assert.ok(Math.abs(r - 0.68) < 0.01, `ratio ${r.toFixed(3)}`);
});

test("T10: posed Bao's head is 0.78 to 0.86 of his body width", async () => {
  const { applyBaoPose } = await pose();
  const fig = poseFigure(newFigure(await loadPandaGltf()), { clip: "sit_still", ...BAO_AT, override: applyBaoPose });
  const r = headOverBody(fig);
  assert.ok(r >= 0.78 && r <= 0.86, `head over body ${r.toFixed(3)}`);
});

test("T10: the table is for Bao only: posing his clone changes neither the shared scene nor a cook's posed vertices", async () => {
  const { applyBaoPose } = await pose();
  const gltf = await loadPandaGltf();
  const cookBefore = worldTriangles(poseFigure(newFigure(gltf), { clip: "sit_still", scale: 0.3 }))[0].pos;
  const bao = newFigure(gltf);
  poseFigure(bao, { clip: "sit_still", ...BAO_AT, override: applyBaoPose });
  assert.deepEqual(gltf.scene.getObjectByName("head").scale.toArray(), [1, 1, 1], "the shared glb scene's head scale stays 1");
  const cookAfter = worldTriangles(poseFigure(newFigure(gltf), { clip: "sit_still", scale: 0.3 }))[0].pos;
  assert.deepEqual(Array.from(cookAfter), Array.from(cookBefore));
});

test("T2: posed Bao (pose table applied, sit_still, BAO position and scale) stands on the ground: lowest vertex within 0.02 of y 0", async () => {
  const { applyBaoPose } = await pose();
  const fig = poseFigure(newFigure(await loadPandaGltf()), { clip: "sit_still", position: BAO.position, scale: BAO.scale, override: applyBaoPose });
  const y = lowestY(worldTriangles(fig));
  assert.ok(Math.abs(y) <= 0.02, `lowest posed vertex y ${y.toFixed(4)}; set BAO.position[1] so the feet stand on the ground and report the correction`);
});

test("T11: Bao's resting frame is content_squint where the director says half_lidded; a cook keeps half_lidded", async () => {
  const { faceFor } = await pose();
  const director = createCharacterDirector({ random: () => 0.5 });
  director.setState("bao", "idle", 0);
  const idle = director.tick("bao", 0).face;
  assert.equal(idle, "half_lidded", "the director's idle frame is unchanged by this ticket");
  assert.equal(faceFor("bao", idle), "content_squint");
  assert.equal(faceFor("PA-01", "half_lidded"), "half_lidded");
  assert.equal(faceFor("cook-1", idle), "half_lidded");
});

test("T11: every other frame passes through for Bao, blink included, across every state", async () => {
  const { faceFor } = await pose();
  for (const state of Object.keys(STATE_MAP)) {
    const frame = STATE_MAP[state].face;
    assert.equal(faceFor("bao", frame), frame === "half_lidded" ? "content_squint" : frame, `state ${state}`);
  }
  assert.equal(faceFor("bao", "blink"), "blink");
  const director = createCharacterDirector({ random: () => 0 });
  director.setState("bao", "idle", 0);
  director.tick("bao", 0);
  const frames = [1.2, 1.25, 1.3].map((t) => faceFor("bao", director.tick("bao", t).face));
  assert.ok(frames.includes("blink"), `a blink arrives through the rule: ${frames}`);
});

// ---- T12 patch softening

const nearly = (a, b, msg) => assert.ok(Math.abs(a - b) < 2e-4, `${msg}: ${a} vs ${b}`);
const lin = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const FUR = lum(lin(0xfb), lin(0xf8), lin(0xef)); // panda-fur #fbf8ef
const contrast = (L) => (FUR + 0.05) / (L + 0.05);

test("T12: eye patches move halfway toward 0.06 on a cloned COLOR_0; the shared geometry, the nose and the fur are untouched", async () => {
  const { softenPatches } = await pose();
  const fig = newFigure(await loadPandaGltf());
  const mesh = fig.fur[0], names = jointNames(mesh), dom = dominantJoints(mesh.geometry);
  const g = mesh.geometry, pos = g.getAttribute("position"), col = g.getAttribute("color");
  const before = Array.from(col.array);
  const out = softenPatches(g, names);
  assert.notEqual(out, g, "a new geometry");
  assert.notEqual(out.getAttribute("color"), col, "a cloned colour attribute");
  assert.notEqual(out.getAttribute("color").array, col.array);
  assert.deepEqual(Array.from(col.array), before, "the shared geometry's COLOR_0 is not written");
  assert.equal(out.getAttribute("position").count, pos.count);
  const oc = out.getAttribute("color");
  let softened = 0;
  for (let i = 0; i < pos.count; i++) {
    const rgb = [col.getX(i), col.getY(i), col.getZ(i)];
    const mean = (rgb[0] + rgb[1] + rgb[2]) / 3;
    const inWindow = names[dom[i]] === "head" && pos.getZ(i) >= 0.1 && pos.getY(i) >= 0.15 && pos.getY(i) <= 0.55 && Math.abs(pos.getX(i)) <= 0.5 && mean <= 0.25;
    const got = [oc.getX(i), oc.getY(i), oc.getZ(i)];
    if (!inWindow) { got.forEach((v, k) => nearly(v, rgb[k], `vertex ${i} outside the window keeps its colour (channel ${k})`)); nearly(oc.getW(i), col.getW(i), `alpha ${i}`); continue; }
    softened++;
    got.forEach((v, k) => nearly(v, rgb[k] + 0.5 * (0.06 - rgb[k]), `window vertex ${i} channel ${k}`));
    if (Math.max(...rgb) - Math.min(...rgb) < 1e-4) assert.ok(Math.max(...got) - Math.min(...got) < 2e-4, `vertex ${i} stays neutral`);
    if (mean <= 0.1) assert.ok(contrast(lum(...got)) >= 7, `window vertex ${i} reads ${contrast(lum(...got)).toFixed(1)}:1 against panda-fur`);
  }
  assert.ok(softened >= 800, `${softened} window vertices softened`);
});

test("T12: the face decal and attributes other than colour carry over", async () => {
  const { softenPatches } = await pose();
  const mesh = newFigure(await loadPandaGltf()).fur[0];
  const out = softenPatches(mesh.geometry, jointNames(mesh));
  for (const name of ["position", "normal", "skinIndex", "skinWeight"]) assert.equal(out.getAttribute(name).count, mesh.geometry.getAttribute(name).count, name);
  assert.equal(out.index.count, mesh.geometry.index.count);
});

// ---- T13 reduced motion (face and pose; the seats half is in bao-seats.test.mjs)

test("T13: under reduced motion Bao holds sit_still and content_squint, never blinks, and the pose table still applies", async () => {
  const { faceFor, applyBaoPose } = await pose();
  const director = createCharacterDirector({ reducedMotion: true, random: () => 0 });
  director.setCellType("bao", undefined);
  director.setState("bao", "idle", 0);
  const gltf = await loadPandaGltf();
  for (const t of [0, 1.2, 1.25, 3, 10]) {
    const cmd = director.tick("bao", t);
    assert.equal(cmd.clip, "sit_still");
    assert.equal(faceFor("bao", cmd.face), "content_squint", `t ${t}`);
  }
  const held = poseFigure(newFigure(gltf), { clip: director.tick("bao", 5).clip, time: clipDuration(gltf, "sit_still") * 0.9, ...BAO_AT, override: applyBaoPose });
  assert.deepEqual(held.object.getObjectByName("head").scale.toArray().map((v) => Math.round(v * 1e6) / 1e6), [1.2, 1.18, 1.18]);
});
