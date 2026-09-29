// Ticket showcase-v1/07 fix round: the Tally pill must project just above the stele's tablet top.
// Expected pixel bounds come from the designer review (centre within 10px of the stele centre x,
// 0 to 40px above the tablet top), measured with a real THREE camera at 1280x800.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { TALLY } from "./banquet-layout.mjs";
import { tallyAnchor } from "./banquet-layout.mjs";
import { cameraPosition } from "./camera-rig.mjs";

const W = 1280, H = 800;
function camAt(pan) {
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  cam.rotation.set(-0.2, 0, 0);
  const [x, y, z] = cameraPosition(pan, 1);
  cam.position.set(x, y, z);
  cam.updateMatrixWorld();
  return cam;
}
const px = (v, cam) => {
  const p = v.clone().project(cam);
  return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H };
};
const tabletTop = TALLY.groundY - 0.02 + TALLY.plinth.height + TALLY.tablet.height;

for (const pan of [0, 2, -3]) {
  test(`pill sits over the stele, 0-40px above the tablet top (pan ${pan})`, () => {
    const cam = camAt(pan);
    const pill = px(new THREE.Vector3(tallyAnchor().x, tallyAnchor().y, tallyAnchor().z), cam);
    const top = px(new THREE.Vector3(TALLY.x, tabletTop, TALLY.z), cam);
    assert.ok(Math.abs(pill.x - top.x) <= 10, `dx ${pill.x - top.x}`);
    const above = top.y - pill.y;
    assert.ok(above >= 0 && above <= 40, `above ${above}`);
  });
}
