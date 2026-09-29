// showcase-v1/02: the grove is instanced, coloured by the grove-* tokens, never catches clicks, and
// sways no faster than dur-breath. Tokens are read from styles.css, the runtime source of truth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GROVE_COUNTS } from "./grove-layout.mjs";
import { GROVE_TOKENS, applyGroveTheme, buildGrove, groveFog } from "./grove.mjs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const rootBlock = css.slice(css.indexOf(":root"), css.indexOf("@media (prefers-color-scheme: dark)"));
const TOKENS = {};
for (const [, n, v] of rootBlock.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) TOKENS[n] = v.toLowerCase();

const EXPECTED = { "grove-mist": "#e3efd6", "grove-far": "#b7d39d", "grove-mid": "#7fae62", "grove-hill": "#8cc070", "grove-grass": "#9fcc80", "grove-near": "#4f8a3c" };

const parts = (g) => { const l = []; g.traverse((o) => { if (o.isMesh) l.push(o); }); return l; };
const byName = (g, name) => parts(g).find((m) => m.name === name);

test("styles.css carries the six grove tokens with the design values", () => {
  for (const [n, v] of Object.entries(EXPECTED)) assert.equal(TOKENS[n], v, n);
  assert.deepEqual([...GROVE_TOKENS].sort(), Object.keys(EXPECTED).sort());
});

test("the grove is instanced: one InstancedMesh per part kind, counts from the layout", () => {
  const g = buildGrove(TOKENS, 1);
  assert.equal(byName(g, "far-stalks").isInstancedMesh, true);
  assert.equal(byName(g, "far-stalks").count, GROVE_COUNTS.far);
  assert.equal(byName(g, "mid-stalks").count, GROVE_COUNTS.mid);
  assert.equal(byName(g, "near-stalks").count, GROVE_COUNTS.near);
  assert.equal(byName(g, "leaves").count, (GROVE_COUNTS.mid + GROVE_COUNTS.near) * GROVE_COUNTS.leavesPerStalk);
  assert.equal(byName(g, "tufts").count, GROVE_COUNTS.tufts);
  assert.ok(byName(g, "near-nodes").count >= GROVE_COUNTS.near, "node rings on every near stalk");
  assert.ok(parts(g).length <= 14, "few draw calls");
});

test("total triangles stay small (instances included)", () => {
  let tris = 0;
  for (const m of parts(g0())) {
    const per = (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute("position").count) / 3;
    tris += per * (m.isInstancedMesh ? m.count : 1);
  }
  assert.ok(tris < 20000, `${tris} triangles`);
});
function g0() { return buildGrove(TOKENS, 1); }

test("every material colour is a grove token", () => {
  const allowed = new Set(Object.values(EXPECTED).map((v) => v.slice(1)));
  for (const m of parts(g0())) assert.ok(allowed.has(m.material.color.getHexString()), m.name);
});

test("no shadows, nothing emissive, and raycasts hit nothing (clicks reach plushes)", () => {
  const g = g0();
  g.updateMatrixWorld(true);
  for (const m of parts(g)) {
    assert.equal(m.castShadow, false);
    assert.equal(m.receiveShadow, false);
    assert.ok(!m.material.emissive || m.material.emissive.getHex() === 0);
  }
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 1.2, 10), new THREE.Vector3(0, -0.05, -1).normalize());
  assert.deepEqual(ray.intersectObject(g, true), []);
});

test("layers are separate groups so the renderer can sway them", () => {
  const g = g0();
  for (const n of ["grove-far", "grove-mid", "grove-near"]) assert.ok(g.getObjectByName(n), n);
});

test("applyGroveTheme recolours the same materials in place", () => {
  const g = g0();
  const before = parts(g).map((m) => m.material.uuid);
  applyGroveTheme(g, { ...TOKENS, "grove-mid": "#123456" });
  assert.deepEqual(parts(g).map((m) => m.material.uuid), before);
  assert.equal(byName(g, "mid-stalks").material.color.getHexString(), "123456");
});

test("fog is grove-mist and starts beyond the market", () => {
  const fog = groveFog(TOKENS);
  assert.equal(fog.color.getHexString(), "e3efd6");
  assert.ok(fog.near >= 16);
});

test("Den renders <Backdrop> before Bao; Backdrop.jsx sways only through swayAngle and stops for reduced motion", () => {
  const den = readFileSync(new URL("./Den.jsx", import.meta.url), "utf8");
  assert.ok(den.indexOf("<Backdrop") >= 0 && den.indexOf("<Backdrop") < den.indexOf('<Figure id="bao"'));
  const src = readFileSync(new URL("./Backdrop.jsx", import.meta.url), "utf8");
  assert.match(src, /swayAngle/);
  assert.match(src, /prefers-reduced-motion/);
});
