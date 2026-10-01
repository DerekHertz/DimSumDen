// Ticket den-scene-v1/05 (was showcase-v1/07 fix round): the Tally pill must project just above the
// abacus frame top. Expected pixel bounds come from the designer review (centre within 10px of the
// abacus centre x, 0 to 40px above the frame top), measured through the isometric projection at 1280x800.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TALLY, tallyAnchor } from "./banquet-layout.mjs";
import { TARGET, worldToScreen } from "./iso-projection.mjs";

const W = 1280, H = 800;
// den-iso-v1/02: the isometric camera; a pan moves its look-at target along x.
const viewAt = (pan) => ({ width: W, height: H, zoom: 1, target: [pan, TARGET[1], TARGET[2]] });
const frameTop = TALLY.groundY + TALLY.leg.height + TALLY.frame.height;

for (const pan of [0, 2, -3]) {
  test(`pill sits over the abacus, 0-40px above the frame top (pan ${pan})`, () => {
    const view = viewAt(pan);
    const a = tallyAnchor();
    const pill = worldToScreen([a.x, a.y, a.z], view);
    const top = worldToScreen([TALLY.x, frameTop, TALLY.z], view);
    assert.ok(Math.abs(pill.x - top.x) <= 10, `dx ${pill.x - top.x}`);
    const above = top.y - pill.y;
    assert.ok(above >= 0 && above <= 40, `above ${above}`);
  });
}
