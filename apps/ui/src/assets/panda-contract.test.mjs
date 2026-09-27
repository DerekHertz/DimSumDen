import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLIPS, DEFORM_BONES, DUR_HEARTBEAT, FACE_FRAMES, FACE_NODE, LOOPS, SOCKETS, PROP_ASSETS,
  checkPandaGltf, readGlbFile,
} from "./panda-contract.mjs";

const PANDA_GLB = new URL("../../public/models/panda.glb", import.meta.url);

// The smallest glTF that satisfies the contract; each test breaks one thing.
function validGltf() {
  const joints = [...DEFORM_BONES, ...SOCKETS].map((name) => ({ name }));
  const accessors = [{ max: [DUR_HEARTBEAT * 2] }, { max: [0.2] }];
  return {
    nodes: [
      ...joints,
      { name: FACE_NODE, mesh: 0, skin: 0, extras: { faceAtlas: { cols: 4, rows: 4, frames: Object.fromEntries(FACE_FRAMES.map((f, i) => [f, i])) } } },
      { name: "body", mesh: 1, skin: 0 },
    ],
    skins: [{ joints: joints.map((_, i) => i) }],
    meshes: [{ primitives: [{ material: 0 }] }, { primitives: [{ attributes: { COLOR_0: 0 } }] }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
    accessors,
    animations: CLIPS.map((name) => ({ name, samplers: [{ input: LOOPS.includes(name) ? 0 : 1 }] })),
  };
}

const faceNode = (g) => g.nodes.find((n) => n.name === FACE_NODE);

test("a complete asset passes", () => {
  assert.deepEqual(checkPandaGltf(validGltf()), []);
});

test("fails when a bone or socket is missing", () => {
  for (const name of ["arm_R", "hat"]) {
    const g = validGltf();
    g.nodes.find((n) => n.name === name).name = "renamed";
    assert.ok(checkPandaGltf(g).some((f) => f.includes(name)), name);
  }
});

test("fails when a clip is missing", () => {
  const g = validGltf();
  g.animations = g.animations.filter((a) => a.name !== "blink");
  assert.deepEqual(checkPandaGltf(g), ["missing clip blink"]);
});

test("fails when a face frame is missing", () => {
  const g = validGltf();
  delete faceNode(g).extras.faceAtlas.frames.sour_pucker;
  assert.deepEqual(checkPandaGltf(g), ["missing face frame sour_pucker"]);
});

test("fails when a face frame falls outside the atlas", () => {
  const g = validGltf();
  faceNode(g).extras.faceAtlas.frames.yawn = 16;
  assert.deepEqual(checkPandaGltf(g), ["missing face frame yawn"]);
});

test("fails when a loop is shorter than dur-heartbeat", () => {
  const g = validGltf();
  g.accessors[0].max = [DUR_HEARTBEAT - 0.1];
  assert.equal(checkPandaGltf(g).length, LOOPS.length);
});

test("fails when a clip flagged as a loop is shorter than dur-heartbeat", () => {
  const g = validGltf();
  g.animations.find((a) => a.name === "wave").extras = { loop: true };
  assert.match(checkPandaGltf(g).join(), /loop wave/);
});

test("fails when the skinned body has no vertex colours", () => {
  const g = validGltf();
  delete g.meshes[1].primitives[0].attributes.COLOR_0;
  assert.deepEqual(checkPandaGltf(g), ["body mesh has no vertex colours (COLOR_0)"]);
});

test("the exported panda.glb satisfies the contract", () => {
  assert.deepEqual(checkPandaGltf(readGlbFile(PANDA_GLB)), []);
});

test("each Brain type's prop names a contract clip, socket and an exported prop glb (ticket 07)", () => {
  for (const [cellType, spec] of Object.entries(PROP_ASSETS)) {
    assert.ok(CLIPS.includes(spec.clip), `${cellType}'s clip "${spec.clip}" is not a contract clip`);
    assert.ok(SOCKETS.includes(spec.socket), `${cellType}'s socket "${spec.socket}" is not a contract socket`);
    const propGlb = new URL(`../../public/models/${spec.file}`, import.meta.url);
    const gltf = readGlbFile(propGlb); // throws if the file is missing or not a valid glb
    assert.ok(gltf.meshes?.length > 0, `${spec.file} has no mesh`);
  }
});
