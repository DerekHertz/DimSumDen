import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRows, perTicket } from "./usage-per-ticket.mjs";

const u = (ts, five_hour, weekly, extra = {}) => ({ kind: "usage", ts, five_hour, weekly, ...extra });
const r = (ts, ticket) => ({ kind: "resolved", ts, ticket });

test("peak % per ticket is computed per window, split where the reading drops", () => {
  const rows = [
    u("2026-09-29T01:00:00Z", 5, 60),
    u("2026-09-29T02:00:00Z", 40, 62),
    r("2026-09-29T02:10:00Z", "a/01"),
    r("2026-09-29T02:20:00Z", "a/02"),
    u("2026-09-29T02:30:00Z", 41, 63),
    u("2026-09-29T08:00:00Z", 4, 64),
    u("2026-09-29T09:00:00Z", 20, 65),
    r("2026-09-29T09:10:00Z", "a/03"),
    u("2026-09-29T09:20:00Z", 21, 66),
  ];
  const out = perTicket(rows);
  assert.equal(out.windows.length, 2);
  assert.deepEqual(out.windows.map((w) => [w.peak, w.resolved]), [[41, 2], [21, 1]]);
  assert.equal(out.fiveHourPerTicket, (41 + 21) / 3);
});

test("a resolve after the last reading still counts if it is within 5 hours of the window start", () => {
  const rows = [u("2026-09-29T01:00:00Z", 10, 1), u("2026-09-29T02:00:00Z", 30, 2), r("2026-09-29T03:00:00Z", "a/01"), r("2026-09-29T07:00:00Z", "a/02")];
  assert.equal(perTicket(rows).tickets, 1);
});

test("weekly points per ticket span the first to last weekly reading", () => {
  const rows = [
    u("2026-09-29T01:00:00Z", 5, 60),
    r("2026-09-29T01:10:00Z", "a/01"),
    r("2026-09-29T01:20:00Z", "a/02"),
    u("2026-09-29T02:00:00Z", 30, 62),
  ];
  assert.equal(perTicket(rows).weeklyPerTicket, 1);
});

test("a gap of more than 5 hours starts a new window even without a drop", () => {
  const rows = [u("2026-09-29T01:00:00Z", 10, 1), u("2026-09-29T07:00:00Z", 12, 1)];
  assert.equal(perTicket(rows).windows.length, 2);
});

test("a weekly reset counts as zero increase, not a negative", () => {
  const rows = [
    u("2026-09-29T01:00:00Z", 5, 90),
    u("2026-09-29T02:00:00Z", 20, 95),
    r("2026-09-29T02:10:00Z", "a/01"),
    u("2026-09-29T03:00:00Z", 25, 0),
    u("2026-09-29T04:00:00Z", 30, 5),
    r("2026-09-29T04:10:00Z", "a/02"),
    u("2026-09-29T04:20:00Z", 31, 5),
  ];
  assert.equal(perTicket(rows).weeklyPerTicket, 5);
});

test("codex-labelled rows and excluded ranges are skipped", () => {
  const rows = [
    u("2026-09-30T01:00:00Z", 10, 5, { source: "Codex user-reported" }),
    u("2026-09-30T02:00:00Z", 50, 6, { note: "codex" }),
    u("2026-09-30T03:00:00Z", 12, 7),
    u("2026-09-30T04:00:00Z", 90, 8),
    u("2026-09-30T05:00:00Z", 22, 9),
    r("2026-09-30T05:10:00Z", "a/01"),
  ];
  const out = perTicket(rows, { exclude: [["2026-09-30T03:30:00Z", "2026-09-30T04:30:00Z"]] });
  assert.deepEqual(out.windows.map((w) => w.peak), [22]);
});

test("--since and --until bound both usage and resolved rows", () => {
  const rows = [
    u("2026-09-28T01:00:00Z", 10, 1),
    r("2026-09-28T01:10:00Z", "a/01"),
    u("2026-09-30T01:00:00Z", 5, 2),
    u("2026-09-30T02:00:00Z", 25, 3),
    r("2026-09-30T02:10:00Z", "a/02"),
    u("2026-09-30T02:20:00Z", 30, 3),
  ];
  const out = perTicket(rows, { since: "2026-09-30T00:00:00Z" });
  assert.equal(out.windows.length, 1);
  assert.equal(out.tickets, 1);
  assert.equal(out.fiveHourPerTicket, 30);
});

test("malformed lines are ignored and no data gives null ratios", () => {
  assert.equal(parseRows('{"kind":"usage"}\nnot json\n\n').length, 1);
  const out = perTicket([]);
  assert.equal(out.fiveHourPerTicket, null);
  assert.equal(out.weeklyPerTicket, null);
});
