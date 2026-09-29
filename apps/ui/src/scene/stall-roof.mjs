// A stall's four posts and its hip roof with slightly upturned eaves. Pure geometry in the stall's
// local frame (origin on the floor at its centre). The roof's corners are the post tops.
export const POST_BASE = 0.5; // counter top
export const EAVE_Y = 1.7;
export const UPTURN = 0.1;
const RISE = 0.7;
export const POST_SIZE = 0.08;
const POST_INSET = POST_SIZE / 2;

export const postHeight = () => EAVE_Y + UPTURN - POST_BASE;

/** Post centres (x, z), clockwise from back-left. */
export function postPositions(width, depth) {
  const x = width / 2 - POST_INSET;
  const z = depth / 2 - POST_INSET;
  return [[-x, -z], [x, -z], [x, z], [-x, z]];
}

/** Eight points around the eave: corner, edge midpoint, corner, ... Corners are upturned. */
export function roofRing(width, depth) {
  const p = postPositions(width, depth);
  const ring = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = p[i];
    const [bx, bz] = p[(i + 1) % 4];
    ring.push([ax, EAVE_Y + UPTURN, az]);
    ring.push([(ax + bx) / 2, EAVE_Y, (az + bz) / 2]);
  }
  return ring;
}

export const roofApex = () => [0, EAVE_Y + RISE, 0];

/** Flat position array (9 numbers per triangle), one triangle per ring edge, all facing the apex. */
export function roofTriangles(width, depth) {
  const ring = roofRing(width, depth);
  const apex = roofApex();
  const out = [];
  for (let i = 0; i < ring.length; i++) out.push(...ring[(i + 1) % ring.length], ...ring[i], ...apex);
  return out;
}
