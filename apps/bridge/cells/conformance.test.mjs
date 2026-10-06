// Tests for the testable parts of the conformance script (ticket organism-infra/105):
// argument building, the child environment allowlist, message shapes, and the go or no-go
// evaluation of captured stream-json output. A live `claude` is never started here, except a
// scripted fake binary that exercises the harness.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, chmodSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  FORBIDDEN_FLAGS,
  buildArgs,
  buildChildEnv,
  userMessageLine,
  controlResponseLine,
  parseCaptureLines,
  evaluateS1,
  evaluateS2,
  evaluateS3,
  evaluateS4,
  evaluateS5,
  evaluateS6,
  evaluateS7,
  parseCli,
  runSpikes,
  SPIKES,
} from "./conformance.mjs";

const SID = "11111111-2222-4333-8444-555555555555";

// Capture helpers: a capture is { lines: [{ t, obj }], exit: { code, signal, t }|null, stderr }.
const L = (t, obj) => ({ t, obj });
const init = (t = 100, extra = {}) => L(t, { type: "system", subtype: "init", session_id: SID, ...extra });
const toolUse = (t, name, input, id = "tu1", extra = {}) =>
  L(t, { type: "assistant", message: { content: [{ type: "tool_use", id, name, input }] }, ...extra });
const toolResult = (t, id, content, isError = false, extra = {}) =>
  L(t, { type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, content, is_error: isError }] }, ...extra });
const text = (t, s) => L(t, { type: "assistant", message: { content: [{ type: "text", text: s }] } });
const result = (t, s, extra = {}) => L(t, { type: "result", subtype: "success", is_error: false, result: s, session_id: SID, ...extra });
const cap = (lines, exit = { code: 0, signal: null, t: 5000 }, stderr = "") => ({ lines, exit, stderr });

test("buildArgs: headless stream-json shape with session id and agent", () => {
  const args = buildArgs({ sessionId: SID, agent: "probe" });
  assert.deepEqual(args.slice(0, 1), ["-p"]);
  const flag = (name) => args[args.indexOf(name) + 1];
  assert.equal(flag("--input-format"), "stream-json");
  assert.equal(flag("--output-format"), "stream-json");
  assert.ok(args.includes("--verbose"));
  assert.equal(flag("--session-id"), SID);
  assert.equal(flag("--agent"), "probe");
  assert.ok(!args.includes("--resume"));
});

test("buildArgs: resume replaces session id; permission prompt tool, settings and allowed tools pass through", () => {
  const args = buildArgs({ resume: SID, permissionPromptTool: "stdio", settings: "/x/s.json", allowedTools: ["Bash(sleep 3)", "Read"], model: "haiku" });
  const flag = (name) => args[args.indexOf(name) + 1];
  assert.equal(flag("--resume"), SID);
  assert.ok(!args.includes("--session-id"));
  assert.equal(flag("--permission-prompt-tool"), "stdio");
  assert.equal(flag("--settings"), "/x/s.json");
  assert.equal(flag("--allowedTools"), "Bash(sleep 3),Read");
  assert.equal(flag("--model"), "haiku");
});

test("buildArgs: never constructs a permission-broadening flag", () => {
  assert.deepEqual(
    [...FORBIDDEN_FLAGS].sort(),
    ["--allow-dangerously-skip-permissions", "--dangerously-skip-permissions", "--permission-mode"].sort(),
  );
  for (const flag of FORBIDDEN_FLAGS) {
    assert.throws(() => buildArgs({ sessionId: SID, extraArgs: [flag, "bypassPermissions"] }), /forbidden/i);
  }
  const args = buildArgs({ sessionId: SID, agent: "probe", permissionPromptTool: "stdio", allowedTools: ["Read"] });
  for (const flag of FORBIDDEN_FLAGS) assert.ok(!args.includes(flag));
  assert.ok(!args.some((a) => /bypassPermissions/.test(a)));
});

test("buildChildEnv: allowlist keeps PATH, HOME, locale and DEN_CLAUDE_BIN; drops the canary and everything else", () => {
  const env = buildChildEnv({
    PATH: "/bin",
    HOME: "/h",
    LANG: "en_US.UTF-8",
    LC_ALL: "C",
    DEN_CLAUDE_BIN: "/opt/claude",
    DEN_CONFORMANCE_CANARY: "secret-canary",
    ANTHROPIC_API_KEY: "sk-nope",
    SSH_AUTH_SOCK: "/s",
  });
  assert.deepEqual(env, { PATH: "/bin", HOME: "/h", LANG: "en_US.UTF-8", LC_ALL: "C", DEN_CLAUDE_BIN: "/opt/claude" });
});

test("buildChildEnv: extra names are opt-in", () => {
  const env = buildChildEnv({ PATH: "/bin", USER: "d", FOO: "1" }, ["USER"]);
  assert.deepEqual(env, { PATH: "/bin", USER: "d" });
});

test("userMessageLine and controlResponseLine produce one JSON line each", () => {
  const u = userMessageLine("hello");
  assert.ok(u.endsWith("\n") && u.split("\n").length === 2);
  assert.deepEqual(JSON.parse(u), { type: "user", message: { role: "user", content: "hello" } });

  const allow = JSON.parse(controlResponseLine("req_1", "allow", { file_path: "a" }));
  assert.deepEqual(allow, {
    type: "control_response",
    response: { subtype: "success", request_id: "req_1", response: { behavior: "allow", updatedInput: { file_path: "a" } } },
  });
  const deny = JSON.parse(controlResponseLine("req_2", "deny"));
  assert.equal(deny.response.request_id, "req_2");
  assert.equal(deny.response.response.behavior, "deny");
  assert.equal(typeof deny.response.response.message, "string");
  assert.throws(() => controlResponseLine("r", "maybe"), /allow|deny/);
});

test("parseCaptureLines keeps parsed objects and flags non-JSON lines", () => {
  const out = parseCaptureLines([
    { t: 1, raw: '{"type":"system","subtype":"init"}' },
    { t: 2, raw: "not json" },
  ]);
  assert.equal(out[0].obj.subtype, "init");
  assert.equal(out[1].obj, null);
  assert.equal(out[1].raw, "not json");
});

// ---- S1 ----------------------------------------------------------------------------------

const s1Ok = () =>
  cap([
    init(100, { agent: "probe" }),
    toolUse(900, "Bash", { command: "printenv DEN_CONFORMANCE_CANARY" }),
    toolResult(1100, "tu1", "", false),
    text(1500, "PROBE-ROLE-OK canary not visible"),
    result(1600, "PROBE-ROLE-OK canary not visible"),
  ]);
const s1Meta = { sessionId: SID, canary: "canary-value-123", marker: "PROBE-ROLE-OK", exitedOnEof: true };

test("S1 go: logged in, init with the session id, agent marker, exit on EOF, canary absent", () => {
  const r = evaluateS1(s1Ok(), s1Meta);
  assert.equal(r.spike, "S1");
  assert.equal(r.verdict, "go");
  assert.ok(r.evidence.length > 0);
});

test("S1 no-go when the canary reaches the child", () => {
  const c = s1Ok();
  c.lines.splice(2, 1, toolResult(1100, "tu1", "canary-value-123\n", false));
  const r = evaluateS1(c, s1Meta);
  assert.equal(r.verdict, "no-go");
  assert.match(r.evidence.join("\n"), /canary/i);
});

test("S1 no-go when the child is not logged in", () => {
  const c = cap([init(100), result(900, "Not logged in - Please run /login", { is_error: true })]);
  const r = evaluateS1(c, s1Meta);
  assert.equal(r.verdict, "no-go");
  assert.match(r.evidence.join("\n"), /login/i);
});

test("S1 no-go when stdin EOF does not end the child, or the init session id differs", () => {
  assert.equal(evaluateS1(s1Ok(), { ...s1Meta, exitedOnEof: false }).verdict, "no-go");
  const c = s1Ok();
  c.lines[0] = L(100, { type: "system", subtype: "init", session_id: "other" });
  assert.equal(evaluateS1(c, s1Meta).verdict, "no-go");
});

test("S1 no-go when the agent marker is missing from the reply (--agent not honoured)", () => {
  const c = cap([init(100), toolUse(900, "Bash", {}), toolResult(1100, "tu1", ""), result(1600, "all good")]);
  const r = evaluateS1(c, s1Meta);
  assert.equal(r.verdict, "no-go");
  assert.match(r.evidence.join("\n"), /agent/i);
});

// ---- S2 ----------------------------------------------------------------------------------

test("S2 go when the tool_use line arrives well before the tool_result of a 3 s command", () => {
  const c = cap([init(100), toolUse(1200, "Bash", { command: "sleep 3" }), toolResult(4300, "tu1", ""), result(5000, "done")]);
  const r = evaluateS2(c, { sleepMs: 3000, subagentCapture: null });
  assert.equal(r.verdict, "go");
  assert.match(r.evidence.join("\n"), /latency/i);
});

test("S2 no-go when the tool_use line is only delivered once the tool finishes", () => {
  const c = cap([init(100), toolUse(4290, "Bash", { command: "sleep 3" }), toolResult(4300, "tu1", ""), result(5000, "done")]);
  assert.equal(evaluateS2(c, { sleepMs: 3000, subagentCapture: null }).verdict, "no-go");
});

test("S2 no-go when no tool event arrives at all", () => {
  assert.equal(evaluateS2(cap([init(100), result(900, "hi")]), { sleepMs: 3000, subagentCapture: null }).verdict, "no-go");
});

test("S2 reports whether subagent activity appears on the stream (tailer decision)", () => {
  const base = [init(100), toolUse(1200, "Bash", { command: "sleep 3" }), toolResult(4300, "tu1", ""), result(5000, "done")];
  const withSub = cap([
    init(100),
    toolUse(500, "Task", { prompt: "x" }, "sub1"),
    toolUse(900, "Read", { file_path: "p" }, "inner1", { parent_tool_use_id: "sub1" }),
    toolResult(1000, "sub1", "ok"),
    result(1100, "done"),
  ]);
  const yes = evaluateS2(cap(base), { sleepMs: 3000, subagentCapture: withSub });
  assert.match(yes.evidence.join("\n"), /subagent activity: visible/i);
  assert.equal(yes.tailerNeeded, false);
  const noSub = cap([init(100), toolUse(500, "Task", { prompt: "x" }, "sub1"), toolResult(1000, "sub1", "ok"), result(1100, "done")]);
  const no = evaluateS2(cap(base), { sleepMs: 3000, subagentCapture: noSub });
  assert.match(no.evidence.join("\n"), /subagent activity: not visible/i);
  assert.equal(no.tailerNeeded, true);
  const untested = evaluateS2(cap(base), { sleepMs: 3000, subagentCapture: null });
  assert.equal(untested.tailerNeeded, null);
});

// ---- S3 ----------------------------------------------------------------------------------

const controlRequest = (t, id, tool, input) =>
  L(t, { type: "control_request", request_id: id, request: { subtype: "can_use_tool", tool_name: tool, input } });

const s3Allow = () =>
  cap([init(100), controlRequest(800, "req_a", "Write", { file_path: "/w/s3-allow.txt", content: "ALLOW-BODY" }), toolResult(1500, "tu1", "File created", false), result(2000, "ok")]);
const s3Deny = () =>
  cap([init(100), controlRequest(800, "req_d", "Write", { file_path: "/w/s3-deny.txt", content: "DENY-BODY" }), toolResult(1500, "tu1", "Permission denied", true), result(2000, "ok")]);

test("S3 go: control_request carries the full input, allow and deny are honoured", () => {
  const r = evaluateS3(
    { allow: s3Allow(), deny: s3Deny() },
    { allowBody: "ALLOW-BODY", denyBody: "DENY-BODY", allowFileExists: true, denyFileExists: false },
  );
  assert.equal(r.verdict, "go");
  assert.equal(r.shapes.controlRequest.request.tool_name, "Write");
});

test("S3 no-go when no control_request is emitted for the tool outside the allowlist", () => {
  const silent = cap([init(100), toolResult(900, "tu1", "denied", true), result(1000, "no")]);
  const r = evaluateS3(
    { allow: silent, deny: s3Deny() },
    { allowBody: "ALLOW-BODY", denyBody: "DENY-BODY", allowFileExists: false, denyFileExists: false },
  );
  assert.equal(r.verdict, "no-go");
  assert.match(r.evidence.join("\n"), /control_request/);
});

test("S3 no-go when the control_request input is truncated or the deny is not honoured", () => {
  const truncated = cap([init(100), controlRequest(800, "req_a", "Write", { file_path: "/w/s3-allow.txt" }), toolResult(1500, "tu1", "ok"), result(2000, "ok")]);
  const base = { allowBody: "ALLOW-BODY", denyBody: "DENY-BODY", allowFileExists: true, denyFileExists: false };
  assert.equal(evaluateS3({ allow: truncated, deny: s3Deny() }, base).verdict, "no-go");
  assert.equal(evaluateS3({ allow: s3Allow(), deny: s3Deny() }, { ...base, denyFileExists: true }).verdict, "no-go");
  assert.equal(evaluateS3({ allow: s3Allow(), deny: s3Deny() }, { ...base, allowFileExists: false }).verdict, "no-go");
});

// ---- S4 ----------------------------------------------------------------------------------

const s4Meta = { killedAt: 1000, transcriptFound: true, sessionId: SID };
test("S4 go: SIGTERM ends the child quickly, the transcript stays, resume reopens the session", () => {
  const killed = cap([init(100), toolUse(500, "Bash", { command: "sleep 20" })], { code: null, signal: "SIGTERM", t: 1300 });
  const resumed = cap([init(50, { session_id: SID }), result(900, "You were running sleep 20")]);
  const r = evaluateS4({ killed, resumed }, s4Meta);
  assert.equal(r.verdict, "go");
});

test("S4 no-go when the child outlives SIGTERM, the transcript is missing, or resume fails", () => {
  const resumed = cap([init(50), result(900, "ok")]);
  const slow = cap([init(100), toolUse(500, "Bash", {})], { code: null, signal: "SIGKILL", t: 9000 });
  assert.equal(evaluateS4({ killed: slow, resumed }, s4Meta).verdict, "no-go");
  const killed = cap([init(100), toolUse(500, "Bash", {})], { code: null, signal: "SIGTERM", t: 1300 });
  assert.equal(evaluateS4({ killed, resumed }, { ...s4Meta, transcriptFound: false }).verdict, "no-go");
  const bad = cap([result(300, "No conversation found", { is_error: true })]);
  assert.equal(evaluateS4({ killed, resumed: bad }, s4Meta).verdict, "no-go");
});

// ---- S5 ----------------------------------------------------------------------------------

test("S5 go when the plan usage reading moved after a headless run", () => {
  const r = evaluateS5({
    before: { "5-hour": { percent: 10, resets_at: "2026-10-05T20:00:00Z" } },
    after: { "5-hour": { percent: 11, resets_at: "2026-10-05T20:00:00Z" } },
    costUsd: 0.0123,
  });
  assert.equal(r.verdict, "go");
  assert.match(r.evidence.join("\n"), /10.*11/);
});

test("S5 stays unconfirmed when the reading did not move, readings are missing, or the window rolled over", () => {
  const same = { "5-hour": { percent: 10, resets_at: "A" } };
  assert.equal(evaluateS5({ before: same, after: same, costUsd: 0.01 }).verdict, "unconfirmed");
  assert.equal(evaluateS5({ before: null, after: same, costUsd: 0.01 }).verdict, "unconfirmed");
  const rolled = { "5-hour": { percent: 0, resets_at: "B" } };
  assert.equal(evaluateS5({ before: same, after: rolled, costUsd: 0.01 }).verdict, "unconfirmed");
  assert.match(evaluateS5({ before: same, after: same, costUsd: 0.01 }).evidence.join("\n"), /usage page/i);
});

// ---- S6 ----------------------------------------------------------------------------------

test("S6 go: --settings merges (the allowed write lands) and deny outranks the project allow", () => {
  const c = cap([
    init(100),
    toolUse(500, "Write", { file_path: "/w/allowed.txt", content: "a" }, "w1"),
    toolUse(600, "Write", { file_path: "/w/.claude/probe.txt", content: "b" }, "w2"),
    toolResult(900, "w1", "ok"),
    toolResult(950, "w2", "denied", true),
    result(1000, "done"),
  ]);
  assert.equal(evaluateS6(c, { allowedExists: true, deniedExists: false }).verdict, "go");
});

test("S6 no-go when the deny does not hold or the merge dropped the project allow", () => {
  const c = cap([
    init(100),
    toolUse(500, "Write", { file_path: "/w/allowed.txt" }, "w1"),
    toolUse(600, "Write", { file_path: "/w/.claude/probe.txt" }, "w2"),
    result(1000, "done"),
  ]);
  assert.equal(evaluateS6(c, { allowedExists: true, deniedExists: true }).verdict, "no-go");
  assert.equal(evaluateS6(c, { allowedExists: false, deniedExists: false }).verdict, "no-go");
});

test("S6 unconfirmed when the model never attempted the denied write", () => {
  const c = cap([init(100), toolUse(500, "Write", { file_path: "/w/allowed.txt" }, "w1"), result(1000, "done")]);
  assert.equal(evaluateS6(c, { allowedExists: true, deniedExists: false }).verdict, "unconfirmed");
});

// ---- S7 ----------------------------------------------------------------------------------

test("S7 queued: a second result arrives after the first and the first tool call finished", () => {
  const c = cap([
    init(100),
    toolUse(500, "Bash", { command: "sleep 8" }),
    toolResult(8700, "tu1", "", false),
    result(9000, "first done"),
    result(11000, "second"),
  ]);
  const r = evaluateS7(c, { sentAt: 2000 });
  assert.equal(r.verdict, "go");
  assert.equal(r.behavior, "queued-new-turn");
});

test("S7 merged: one result that carries both answers", () => {
  const c = cap([init(100), toolUse(500, "Bash", { command: "sleep 8" }), toolResult(8700, "tu1", "", false), result(10000, "first done\nsecond")]);
  const r = evaluateS7(c, { sentAt: 2000 });
  assert.equal(r.verdict, "go");
  assert.equal(r.behavior, "merged-into-running-turn");
});

test("S7 interrupted: the running tool call ends in an error before it could finish", () => {
  const c = cap([init(100), toolUse(500, "Bash", { command: "sleep 8" }), toolResult(2100, "tu1", "[Request interrupted by user]", true), result(3000, "second")]);
  const r = evaluateS7(c, { sentAt: 2000 });
  assert.equal(r.verdict, "no-go");
  assert.equal(r.behavior, "interrupted");
});

test("S7 dropped: the first turn finishes and the second message never shows", () => {
  const c = cap([init(100), toolUse(500, "Bash", { command: "sleep 8" }), toolResult(8700, "tu1", "", false), result(9000, "first done")]);
  const r = evaluateS7(c, { sentAt: 2000 });
  assert.equal(r.verdict, "no-go");
  assert.equal(r.behavior, "dropped");
});

// ---- CLI and plan ------------------------------------------------------------------------

test("parseCli: defaults run every spike; --spike selects; bad input is an error", () => {
  assert.deepEqual(parseCli([]).spikes, ["S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  assert.deepEqual(parseCli(["--spike", "S3,S1"]).spikes, ["S1", "S3"]);
  assert.equal(parseCli(["--dry-run"]).dryRun, true);
  assert.equal(parseCli(["--out", "/x"]).out, "/x");
  assert.equal(parseCli(["--spike", "S9"]).error.includes("S9"), true);
  assert.ok(parseCli(["--bogus"]).error);
  assert.ok(parseCli(["--help"]).help);
});

test("SPIKES describe every spike with a turn estimate", () => {
  assert.deepEqual(Object.keys(SPIKES), ["S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  for (const s of Object.values(SPIKES)) {
    assert.equal(typeof s.title, "string");
    assert.ok(Number.isInteger(s.turns) && s.turns > 0);
  }
});

test("--dry-run prints the plan and spawns nothing", () => {
  const out = execFileSync(process.execPath, [new URL("./conformance.mjs", import.meta.url).pathname, "--dry-run"], {
    encoding: "utf8",
    env: { ...process.env, DEN_CLAUDE_BIN: "/nonexistent/claude" },
  });
  assert.match(out, /S1/);
  assert.match(out, /S7/);
  assert.match(out, /turns/i);
});

// ---- Harness against a scripted fake `claude` ----------------------------------------------

function writeFake(dir, body) {
  const file = path.join(dir, "fake-claude.mjs");
  writeFileSync(file, `#!/usr/bin/env node\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
}

// The fake speaks just enough stream-json: init on first user line, a Bash tool_use, a tool_result
// echoing the canary env var, a result, then exits on stdin EOF.
const FAKE_S1 = `
import readline from "node:readline";
const args = process.argv.slice(2);
const sid = args[args.indexOf("--session-id") + 1];
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", () => {
  out({ type: "system", subtype: "init", session_id: sid });
  out({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "printenv DEN_CONFORMANCE_CANARY" } }] } });
  out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: process.env.DEN_CONFORMANCE_CANARY ?? "", is_error: false }] } });
  out({ type: "result", subtype: "success", is_error: false, result: "PROBE-ROLE-OK", session_id: sid });
});
rl.on("close", () => process.exit(0));
`;

test("runSpikes S1 against a fake claude: go, and writes fixtures and results", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "conf-test-"));
  const fake = writeFake(dir, FAKE_S1);
  const outDir = path.join(dir, "out");
  const results = await runSpikes({
    spikes: ["S1"],
    out: outDir,
    claudeBin: fake,
    env: { PATH: process.env.PATH, HOME: dir, DEN_CONFORMANCE_CANARY: "must-not-leak" },
    timeoutMs: 10_000,
    log: () => {},
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].verdict, "go", results[0].evidence.join("\n"));
  const saved = JSON.parse(readFileSync(path.join(outDir, "results.json"), "utf8"));
  assert.equal(saved[0].spike, "S1");
  assert.match(readFileSync(path.join(outDir, "S1.jsonl"), "utf8"), /"subtype":"init"/);
});

const FAKE_S3 = `
import readline from "node:readline";
import fs from "node:fs";
const args = process.argv.slice(2);
const sid = args[args.indexOf("--session-id") + 1];
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const rl = readline.createInterface({ input: process.stdin });
let pending = null;
let n = 0;
rl.on("line", (line) => {
  const msg = JSON.parse(line);
  if (msg.type === "user") {
    n += 1;
    const body = String(msg.message.content).match(/BODY-[A-Z0-9]+/)?.[0] ?? "x";
    const file = String(msg.message.content).match(/\\S*s3-(allow|deny)\\.txt/)?.[0] ?? "s3.txt";
    out({ type: "system", subtype: "init", session_id: sid });
    pending = { file, body };
    out({ type: "control_request", request_id: "req_" + n, request: { subtype: "can_use_tool", tool_name: "Write", input: { file_path: file, content: body } } });
  } else if (msg.type === "control_response") {
    const ok = msg.response.response.behavior === "allow";
    if (ok) fs.writeFileSync(pending.file, pending.body);
    out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t", content: ok ? "created" : "denied", is_error: !ok }] } });
    out({ type: "result", subtype: "success", is_error: false, result: "ok", session_id: sid });
  }
});
rl.on("close", () => process.exit(0));
`;

test("runSpikes S3 against a fake claude: allow and deny are driven and checked on disk", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "conf-test-"));
  const fake = writeFake(dir, FAKE_S3);
  const results = await runSpikes({
    spikes: ["S3"],
    out: path.join(dir, "out"),
    claudeBin: fake,
    env: { PATH: process.env.PATH, HOME: dir },
    timeoutMs: 10_000,
    log: () => {},
  });
  assert.equal(results[0].verdict, "go", results[0].evidence.join("\n"));
});

test("runSpikes: a binary that cannot start is a no-go with the error, not a crash", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "conf-test-"));
  const results = await runSpikes({
    spikes: ["S1"],
    out: path.join(dir, "out"),
    claudeBin: path.join(dir, "missing-claude"),
    env: { PATH: process.env.PATH, HOME: dir },
    timeoutMs: 5000,
    log: () => {},
  });
  assert.equal(results[0].verdict, "no-go");
  assert.match(results[0].evidence.join("\n"), /ENOENT|spawn|start/i);
});

const FAKE_GENERIC = `
import readline from "node:readline";
const args = process.argv.slice(2);
const sid = args[args.indexOf("--session-id") + 1] ?? args[args.indexOf("--resume") + 1];
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", () => {
  out({ type: "system", subtype: "init", session_id: sid });
  out({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "x" } }] } });
  out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "", is_error: false }] } });
  out({ type: "result", subtype: "success", is_error: false, result: "PROBE-ROLE-OK second", session_id: sid });
});
rl.on("close", () => process.exit(0));
`;

test("runSpikes S2, S4, S6, S7 run to a verdict against a generic fake without crashing", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "conf-test-"));
  const fake = writeFake(dir, FAKE_GENERIC);
  const results = await runSpikes({
    spikes: ["S2", "S4", "S6", "S7"],
    out: path.join(dir, "out"),
    claudeBin: fake,
    env: { PATH: process.env.PATH, HOME: dir },
    timeoutMs: 10_000,
    log: () => {},
  });
  assert.deepEqual(results.map((r) => r.spike), ["S2", "S4", "S6", "S7"]);
  for (const r of results) {
    assert.ok(["go", "no-go", "unconfirmed"].includes(r.verdict));
    assert.ok(!r.evidence.some((e) => /could not run the spike/.test(e)), r.evidence.join("\n"));
  }
});
