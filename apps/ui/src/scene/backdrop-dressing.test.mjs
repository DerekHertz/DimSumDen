// den-iso-v1/04: the dressing is mounted by Backdrop, once. A first cut had Dressing render itself, which the pure
// tests cannot see and which drew no stones, pads or bamboo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./Backdrop.jsx", import.meta.url), "utf8");
const body = (name) => {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const next = src.indexOf("\nfunction ", start + 1);
  const exported = src.indexOf("\nexport function ", start + 1);
  const ends = [next, exported].filter((i) => i > start);
  return src.slice(start, ends.length ? Math.min(...ends) : undefined);
};

test("Backdrop mounts <Dressing /> and Dressing does not mount itself", () => {
  assert.match(body("Backdrop"), /<Dressing \/>/);
  assert.doesNotMatch(body("Dressing"), /<Dressing\b/);
});

test("Dressing draws the group buildDressing returns", () => {
  assert.match(body("Dressing"), /buildDressing\(/);
  assert.match(body("Dressing"), /<primitive object=\{group\} \/>/);
});
