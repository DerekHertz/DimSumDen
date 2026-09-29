// organism-infra/48: scripted usage rows. Two seams:
//   1. `board release <ref> --status resolved --pr <n>` appends one resolved row.
//   2. `scripts/log-cell.mjs` appends one validated cell row.
// All tests use a temp board root (makeBoardFixture); the live .scratch is never touched.
//
// Pinned contracts (the ticket leaves these open; the developer must follow them):
//   - usage file: <root>/.scratch/usage.jsonl, root = $ORGANISM_ROOT (else cwd), as jev.mjs.
//   - resolved row: {"kind":"resolved","ts":<ISO string>,"ticket":"<feature>/<NN-slug>","pr":<number|null>,"bounces":<int>}.
//   - bounce count source: the number of op:"comment" events for that ticket in
//     <root>/.scratch/events.jsonl whose `text` starts with "QA bounce" or "Security bounce"
//     (case-insensitive). Comments that merely mention the words later in the text do not count.
//     The developer documents this in ADR 0008.
//   - --pr: a positive integer. Required when the ticket's `**Type:**` is feature or bug (code
//     tickets); a missing or non-numeric --pr then fails, writes no row, and leaves the claim.
//     For other Types (e.g. design) --pr may be omitted and the row has pr:null.
//   - only --status resolved appends a resolved row; in-review/blocked releases append none.
//   - a failed release (gate refusal) appends no row.
//   - log-cell row: {"kind":"cell","ts":<ISO>,"ticket","cell","mode"(only if given),"tokens":<number>,"ms":<number>,"outcome":<string>}.
//     The ticket must exist at <root>/.scratch/<feature>/issues/<NN-slug>.md. tokens and ms must be
//     non-negative integers; outcome non-empty; --cell one of the known cell types
//     (product architect orchestrator developer scout debugger qa security designer).
//     Every rejection exits non-zero, explains on stderr, and writes nothing.
//
// Criterion map:
//   1 resolved row on release   -> "release --status resolved --pr ..." tests (row, one only, bounces, pr rules, no row otherwise)
//   2 log-cell valid/rejects    -> "log-cell ..." tests
//   3 ADR updated               -> the ADR 0008 test (names log-cell, the resolved row, bounce, events.jsonl)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { makeBoardFixture, runBoard, writeValidHandoff, REPO_ROOT } from "../apps/organism-infra/board-fixture.mjs";

const LOG_CELL = path.join(REPO_ROOT, "scripts", "log-cell.mjs");
const usagePath = (root) => path.join(root, ".scratch", "usage.jsonl");
const rows = (root) => {
  const p = usagePath(root);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
};
const codeTicket = (t) => `# ${t}\n\n**Type:** feature\n\n**Status:** ready-for-agent\n\n- [ ] criterion\n\n## Comments\n`;

async function claimAndReady(fx, cell = "orchestrator") {
  const c = await runBoard(["claim", fx.ticketRelPath, cell], { cwd: fx.worktree });
  assert.equal(c.code, 0, c.stderr);
  await writeValidHandoff(fx);
}
const resolve = (fx, ...extra) =>
  runBoard(["release", fx.ticketRelPath, "--status", "resolved", ...extra], {
    cwd: fx.worktree,
    env: { ORGANISM_ROOT: fx.root },
  });

// --- Criterion 1 ---

test("release --status resolved --pr appends exactly one well-formed resolved row", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    await claimAndReady(fx);
    const r = await resolve(fx, "--pr", "42");
    assert.equal(r.code, 0, r.stderr);
    const got = rows(fx.root).filter((x) => x.kind === "resolved");
    assert.equal(got.length, 1);
    assert.equal(got[0].ticket, "sample/01-do-thing");
    assert.strictEqual(got[0].pr, 42);
    assert.strictEqual(got[0].bounces, 0);
    assert.ok(!Number.isNaN(Date.parse(got[0].ts)), "ts is an ISO date");
    assert.deepEqual(Object.keys(got[0]).sort(), ["bounces", "kind", "pr", "ticket", "ts"]);
  } finally {
    await fx.cleanup();
  }
});

test("bounces counts QA and Security bounce comments from the board events, not incidental mentions", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    for (const text of [
      "QA bounce: test x fails",
      "QA pass",
      "Security bounce: HIGH finding",
      "qa bounce again",
      "Note: no QA bounce this time",
    ]) {
      const c = await runBoard(["comment", fx.ticketRelPath, text, "--as", "qa"], { cwd: fx.worktree });
      assert.equal(c.code, 0, c.stderr);
    }
    await claimAndReady(fx);
    const r = await resolve(fx, "--pr", "7");
    assert.equal(r.code, 0, r.stderr);
    const got = rows(fx.root).filter((x) => x.kind === "resolved");
    assert.equal(got.length, 1);
    assert.strictEqual(got[0].bounces, 3);
  } finally {
    await fx.cleanup();
  }
});

test("bounces ignore other tickets' comments", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    await writeFile(path.join(fx.root, ".scratch", "sample", "issues", "02-other.md"), codeTicket("02-other"));
    const c = await runBoard(["comment", "sample/02-other", "QA bounce: nope", "--as", "qa"], { cwd: fx.worktree });
    assert.equal(c.code, 0, c.stderr);
    await claimAndReady(fx);
    const r = await resolve(fx, "--pr", "7");
    assert.equal(r.code, 0, r.stderr);
    assert.strictEqual(rows(fx.root).find((x) => x.kind === "resolved").bounces, 0);
  } finally {
    await fx.cleanup();
  }
});

for (const bad of [[], ["--pr", "abc"], ["--pr", "0"], ["--pr", "-3"], ["--pr", "4.5"]]) {
  test(`code ticket: release resolved with ${bad.length ? bad.join(" ") : "no --pr"} fails, writes no row, keeps the claim`, async () => {
    const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
    try {
      await claimAndReady(fx);
      const r = await resolve(fx, ...bad);
      assert.notEqual(r.code, 0);
      assert.match(r.stderr, /pr/i);
      assert.equal(rows(fx.root).length, 0);
      const s = await runBoard(["status", fx.ticketRelPath], { cwd: fx.worktree, env: { ORGANISM_ROOT: fx.root } });
      assert.match(s.stdout, /claimed/);
    } finally {
      await fx.cleanup();
    }
  });
}

test("non-code ticket (Type: design) may resolve without --pr, row has pr:null", async () => {
  const fx = await makeBoardFixture({
    content: "# 01-do-thing\n\n**Type:** design\n\n**Status:** ready-for-agent\n\n## Comments\n",
  });
  try {
    await claimAndReady(fx, "architect");
    const r = await resolve(fx);
    assert.equal(r.code, 0, r.stderr);
    const got = rows(fx.root).filter((x) => x.kind === "resolved");
    assert.equal(got.length, 1);
    assert.strictEqual(got[0].pr, null);
  } finally {
    await fx.cleanup();
  }
});

test("release to in-review or blocked appends no resolved row", async () => {
  for (const status of ["in-review", "blocked"]) {
    const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
    try {
      await claimAndReady(fx, "developer");
      const r = await runBoard(["release", fx.ticketRelPath, "--status", status], {
        cwd: fx.worktree,
        env: { ORGANISM_ROOT: fx.root },
      });
      assert.equal(r.code, 0, r.stderr);
      assert.equal(rows(fx.root).filter((x) => x.kind === "resolved").length, 0, status);
    } finally {
      await fx.cleanup();
    }
  }
});

test("a gate-refused resolved release (no handoff) appends no row", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    const c = await runBoard(["claim", fx.ticketRelPath, "orchestrator"], { cwd: fx.worktree });
    assert.equal(c.code, 0, c.stderr);
    const r = await resolve(fx, "--pr", "5");
    assert.notEqual(r.code, 0);
    assert.equal(rows(fx.root).length, 0);
  } finally {
    await fx.cleanup();
  }
});

// --- Criterion 2 ---

function logCell(fx, args) {
  return spawnSync(process.execPath, [LOG_CELL, ...args], {
    cwd: fx.root,
    env: { ...process.env, ORGANISM_ROOT: fx.root },
    encoding: "utf8",
    timeout: 15000,
  });
}
const good = (fx) => [
  "--ticket", fx.ticketRelPath, "--cell", "qa", "--mode", "specify",
  "--tokens", "51234", "--ms", "184000", "--outcome", "tests written, red",
];
const without = (args, flag) => args.filter((x, i) => x !== flag && args[i - 1] !== flag);

test("log-cell appends one valid cell row", async () => {
  const fx = await makeBoardFixture();
  try {
    const r = logCell(fx, good(fx));
    assert.equal(r.status, 0, r.stderr);
    const got = rows(fx.root);
    assert.equal(got.length, 1);
    assert.equal(got[0].kind, "cell");
    assert.equal(got[0].ticket, "sample/01-do-thing");
    assert.equal(got[0].cell, "qa");
    assert.equal(got[0].mode, "specify");
    assert.strictEqual(got[0].tokens, 51234);
    assert.strictEqual(got[0].ms, 184000);
    assert.equal(got[0].outcome, "tests written, red");
    assert.ok(!Number.isNaN(Date.parse(got[0].ts)));
  } finally {
    await fx.cleanup();
  }
});

test("log-cell without --mode omits the mode key; two calls append two rows", async () => {
  const fx = await makeBoardFixture();
  try {
    const args = without(good(fx), "--mode").map((x) => (x === "qa" ? "developer" : x));
    assert.equal(logCell(fx, args).status, 0);
    assert.equal(logCell(fx, args).status, 0);
    const got = rows(fx.root);
    assert.equal(got.length, 2);
    assert.ok(!("mode" in got[0]));
  } finally {
    await fx.cleanup();
  }
});

const swap = (from, to) => (fx) => good(fx).map((x) => (x === from ? to : x));
const badCases = {
  "unknown ticket": (fx) => swap(fx.ticketRelPath, "sample/99-nope")(fx),
  "malformed ticket ref": (fx) => swap(fx.ticketRelPath, "../../etc/passwd")(fx),
  "non-numeric tokens": swap("51234", "lots"),
  "negative tokens": swap("51234", "-5"),
  "fractional ms": swap("184000", "1.5"),
  "non-numeric ms": swap("184000", "soon"),
  "unknown cell type": swap("qa", "wizard"),
  "empty outcome": swap("tests written, red", ""),
  "missing --tokens": (fx) => without(good(fx), "--tokens"),
  "missing --outcome": (fx) => without(good(fx), "--outcome"),
};
for (const [name, mk] of Object.entries(badCases)) {
  test(`log-cell rejects ${name} without writing`, async () => {
    const fx = await makeBoardFixture();
    try {
      const r = logCell(fx, mk(fx));
      assert.notEqual(r.status, 0);
      assert.ok(r.stderr.length > 0, "explains the rejection on stderr");
      assert.equal(existsSync(usagePath(fx.root)), false, "no usage file written");
    } finally {
      await fx.cleanup();
    }
  });
}

// --- Criterion 3 ---

test("ADR 0008 documents the scripted rows and where the bounce count comes from", () => {
  const dir = path.join(REPO_ROOT, "docs", "adr");
  const f = readdirSync(dir).find((n) => n.startsWith("0008-"));
  const text = readFileSync(path.join(dir, f), "utf8");
  assert.match(text, /log-cell/);
  assert.match(text, /resolved/i);
  assert.match(text, /bounce/i);
  assert.match(text, /events\.jsonl/);
});
