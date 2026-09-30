// showcase-v1/05: station labels over the stalls. Pure model; worked literals from ADR 0013 and the roofs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { stationLabels } from "./station-labels.mjs";
import { STALL_CENTERS, stallCenterX } from "./banquet-layout.mjs";

test("one label per stall with the station's name", () => {
  const labels = stationLabels({});
  assert.deepEqual(labels.map((l) => [l.station, l.text]), [
    ["steamers", "Steamers"], ["front-of-house", "Front of House"], ["tea", "Tea"], ["pantry", "Pantry"], ["cubs", "Cubs"],
  ]);
  assert.deepEqual(labels.map((l) => l.id), ["station:steamers", "station:front-of-house", "station:tea", "station:pantry", "station:cubs"]);
});

test("labels float above each roof: back stalls sit on the platform, so higher; front roofs are low", () => {
  const byStation = Object.fromEntries(stationLabels({}).map((l) => [l.station, l]));
  // back: platform 0.5 + eave 1.7 + rise 0.7 = 2.9 apex, label 0.2 above; front: eave 1.4 + rise 0.4 = 1.8 apex
  assert.ok(Math.abs(byStation.steamers.y - 3.1) < 1e-9);
  assert.ok(Math.abs(byStation.tea.y - 2.0) < 1e-9);
});

test("the Cubs pill floats just above the front-left cub basket, so it is not read as the queue", () => {
  const cubs = stationLabels({}).find((l) => l.station === "cubs");
  assert.equal(cubs.x, -1.8);
  assert.equal(cubs.z, 3.0);
  assert.ok(cubs.y > 0.4 && cubs.y < 1);
});

test("labels follow the stall as it widens outward, and stand at the stall's z", () => {
  const labels = stationLabels({ steamers: 5, pantry: 8 });
  const s = labels.find((l) => l.station === "steamers");
  const p = labels.find((l) => l.station === "pantry");
  assert.equal(s.x, stallCenterX("steamers", 5));
  assert.equal(p.x, stallCenterX("pantry", 8));
  assert.equal(s.z, STALL_CENTERS.steamers.z);
  assert.equal(p.z, STALL_CENTERS.pantry.z);
});
