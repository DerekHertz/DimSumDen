// den-iso-v1/04 (qa bounce): the pad chip's label must fit inside its canvas. The first cut drew 800-weight 26 px text on a
// 320 px canvas and clipped both ends ("ibrary . coming onlin"). fitChipFont picks the largest font whose measured text fits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAD_CHIP_PX, fitChipFont } from "./pad-chip.mjs";
import { DORMANT_PADS } from "./banquet-layout.mjs";

// A stand-in for canvas measureText: text width is linear in the font size (0.62 em per glyph, a wide bold sans).
const measure = (text) => (font) => text.length * font * 0.62;

test("a label that already fits keeps the base font", () => {
  assert.equal(fitChipFont(measure("Drum"), PAD_CHIP_PX), PAD_CHIP_PX.font);
});

test("every dormant pad label fits inside the canvas minus its padding at the chosen font", () => {
  for (const pad of DORMANT_PADS) {
    const font = fitChipFont(measure(pad.label), PAD_CHIP_PX);
    assert.ok(measure(pad.label)(font) <= PAD_CHIP_PX.width - 2 * PAD_CHIP_PX.padX, `${pad.label} fits at ${font}px`);
  }
});

test("a label too wide for the base font shrinks it, and never below the floor", () => {
  const long = "Library · coming online";
  const font = fitChipFont(measure(long), PAD_CHIP_PX);
  assert.ok(font < PAD_CHIP_PX.font, "shrunk");
  assert.ok(font >= PAD_CHIP_PX.minFont, "not below the floor");
  assert.equal(fitChipFont(measure("x".repeat(200)), PAD_CHIP_PX), PAD_CHIP_PX.minFont);
});

test("the chosen font is the largest that fits (one pixel more would overflow)", () => {
  const text = "Library · coming online";
  const font = fitChipFont(measure(text), PAD_CHIP_PX);
  assert.ok(measure(text)(font + 1) > PAD_CHIP_PX.width - 2 * PAD_CHIP_PX.padX);
});
