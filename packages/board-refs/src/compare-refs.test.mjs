// Three-digit tickets: refs sort by ticket number, so 99 comes before 100.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareRefs } from "./compare-refs.mjs";

const sorted = (refs) => [...refs].sort(compareRefs);

test("99 sorts before 100", () => {
  assert.deepEqual(sorted(["f/100-b", "f/99-a"]), ["f/99-a", "f/100-b"]);
});

test("a full ref list orders numerically within a feature", () => {
  assert.deepEqual(
    sorted(["f/108-x", "f/09-x", "f/100-x", "f/10-x", "f/99-x", "f/101-x"]),
    ["f/09-x", "f/10-x", "f/99-x", "f/100-x", "f/101-x", "f/108-x"],
  );
});

test("features still order before ticket numbers", () => {
  assert.deepEqual(sorted(["b/01-x", "a/100-x", "a/99-x"]), ["a/99-x", "a/100-x", "b/01-x"]);
});

test("two-digit refs order exactly as a plain string compare", () => {
  const refs = ["f/10-b", "f/10-a", "f/02-z", "g/01-a", "f/02-a", "f/11-a", "f/10-a-b"];
  assert.deepEqual(sorted(refs), [...refs].sort());
});

test("equal refs compare as 0 and short refs work", () => {
  assert.equal(compareRefs("f/100", "f/100"), 0);
  assert.equal(compareRefs("f/99", "f/100"), -1);
  assert.equal(compareRefs("f/100", "f/99"), 1);
});
