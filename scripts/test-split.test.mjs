import { test } from "node:test";
import assert from "node:assert/strict";
import { allTestFiles, split, BROWSER_FILES } from "./test-split.mjs";

test("every test file lands in exactly one group", () => {
  const all = allTestFiles();
  const { browser, rest } = split(all);
  assert.equal(browser.length + rest.length, all.length);
  assert.ok(!browser.some((f) => rest.includes(f)));
});

test("the listed browser files exist and *.browser.test.mjs files are browser files", () => {
  const all = allTestFiles();
  for (const f of BROWSER_FILES) assert.ok(all.includes(f), `${f} is listed but missing`);
  const { browser } = split(all);
  for (const f of all.filter((x) => x.endsWith(".browser.test.mjs"))) assert.ok(browser.includes(f));
});
