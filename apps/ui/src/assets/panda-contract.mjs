// The panda asset contract (spec: "Asset contract"). The exported glb must carry these names.
// Clips and the character director refer to bones, sockets, clips and face frames by these names.
// This module is loaded by the browser (apps/ui/src/scene/dev-scene.mjs, for PROP_ASSETS and the
// other browser-safe constants below), so it must not import a Node built-in at the top level —
// design bounce (ticket 07, HIGH): a top-level `node:fs` import here made the whole module graph
// fail to resolve in a real browser ("Failed to resolve module specifier \"node:fs\""), so
// dev-scene.html never loaded. `readGlbFile` is the only caller of `readFileSync`, and it's used
// only by Node-side tests, so the import is lazy/dynamic inside that function instead.

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
// den-scene-v1/09: where each role's procedural headgear and handheld prop attach, by socket name (the parts
// themselves are in apps/ui/src/scene/headgear.mjs). The scarf is shared and rides the body bone.
//
// A paw socket on panda.glb (measured at sit_still) has its +y axis pointing at the camera (world +z), +z up and +x
// at world -x, so a prop built long-axis +y would be seen end-on. Every prop is turned by PROP_ROTATION (Euler XYZ,
// radians) so its +y is world up and its face (+z) looks at the camera, and may carry a `position` in socket axes:
// flat props (menu, slips, tablet, plate, teacup, seal) are held 0.26 toward the camera and 0.22 up so they clear the
// fist, and the cream cup and plate stand 0.18 outward of the belly (L paw: world +x, R paw: world -x).
export const PROP_ROTATION = [Math.PI / 2, Math.PI, 0];
const FLAT_HELD = [0, 0.26, 0.22]; // socket axes: x sideways, y toward the camera, z up
const flat = (socket, x = 0) => ({ socket, rotation: PROP_ROTATION, position: [x, FLAT_HELD[1], FLAT_HELD[2]] });
const upright = (socket) => ({ socket, rotation: PROP_ROTATION, position: [0, 0, 0] });
const OUTWARD = 0.18; // socket x: +x on paw_R and -x on paw_L both move the prop away from the body
export const ROLE_PLACEMENT = {
  orchestrator: { headgear: { socket: "hat" }, prop: upright("paw_R") },
  product: { headgear: { socket: "hat" }, prop: flat("paw_L") },
  architect: { headgear: { socket: "hat" }, prop: flat("paw_L") },
  developer: { headgear: { socket: "hat" }, prop: flat("paw_L") },
  scout: { headgear: { socket: "hat" }, prop: upright("paw_R") },
  debugger: { headgear: { socket: "hat" }, prop: upright("paw_R") },
  qa: { headgear: { socket: "hat" }, prop: flat("paw_R", OUTWARD) },
  security: { headgear: { socket: "hat" }, prop: flat("paw_R") },
  designer: { headgear: { socket: "hat" }, prop: flat("paw_L", -OUTWARD) },
};
export const SCARF_SOCKET = "body";
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

export async function readGlbFile(path) {
  const { readFileSync } = await import("node:fs");
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
