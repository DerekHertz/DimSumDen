// den-layout/03: with the bridge running and a live cell, the den shows that cell's panda at its station.
// Seam: startBridge({root, port: 0}) plus GET /state, fed through liveActorsFromSnapshot and the den's
// createReviewAgents().applyLive. The fixture's lock is `developer` on fx/09-claimed.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { startBridge } from "./server.mjs";
import { makeStateFixture, FEATURE } from "./bridge-fixture.mjs";
import { liveActorsFromSnapshot } from "../ui/src/review/live-actors.mjs";
import { createReviewAgents } from "../ui/src/review/agents.mjs";
import { createBao } from "../ui/src/scene/procedural/bao.mjs";
import { createDenScene } from "../ui/src/scene/procedural/den-scene.mjs";
import { canvasDocument } from "../ui/src/scene/procedural/den-test-helpers.mjs";
import { prepareReviewLayout } from "../ui/src/review/layout.mjs";

async function liveSnapshot(lock) {
  const fx = await makeStateFixture({ lock });
  const bridge = await startBridge({ root: fx.root, port: 0 });
  try {
    const res = await fetch(`${bridge.url}/state`);
    assert.equal(res.status, 200);
    return await res.json();
  } finally {
    await bridge.close();
    await fx.cleanup();
  }
}

test("a locked ticket in the bridge's real /state binds the holder's panda at its station", async () => {
  const snapshot = await liveSnapshot(true);
  const actors = liveActorsFromSnapshot(snapshot, { now: Date.now() });
  const dev = actors.find((a) => a.role === "developer");
  assert.ok(dev, "the developer lock produces a live actor");
  assert.equal(dev.ref, `${FEATURE}/09-claimed`);
  assert.equal(dev.state, "working");
  assert.equal(dev.split, false);

  const previous = globalThis.document;
  globalThis.document = canvasDocument();
  let den, agents;
  try {
    den = createDenScene(THREE, createBao);
    prepareReviewLayout(den);
    agents = createReviewAgents(den, createBao);
    agents.applyLive(actors);
    for (let i = 0; i < 600; i++) agents.update(0.1);
    const actor = agents.actors.get("developer");
    assert.equal(actor.state, "working");
    assert.ok(Math.hypot(actor.panda.model.position.x - actor.home[0], actor.panda.model.position.z - actor.home[1]) < 1.0, "at its station");
    assert.ok(actor.task.includes(`${FEATURE}/09-claimed`));
  } finally {
    agents?.dispose();
    den?.dispose();
    globalThis.document = previous;
  }
});

test("a bridge with no lock binds no panda: every role keeps idle wandering", async () => {
  const snapshot = await liveSnapshot(false);
  assert.deepEqual(liveActorsFromSnapshot(snapshot, { now: Date.now() }), []);
});
