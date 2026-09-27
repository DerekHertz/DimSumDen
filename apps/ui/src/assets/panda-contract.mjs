// The panda asset contract (spec: "Asset contract"). The exported glb must carry these names.
// Clips and the character director refer to bones, sockets, clips and face frames by these names.
import { readFileSync } from "node:fs";

export const DEFORM_BONES = ["root", "body", "head", "ear_L", "ear_R", "arm_L", "arm_R", "leg_L", "leg_R"];
export const SOCKETS = ["paw_L", "paw_R", "hat"];
export const CLIPS = [
  "sit_still", "breathe", "blink", "paw_raise", "arms_folded", "slump", "lean_back", "doze", "wave",
  "fan_tap_and_point", "scroll_unroll", "blueprint_unroll",
];
export const LOOPS = ["breathe", "paw_raise", "doze", "fan_tap_and_point", "scroll_unroll", "blueprint_unroll"];

// Per-type idle habits (spec.md "Per-type idle habits", ticket 07): the three modeled Brain types
// each carry a prop, attached to a socket by name, that loops while the cell is "working". The prop
// itself is a separate glb (spec.md "Export"), not baked into panda.glb.
export const PROP_ASSETS = {
  orchestrator: { file: "props/fan.glb", socket: "paw_R", clip: "fan_tap_and_point" },
  product: { file: "props/scroll.glb", socket: "paw_L", clip: "scroll_unroll" },
  architect: { file: "props/blueprint.glb", socket: "paw_L", clip: "blueprint_unroll" },
};
export const FACE_FRAMES = [
  "blink", "content_squint", "wide_eyes", "half_lidded", "focused_squint",
  "narrowed", "eyes_shut_savoring", "sour_pucker", "sleepy", "yawn",
];
export const FACE_NODE = "face";

// Design system motion token (project/tokens.json in the design system artifact).
export const DUR_HEARTBEAT = 1.2;

/** Reads the JSON chunk of a glTF binary. */
export function readGlbJson(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glb");
  const len = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + len).toString("utf8"));
}

export function readGlbFile(path) {
  return readGlbJson(readFileSync(path));
}

const clipDuration = (gltf, anim) =>
  Math.max(0, ...anim.samplers.map((s) => gltf.accessors[s.input].max?.[0] ?? 0));

/** Returns a list of contract violations; empty means the asset satisfies the contract. */
export function checkPandaGltf(gltf) {
  const failures = [];
  const nodes = gltf.nodes ?? [];

  const joints = new Set((gltf.skins ?? []).flatMap((s) => s.joints.map((i) => nodes[i]?.name)));
  for (const b of DEFORM_BONES) if (!joints.has(b)) failures.push(`missing bone ${b}`);
  for (const s of SOCKETS) if (!joints.has(s)) failures.push(`missing socket ${s}`);

  const anims = new Map((gltf.animations ?? []).map((a) => [a.name, a]));
  for (const c of CLIPS) if (!anims.has(c)) failures.push(`missing clip ${c}`);
  for (const [name, a] of anims) {
    if (!(LOOPS.includes(name) || a.extras?.loop)) continue;
    const d = clipDuration(gltf, a);
    if (d < DUR_HEARTBEAT - 1e-3) failures.push(`loop ${name} is ${d.toFixed(3)} s, shorter than dur-heartbeat (${DUR_HEARTBEAT} s)`);
  }

  const face = nodes.find((n) => n.name === FACE_NODE);
  const atlas = face?.extras?.faceAtlas;
  if (!face) failures.push(`missing face node ${FACE_NODE}`);
  else if (!atlas) failures.push("face node has no faceAtlas extras");
  else {
    const cells = atlas.cols * atlas.rows;
    for (const f of FACE_FRAMES) {
      const i = atlas.frames?.[f];
      if (!Number.isInteger(i) || i < 0 || i >= cells) failures.push(`missing face frame ${f}`);
    }
    const mat = gltf.materials?.[gltf.meshes?.[face.mesh]?.primitives?.[0]?.material];
    if (mat?.pbrMetallicRoughness?.baseColorTexture === undefined) failures.push("face material has no atlas texture");
  }

  // The plush look lives in vertex colours; without them the body renders flat grey.
  const body = nodes.filter((n) => n.skin !== undefined && n.mesh !== undefined && n.name !== FACE_NODE);
  const coloured = body.some((n) => gltf.meshes[n.mesh].primitives.every((p) => p.attributes?.COLOR_0 !== undefined));
  if (!coloured) failures.push("body mesh has no vertex colours (COLOR_0)");
  return failures;
}
