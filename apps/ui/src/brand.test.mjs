// showcase-v1/05: the app is Dim Sum Den; Long Cang is display-only (scene labels, header title, board
// heading); UI copy and numbers stay Nunito. Source-shape checks over index.html and styles.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const html = read("../index.html");
const css = read("./styles.css");

test("page title and header read Dim Sum Den", () => {
  assert.match(html, /<title>Dim Sum Den<\/title>/);
  assert.match(read("./App.jsx"), /<h1[^>]*>Dim Sum Den<\/h1>/);
});

test("index.html loads Long Cang from Google Fonts, and only that display family", () => {
  assert.match(html, /<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Long\+Cang&display=swap"/);
  assert.match(html, /<link[^>]+rel="preconnect"[^>]+href="https:\/\/fonts\.gstatic\.com"/);
  assert.equal((html.match(/family=/g) ?? []).length, 1);
});

test("--font-display names Long Cang; --font-sans stays Nunito with no Long Cang", () => {
  assert.match(css, /--font-display:\s*"Long Cang"/);
  const sans = css.match(/--font-sans:[^;]+;/)[0];
  assert.match(sans, /Nunito/);
  assert.doesNotMatch(sans, /Long Cang/);
});

test("the display font is used only by header title, station labels and the board chip", () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => [sel.trim(), body]);
  const users = rules.filter(([, body]) => /font-family:\s*var\(--font-display\)/.test(body)).map(([sel]) => sel);
  const allowed = [".panel-header h1", ".station-label", ".chip-board"];
  for (const sel of users) assert.ok(allowed.includes(sel), `unexpected display-font rule: ${sel}`);
  for (const a of allowed) assert.ok(users.includes(a), `${a} uses the display font`);
});

test("no number or data text uses the display font", () => {
  for (const sel of [".meter-value", ".chart-value", ".chart-axis", ".gate-count", ".qrow-title"]) {
    const rule = css.match(new RegExp(`${sel.replace(".", "\\.")}[^{]*\\{([^}]*)\\}`));
    if (rule) assert.doesNotMatch(rule[1], /font-display|Long Cang/, sel);
  }
  assert.doesNotMatch(read("./scene/board-face.mjs"), /Long Cang/, "the view-model carries no font");
});

test("station labels sit on a rice-paper pill", () => {
  const rule = css.match(/\.station-label\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(rule, /border-radius:\s*var\(--radius-full\)/);
  assert.match(rule, /background:\s*var\(--rice-paper\)/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.match(css, /--rice-paper:\s*#[0-9a-fA-F]{6}/);
});

test("the board face canvas draws its heading in the display font", () => {
  assert.match(read("./scene/BoardFace.jsx"), /Long Cang/);
});

test("station labels are rendered by the chip layer from the pure model, anchored per stall", () => {
  assert.match(read("./scene/ChipLayer.jsx"), /station-label/);
  assert.match(read("./scene/ChipLayer.jsx"), /stationLabels\(/);
});
