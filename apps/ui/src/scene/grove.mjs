// showcase-v1/02: the low-poly grove as instanced three.js meshes (no React, no DOM). One InstancedMesh
// per kind of part, so the whole grove is a handful of draw calls. `tokens` maps a design-token name
// to a hex string. Layers are grouped (grove-far / -mid / -near) so the renderer can sway them.
import * as THREE from "three";
import { groveLayout } from "./grove-layout.mjs";

export const GROVE_TOKENS = ["grove-mist", "grove-far", "grove-mid", "grove-hill", "grove-grass", "grove-near"];
const LAYER_COLOUR = { far: "grove-far", mid: "grove-mid", near: "grove-near" };
const RING_COLOUR = { far: "grove-mid", mid: "grove-near", near: "grove-mid" };

const dummy = new THREE.Object3D();

function instanced(name, geometry, token, tokens, items, place) {
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshLambertMaterial({ color: tokens[token], flatShading: true }),
    Math.max(items.length, 1),
  );
  mesh.count = items.length;
  items.forEach((item, i) => {
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    place(dummy, item);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.userData.token = token;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false; // instances span the whole width; the bounding sphere is the origin
  mesh.raycast = () => {};
  return mesh;
}

export function buildGrove(tokens, seed = 1) {
  const layout = groveLayout(seed);
  const group = new THREE.Group();
  group.name = "Grove";

  // Ground: a big grass plane just under y = 0 so the market props sit on it.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 45),
    new THREE.MeshLambertMaterial({ color: tokens["grove-grass"], flatShading: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -4);
  ground.name = "grove-ground";
  ground.userData.token = "grove-grass";
  ground.raycast = () => {};
  group.add(ground);

  const stalkGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
  const ringGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.07, 6);
  for (const layer of ["far", "mid", "near"]) {
    const stalks = layout[layer];
    const g = new THREE.Group();
    g.name = `grove-${layer}`;
    g.add(instanced(`${layer}-stalks`, stalkGeo, LAYER_COLOUR[layer], tokens, stalks, (d, s) => {
      d.position.set(s.x, s.h / 2, s.z);
      d.scale.set(s.r, s.h, s.r);
    }));
    const rings = stalks.flatMap((s) => s.nodes.map((y) => ({ x: s.x, y, z: s.z, r: s.r })));
    g.add(instanced(`${layer}-nodes`, ringGeo, RING_COLOUR[layer], tokens, rings, (d, n) => {
      d.position.set(n.x, n.y, n.z);
      d.scale.set(n.r, 1, n.r);
    }));
    group.add(g);
  }

  // Leaf clusters: flat four-sided cones leaning out from the stalk.
  const leafGeo = new THREE.ConeGeometry(0.22, 1.1, 4);
  leafGeo.translate(0, 0.55, 0);
  group.add(instanced("leaves", leafGeo, "grove-hill", tokens, layout.leaves, (d, l) => {
    d.position.set(l.x, l.y, l.z);
    d.rotation.set(0, l.yaw, l.tilt, "YZX");
    d.scale.set(l.size, l.size, 0.4 * l.size);
  }));

  // Leafy mound behind Bao: a squashed low-poly dome (depth scaled so its front stays behind him).
  const { mound } = layout;
  group.add(instanced("mound", new THREE.IcosahedronGeometry(1, 1), "grove-hill", tokens, [mound], (d, m) => {
    d.position.set(m.x, 0, m.z);
    d.scale.set(m.radius, m.height, m.radius * 0.5);
  }));

  // Grass tufts.
  const tuftGeo = new THREE.ConeGeometry(0.5, 1, 5);
  tuftGeo.translate(0, 0.5, 0);
  group.add(instanced("tufts", tuftGeo, "grove-near", tokens, layout.tufts, (d, t) => {
    d.position.set(t.x, 0, t.z);
    d.rotation.set(0, t.yaw, 0);
    d.scale.set(t.size, t.size * 1.6, t.size);
  }));

  group.userData.layout = layout;
  return group;
}

export function applyGroveTheme(group, tokens) {
  group.traverse((o) => {
    if (o.material && o.userData.token) o.material.color.set(tokens[o.userData.token]);
  });
}

// The orthographic camera stands 40 units from its target (iso-projection.mjs), so every market object is 32 to 48 units
// away, even at the pan and zoom limits. Fog starts just past that and thins only the grove beyond the market.
export const FOG_NEAR = 49;
export const FOG_FAR = 75;

export function groveFog(tokens) {
  return new THREE.Fog(tokens["grove-mist"], FOG_NEAR, FOG_FAR);
}
