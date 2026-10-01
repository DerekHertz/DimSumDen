// den-iso-v1/02: wiring checks on App.jsx and CameraRig.jsx. R3F cannot render under node --test, so these
// read source for the criteria that live only in JSX (same approach as kiosk-wiring.test.mjs): the Canvas
// is orthographic, the rig consumes the projection module, and no perspective constant is left in the app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const app = read("../App.jsx");
const rig = read("./CameraRig.jsx");

test("the Canvas renders through an orthographic camera, with no field of view", () => {
  const canvas = app.match(/<Canvas\b[\s\S]*?>/)?.[0] ?? "";
  assert.match(canvas, /\borthographic\b/, "Canvas has the orthographic prop");
  assert.doesNotMatch(canvas, /\bfov\b/, "no fov on the Canvas");
});

test("the camera rig consumes the projection module and reports no perspective math", () => {
  assert.match(rig, /from "\.\/iso-projection\.mjs"/);
  assert.match(rig, /cameraConfig/);
  assert.match(rig, /from "\.\/camera-rig\.mjs"/);
  assert.doesNotMatch(rig, /cameraPosition|panLimit\(|visibleHalfWidth/);
});

test("no app or scene source still uses the perspective camera constants", () => {
  const dir = new URL("./", import.meta.url);
  const files = readdirSync(dir).filter((f) => /\.(mjs|jsx)$/.test(f) && !f.endsWith(".test.mjs") && f !== "dev-scene.mjs");
  const sources = [["../App.jsx", app], ...files.map((f) => [`./${f}`, read(`./${f}`)])];
  for (const [name, src] of sources) {
    const stripped = src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(stripped, /\b(FOV_DEG|BASE_Y|BASE_Z|cameraPosition)\b/, `${name} still uses a perspective camera constant`);
  }
});
