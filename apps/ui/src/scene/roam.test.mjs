// Ticket showcase-v1/06: idle pandas roam the grass around the market. The module is pure: seed, time
// and obstacles in, position out. Expected values are literals or independent geometry checks.
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./roam.mjs");
const BASE = {};
const widest = { steamers: 12, "front-of-house": 12, tea: 5, pantry: 5, cubs: 8 };

const insideShape = (o, x, z) =>
  o.kind === "circle"
    ? Math.hypot(x - o.x, z - o.z) < o.r - 1e-6
    : x > o.x0 + 1e-6 && x < o.x1 - 1e-6 && z > o.z0 + 1e-6 && z < o.z1 - 1e-6;

test("roamAt stays inside the grass bounds and outside every obstacle, for every type, over 10 minutes", async () => {
  const { ROAMER_TYPES, ROAM_BOUNDS, roamObstacles, roamAt } = await load();
  for (const counts of [BASE, widest]) {
    const obstacles = roamObstacles(counts);
    for (const type of ROAMER_TYPES) {
      for (let t = 0; t < 600; t += 0.5) {
        const p = roamAt(type, t, obstacles);
        assert.ok(p.x >= ROAM_BOUNDS.x0 && p.x <= ROAM_BOUNDS.x1 && p.z >= ROAM_BOUNDS.z0 && p.z <= ROAM_BOUNDS.z1, `${type} t=${t} out of bounds ${p.x},${p.z}`);
        for (const o of obstacles) assert.ok(!insideShape(o, p.x, p.z), `${type} t=${t} inside ${JSON.stringify(o)} at ${p.x},${p.z}`);
      }
    }
  }
});

test("obstacles cover the table, stalls, cub basket and Bao footprints", async () => {
  const { roamObstacles } = await load();
  const obstacles = roamObstacles(BASE);
  const covered = (x, z) => obstacles.some((o) => insideShape(o, x, z));
  assert.ok(covered(0, 0), "table centre");
  assert.ok(covered(1.5, 0), "table edge (radius 1.3 top 1.8)");
  assert.ok(covered(0, -2.4), "Bao");
  assert.ok(covered(1.3, -2.4), "Bao's flank");
  assert.ok(covered(-4.8, -1.6), "Steamers");
  assert.ok(covered(4.8, -1.6), "Front of House");
  assert.ok(covered(-4.0, 2.2), "Tea");
  assert.ok(covered(4.0, 2.2), "Pantry");
  assert.ok(covered(0, 3.4), "cub basket");
  assert.ok(!covered(-7.0, 4.6), "open grass");
});

test("a widened stall grows its obstacle outward", async () => {
  const { roamObstacles } = await load();
  const covered = (counts, x, z) => roamObstacles(counts).some((o) => insideShape(o, x, z));
  assert.equal(covered(BASE, -6.6, -1.6), false);
  assert.equal(covered({ steamers: 6 }, -6.6, -1.6), true);
});

test("roamAt is deterministic per seed and differs between seeds", async () => {
  const { roamAt, roamObstacles } = await load();
  const obstacles = roamObstacles(BASE);
  assert.deepEqual(roamAt("scout", 123.4, obstacles), roamAt("scout", 123.4, obstacles));
  const a = [0, 20, 40, 60].map((t) => roamAt("scout", t, obstacles).x);
  const b = [0, 20, 40, 60].map((t) => roamAt("qa", t, obstacles).x);
  assert.notDeepEqual(a, b);
});

test("idle motion never exceeds the gentle-walk speed cap and never jumps", async () => {
  const { ROAMER_TYPES, ROAM_SPEED, roamObstacles, roamAt } = await load();
  assert.ok(ROAM_SPEED <= 0.6, "gentle walk: at most 0.6 scene units per second");
  for (const counts of [BASE, widest]) {
    const obstacles = roamObstacles(counts);
    for (const type of ROAMER_TYPES) {
      let prev = roamAt(type, 0, obstacles);
      for (let t = 0.1; t < 900; t += 0.1) {
        const p = roamAt(type, t, obstacles);
        const step = Math.hypot(p.x - prev.x, p.z - prev.z);
        assert.ok(step <= ROAM_SPEED * 0.1 + 1e-6, `${type} t=${t} moved ${step}`);
        prev = p;
      }
    }
  }
});

test("idle pandas pause often: each spends at least a third of its time standing", async () => {
  const { ROAMER_TYPES, roamObstacles, roamAt } = await load();
  const obstacles = roamObstacles(BASE);
  for (const type of ROAMER_TYPES) {
    let still = 0, n = 0;
    for (let t = 0; t < 600; t += 0.5) {
      n++;
      if (!roamAt(type, t, obstacles).moving) still++;
    }
    assert.ok(still / n >= 1 / 3, `${type} stood ${still}/${n}`);
  }
});

test("idle pandas actually wander: each covers at least 1 unit of ground in 5 minutes", async () => {
  const { ROAMER_TYPES, roamObstacles, roamAt } = await load();
  const obstacles = roamObstacles(BASE);
  for (const type of ROAMER_TYPES) {
    let dist = 0;
    let prev = roamAt(type, 0, obstacles);
    for (let t = 1; t <= 300; t++) {
      const p = roamAt(type, t, obstacles);
      dist += Math.hypot(p.x - prev.x, p.z - prev.z);
      prev = p;
    }
    assert.ok(dist >= 1, `${type} walked ${dist}`);
  }
});

test("the eight roamer types start spread out (at least 3 apart) and never include the orchestrator", async () => {
  const { ROAMER_TYPES, roamHome } = await load();
  assert.deepEqual([...ROAMER_TYPES].sort(), ["architect", "debugger", "designer", "developer", "product", "qa", "scout", "security"]);
  for (const a of ROAMER_TYPES) for (const b of ROAMER_TYPES) {
    if (a >= b) continue;
    const pa = roamHome(a), pb = roamHome(b);
    assert.ok(Math.hypot(pa.x - pb.x, pa.z - pb.z) >= 3, `${a} and ${b}`);
  }
});

test("planRoute goes straight when clear and around an obstacle when blocked", async () => {
  const { planRoute } = await load();
  const clear = planRoute({ x: -7, z: 4.6 }, { x: -6, z: 5 }, []);
  assert.equal(clear.length, 2);
  const wall = [{ kind: "rect", x0: -1, x1: 1, z0: -1, z1: 1 }];
  const r = planRoute({ x: -3, z: 0 }, { x: 3, z: 0 }, wall);
  assert.ok(r.length >= 3, "detours");
  for (let i = 1; i < r.length; i++) {
    for (let s = 0; s <= 1; s += 0.05) {
      const x = r[i - 1].x + (r[i].x - r[i - 1].x) * s, z = r[i - 1].z + (r[i].z - r[i - 1].z) * s;
      assert.ok(!insideShape(wall[0], x, z), `leg ${i} crosses at ${x},${z}`);
    }
  }
});

test("approach spots are free grass for every station, stall widths up to five cells, and slot", async () => {
  const { approachFor, roamObstacles } = await load();
  const { placeCell } = await import("./banquet-layout.mjs");
  const obstacles = roamObstacles(BASE);
  const types = ["product", "architect", "developer", "qa", "security", "designer"];
  for (const type of types) {
    const { stationOf } = await import("./banquet-layout.mjs");
    for (const slot of [0, 1, 2]) {
      const at = placeCell(type, slot);
      const a = approachFor(stationOf(type), at);
      assert.ok(!obstacles.some((o) => insideShape(o, a.x, a.z)), `${type}#${slot} approach ${a.x},${a.z}`);
    }
  }
});

// The called-to-work lifecycle: idle -> walking to slot -> working -> walking out -> idle.
const SLOT = { x: -4.8, y: 1.1, z: -1.6 };
test("lifecycle: idle, called, walks to the slot, works, released, walks out, idles again", async () => {
  const { stepRoamer, roamObstacles } = await load();
  const obstacles = roamObstacles(BASE);
  let s = stepRoamer(undefined, { seed: "developer", slot: SLOT, working: false, now: 0, dt: 0, obstacles, reduced: false });
  assert.equal(s.phase, "idle");
  const phases = ["idle"];
  let now = 0;
  const dt = 1 / 30;
  const stepTo = (working, until) => {
    while (now < until) {
      now += dt;
      s = stepRoamer(s, { seed: "developer", slot: SLOT, working, now, dt, obstacles, reduced: false });
      if (phases.at(-1) !== s.phase) phases.push(s.phase);
    }
  };
  stepTo(false, 5);
  stepTo(true, 5 + 60);
  assert.equal(s.phase, "working");
  assert.deepEqual([s.x, s.y, s.z], [SLOT.x, SLOT.y, SLOT.z]);
  stepTo(false, 5 + 60 + 60);
  assert.equal(s.phase, "idle");
  assert.deepEqual(phases, ["idle", "to-slot", "working", "out", "idle"]);
});

test("walking to the slot is capped at the walk speed and never enters an obstacle", async () => {
  const { stepRoamer, roamObstacles, WALK_SPEED } = await load();
  const obstacles = roamObstacles(BASE);
  const dt = 1 / 30;
  let s = stepRoamer(undefined, { seed: "developer", slot: SLOT, working: false, now: 0, dt: 0, obstacles, reduced: false });
  let now = 0;
  let prev = s;
  for (let i = 0; i < 30 * 60; i++) {
    now += dt;
    s = stepRoamer(s, { seed: "developer", slot: SLOT, working: i > 10, now, dt, obstacles, reduced: false });
    if (s.phase === "to-slot") {
      assert.ok(Math.hypot(s.x - prev.x, s.z - prev.z) <= WALK_SPEED * dt + 1e-6, "walk speed");
      // Only the last hop up onto the counter (y above ground) may be inside the stall footprint.
      if (s.y === 0) for (const o of obstacles) assert.ok(!insideShape(o, s.x, s.z), `walked into ${JSON.stringify(o)} at ${s.x},${s.z}`);
    }
    prev = s;
  }
  assert.equal(s.phase, "working");
});

test("released mid-walk turns around and heads out instead of arriving", async () => {
  const { stepRoamer, roamObstacles } = await load();
  const obstacles = roamObstacles(BASE);
  const dt = 1 / 30;
  let s = stepRoamer(undefined, { seed: "developer", slot: SLOT, working: false, now: 0, dt: 0, obstacles, reduced: false });
  let now = 0;
  for (let i = 0; i < 60; i++) { now += dt; s = stepRoamer(s, { seed: "developer", slot: SLOT, working: true, now, dt, obstacles, reduced: false }); }
  assert.equal(s.phase, "to-slot");
  for (let i = 0; i < 30 * 90; i++) { now += dt; s = stepRoamer(s, { seed: "developer", slot: SLOT, working: false, now, dt, obstacles, reduced: false }); }
  assert.equal(s.phase, "idle");
});

test("reduced motion: idle pandas stand still at their spread-out home spot", async () => {
  const { stepRoamer, roamObstacles, roamHome } = await load();
  const obstacles = roamObstacles(BASE);
  const home = roamHome("qa");
  let s;
  for (const now of [0, 10, 100, 1000]) {
    s = stepRoamer(s, { seed: "qa", slot: SLOT, working: false, now, dt: 1 / 30, obstacles, reduced: true });
    assert.deepEqual([s.x, s.z, s.moving, s.opacity], [home.x, home.z, false, 1]);
  }
});

test("reduced motion: when called the panda fades out, reappears at the slot, and fades in (no walking)", async () => {
  const { stepRoamer, roamObstacles, roamHome, FADE_S } = await load();
  const obstacles = roamObstacles(BASE);
  const home = roamHome("qa");
  const input = (now, working) => ({ seed: "qa", slot: SLOT, working, now, dt: 1 / 30, obstacles, reduced: true });
  let s = stepRoamer(undefined, input(0, false));
  const samples = [];
  for (let now = 1; now < 1 + FADE_S + 0.2; now += 1 / 30) {
    s = stepRoamer(s, input(now, true));
    samples.push(s);
  }
  assert.ok(samples.some((p) => p.opacity < 0.2), "fades to nearly clear");
  assert.ok(samples.some((p) => p.x === home.x && p.z === home.z && p.opacity < 1), "fading out while still on the grass");
  assert.ok(samples.every((p) => p.moving === false), "never walks");
  assert.equal(s.phase, "working");
  assert.deepEqual([s.x, s.y, s.z, s.opacity], [SLOT.x, SLOT.y, SLOT.z, 1]);
  // and released: fades back out to the grass.
  for (let now = 3; now < 3 + FADE_S + 0.2; now += 1 / 30) s = stepRoamer(s, input(now, false));
  assert.equal(s.phase, "idle");
  assert.deepEqual([s.x, s.z, s.opacity], [home.x, home.z, 1]);
});
