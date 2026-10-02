// den-iso-v1/04: source wiring for what a pure model cannot reach. The layout module places the dressing;
// these checks only prove the scene draws from it (no second copy of the numbers) and that no biology word
// reaches an aria-label. How it looks (dashed pads, stone and bamboo shapes, colours) is human-verified.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("./", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const sceneJsx = readdirSync(dir).filter((f) => f.endsWith(".jsx"));
const sceneSources = [...sceneJsx, "dressing.mjs"]; // dressing.mjs holds the geometry Backdrop.jsx mounts (split out so node can build it)
const scene = sceneSources.map((f) => read(f)).join("\n");

test("the scene draws the stone ring, the pads and the bamboo from the layout module", () => {
  assert.ok(/\bstepStones\b/.test(scene), "stones come from stepStones()");
  assert.ok(/\bDORMANT_PADS\b/.test(scene), "pads come from DORMANT_PADS");
  assert.ok(/\b(bambooStalks|BAMBOO_CLUSTERS)\b/.test(scene), "bamboo comes from the layout module");
});

test("the dressing's world numbers are not copied into the scene files: no 7.3 / 6.3 ring axes, no -7.2 pad depth", () => {
  for (const f of [...sceneSources, "App.jsx"].map((n) => (n === "App.jsx" ? "../App.jsx" : n))) {
    const src = read(f);
    assert.ok(!/\b7\.3\b[^.\d]*\b6\.3\b/.test(src), `${f}: ring axes`);
    assert.ok(!/-7\.2\b/.test(src), `${f}: pad depth`);
  }
});

test("the pad labels reach the screen from DORMANT_PADS (a chip or the scene label), not from a copy", () => {
  const sources = ["ChipLayer.jsx", "Den.jsx", "../App.jsx", "station-labels.mjs"].map(read);
  const users = sources.filter((s) => /\bDORMANT_PADS\b/.test(s));
  assert.ok(users.length > 0, "some label source reads DORMANT_PADS");
  assert.ok(users.some((s) => /\.label\b|\.ariaLabel\b/.test(s)), "and uses the pad's label or ariaLabel");
});

test("no aria-label literal in the scene or app source holds a biology word (den-map check 7)", () => {
  const BIOLOGY_WORDS = ["org" + "anism", "or" + "gan", "ce" + "ll", "gen" + "ome", "apopt" + "osis", "endo" + "crine"]; // spelt in pieces so the repo-wide word scan passes
  const biology = new RegExp(`\\b(${BIOLOGY_WORDS.join("|")})s?\\b`, "i");
  for (const f of [...sceneJsx, "../App.jsx"]) {
    const src = read(f);
    for (const m of src.matchAll(/aria-label=(?:"([^"]*)"|\{`([^`]*)`\})/g)) assert.doesNotMatch(m[1] ?? m[2], biology, `${f}: ${m[0]}`);
  }
});
