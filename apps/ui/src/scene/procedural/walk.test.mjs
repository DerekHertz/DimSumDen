import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walk, startWalk, isDenPositionBlocked, WALK } from './walk.mjs';
import { withDen } from './den-test-helpers.mjs';

// Expected values are literals from the ticket (den-v1/03) and the frozen layout: the floor spans
// inside the disc of radius 24.5 at the origin (den-layout/04; a rectangle before the site plan), walking speed is 2.1 m/s (3.5 sprinting), pitch is -1.20..1.30.
const open = {obstacles: [], avoid: []};
const run = (state, input, seconds, fps, world = open) => {
  const dt = 1 / fps;
  for (let i = 0, n = Math.round(seconds * fps); i < n; i++) state = walk(state, input, dt, world);
  return state;
};
const north = {forward: 1, strafe: 0};
const at = (x, z, extra = {}) => ({...startWalk(), x, z, ...extra});

test('startWalk puts the camera at eye height at the den entrance, level-ish, facing the room', () => {
  const s = startWalk();
  assert.deepEqual([s.x, s.z, s.y, s.yaw], [0, 8.95, 1.65, 0]);
  assert.ok(s.pitch > 0 && s.pitch < 0.3);
});

test('walking forward at yaw 0 moves toward -z at 2.1 m/s, and sprinting at 3.5', () => {
  const walked = run(startWalk(), north, 1, 60);
  assert.ok(Math.abs(8.95 - walked.z - 2.1) < 0.05, 'z after 1 s: ' + walked.z);
  assert.ok(Math.abs(walked.x) < 1e-9);
  const sprinted = run(startWalk(), {...north, sprint: true}, 1, 60);
  assert.ok(Math.abs(8.95 - sprinted.z - 3.5) < 0.05, 'z after 1 s sprinting: ' + sprinted.z);
});

test('diagonal movement is not faster than straight movement', () => {
  const s = run(at(0, 0), {forward: 1, strafe: 1}, 1, 60);
  assert.ok(Math.abs(Math.hypot(s.x, s.z) - 2.1) < 0.05);
});

test('movement per second is the same at 30 and 120 fps, within 5%', () => {
  const slow = run(at(0, 8), north, 1, 30), fast = run(at(0, 8), north, 1, 120);
  const a = 8 - slow.z, b = 8 - fast.z;
  assert.ok(Math.abs(a - b) / b < 0.05, `30 fps ${a}, 120 fps ${b}`);
  const sideSlow = run(at(-3, 0, {yaw: 0.7}), {forward: 1, strafe: -1}, 1, 30);
  const sideFast = run(at(-3, 0, {yaw: 0.7}), {forward: 1, strafe: -1}, 1, 120);
  assert.ok(Math.abs(Math.hypot(sideSlow.x + 3, sideSlow.z) - Math.hypot(sideFast.x + 3, sideFast.z)) < 0.1);
});

test('walking into the floor edge (radius 24.5) stops at the edge, on every side', () => {
  const edge = 24.5 - 0.26;
  const east = run(at(23, 0, {yaw: -Math.PI / 2}), north, 3, 60);
  assert.ok(east.x <= edge && east.x > edge - 0.2, 'east x ' + east.x);
  const west = run(at(-23, 0, {yaw: Math.PI / 2}), north, 3, 60);
  assert.ok(west.x >= -edge && west.x < -edge + 0.2, 'west x ' + west.x);
  const far = run(at(0, -23), north, 3, 60);
  assert.ok(far.z >= -edge && far.z < -edge + 0.2, 'north z ' + far.z);
  const near = run(at(0, 23, {yaw: Math.PI}), north, 3, 60);
  assert.ok(near.z <= edge && near.z > edge - 0.2, 'south z ' + near.z);
  // Heading diagonally out (toward +x, +z) also stops on the circle, not at a corner.
  const diagonal = run(at(15, 15, {yaw: Math.PI * 0.75}), north, 4, 60);
  assert.ok(Math.hypot(diagonal.x, diagonal.z) <= edge + 1e-9, 'diagonal radius ' + Math.hypot(diagonal.x, diagonal.z));
});

test('walking into a stall box stops at its edge instead of passing through it', () => {
  const stall = {type: 'box', x: 0, z: 0, halfX: 1, halfZ: 0.5, rotation: 0};
  const end = run(at(0, 5), north, 5, 60, {obstacles: [stall], avoid: []});
  // The box face is at z = 0.5; the walker keeps its 0.26 body radius clear of it.
  assert.ok(end.z >= 0.5 + WALK.radius - 1e-6 && end.z < 0.5 + WALK.radius + 0.1, 'z ' + end.z);
  assert.equal(isDenPositionBlocked(end.x, end.z, [stall]), false);
});

test('a rotated box and a round prop stop the walker too, and a walker slides along the face', () => {
  const stall = {type: 'box', x: 0, z: 0, halfX: 1, halfZ: 0.5, rotation: 0};
  // Walking at a slant into the face keeps the sideways part of the motion: heading -0.3 rad off north from
  // (0.5, 3) reaches the face at z = 0.76 after 2.35 m (x = -0.2), then 0.17 m more slides along it.
  const slid = run(at(0.5, 3, {yaw: 0.3}), north, 1.2, 60, {obstacles: [stall], avoid: []});
  assert.ok(Math.abs(slid.z - 0.76) < 0.05, 'held at the face: ' + slid.z);
  assert.ok(slid.x < -0.2 - 0.02, 'kept sliding sideways: ' + slid.x);
  const turned = {...stall, rotation: Math.PI / 4};
  const diag = run(at(0, 5), north, 5, 60, {obstacles: [turned], avoid: []});
  assert.equal(isDenPositionBlocked(diag.x, diag.z, [turned]), false);
  assert.ok(diag.z > 0.5, 'did not pass through the turned box: ' + diag.z);
  const table = {type: 'circle', x: 0, z: 0, radius: 1.3};
  const end = run(at(0, 5), north, 5, 60, {obstacles: [table], avoid: []});
  assert.ok(Math.hypot(end.x, end.z) >= 1.3 + WALK.radius - 0.02);
});

test('a roaming panda blocks the walker, but only a visible one', () => {
  const panda = {x: 0, z: 2, r: 0.72};
  const end = run(at(0, 5), north, 5, 60, {obstacles: [], avoid: [panda]});
  assert.ok(end.z >= 2 + 0.72 - 0.01 && end.z < 2 + 0.72 + 0.1, 'z ' + end.z);
});

test('a long walk through the real den never ends inside a prop or off the floor', () => {
  withDen(den => {
    for (const yaw of [0, 0.4, -0.4, 1.2, -1.2, 2.5, Math.PI]) {
      const end = run(at(0, 8.95, {yaw}), north, 25, 30, {obstacles: den.obstacles, avoid: []});
      assert.equal(isDenPositionBlocked(end.x, end.z, den.obstacles, 0.26), false, 'yaw ' + yaw);
      assert.ok(Math.hypot(end.x, end.z) <= 24.5 - 0.26 + 1e-9, 'yaw ' + yaw + ' ended off the floor');
    }
  });
});

test('pitch is clamped to -1.20..1.30 however far the mouse goes', () => {
  const up = walk(startWalk(), {look: {dx: 0, dy: -100000}}, 1 / 60, open);
  assert.equal(up.pitch, 1.30);
  const down = walk(startWalk(), {look: {dx: 0, dy: 100000}}, 1 / 60, open);
  assert.equal(down.pitch, -1.20);
  const small = walk(startWalk(), {look: {dx: 0, dy: -40}}, 1 / 60, open);
  assert.ok(Math.abs(small.pitch - (startWalk().pitch + 40 * 0.0025)) < 1e-9);
});

test('mouse x turns the view, and movement follows the new heading', () => {
  const turned = walk(startWalk(), {look: {dx: 100, dy: 0}}, 1 / 60, open);
  assert.ok(Math.abs(turned.yaw + 0.25) < 1e-9);
  const moved = run(turned, north, 1, 60);
  assert.ok(moved.x > 0.3, 'mouse right turns the heading toward +x: ' + moved.x);
});

test('walk is pure: it returns a new state and never edits its arguments', () => {
  const state = Object.freeze(startWalk()), input = Object.freeze({forward: 1, look: Object.freeze({dx: 3, dy: 3})});
  const world = Object.freeze({obstacles: Object.freeze([]), avoid: Object.freeze([])});
  const next = walk(state, input, 1 / 60, world);
  assert.notEqual(next, state);
  assert.equal(state.z, 8.95);
  assert.ok(next.z < 8.95);
});

test('the view bobs while walking unless reduced motion is on, and stands still when idle', () => {
  const moving = run(startWalk(), north, 0.3, 60);
  assert.notEqual(moving.y, WALK.eyeHeight);
  assert.ok(Math.abs(moving.y - WALK.eyeHeight) <= 0.012 + 1e-9);
  const calm = run(startWalk(), {...north, reducedMotion: true}, 0.3, 60);
  assert.equal(calm.y, WALK.eyeHeight);
  const idle = walk(moving, {}, 1 / 60, open);
  assert.equal(idle.y, WALK.eyeHeight);
  assert.equal(idle.x, moving.x);
});
