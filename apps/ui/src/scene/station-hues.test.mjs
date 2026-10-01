// den-scene-v1/02: approved token lookup seam and explicit Market source criterion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const moduleUrl = new URL("./station-hues.mjs", import.meta.url);
const palettes = {
  light: { pass: "#674698", steamers: "#2759A2", tea: "#006E54", pantry: "#326A2D", "front-of-house": "#00658B" },
  dark: { pass: "#C3A5F9", steamers: "#87B9FF", tea: "#56D0AF", pantry: "#8ACB83", "front-of-house": "#55C6F4" },
};
for (const [theme, palette] of Object.entries(palettes)) {
  test(`all five stations resolve approved station tokens in ${theme} theme`, async () => {
    assert.ok(existsSync(moduleUrl), "reusable station hue lookup feature is missing");
    const { stationHue } = await import(moduleUrl.href);
    assert.equal(typeof stationHue, "function", "stationHue(station, theme) is the reusable lookup seam");
    for (const [station, expected] of Object.entries(palette)) {
      assert.equal(stationHue(station, theme).toUpperCase(), expected.toUpperCase(), station);
    }
  });
}
test("Market has no literal station hue palette", () => {
  const source = readFileSync(new URL("./Market.jsx", import.meta.url), "utf8");
  const stationHexes = ["#e0a458", "#d9707e", "#6fae7a", "#5f8fbf", ...Object.values(palettes).flatMap(Object.values)];
  for (const hue of stationHexes) assert.ok(!source.toLowerCase().includes(hue.toLowerCase()), `station literal ${hue} must live in the token module`);
});
