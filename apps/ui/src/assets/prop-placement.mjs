// Measures where a prop glb lands in world space once it is attached, with an identity transform,
// under a socket of panda.glb (the way dev-scene.mjs attaches it). Node-side only: tests and asset
// checks use it. Ticket 07, design bounce round 2 (HIGH-2): every prop sat inside the paw, whose
// radius is PAW_RADIUS around the socket, so these numbers are what the placement tests assert on.

/** The paw's radius around its socket: the arm tail is 0.38 thick and the socket sits at its centre. */
export const PAW_RADIUS = 0.19;

/** Splits a glTF binary into its JSON and BIN chunks. */
export function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glb");
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const binStart = 20 + jsonLen;
  const bin = binStart + 8 <= buf.length ? buf.subarray(binStart + 8, binStart + 8 + buf.readUInt32LE(binStart)) : null;
  return { json, bin };
}

const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const FLOAT = 5126; // glTF componentType for float32

function readAccessor({ json, bin }, index) {
  const acc = json.accessors[index];
  if (acc.componentType !== FLOAT) throw new Error(`accessor ${index} is not float32`);
  const view = json.bufferViews[acc.bufferView];
  const width = WIDTH[acc.type];
  const stride = view.byteStride ?? width * 4;
  const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out = [];
  for (let i = 0; i < acc.count; i++) {
    const row = [];
    for (let k = 0; k < width; k++) row.push(bin.readFloatLE(base + i * stride + k * 4));
    out.push(row);
  }
  return out;
}

// --- small linear algebra (column-major 4x4, like glTF) ---

function compose(t = [0, 0, 0], r = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = r;
  const m = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    t[0], t[1], t[2], 1,
  ];
  for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) m[c * 4 + k] *= s[c];
  return m;
}

function multiply(a, b) {
  const m = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) m[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return m;
}

export function transformPoint(m, [x, y, z]) {
  return [0, 1, 2].map((r) => m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r]);
}

export function transformDirection(m, [x, y, z]) {
  const v = [0, 1, 2].map((r) => m[r] * x + m[4 + r] * y + m[8 + r] * z);
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
}

const lerp = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);

function nlerpQuat(a, b, f) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const q = lerp(a, dot < 0 ? b.map((v) => -v) : b, f);
  const len = Math.hypot(...q);
  return q.map((v) => v / len);
}

function sample(glb, sampler, time) {
  const times = readAccessor(glb, sampler.input).map((r) => r[0]);
  const values = readAccessor(glb, sampler.output);
  if (time <= times[0]) return values[0];
  for (let i = 1; i < times.length; i++) {
    if (time > times[i]) continue;
    if (sampler.interpolation === "STEP") return values[i - 1];
    const f = (time - times[i - 1]) / (times[i] - times[i - 1]);
    return values[0].length === 4 ? nlerpQuat(values[i - 1], values[i], f) : lerp(values[i - 1], values[i], f);
  }
  return values[values.length - 1];
}

/**
 * World matrices of every named node, at rest or at `time` seconds into `clip`.
 * Returns a Map from node name to a column-major 4x4 matrix.
 */
export function worldMatrices(glb, { clip, time = 0 } = {}) {
  const { json } = glb;
  const trs = json.nodes.map((n) => ({ t: n.translation, r: n.rotation, s: n.scale }));
  if (clip) {
    const anim = json.animations.find((a) => a.name === clip);
    if (!anim) throw new Error(`no clip ${clip}`);
    const key = { translation: "t", rotation: "r", scale: "s" };
    for (const ch of anim.channels) trs[ch.target.node][key[ch.target.path]] = sample(glb, anim.samplers[ch.sampler], time);
  }
  const out = new Map();
  const visit = (i, parent) => {
    const m = multiply(parent, compose(trs[i].t, trs[i].r, trs[i].s));
    out.set(json.nodes[i].name, m);
    for (const c of json.nodes[i].children ?? []) visit(c, m);
  };
  const identity = compose();
  for (const root of json.scenes[json.scene ?? 0].nodes) visit(root, identity);
  return out;
}

/** The last keyframe time of a clip, in seconds. */
export function clipDuration(glb, clip) {
  const anim = glb.json.animations.find((a) => a.name === clip);
  return Math.max(...anim.samplers.map((s) => glb.json.accessors[s.input].max[0]));
}

/** The prop's own axis-aligned box in its local space (all mesh nodes, node transforms applied). */
export function propLocalBox(prop) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const worlds = worldMatrices(prop);
  for (const node of prop.json.nodes) {
    if (node.mesh === undefined) continue;
    const m = worlds.get(node.name);
    for (const p of prop.json.meshes[node.mesh].primitives) {
      for (const v of readAccessor(prop, p.attributes.POSITION)) {
        const w = transformPoint(m, v);
        for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], w[k]); max[k] = Math.max(max[k], w[k]); }
      }
    }
  }
  return { min, max };
}

const sub = (a, b) => a.map((v, i) => v - b[i]);

/**
 * Where a prop sits once attached to `socket` in the given pose. Distances are from the socket's
 * world origin (the paw's centre). The box is the prop's own local box, carried rigidly into world
 * space, so `fractionOutside` does not depend on the pose.
 *  - fractionOutside: share of the box's volume farther than `radius` from the socket
 *  - nearDistance / centreDistance: closest box point and box centre, from the socket
 *  - centreOffset: world vector from the socket to the box centre
 *  - worldSize: world axis-aligned extent of the carried box
 *  - axes: world direction of each local box axis, with that axis's local extent
 */
export function measurePlacement(panda, prop, socket, { clip, time, radius = PAW_RADIUS } = {}) {
  const m = worldMatrices(panda, { clip, time }).get(socket);
  if (!m) throw new Error(`no socket ${socket}`);
  const origin = transformPoint(m, [0, 0, 0]);
  const { min, max } = propLocalBox(prop);
  const size = sub(max, min);

  const N = 24; // grid samples per box axis: 13,824 points, accurate to about 1% of the volume
  let outside = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    const local = [i, j, k].map((n, a) => min[a] + size[a] * (n + 0.5) / N);
    const d = Math.hypot(...sub(transformPoint(m, local), origin));
    if (d > radius) outside++;
  }
  // Closest box point to the socket, found in the socket's frame (the socket is at its origin).
  const closest = min.map((lo, a) => Math.min(Math.max(0, lo), max[a]));
  const near = Math.hypot(...sub(transformPoint(m, closest), origin));

  const corners = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) corners.push(transformPoint(m, [x, y, z]));
  const wmin = [0, 1, 2].map((a) => Math.min(...corners.map((c) => c[a])));
  const wmax = [0, 1, 2].map((a) => Math.max(...corners.map((c) => c[a])));
  const centre = transformPoint(m, min.map((v, a) => (v + max[a]) / 2));
  const centreOffset = sub(centre, origin);

  return {
    fractionOutside: outside / N ** 3,
    nearDistance: near,
    centreDistance: Math.hypot(...centreOffset),
    centreOffset,
    worldSize: sub(wmax, wmin),
    axes: [0, 1, 2].map((a) => ({
      dir: transformDirection(m, [0, 1, 2].map((k) => (k === a ? 1 : 0))),
      extent: size[a],
    })),
  };
}
