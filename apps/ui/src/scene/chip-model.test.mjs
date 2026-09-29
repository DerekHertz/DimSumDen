import { test } from "node:test";
import assert from "node:assert/strict";
import { chipModel } from "./chip-model.mjs";

const cases = [
  ["working", "Working"], ["waiting_on_user", "Needs you"], ["blocked", "Blocked"], ["done", "Done"], ["idle", "Queued"],
];
for (const [pose, label] of cases) {
  test(`chip label for ${pose} is ${label}`, () => {
    const chip = chipModel({ ref: "f/01-t", pose }, "Do the thing");
    assert.equal(chip.label, label);
    assert.equal(chip.ariaLabel, `Do the thing, ${label}`);
  });
}

test("aria label falls back to the ref without a title", () => {
  assert.equal(chipModel({ ref: "f/01-t", pose: "idle" }).ariaLabel, "f/01-t, Queued");
});
