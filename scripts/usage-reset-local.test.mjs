// Ticket organism-infra/157: usage.mjs adds `resets_local` (the reset instant in the system time zone,
// with its abbreviation) next to the canonical `resets_at`, for the Claude and Codex adapters.
// Tests drive the public CLI with a fixed TZ; the network and the Codex app-server are local fakes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const USAGE = fileURLToPath(new URL("./usage.mjs", import.meta.url));
const LA = "America/Los_Angeles";
const TOKEN = ["reset", "local", "token", "synthetic"].join("-");

const FAKE_CODEX = `#!${process.execPath}
import { createInterface } from 'node:readline';
const send = (o) => process.stdout.write(JSON.stringify(o) + '\\n');
createInterface({ input: process.stdin }).on('line', (line) => {
  const req = JSON.parse(line);
  if (req.method === 'initialize') send({ id: req.id, result: { userAgent: 'fake-codex/1' } });
  if (req.method === 'account/rateLimits/read') {
    send({ id: req.id, result: JSON.parse(process.env.FAKE_RESPONSE) });
  }
});
`;

// Runs `usage.mjs` with a fixed TZ. `claude` is the raw API body (five_hour / seven_day);
// `codex` is the app-server result. Exactly one of them is used, chosen by `args`.
function run({ tz = LA, args = [], claude, codex }) {
  const root = mkdtempSync(path.join(tmpdir(), "usage-reset-local-"));
  try {
    const bin = path.join(root, "bin");
    mkdirSync(bin);
    mkdirSync(path.join(root, ".claude"));
    writeFileSync(path.join(root, ".claude", ".credentials.json"), JSON.stringify({ claudeAiOauth: { accessToken: TOKEN } }));
    writeFileSync(path.join(bin, "codex"), FAKE_CODEX, { mode: 0o755 });
    const preload = path.join(root, "preload.mjs");
    writeFileSync(preload, `globalThis.fetch = async () => new Response(${JSON.stringify(JSON.stringify(claude ?? {}))});`);
    const env = { ...process.env, TZ: tz, HOME: root, USERPROFILE: root, PATH: bin, TMPDIR: root, USAGE_CODEX_TIMEOUT_MS: "20000" };
    env.FAKE_RESPONSE = JSON.stringify(codex ?? {});
    delete env.CLAUDE_CODE_REMOTE;
    delete env.CODEX_HOME;
    const r = spawnSync(process.execPath, ["--import", pathToFileURL(preload).href, USAGE, ...args], { env, encoding: "utf8", timeout: 20000 });
    assert.equal(r.error, undefined, "CLI must finish inside the test deadline");
    assert.equal(r.status, 0, r.stderr);
    return { raw: r.stdout, body: JSON.parse(r.stdout) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const claudeBody = (five, week) => ({
  five_hour: { utilization: 10, resets_at: five },
  seven_day: { utilization: 20, resets_at: week },
});
const codexResult = (five, week) => ({
  rateLimits: {
    limitId: "codex", limitName: "Codex",
    primary: { usedPercent: 10, windowDurationMins: 300, resetsAt: five },
    secondary: { usedPercent: 20, windowDurationMins: 10080, resetsAt: week },
  },
});

test("AC1 claude: each window carries resets_local in the system zone with its abbreviation (PDT)", () => {
  const { body } = run({ claude: claudeBody("2026-09-30T20:26:40.000Z", "2026-10-05T11:33:20.000Z") });
  assert.equal(body["5-hour"].resets_local, "2026-09-30 13:26 PDT");
  assert.equal(body.weekly.resets_local, "2026-10-05 04:33 PDT");
});

test("AC1 claude: the ticket example, local midnight on a date boundary, reads 2026-10-06 00:00 PDT", () => {
  const { body } = run({ claude: claudeBody("2026-10-06T07:00:00.000Z", "2026-10-06T07:00:00.000Z") });
  assert.equal(body["5-hour"].resets_local, "2026-10-06 00:00 PDT");
});

test("AC1 codex: each window carries resets_local in the system zone with its abbreviation (PDT)", () => {
  const { body } = run({ args: ["--provider", "codex"], codex: codexResult(1790800000, 1791270000) });
  assert.equal(body["5-hour"].resets_local, "2026-09-30 13:26 PDT");
  assert.equal(body.weekly.resets_local, "2026-10-06 00:00 PDT");
});

test("AC2 claude: autumn DST change keeps the abbreviation honest, and the repeated 01:30 hour is told apart (PDT then PST)", () => {
  // US DST ended 2026-11-01 at 09:00Z: 01:30 happens twice.
  const { body } = run({ claude: claudeBody("2026-11-01T08:30:00.000Z", "2026-11-01T09:30:00.000Z") });
  assert.equal(body["5-hour"].resets_local, "2026-11-01 01:30 PDT");
  assert.equal(body.weekly.resets_local, "2026-11-01 01:30 PST");
});

test("AC2 claude: spring DST change skips 02:00 (PST to PDT)", () => {
  // US DST began 2026-03-08 at 10:00Z.
  const { body } = run({ claude: claudeBody("2026-03-08T09:59:00.000Z", "2026-03-08T10:00:00.000Z") });
  assert.equal(body["5-hour"].resets_local, "2026-03-08 01:59 PST");
  assert.equal(body.weekly.resets_local, "2026-03-08 03:00 PDT");
});

test("AC2 codex: DST change is converted the same way (PDT then PST)", () => {
  const { body } = run({ args: ["--provider", "codex"], codex: codexResult(1793521800, 1793525400) });
  assert.equal(body["5-hour"].resets_local, "2026-11-01 01:30 PDT");
  assert.equal(body.weekly.resets_local, "2026-11-01 01:30 PST");
});

test("AC2: the zone is the system zone, not a hard-coded one (TZ=UTC shows UTC)", () => {
  const { body } = run({ tz: "UTC", claude: claudeBody("2026-09-30T20:26:40.000Z", "2026-10-05T11:33:20.000Z") });
  assert.equal(body["5-hour"].resets_local, "2026-09-30 20:26 UTC");
  assert.equal(body.weekly.resets_local, "2026-10-05 11:33 UTC");
});

test("AC2 claude: a missing reset time stays unknown (resets_at null, resets_local null) and the other window is unaffected", () => {
  const { body } = run({ claude: { five_hour: { utilization: 10 }, seven_day: { utilization: 20, resets_at: "2026-10-05T11:33:20.000Z" } } });
  assert.equal(body["5-hour"].resets_at, null);
  assert.equal(body["5-hour"].resets_local, null);
  assert.equal(body.weekly.resets_local, "2026-10-05 04:33 PDT");
});

test("AC2 claude: an explicit null reset time stays unknown", () => {
  const { body } = run({ claude: claudeBody(null, null) });
  assert.equal(body["5-hour"].resets_at, null);
  assert.equal(body["5-hour"].resets_local, null);
  assert.equal(body.weekly.resets_local, null);
});

test("AC2 claude: an unparseable reset time stays unknown instead of crashing or printing 'Invalid Date'", () => {
  const { raw, body } = run({ claude: claudeBody("soon", "2026-10-05T11:33:20.000Z") });
  assert.equal(body["5-hour"].resets_at, "soon");
  assert.equal(body["5-hour"].resets_local, null);
  assert.ok(!raw.includes("Invalid"), raw);
});

test("AC1 claude: resets_at is passed through byte-for-byte, even when it is not in canonical ISO form", () => {
  const five = "2026-09-30T20:26:40Z";
  const week = "2026-10-05T11:33:20+00:00";
  const { raw, body } = run({ claude: claudeBody(five, week) });
  assert.equal(body["5-hour"].resets_at, five);
  assert.equal(body.weekly.resets_at, week);
  assert.ok(raw.includes(`"resets_at":${JSON.stringify(five)}`), raw);
  assert.ok(raw.includes(`"resets_at":${JSON.stringify(week)}`), raw);
  assert.equal(body["5-hour"].resets_local, "2026-09-30 13:26 PDT");
  assert.equal(body.weekly.resets_local, "2026-10-05 04:33 PDT");
});

test("AC1 codex: resets_at stays the canonical UTC ISO string, unchanged by the new field", () => {
  const { body } = run({ args: ["--provider", "codex"], codex: codexResult(1790800000, 1791270000) });
  assert.equal(body["5-hour"].resets_at, "2026-09-30T20:26:40.000Z");
  assert.equal(body.weekly.resets_at, "2026-10-06T07:00:00.000Z");
});

test("AC1: percent and every other existing key are unchanged; resets_local is the only added key", () => {
  const { body } = run({ claude: claudeBody("2026-09-30T20:26:40.000Z", "2026-10-05T11:33:20.000Z") });
  for (const w of [body["5-hour"], body.weekly]) {
    assert.deepEqual(Object.keys(w).sort(), ["percent", "resets_at", "resets_local"]);
  }
  assert.equal(body["5-hour"].percent, 10);
  assert.equal(body.weekly.percent, 20);
});
