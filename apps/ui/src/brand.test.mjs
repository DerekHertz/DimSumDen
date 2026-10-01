// showcase-v1/05: the app is Dim Sum Den; Long Cang is display-only (scene labels, header title, tally
// heading); UI copy and numbers stay Nunito. Source-shape checks over index.html and styles.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const html = read("../index.html");
const css = read("./styles.css");

test("page title and header read Dim Sum Den", () => {
  assert.match(html, /<title>Dim Sum Den<\/title>/);
  assert.match(read("./App.jsx"), /<h1[^>]*>Dim Sum Den<\/h1>/);
});

test("Long Cang is self-hosted (showcase-v1/08): local woff2 @font-face, OFL beside it, no Google Fonts host anywhere", () => {
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com|family=/);
  assert.doesNotMatch(css, /fonts\.(googleapis|gstatic)\.com/);
  assert.doesNotMatch(read("./scene/TallyFace.jsx"), /fonts\.(googleapis|gstatic)\.com/);
  const face = css.match(/@font-face\s*\{[^}]*Long Cang[^}]*\}/)?.[0] ?? "";
  const url = face.match(/url\(["']?(\.\/fonts\/[^"')]+\.woff2)["']?\)/)?.[1];
  assert.ok(url, "@font-face for Long Cang points at a local woff2");
  assert.match(face, /font-display:\s*swap/);
  assert.ok(existsSync(new URL("./" + url, import.meta.url)), "woff2 file exists");
  assert.match(read("./fonts/OFL.txt"), /SIL Open Font License/);
});

test("--font-display names Long Cang; --font-sans stays Nunito with no Long Cang", () => {
  assert.match(css, /--font-display:\s*"Long Cang"/);
  const sans = css.match(/--font-sans:[^;]+;/)[0];
  assert.match(sans, /Nunito/);
  assert.doesNotMatch(sans, /Long Cang/);
});

test("the display font is used only by header title, station labels and the tally chip", () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => [sel.trim(), body]);
  const users = rules.filter(([, body]) => /font-family:\s*var\(--font-display\)/.test(body)).map(([sel]) => sel);
  const allowed = [".panel-header h1", ".station-label", ".chip-tally"];
  for (const sel of users) assert.ok(allowed.includes(sel), `unexpected display-font rule: ${sel}`);
  for (const a of allowed) assert.ok(users.includes(a), `${a} uses the display font`);
});

test("no number or data text uses the display font", () => {
  for (const sel of [".meter-value", ".chart-value", ".chart-axis", ".gate-count", ".qrow-title"]) {
    const rule = css.match(new RegExp(`${sel.replace(".", "\\.")}[^{]*\\{([^}]*)\\}`));
    if (rule) assert.doesNotMatch(rule[1], /font-display|Long Cang/, sel);
  }
  assert.doesNotMatch(read("./scene/tally-face.mjs"), /Long Cang/, "the view-model carries no font");
});

// den-scene-v1/03: the noren sign replaced the visible pill; the anchor stays for screen readers.
test("station labels are non-interactive anchors with no visible pill", () => {
  const rule = css.match(/\.station-label\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(rule, /background/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.match(css, /--rice-paper:\s*#[0-9a-fA-F]{6}/);
});

test("the back-stall platforms are station-neutral stone, not panda ink", () => {
  const market = read("./scene/Market.jsx");
  const platform = market.match(/platform > 0 \? \(([\s\S]*?)\) : null/)[1];
  assert.match(platform, /color=\{STONE\}/);
  assert.doesNotMatch(platform, /INK/);
  assert.match(market, /const STONE = "#[0-9a-f]{6}"/);
});

test("the tally face canvas draws its heading in the display font", () => {
  assert.match(read("./scene/TallyFace.jsx"), /Long Cang/);
});

test("station labels are rendered by the chip layer from the pure model, anchored per stall", () => {
  assert.match(read("./scene/ChipLayer.jsx"), /station-label/);
  assert.match(read("./scene/ChipLayer.jsx"), /stationLabels\(/);
});
