// den-scene-v1/11 (option B, Soft bun): what makes Bao cuter than a cook, in one place the renderer and the tests share.
// A body squat and a bigger head, a softer resting face and eye patches one step lighter. Pure: no React, no DOM.
// Everything here applies to Bao only; the shared glb scene, its geometry and every other panda are never written.

/**
 * Absolute bone scales (the designer's pose table). Absolute, not multiples, because every clip writes scale on every bone.
 * The head carries the face decal and the ears with it; the ears add their own 1.05 on top.
 */
export const BAO_POSE = {
  root: [1, 0.96, 1],
  head: [1.2, 1.18, 1.18],
  ear_L: [1.05, 1.05, 1.05],
  ear_R: [1.05, 1.05, 1.05],
  arm_L: [1.1, 1.1, 1.1],
  arm_R: [1.1, 1.1, 1.1],
};

/**
 * Sets the table on a cloned panda scene. Call it every frame right after `mixer.update(dt)` (the clip has just written
 * scale on every bone) and before anything reads bone matrices. Touches the six named bones only.
 */
export function applyBaoPose(object) {
  for (const [bone, scale] of Object.entries(BAO_POSE)) object.getObjectByName(bone)?.scale.set(...scale);
}

/** Bao rests on a squint with a smile where the director says half_lidded; blinks and every state frame pass through. */
export const faceFor = (id, frame) => (id === "bao" && frame === "half_lidded" ? "content_squint" : frame);

/**
 * The eye patches' window, in bind-pose mesh coordinates: head-dominant vertices on the face side, around the eyes, that
 * are already dark. Each channel moves halfway toward PATCH_TARGET, so the patches stay the darkest part of Bao and stay neutral.
 */
export const PATCH_WINDOW = { minZ: 0.1, minY: 0.15, maxY: 0.55, maxAbsX: 0.5, maxMean: 0.25 };
export const PATCH_TARGET = 0.06;
const PATCH_K = 0.5;

/**
 * A new geometry whose COLOR_0 is a clone with Bao's eye patches softened. The input and its attributes are never written:
 * every other panda shares them.
 * @param {import("three").BufferGeometry} geometry the fur mesh's geometry
 * @param {string[]} jointNames bone names in skeleton (joint index) order
 */
export function softenPatches(geometry, jointNames) {
  const out = geometry.clone();
  const color = out.getAttribute("color");
  const joints = out.getAttribute("skinIndex"), weights = out.getAttribute("skinWeight");
  if (!color || !joints || !weights) return out;
  const pos = out.getAttribute("position");
  const w = PATCH_WINDOW;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) < w.minZ || pos.getY(i) < w.minY || pos.getY(i) > w.maxY || Math.abs(pos.getX(i)) > w.maxAbsX) continue;
    let best = 0, top = -1;
    for (let k = 0; k < 4; k++) {
      const weight = weights.getComponent(i, k);
      if (weight > top) { top = weight; best = joints.getComponent(i, k); }
    }
    if (jointNames[best] !== "head") continue;
    const r = color.getX(i), g = color.getY(i), b = color.getZ(i);
    if ((r + g + b) / 3 > w.maxMean) continue;
    color.setXYZ(i, r + PATCH_K * (PATCH_TARGET - r), g + PATCH_K * (PATCH_TARGET - g), b + PATCH_K * (PATCH_TARGET - b));
  }
  color.needsUpdate = true;
  return out;
}
