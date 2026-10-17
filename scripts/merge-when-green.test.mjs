// merge-when-green: the verdict that decides a merge. Pinned: no checks is never a pass, a pending check waits, any
// failed or cancelled check stops the merge and is named, and only an all-passed list merges.
import { test } from "node:test";
import assert from "node:assert/strict";
import { verdict } from "./merge-when-green.mjs";

test("no checks yet is a wait, never a pass", () => {
  assert.equal(verdict([]).state, "wait");
  assert.equal(verdict(undefined).state, "wait");
});

test("a pending check waits", () => {
  assert.equal(verdict([{ name: "test", bucket: "pending" }, { name: "security", bucket: "pass" }]).state, "wait");
});

test("a failed or cancelled check stops the merge and is named, even while others run", () => {
  assert.deepEqual(verdict([{ name: "test", bucket: "fail" }, { name: "test-browser", bucket: "pending" }]), { state: "fail", failed: ["test"] });
  assert.deepEqual(verdict([{ name: "ci", bucket: "cancel" }]), { state: "fail", failed: ["ci"] });
});

test("every check passed (skipped ones aside) is a pass; only skipped is a wait", () => {
  assert.equal(verdict([{ name: "test", bucket: "pass" }, { name: "lint", bucket: "skipping" }]).state, "pass");
  assert.equal(verdict([{ name: "lint", bucket: "skipping" }]).state, "wait");
});
