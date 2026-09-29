// organism-infra/44: scripts/context.mjs prints the main session's context size.
// Interface under test: `node scripts/context.mjs` run with HOME=<fixture> and
// cwd=<fixture project path>; it reads $HOME/.claude/projects/<cwd with every
// non-alphanumeric char replaced by "-">/ and prints JSON
// {session, context_tokens, percent}. Subagent transcripts live in
// <session>/subagents/ subdirectories and must be ignored.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "scripts", "context.mjs");

function fixture() {
  const home = realpathSync(mkdtempSync(path.join(tmpdir(), "ctx-home-")));
  const cwd = path.join(home, "work", "my.project");
  mkdirSync(cwd, { recursive: true });
  const projDir = path.join(home, ".claude", "projects", cwd.replace(/[^A-Za-z0-9]/g, "-"));
  mkdirSync(projDir, { recursive: true });
  return { home, cwd, projDir };
}

const asst = (u) => JSON.stringify({ type: "assistant", message: { role: "assistant", usage: u } });
const user = () => JSON.stringify({ type: "user", message: { role: "user", content: "hi" } });

function writeTranscript(file, lines, mtimeSec) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, lines.join("\n") + "\n");
  utimesSync(file, mtimeSec, mtimeSec);
}

function run({ home, cwd }) {
  const r = spawnSync("node", [SCRIPT], { cwd, env: { ...process.env, HOME: home }, encoding: "utf8" });
  return { ...r, json: r.status === 0 ? JSON.parse(r.stdout) : null };
}

test("prints context_tokens summed from the last assistant usage in a fixture transcript", () => {
  const f = fixture();
  writeTranscript(
    path.join(f.projDir, "sess-a.jsonl"),
    [
      user(),
      asst({ input_tokens: 1, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 999 }),
      user(),
      asst({ input_tokens: 10, cache_creation_input_tokens: 2000, cache_read_input_tokens: 30000, output_tokens: 500 }),
      user(),
    ],
    1000,
  );
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.session, "sess-a");
  assert.equal(r.json.context_tokens, 32010); // output_tokens excluded, earlier usage ignored
  assert.equal(typeof r.json.percent, "number");
  assert.ok(r.json.percent > 0 && r.json.percent <= 100);
});

test("picks the newest top-level session and ignores subagent transcripts", () => {
  const f = fixture();
  const usage = (n) => ({ input_tokens: n, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });
  writeTranscript(path.join(f.projDir, "old-sess.jsonl"), [asst(usage(111))], 1000);
  writeTranscript(path.join(f.projDir, "new-sess.jsonl"), [asst(usage(222))], 2000);
  // newest file of all, but a subagent transcript: must be ignored
  writeTranscript(path.join(f.projDir, "new-sess", "subagents", "agent-x.jsonl"), [asst(usage(999999))], 3000);
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.session, "new-sess");
  assert.equal(r.json.context_tokens, 222);
});

test("no transcript found exits 0 with context_tokens null", () => {
  const f = fixture(); // project dir exists but is empty
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.context_tokens, null);

  const noDir = { home: f.home, cwd: path.join(f.home, "elsewhere") };
  mkdirSync(noDir.cwd, { recursive: true }); // no matching projects dir at all
  const r2 = run(noDir);
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.json.context_tokens, null);
});
