// ADR 0013: the banquet market anchor model. Pure; no three, React or DOM. Cell type and slot index
// in, world position (where the plush's feet stand) out. Units are scene units, +z toward the camera.

/** Bao, host of the table, sits at the back. His local box is about 2 x 2 x 1.75 centred on the origin. */
export const BAO = { position: [0, 1.4, -2.4], scale: 1.4 };
const BAO_BOX = { minY: -1, size: [2, 2, 1.75] };

export const TABLE = { x: 0, z: 0, radius: 1.3, height: 0.7 };
export const CUB_BASKET = { x: 0, z: 3.4 };

const STALL_SPACING = 0.75;
const STALL_BASE_SLOTS = 3;
const COUNTER_Y = 0.6;

/** Pass perches as fractions of Bao's box, plus which way extra cells of the same type step. */
const PASS = {
  orchestrator: { frac: [0, 1.02, 0], step: 1 },
  product: { frac: [-0.55, 0.72, 0.1], step: -1 },
  architect: { frac: [0.55, 0.72, 0.1], step: 1 },
};
const PASS_STEP = 0.4;

const STALLS = {
  steamers: { x: -3.6, z: -1.6, y: COUNTER_Y },
  "front-of-house": { x: 3.6, z: -1.6, y: COUNTER_Y },
  tea: { x: -3.6, z: 2.2, y: COUNTER_Y },
  pantry: { x: 3.6, z: 2.2, y: COUNTER_Y },
  cubs: { x: 0, z: 3.9, y: 0 },
};

const STATION = {
  developer: "steamers", scout: "steamers", debugger: "steamers",
  qa: "tea", security: "pantry", designer: "front-of-house",
};

/** The four stalls' centres on the floor (the cub row is not a stall). */
export const STALL_CENTERS = Object.fromEntries(
  Object.entries(STALLS).filter(([k]) => k !== "cubs").map(([k, v]) => [k, { x: v.x, z: v.z }]),
);

export function stationOf(cellType) {
  if (PASS[cellType]) return cellType;
  return STATION[cellType] ?? "cubs";
}

/** "steamers#2" -> { station: "steamers", slot: 2 } */
export function parsePerch(perch) {
  const [station, slot] = perch.split("#");
  return { station, slot: Number(slot) };
}

/** Width of a stall's front: three fixed slots, then it widens by one slot per extra cell. */
export function stallWidth(count) {
  return Math.max(STALL_BASE_SLOTS, count) * STALL_SPACING;
}

/**
 * @param {string} cellType
 * @param {number} slot 0-based index within the station
 * @param {number} [count] cells in the station; only matters past three, when the slots widen
 */
export function placeCell(cellType, slot, count = STALL_BASE_SLOTS) {
  const pass = PASS[cellType];
  if (pass) {
    const [fx, fy, fz] = pass.frac;
    const [bx, by, bz] = BAO.position;
    const s = BAO.scale;
    return {
      x: bx + s * fx * BAO_BOX.size[0] + pass.step * PASS_STEP * slot,
      y: by + s * (BAO_BOX.minY + fy * BAO_BOX.size[1]),
      z: bz + s * fz * BAO_BOX.size[2],
    };
  }
  const stall = STALLS[stationOf(cellType)];
  const n = Math.max(STALL_BASE_SLOTS, count, slot + 1);
  return { x: stall.x + (slot - (n - 1) / 2) * STALL_SPACING, y: stall.y, z: stall.z };
}

export const MAX_BASKETS = 8;
const SUSAN_RADIUS = 0.85;
const SUSAN_Y = 0.75;

/** One basket position per frontier ticket around the lazy susan, first at the front. */
export function susanBaskets(n) {
  const count = Math.min(n, MAX_BASKETS);
  return Array.from({ length: count }, (_, i) => {
    const a = (2 * Math.PI * i) / count;
    return { x: TABLE.x + SUSAN_RADIUS * Math.sin(a), y: SUSAN_Y, z: TABLE.z + SUSAN_RADIUS * Math.cos(a) };
  });
}
