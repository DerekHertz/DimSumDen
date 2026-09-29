// dimsumden-ui-v0/15: plushes draw a clustered low-poly copy of the panda mesh. The profile put the
// cost in triangles (13 full panda meshes, about 1.9 M triangles a frame), so these tests hold the
// simplified mesh to a triangle budget while keeping its shape and its skinning intact.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGlb } from "../assets/prop-placement.mjs";
import { clusterSimplify, averageAttribute, PLUSH_GRID } from "./plush-lod.mjs";

const COMPONENT = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function accessor({ json, bin }, index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  assert.equal(view.byteStride ?? 0, 0, "test reader expects tightly packed accessors");
  const T = COMPONENT[acc.componentType];
  const start = bin.byteOffset + (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const n = acc.count * WIDTH[acc.type];
  return new T(bin.buffer.slice(start, start + n * T.BYTES_PER_ELEMENT));
}

function pandaBody() {
  const glb = parseGlb(readFileSync(new URL("../../public/models/panda.glb", import.meta.url)));
  const prim = glb.json.meshes.find((m) => m.name === "PA_PandaMesh").primitives[0];
  const positions = accessor(glb, prim.attributes.POSITION);
  const index = accessor(glb, prim.indices);
  const joints = accessor(glb, prim.attributes.JOINTS_0);
  const weights = accessor(glb, prim.attributes.WEIGHTS_0);
  // Dominant bone per vertex, the same grouping Den.jsx uses.
  const groups = new Int32Array(positions.length / 3);
  for (let v = 0; v < groups.length; v++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (weights[v * 4 + k] > weights[v * 4 + best]) best = k;
    groups[v] = joints[v * 4 + best];
  }
  return { positions, index, groups };
}

function bbox(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  }
  return { min, max };
}

test("worked example: two triangles inside one cell collapse, a triangle spanning three cells survives", () => {
  // Cell size 1 (grid 2 over a 2-unit box). Vertices 0-3 sit in cell (0,0,0); 4, 5, 6 in three other cells.
  const positions = new Float32Array([
    0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.2, 0.1,
    1.5, 0.1, 0.1, 0.1, 1.5, 0.1, 1.5, 1.5, 1.9,
  ]);
  const index = new Uint32Array([0, 1, 2, 0, 2, 3, 0, 4, 5, 4, 6, 5]);
  const out = clusterSimplify({ positions, index }, { grid: 2 });
  assert.equal(out.index.length / 3, 2, "the two in-cell triangles are gone, the two spanning ones stay");
  assert.equal(out.keep.length, 4, "one vertex per occupied cell");
  assert.deepEqual([...out.remap], [0, 0, 0, 0, 1, 2, 3]);
});

test("vertices of different groups (bones) are never merged, even in the same cell", () => {
  const positions = new Float32Array([0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 1.5, 1.5, 1.5]);
  const index = new Uint32Array([0, 1, 2]);
  const out = clusterSimplify({ positions, index, groups: new Int32Array([3, 7, 3]) }, { grid: 2 });
  assert.equal(out.keep.length, 3);
  assert.equal(out.index.length, 3, "the triangle survives because 0 and 1 are on different bones");
});

test("averageAttribute gives each kept vertex the mean of its cluster", () => {
  const values = new Float32Array([0, 0, 2, 4, 10, 10]);
  const out = averageAttribute(values, 2, new Uint32Array([0, 0, 1]), 2);
  assert.deepEqual([...out], [1, 2, 10, 10]);
});

test("the panda body at the plush grid fits the triangle budget and keeps its shape", () => {
  const body = pandaBody();
  const before = body.index.length / 3;
  assert.equal(before, 129936, "fixture: the full panda body");
  const out = clusterSimplify(body, { grid: PLUSH_GRID });
  const after = out.index.length / 3;
  assert.ok(after <= 25000, `plush mesh has ${after} triangles, budget 25000`);
  assert.ok(after >= 5000, `plush mesh has ${after} triangles, too coarse to read as the panda`);

  const cell = 2 / PLUSH_GRID; // the body box is about 2 units on its longest side
  const a = bbox(body.positions);
  const b = bbox(averageAttribute(body.positions, 3, out.remap, out.keep.length));
  for (let k = 0; k < 3; k++) {
    assert.ok(Math.abs(a.min[k] - b.min[k]) <= cell, `min[${k}] moved ${a.min[k] - b.min[k]}`);
    assert.ok(Math.abs(a.max[k] - b.max[k]) <= cell, `max[${k}] moved ${a.max[k] - b.max[k]}`);
  }
  for (let v = 0; v < out.remap.length; v++) {
    if (body.groups[out.keep[out.remap[v]]] !== body.groups[v]) assert.fail(`vertex ${v} merged across bones`);
  }
  for (const i of out.index) assert.ok(i < out.keep.length);
});
