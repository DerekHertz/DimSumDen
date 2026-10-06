// den-layout/04: walk mode in the new den. The seam is the one the app uses: createDenExplorer over the den that
// RestaurantDen assembles (PR #162's site plan on top of createDenScene). Expected positions are literals taken
// from site-plan.mjs (stations, zones, floor radius 24.5), not recomputed from the code under test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from '../../review/walking-panda.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { canvasDocument } from './den-test-helpers.mjs';
import { createDenExplorer } from './explorer.mjs';
import { isDenPositionBlocked } from './walk.mjs';
import { prepareReviewLayout } from '../../review/layout.mjs';
import { createReviewAgents } from '../../review/agents.mjs';
import { createLeisure } from '../../review/leisure.mjs';
import { createReviewLandscape } from '../../review/landscape.mjs';
import { createConstructionPads } from '../../review/construction-pads.mjs';
import { REVIEW_STATIONS, REVIEW_OBSTACLES, REVIEW_CLEARINGS, ZONE_POSITIONS, CONSTRUCTION_PADS, LANTERN_POSTS } from '../../review/site-plan.mjs';

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); },
  };
}

// Builds the den the way RestaurantDen does, plus an explorer on it with a stubbed document, and tears both down.
function withNewDenWalker(run) {
  const previous = { document: globalThis.document, window: globalThis.window };
  const doc = eventTarget(), win = eventTarget(), canvas = eventTarget();
  doc.pointerLockElement = null; win.matchMedia = () => ({ matches: false });
  canvas.setPointerCapture = () => {};
  let den, leisure, landscape, construction, agents, explorer;
  globalThis.document = canvasDocument();
  try {
    den = createDenScene(THREE, createBao, createWalkingBao);
    den.setLabels(false);
    for (const p of den.pandas) compactPanda(THREE, p);
    prepareReviewLayout(den);
    compactEnvironment(THREE, den);
    leisure = createLeisure(den, createBao);
    landscape = createReviewLandscape(den, 'morning');
    construction = createConstructionPads(den);
    agents = createReviewAgents(den, createBao);
    globalThis.document = doc; globalThis.window = win;
    const navigation = { enabled: true }, modes = [];
    explorer = createDenExplorer(THREE, { canvas, orbitControls: navigation, den, onModeChange: (v) => modes.push(v) });
    run({ explorer, den, doc, navigation, modes });
  } finally {
    explorer?.dispose();
    globalThis.document = canvasDocument(); globalThis.window = previous.window;
    agents?.dispose(); construction?.dispose(); landscape?.dispose(); leisure?.dispose(); den?.dispose();
    globalThis.document = previous.document;
  }
}

const FLOOR_RADIUS = 24.5;
const WALKER_RADIUS = 0.26;

// Flood fill over the explorer's own blocked() from the spawn, on a 0.25 m grid. Returns a predicate for the
// reachable cells and the cell count.
function reachableFrom(explorer, start) {
  const step = 0.25, half = Math.ceil(26 / step);
  const key = (i, j) => (i + half) * (2 * half + 1) + (j + half);
  const seen = new Set(), queue = [[Math.round(start.x / step), Math.round(start.z / step)]];
  seen.add(key(...queue[0]));
  for (let head = 0; head < queue.length; head++) {
    const [i, j] = queue[head];
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (Math.abs(a) > half || Math.abs(b) > half || seen.has(key(a, b))) continue;
      if (explorer.blocked(a * step, b * step)) continue;
      seen.add(key(a, b)); queue.push([a, b]);
    }
  }
  return { size: seen.size, near: (x, z, radius) => {
    for (let a = Math.floor((x - radius) / step); a <= Math.ceil((x + radius) / step); a++) {
      for (let b = Math.floor((z - radius) / step); b <= Math.ceil((z + radius) / step); b++) {
        if (Math.hypot(a * step - x, b * step - z) <= radius && seen.has(key(a, b))) return true;
      }
    }
    return false;
  } };
}

test('walk mode enters, moves with W and exits with Esc on the new den, with den-v1/03 controls', () => {
  withNewDenWalker(({ explorer, doc, navigation, modes }) => {
    explorer.enter();
    assert.equal(explorer.active, true);
    assert.equal(navigation.enabled, false, 'orbit camera is parked while walking');
    assert.deepEqual(modes, [true]);
    const start = explorer.camera.position.clone();
    explorer.update(0.1);
    assert.deepEqual(explorer.camera.position.toArray(), start.toArray(), 'standing still without a key');
    doc.emit('keydown', { code: 'KeyW', preventDefault() {}, target: {} });
    for (let i = 0; i < 30; i++) explorer.update(1 / 30);
    const walked = explorer.camera.position.distanceTo(start);
    assert.ok(walked > 1.8 && walked < 2.4, 'one second of W from the spawn covers ~2.1 m (it must face open floor), got ' + walked);
    doc.emit('keydown', { code: 'Escape', preventDefault() {}, target: {} });
    assert.equal(explorer.active, false);
    assert.equal(navigation.enabled, true, 'orbit camera is back after Esc');
    assert.deepEqual(modes, [true, false]);
  });
});

test('the walker is blocked by each of the four station stalls in the site plan, from every side', () => {
  assert.equal(REVIEW_STATIONS.length, 4);
  withNewDenWalker(({ explorer }) => {
    for (const s of REVIEW_STATIONS) {
      // A stall is 3.58 x 2.14 m (halfX 1.79, halfZ 1.07), turned by yaw: its centre and a point just inside each end are solid.
      const cos = Math.cos(s.yaw), sin = Math.sin(s.yaw);
      const local = (lx, lz) => [s.x + cos * lx + sin * lz, s.z - sin * lx + cos * lz];
      for (const [lx, lz] of [[0, 0], [1.5, 0], [-1.5, 0], [0, 0.9], [0, -0.9]]) {
        const [x, z] = local(lx, lz);
        assert.equal(explorer.blocked(x, z), true, `station at ${s.x},${s.z}: local ${lx},${lz} is walkable`);
      }
      // ...and a point 1 m clear of the long face is open floor, so the block is the stall, not the whole area.
      const [fx, fz] = local(0, 1.07 + WALKER_RADIUS + 1);
      assert.equal(explorer.blocked(fx, fz), false, `station at ${s.x},${s.z}: the space in front is walkable`);
    }
  });
});

test('the walker is blocked by the rest of the site plan: lantern posts, dining table, mahjong table, festival, tea pond and construction pads', () => {
  withNewDenWalker(({ explorer }) => {
    const solid = [
      ...LANTERN_POSTS.map(([x, , z]) => [x, z]),
      [ZONE_POSITIONS.dining[0], ZONE_POSITIONS.dining[2]],
      [ZONE_POSITIONS.games[0], ZONE_POSITIONS.games[2]],
      [ZONE_POSITIONS.festival[0], ZONE_POSITIONS.festival[2]],
      [ZONE_POSITIONS.tea[0], ZONE_POSITIONS.tea[2]],
      [ZONE_POSITIONS.dragon[0], ZONE_POSITIONS.dragon[2]],
      ...CONSTRUCTION_PADS.map((p) => [p.position[0], p.position[2]]),
    ];
    assert.equal(solid.length, 2 + 5 + 3);
    for (const [x, z] of solid) assert.equal(explorer.blocked(x, z), true, `walkable at ${x},${z}`);
  });
});

test('the walker cannot leave the garden: every point past the floor edge (radius 24.5) is blocked', () => {
  withNewDenWalker(({ explorer }) => {
    for (const angle of [0, 0.7, 1.6, 2.4, 3.14, 4.0, 4.9, 5.7]) {
      const r = FLOOR_RADIUS + WALKER_RADIUS + 0.2;
      const x = Math.sin(angle) * r, z = Math.cos(angle) * r;
      assert.equal(explorer.blocked(x, z), true, `open past the floor edge at angle ${angle}`);
      assert.equal(explorer.blocked(x * 1.5, z * 1.5), true, `open far past the floor edge at angle ${angle}`);
    }
  });
});

test('the spawn point is inside a walkable area of the site plan, clear of every obstacle with room around it', () => {
  withNewDenWalker(({ explorer, den }) => {
    explorer.enter();
    const { x, z } = explorer.camera.position;
    assert.equal(explorer.blocked(x, z), false, `spawn ${x},${z} is blocked`);
    assert.ok(Math.hypot(x, z) < FLOOR_RADIUS - 1, 'spawn is on the floor, away from its edge');
    // The site plan's own obstacles and the den's (moved stalls, central table, tally) leave 0.65 m (a panda's width) around it.
    assert.equal(isDenPositionBlocked(x, z, [...REVIEW_OBSTACLES, ...den.obstacles], 0.65), false, 'spawn is hemmed in');
    // Not in the middle of a station: no stall footprint (3.58 x 2.14, widest reach 2.1) contains it.
    for (const s of REVIEW_STATIONS) assert.ok(Math.hypot(x - s.x, z - s.z) > 2.1 + WALKER_RADIUS, `spawn is in the station at ${s.x},${s.z}`);
  });
});

test('from the spawn the walker can reach every station and every leisure zone of the site plan', () => {
  withNewDenWalker(({ explorer }) => {
    explorer.enter();
    const reach = reachableFrom(explorer, explorer.camera.position);
    assert.ok(reach.size > 4000, 'the reachable area is large (a 2.1 m/s walker should cover most of the plan): ' + reach.size + ' cells');
    for (const s of REVIEW_STATIONS) assert.ok(reach.near(s.x, s.z, 3.0), `cannot get within 3 m of the station at ${s.x},${s.z}`);
    for (const c of REVIEW_CLEARINGS.filter((c) => Object.values(ZONE_POSITIONS).some(([x, , z]) => x === c.x && z === c.z))) {
      assert.ok(reach.near(c.x, c.z, c.radius + 1.5), `cannot reach the zone at ${c.x},${c.z}`);
    }
  });
});

test('the walk check is back in smoke:ui against the new den', () => {
  const smoke = readFileSync(new URL('../../../../ci-cd/smoke-ui.mjs', import.meta.url), 'utf8');
  assert.ok(/check\(\s*["'`]walk: Enter the den/.test(smoke), 'smoke-ui.mjs has no active "walk: Enter the den" check');
  assert.ok(!/check is dropped/.test(smoke), 'the dropped-check note is still in place');
});
