// den-scene-v1/11 test harness: loads the shipped apps/ui/public/models/panda.glb in node with three's own GLTFLoader and
// returns posed skinned-mesh vertices. Not a mock: the real rig, the real clips, three's real skinning. The glb's
// face-atlas image is stripped before parsing (node has no image decoder; no test reads a texture), nothing else is changed.
//
//   const gltf = await loadPandaGltf();
//   const fig = newFigure(gltf);                       // a fresh clone, as Den.jsx's Figure makes one
//   poseFigure(fig, { clip: "sit_still", time: 0, position: [0, 2.1, -3.3], scale: 2.1, override: applyBaoPose });
//   const tris = worldTriangles(fig);                  // posed, world-space, fur mesh only (the face decal is skipped)
//   lowestY(tris);  surfaceY(tris, x, z);
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

export const PANDA_GLB = new URL("../../public/models/panda.glb", import.meta.url);

// A GLB is a 12 byte header, a JSON chunk and a BIN chunk. Rebuild it with the texture references removed.
function stripImages(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const jsonLen = view.getUint32(12, true);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  delete json.images;
  delete json.textures;
  delete json.samplers;
  for (const m of json.materials ?? []) delete m.pbrMetallicRoughness?.baseColorTexture;
  let text = JSON.stringify(json);
  while (text.length % 4) text += " ";
  const jsonBytes = Buffer.from(text, "utf8");
  const bin = buf.subarray(20 + jsonLen); // the BIN chunk, header included
  const out = Buffer.alloc(12 + 8 + jsonBytes.length + bin.length);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jsonBytes.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  jsonBytes.copy(out, 20);
  bin.copy(out, 20 + jsonBytes.length);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.length);
}

let cached;
/** The parsed glb: { scene, animations, json }. One parse per process; every test that needs a fresh panda calls newFigure. */
export function loadPandaGltf() {
  cached ??= new Promise((resolve, reject) => {
    new GLTFLoader().parse(stripImages(fs.readFileSync(PANDA_GLB)), "", (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations, json: gltf.parser.json }), reject);
  });
  return cached;
}

/** A fresh skinned clone inside a group (the group carries position and scale, like Den.jsx's Figure). */
export function newFigure(gltf) {
  const object = cloneSkinned(gltf.scene);
  const root = new THREE.Group();
  root.add(object);
  const mixer = new THREE.AnimationMixer(object);
  const meshes = [];
  object.traverse((n) => { if (n.isSkinnedMesh) meshes.push(n); });
  return { root, object, mixer, gltf, meshes, fur: meshes.filter((m) => m.name !== "face") };
}

/**
 * Samples `clip` at `time` seconds, applies `override(object)` (Bao's pose table) after the mixer, as the renderer must,
 * then updates matrices and skeletons. position and scale go on the group.
 */
export function poseFigure(fig, { clip, time = 0, position = [0, 0, 0], scale = 1, override } = {}) {
  fig.mixer.stopAllAction();
  fig.mixer.uncacheRoot(fig.object);
  const animation = fig.gltf.animations.find((c) => c.name === clip);
  if (!animation) throw new Error(`panda.glb has no clip ${clip}`);
  const action = fig.mixer.clipAction(animation);
  action.play();
  action.time = time;
  fig.mixer.update(0);
  if (override) override(fig.object);
  fig.root.position.set(...position);
  fig.root.scale.setScalar(scale);
  fig.root.updateMatrixWorld(true);
  for (const m of fig.meshes) m.skeleton.update();
  return fig;
}

/** Duration in seconds of a clip. */
export const clipDuration = (gltf, name) => gltf.animations.find((c) => c.name === name).duration;

/** Posed world-space triangles of the fur meshes: [{ pos: Float64Array (x y z per vertex), index }]. */
export function worldTriangles(fig, { includeFace = false } = {}) {
  const v = new THREE.Vector3();
  return (includeFace ? fig.meshes : fig.fur).map((mesh) => {
    const geometry = mesh.geometry;
    const count = geometry.getAttribute("position").count;
    const pos = new Float64Array(count * 3);
    for (let i = 0; i < count; i++) {
      mesh.getVertexPosition(i, v);
      v.applyMatrix4(mesh.matrixWorld);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    }
    return { pos, index: geometry.index.array, mesh };
  });
}

/** The lowest posed vertex y. */
export function lowestY(tris) {
  let y = Infinity;
  for (const { pos } of tris) for (let i = 1; i < pos.length; i += 3) if (pos[i] < y) y = pos[i];
  return y;
}

/** The highest surface y over the column (x, z): the top of every posed triangle that the column passes through, or null. */
export function surfaceY(tris, x, z) {
  let best = null;
  for (const { pos, index } of tris) {
    for (let t = 0; t < index.length; t += 3) {
      const a = index[t] * 3, b = index[t + 1] * 3, c = index[t + 2] * 3;
      const ax = pos[a], az = pos[a + 2], bx = pos[b], bz = pos[b + 2], cx = pos[c], cz = pos[c + 2];
      if ((x < ax && x < bx && x < cx) || (x > ax && x > bx && x > cx) || (z < az && z < bz && z < cz) || (z > az && z > bz && z > cz)) continue;
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(d) < 1e-12) continue;
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d;
      const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
      const y = l1 * pos[a + 1] + l2 * pos[b + 1] + l3 * pos[c + 1];
      if (best === null || y > best) best = y;
    }
  }
  return best;
}

/** What Den.jsx does for a cook: lift by the bind pose's half height at PLUSH_SCALE so the feet stand on the seat. */
export const footLiftFor = (gltf, scale = 0.3) => -new THREE.Box3().setFromObject(gltf.scene).min.y * scale;

/** The name of each joint index of a skinned mesh, in skeleton order. */
export const jointNames = (mesh) => mesh.skeleton.bones.map((b) => b.name);

/** The dominant joint (largest weight) of every vertex of a geometry: an array of joint indices. */
export function dominantJoints(geometry) {
  const joints = geometry.getAttribute("skinIndex"), weights = geometry.getAttribute("skinWeight");
  const out = new Int32Array(joints.count);
  for (let i = 0; i < joints.count; i++) {
    let best = 0, w = -1;
    for (let k = 0; k < 4; k++) { const wk = weights.getComponent(i, k); if (wk > w) { w = wk; best = joints.getComponent(i, k); } }
    out[i] = best;
  }
  return out;
}
