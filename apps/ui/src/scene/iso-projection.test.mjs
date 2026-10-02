// den-iso-v1/02: the isometric projection module (pure) and its orthographic camera config.
// Expected values are the literals in docs/design/2026-10-01-iso-den.md section 1 (pitch, k, the
// default-frame pixel table, pan rule), not recomputed from the module.
//
// Interface under test (apps/ui/src/scene/iso-projection.mjs), view = { width, height, zoom = 1, target = TARGET }:
//   YAW (0), PITCH (atan(1/sqrt 2)), TARGET ([0, 0, -2.9]), ZOOM_MIN, ZOOM_MAX, clampZoom(z)
//   pixelsPerUnit(view)              -> px per world unit
//   worldToScreen([x, y, z], view)   -> { x, y } in px from the viewport's top-left
//   screenToWorld({ x, y }, view, groundY = 0) -> [x, y, z] on the plane y = groundY
//   defaultFrame({ width, height })  -> view at zoom 1 on TARGET
//   cameraConfig(view)               -> { type: "orthographic", position, target, up, near, far, left, right, top, bottom, yaw, pitch }
//   panLimits(view)                  -> { x, z }: |tx| <= x and |tz - TARGET[2]| <= z
import { test } from "node:test";
import assert from "node:assert/strict";
import { OrthographicCamera, Vector3 } from "three";

const load = () => import("./iso-projection.mjs");
const near = (a, b, tol, what = "") => assert.ok(Math.abs(a - b) <= tol, `${what} expected ${b} +-${tol}, got ${a}`);

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 667 };

test("pitch is true isometric (35.264 degrees) and the heading is 0", async () => {
  const { PITCH, YAW, TARGET } = await load();
  near(PITCH, 0.6154797086703874, 1e-9, "atan(1/sqrt2) rad");
  near(Math.sin(PITCH), 0.57735, 1e-5, "sin p");
  near(Math.cos(PITCH), 0.81650, 1e-5, "cos p");
  assert.equal(YAW, 0);
  assert.deepEqual(TARGET, [0, 0, -2.9]); // den-scene-v1/11: Bao stands at z -3.3, the camera looks at z -2.9
});

test("pixels per world unit: 87.8 at 1440x900, 28.8 at 375x667; zoom divides it", async () => {
  const { pixelsPerUnit } = await load();
  near(pixelsPerUnit(DESKTOP), 87.805, 0.01, "desktop k");
  near(pixelsPerUnit(PHONE), 28.846, 0.01, "phone k");
  near(pixelsPerUnit({ ...DESKTOP, zoom: 0.55 }), 159.64, 0.05, "desktop, zoomed in");
  near(pixelsPerUnit({ ...DESKTOP, zoom: 1.2 }), 73.17, 0.05, "desktop, zoomed out");
});

// The default-frame table, section 1.
const TABLE = [
  ["Bao feet", [0, 0, -3.3], [720, 448], [188, 340]],
  ["Steamers", [-3.6, 0.5, -1.4], [404, 508], [84, 360]],
  ["Front of House", [3.6, 0.5, -1.4], [1036, 508], [291, 360]],
  ["Tea", [-5.2, 0, 2.0], [263, 716], [38, 428]],
  ["Pantry", [5.2, 0, 2.0], [1177, 716], [338, 428]],
  ["Susan top", [0, 0.7, 0], [720, 565], [188, 379]],
  ["Hamper", [-1.8, 0, 3.0], [562, 767], [136, 445]],
  ["Tally", [1.8, 0, 3.0], [878, 767], [239, 445]],
];

test("default frame reproduces the digest's pixel table within 2 px at both sizes", async () => {
  const { defaultFrame, worldToScreen } = await load();
  for (const [name, p, desktop, phone] of TABLE) {
    for (const [size, want] of [[DESKTOP, desktop], [PHONE, phone]]) {
      const s = worldToScreen(p, defaultFrame(size));
      near(s.x, want[0], 2, `${name} x at ${size.width}`);
      near(s.y, want[1], 2, `${name} y at ${size.width}`);
    }
  }
});

test("defaultFrame is zoom 1 on Bao's feet", async () => {
  const { defaultFrame, TARGET } = await load();
  const f = defaultFrame(DESKTOP);
  assert.equal(f.width, 1440);
  assert.equal(f.height, 900);
  assert.equal(f.zoom, 1);
  assert.deepEqual(f.target, TARGET);
});

test("orthographic: one world unit spans the same pixels at every depth", async () => {
  const { defaultFrame, worldToScreen } = await load();
  const f = defaultFrame(DESKTOP);
  for (const z of [-8.7, -3.3, 0, 3.0]) {
    const a = worldToScreen([0, 0, z], f);
    const b = worldToScreen([1, 0, z], f);
    near(b.x - a.x, 87.805, 0.01, `1 unit in x at z=${z}`);
    near(b.y - a.y, 0, 1e-9, `no y drift along x at z=${z}`);
  }
  // a vertical metre too: cos(pitch) * k, regardless of depth
  for (const z of [-8.7, 3.0]) {
    const a = worldToScreen([0, 0, z], f);
    const b = worldToScreen([0, 1, z], f);
    near(a.y - b.y, 87.805 * 0.8165, 0.02, `1 unit in y at z=${z}`);
  }
});

test("world to screen to world round-trips at several zooms, sizes and heights", async () => {
  const { worldToScreen, screenToWorld } = await load();
  const samples = [[0, 0, -3.3], [-5.2, 0.6, 2.0], [5.2, 0, 2.0], [3.6, 1.2, -1.4], [-7.8, 0, 0.8], [1.8, 1.55, 3.0], [0, 4.2, -3.3]];
  for (const size of [DESKTOP, PHONE]) {
    for (const zoom of [0.55, 0.8, 1, 1.2]) {
      for (const target of [[0, 0, -2.9], [1.5, 0, -2.9], [-2, 0, -1.8]]) {
        const view = { ...size, zoom, target };
        for (const p of samples) {
          const back = screenToWorld(worldToScreen(p, view), view, p[1]);
          for (let i = 0; i < 3; i++) near(back[i], p[i], 1e-6, `p=${p} zoom=${zoom} axis ${i}`);
        }
      }
    }
  }
});

test("ground pick: the screen anchor is Bao's feet; the table's Tally pixel picks the Tally's floor point", async () => {
  const { defaultFrame, screenToWorld } = await load();
  const f = defaultFrame(DESKTOP);
  const feet = screenToWorld({ x: 720, y: 448 }, f);
  near(feet[0], 0, 0.02, "x");
  near(feet[1], 0, 1e-9, "y");
  near(feet[2], -3.3, 0.03, "z");
  const tally = screenToWorld({ x: 878, y: 767 }, f);
  near(tally[0], 1.8, 0.03, "tally x");
  near(tally[2], 3.0, 0.03, "tally z");
});

test("cameraConfig is orthographic, yaw 0, pitch 35.264 degrees, looking at the target from 40 units", async () => {
  const { cameraConfig, defaultFrame, PITCH } = await load();
  const c = cameraConfig(defaultFrame(DESKTOP));
  assert.equal(c.type, "orthographic");
  assert.equal(c.yaw, 0);
  near(c.pitch, PITCH, 1e-9, "pitch");
  assert.deepEqual(c.up, [0, 1, 0]);
  assert.equal(c.near, 0.1);
  assert.equal(c.far, 120);
  assert.deepEqual(c.target, [0, 0, -2.9]);
  // position = target + 40 * (0, sin p, cos p)
  near(c.position[0], 0, 1e-9, "x");
  near(c.position[1], 40 * 0.57735, 1e-3, "y");
  near(c.position[2], -2.9 + 40 * 0.8165, 1e-3, "z");
  assert.ok(!("fov" in c), "no perspective field of view");
});

test("cameraConfig has square pixels: frustum is W/k by H/k world units", async () => {
  const { cameraConfig, defaultFrame, pixelsPerUnit } = await load();
  for (const size of [DESKTOP, PHONE]) {
    const f = defaultFrame(size);
    const c = cameraConfig(f);
    const k = pixelsPerUnit(f);
    near(c.right - c.left, size.width / k, 1e-9, "width");
    near(c.top - c.bottom, size.height / k, 1e-9, "height");
  }
});

// Build the camera the config describes in three and check it draws the digest's pixels. This is what the
// R3F rig does, so a config that disagrees with worldToScreen fails here.
const threeCamera = (c) => {
  const cam = new OrthographicCamera(c.left, c.right, c.top, c.bottom, c.near, c.far);
  cam.position.set(...c.position);
  cam.up.set(...c.up);
  cam.lookAt(new Vector3(...c.target));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
};
const toPixels = (p, cam, { width, height }) => {
  const v = new Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};

test("a three orthographic camera built from the config projects the default-frame table", async () => {
  const { cameraConfig, defaultFrame } = await load();
  for (const size of [DESKTOP, PHONE]) {
    const cam = threeCamera(cameraConfig(defaultFrame(size)));
    assert.equal(cam.isOrthographicCamera, true);
    for (const [name, p, desktop, phone] of TABLE) {
      const want = size === DESKTOP ? desktop : phone;
      const s = toPixels(p, cam, size);
      near(s.x, want[0], 2, `${name} x at ${size.width}`);
      near(s.y, want[1], 2, `${name} y at ${size.width}`);
    }
  }
});

test("the config follows zoom and pan: it agrees with worldToScreen", async () => {
  const { cameraConfig, worldToScreen } = await load();
  const view = { ...DESKTOP, zoom: 0.7, target: [2.5, 0, -2.0] };
  const cam = threeCamera(cameraConfig(view));
  for (const p of [[0, 0, -3.3], [-5.2, 0.5, 2.0], [5.2, 0, 2.0], [1.8, 1.5, 3.0]]) {
    const a = worldToScreen(p, view);
    const b = toPixels(p, cam, DESKTOP);
    near(b.x, a.x, 0.5, `x of ${p}`);
    near(b.y, a.y, 0.5, `y of ${p}`);
  }
});

test("zoom range is the digest's 0.55 to 1.2 (73 to 160 px per unit at 1440x900)", async () => {
  const { ZOOM_MIN, ZOOM_MAX, clampZoom, pixelsPerUnit } = await load();
  assert.equal(ZOOM_MIN, 0.55);
  assert.equal(ZOOM_MAX, 1.2);
  assert.equal(clampZoom(1), 1);
  assert.equal(clampZoom(0.1), 0.55);
  assert.equal(clampZoom(3), 1.2);
  near(pixelsPerUnit({ ...DESKTOP, zoom: ZOOM_MAX }), 73, 0.5, "far end");
  near(pixelsPerUnit({ ...DESKTOP, zoom: ZOOM_MIN }), 160, 0.5, "near end");
});

// Pan limits, section 1. z: |tz + 2.9| <= max(0, 3.9 - H/2k) / sin p, worked by hand:
//   1440x900, zoom 0.55: k = 159.64, H/2k = 2.819, (3.9 - 2.819) / 0.57735 = 1.872
//   1440x900, zoom 0.7:  k = 125.44, H/2k = 3.587, (3.9 - 3.587) / 0.57735 = 0.542
test("pan z-limit: none at the default, about 1.1 units of screen height at the nearest zoom", async () => {
  const { panLimits } = await load();
  assert.equal(panLimits({ ...DESKTOP, zoom: 1 }).z, 0);
  assert.equal(panLimits({ ...PHONE, zoom: 1 }).z, 0);
  near(panLimits({ ...DESKTOP, zoom: 0.55 }).z, 1.872, 0.01, "zoom 0.55");
  near(panLimits({ ...DESKTOP, zoom: 0.7 }).z, 0.542, 0.01, "zoom 0.7");
});

test("pan x-limit keeps the widest stall's outer edge reachable and is zero when it already fits", async () => {
  const { panLimits, pixelsPerUnit } = await load();
  const { WIDEST_STALL_EDGE } = await import("./banquet-layout.mjs");
  for (const size of [DESKTOP, PHONE, { width: 1040, height: 900 }]) {
    for (const zoom of [0.55, 0.8, 1, 1.2]) {
      const view = { ...size, zoom };
      const half = size.width / 2 / pixelsPerUnit(view);
      const { x } = panLimits(view);
      assert.ok(x >= 0);
      if (half >= WIDEST_STALL_EDGE) assert.equal(x, 0, `${size.width} zoom ${zoom}`);
      else near(x + half, WIDEST_STALL_EDGE, 1e-9, `${size.width} zoom ${zoom}: limit + half-width = widest edge`);
    }
  }
  // phone, zoom 1: half-width 6.5 units, so the widest edge (>= 11) needs pan
  assert.ok(panLimits({ ...PHONE, zoom: 1 }).x > 4);
  // desktop, zoom 1: half-width 8.2 units. den-scene-v1/11 (A1): Tea and Pantry stand 0.3 farther out, so the widest
  // edge is 0.3 larger and the limit is 4.025 (it was 3.725); a literal, run from the module at the final constants.
  near(panLimits({ ...DESKTOP, zoom: 1 }).x, 4.025, 0.01, "desktop zoom 1 pan x-limit");
  near(panLimits({ ...PHONE, zoom: 1 }).x, 5.725, 0.01, "phone zoom 1 pan x-limit");
});
