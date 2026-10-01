// dimsumden-ui-v0/09: usage meter view-model. Designer spec 07 section 3 "Usage meter".
// Interface pinned: usageMeterModel(usage|null, nowMs) ->
//   { label, valueText, level: "ok"|"wind-down"|"at-limit"|"none", statusText, fillPercent, ariaValueNow, ariaValueText, secondary }
import { test } from "node:test";
import assert from "node:assert/strict";
import { usageMeterModel } from "./usage-meter-model.mjs";

const NOW = Date.parse("2026-09-29T06:00:00.000Z");
const usage = (fiveHour, weekly = 72, minutesAgo = 12) => ({
  fiveHour, weekly, sampledAt: new Date(NOW - minutesAgo * 60_000).toISOString(),
});

test("labels the meter and shows the percentage", () => {
  const m = usageMeterModel(usage(74), NOW);
  assert.equal(m.label, "Plan usage (5 h)");
  assert.equal(m.valueText, "74%");
  assert.equal(m.fillPercent, 74);
  assert.equal(m.ariaValueNow, 74);
  assert.equal(m.ariaValueText, "74 percent of 5-hour window");
});

test("secondary line gives weekly usage and sample age", () => {
  assert.equal(usageMeterModel(usage(74, 72, 12), NOW).secondary, "weekly 72% · sampled 12 min ago");
});

test("under 80 is ok with no status text", () => {
  const m = usageMeterModel(usage(79), NOW);
  assert.equal(m.level, "ok");
  assert.ok(!m.statusText);
});

test("80 to 94 is wind-down with text", () => {
  for (const v of [80, 94]) {
    const m = usageMeterModel(usage(v), NOW);
    assert.equal(m.level, "wind-down", String(v));
    assert.equal(m.statusText, "Wind down");
  }
});

test("95 and above is at-limit with text", () => {
  for (const v of [95, 100]) {
    const m = usageMeterModel(usage(v), NOW);
    assert.equal(m.level, "at-limit", String(v));
    assert.equal(m.statusText, "At limit");
  }
});

test("no sample shows 'not sampled' with no fill", () => {
  const m = usageMeterModel(null, NOW);
  assert.equal(m.valueText, "not sampled");
  assert.equal(m.level, "none");
  assert.equal(m.fillPercent, 0);
});

// den-scene-v1/05 (designer spec-2 section 2): the expanded Tally card shows the sample age on its own line.
test("sampledText is 'Sampled 12 min ago' on its own; secondary is unchanged for the sidebar slot", () => {
  const m = usageMeterModel(usage(74, 72, 12), NOW);
  assert.equal(m.sampledText, "Sampled 12 min ago");
  assert.equal(m.secondary, "weekly 72% · sampled 12 min ago");
});

test("no sample, or a sample with no timestamp, has no sampledText", () => {
  assert.equal(usageMeterModel(null, NOW).sampledText ?? null, null);
  assert.equal(usageMeterModel({ fiveHour: 50, weekly: 10 }, NOW).sampledText ?? null, null);
});
