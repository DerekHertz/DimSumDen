// PROTOTYPE (ticket 01, throwaway). Checks panda-motion-test.glb against the motion-test contract.
// Usage: node check-glb.mjs [path/to.glb]   (no dependencies; exits 1 on failure)
import { readFileSync } from "node:fs";

const path = process.argv[2] ?? new URL("./panda-motion-test.glb", import.meta.url);
const buf = readFileSync(path);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));

const DEFORM = ["root", "body", "head", "ear_L", "ear_R", "arm_L", "arm_R", "leg_L", "leg_R"];
const SOCKETS = ["paw_L", "paw_R", "hat"];
const CLIPS = ["breathe", "paw_raise", "hop", "waddle"];
const STATE_CLIPS = ["sit_still", "arms_folded", "lean_back", "slump", "doze", "wave"];
const LOOPS = ["breathe", "paw_raise", "waddle", "doze"];
const DUR_HEARTBEAT = 1.2;

const failures = [];
const expect = (ok, msg) => { if (!ok) failures.push(msg); };

const skin = gltf.skins?.[0];
expect(gltf.skins?.length === 1, "exactly one skin");
const joints = new Set((skin?.joints ?? []).map((i) => gltf.nodes[i].name));
for (const b of [...DEFORM, ...SOCKETS]) expect(joints.has(b), `joint ${b}`);

const clipLen = {};
for (const a of gltf.animations ?? []) {
  clipLen[a.name] = Math.max(...a.samplers.map((s) => gltf.accessors[s.input].max[0]));
}
for (const c of [...CLIPS, ...STATE_CLIPS]) expect(c in clipLen, `animation ${c}`);
for (const c of LOOPS) expect((clipLen[c] ?? 0) >= DUR_HEARTBEAT - 1e-3, `loop ${c} >= dur-heartbeat (${clipLen[c]?.toFixed(3)} s)`);

const prim = gltf.meshes?.[0]?.primitives?.[0];
expect(gltf.meshes?.length === 1, "exactly one mesh");
expect(prim?.attributes?.COLOR_0 !== undefined, "vertex colours (COLOR_0)");

console.log(`joints: ${[...joints].join(", ")}`);
console.log(`clips:  ${Object.entries(clipLen).map(([k, v]) => `${k} ${v.toFixed(2)}s`).join(", ")}`);
if (failures.length) {
  console.error(`FAIL\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("OK");
