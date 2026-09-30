// den-scene-v1/01 approved framing revision: 1600x900 desktop, 440px control panel.
// Project complete kiosk geometry, including its roof/platform/posts, rather than centres alone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraPosition, FOV_DEG } from "./camera-rig.mjs";
import { BAO, TABLE, STALL_CENTERS, stallCenterX, stallPlatform, stallRoof, stallWidth, stallYaw } from "./banquet-layout.mjs";
import { EAVE_Y, POST_BASE, POST_SIZE, postHeight, postPositions, roofTriangles } from "./stall-roof.mjs";

const counts = [{}, { steamers: 7 }]; // default 3-slot kiosks and captured current 6 active + idle Scout
const camera = () => {
  const c = new PerspectiveCamera(FOV_DEG, 1160 / 900, 0.1, 100);
  c.position.set(...cameraPosition(0, 1));
  c.rotation.set(-0.2, 0, 0);
  c.updateMatrixWorld();
  return c;
};
const box = (x, y, z, hx, hy, hz) => [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => [x + sx * hx, y + sy * hy, z + sz * hz])));
const bounds = (points, c) => {
  const ps = points.map((p) => new Vector3(...p).project(c));
  return { x0: Math.min(...ps.map((p) => p.x)), x1: Math.max(...ps.map((p) => p.x)), y0: Math.min(...ps.map((p) => p.y)), y1: Math.max(...ps.map((p) => p.y)) };
};
const world = (station, n, [x, y, z]) => {
  const yaw = stallYaw(station);
  return [stallCenterX(station, n) + x * Math.cos(yaw) + z * Math.sin(yaw), y + stallPlatform(station), STALL_CENTERS[station].z - x * Math.sin(yaw) + z * Math.cos(yaw)];
};
const completeKiosk = (station, n) => {
  const width = stallWidth(n), roof = stallRoof(station);
  const flatRoof = roofTriangles(width, 1, roof);
  const points = Array.from({ length: flatRoof.length / 3 }, (_, i) => flatRoof.slice(i * 3, i * 3 + 3));
  points.push(...box(0, 0.25, 0, width / 2, 0.25, 0.5));
  points.push(...box(0, 0.52, 0.5, (width + 0.1) / 2, 0.03, 0.05));
  for (const [x, z] of postPositions(width, 1)) points.push(...box(x, POST_BASE + postHeight(roof) / 2, z, POST_SIZE / 2, postHeight(roof) / 2, POST_SIZE / 2));
  points.push(...box(0, (roof?.eave ?? EAVE_Y) - 0.2, 0.45, 0.14, 0.14, 0.14));
  const platform = stallPlatform(station);
  if (platform) points.push(...box(0, -platform / 2, 0, (width + 0.3) / 2, platform / 2, 0.65));
  return points.map((p) => world(station, n, p));
};

test("approved default uses z13.8 and FOV46 with original x/y", () => {
  assert.deepEqual(cameraPosition(0, 1), [0, 4.2, 13.8]);
  assert.equal(FOV_DEG, 46);
});

test("complete kiosks fit the desktop scene at approved default, including current widened Steamers", () => {
  for (const occupancy of counts) for (const station of Object.keys(STALL_CENTERS)) {
    const b = bounds(completeKiosk(station, occupancy[station] ?? 3), camera());
    assert.ok(b.x0 >= -1 && b.x1 <= 1 && b.y0 >= -1 && b.y1 <= 1, `${station}: ${JSON.stringify(b)}`);
  }
});

const overlaps = (a, b) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) + 1e-9 && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0) + 1e-9;
test("approved desktop framing keeps every counter clear of other counters, Bao and tabletop", () => {
  const c = camera(), [bx, by, bz] = BAO.position, s = BAO.scale;
  const bao = bounds(box(bx, by, bz, s, s, s * 0.875), c);
  const table = bounds(Array.from({ length: 128 }, (_, i) => [TABLE.x + 1.8 * Math.cos(i * Math.PI / 64), TABLE.height, TABLE.z + 1.8 * Math.sin(i * Math.PI / 64)]), c);
  for (const occupancy of counts) {
    const counters = Object.keys(STALL_CENTERS).map((station) => {
      const n = occupancy[station] ?? 3;
      return { station, rect: bounds([-1, 1].flatMap((x) => [-1, 1].map((z) => world(station, n, [x * stallWidth(n) / 2, 0.5, z * 0.5]))), c) };
    });
    for (let i = 0; i < counters.length; i++) {
      const { station, rect } = counters[i];
      assert.ok(!overlaps(rect, bao), `${station}/Bao`);
      assert.ok(!overlaps(rect, table), `${station}/table`);
      for (let j = i + 1; j < counters.length; j++) assert.ok(!overlaps(rect, counters[j].rect), `${station}/${counters[j].station}`);
    }
  }
});
