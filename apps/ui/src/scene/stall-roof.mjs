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

/** Flat position array (9 numbers per triangle), one triangle per ring edge, all facing the apex. */
export function roofTriangles(width, depth, roof = DEFAULT_ROOF) {
  const ring = roofRing(width, depth, roof);
  const apex = roofApex(roof);
  const out = [];
  for (let i = 0; i < ring.length; i++) out.push(...ring[(i + 1) % ring.length], ...ring[i], ...apex);
  return out;
}
