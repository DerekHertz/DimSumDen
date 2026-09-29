// dimsumden-ui-v0/14: static paper-cut grove behind Bao (designer spec, direction A).
// Seam: apps/ui/src/scene/backdrop.mjs, a pure three.js module (no React, no DOM):
//   buildBackdrop(tokens)            -> THREE.Group named "Backdrop", meshes merged by material
//   applyBackdropTheme(group, tokens) -> recolours the same materials in place (no remount)
//   backdropFog(tokens)              -> THREE.Fog (colour surface-100, near 8, far 20)
// `tokens` maps a design-token name to a hex string, e.g. { "surface-000": "#efe8d8", ... }.
// Token values here are read from styles.css, the runtime source of truth, not typed in.
// Bao's bounding box comes from the POSITION accessor min/max in panda.glb.
// The renderer wiring (Backdrop.jsx, Den.jsx) is checked by source shape; the glb-failure and
// click-through-deselect criteria are human-verified (see the handoff).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { parseGlb } from "../assets/prop-placement.mjs";
import { buildBackdrop, applyBackdropTheme, backdropFog } from "./backdrop.mjs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function tokensFrom(block) {
  const out = {};
  for (const [, name, value] of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[name] = value.toLowerCase();
  return out;
}
const lightBlock = css.slice(css.indexOf(":root"), css.indexOf("@media (prefers-color-scheme: dark)"));
const darkBlock = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
const LIGHT = tokensFrom(lightBlock);
const DARK = { ...LIGHT, ...tokensFrom(darkBlock) };

const ALLOWED = ["surface-000", "surface-100", "surface-300", "line", "line-strong", "ink-faint"];
const FORBIDDEN = ["lantern", "lantern-fill", "alarm", "alarm-fill", "qi", "qi-fill"];

function bao() {
  const glb = parseGlb(readFileSync(new URL("../../public/models/panda.glb", import.meta.url)));
  const prim = glb.json.meshes.find((m) => m.name === "PA_PandaMesh").primitives[0];
  const { min, max } = glb.json.accessors[prim.attributes.POSITION];
  return { min, max, height: max[1] - min[1], depth: max[2] - min[2] };
}

const meshesOf = (g) => {
  const list = [];
  g.updateMatrixWorld(true);
  g.traverse((o) => { if (o.isMesh) list.push(o); });
  return list;
};

function worldVertices(mesh) {
  const pos = mesh.geometry.getAttribute("position");
  const v = new THREE.Vector3();
  const out = [];
  for (let i = 0; i < pos.count; i++) out.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone());
  return out;
}
const allVertices = (g) => meshesOf(g).flatMap(worldVertices);

const triangles = (mesh) => (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.getAttribute("position").count) / 3;

test("token source sanity: styles.css resolves every token the backdrop may use, in both themes", () => {
  for (const name of [...ALLOWED, ...FORBIDDEN]) {
    assert.match(LIGHT[name] ?? "", /^#[0-9a-f]{6}$/, `light ${name}`);
    assert.match(DARK[name] ?? "", /^#[0-9a-f]{6}$/, `dark ${name}`);
  }
  assert.notEqual(LIGHT["surface-100"], DARK["surface-100"]);
});

test("1. buildBackdrop returns a group named Backdrop holding meshes", () => {
  const g = buildBackdrop(LIGHT);
  assert.equal(g.isGroup, true);
  assert.equal(g.name, "Backdrop");
  assert.ok(meshesOf(g).length >= 1);
});

test("1b. Den.jsx renders <Backdrop> as a sibling before Bao, and Backdrop.jsx exists", () => {
  const den = readFileSync(new URL("./Den.jsx", import.meta.url), "utf8");
  const at = den.indexOf("<Backdrop");
  assert.ok(at >= 0, "Den.jsx renders <Backdrop");
  assert.ok(at < den.indexOf('<Figure id="bao"'), "Backdrop is rendered before Bao");
  assert.ok(readFileSync(new URL("./Backdrop.jsx", import.meta.url), "utf8").length > 0);
});

test("1c. the grove has ground, near, mid and far bands", () => {
  const vs = allVertices(buildBackdrop(LIGHT));
  const has = (lo, hi, pred = () => true) => vs.some((v) => v.z >= lo && v.z <= hi && pred(v));
  assert.ok(has(-9.01, -1.5, (v) => Math.abs(v.y) < 0.01), "ground plane at y = 0");
  assert.ok(has(-2.55, -1.95, (v) => v.y > 1), "near stalks");
  assert.ok(has(-5.1, -4.4, (v) => v.y > 1), "mid band (tea house)");
  assert.ok(has(-8.3, -7.7, (v) => v.y > 1), "far stalks");
});

test("2. every backdrop mesh sits behind every perch anchor (world max z <= -1.5)", () => {
  const b = bao();
  assert.ok(0.9 * b.depth < 1.5, "anchors reach z = 0.9 x depth, in front of the backdrop");
  for (const mesh of meshesOf(buildBackdrop(LIGHT))) {
    const box = new THREE.Box3().setFromObject(mesh);
    assert.ok(box.max.z <= -1.5 + 1e-6, `${mesh.name || mesh.uuid} max z ${box.max.z}`);
  }
});

test("3. near band keeps the central x in [-1.6, 1.6] clear of upright geometry", () => {
  for (const v of allVertices(buildBackdrop(LIGHT))) {
    if (v.z >= -2.55 && v.z <= -1.95 && v.y > 0.01) {
      assert.ok(Math.abs(v.x) >= 1.6 - 1e-6, `near-band vertex at x ${v.x}, y ${v.y}, z ${v.z}`);
    }
  }
});

test("3b. tea house stays below 1.1 x Bao's height behind Bao", () => {
  const limit = bao().max[1] * 1.1;
  for (const v of allVertices(buildBackdrop(LIGHT))) {
    if (v.z >= -5.1 && v.z <= -4.4 && Math.abs(v.x) <= 1.0) {
      assert.ok(v.y <= limit + 1e-6, `central mid-band vertex y ${v.y} above ${limit}`);
    }
  }
});

test("4. at most 3000 triangles, at most 6 meshes, no shadows, no emissive, frustum culled", () => {
  const meshes = meshesOf(buildBackdrop(LIGHT));
  assert.ok(meshes.length <= 6, `${meshes.length} meshes`);
  assert.ok(meshes.reduce((n, m) => n + triangles(m), 0) <= 3000);
  for (const m of meshes) {
    assert.equal(m.castShadow, false);
    assert.equal(m.receiveShadow, false);
    assert.equal(m.frustumCulled, true);
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      assert.ok(!mat.emissive || mat.emissive.getHex() === 0, "material is not emissive");
      assert.ok(!mat.emissiveIntensity || !mat.emissive || mat.emissive.getHex() === 0);
    }
  }
});

function colours(group) {
  return meshesOf(group).flatMap((m) => (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
    assert.ok(!mat.vertexColors, "colour comes from the token material, not vertex colours");
    return mat.color.getHexString();
  }));
}

for (const [theme, tokens] of [["light", LIGHT], ["dark", DARK]]) {
  test(`5. ${theme}: material colours are allowed tokens and never a forbidden one`, () => {
    const allowed = new Set(ALLOWED.map((n) => tokens[n].slice(1)));
    const forbidden = new Set(FORBIDDEN.map((n) => tokens[n].slice(1)));
    const used = colours(buildBackdrop(tokens));
    assert.ok(used.length > 0);
    for (const c of used) {
      assert.ok(allowed.has(c), `#${c} is not an allowed ${theme} token`);
      assert.ok(!forbidden.has(c), `#${c} is a forbidden ${theme} token`);
    }
  });

  test(`5b. ${theme}: fog is surface-100, near 8, far 20`, () => {
    const fog = backdropFog(tokens);
    assert.equal(fog.color.getHexString(), tokens["surface-100"].slice(1));
    assert.equal(fog.near, 8);
    assert.equal(fog.far, 20);
  });
}

test("6. raycasting through the backdrop hits nothing, so clicks reach plushes and deselect", () => {
  const g = buildBackdrop(LIGHT);
  g.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 1.2, 10), new THREE.Vector3(0, -0.05, -1).normalize());
  assert.deepEqual(ray.intersectObject(g, true), []);
  const low = new THREE.Raycaster(new THREE.Vector3(0, 2, 10), new THREE.Vector3(0, -0.1, -1).normalize());
  assert.deepEqual(low.intersectObject(g, true), []);
});

test("7. switching theme recolours the same meshes and materials, no remount", () => {
  const g = buildBackdrop(LIGHT);
  const before = meshesOf(g).map((m) => [m.uuid, m.material.uuid]);
  applyBackdropTheme(g, DARK);
  assert.deepEqual(meshesOf(g).map((m) => [m.uuid, m.material.uuid]), before);
  const allowed = new Set(ALLOWED.map((n) => DARK[n].slice(1)));
  for (const c of colours(g)) assert.ok(allowed.has(c), `#${c} is a dark token`);
  applyBackdropTheme(g, LIGHT);
  const light = new Set(ALLOWED.map((n) => LIGHT[n].slice(1)));
  for (const c of colours(g)) assert.ok(light.has(c), `#${c} is a light token`);
});

test("9. Backdrop.jsx is static: no useFrame subscription", () => {
  const src = readFileSync(new URL("./Backdrop.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(src, /useFrame/);
});
