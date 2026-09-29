// organism-infra/32: cloud usage estimate from session transcripts.
// Interfaces under test (all fixture-based; no real ~/.claude or .scratch is read):
//   node scripts/usage-estimate.mjs   run with HOME=<fixture>, cwd=<fixture project>,
//     USAGE_LOG=<fixture usage.jsonl>. Sums price-weighted tokens (input 1, cache write
//     1.25, cache read 0.1, output 5) over every *.jsonl under
//     $HOME/.claude/projects/<cwd slug>/ (subagent transcripts included) and prints
//     {source:"estimate", weighted_tokens, tokens_per_credit, credits_used_est,
//      credits_left_est, last_reading:{ts,cloud_credits}|null}.
//     weighted_tokens = all transcripts, all time. Readings = usage.jsonl rows with a
//     numeric cloud_credits (cloud_credits_est rows are not readings).
//     tokens_per_credit = weighted tokens with ts in [first reading, last reading]
//     divided by (first credits - last credits). credits_used_est = weighted tokens
//     after the last reading / tokens_per_credit; credits_left_est = last credits - used.
//     Fewer than two readings, or no drop: tokens_per_credit and the credit fields null.
//   node scripts/usage.mjs            no credentials + CLAUDE_CODE_REMOTE set: prints the
//     estimate JSON and exits 0. Otherwise unchanged (exit 1, "usage:" on stderr).
//   node scripts/context.mjs          CLAUDE_CODE_SESSION_ID selects this session's
//     transcript, found under any project dir (the cwd may be a worktree whose slug has
//     no transcripts), even when another session's transcript is newer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const script = (n) => path.join(ROOT, "scripts", n);

function fixture() {
  const home = realpathSync(mkdtempSync(path.join(tmpdir(), "est-home-")));
  const cwd = path.join(home, "work", "my.project");
  mkdirSync(cwd, { recursive: true });
  const projDir = path.join(home, ".claude", "projects", cwd.replace(/[^A-Za-z0-9]/g, "-"));
  mkdirSync(projDir, { recursive: true });
  return { home, cwd, projDir, log: path.join(home, "usage.jsonl") };
}

const asst = (ts, u) => JSON.stringify({ type: "assistant", timestamp: ts, message: { role: "assistant", usage: u } });
const u = (input, cw, cr, out) => ({
  input_tokens: input,
  cache_creation_input_tokens: cw,
  cache_read_input_tokens: cr,
  output_tokens: out,
});

function write(file, lines) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, lines.join("\n") + "\n");
}

function transcripts(f) {
  write(path.join(f.projDir, "sess-a.jsonl"), [
    JSON.stringify({ type: "user", timestamp: "2026-09-29T20:29:00Z", message: { role: "user", content: "hi" } }),
    "{not json",
    asst("2026-09-29T19:00:00Z", u(1000, 0, 0, 0)), // 1000, before the window
    asst("2026-09-29T20:30:00Z", u(1000, 800, 10000, 200)), // 1000+1000+1000+1000 = 4000
    asst("2026-09-29T21:30:00Z", u(500, 400, 5000, 100)), // 500+500+500+500 = 2000, after last reading
  ]);
  write(path.join(f.projDir, "sess-a", "subagents", "agent-x.jsonl"), [
    asst("2026-09-29T20:45:00Z", u(2000, 0, 0, 400)), // 2000+2000 = 4000
  ]);
}

const readings = [
  JSON.stringify({ kind: "retro", ts: "2026-09-29T19:30:00Z", items: 3 }),
  JSON.stringify({ kind: "usage", ts: "2026-09-29T19:59:00Z", five_hour: null, cloud_credits: null }),
  JSON.stringify({ kind: "usage", ts: "2026-09-29T20:00:00Z", cloud_credits: 60 }),
  JSON.stringify({ kind: "usage", ts: "2026-09-29T20:50:00Z", cloud_credits_est: 55 }), // not a reading
  JSON.stringify({ kind: "usage", ts: "2026-09-29T21:00:00Z", cloud_credits: 50 }),
];

function runEstimate(f) {
  const r = spawnSync("node", [script("usage-estimate.mjs")], {
    cwd: f.cwd,
    env: { ...process.env, HOME: f.home, USAGE_LOG: f.log },
    encoding: "utf8",
  });
  return { ...r, json: r.status === 0 ? JSON.parse(r.stdout) : null };
}

test("estimate matches the hand-computed value from fixture transcripts and readings", () => {
  const f = fixture();
  transcripts(f);
  write(f.log, readings);
  const r = runEstimate(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.source, "estimate");
  assert.equal(r.json.weighted_tokens, 11000); // 1000 + 4000 + 2000 + 4000
  assert.equal(r.json.tokens_per_credit, 800); // 8000 weighted in window / 10 credits
  assert.equal(r.json.credits_used_est, 2.5); // 2000 after last reading / 800
  assert.equal(r.json.credits_left_est, 47.5); // 50 - 2.5
  assert.deepEqual(r.json.last_reading, { ts: "2026-09-29T21:00:00Z", cloud_credits: 50 });
});

test("with no readings it prints weighted tokens and a null credit estimate", () => {
  const f = fixture();
  transcripts(f);
  write(f.log, [JSON.stringify({ kind: "retro", ts: "2026-09-29T19:30:00Z" })]);
  const r = runEstimate(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.source, "estimate");
  assert.equal(r.json.weighted_tokens, 11000);
  assert.equal(r.json.tokens_per_credit, null);
  assert.equal(r.json.credits_used_est, null);
  assert.equal(r.json.credits_left_est, null);
  assert.equal(r.json.last_reading, null);
});

test("a missing usage log behaves like no readings", () => {
  const f = fixture();
  transcripts(f); // f.log never written
  const r = runEstimate(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.weighted_tokens, 11000);
  assert.equal(r.json.credits_left_est, null);
});

function runUsage(f, env) {
  const clean = { ...process.env, HOME: f.home, USAGE_LOG: f.log };
  delete clean.CLAUDE_CODE_REMOTE;
  return spawnSync("node", [script("usage.mjs")], { cwd: f.cwd, env: { ...clean, ...env }, encoding: "utf8" });
}

test("usage.mjs falls back to the estimate when credentials are missing in cloud", () => {
  const f = fixture();
  transcripts(f);
  write(f.log, readings);
  const r = runUsage(f, { CLAUDE_CODE_REMOTE: "true" });
  assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.equal(j.source, "estimate");
  assert.equal(j.weighted_tokens, 11000);
  assert.equal(j.credits_left_est, 47.5);
});

test("usage.mjs is unchanged locally: no credentials still exits 1 with a usage: error", () => {
  const f = fixture();
  transcripts(f);
  write(f.log, readings);
  const r = runUsage(f, {});
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^usage: /);
  assert.equal(r.stdout, "");
});

function runContext(f, env, cwd = f.cwd) {
  const r = spawnSync("node", [script("context.mjs")], {
    cwd,
    env: { ...process.env, HOME: f.home, ...env },
    encoding: "utf8",
  });
  return { ...r, json: r.status === 0 ? JSON.parse(r.stdout) : null };
}

test("context.mjs reports this session's context via CLAUDE_CODE_SESSION_ID, not the newest transcript", () => {
  const f = fixture();
  write(path.join(f.projDir, "mine.jsonl"), [asst("2026-09-29T20:00:00Z", u(10, 200, 3000, 5))]);
  write(path.join(f.projDir, "other.jsonl"), [asst("2026-09-29T20:01:00Z", u(999999, 0, 0, 0))]);
  utimesSync(path.join(f.projDir, "mine.jsonl"), 1000, 1000);
  utimesSync(path.join(f.projDir, "other.jsonl"), 2000, 2000); // newer, but not this session
  const r = runContext(f, { CLAUDE_CODE_SESSION_ID: "mine" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.session, "mine");
  assert.equal(r.json.context_tokens, 3210);
});

test("context.mjs finds this session's transcript when cwd is a worktree with no project dir of its own", () => {
  const f = fixture(); // transcript lives under f.cwd's slug
  write(path.join(f.projDir, "mine.jsonl"), [asst("2026-09-29T20:00:00Z", u(10, 200, 3000, 5))]);
  const wt = path.join(f.cwd, ".claude", "worktrees", "agent-1");
  mkdirSync(wt, { recursive: true }); // slug dir for wt does not exist
  const r = runContext(f, { CLAUDE_CODE_SESSION_ID: "mine" }, wt);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.session, "mine");
  assert.equal(r.json.context_tokens, 3210);
});
