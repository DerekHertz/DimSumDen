// Paper-cut grove behind Bao (dimsumden-ui-v0/14, direction A). Pure three.js: no React, no DOM.
// Static, flat-shaded, neutral tokens only, merged into one mesh per token (5 meshes).
// `tokens` maps a design-token name to a hex string.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const BACKDROP_TOKENS = ["surface-000", "surface-300", "line", "line-strong", "ink-faint"];

function place(geometry, x, y, z, rx = 0) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute("uv");
  g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  return g;
}

// A hex-prism stalk standing on the ground.
const stalk = (bucket, x, z, h, r) => bucket.push(place(new THREE.CylinderGeometry(r, r, h, 6), x, h / 2, z));

// A flat triangular leaf wedge leaning out to one side.
function leaf(bucket, x, y, z, dir) {
  const tri = new THREE.BufferGeometry();
  tri.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, dir * 0.4, 0.12, 0, dir * 0.15, 0.2, 0], 3));
  tri.computeVertexNormals();
  bucket.push(place(tri, x, y, z));
}

const box = (bucket, w, h, d, x, y, z) => bucket.push(place(new THREE.BoxGeometry(w, h, d), x, y, z));
const drum = (bucket, r, h, x, y, z, sides = 8) => bucket.push(place(new THREE.CylinderGeometry(r, r, h, sides), x, y, z));

export function buildBackdrop(tokens) {
  const b = { "surface-000": [], "surface-300": [], line: [], "line-strong": [], "ink-faint": [] };

  // ground: flat plane at y = 0, grass line at z = -1.5
  b["surface-000"].push(place(new THREE.PlaneGeometry(40, 7.5), 0, 0, -5.25, -Math.PI / 2));

  // near band: bamboo at the outer thirds only (|x| >= 2.3), two leaves per stalk
  [-5.4, -4.6, -2.3, 2.3, 4.6, 5.4].forEach((x, i) => {
    const z = i % 2 ? -2.5 : -2.0;
    const h = 3.5 + (i % 3) * 0.5;
    stalk(b["line-strong"], x, z, h, 0.08);
    leaf(b.line, x, h * 0.55, z, x < 0 ? -1 : 1);
    leaf(b.line, x, h * 0.75, z, x < 0 ? 1 : -1);
  });
  // left: counter with two steamer stacks (three drums and a flat lid each)
  box(b["surface-300"], 1.4, 0.7, 0.4, -3.3, 0.35, -2.2);
  box(b["line-strong"], 1.4, 0.06, 0.42, -3.3, 0.7, -2.2);
  for (const sx of [-3.6, -3.0]) {
    for (let k = 0; k < 3; k++) drum(b["surface-300"], 0.28, 0.12, sx, 0.79 + k * 0.12, -2.2);
    b["line-strong"].push(place(new THREE.ConeGeometry(0.3, 0.1, 8), sx, 1.2, -2.2));
  }
  // right: two hanging paper lanterns, unlit
  for (const lx of [3.0, 3.8]) {
    drum(b["ink-faint"], 0.01, 0.9, lx, 3.05, -2.2, 4);
    drum(b["surface-300"], 0.28, 0.45, lx, 2.4, -2.2);
    drum(b["line-strong"], 0.29, 0.04, lx, 2.62, -2.2);
    drum(b["line-strong"], 0.29, 0.04, lx, 2.18, -2.2);
  }

  // mid band: tea house behind Bao (stays under 1.1 x Bao's height), stepped eaves, ridge bar
  box(b["surface-300"], 2.6, 0.6, 1.4, 0, 0.3, -4.75);
  [[3.0, 0.65], [3.4, 0.75], [3.8, 0.85]].forEach(([w, y]) => box(b["line-strong"], w, 0.1, 1.6, 0, y, -4.75));
  box(b["line-strong"], 2.0, 0.08, 0.2, 0, 0.94, -4.75);
  for (const tx of [-2.0, 2.0]) box(b["ink-faint"], 0.12, 0.06, 1.6, tx, 0.9, -4.75);
  [-6, -4.8, -3.6, -2.4, -1.8, 1.8, 2.4, 3.6, 4.8, 6].forEach((x, i) => {
    stalk(b.line, x, i % 2 ? -4.9 : -4.6, 3 + (i % 3) * 0.4, 0.06);
  });

  // far band: thin stalks, no leaves
  for (let i = 0; i < 12; i++) stalk(b.line, -7 + i * 1.27, -8, 4.5 + (i % 3) * 0.4, 0.05);

  const group = new THREE.Group();
  group.name = "Backdrop";
  for (const name of BACKDROP_TOKENS) {
    const mesh = new THREE.Mesh(
      mergeGeometries(b[name]),
      new THREE.MeshLambertMaterial({ color: tokens[name], flatShading: true }),
    );
    mesh.name = `backdrop-${name}`;
    mesh.userData.token = name;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.raycast = () => {};
    group.add(mesh);
  }
  return group;
}

export function applyBackdropTheme(group, tokens) {
  group.traverse((o) => {
    if (o.isMesh && o.userData.token) o.material.color.set(tokens[o.userData.token]);
  });
}

export function backdropFog(tokens) {
  return new THREE.Fog(tokens["surface-100"], 8, 20);
}
