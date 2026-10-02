// The scene dressing's geometry (den-iso-v1/04), kept out of Backdrop.jsx so node tests can build it.
import * as THREE from "three";
import { DORMANT_PADS, STONE_RING, bambooStalks, stepStones } from "./banquet-layout.mjs";

// Scene dressing (den-iso-v1/04): the stepping-stone ring, the dashed dormant pads and the bamboo borders.
// Every position comes from banquet-layout.mjs. Colours are theme tokens read from the page; paver and
// ground-shadow are not in styles.css yet, so they fall back to their tokens.json values.
export const DRESSING_TOKENS = {
  paver: "#f3ead4", "ground-shadow": "#0000001f", "surface-100": "#f8f3e8", "line-strong": "#8c8069",
  "grove-mid": "#7fae62", "grove-hill": "#8cc070", "grove-near": "#4f8a3c", "opacity-dim": "0.55",
};
const GROUND_SHADOW_ALPHA = 0.12; // ground-shadow is black at 12% in both themes
const PAD_DASHES = 14;

export function readDressingTokens() {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(Object.entries(DRESSING_TOKENS).map(([name, fallback]) => [name, style.getPropertyValue(`--${name}`).trim() || fallback]));
}

/** The ring's stones (a paver disc with a soft contact shadow), the pads and the bamboo as one group. */
export function buildDressing(tokens) {
  const group = new THREE.Group();
  group.name = "dressing";
  const { stone } = STONE_RING;
  const stones = stepStones();
  const dummy = new THREE.Object3D();

  const shadows = new THREE.InstancedMesh(
    new THREE.CircleGeometry(stone.diameter / 2 + 0.06, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: GROUND_SHADOW_ALPHA, depthWrite: false }),
    Math.max(stones.length, 1),
  );
  const paving = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(stone.diameter / 2, stone.diameter / 2, stone.thickness, 20),
    new THREE.MeshLambertMaterial({ color: tokens.paver }),
    Math.max(stones.length, 1),
  );
  shadows.count = paving.count = stones.length;
  stones.forEach((st, i) => {
    dummy.position.set(st.x, 0.004, st.z);
    dummy.updateMatrix();
    shadows.setMatrixAt(i, dummy.matrix);
    dummy.position.set(st.x, stone.thickness / 2, st.z);
    dummy.updateMatrix();
    paving.setMatrixAt(i, dummy.matrix);
  });
  shadows.name = "stone-shadows";
  paving.name = "stepping-stones";
  group.add(shadows, paving);

  for (const pad of DORMANT_PADS) {
    const g = new THREE.Group();
    g.name = `dormant-pad:${pad.id}`;
    g.position.set(pad.x, 0, pad.z);
    g.userData = { label: pad.label, ariaLabel: pad.ariaLabel, dormant: pad.dormant };
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(pad.radius, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: tokens["surface-100"], transparent: true, opacity: Number(tokens["opacity-dim"]), depthWrite: false }),
    );
    fill.position.y = 0.006;
    g.add(fill);
    if (pad.dashed) {
      const step = (2 * Math.PI) / PAD_DASHES;
      const lineMaterial = new THREE.MeshBasicMaterial({ color: tokens["line-strong"], side: THREE.DoubleSide });
      for (let i = 0; i < PAD_DASHES; i++) {
        const dash = new THREE.Mesh(new THREE.RingGeometry(pad.radius - 0.045, pad.radius, 6, 1, i * step, step * 0.6).rotateX(-Math.PI / 2), lineMaterial);
        dash.position.y = 0.008;
        g.add(dash);
      }
    }
    group.add(g);
  }

  const stalkMaterial = new THREE.MeshLambertMaterial({ color: tokens["grove-mid"], flatShading: true });
  const jointMaterial = new THREE.MeshLambertMaterial({ color: tokens["grove-near"], flatShading: true });
  const leafMaterial = new THREE.MeshLambertMaterial({ color: tokens["grove-hill"], flatShading: true });
  for (const b of bambooStalks()) {
    const g = new THREE.Group();
    g.name = `bamboo:${b.cluster}`;
    g.position.set(b.x, 0, b.z);
    const r = b.width / 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, b.height, 6), stalkMaterial);
    trunk.position.y = b.height / 2;
    g.add(trunk);
    for (let y = 0.55; y < b.height - 0.3; y += 0.6) {
      const joint = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.25, 0.04, 6), jointMaterial);
      joint.position.y = y;
      g.add(joint);
    }
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 5), leafMaterial);
    leaves.position.y = b.height + 0.1;
    g.add(leaves);
    group.add(g);
  }
  return group;
}
