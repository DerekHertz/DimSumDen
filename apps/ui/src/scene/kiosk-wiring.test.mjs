// den-scene-v1/03: wiring checks on Market.jsx, ChipLayer and the stylesheet. R3F cannot render under
// node --test, so these read source for the criteria that live only in JSX/CSS (same approach as
// station-hues.test.mjs and handoffs.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stationLabels } from "./station-labels.mjs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const market = read("./Market.jsx");

test("Market renders kiosks from the kiosk model, with lit state from lanternState", () => {
  assert.match(market, /from "\.\/kiosk\.mjs"/);
  assert.match(market, /lanternState/);
  assert.match(market, /eaveTrimTriangles/);
});

test("the sphere Lantern component is deleted; kiosk lanterns are 8-sided cylinders", () => {
  assert.doesNotMatch(market, /function Lantern\b/);
  assert.doesNotMatch(market, /<Lantern\b/);
  assert.doesNotMatch(market, /LANTERN_OFF[\s\S]{0,40}position=\{\[0, eave/);
  assert.match(market, /cylinderGeometry/);
});

test("the noren sign is drawn on a CanvasTexture in the display face, after Long Cang loads, with no new dependency", () => {
  assert.match(market, /CanvasTexture/);
  assert.match(market, /document\.fonts\.load/);
  assert.match(market, /Long Cang|font-display/);
  const pkg = JSON.parse(read("../../../../package.json"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  assert.deepEqual(deps.filter((d) => /font|canvas|troika|text/i.test(d)), [], "no text or font dependency added");
});

test("the station name stays in the ChipLayer anchor for screen readers; the visible rice-paper pill is removed", () => {
  const chip = read("./ChipLayer.jsx");
  assert.match(chip, /className="station-label"/);
  assert.match(chip, /\{l\.text\}/);
  const css = read("../styles.css");
  const rule = css.match(/^\.station-label \{[^}]*\}/m)?.[0] ?? "";
  assert.ok(rule, ".station-label rule still present");
  assert.doesNotMatch(rule, /background/, "no pill background");
  assert.doesNotMatch(rule, /border/, "no pill border or radius");
  assert.doesNotMatch(rule, /rice-paper/);
});

test("station anchors still exist for all four stalls plus Cubs, keeping their ids and text", () => {
  assert.deepEqual(stationLabels({}).map((l) => [l.id, l.text]), [
    ["station:steamers", "Steamers"], ["station:front-of-house", "Front of House"],
    ["station:tea", "Tea"], ["station:pantry", "Pantry"], ["station:cubs", "Cubs"],
  ]);
});
