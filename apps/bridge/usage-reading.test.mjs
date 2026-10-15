// Friction F19: the den reads plan usage from the shared cache and refreshes it when it is old, at most once per
// REFRESH_MS; a usage.jsonl row still wins when it is newer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createUsageReading, newerUsage, REFRESH_MS } from "./usage-reading.mjs";

const T = Date.parse("2026-10-15T15:00:00Z");
async function cache(at) {
  const file = path.join(await mkdtemp(path.join(tmpdir(), "den-usage-")), "usage-cache.json");
  await writeFile(file, JSON.stringify({ at, windows: { "5-hour": { percent: 26 }, weekly: { percent: 28 } }, cooldown_until: 0 }));
  return file;
}

test("a fresh cache is the reading, and nothing is refreshed", async () => {
  let refreshed = 0;
  const read = createUsageReading({ cacheFile: await cache(T - 60_000), refresh: () => refreshed++, now: () => T });
  assert.deepEqual(read(), { fiveHour: 26, weekly: 28, sampledAt: new Date(T - 60_000).toISOString() });
  assert.equal(refreshed, 0);
});

test("an old cache is still shown, and one refresh starts per REFRESH_MS however often it is read", async () => {
  let refreshed = 0;
  let now = T;
  const read = createUsageReading({ cacheFile: await cache(T - 9 * 3600_000), refresh: () => refreshed++, now: () => now });
  assert.equal(read().fiveHour, 26);
  read();
  read();
  assert.equal(refreshed, 1);
  now += REFRESH_MS + 1;
  read();
  assert.equal(refreshed, 2);
});

test("no cache is no reading, and a refresh is started", () => {
  let refreshed = 0;
  const read = createUsageReading({ cacheFile: path.join(tmpdir(), "no-such-dir-den", "usage-cache.json"), refresh: () => refreshed++, now: () => T });
  assert.equal(read(), null);
  assert.equal(refreshed, 1);
});

test("the newer reading wins", () => {
  const row = { fiveHour: 21, weekly: 46, sampledAt: "2026-10-12T21:46:33Z" };
  const live = { fiveHour: 26, weekly: 28, sampledAt: "2026-10-15T14:55:00.000Z" };
  assert.equal(newerUsage(row, live), live);
  assert.equal(newerUsage(live, row), live);
  assert.equal(newerUsage(null, live), live);
  assert.equal(newerUsage(row, null), row);
});
