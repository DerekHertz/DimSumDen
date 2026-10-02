// Acceptance tests for organism-infra/98: `board resolve <ref>... --pr N [--note "<text>"]`.
//
// Pinned contract (QA's reading of the ticket; the developer must follow it):
//   - resolve takes the claim as orchestrator, publishes an orchestrator handoff
//     to <main>/.scratch/<feature>/handoffs/<NN>-*.md whose State block has
//     ticket "<feature>/<NN-slug>", cell "orchestrator", current_step "resolved"
//     and the PR number somewhere in `artifacts`, then releases with
//     --status resolved --pr N (so the usage.jsonl resolved row is the one
//     release writes today).
//   - --pr is required for every resolve (code or not); a missing or invalid
//     value is refused and names "pr" on stderr.
//   - a ticket held by another cell is refused and the claim stays with its holder.
//   - a refusal on any ref in a batch changes none of them: no status change, no
//     lock, no handoff, no usage row, and events.jsonl is byte-identical.
//   - --note text lands in the ticket's comments or in the handoff.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { makeBoardFixture, runBoard, writeValidHandoff, ticketPath, claimLockPath, REPO_ROOT } from "./board-fixture.mjs";
import { validateState } from "./schemas.mjs";

const codeTicket = (t, status = "in-review") =>
  `# ${t}\n\n**Type:** feature\n\n**Status:** ${status}\n\n- [ ] criterion\n\n## Comments\n`;

const run = (fx, args) => runBoard(args, { cwd: fx.worktree, env: { ORGANISM_ROOT: fx.root } });
const resolveCmd = (fx, refs, ...extra) => run(fx, ["resolve", ...refs, ...extra]);

const usageRows = async (root) => {
  const raw = await readFile(path.join(root, ".scratch", "usage.jsonl"), "utf8").catch(() => "");
  return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l));
};
const resolvedRows = async (root) => (await usageRows(root)).filter((r) => r.kind === "resolved");
const eventsRaw = (root) => readFile(path.join(root, ".scratch", "events.jsonl"), "utf8").catch(() => "");
const handoffFiles = async (fx) =>
  (await readdir(path.join(fx.root, ".scratch", fx.feature, "handoffs")).catch(() => [])).sort();
const statusOf = (text) => /^\*\*Status:\*\*[ \t]*(\S+)/m.exec(text)?.[1];

async function stateOf(fx, name) {
  const text = await readFile(path.join(fx.root, ".scratch", fx.feature, "handoffs", name), "utf8");
  const m = /```json\s*([\s\S]*?)```/.exec(text);
  assert.ok(m, `handoff ${name} has a json State block`);
  return { state: JSON.parse(m[1]), text };
}

// Adds a second ticket to the fixture's feature (board reads the main checkout on disk).
async function addTicket(fx, ticket, status = "in-review") {
  await writeFile(ticketPath(fx.root, fx.feature, ticket), codeTicket(ticket, status), "utf8");
  return `${fx.feature}/${ticket}`;
}

// Snapshot of everything a refused resolve must leave alone.
async function snapshot(fx, tickets) {
  const out = { events: await eventsRaw(fx.root), usage: await usageRows(fx.root), handoffs: await handoffFiles(fx) };
  out.tickets = {};
  out.locks = {};
  for (const t of tickets) {
    out.tickets[t] = await readFile(ticketPath(fx.root, fx.feature, t), "utf8");
    out.locks[t] = await readFile(claimLockPath(fx.root, fx.feature, t), "utf8").catch(() => null);
  }
  return out;
}

// --- Criterion 1: resolve on an in-review ticket with no lock ---

test("resolve --pr N on an in-review ticket with no lock resolves it with an orchestrator handoff", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    const r = await resolveCmd(fx, [fx.ticketRelPath], "--pr", "42");
    assert.equal(r.code, 0, r.stderr);

    assert.equal(statusOf(await fx.readTicket()), "resolved");
    assert.equal(existsSync(fx.claimLockPath), false, "claim lock is released");

    const files = await handoffFiles(fx);
    assert.equal(files.length, 1, `exactly one published handoff, got ${files}`);
    assert.match(files[0], /^01-.*\.md$/);
    const { state } = await stateOf(fx, files[0]);
    assert.equal(validateState(state).ok, true, JSON.stringify(validateState(state)));
    assert.equal(state.ticket, "sample/01-do-thing");
    assert.equal(state.cell, "orchestrator");
    assert.equal(state.current_step, "resolved");
    assert.match(JSON.stringify(state.artifacts), /\b42\b/, "the PR is named in artifacts");

    const events = (await eventsRaw(fx.root)).split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const rel = events.filter((e) => e.op === "release" && e.kind !== "override");
    assert.equal(rel.length, 1);
    assert.equal(rel[0].cell, "orchestrator");
    assert.equal(rel[0].from_status, "claimed");
    assert.equal(rel[0].to_status, "resolved");
    assert.equal(events.some((e) => e.kind === "override"), false, "no --force override used");
  } finally {
    await fx.cleanup();
  }
});

test("resolve writes the same resolved row as the claim/handoff/release path (bounces included)", async () => {
  const viaResolve = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  const viaRelease = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    // A verdict comment needs a held claim, so seed the recorded events directly:
    // one bounce and one pass on each fixture's ticket.
    for (const fx of [viaResolve, viaRelease]) {
      const lines = ["bounce", "pass"].map((verdict, i) =>
        JSON.stringify({ seq: i + 1, ts: new Date().toISOString(), feature: fx.feature, ticket: fx.ticket, cell: "qa", op: "comment", verdict })
      );
      await mkdir(path.dirname(fx.eventsPath), { recursive: true });
      await writeFile(fx.eventsPath, lines.join("\n") + "\n", "utf8");
    }
    const a = await resolveCmd(viaResolve, [viaResolve.ticketRelPath], "--pr", "42");
    assert.equal(a.code, 0, a.stderr);

    const c = await run(viaRelease, ["claim", viaRelease.ticketRelPath, "orchestrator"]);
    assert.equal(c.code, 0, c.stderr);
    await writeValidHandoff(viaRelease);
    const b = await run(viaRelease, ["release", viaRelease.ticketRelPath, "--status", "resolved", "--pr", "42"]);
    assert.equal(b.code, 0, b.stderr);

    const rowA = await resolvedRows(viaResolve.root);
    const rowB = await resolvedRows(viaRelease.root);
    assert.equal(rowA.length, 1, "exactly one resolved row");
    assert.equal(rowB.length, 1);
    const { ts: tsA, ...restA } = rowA[0];
    const { ts: tsB, ...restB } = rowB[0];
    assert.ok(!Number.isNaN(Date.parse(tsA)), "ts is an ISO date");
    assert.deepEqual(restA, restB);
    assert.deepEqual(restA, { kind: "resolved", ticket: "sample/01-do-thing", pr: 42, bounces: 1 });
  } finally {
    await viaResolve.cleanup();
    await viaRelease.cleanup();
  }
});

test("resolve --note records the note text on the ticket or in the handoff", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    const r = await resolveCmd(fx, [fx.ticketRelPath], "--pr", "9", "--note", "merged green, squash");
    assert.equal(r.code, 0, r.stderr);
    const files = await handoffFiles(fx);
    const handoffText = files.length ? (await stateOf(fx, files[0])).text : "";
    const combined = (await fx.readTicket()) + "\n" + handoffText;
    assert.match(combined, /merged green, squash/);
  } finally {
    await fx.cleanup();
  }
});

// --- Criterion 2: refusals change nothing ---

test("resolve on a ticket locked by another cell is refused, the lock stays, nothing is written", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing", "ready-for-agent") });
  try {
    const c = await run(fx, ["claim", fx.ticketRelPath, "developer"]);
    assert.equal(c.code, 0, c.stderr);
    const before = await snapshot(fx, [fx.ticket]);

    const r = await resolveCmd(fx, [fx.ticketRelPath], "--pr", "5");
    assert.notEqual(r.code, 0);
    assert.doesNotMatch(r.stderr, /unknown command/i);
    assert.match(r.stderr, /claim|developer|held/i);
    assert.deepEqual(await snapshot(fx, [fx.ticket]), before);
    assert.match(before.locks[fx.ticket], /^developer\b/, "the developer still holds the lock");
  } finally {
    await fx.cleanup();
  }
});

for (const bad of [[], ["--pr", "abc"], ["--pr", "0"], ["--pr", "-3"], ["--pr", "4.5"]]) {
  test(`resolve with ${bad.length ? bad.join(" ") : "no --pr"} is refused and changes nothing`, async () => {
    const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
    try {
      const before = await snapshot(fx, [fx.ticket]);
      const r = await resolveCmd(fx, [fx.ticketRelPath], ...bad);
      assert.notEqual(r.code, 0);
      assert.doesNotMatch(r.stderr, /unknown command/i);
      assert.match(r.stderr, /\bpr\b/i);
      assert.deepEqual(await snapshot(fx, [fx.ticket]), before);
      assert.equal(statusOf(before.tickets[fx.ticket]), "in-review");
      assert.equal(before.locks[fx.ticket], null);
    } finally {
      await fx.cleanup();
    }
  });
}

// --- Criterion 3: batch ---

test("several refs with one --pr resolve every ticket in the batch", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    const second = await addTicket(fx, "02-other-thing");
    const r = await resolveCmd(fx, [fx.ticketRelPath, second], "--pr", "77");
    assert.equal(r.code, 0, r.stderr);

    for (const t of ["01-do-thing", "02-other-thing"]) {
      assert.equal(statusOf(await readFile(ticketPath(fx.root, fx.feature, t), "utf8")), "resolved", t);
      assert.equal(existsSync(claimLockPath(fx.root, fx.feature, t)), false, `${t} lock released`);
    }
    const files = await handoffFiles(fx);
    for (const nn of ["01", "02"]) {
      const mine = files.filter((f) => f.startsWith(`${nn}-`));
      assert.equal(mine.length, 1, `one handoff for ${nn}, got ${files}`);
      const { state } = await stateOf(fx, mine[0]);
      assert.equal(state.ticket, nn === "01" ? "sample/01-do-thing" : "sample/02-other-thing");
      assert.equal(state.cell, "orchestrator");
      assert.equal(state.current_step, "resolved");
      assert.match(JSON.stringify(state.artifacts), /\b77\b/);
    }
    const rows = await resolvedRows(fx.root);
    assert.deepEqual(
      rows.map((x) => [x.ticket, x.pr]).sort(),
      [["sample/01-do-thing", 77], ["sample/02-other-thing", 77]]
    );
  } finally {
    await fx.cleanup();
  }
});

for (const order of ["refused ref last", "refused ref first"]) {
  test(`batch with a ticket locked by another cell (${order}) changes none of the tickets`, async () => {
    const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
    try {
      const other = await addTicket(fx, "02-other-thing");
      const c = await run(fx, ["claim", other, "developer"]);
      assert.equal(c.code, 0, c.stderr);
      const before = await snapshot(fx, ["01-do-thing", "02-other-thing"]);

      const refs = order === "refused ref last" ? [fx.ticketRelPath, other] : [other, fx.ticketRelPath];
      const r = await resolveCmd(fx, refs, "--pr", "77");
      assert.notEqual(r.code, 0);
      assert.doesNotMatch(r.stderr, /unknown command/i);
      assert.match(r.stderr, /claim|developer|held/i);
      assert.deepEqual(await snapshot(fx, ["01-do-thing", "02-other-thing"]), before);
      assert.equal(before.locks["01-do-thing"], null, "the clean ticket was not claimed");
    } finally {
      await fx.cleanup();
    }
  });
}

test("batch with a ref that does not exist changes none of the tickets", async () => {
  const fx = await makeBoardFixture({ content: codeTicket("01-do-thing") });
  try {
    const before = await snapshot(fx, ["01-do-thing"]);
    const r = await resolveCmd(fx, [fx.ticketRelPath, "sample/09-missing"], "--pr", "77");
    assert.notEqual(r.code, 0);
    assert.doesNotMatch(r.stderr, /unknown command/i);
    assert.match(r.stderr, /not found|09-missing/i);
    assert.deepEqual(await snapshot(fx, ["01-do-thing"]), before);
  } finally {
    await fx.cleanup();
  }
});

// --- Criterion 4: docs (the existing claim/handoff/release path is covered by the
// scripts/usage-rows.test.mjs and board-release-*.test.mjs suites, and by the
// "same resolved row" test above, which drives it end to end) ---

test("docs/agents/issue-tracker.md documents `board resolve`", async () => {
  const doc = await readFile(path.join(REPO_ROOT, "docs", "agents", "issue-tracker.md"), "utf8");
  assert.match(doc, /board resolve/);
  const line = doc.split("\n").find((l) => /board resolve/.test(l)) ?? "";
  assert.match(line, /--pr/, "the command's documented line names --pr");
});
