// Test helper (den-iso-v1/04, fog): the points that make up the market, and the farthest any of them is from the camera the
// rig builds. Not a test file. The camera position comes from cameraConfig(view), never a literal.
import {
  BAO, CUB_BASKET, CUB_BASKET_RADIUS, DORMANT_PADS, STALL_CENTERS, TABLE, TALLY, WIDEST_STALL_EDGE,
  bambooStalks, stallPlatform, stallRoof, stallWidth, stepStones,
} from "./banquet-layout.mjs";
import { ZOOM_MAX, ZOOM_MIN, cameraConfig, defaultFrame, panLimits } from "./iso-projection.mjs";

const TOP = 3.4; // above Bao's crown and the bamboo tops, so the nearest-to-camera edge of every object is covered
const ring = (cx, cz, r, y, n = 16) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), y, cz + r * Math.sin((2 * Math.PI * i) / n)]);
const column = (points) => points.flatMap(([x, , z]) => [[x, 0, z], [x, TOP, z]]);

/** Ground-plan outline of every market object, as [x, y, z] points at the ground and at the top. */
export function marketPoints() {
  const points = [];
  for (const station of Object.keys(STALL_CENTERS)) {
    const half = stallWidth(3) / 2 + 0.15;
    const roof = stallRoof(station);
    for (const x of [-half, half]) for (const z of [-0.65, 0.65]) {
      points.push([STALL_CENTERS[station].x + x, 0, STALL_CENTERS[station].z + z]);
      points.push([STALL_CENTERS[station].x + x, stallPlatform(station) + (roof ? roof.eave + roof.rise : 2.2), STALL_CENTERS[station].z + z]);
    }
  }
  // The widest overflow of any stall, out to the pan limit.
  for (const sign of [-1, 1]) points.push([sign * WIDEST_STALL_EDGE, 0, STALL_CENTERS.tea.z], [sign * WIDEST_STALL_EDGE, 2.2, STALL_CENTERS.tea.z]);
  points.push(...column(ring(TABLE.x, TABLE.z, 1.8, 0)));
  points.push(...column(ring(CUB_BASKET.x, CUB_BASKET.z, CUB_BASKET_RADIUS, 0)));
  for (const x of [-TALLY.frame.width / 2, TALLY.frame.width / 2]) points.push([TALLY.x + x, 0, TALLY.z], [TALLY.x + x, TOP, TALLY.z]);
  const [bx, , bz] = BAO.position;
  for (const x of [-BAO.scale, BAO.scale]) for (const z of [-BAO.scale * 0.875, BAO.scale * 0.875]) points.push([bx + x, 0, bz + z], [bx + x, TOP, bz + z]);
  for (const pad of DORMANT_PADS) points.push(...ring(pad.x, pad.z, pad.radius, 0));
  for (const s of bambooStalks()) points.push([s.x, 0, s.z], [s.x, s.height + 0.4, s.z]);
  for (const s of stepStones()) points.push([s.x, 0, s.z]);
  return points;
}

/** The views to check: the default frame and both ends of the zoom and pan range, at a desktop and a phone viewport. */
export function views() {
  const out = [];
  for (const size of [{ width: 1440, height: 900 }, { width: 375, height: 667 }]) {
    out.push(defaultFrame(size));
    for (const zoom of [ZOOM_MIN, ZOOM_MAX]) {
      const base = { ...defaultFrame(size), zoom };
      const { x, z } = panLimits(base);
      for (const dx of [-x, 0, x]) for (const dz of [-z, 0, z]) out.push({ ...base, target: [base.target[0] + dx, base.target[1], base.target[2] + dz] });
    }
  }
  return out;
}

/** The greatest distance from the rig's camera to any market point, over every view. */
export function farthestMarketDistance() {
  const points = marketPoints();
  let far = 0;
  for (const view of views()) {
    const [cx, cy, cz] = cameraConfig(view).position;
    for (const [x, y, z] of points) far = Math.max(far, Math.hypot(x - cx, y - cy, z - cz));
  }
  return far;
}
