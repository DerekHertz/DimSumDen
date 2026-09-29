// showcase-v1/02: pure layout of the low-poly bamboo grove. No three, React or DOM. Seeded, so the
// same seed always plants the same grove. +z is toward the camera; everything stands behind Bao.

export const GROVE_COUNTS = { far: 30, mid: 22, near: 12, leavesPerStalk: 3, tufts: 14 };

/** Sway period in seconds; never faster than dur-breath (2800 ms). */
export const SWAY_PERIOD_S = 2.8;
const SWAY_MAX = 0.03;

/** Rotation (radians) the layers lean by at time t; zero under reduced motion. */
export function swayAngle(t, reducedMotion) {
  return reducedMotion ? 0 : SWAY_MAX * Math.sin((2 * Math.PI * t) / SWAY_PERIOD_S);
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Layers: [z min, z max], stalk height range, radius, minimum |x|. Bao's back is at z = -3.6.
const LAYERS = {
  far: { z: [-13, -10], h: [6, 8], r: 0.09, minX: 0 },
  mid: { z: [-9, -6.5], h: [5, 7], r: 0.12, minX: 2.2 },
  near: { z: [-5.2, -4.0], h: [4.5, 6], r: 0.16, minX: 2.8 },
};
const HALF_WIDTH = 16;

export function groveLayout(seed = 1) {
  const rand = rng(seed);
  const between = (lo, hi) => lo + (hi - lo) * rand();

  const stalks = (name) => {
    const { z, h, r, minX } = LAYERS[name];
    const n = GROVE_COUNTS[name];
    return Array.from({ length: n }, (_, i) => {
      // Even spread across the width, jittered, pushed out of the keep-clear centre.
      const slot = -HALF_WIDTH + ((i + 0.5) / n) * 2 * HALF_WIDTH;
      let x = slot + between(-0.4, 0.4) * ((2 * HALF_WIDTH) / n);
      if (Math.abs(x) < minX) x = Math.sign(x || 1) * (minX + rand() * 0.4);
      const height = between(h[0], h[1]);
      const nodes = [];
      for (let y = 1.0 + rand() * 0.3; y < height - 0.3; y += 1.0 + rand() * 0.3) nodes.push(y);
      return { x, z: between(z[0], z[1]), h: height, r, nodes };
    });
  };

  const far = stalks("far");
  const mid = stalks("mid");
  const near = stalks("near");

  // Leaf clusters on the mid and near stalks, in the upper third.
  const leaves = [];
  for (const s of [...mid, ...near]) {
    for (let k = 0; k < GROVE_COUNTS.leavesPerStalk; k++) {
      leaves.push({
        x: s.x,
        y: s.h * (0.6 + 0.13 * k),
        z: s.z,
        yaw: between(0, Math.PI * 2),
        tilt: between(0.9, 1.3),
        size: between(0.7, 1.1),
      });
    }
  }

  // Leafy mound centred behind Bao, lower than his head.
  const mound = { x: 0, z: -6.0, radius: 3.2, height: 1.8 };

  const tufts = Array.from({ length: GROVE_COUNTS.tufts }, () => ({
    x: between(-9, 9),
    z: between(-8, -4),
    size: between(0.25, 0.45),
    yaw: between(0, Math.PI * 2),
  }));

  return { far, mid, near, leaves, mound, tufts };
}
