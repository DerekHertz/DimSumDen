// dimsumden-ui-v0/15: a low-poly copy of the panda mesh for the plushes. The profile put the den's
// cost in triangles: 13 full panda meshes (130 k triangles each) for figures of which 12 are about
// 90 px tall. Vertex clustering on a grid is linear, needs no dependency and keeps every vertex
// attribute (skin weights, colours) because each cluster keeps one real vertex. Pure: no three.

/**
 * Cells along the mesh's longest side. A plush is about 86 px tall on a 900 px canvas, so one cell is
 * about 2 px (4 px at devicePixelRatio 2). 40 keeps about 22 k of the body's 130 k triangles.
 */
export const PLUSH_GRID = 40;

/**
 * Merges the vertices that share a grid cell and a group, and drops the triangles that collapse.
 * @param {{positions: ArrayLike<number>, index: ArrayLike<number>, groups?: ArrayLike<number>}} mesh
 *   `groups` (optional, one per vertex, e.g. the dominant bone) keeps vertices of different groups apart,
 *   so a rigidly bound arm never shares a vertex with the torso.
 * @returns {{keep: Uint32Array, remap: Uint32Array, index: Uint32Array}} `keep[j]` is the original
 *   vertex that new vertex `j` copies, `remap[i]` is the new vertex of original vertex `i`, and
 *   `index` is the new triangle list.
 */
export function clusterSimplify({ positions, index, groups }, { grid = PLUSH_GRID } = {}) {
  const count = positions.length / 3;
  const min = [Infinity, Infinity, Infinity];
  let size = 0;
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) {
      const p = positions[i * 3 + k];
      if (p < min[k]) min[k] = p;
      if (p > max[k]) max[k] = p;
    }
  }
  for (let k = 0; k < 3; k++) size = Math.max(size, max[k] - min[k]);
  const cell = size / grid || 1;
  const at = (i, k) => Math.min(grid - 1, Math.floor((positions[i * 3 + k] - min[k]) / cell));

  const clusters = new Map();
  const remap = new Uint32Array(count);
  const keep = [];
  for (let i = 0; i < count; i++) {
    const key = (((groups ? groups[i] : 0) * grid + at(i, 2)) * grid + at(i, 1)) * grid + at(i, 0);
    let j = clusters.get(key);
    if (j === undefined) {
      j = keep.length;
      keep.push(i);
      clusters.set(key, j);
    }
    remap[i] = j;
  }

  const out = [];
  for (let t = 0; t < index.length; t += 3) {
    const a = remap[index[t]];
    const b = remap[index[t + 1]];
    const c = remap[index[t + 2]];
    if (a !== b && b !== c && a !== c) out.push(a, b, c);
  }
  return { keep: Uint32Array.from(keep), remap, index: Uint32Array.from(out) };
}

/** The most-weighted joint of each vertex, from 4-wide skin index and weight arrays: the `groups` above. */
export function dominantBones(joints, weights) {
  const out = new Int32Array(joints.length / 4);
  for (let v = 0; v < out.length; v++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (weights[v * 4 + k] > weights[v * 4 + best]) best = k;
    out[v] = joints[v * 4 + best];
  }
  return out;
}

/** Per-cluster mean of an attribute (`itemSize` components per vertex) over `remap`. */
export function averageAttribute(values, itemSize, remap, keepCount) {
  const sum = new Float64Array(keepCount * itemSize);
  const n = new Uint32Array(keepCount);
  for (let i = 0; i < remap.length; i++) {
    const j = remap[i];
    n[j]++;
    for (let k = 0; k < itemSize; k++) sum[j * itemSize + k] += values[i * itemSize + k];
  }
  const out = new Float32Array(keepCount * itemSize);
  for (let j = 0; j < keepCount; j++) for (let k = 0; k < itemSize; k++) out[j * itemSize + k] = sum[j * itemSize + k] / n[j];
  return out;
}
