// ADR 0013: the banquet market anchor model. Pure; no three, React or DOM. Cell type and slot index
// in, world position (where the plush's feet stand) out. Units are scene units, +z toward the camera.

/** Bao, host of the table, sits at the back. His local box is about 2 x 2 x 1.75 centred on the origin. */
export const BAO = { position: [0, 1.4, -2.4], scale: 1.4 };
const BAO_BOX = { minY: -1, size: [2, 2, 1.75] };

/** The Pass rail on Bao's crown, with the service bell seated on it beside the orchestrator's perch. */
export const RAIL = { x: 0, y: 2.66, z: BAO.position[2], width: 1.3, height: 0.05 };
export const BELL = { x: 0.5, y: RAIL.y + RAIL.height / 2, z: BAO.position[2] };

/**
 * Tally: a pagoda-roofed slate on tall posts left of Bao, between him and the back-left Steamers stall (showcase-v1/03). The slate
 * hangs high (faceBottom) so the sight line from the default camera to Steamers cells passes under it.
 */
export const TALLY = { x: -3.0, z: 0.3, width: 1.6, depth: 0.3, faceBottom: 2.35, faceHeight: 1.0 };

export const TABLE = { x: 0, z: 0, radius: 1.3, height: 0.7 };
export const CUB_BASKET = { x: 0, z: 3.4 };
export const CUB_BASKET_RADIUS = 0.55;

const STALL_SPACING = 0.75;
const STALL_BASE_SLOTS = 3;
const COUNTER_Y = 0.6;

/** The back stalls stand on a low platform so their cells rise above the front row's roofs (default camera). */
export const BACK_PLATFORM = 0.5;
/** The front stalls carry a low roof; its apex stays under the sight line to the back counters. */
export const FRONT_ROOF = { eave: 1.4, rise: 0.4 };

/** Pass perches as fractions of Bao's box, plus which way extra cells of the same type step. */
const PASS = {
  orchestrator: { frac: [0, 0.96, 0], step: 1 },
  product: { frac: [-0.55, 0.72, 0.1], step: -1 },
  architect: { frac: [0.55, 0.72, 0.1], step: 1 },
};
const PASS_STEP = 0.4;

const STALLS = {
  steamers: { x: -4.8, z: -1.6, y: COUNTER_Y + BACK_PLATFORM, row: "back" },
  "front-of-house": { x: 4.8, z: -1.6, y: COUNTER_Y + BACK_PLATFORM, row: "back" },
  tea: { x: -4.0, z: 2.2, y: COUNTER_Y, row: "front" },
  pantry: { x: 4.0, z: 2.2, y: COUNTER_Y, row: "front" },
  cubs: { x: 0, z: 4.6, y: 0 },
};

const STATION = {
  developer: "steamers", scout: "steamers", debugger: "steamers",
  qa: "tea", security: "pantry", designer: "front-of-house",
};

/** The four stalls' centres on the floor (the cub row is not a stall). */
export const STALL_CENTERS = Object.fromEntries(
  Object.entries(STALLS).filter(([k]) => k !== "cubs").map(([k, v]) => [k, { x: v.x, z: v.z }]),
);

/** Height of a stall's platform (0 for the front row) and the roof it carries, for the renderer. */
export const stallPlatform = (station) => (STALLS[station]?.row === "back" ? BACK_PLATFORM : 0);
export const stallRoof = (station) => (STALLS[station]?.row === "front" ? FRONT_ROOF : undefined);
/** Counter top height in the world, where a stall's cells stand. */
export const counterTop = (station) => STALLS[station].y;

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

/** A stall widens outward, away from x=0, so its inner edge (and the space around Bao) stays fixed. */
export function stallCenterX(station, count = STALL_BASE_SLOTS) {
  const stall = STALLS[station];
  const extra = stallWidth(count) - stallWidth(STALL_BASE_SLOTS);
  return stall.x + Math.sign(stall.x) * extra / 2;
}

/** A stall can hold every cell the scene shows (scene-from-state MAX_PLUSH). */
export const MAX_STALL_CELLS = 12;

/** Outer edge (|x|) of the widest stall: Steamers holding every cell. The camera must be able to reach it. */
export const WIDEST_STALL_EDGE = Math.abs(stallCenterX("steamers", MAX_STALL_CELLS)) + stallWidth(MAX_STALL_CELLS) / 2;

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
  return { x: stallCenterX(stationOf(cellType), n) + (slot - (n - 1) / 2) * STALL_SPACING, y: stall.y, z: stall.z };
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
