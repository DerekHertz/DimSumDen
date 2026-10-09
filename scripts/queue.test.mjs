// organism-infra/212: scripts/queue.mjs, the board's queue as buckets and as a text kanban.
//
// Seam pinned by qa: the CLI. `node scripts/queue.mjs [--json]` with ORGANISM_ROOT as the board root
// (run from an unrelated cwd, so the env var is what picks the board). Exit 0, even on a bare or odd board.
//   --json prints one object { inFlight, ready, waitingOnUser, blocked, proposed }, each an array of rows.
//   Row fields (pinned):
//     every row   ref ("feature/NN-slug"), title (heading text after "NN: ", at most 60 chars; longer
//                 ones are cut and end in "…"), priority (number: "P1" -> 1; a ticket with no Priority
//                 line counts as 2)
//     inFlight    cell (first token of the lock; null when there is no lock), mode (third token of the
//                 lock when it is specify/verify, else null). A ticket is in flight when it has a lock
//                 file or its status is claimed or in-review, so a qa-specify lock on a
//                 ready-for-agent ticket is in flight and not ready.
//     blocked     blockedBy: array of the unresolved blocker refs (full refs). Status `blocked` with no
//                 unresolved blocker listed gives [].
//     ready       rank (only when the ticket is in the latest jev-order `actual` list): its 1-based
//                 position in that list, counting entries that are not ready. No `rank` key otherwise.
//     proposed    [{ ref, title, rank }]: the entries of the latest jev-order `actual` list that are
//                 ready right now, in list order. Empty when no usable jev-order row exists.
//   The latest jev-order row is the last one in .scratch/usage.jsonl. Non-JSON lines and other kinds
//   are skipped. A latest jev-order row whose `actual` is not an array gives no ranks.
//   Resolved, closed and parked tickets appear in no bucket.
//   Plain output prints four columns headed READY, IN FLIGHT, WAITING ON YOU, BLOCKED (in that order),
//   with proposed tickets marked ①②③… by rank.
//   package.json has an `queue` script that runs it (`npm run queue`).
//
// Criterion map: AC1 buckets          -> "AC1 ..."
//                AC2 proposed order   -> "AC2 ..."
//                AC3 titles           -> "AC3 ..."
//                AC5 npm run queue    -> "AC5 ..."
//                AC4 band             -> scripts/mods-queue.test.mjs
//                /queue slash command (.claude/commands/ file) -> human-verified (gated patch)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../apps/organism-infra/board-fixture.mjs";
import { boardRoot, ticket, usage } from "./queue-fixture.mjs";

const SCRIPT = path.join(REPO_ROOT, "scripts", "queue.mjs");
const run = (root, ...args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, ORGANISM_ROOT: root }, cwd: tmpdir(), encoding: "utf8", timeout: 20000 });
const readJson = (root) => {
  const r = run(root, "--json");
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const refs = (rows) => rows.map((r) => r.ref);

function mixedBoard() {
  const root = boardRoot();
  ticket(root, "alpha/301-done", { status: "resolved", title: "Already shipped" });
  ticket(root, "alpha/302-second", { priority: "P2", title: "Second priority work" });
  ticket(root, "alpha/303-urgent", { priority: "P1", title: "Urgent work" });
  ticket(root, "beta/301-urgent-too", { priority: "P1", title: "Urgent in beta" });
  ticket(root, "alpha/304-critical", { priority: "P0", title: "Critical work" });
  ticket(root, "alpha/305-specifying", { title: "Being specified", lock: "qa 2026-10-09T01:25:07.351Z specify ready-for-agent" });
  ticket(root, "alpha/306-building", { status: "claimed", title: "Being built", lock: "developer 2026-10-09T02:00:00.000Z" });
  ticket(root, "alpha/307-reviewing", { status: "in-review", title: "In review, no lock" });
  ticket(root, "alpha/308-needs-you", { status: "ready-for-human", title: "Needs the user" });
  ticket(root, "alpha/309-stuck", { status: "blocked", title: "Stuck for a reason" });
  ticket(root, "alpha/310-waits", { blockedBy: "302", title: "Waits on the second", priority: "P1" });
  ticket(root, "alpha/311-unblocked", { blockedBy: "301 (shipped)", title: "Free since 301 shipped" });
  ticket(root, "alpha/312-cross", { blockedBy: "beta/301, alpha/301", title: "Waits on beta", priority: "P1" });
  ticket(root, "alpha/313-parked", { status: "parked", title: "Parked" });
  ticket(root, "alpha/314-closed", { status: "closed", title: "Closed" });
  return root;
}

test("AC1 ready holds the frontier sorted by priority, then feature, then number", () => {
  const q = readJson(mixedBoard());
  assert.deepEqual(refs(q.ready), [
    "alpha/304-critical", // P0
    "alpha/303-urgent", // P1, feature alpha before beta
    "beta/301-urgent-too",
    "alpha/302-second", // P2
    "alpha/311-unblocked", // no Priority counts as P2; number 311 after 302
  ]);
  assert.deepEqual(q.ready.map((r) => r.priority), [0, 1, 1, 2, 2]);
});

test("AC1 in flight holds locked and claimed or in-review tickets, with the holding cell and mode", () => {
  const q = readJson(mixedBoard());
  const byRef = Object.fromEntries(q.inFlight.map((r) => [r.ref, r]));
  assert.deepEqual(refs(q.inFlight).sort(), ["alpha/305-specifying", "alpha/306-building", "alpha/307-reviewing"]);
  assert.equal(byRef["alpha/305-specifying"].cell, "qa");
  assert.equal(byRef["alpha/305-specifying"].mode, "specify");
  assert.equal(byRef["alpha/306-building"].cell, "developer");
  assert.equal(byRef["alpha/306-building"].mode ?? null, null);
  assert.equal(byRef["alpha/307-reviewing"].cell ?? null, null, "no lock means no holding cell");
});

test("AC1 waiting on user holds ready-for-human tickets", () => {
  const q = readJson(mixedBoard());
  assert.deepEqual(refs(q.waitingOnUser), ["alpha/308-needs-you"]);
});

test("AC1 blocked holds status blocked, and ready-for-agent tickets with an unresolved blocker, naming it", () => {
  const q = readJson(mixedBoard());
  const byRef = Object.fromEntries(q.blocked.map((r) => [r.ref, r]));
  assert.deepEqual(refs(q.blocked).sort(), ["alpha/309-stuck", "alpha/310-waits", "alpha/312-cross"]);
  assert.deepEqual(byRef["alpha/310-waits"].blockedBy, ["alpha/302-second"]);
  assert.deepEqual(byRef["alpha/312-cross"].blockedBy, ["beta/301-urgent-too"], "the resolved blocker is not named");
  assert.deepEqual(byRef["alpha/309-stuck"].blockedBy, []);
});

test("AC1 resolved, closed and parked tickets are in no bucket", () => {
  const q = readJson(mixedBoard());
  const all = [...q.ready, ...q.inFlight, ...q.waitingOnUser, ...q.blocked].map((r) => r.ref);
  for (const gone of ["alpha/301-done", "alpha/313-parked", "alpha/314-closed"]) assert.ok(!all.includes(gone), gone);
  assert.equal(new Set(all).size, all.length, "a ticket sits in one bucket");
});

test("AC1 a board with no .scratch tickets prints empty buckets and exits 0", () => {
  const q = readJson(boardRoot());
  assert.deepEqual(q, { inFlight: [], ready: [], waitingOnUser: [], blocked: [], proposed: [] });
});

test("AC2 proposed and rank come from the latest jev-order row, skipping other kinds and junk lines", () => {
  const root = mixedBoard();
  usage(root, [
    { kind: "jev-order", ts: "2026-10-08T00:00:00.000Z", actual: ["alpha/302-second", "alpha/303-urgent"] },
    "this line is not json",
    {
      kind: "jev-order",
      ts: "2026-10-09T01:00:00.000Z",
      actual: ["beta/301-urgent-too", "gone/999-not-on-the-board", "alpha/303-urgent", "alpha/305-specifying", "alpha/302-second"],
    },
    { kind: "incident", ts: "2026-10-09T02:00:00.000Z", tool: "Bash" },
    "{ broken json",
  ]);
  const q = readJson(root);
  const rank = Object.fromEntries(q.ready.map((r) => [r.ref, r.rank]));
  assert.equal(rank["beta/301-urgent-too"], 1);
  assert.equal(rank["alpha/303-urgent"], 3);
  assert.equal(rank["alpha/302-second"], 5);
  assert.equal(rank["alpha/304-critical"], undefined, "a ready ticket outside the list has no rank");
  assert.equal(rank["alpha/311-unblocked"], undefined);
  assert.deepEqual(
    q.proposed.map((p) => [p.ref, p.rank]),
    [["beta/301-urgent-too", 1], ["alpha/303-urgent", 3], ["alpha/302-second", 5]],
    "ready entries only (the in-flight and unknown refs drop out), in list order",
  );
  assert.equal(q.proposed[0].title, "Urgent in beta");
  // The ready order itself stays board priority, not the proposed order.
  assert.deepEqual(refs(q.ready).slice(0, 2), ["alpha/304-critical", "alpha/303-urgent"]);
});

test("AC2 no usage.jsonl means no proposed order and no ranks, not a crash", () => {
  const q = readJson(mixedBoard());
  assert.deepEqual(q.proposed, []);
  assert.ok(q.ready.every((r) => !("rank" in r) || r.rank === undefined));
});

test("AC2 a latest jev-order row with a malformed actual means no ranks, not a crash", () => {
  for (const bad of ["alpha/303-urgent", null, { 0: "alpha/303-urgent" }, 7]) {
    const root = mixedBoard();
    usage(root, [
      { kind: "jev-order", ts: "2026-10-08T00:00:00.000Z", actual: ["alpha/303-urgent"] },
      { kind: "jev-order", ts: "2026-10-09T00:00:00.000Z", actual: bad },
    ]);
    const q = readJson(root);
    assert.deepEqual(q.proposed, [], JSON.stringify(bad));
    assert.ok(q.ready.every((r) => r.rank === undefined), JSON.stringify(bad));
    assert.equal(q.ready.length, 5);
  }
});

test("AC2 a latest jev-order row with no actual key, or entries that are not strings, means no crash and no bogus ranks", () => {
  const root = mixedBoard();
  usage(root, [{ kind: "jev-order", ts: "2026-10-09T00:00:00.000Z" }]);
  assert.deepEqual(readJson(root).proposed, []);
  usage(root, [{ kind: "jev-order", ts: "2026-10-09T00:00:00.000Z", actual: [42, null, "alpha/303-urgent"] }]);
  const q = readJson(root);
  assert.deepEqual(q.proposed.map((p) => p.ref), ["alpha/303-urgent"]);
  assert.equal(q.proposed[0].rank, 3);
});

test("AC3 titles come from the ticket heading, not the slug", () => {
  const root = boardRoot();
  ticket(root, "alpha/320-some-slug", { title: "A readable heading" });
  const q = readJson(root);
  assert.equal(q.ready[0].title, "A readable heading");
});

test("AC3 a long heading is truncated to 60 characters with an ellipsis; a short one is left alone", () => {
  const root = boardRoot();
  const long = "Word ".repeat(40).trim();
  ticket(root, "alpha/321-long", { title: long });
  ticket(root, "alpha/322-short", { title: "Short one" });
  const q = readJson(root);
  const byRef = Object.fromEntries(q.ready.map((r) => [r.ref, r]));
  assert.ok(byRef["alpha/321-long"].title.length <= 60, byRef["alpha/321-long"].title);
  assert.ok(byRef["alpha/321-long"].title.endsWith("…"));
  assert.ok(byRef["alpha/321-long"].title.startsWith("Word Word"));
  assert.equal(byRef["alpha/322-short"].title, "Short one");
});

test("AC5 plain output prints the four columns in order, with every bucket's tickets", () => {
  const out = run(mixedBoard());
  assert.equal(out.status, 0, out.stderr);
  const text = out.stdout;
  const at = ["READY", "IN FLIGHT", "WAITING ON YOU", "BLOCKED"].map((h) => text.indexOf(h));
  assert.ok(at.every((i) => i >= 0), `all four headings present in:\n${text}`);
  assert.deepEqual([...at].sort((a, b) => a - b), at, "headings in order READY, IN FLIGHT, WAITING ON YOU, BLOCKED");
  for (const needle of ["Critical work", "Being specified", "Being built", "Needs the user", "Stuck for a reason", "Waits on the second"]) {
    assert.ok(text.includes(needle), `${needle} is printed`);
  }
});

test("AC5 plain output marks proposed tickets with their rank, and only those", () => {
  const root = mixedBoard();
  usage(root, [{ kind: "jev-order", ts: "2026-10-09T01:00:00.000Z", actual: ["alpha/303-urgent", "alpha/304-critical", "alpha/302-second"] }]);
  const text = run(root).stdout;
  const line = (needle) => text.split("\n").find((l) => l.includes(needle)) ?? "";
  assert.match(line("Urgent work"), /①/);
  assert.match(line("Critical work"), /②/);
  assert.match(line("Second priority work"), /③/);
  assert.doesNotMatch(line("Urgent in beta"), /[①②③④⑤]/);
});

test("AC5 plain output with no usage.jsonl has no rank marks and still exits 0", () => {
  const out = run(mixedBoard());
  assert.equal(out.status, 0, out.stderr);
  assert.doesNotMatch(out.stdout, /[①②③④⑤⑥⑦⑧⑨⑩]/);
});

test("AC5 an empty board still prints the four headings", () => {
  const out = run(boardRoot());
  assert.equal(out.status, 0, out.stderr);
  for (const h of ["READY", "IN FLIGHT", "WAITING ON YOU", "BLOCKED"]) assert.ok(out.stdout.includes(h), h);
});

test("AC5 npm run queue is wired to scripts/queue.mjs", () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  assert.match(pkg.scripts.queue ?? "", /scripts\/queue\.mjs/);
});
