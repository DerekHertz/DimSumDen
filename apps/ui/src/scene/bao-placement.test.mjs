// den-scene-v1/11 (option B, Soft bun), part 2: screen and footprint clearances around the bigger Bao (T3, T5, T6).
// Numbers are the designer's (11-designer-spec.md sections 1 to 3 and Amendment 1), written as literals, not read back from the layout under test.
import test from "node:test";
import assert from "node:assert/strict";
import { DORMANT_PADS, STALL_CENTERS, stallCenterX, stallWidth, stallYaw } from "./banquet-layout.mjs";
import { defaultFrame, pixelsPerUnit, worldToScreen } from "./iso-projection.mjs";
import { stackChips } from "./chip-model.mjs";
import { footLiftFor, loadPandaGltf, newFigure, poseFigure, worldTriangles } from "./bao-rig.fixture.mjs";

// ---- T3: the back kiosks' platform footprints clear Bao's footprint box (|x| <= 2.1, z -5.1375 to -1.4625) by at least 0.05 world

const BAO_BOX = [[-2.1, -5.1375], [2.1, -5.1375], [2.1, -1.4625], [-2.1, -1.4625]];
const platform = (station) => {
  const yaw = stallYaw(station), hx = (stallWidth(3) + 0.3) / 2, hz = 0.65, cx = stallCenterX(station, 3), cz = STALL_CENTERS[station].z;
  return [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([lx, lz]) => [cx + lx * Math.cos(yaw) + lz * Math.sin(yaw), cz - lx * Math.sin(yaw) + lz * Math.cos(yaw)]);
};
const edges = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
const segDist = ([px, pz], [[ax, az], [bx, bz]]) => {
  const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
};
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const crosses = ([a, b], [c, d]) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
const inside = (p, poly) => edges(poly).every(([a, b]) => cross(a, b, p) >= 0) || edges(poly).every(([a, b]) => cross(a, b, p) <= 0);
function polyGap(A, B) {
  if (A.some((p) => inside(p, B)) || B.some((p) => inside(p, A)) || edges(A).some((e) => edges(B).some((f) => crosses(e, f)))) return 0;
  return Math.min(...A.flatMap((p) => edges(B).map((e) => segDist(p, e))), ...B.flatMap((p) => edges(A).map((e) => segDist(p, e))));
}

test("T3: the back kiosks' platforms (yawed, half sizes 1.275 x 0.65) clear Bao's footprint box by at least 0.05 world", () => {
  for (const station of ["steamers", "front-of-house"]) {
    const gap = polyGap(platform(station), BAO_BOX);
    assert.ok(gap >= 0.05, `${station}: platform to Bao gap ${gap.toFixed(3)} (designer measured 0.07 at x +-3.6; the lever is x +-3.7 for 0.17, reported)`);
  }
});

// ---- T5: pills and shoulder pandas

const SIZES = [{ width: 1440, height: 900 }, { width: 375, height: 667 }];
const PILL = { width: 1.714, height: 0.3, y: 0.1 }; // Den.jsx PadChips: a camera-facing sprite on each dormant pad, 320 x 56 at 0.3 world tall
const SHOULDERS = { product: [-1.722, 2.289, -3.384], architect: [1.722, 2.289, -3.384] }; // the designer's measured seats
const rectGap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));

async function shoulderPandas(view) {
  const gltf = await loadPandaGltf(), lift = footLiftFor(gltf);
  return Object.fromEntries(Object.entries(SHOULDERS).map(([type, [x, y, z]]) => {
    const fig = poseFigure(newFigure(gltf), { clip: "sit_still", position: [x, y + lift, z], scale: 0.3 });
    const verts = worldTriangles(fig, { includeFace: true }).flatMap(({ pos }) => Array.from({ length: pos.length / 3 }, (_, i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]));
    const ps = verts.map((p) => worldToScreen(p, view));
    const height = Math.max(...verts.map((p) => p[1])) - Math.min(...verts.map((p) => p[1]));
    const anchor = worldToScreen([x, y + lift + height * 1.05, z], view); // Figure's chip anchor: root position + 1.05 x the box height
    return [type, { rect: { x0: Math.min(...ps.map((p) => p.x)), x1: Math.max(...ps.map((p) => p.x)), y0: Math.min(...ps.map((p) => p.y)), y1: Math.max(...ps.map((p) => p.y)) }, anchor }];
  }));
}
const pillRect = (pad, view) => {
  const c = worldToScreen([pad.x, PILL.y, pad.z], view), k = pixelsPerUnit(view);
  return { x0: c.x - (PILL.width * k) / 2, x1: c.x + (PILL.width * k) / 2, y0: c.y - (PILL.height * k) / 2, y1: c.y + (PILL.height * k) / 2 };
};

test("T5: each Library and Drum pill is at least 8 px from the shoulder pandas at 1440x900 and 375x667", async () => {
  for (const size of SIZES) {
    const view = defaultFrame(size), pandas = await shoulderPandas(view);
    for (const pad of DORMANT_PADS) for (const [type, { rect }] of Object.entries(pandas)) {
      const gap = rectGap(pillRect(pad, view), rect);
      assert.ok(gap >= 8, `${pad.id} pill to ${type} at ${size.width}x${size.height}: ${gap.toFixed(1)} px (designer: about 52.8 and 17.3 at pads x +-3.4)`);
    }
  }
});

test("T5: the shoulder pandas' status chips (96 x 22, stacked) do not overlap either pill", async () => {
  for (const size of SIZES) {
    const view = defaultFrame(size), pandas = await shoulderPandas(view);
    const placed = stackChips(Object.entries(pandas).map(([ref, { anchor }]) => ({ ref, x: anchor.x, y: anchor.y })));
    for (const pad of DORMANT_PADS) for (const [ref, p] of placed) {
      const chip = { x0: p.x - 48, x1: p.x + 48, y0: p.y - 22, y1: p.y }; // .chip is translated (-50%, -100%)
      assert.ok(rectGap(pillRect(pad, view), chip) > 0, `${pad.id} pill overlaps the ${ref} chip at ${size.width}x${size.height}`);
    }
  }
});

// ---- T6: headroom. The orchestrator on the rail: hat top at world y 5.2314 (the rail top 4.2714 plus the hat; the designer's 53 px at 1440x900),
// its status chip 24 px above that (22 tall plus a 2 px gap).

test("T6: the orchestrator's hat top and status chip stay at least 8 px inside the top edge at 1440x900, 1280x720 and 1366x768", () => {
  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1366, height: 768 }]) {
    const hat = worldToScreen([0, 5.2314, -3.6885], defaultFrame(size));
    assert.ok(hat.y - 24 >= 8, `${size.width}x${size.height}: chip top ${(hat.y - 24).toFixed(1)} px, hat top ${hat.y.toFixed(1)} px (designer: hat 53, 41, 45 px at TARGET z -2.9)`);
  }
});
