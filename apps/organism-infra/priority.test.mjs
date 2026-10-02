// dimsumden-ui-v0/02: priority module. Seam: two pure functions exported from
// priority.mjs (ADR 0011 decision 3, "frontier").
//   parsePriority(ticketMarkdown) -> "P0" | "P1" | "P2" | "P3"
//   orderFrontier(candidates, handoffTimestamps)
//     candidates: [{ ref, priority, readySince }]  (readySince: ISO string)
//     handoffTimestamps: ISO strings, one per orchestrator handoff file
//     -> [{ ref, priority, effectivePriority, bumps, bumped }] in frontier order
// Rules under test: a ticket bumps one level per 3 orchestrator handoffs
// strictly newer than its readySince; P0 never bumps; order is effective
// priority, then readySince (oldest first), then ticket number.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePriority, orderFrontier } from "./priority.mjs";

const doc = (line) => `# 02: Some ticket\n\n**Type:** feature\n\n${line}\n\n**Status:** ready-for-agent\n`;

// Parse table: [name, markdown, expected]
const PARSE_TABLE = [
  ["P0", doc("**Priority:** P0"), "P0"],
  ["P1", doc("**Priority:** P1"), "P1"],
  ["P2", doc("**Priority:** P2"), "P2"],
  ["P3", doc("**Priority:** P3"), "P3"],
  ["missing line is P2", "# 02: t\n\n**Type:** feature\n\n**Status:** ready-for-agent\n", "P2"],
  ["empty document is P2", "", "P2"],
  ["out-of-range level P4 is P2", doc("**Priority:** P4"), "P2"],
  ["out-of-range level P9 is P2", doc("**Priority:** P9"), "P2"],
  ["word instead of level is P2", doc("**Priority:** urgent"), "P2"],
  ["empty value is P2", doc("**Priority:** "), "P2"],
  ["bare P without digit is P2", doc("**Priority:** P"), "P2"],
  ["unbolded label is not a priority line", doc("Priority: P0"), "P2"],
];
for (const [name, md, want] of PARSE_TABLE) {
  test(`parsePriority: ${name}`, () => {
    assert.equal(parsePriority(md), want);
  });
}

test("parsePriority: a Priority mention in the body does not override the header line", () => {
  const md = `# 02: t\n\n**Priority:** P1\n\n**Status:** ready-for-agent\n\n## Comments\n\n- raise to **Priority:** P0 someday\n`;
  assert.equal(parsePriority(md), "P1");
});

// Bump table. Ticket ready at T0; handoff timestamps relative to it.
const T0 = "2026-09-28T00:00:00.000Z";
const after = (n) => Array.from({ length: n }, (_, i) => `2026-09-28T0${i + 1}:00:00.000Z`);
const one = (priority, handoffs, readySince = T0) =>
  orderFrontier([{ ref: "f/01-a", priority, readySince }], handoffs)[0];

test("bump: 2 handoffs after readySince do not bump", () => {
  assert.deepEqual(one("P2", after(2)), {
    ref: "f/01-a", priority: "P2", effectivePriority: "P2", bumps: 0, bumped: false,
  });
});

test("bump: 3 handoffs after readySince bump P2 to P1", () => {
  assert.deepEqual(one("P2", after(3)), {
    ref: "f/01-a", priority: "P2", effectivePriority: "P1", bumps: 1, bumped: true,
  });
});

test("bump: P3 bumps to P2 and P1 bumps to P0", () => {
  assert.equal(one("P3", after(3)).effectivePriority, "P2");
  assert.equal(one("P1", after(3)).effectivePriority, "P0");
});

test("bump: P0 can never be bumped", () => {
  assert.deepEqual(one("P0", after(9)), {
    ref: "f/01-a", priority: "P0", effectivePriority: "P0", bumps: 0, bumped: false,
  });
});

test("bump: handoffs before readySince are not counted", () => {
  const before = ["2026-09-27T01:00:00.000Z", "2026-09-27T02:00:00.000Z", "2026-09-27T03:00:00.000Z"];
  assert.equal(one("P2", before).bumps, 0);
  // 2 before + 2 after: only the 2 after count, so still no bump
  assert.equal(one("P2", [...before.slice(0, 2), ...after(2)]).bumped, false);
});

test("bump: a handoff at exactly readySince is not counted (strictly after)", () => {
  assert.equal(one("P2", [T0, ...after(2)]).bumps, 0);
});

test("bump: unsorted handoff timestamps are counted the same", () => {
  assert.equal(one("P2", after(3).reverse()).bumps, 1);
});

test("bump: counts only the timestamps passed in (orchestrator handoffs are the caller's filter)", () => {
  // No handoffs at all means no bump.
  assert.equal(one("P2", []).bumps, 0);
});

// Frontier order.
const ISO = (h) => `2026-09-28T${String(h).padStart(2, "0")}:00:00.000Z`;

test("frontier order: priority, then oldest readySince, then ticket number", () => {
  const candidates = [
    { ref: "f/09-late-p2", priority: "P2", readySince: ISO(9) },
    { ref: "f/05-p3", priority: "P3", readySince: ISO(1) },
    { ref: "f/12-p0", priority: "P0", readySince: ISO(8) },
    { ref: "f/07-old-p2", priority: "P2", readySince: ISO(2) },
    { ref: "f/03-tie-b", priority: "P1", readySince: ISO(4) },
    { ref: "f/02-tie-a", priority: "P1", readySince: ISO(4) },
    { ref: "f/10-tie-c", priority: "P1", readySince: ISO(4) },
  ];
  const out = orderFrontier(candidates, []);
  assert.deepEqual(out.map((r) => r.ref), [
    "f/12-p0",
    "f/02-tie-a", // equal age: number 02 before 03 before 10 (numeric, not lexical)
    "f/03-tie-b",
    "f/10-tie-c",
    "f/07-old-p2",
    "f/09-late-p2",
    "f/05-p3",
  ]);
});

test("frontier order: numbers compare numerically across features", () => {
  const out = orderFrontier(
    [
      { ref: "b/100-x", priority: "P2", readySince: ISO(1) },
      { ref: "a/20-y", priority: "P2", readySince: ISO(1) },
    ],
    [],
  );
  assert.deepEqual(out.map((r) => r.ref), ["a/20-y", "b/100-x"]);
});

test("frontier order: equal age orders 99 before 100 whatever the input order", () => {
  const a = { ref: "f/99-a", priority: "P2", readySince: ISO(1) };
  const b = { ref: "f/100-b", priority: "P2", readySince: ISO(1) };
  assert.deepEqual(orderFrontier([a, b], []).map((r) => r.ref), ["f/99-a", "f/100-b"]);
  assert.deepEqual(orderFrontier([b, a], []).map((r) => r.ref), ["f/99-a", "f/100-b"]);
});

test("frontier order: sorts by effective priority, so a bumped P3 outranks a fresh P2", () => {
  const out = orderFrontier(
    [
      { ref: "f/02-fresh-p2", priority: "P2", readySince: ISO(20) },
      { ref: "f/01-old-p3", priority: "P3", readySince: ISO(1) },
    ],
    // 3 handoffs after ISO(1) but before ISO(20)'s ticket became ready
    [ISO(2), ISO(3), ISO(4)],
  );
  // old-p3 bumped to P2 (older than fresh-p2 at P2); fresh-p2 not bumped.
  assert.deepEqual(out.map((r) => [r.ref, r.effectivePriority, r.bumped]), [
    ["f/01-old-p3", "P2", true],
    ["f/02-fresh-p2", "P2", false],
  ]);
});

test("frontier order: a P1 bumped to P0 ties with a P0 and the older one leads",() => {
  const out = orderFrontier(
    [
      { ref: "f/01-p1", priority: "P1", readySince: ISO(1) },
      { ref: "f/02-p0", priority: "P0", readySince: ISO(23) },
    ],
    [ISO(2), ISO(3), ISO(4)],
  );
  // p1 bumps to P0 and is older, so it leads; p0 stays P0.
  assert.deepEqual(out.map((r) => r.ref), ["f/01-p1", "f/02-p0"]);
  assert.equal(out[0].effectivePriority, "P0");
});

test("frontier order: empty input gives an empty list and does not mutate its input", () => {
  assert.deepEqual(orderFrontier([], []), []);
  const input = [
    { ref: "f/02-b", priority: "P3", readySince: ISO(1) },
    { ref: "f/01-a", priority: "P0", readySince: ISO(1) },
  ];
  const copy = structuredClone(input);
  orderFrontier(input, []);
  assert.deepEqual(input, copy);
});
