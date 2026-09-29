import { test } from "node:test";
import assert from "node:assert/strict";
import { chipModel, stackChips } from "./chip-model.mjs";

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

test("stackChips leaves separated chips where they are", () => {
  const out = stackChips([{ ref: "a", x: 100, y: 100 }, { ref: "b", x: 400, y: 100 }]);
  assert.deepEqual(out.get("a"), { x: 100, y: 100 });
  assert.deepEqual(out.get("b"), { x: 400, y: 100 });
});

test("stackChips lifts colliding chips so none overlap vertically", () => {
  const items = [{ ref: "a", x: 100, y: 100 }, { ref: "b", x: 105, y: 102 }, { ref: "c", x: 98, y: 99 }];
  const out = stackChips(items, { width: 96, height: 22, gap: 2 });
  const ys = items.map((i) => out.get(i.ref).y).sort((p, q) => p - q);
  assert.ok(ys[1] - ys[0] >= 24 && ys[2] - ys[1] >= 24, `ys ${ys}`);
});

test("stackChips is deterministic regardless of input order", () => {
  const items = [{ ref: "a", x: 100, y: 100 }, { ref: "b", x: 100, y: 100 }];
  const one = stackChips(items);
  const two = stackChips([...items].reverse());
  assert.deepEqual(one.get("a"), two.get("a"));
  assert.deepEqual(one.get("b"), two.get("b"));
});
