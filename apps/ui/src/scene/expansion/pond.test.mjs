// den-mvp/17: the v5 kit's koi pond (zone-pond) is mounted in the den's scene, local only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { mountExpansionPond } from "./pond.mjs";
import { ZONES } from "./integration/zone-contract.mjs";
import { isDenPositionBlocked } from "../procedural/walk.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const fakeDen = () => ({ world: new THREE.Group(), obstacles: [{ type: "circle", x: 0, z: 0, radius: 1 }] });
const zone = ZONES.find((z) => z.assetId === "zone-pond");

test("the pond zone is found and sits at its contract position, with no resident pandas", () => {
  const den = fakeDen(), pond = mountExpansionPond(den);
  assert.equal(pond.zone.userData.denZone.id, "pond");
  assert.deepEqual(pond.zone.position.toArray(), zone.position);
  assert.equal(pond.root.parent, den.world);
  let pandas = 0; pond.root.traverse((o) => { if (o.userData.panda) pandas++; });
  assert.equal(pandas, 0);
  // Only the pond: no other zone is mounted.
  const zones = []; pond.root.traverse((o) => { if (o.userData.denZone) zones.push(o.userData.denZone.id); });
  assert.deepEqual(zones, ["pond"]);
  pond.dispose();
});

test("its water collision volumes join the walk obstacles, in world coordinates", () => {
  const den = fakeDen(), pond = mountExpansionPond(den);
  assert.equal(pond.obstacles.length, 2);
  for (const o of pond.obstacles) assert.ok(den.obstacles.includes(o));
  assert.equal(den.obstacles.length, 3, "the den's own obstacle is kept");
  const [a, b] = pond.obstacles;
  assert.deepEqual([a.type, a.x, a.z], ["box", zone.position[0] - 1.3, zone.position[2]]);
  assert.equal(b.x, zone.position[0] + 1.3);
  assert.equal(isDenPositionBlocked(zone.position[0] - 1.3, zone.position[2], den.obstacles, 0.3), true, "water blocks walking");
  assert.equal(isDenPositionBlocked(zone.position[0], zone.position[2], den.obstacles, 0.3), false, "the bridge corridor stays open");
  pond.dispose();
});

test("dispose removes the obstacles and the scene graph, and frees geometry", () => {
  const den = fakeDen(), pond = mountExpansionPond(den);
  const geos = []; pond.root.traverse((o) => { if (o.geometry) geos.push(o.geometry); });
  let freed = 0; for (const g of geos) g.addEventListener("dispose", () => freed++);
  pond.dispose();
  assert.equal(den.obstacles.length, 1);
  assert.equal(pond.root.parent, null);
  assert.ok(freed > 0 && freed === new Set(geos).size);
  pond.dispose(); // idempotent
});

test("koi and tea-table taps play the local response and send no request", () => {
  const realFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = () => { calls++; return Promise.reject(new Error("no requests expected")); };
  try {
    const pond = mountExpansionPond(fakeDen());
    assert.equal(pond.interact("pond.koi").matched, 2, "both koi respond");
    const first = pond.interact("pond.tea"), second = pond.interact("pond.tea");
    assert.equal(first.matched, 1);
    assert.match(first.message, /One tap/);
    assert.match(second.message, /thank you/);
    pond.update(1, false); // a frame of the pulse
    assert.equal(calls, 0);
    pond.dispose();
  } finally { globalThis.fetch = realFetch; }
});

test("koi swim when motion is allowed and hold still for reduced motion", () => {
  const pond = mountExpansionPond(fakeDen());
  const koi = []; pond.root.traverse((o) => { if (o.userData.denNode?.id?.startsWith("den.pond.koi")) koi.push(o); });
  const still = koi.map((k) => k.position.toArray());
  pond.update(5, false);
  assert.notDeepEqual(koi.map((k) => k.position.toArray()), still);
  const moved = koi.map((k) => k.position.toArray());
  pond.update(9, true);
  assert.deepEqual(koi.map((k) => k.position.toArray()), moved);
  pond.dispose();
});

test("the den scene mounts it before the obstacle snapshots, clicks route locally, and it is disposed", () => {
  const src = readFileSync(join(HERE, "..", "procedural", "RestaurantDen.jsx"), "utf8");
  const mount = src.indexOf("mountExpansionPond(d)");
  assert.ok(mount > 0, "mounted");
  assert.ok(mount < src.indexOf("createReviewAgents(d"), "before the actors copy den.obstacles");
  assert.ok(mount < src.indexOf("createLiveDenController(d"), "before the controller snapshots base obstacles");
  assert.match(src, /pond\.dispose\(\)/);
  assert.match(src, /pond\.update\(/);
  assert.match(src, /denInteraction/);
  const mod = readFileSync(join(HERE, "pond.mjs"), "utf8");
  assert.doesNotMatch(mod, /fetch|XMLHttpRequest|EventSource|bridge-client/);
});
