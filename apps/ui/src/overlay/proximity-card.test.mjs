import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardFor } from './proximity-card.mjs';

test('walking toward pandas shows the nearest one in reach and facing the viewer', () => {
  const pandas = [
    { id: 'far', name: 'Far', role: 'qa', position: { x: 0, z: -2.8 } },
    { id: 'near', name: 'Near', role: 'developer', position: { x: 0, z: -1.5 } },
    { id: 'behind', role: 'scout', position: { x: 0, z: 0.4 } },
  ];
  assert.equal(cardFor(pandas, [], { x: 0, z: 0, yaw: 0 }).id, 'near');
  assert.equal(cardFor(pandas, [], { x: 0, z: 0, yaw: Math.PI }).id, 'behind');
  assert.equal(cardFor(pandas, [], { x: 8, z: 0, yaw: 0 }), null);
  assert.equal(cardFor(pandas.slice(0, 2), [], { x: 0, z: 0, yaw: Math.PI }), null);
});

test('the bound agent supplies state, ticket, tool and runtime capability flags', () => {
  const agent = { id: 'c-live', ref: 'den-v1/04-proximity-card', state: 'needs-you', tool: { name: 'Read', summary: 'card model' }, capabilities: { send: false, approve: true } };
  const panda = { id: 'developer', role: 'developer', position: { x: -2, z: 0 }, agent };
  const approval = { id: 'a-live', agentId: 'c-live', status: 'pending', tool: 'Read' };
  const card = cardFor([panda], [approval], { x: 0, z: 0, yaw: Math.PI / 2 });
  assert.equal(card.agentId, 'c-live');
  assert.equal(card.ref, 'den-v1/04-proximity-card');
  assert.equal(card.state, 'needs-you');
  assert.deepEqual(card.tool, { name: 'Read', summary: 'card model' });
  assert.equal(card.approval.id, 'a-live');
  assert.deepEqual(card.actions.T, { enabled: false, reason: 'runtime cannot send messages' });
  assert.deepEqual(card.actions.F, { enabled: true, reason: null });
  assert.deepEqual(card.actions.A, { enabled: true, reason: null });
  assert.deepEqual(card.actions.D, { enabled: true, reason: null });

  agent.capabilities = { send: true, approve: false };
  const unsupported = cardFor([panda], [approval], { x: 0, z: 0, yaw: Math.PI / 2 });
  assert.equal(unsupported.actions.T.enabled, true);
  assert.deepEqual(unsupported.actions.A, { enabled: false, reason: 'runtime cannot answer permissions' });
});

test('a resident with no live agent keeps its role and disables every action with a reason', () => {
  const resident = { id: 'qa', name: 'Mei', role: 'qa', station: 'Tea', position: { x: 0, z: -2 } };
  const card = cardFor([resident], [], { x: 0, z: 0, yaw: 0 });
  assert.equal(card.role, 'qa');
  assert.equal(card.agentId, null);
  assert.equal(card.state, 'resident');
  for (const key of ['T', 'F', 'A', 'D']) {
    assert.deepEqual(card.actions[key], { enabled: false, reason: 'no agent running' });
  }
});

test('permission actions need a pending request for this agent; ended agents return to resident', () => {
  const agent = { id: 'c-qa', state: 'working', capabilities: { approve: true, send: true } };
  const panda = { id: 'qa', role: 'qa', position: { x: 0, z: -2 }, agent };
  const viewer = { x: 0, z: 0, yaw: 0 };
  for (const approvals of [[], [{ id: 'a-other', agentId: 'c-other' }], [{ id: 'a-done', agentId: 'c-qa', status: 'answered', decision: 'deny' }]]) {
    const card = cardFor([panda], approvals, viewer);
    assert.equal(card.approval, null);
    assert.deepEqual(card.actions.A, { enabled: false, reason: 'no pending permission request' });
    assert.deepEqual(card.actions.D, card.actions.A);
  }
  for (const state of ['done', 'failed', 'terminated']) {
    agent.state = state;
    const card = cardFor([panda], [{ id: 'a-stale', agentId: 'c-qa' }], viewer);
    assert.equal(card.agentId, null);
    assert.equal(card.state, 'resident');
    assert.equal(card.actions.T.reason, 'no agent running');
  }
});

test('reach and facing use world coordinates and ignore missing positions', () => {
  const viewer = { x: 10, z: 6, yaw: -Math.PI / 2 };
  assert.equal(cardFor([{ id: 'edge', position: { x: 13.25, z: 6 } }], [], viewer).id, 'edge');
  assert.equal(cardFor([{ id: 'out', position: { x: 13.26, z: 6 } }], [], viewer), null);
  assert.equal(cardFor([{ id: 'side', position: { x: 10, z: 5 } }], [], viewer), null);
  assert.equal(cardFor([{ id: 'unknown' }], [], viewer), null);
  assert.equal(cardFor([], [], null), null);
});
