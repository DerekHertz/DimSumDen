// den-scene-v1/01: public layout and movement acceptance seams.
// Targets and tolerance come from docs/design/den-map.md, not existing placement math.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import * as layout from "./banquet-layout.mjs";
import { stepRoamer, roamObstacles } from "./roam.mjs";
import { cameraPosition, FOV_DEG } from "./camera-rig.mjs";
import { stationLabels } from "./station-labels.mjs";
import * as handoffs from "./handoffs.mjs";

const targets = {
  steamers: [-3, -1.4], "front-of-house": [3, -1.4],
  tea: [-4.9, 2], pantry: [4.9, 2],
};
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 0.3 + 1e-9, `${message}: ${actual} vs ${expected} (±0.3)`);

for (const [station, [x, z]] of Object.entries(targets)) {
  test(`horseshoe: ${station} is at its approved target`, () => {
    close(layout.STALL_CENTERS[station].x, x, `${station} x`);
    close(layout.STALL_CENTERS[station].z, z, `${station} z`);
  });
}
for (const [name, target, expected] of [["Cubs", layout.CUB_BASKET, [-1.8, 3]], ["Tally", layout.TALLY, [1.8, 3]]]) {
  test(`horseshoe: ${name} is at its approved target`, () => {
    close(target.x, expected[0], `${name} x`);
    close(target.z, expected[1], `${name} z`);
  });
}

test("horseshoe: every kiosk faces the table with capped yaw", () => {
  assert.equal(typeof layout.stallYaw, "function", "layout exports the approved stallYaw(station) seam");
  for (const [station, expected] of [["steamers", 0.52], ["front-of-house", -0.52], ["tea", 0.52], ["pantry", -0.52]]) {
    const { x, z } = layout.STALL_CENTERS[station];
    const yaw = layout.stallYaw(station);
    assert.ok(Math.abs(yaw) <= 0.52, `${station} yaw is capped`);
    assert.ok(Math.abs(yaw - Math.max(-0.52, Math.min(0.52, Math.atan2(-x, -z)))) < 1e-9, `${station} uses the table-facing clamp rule`);
    assert.ok(Math.abs(yaw - expected) < 1e-9, `${station} faces inward`);
  }
});

// Project actual prop extents: counter 2.25×1, Bao 2×2×1.75 at scale 1.4,
// tabletop radius 1.8 (Market.jsx). Rotating corners uses the same world axes as Three.
const camera = new PerspectiveCamera(FOV_DEG, 16 / 9, 0.1, 100);
camera.position.set(...cameraPosition(0, 1));
camera.rotation.set(-0.2, 0, 0); // App.jsx default camera pitch
camera.updateMatrixWorld();
const bounds = (points) => {
  const projected = points.map((p) => new Vector3(...p).project(camera));
  return { x0: Math.min(...projected.map((p) => p.x)), x1: Math.max(...projected.map((p) => p.x)), y0: Math.min(...projected.map((p) => p.y)), y1: Math.max(...projected.map((p) => p.y)) };
};
const box = (cx, cy, cz, hx, hy, hz) => [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => [cx + sx * hx, cy + sy * hy, cz + sz * hz])));
const overlaps = (a, b) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) + 1e-9 && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0) + 1e-9;

test("horseshoe: default-camera counter rectangles clear kiosks, Bao and table", () => {
  const counters = Object.entries(layout.STALL_CENTERS).map(([station, c]) => {
    const yaw = layout.stallYaw?.(station) ?? 0; // pre-feature geometry has no rotation
    const points = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => {
      const x = sx * layout.stallWidth(3) / 2, z = sz * 0.5;
      return [c.x + x * Math.cos(yaw) + z * Math.sin(yaw), layout.stallPlatform(station) + 0.5, c.z - x * Math.sin(yaw) + z * Math.cos(yaw)];
    }));
    return { station, rect: bounds(points) };
  });
  const [bx, by, bz] = layout.BAO.position, s = layout.BAO.scale;
  const bao = bounds(box(bx, by, bz, s, s, s * 0.875));
  const table = bounds(Array.from({ length: 128 }, (_, i) => {
    const angle = i * 2 * Math.PI / 128;
    return [layout.TABLE.x + 1.8 * Math.cos(angle), layout.TABLE.height, layout.TABLE.z + 1.8 * Math.sin(angle)];
  }));
  for (let i = 0; i < counters.length; i++) {
    const { station, rect } = counters[i];
    assert.ok(!overlaps(rect, bao), `${station} counter overlaps Bao`);
    assert.ok(!overlaps(rect, table), `${station} counter overlaps table`);
    for (let j = i + 1; j < counters.length; j++) assert.ok(!overlaps(rect, counters[j].rect), `${station} counter overlaps ${counters[j].station}`);
  }
});

// Designer clarification: travel goes around the rear horseshoe, in the order
// Tea -> Steamers -> Front of House -> Pantry (or reverse), never across the
// front gap. Check continuous segment clearance, not just sparse waypoints.
const stationOrder = ["tea", "steamers", "front-of-house", "pantry"];
const rearAngle = (p, station) => {
  const angle = Math.atan2(p.z, p.x);
  return angle < 0 || station === "pantry" ? angle + 2 * Math.PI : angle;
};
for (const from of stationOrder) {
  for (const to of stationOrder.filter((station) => station !== from)) {
    test(`horseshoe: handoff ${from} to ${to} follows the rear arc and clears the table`, () => {
      assert.equal(typeof handoffs.handoffPath, "function", "handoffs exports the approved handoffPath(fromStation,toStation) seam");
      const path = handoffs.handoffPath(from, to);
      assert.ok(Array.isArray(path) && path.length >= 2, "travel has source and destination points");
      for (const [p, station] of [[path[0], from], [path.at(-1), to]]) {
        const c = layout.STALL_CENTERS[station];
        assert.ok(Math.hypot(p.x - c.x, p.z - c.z) < 1e-6, `${station} endpoint is its centre slot`);
      }
      const start = rearAngle(path[0], from), end = rearAngle(path.at(-1), to);
      const direction = Math.sign(stationOrder.indexOf(to) - stationOrder.indexOf(from));
      let previous = start;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i];
        assert.ok([a.x, a.z, b.x, b.z].every(Number.isFinite), "waypoints are finite");
        const dx = b.x - a.x, dz = b.z - a.z, length2 = dx * dx + dz * dz;
        const t = length2 ? Math.max(0, Math.min(1, -(a.x * dx + a.z * dz) / length2)) : 0;
        assert.ok(Math.hypot(a.x + t * dx, a.z + t * dz) >= 2.1 - 1e-9, `${from}->${to} segment ${i} enters tabletop clearance`);
        for (let sample = 1; sample <= 100; sample++) {
          const fraction = sample / 100;
          let angle = Math.atan2(a.z + fraction * dz, a.x + fraction * dx);
          while (angle - previous > Math.PI) angle -= 2 * Math.PI;
          while (angle - previous < -Math.PI) angle += 2 * Math.PI;
          assert.ok((angle - previous) * direction >= -1e-9, "travel advances in rear horseshoe order");
          assert.ok(angle >= Math.min(start, end) - 1e-9 && angle <= Math.max(start, end) + 1e-9, "travel never wraps through the front grass gap");
          previous = angle;
        }
      }
      assert.ok(Math.abs(previous - end) < 1e-6, "rear arc reaches its destination without a full front wrap");
    });
  }
}

for (const type of ["product", "architect", "developer", "scout", "qa", "security", "designer"]) {
  for (const reduced of [false, true]) {
    test(`horseshoe: idle ${type} stays at its slot for 60 seconds (reduced=${reduced})`, () => {
      const slot = layout.placeCell(type, 0), obstacles = roamObstacles();
      let state;
      for (let frame = 0; frame <= 60 * 30; frame++) {
        state = stepRoamer(state, { seed: type, slot, working: false, now: frame / 30, dt: 1 / 30, obstacles, reduced });
        assert.ok(Math.hypot(state.x - slot.x, state.y - slot.y, state.z - slot.z) < 1e-6, `${type} leaves its station at ${frame / 30}s`);
        assert.equal(state.moving, false, `${type} has no idle travel`);
      }
    });
  }
}

test("horseshoe: station labels follow the approved kiosk and Cubs centres", () => {
  const labels = stationLabels({});
  for (const [station, [x, z]] of Object.entries({ ...targets, cubs: [-1.8, 3] })) {
    const label = labels.find((entry) => entry.station === station);
    close(label.x, x, `${station} label x`);
    close(label.z, z, `${station} label z`);
  }
});
