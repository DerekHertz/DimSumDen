// Showcase v1/06: idle pandas roam the grass around the market. Pure; no three, React or DOM.
//
// Two layers. `roamAt(seed, t, obstacles)` is the idle wander: a fixed-length segment schedule where
// each segment walks from one random spot near the panda's home to the next (routed around obstacles)
// and then stands still for the rest of the segment. `stepRoamer` is the lifecycle a panda runs when its
// cell type gets work: idle -> to-slot -> working -> out -> idle, with a reduced-motion variant that
// stands still and fades between the grass and the stall instead of walking.
import {
  BAO, CUB_BASKET, CUB_BASKET_RADIUS, STALL_CENTERS, TABLE, stallCenterX, stallWidth,
} from "./banquet-layout.mjs";

/** Cell types that roam (the orchestrator stays on Bao's crown). */
export const ROAMER_TYPES = ["product", "architect", "developer", "scout", "debugger", "qa", "security", "designer"];

/** The grass the pandas may stand on. */
export const ROAM_BOUNDS = { x0: -8, x1: 8, z0: -3, z1: 6.5 };
/** Gentle walk while idle, and the brisker walk to or from a station, in scene units per second. */
export const ROAM_SPEED = 0.5;
export const WALK_SPEED = 0.9;
export const FADE_S = 0.4;

const PAD = 0.4; // a panda's half width plus a little air, added around every footprint
const SEGMENT_S = 30;
const WANDER_RADIUS = 1.6;
const TABLE_TOP_RADIUS = 1.8;
const BAO_HALF = [1.4, 1.23]; // x, z: Bao's box (2 x 1.75) at scale 1.4
const STALL_HALF_DEPTH = 0.5;
const PLATFORM_PAD = 0.15;
const CUB_ROW_Z = 4.6;
const CUB_HALF_DEPTH = 0.35;

// Spread-out grass spots, one per type, at least 3 apart, clear of every footprint.
const HOMES = {
  product: { x: -7.2, z: 0.6 },
  architect: { x: 7.2, z: 0.6 },
  developer: { x: -7.2, z: 3.6 },
  scout: { x: 7.2, z: 3.6 },
  debugger: { x: -2.6, z: 4.0 },
  qa: { x: 2.6, z: 4.0 },
  security: { x: -5.0, z: 6.0 },
  designer: { x: 5.0, z: 6.0 },
};

const rectAround = (cx, cz, hx, hz) => ({ kind: "rect", x0: cx - hx - PAD, x1: cx + hx + PAD, z0: cz - hz - PAD, z1: cz + hz + PAD });

/** Footprints (padded by a panda's half width) of Bao, table, stalls, cub basket and cub row. */
export function roamObstacles(counts = {}) {
  const out = [
    { kind: "circle", x: TABLE.x, z: TABLE.z, r: TABLE_TOP_RADIUS + PAD },
    rectAround(BAO.position[0], BAO.position[2], BAO_HALF[0], BAO_HALF[1]),
    { kind: "circle", x: CUB_BASKET.x, z: CUB_BASKET.z, r: CUB_BASKET_RADIUS + PAD },
    rectAround(0, CUB_ROW_Z, stallWidth(counts.cubs ?? 0) / 2, CUB_HALF_DEPTH),
  ];
  for (const [station, c] of Object.entries(STALL_CENTERS)) {
    const n = counts[station] ?? 0;
    const platform = c.z < 0 ? PLATFORM_PAD : 0;
    out.push(rectAround(stallCenterX(station, n), c.z, stallWidth(n) / 2 + platform, STALL_HALF_DEPTH + platform));
  }
  return out;
}

const EPS = 1e-6;
const inShape = (o, x, z) =>
  o.kind === "circle"
    ? Math.hypot(x - o.x, z - o.z) < o.r - EPS
    : x > o.x0 + EPS && x < o.x1 - EPS && z > o.z0 + EPS && z < o.z1 - EPS;
const inBounds = (x, z) => x >= ROAM_BOUNDS.x0 && x <= ROAM_BOUNDS.x1 && z >= ROAM_BOUNDS.z0 && z <= ROAM_BOUNDS.z1;
const isFree = (obstacles, x, z) => inBounds(x, z) && !obstacles.some((o) => inShape(o, x, z));

function segmentHits(o, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  if (o.kind === "circle") {
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / len2));
    return Math.hypot(a.x + dx * t - o.x, a.z + dz * t - o.z) < o.r - EPS;
  }
  // Liang-Barsky against the open rectangle.
  let t0 = 0, t1 = 1;
  const clip = (p, q) => {
    if (p === 0) return q > 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  const ok = clip(-dx, a.x - (o.x0 + EPS)) && clip(dx, o.x1 - EPS - a.x) && clip(-dz, a.z - (o.z0 + EPS)) && clip(dz, o.z1 - EPS - a.z);
  return ok && t1 - t0 > 1e-9;
}

const blocked = (obstacles, a, b) => obstacles.some((o) => segmentHits(o, a, b));

/**
 * Shortest walkable route from `from` to `to` around the obstacles: straight when clear, otherwise
 * along the obstacles' corners (a visibility graph). Returns the points, first and last included.
 * Falls back to the straight line when an endpoint is inside an obstacle or no route exists.
 */
export function planRoute(from, to, obstacles) {
  if (!blocked(obstacles, from, to)) return [from, to];
  const nodes = [from, to];
  for (const o of obstacles) {
    if (o.kind === "rect") {
      const g = 0.02;
      nodes.push({ x: o.x0 - g, z: o.z0 - g }, { x: o.x1 + g, z: o.z0 - g }, { x: o.x1 + g, z: o.z1 + g }, { x: o.x0 - g, z: o.z1 + g });
    } else {
      const R = (o.r + 0.02) / Math.cos(Math.PI / 12);
      for (let i = 0; i < 12; i++) nodes.push({ x: o.x + R * Math.cos((i * Math.PI) / 6), z: o.z + R * Math.sin((i * Math.PI) / 6) });
    }
  }
  const usable = nodes.filter((n, i) => i < 2 || isFree(obstacles, n.x, n.z));
  const dist = new Array(usable.length).fill(Infinity);
  const prev = new Array(usable.length).fill(-1);
  const done = new Array(usable.length).fill(false);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < usable.length; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) return [from, to];
    if (u === 1) break;
    done[u] = true;
    for (let v = 0; v < usable.length; v++) {
      if (done[v]) continue;
      const d = dist[u] + Math.hypot(usable[u].x - usable[v].x, usable[u].z - usable[v].z);
      if (d < dist[v] && !blocked(obstacles, usable[u], usable[v])) { dist[v] = d; prev[v] = u; }
    }
  }
  const route = [];
  for (let i = 1; i >= 0; i = prev[i]) route.unshift(usable[i]);
  return route;
}

const routeLength = (route) => route.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - route[i].x, p.z - route[i].z), 0);

/** Position `d` units along a route (y interpolated when the points carry one), plus heading and whether it ended. */
function pointAlong(route, d) {
  let left = d;
  let heading = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len > 0) heading = Math.atan2(b.x - a.x, b.z - a.z);
    if (left <= len && len > 0) {
      const s = left / len;
      return { x: a.x + (b.x - a.x) * s, y: (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * s, z: a.z + (b.z - a.z) * s, heading, done: false };
    }
    left -= len;
  }
  const end = route.at(-1);
  return { x: end.x, y: end.y ?? 0, z: end.z, heading, done: true };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The spread-out home spot of a type, moved to the nearest free grass if a widened stall covers it. */
export function roamHome(seed, obstacles = []) {
  const h = HOMES[seed] ?? { x: 0, z: 6 };
  if (isFree(obstacles, h.x, h.z)) return { x: h.x, z: h.z };
  for (let r = 0.5; r <= 8; r += 0.5) {
    for (let i = 0; i < 16; i++) {
      const x = h.x + r * Math.cos((i * Math.PI) / 8), z = h.z + r * Math.sin((i * Math.PI) / 8);
      if (isFree(obstacles, x, z)) return { x, z };
    }
  }
  return { x: h.x, z: h.z };
}

const cache = new WeakMap();

// Waypoint k depends only on (seed, k, obstacles): a free spot within WANDER_RADIUS of home. Segment k
// walks waypoint k-1 (home for k=0) -> waypoint k, then stands still for the rest of SEGMENT_S.
function segmentOf(seed, k, obstacles) {
  let byKey = cache.get(obstacles);
  if (!byKey) cache.set(obstacles, (byKey = new Map()));
  const key = `${seed}:${k}`;
  let seg = byKey.get(key);
  if (seg) return seg;
  const home = roamHome(seed, obstacles);
  const spot = (i) => {
    if (i < 0) return home;
    const rand = rng(hash(`${seed}#${i}`));
    for (let tries = 0; tries < 16; tries++) {
      const a = rand() * Math.PI * 2, r = WANDER_RADIUS * Math.sqrt(rand());
      const x = home.x + r * Math.cos(a), z = home.z + r * Math.sin(a);
      if (isFree(obstacles, x, z)) return { x, z };
    }
    return home;
  };
  const route = planRoute(spot(k - 1), spot(k), obstacles);
  seg = { route, length: routeLength(route) };
  byKey.set(key, seg);
  return seg;
}

/** @returns {{x: number, z: number, heading: number, moving: boolean}} */
export function roamAt(seed, t, obstacles) {
  const shifted = t + (hash(seed) % SEGMENT_S);
  const k = Math.floor(shifted / SEGMENT_S);
  const u = shifted - k * SEGMENT_S;
  const seg = segmentOf(seed, k, obstacles);
  const walked = Math.min(seg.length, ROAM_SPEED * u);
  const p = pointAlong(seg.route, walked);
  return { x: p.x, z: p.z, heading: p.heading, moving: walked < seg.length };
}

/** Where a panda steps onto its stall from: on the grass in front of the slot. */
export const defaultApproach = (slot) => ({ x: slot.x, z: slot.z + 1.2 });

/**
 * The grass spot a panda climbs from onto `slot` (a placeCell position) of `station`: in front of a
 * stall, or beside Bao for the shoulder perches (the table crowds the ground in front of him).
 */
export function approachFor(station, slot) {
  const c = STALL_CENTERS[station];
  if (c) return { x: slot.x, z: c.z + STALL_HALF_DEPTH + (c.z < 0 ? PLATFORM_PAD : 0) + PAD + 0.1 };
  return { x: Math.sign(slot.x || 1) * (BAO_HALF[0] + PAD + 0.15), z: BAO.position[2] };
}

const at = (x, y, z) => ({ x, y, z });

function walkState(prev, phase, route) {
  return { ...prev, phase, route, walked: 0, moving: true, opacity: 1, fade: null };
}

/**
 * One step of a panda's lifecycle.
 * @param {object|undefined} prev the previous state (undefined on first call)
 * @param {{seed: string, slot: {x:number,y:number,z:number}|null, approach?: {x:number,z:number}, working: boolean,
 *          now: number, dt: number, obstacles: object[], reduced: boolean}} input `working` is whether the type has work;
 *          `slot` is where its (first) cell stands
 * @returns {{phase: "idle"|"to-slot"|"working"|"out", x:number, y:number, z:number, heading:number, moving:boolean, opacity:number}}
 */
export function stepRoamer(prev, { seed, slot, approach, working, now, dt, obstacles, reduced }) {
  const wantsSlot = Boolean(working && slot);
  const grass = (t) => (reduced ? { ...roamHome(seed, obstacles), heading: 0, moving: false } : roamAt(seed, t, obstacles));

  if (!prev) {
    if (wantsSlot) return { phase: "working", x: slot.x, y: slot.y, z: slot.z, heading: 0, moving: false, opacity: 1 };
    const g = grass(now);
    return { phase: "idle", x: g.x, y: 0, z: g.z, heading: g.heading, moving: g.moving, opacity: 1 };
  }

  if (reduced) {
    // No walking: stand at the home spot or the slot, and fade through when the call changes.
    let s = prev;
    if (s.phase === "to-slot" || s.phase === "out") s = { ...s, phase: wantsSlot ? "working" : "idle", fade: null };
    let fade = s.fade ?? null;
    if (!fade && (s.phase === "working") !== wantsSlot) fade = { t0: now, to: wantsSlot ? "working" : "idle" };
    let phase = s.phase;
    let opacity = 1;
    let showing = phase;
    if (fade) {
      const e = (now - fade.t0) / FADE_S;
      if (e >= 1) { phase = fade.to; showing = phase; fade = null; }
      else if (e < 0.5) { opacity = 1 - 2 * e; }
      else { showing = fade.to; opacity = 2 * e - 1; }
    }
    if (showing === "working" && slot) return { phase, x: slot.x, y: slot.y, z: slot.z, heading: 0, moving: false, opacity, fade };
    const g = grass(now);
    return { phase, x: g.x, y: 0, z: g.z, heading: 0, moving: false, opacity, fade };
  }

  const clear = { ...prev, fade: null, opacity: 1 };
  const here = at(clear.x, clear.y, clear.z);
  const goSlot = () => {
    const ap = approach ?? defaultApproach(slot);
    const route = [here, ...planRoute(at(here.x, 0, here.z), at(ap.x, 0, ap.z), obstacles).slice(1).map((p) => at(p.x, 0, p.z)), at(slot.x, slot.y, slot.z)];
    return walkState(clear, "to-slot", route);
  };
  const goOut = () => {
    const ap = approach ?? (slot ? defaultApproach(slot) : null);
    if (clear.y > 0 && ap) return walkState(clear, "out", [here, at(ap.x, 0, ap.z)]);
    return walkState(clear, "out", null);
  };

  let s = clear;
  if (s.phase === "idle") {
    if (wantsSlot) s = goSlot();
    else { const g = roamAt(seed, now, obstacles); return { phase: "idle", x: g.x, y: 0, z: g.z, heading: g.heading, moving: g.moving, opacity: 1 }; }
  } else if (s.phase === "working") {
    if (!wantsSlot) s = goOut();
    else return { phase: "working", x: slot.x, y: slot.y, z: slot.z, heading: 0, moving: false, opacity: 1 };
  } else if (s.phase === "to-slot" && !wantsSlot) {
    s = goOut();
  } else if (s.phase === "out" && wantsSlot) {
    s = goSlot();
  }

  const step = WALK_SPEED * dt;
  if (s.phase === "to-slot") {
    const walked = s.walked + step;
    const p = pointAlong(s.route, walked);
    if (p.done) return { phase: "working", x: slot.x, y: slot.y, z: slot.z, heading: 0, moving: false, opacity: 1 };
    return { ...s, walked, x: p.x, y: p.y, z: p.z, heading: p.heading, moving: true };
  }
  // out: first down off the counter (if up), then chase the moving idle spot until it is reached.
  if (s.route) {
    const walked = s.walked + step;
    const p = pointAlong(s.route, walked);
    if (!p.done) return { ...s, walked, x: p.x, y: p.y, z: p.z, heading: p.heading, moving: true };
    s = { ...s, route: null, walked: 0, x: p.x, y: 0, z: p.z };
  }
  const target = roamAt(seed, now, obstacles);
  const route = planRoute(at(s.x, 0, s.z), at(target.x, 0, target.z), obstacles);
  const remaining = routeLength(route);
  if (remaining <= step) return { phase: "idle", x: target.x, y: 0, z: target.z, heading: target.heading, moving: target.moving, opacity: 1 };
  const p = pointAlong(route, step);
  return { ...s, phase: "out", x: p.x, y: 0, z: p.z, heading: p.heading, moving: true, opacity: 1 };
}
