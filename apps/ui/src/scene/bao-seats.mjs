// den-scene-v1/11: the Pass pandas sit ON Bao, and they move with him. Each seat is baked once from his posed mesh as
// (bone, offset in that bone's space) and read back through the bone's live world matrix, so a seat rides his breathing
// instead of staying where it was baked. The orchestrator stands on the rail, which sits on the crown (head bone);
// product and architect stand where the column meets his side, anchored to the bone that skins the surface there (the
// arm bone on their side; the mirrored L and R names never decide it, the surface does).
//
// The rest column (x, z) of every seat comes from banquet-layout.mjs placeCell; this module finds the height there.
import * as THREE from "three";
import { RAIL, placeCell } from "./banquet-layout.mjs";

const SLOTS = 3;
const PASS_TYPES = ["orchestrator", "product", "architect"];

/** The fur mesh (the face decal is a second skinned mesh and is not a surface a panda can stand on). */
const furOf = (bao) => {
  let found = null;
  bao.traverse((n) => { if (!found && n.isSkinnedMesh && n.name !== "face") found = n; });
  return found;
};

/**
 * The posed world-space top of the mesh in the column (x, z): its height and the bone (joint index) that skins the surface
 * there, or null where the column misses the mesh.
 */
function surfaceTop(mesh, x, z) {
  const geometry = mesh.geometry;
  const count = geometry.getAttribute("position").count;
  const v = new THREE.Vector3();
  const pos = new Float64Array(count * 3);
  for (let i = 0; i < count; i++) {
    mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
  }
  const index = geometry.index.array;
  const joints = geometry.getAttribute("skinIndex"), weights = geometry.getAttribute("skinWeight");
  let best = null;
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
    if (best === null || y > best.y) best = { y, tri: [index[t], index[t + 1], index[t + 2]], bary: [l1, l2, l3] };
  }
  if (!best) return null;
  const share = new Map();
  best.tri.forEach((vertex, n) => {
    for (let k = 0; k < 4; k++) share.set(joints.getComponent(vertex, k), (share.get(joints.getComponent(vertex, k)) ?? 0) + best.bary[n] * weights.getComponent(vertex, k));
  });
  const [joint] = [...share.entries()].sort((p, q) => q[1] - p[1])[0];
  return { y: best.y, bone: mesh.skeleton.bones[joint] };
}

const keyOf = (type, slot) => `${type}#${Math.min(slot, SLOTS - 1)}`;

/**
 * Bakes the Pass seats and the rail. `bao` is Bao's cloned glb scene (inside its positioned group), posed at sit_still with the
 * pose table applied and world matrices current. Returns an opaque object for seatWorld and railWorld.
 */
export function bakeBaoSeats(bao) {
  bao.updateWorldMatrix(true, true);
  const mesh = furOf(bao);
  mesh.skeleton.update();
  const head = bao.getObjectByName("head");
  const anchor = (bone, world) => ({ bone, offset: bone.worldToLocal(world.clone()) });
  const seats = new Map();
  const crown = placeCell("orchestrator", 0);
  const top = surfaceTop(mesh, RAIL.x, crown.z);
  if (!top) throw new Error("bakeBaoSeats: no head under the rail column");
  const rail = anchor(head, new THREE.Vector3(RAIL.x, top.y + RAIL.height / 2, crown.z));
  for (const type of PASS_TYPES) {
    for (let slot = 0; slot < SLOTS; slot++) {
      const at = placeCell(type, slot);
      if (type === "orchestrator") {
        seats.set(keyOf(type, slot), anchor(head, new THREE.Vector3(at.x, top.y + RAIL.height, at.z)));
        continue;
      }
      const hit = surfaceTop(mesh, at.x, at.z);
      if (!hit) throw new Error(`bakeBaoSeats: the column at (${at.x.toFixed(3)}, ${at.z.toFixed(3)}) misses Bao (${type}#${slot})`);
      seats.set(keyOf(type, slot), anchor(hit.bone, new THREE.Vector3(at.x, hit.y, at.z)));
    }
  }
  return { rail, seats };
}

const read = ({ bone, offset }) => {
  const p = offset.clone().applyMatrix4(bone.matrixWorld);
  return { x: p.x, y: p.y, z: p.z };
};

/** Where a Pass cell's feet stand NOW (a fourth cell and beyond share the last seat), from the bones' current world matrices. */
export const seatWorld = (baked, cellType, slot) => read(baked.seats.get(keyOf(cellType, slot)));

/** The rail's centre NOW; its top is `RAIL.height / 2` above. */
export const railWorld = (baked) => read(baked.rail);
