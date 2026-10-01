// A stall's four posts and its hip roof with slightly upturned eaves. Pure geometry in the stall's
// local frame (origin on the counter's base, at its centre). The roof's corners are the post tops.
// A stall may pass its own roof {eave, rise}: the front-row stalls use a low one so they do not hide
// the back row from the default camera.
export const POST_BASE = 0.5; // counter top
export const EAVE_Y = 1.7;
export const UPTURN = 0.1;
export const RISE = 0.7;
export const POST_SIZE = 0.08;
const POST_INSET = POST_SIZE / 2;
const DEFAULT_ROOF = { eave: EAVE_Y, rise: RISE };

export const postHeight = (roof = DEFAULT_ROOF) => roof.eave + UPTURN - POST_BASE;

/** Post centres (x, z), clockwise from back-left. */
export function postPositions(width, depth) {
  const x = width / 2 - POST_INSET;
  const z = depth / 2 - POST_INSET;
  return [[-x, -z], [x, -z], [x, z], [-x, z]];
}

/** Eight points around the eave: corner, edge midpoint, corner, ... Corners are upturned. */
export function roofRing(width, depth, roof = DEFAULT_ROOF) {
  const p = postPositions(width, depth);
  const ring = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = p[i];
    const [bx, bz] = p[(i + 1) % 4];
    ring.push([ax, roof.eave + UPTURN, az]);
    ring.push([(ax + bx) / 2, roof.eave, (az + bz) / 2]);
  }
  return ring;
}

export const roofApex = (roof = DEFAULT_ROOF) => [0, roof.eave + roof.rise, 0];

const lerp3 = (a, b, t) => a.map((c, k) => c + (b[k] - c) * t);
const MID_INSET = 0.5;
export const EAVE_TRIM_HEIGHT = 0.03;

/**
 * Flat position array (9 numbers per triangle), all facing the apex. Each face has two tile tiers:
 * a lower band (ring -> mid ring) of two triangles and an upper triangle (mid ring -> apex).
 */
export function roofTriangles(width, depth, roof = DEFAULT_ROOF) {
  const ring = roofRing(width, depth, roof);
  const apex = roofApex(roof);
  const mid = ring.map((p) => lerp3(p, apex, MID_INSET));
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    out.push(...ring[j], ...ring[i], ...mid[i]);
    out.push(...ring[j], ...mid[i], ...mid[j]);
    out.push(...mid[j], ...mid[i], ...apex);
  }
  return out;
}

/** A thin vertical band hanging EAVE_TRIM_HEIGHT under the eave ring, following it point for point. */
export function eaveTrimTriangles(width, depth, roof = DEFAULT_ROOF) {
  const ring = roofRing(width, depth, roof);
  const low = (p) => [p[0], p[1] - EAVE_TRIM_HEIGHT, p[2]];
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    out.push(...a, ...b, ...low(b));
    out.push(...a, ...low(b), ...low(a));
  }
  return out;
}
