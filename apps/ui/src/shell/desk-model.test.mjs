import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deskActivity, deskResidents } from './desk-model.mjs';

test('a quiet garden keeps all fourteen permanent residents without invented activity', () => {
  const residents = deskResidents(null);
  assert.equal(residents.length, 14);
  assert.equal(new Set(residents.map(row => row.id)).size, 14);
  assert.ok(residents.every(row => row.state === 'resident' && row.ref === null));
  assert.deepEqual(deskActivity(null), { working: 0, waiting: 0, blocked: 0, resting: 14, visitors: 0 });
});

test('concurrent work gets separate visitors and preserves the exact ticket selection', () => {
  const snapshot = { agents: [
    { id: 'dev-a', role: 'developer', ref: 'feature/01', state: 'working' },
    { id: 'dev-b', role: 'developer', ref: 'feature/02', state: 'waiting_on_user' },
    { id: 'old', role: 'qa', ref: 'feature/03', state: 'done' },
  ] };
  const developers = deskResidents(snapshot).filter(row => row.role === 'developer');
  assert.deepEqual(developers.map(({ id, ref, state, visitor }) => ({ id, ref, state, visitor })), [
    { id: 'developer', ref: 'feature/01', state: 'working', visitor: false },
    { id: 'developer#feature/02', ref: 'feature/02', state: 'needs-you', visitor: true },
  ]);
  assert.deepEqual(deskActivity(snapshot), { working: 1, waiting: 1, blocked: 0, resting: 13, visitors: 1 });
});
