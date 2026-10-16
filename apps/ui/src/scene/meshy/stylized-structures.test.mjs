import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3, Vector3} from 'three';
import {createStylizedStructure, STYLIZED_STRUCTURE_IDS} from './stylized-structures.mjs';
import {createSurfaceNavigation} from './navigation.mjs';

function walk(nav, from, to) {
  let floor = 0;
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const count = Math.ceil(length / .06);
  for (let i = 0; i <= count; i++) {
    const x = from[0] + (to[0] - from[0]) * i / count;
    const z = from[1] + (to[1] - from[1]) * i / count;
    const next = nav.groundAt(x, z, floor);
    assert.notEqual(next, null, `walk blocked at ${x.toFixed(2)}, ${z.toFixed(2)} from floor ${floor}`);
    assert.ok(next - floor <= .315, 'a tread must fit the walking step height');
    floor = next;
  }
  return floor;
}

test('every structure builds without browser globals and uses finite world-unit geometry', () => {
  for (const id of STYLIZED_STRUCTURE_IDS) {
    const group = createStylizedStructure(id);
    const b = new Box3().setFromObject(group), size = b.getSize(new Vector3());
    assert.ok(size.toArray().every(v => Number.isFinite(v) && v > 0), id);
    assert.ok(Math.abs(b.min.y) < .00001, id + ' must have its foot at zero');
    assert.ok(b.max.y <= 4.8, id + ' must fit the human-scale roof height');
    assert.equal(group.userData.structure.id, id);
    for (const door of group.userData.structure.doors)
      assert.ok(door.max[1] - door.min[1] >= 2.35, id + ' must have standing headroom');
  }
});

test('kiosk right entrances are walkable while service counters stay solid', () => {
  for (const id of ['steamers', 'front', 'tea', 'pantry']) {
    const group = createStylizedStructure(id), nav = createSurfaceNavigation([group]);
    assert.ok(Math.abs(walk(nav, [4, -.32], [0, -.32]) - .36) < .015);
    assert.equal(nav.groundAt(0, 1.4, .36), null, id + ' service counter must remain solid');
    const door = group.userData.structure.doors[0];
    assert.ok(door.max[2] - door.min[2] >= 1.25);
  }
});

test('library, stage, and pavilion approaches can be walked from ground level', () => {
  for (const [id, from, to] of [
    ['library', [0, 4], [0, 0]],
    ['festival', [0, 4], [0, 0]],
    ['pavilion', [0, 7], [0, 1.2]],
  ]) {
    const group = createStylizedStructure(id), nav = createSurfaceNavigation([group]);
    assert.ok(Math.abs(walk(nav, from, to) - group.userData.structure.floorY) < .015, id);
  }
});

test('gate and gate tea table have comfortable first-person proportions', () => {
  const gate = createStylizedStructure('gate');
  assert.equal(walk(createSurfaceNavigation([gate]), [0, 2], [0, -2]), 0);
  const table = createStylizedStructure('dining').userData.structure.table;
  assert.equal(table.width, 2);
  assert.ok(table.top < 1);
});
