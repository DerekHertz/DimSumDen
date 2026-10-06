Jevgrep: 53 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 6 file(s).
- "apps/ui/src/scene/banquet-layout.mjs" — implementation, caller, helper; source below
- "apps/ui/src/scene/Den.jsx" — implementation, caller, helper; source below
- "apps/ui/src/scene/banquet-layout.test.mjs" — caller, test, fixture, helper; source below
- "apps/ui/src/scene/default-framing.test.mjs" — test, fixture, helper; source below
- "design/3d/level1_compose.py" — implementation, caller, helper; locations only
- "design/3d/level1.py" — implementation, helper; source below
- "apps/ui/src/scene/horseshoe-layout.test.mjs" — test, fixture, helper; source omitted
- "design/3d/level1_plush.py" — implementation, caller, helper; source below
- "apps/ui/src/scene/grove-layout.test.mjs" — caller, test, fixture, helper; source omitted
- "apps/ui/src/scene/grove-layout.mjs" — helper; locations only
- "apps/ui/src/scene/scene-dressing-framing.test.mjs" — test, fixture, helper; source below
- "apps/ui/src/assets/prop-placement.test.mjs" — test, fixture, helper; source omitted
- "apps/ui/src/assets/prop-placement.mjs" — fixture, helper; locations only
- "apps/ui/src/scene/roam.mjs" — implementation, caller, helper; locations only
- "design/3d/panda_build.py" — helper; locations only
- "design/3d/level1_set.py" — implementation, helper; locations only
- "apps/ui/src/scene/tally-stele.test.mjs" — test, fixture, helper; source omitted
- "docs/design/den-map.md" — helper; locations only
- "design/3d/cell_types_plush.py" — helper; locations only
- "apps/ui/src/scene/market-extent.fixture.mjs" — caller, fixture, helper; locations only
- "apps/ui/src/scene/handoffs.test.mjs" — test, fixture, helper; locations only
- "design/3d/plush.py" — helper; locations only
- "apps/ui/assets-src/panda/build_rig.py" — helper; locations only
- "docs/adr/0013-banquet-market-layout.md" — helper; locations only
- "apps/ui/src/assets/panda-contract.mjs" — helper; locations only
- "design/3d/cell_types.py" — helper; locations only
- "apps/ui/src/scene/Market.jsx" — helper; locations only
- "docs/design/2026-10-01-iso-den.md" — helper; locations only
- "apps/ui/assets-src/panda/build_mesh.py" — helper; locations only
- "apps/ui/assets-src/panda/rig_spec.py" — helper; locations only
- "apps/ui/src/scene/tally-pill.test.mjs" — test, fixture, helper; locations only
- "apps/ui/src/scene/iso-projection.test.mjs" — test, fixture, helper; locations only
- "apps/ui/src/scene/kiosk.test.mjs" — test, fixture; locations only
- "design/3d/renders/l3-anchors.json" — relevant; role uncertain; locations only
- "apps/ui/src/scene/iso-projection.mjs" — helper; locations only
- "apps/ui/assets-src/panda/build_face.py" — helper; locations only
- "docs/design/2026-09-29-scene-decisions.md" — helper; locations only
- "apps/ui/src/scene/handoff-motion.test.mjs" — test, fixture; locations only
- "apps/ui/assets-src/panda/build_clips.py" — helper; locations only
- "apps/ui/assets-src/panda/README.md" — helper; locations only
- "apps/ui/src/App.jsx" — helper; locations only
- "apps/ui/src/scene/roam.test.mjs" — test; source omitted
- "design/3d/renders/anchors.json" — relevant; role uncertain; locations only
- "docs/adr/0006-shared-panda-rig.md" — helper; locations only
- "apps/ui/assets-src/panda/export_glb.py" — helper; locations only
- "design/3d/renders/l2-anchors.json" — relevant; role uncertain; locations only
- "design/3d/levels_plush_render.py" — helper; locations only
- "design/3d/renders/anchors-plush.json" — relevant; role uncertain; locations only
- "design/3d/renders/l1-anchors.json" — relevant; role uncertain; locations only
- "apps/ui/src/scene/handoffs.mjs" — helper; locations only
- "apps/ui/src/scene/ChipLayer.jsx" — helper; locations only
- "apps/ui/src/assets/panda-contract.test.mjs" — test, fixture; locations only
- "apps/ui/src/scene/dressing.mjs" — relevant; role uncertain; locations only
End file list. Declaration locations follow source.

Source block "apps/ui/src/scene/banquet-layout.mjs" lines 1-9:
```
// ADR 0013: the banquet market anchor model. Pure; no three, React or DOM. Cell type and slot index
// in, world position (where the plush's feet stand) out. Units are scene units, +z toward the camera.

/** Bao, host of the table, sits at the back. His local box is about 2 x 2 x 1.75 centred on the origin. */
export const BAO = { position: [0, 1.4, -2.4], scale: 1.4 };
const BAO_BOX = { minY: -1, size: [2, 2, 1.75] };

/** The Pass rail on Bao's crown, with the service bell seated on it beside the orchestrator's perch. */
export const RAIL = { x: 0, y: 2.66, z: BAO.position[2], width: 1.3, height: 0.05 };
```

Source block "apps/ui/src/scene/banquet-layout.mjs" lines 43-59:
```
/**
 * The front stalls carry a low roof. The eave is raised to 1.77 (user, 2026-10-01, den-scene-v1/09 round 2) so the
 * noren bottom (eave - 0.22 = 1.55) clears the qa douli and security cap at head height; the roof does not hide the
 * back counters from the default camera because the horseshoe puts it to the side of them on screen.
 */
export const FRONT_ROOF = { eave: 1.77, rise: 0.4 };

/** Pass perches as fractions of Bao's box, plus which way extra cells of the same type step. */
const PASS = {
  orchestrator: { frac: [0, 0.96, 0], step: 1 },
  product: { frac: [-0.55, 0.72, 0.1], step: -1 },
  architect: { frac: [0.55, 0.72, 0.1], step: 1 },
};
const PASS_STEP = 0.4;

const STALLS = {
  steamers: { x: -3.0, z: -1.4, y: COUNTER_Y + BACK_PLATFORM, row: "back" },
```

Source block "apps/ui/src/scene/banquet-layout.mjs" lines 117-143:
```
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
  const station = stationOf(cellType);
  const offset = (slot - (n - 1) / 2) * STALL_SPACING;
  const yaw = STALL_CENTERS[station] ? stallYaw(station) : 0;
  return { x: stallCenterX(station, n) + offset * Math.cos(yaw), y: stall.y, z: stall.z - offset * Math.sin(yaw) };
}

export const MAX_BASKETS = 8;
const SUSAN_RADIUS = 0.85;
```

Source block "apps/ui/src/scene/Den.jsx" lines 292-383:
```
  }
}

function DenFigures({ cells, baskets, handoffs, selected, onSelect, stage }) {
  const gltf = useLoader(GLTFLoader, "/models/panda.glb");
  const director = useDirector();
  const { camera, size } = useThree();
  useEffect(() => {
    stage.camera = camera;
    stage.size = size;
  }, [stage, camera, size]);
  // Bao's rest-pose feet sit at his box minimum; a plush's origin is its centre, so lift by its half height.
  const footLift = useMemo(() => -new THREE.Box3().setFromObject(gltf.scene).min.y * PLUSH_SCALE, [gltf]);
  const counts = useMemo(() => {
    const n = {};
    for (const c of cells) n[stationOf(c.cellType)] = (n[stationOf(c.cellType)] ?? 0) + 1;
    for (const type of ROAMER_TYPES) {
      if (cells.some((c) => c.cellType === type)) continue;
      const station = stationOf(type);
      n[station] = (n[station] ?? 0) + 1;
    }
    return n;
  }, [cells]);
  // One panda per type remains at its station even without active work. Further cells stand at
  // their normal slots. Idle types take an unused slot, so Developer and Scout never stack up.
  const firstOf = {};
  for (const c of cells) if (ROAMER_TYPES.includes(c.cellType) && !firstOf[c.cellType]) firstOf[c.cellType] = c;
  const placed = (c) => {
    const { station, slot } = parsePerch(c.perch);
    const at = placeCell(c.cellType, slot, counts[station]);
    return { at, station };
  };
  const occupied = {};
  for (const c of cells) {
    const { station, slot } = parsePerch(c.perch);
    (occupied[station] ??= new Set()).add(slot);
  }
  const idlePlaces = {};
  for (const type of ROAMER_TYPES) {
    if (firstOf[type]) continue;
    const station = stationOf(type);
    const taken = occupied[station] ??= new Set();
    let slot = 0;
    while (taken.has(slot)) slot++;
    taken.add(slot);
    idlePlaces[type] = { station, at: placeCell(type, slot, counts[station]) };
  }
  return (
    <>
      <Market baskets={baskets} handoffs={handoffs} cells={cells} counts={counts} />
      <Figure id="bao" gltf={gltf} director={director} pose="idle" position={BAO.position} scale={BAO.scale} stage={null} />
      {ROAMER_TYPES.map((type) => (
        <RoamFigure
          key={type}
          type={type}
          cell={firstOf[type]}
          place={firstOf[type] ? placed(firstOf[type]) : idlePlaces[type]}
          handoffs={handoffs}
          gltf={gltf}
          director={director}
          footLift={footLift}
          selected={selected}
          onSelect={onSelect}
          stage={stage}
        />
      ))}
      {cells.filter((c) => firstOf[c.cellType] !== c).map((c) => {
        const { at } = placed(c);
        const p = [at.x, at.y + footLift, at.z];
        return (
          <Figure
            key={c.ref}
            id={c.ref}
            gltf={gltf}
            director={director}
            pose={c.pose}
            cellType={c.cellType}
            position={p}
            scale={PLUSH_SCALE}
            lod
            selected={selected === c.ref}
            onSelect={c.synthetic ? undefined : onSelect}
            stage={stage}
          />
        );
      })}
    </>
  );
}

// Idle and working pandas stay at their slots. A source panda leaves only for a handoff and returns.
function RoamFigure({ type, cell, place, handoffs, gltf, director, footLift, selected, onSelect, stage }) {
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 8-21:
```
import assert from "node:assert/strict";

const load = () => import("./banquet-layout.mjs");
const near = (actual, expected, msg) => {
  assert.equal(actual.length, expected.length, msg);
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `${msg ?? ""} [${i}] ${v} != ${expected[i]}`));
};
const at = async (cellType, slot, count) => {
  const p = (await load()).placeCell(cellType, slot, count);
  return [p.x, p.y, p.z];
};

test("stationOf maps every cell type to its station", async () => {
  const { stationOf } = await load();
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 33-43:
```
  assert.deepEqual(parsePerch("front-of-house#2"), { station: "front-of-house", slot: 2 });
});

test("Pass perches: orchestrator on the crown, product left shoulder, architect right shoulder", async () => {
  near(await at("orchestrator", 0), [0, 2.688, -2.4], "orchestrator");
  near(await at("product", 0), [-1.54, 2.016, -2.155], "product");
  near(await at("architect", 0), [1.54, 2.016, -2.155], "architect");
});

test("Pass perches: a second cell of the same type steps 0.4 outward", async () => {
  near(await at("orchestrator", 1), [0.4, 2.688, -2.4]);
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 45-56:
```
  near(await at("architect", 1), [1.94, 2.016, -2.155]);
});

test("stalls: Steamers back-left, Front of House back-right, Tea front-left, Pantry front-right", async () => {
  near(await at("developer", 1), [-3.0, 1.1, -1.4], "steamers centre slot");
  near(await at("designer", 1), [3.0, 1.1, -1.4], "front of house");
  near(await at("qa", 1), [-4.9, 0.6, 2.0], "tea");
  near(await at("security", 1), [4.9, 0.6, 2.0], "pantry");
});

test("developer and scout share the Steamers slots", async () => {
  for (const c of ["developer", "scout"]) near(await at(c, 0), [-3.650864384758237, 1.1, -1.0273398966171974], c);
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 81-92:
```
  near(await at("mystery", 0), [-0.75, 0, 4.6]);
});

test("landmarks: table at the centre, cub basket front centre", async () => {
  const { TABLE, CUB_BASKET, BAO } = await load();
  assert.deepEqual(TABLE, { x: 0, z: 0, radius: 1.3, height: 0.7 });
  assert.deepEqual(CUB_BASKET, { x: -1.8, z: 3.0 });
  assert.deepEqual(BAO, { position: [0, 1.4, -2.4], scale: 1.4 });
});

test("lazy susan: one basket per frontier ticket, first at the front of the table top", async () => {
  const { susanBaskets } = await load();
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 108-128:
```

// den-scene-v1/01 supersedes the old unrotated 1.0 shoulder-gap rule with the
// unchanged default-camera projection acceptance in horseshoe-layout.test.mjs.
test("cub row stands clear of the cub basket (radius 0.55) by a cell's half width", async () => {
  const { CUB_BASKET, CUB_BASKET_RADIUS } = await load();
  const cub = await at("mystery", 1);
  assert.equal(CUB_BASKET_RADIUS, 0.55);
  assert.ok(cub[2] - CUB_BASKET.z >= CUB_BASKET_RADIUS + 0.35);
});

test("overflow widens outward: every stall's inner edge stays fixed, on both sides", async () => {
  const { STALL_CENTERS, stallCenterX, stallWidth } = await load();
  for (const station of Object.keys(STALL_CENTERS)) {
    const sign = Math.sign(STALL_CENTERS[station].x);
    const inner = (count) => stallCenterX(station, count) - sign * stallWidth(count) / 2;
    for (const count of [3, 5, 8]) assert.ok(Math.abs(inner(count) - inner(3)) < 1e-9, `${station} ${count}`);
  }
});

test("overflow, worked: Steamers with five cells grows left with rotated slots", async () => {
  near([(await at("developer", 0, 5))[0]], [-5.051728769516475]);
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 131-158:
```

// showcase-v1/04 (user browser check): the front stalls must not hide the back row from the default
// camera at (0, 4.2, 11.5). The sight line to each back cell's feet has to clear the front roof.
test("front-row roofs stay below the sight line from the default camera to every back-row cell", async () => {
  const { STALL_CENTERS, stallCenterX, stallWidth, counterTop, stallRoof } = await load();
  const cam = { x: 0, y: 4.2, z: 11.5 };
  const roof = stallRoof("tea");
  const apex = roof.eave + roof.rise;
  for (const [back, front] of [["steamers", "tea"], ["front-of-house", "pantry"]]) {
    const fz = STALL_CENTERS[front].z;
    const fx = stallCenterX(front, 3);
    const half = stallWidth(3) / 2;
    for (const slot of [0, 1, 2]) {
      const tx = (await at(back === "steamers" ? "developer" : "designer", slot))[0];
      const ty = counterTop(back) + 0.15;
      const tz = STALL_CENTERS[back].z;
      for (let z = fz - 0.5; z <= fz + 0.5; z += 0.05) {
        const f = (cam.z - z) / (cam.z - tz);
        const x = cam.x + f * (tx - cam.x);
        const y = cam.y + f * (ty - cam.y);
        if (Math.abs(x - fx) <= half) assert.ok(y >= apex + 0.1, `${back} slot ${slot}: sight line y ${y.toFixed(2)} at z ${z.toFixed(2)} is under the ${front} roof apex ${apex}`);
      }
    }
  }
});

test("the front stalls stand farther outward than the back kiosks, forming the horseshoe", async () => {
  const { STALL_CENTERS } = await load();
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 170-179:
```
// ---- den-iso-v1/04: scene dressing. Numbers are those of docs/design/2026-10-01-iso-den.md section 2 (literals,
// not recomputed from the module). Interface fixed here (the ticket leaves names open):
//   STONE_RING = { center: {x, z}, semiX, semiZ, count, stone: {diameter, thickness} }
//   stepStones() -> [{ index, x, z }]  the ring's stones that survive the footprint rule, index 0..47 in angle order
//   DORMANT_PADS = [{ id, name, x, z, radius, dashed, dormant, label, ariaLabel }]  (Library, then Drum)
//   BAMBOO_CLUSTERS = [{ id, x, z, stalks, height }]  and  bambooStalks() -> [{ cluster, x, z, height, width }]
const ELLIPSE = (x, z, c, a, b) => ((x - c.x) / a) ** 2 + ((z - c.z) / b) ** 2;

test("Steamers and Front of House stand at x +-3.0 (den-iso-v1 digest, a 0.3 move); every other anchor keeps its place", async () => {
  const { STALL_CENTERS, stallYaw, TALLY, CUB_BASKET } = await load();
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 214-263:
```

// Footprints on the ground, built here from the layout's props (not from the module under test): the four kiosks'
// platforms (counter width + 0.15 each side, 0.65 deep, turned by stallYaw), the table, the hamper and the Tally.
const footprintTests = async (margin = 0) => {
  const L = await load();
  const rects = Object.keys(L.STALL_CENTERS).map((station) => ({
    cx: L.stallCenterX(station, 3), cz: L.STALL_CENTERS[station].z, yaw: L.stallYaw(station),
    hx: (L.stallWidth(3) + 0.3) / 2 + margin, hz: 0.65 + margin,
  }));
  rects.push({ cx: L.TALLY.x, cz: L.TALLY.z, yaw: 0, hx: L.TALLY.frame.width / 2 + margin, hz: L.TALLY.frame.depth / 2 + margin });
  const circles = [
    { cx: L.TABLE.x, cz: L.TABLE.z, r: L.TABLE.radius + margin },
    { cx: L.CUB_BASKET.x, cz: L.CUB_BASKET.z, r: L.CUB_BASKET_RADIUS + margin },
  ];
  return ({ x, z }) => circles.some((c) => Math.hypot(x - c.cx, z - c.cz) < c.r)
    || rects.some((r) => {
      const dx = x - r.cx, dz = z - r.cz; // into the kiosk's local frame (local x = (cos yaw, -sin yaw), local z = (sin yaw, cos yaw))
      const lx = dx * Math.cos(r.yaw) - dz * Math.sin(r.yaw), lz = dx * Math.sin(r.yaw) + dz * Math.cos(r.yaw);
      return Math.abs(lx) < r.hx && Math.abs(lz) < r.hz;
    });
};

test("the ring keeps at least 36 of its 48 stones and no stone's centre is inside a kiosk, table, hamper or Tally footprint", async () => {
  const { stepStones } = await load();
  const inside = await footprintTests(0);
  const stones = stepStones();
  assert.ok(stones.length >= 36, `${stones.length} stones`);
  assert.ok(stones.length < 48, "the ring crosses at least one footprint, so some stones are omitted");
  for (const s of stones) assert.ok(!inside(s), `stone ${s.index} at ${s.x.toFixed(2)}, ${s.z.toFixed(2)} stands inside a footprint`);
});

test("a stone is omitted only when it is near a footprint: any step more than a stone's width clear of every footprint is placed", async () => {
  const { stepStones } = await load();
  const nearFootprint = await footprintTests(0.34);
  const placed = new Set(stepStones().map((s) => s.index));
  for (let i = 0; i < 48; i++) {
    const t = (2 * Math.PI * i) / 48;
    const p = { x: 7.3 * Math.cos(t), z: -2.4 + 6.3 * Math.sin(t) };
    if (!nearFootprint(p)) assert.ok(placed.has(i), `step ${i} at ${p.x.toFixed(2)}, ${p.z.toFixed(2)} is clear of every footprint but was dropped`);
  }
});

test("the ring is left-right symmetric where the layout is: the back, front, left and right extremes are all present", async () => {
  const { stepStones } = await load();
  const placed = new Set(stepStones().map((s) => s.index));
  for (const i of [0, 12, 24, 36]) assert.ok(placed.has(i), `compass stone ${i}`); // right, front, left (z = -2.4), back
});

test("Library and Drum are dashed dormant pads at (-2.9, -7.2) and (2.9, -7.2): flat discs of radius 0.65", async () => {
  const { DORMANT_PADS } = await load();
```

Source block "apps/ui/src/scene/banquet-layout.test.mjs" lines 331-343:
```
  }
});

test("pandas still never stand on open grass: no cell perch lands on a dormant pad or in a bamboo cluster", async () => {
  const { placeCell, DORMANT_PADS, bambooStalks } = await load();
  const cellTypes = ["orchestrator", "product", "architect", "developer", "scout", "qa", "security", "designer", "mystery"];
  for (const type of cellTypes) for (let slot = 0; slot < 13; slot++) {
    const p = await placeCell(type, slot, 13);
    for (const pad of DORMANT_PADS) assert.ok(Math.hypot(p.x - pad.x, p.z - pad.z) > pad.radius, `${type}#${slot} on the ${pad.id} pad`);
    for (const s of bambooStalks()) assert.ok(Math.hypot(p.x - s.x, p.z - s.z) > s.width, `${type}#${slot} in bamboo`);
  }
});

```

Source block "apps/ui/src/scene/default-framing.test.mjs" lines 10-58:
```
import { stationLabels } from "./station-labels.mjs";
import { EAVE_Y, POST_BASE, POST_SIZE, postHeight, postPositions, roofTriangles } from "./stall-roof.mjs";

const SIZES = [{ width: 1440, height: 900 }, { width: 375, height: 667 }];
const N = 3; // default three-slot kiosks: the layout constants, no extra cells

const box = (x, y, z, hx, hy, hz) => [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => [x + sx * hx, y + sy * hy, z + sz * hz])));
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
const baoBox = () => { const [x, y, z] = BAO.position, s = BAO.scale; return box(x, y, z, s, s, s * 0.875); };
const tableRing = () => Array.from({ length: 128 }, (_, i) => [TABLE.x + TABLE.radius * Math.cos(i * Math.PI / 64), TABLE.height, TABLE.z + TABLE.radius * Math.sin(i * Math.PI / 64)]);
const hamper = () => box(CUB_BASKET.x, 0.2, CUB_BASKET.z, CUB_BASKET_RADIUS, 0.2, CUB_BASKET_RADIUS);
const tally = () => box(TALLY.x, TALLY.groundY + TALLY.leg.height + TALLY.frame.height / 2, TALLY.z, TALLY.frame.width / 2, TALLY.frame.height / 2 + TALLY.leg.height / 2, TALLY.frame.depth / 2);
const rect = (points, frame) => {
  const ps = points.map((p) => worldToScreen(p, frame));
  return { x0: Math.min(...ps.map((p) => p.x)), x1: Math.max(...ps.map((p) => p.x)), y0: Math.min(...ps.map((p) => p.y)), y1: Math.max(...ps.map((p) => p.y)) };
};
const inside = (r, { width, height }) => r.x0 >= 0 && r.x1 <= width && r.y0 >= 0 && r.y1 <= height;

test("the default frame contains every kiosk, Bao, the susan, the hamper and the Tally at 1440x900 and 375x667", () => {
  for (const size of SIZES) {
    const frame = defaultFrame(size);
    const things = {
      Bao: baoBox(), susan: tableRing(), hamper: hamper(), Tally: tally(),
      ...Object.fromEntries(Object.keys(STALL_CENTERS).map((s) => [s, completeKiosk(s, N)])),
    };
    for (const [name, pts] of Object.entries(things)) {
      const r = rect(pts, frame);
      assert.ok(inside(r, size), `${name} at ${size.width}x${size.height}: ${JSON.stringify(r)}`);
    }
  }
});

test("every station sign anchor is inside the default frame at both sizes", () => {
  for (const size of SIZES) {
```

Source block "apps/ui/src/scene/default-framing.test.mjs" lines 68-104:
```
  assert.equal(TALLY.rotationY, 0);
});

const overlaps = (a, b) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) + 1e-9 && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0) + 1e-9;
const within = (p, r) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1;

test("den-map check 1: at the default frame every counter is clear of other counters, Bao and the table", () => {
  for (const size of SIZES) {
    const frame = defaultFrame(size);
    const bao = rect(baoBox(), frame), table = rect(tableRing(), frame);
    const counters = Object.keys(STALL_CENTERS).map((station) => ({
      station,
      rect: rect([-1, 1].flatMap((x) => [-1, 1].map((z) => world(station, N, [x * stallWidth(N) / 2, 0.5, z * 0.5]))), frame),
    }));
    for (let i = 0; i < counters.length; i++) {
```

Output truncated at the byte limit (24576 bytes); 17140 original bytes omitted.

End context.
