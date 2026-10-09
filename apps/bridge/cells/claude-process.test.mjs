// organism-infra/143 (ADR 0016 decisions 2, 6.5, 6.6, 6.8; amendment 6): the process half of the Claude adapter.
//
// PINNED INTERFACE (what these tests hold the developer to):
//   apps/bridge/cells/claude-runtime.mjs   export createClaudeRuntime({ env = process.env }) -> CellRuntime
//     - the binary is env.DEN_CLAUDE_BIN, else "claude"; it never comes from a spawn argument
//     - spawn(args) runs  spawn(bin, buildClaudeArgs({ sessionId, agent: role, model? }), { shell: false, detached: true,
//       cwd: args.cwd, env: buildClaudeEnv(env) })  and writes the prompt as ONE stdin line
//       {"type":"user","message":{"role":"user","content":<prompt>}}
//     - capabilities { spawn: true, stop: true, approve: true, send: false, handover: true } (S8 is outcome (c): inbox on)
//     - CellProcess: { handle, events, closeInput(), signal(sig), decide(requestId, { allow, reason? }), exited }
//     - signal(sig) goes to the child's process group (the child is a group leader) and never throws, even after exit
//     - decide answers through encodeControlResponse, echoing the held request's input on allow; an unknown id writes nothing
//     - control_request lines: a can_use_tool request becomes a permission-request event; a repeated id or any other
//       subtype is answered deny on stdin with no event (decodeControlRequest)
//     - spawn rejects when the binary cannot start; stderr is drained (never blocks the child); stdout is decoded
//       through createLineSplitter and parseClaudeLine
//     - resumeCommand(id) contains `--resume <id>`
// The child is a stub script (claude-stub.mjs) behind DEN_CLAUDE_BIN, over real pipes and a real process group.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { until, sleep } from "./host-test-helpers.mjs";
import { makeStub, collect, alive, UTF8_COMMAND } from "./claude-stub.mjs";
import { buildClaudeArgs } from "./claude-adapter.mjs";

async function loadRuntimeModule() {
  try {
    return await import("./claude-runtime.mjs");
  } catch (err) {
    assert.fail(`apps/bridge/cells/claude-runtime.mjs does not exist yet (missing feature): ${err.message}`);
  }
}

const SESSION = "0b8f1c1e-5c1a-4c0e-9a55-3f2d9e7a4b10";
const cleanups = [];
afterEach(async () => {
  for (const fn of cleanups.splice(0)) await fn();
});

// A stub, a runtime over it, and a spawned process. Everything still alive is killed in afterEach.
async function launch(stubOpts, { args = {}, env = {} } = {}) {
  const { createClaudeRuntime } = await loadRuntimeModule();
  assert.equal(typeof createClaudeRuntime, "function", "claude-runtime.mjs must export createClaudeRuntime");
  const stub = await makeStub(stubOpts);
  const cwd = await mkdtemp(path.join(tmpdir(), "den-claude-cwd-"));
  const runtime = createClaudeRuntime({ env: { PATH: process.env.PATH, HOME: process.env.HOME, DEN_CLAUDE_BIN: stub.bin, ...env } });
  const proc = await runtime.spawn({ role: "architect", ref: "fx/02-ready-p0", cwd, prompt: "do the thing", sessionId: SESSION, ...args });
  const run = collect(proc);
  cleanups.push(async () => {
    try {
      proc.signal("SIGKILL");
    } catch {}
    const gc = await stub.grandchildPid();
    if (gc && alive(gc)) process.kill(gc, "SIGKILL");
  });
  return { stub, cwd, runtime, proc, run };
}

describe("the runtime's declared shape", () => {
  test("capabilities: approve on, send off, and a resume command naming the session", async () => {
    const { createClaudeRuntime } = await loadRuntimeModule();
    const rt = createClaudeRuntime({ env: {} });
    assert.deepEqual(rt.capabilities, { spawn: true, stop: true, approve: true, send: false, handover: true });
    assert.equal(typeof rt.id, "string");
    assert.match(rt.resumeCommand(SESSION), new RegExp(`--resume ${SESSION}`));
  });
});

describe("what the child is launched with", () => {
  test("argv is exactly buildClaudeArgs, cwd is the given directory, and the prompt is the first stdin line", async () => {
    const { stub, cwd, proc } = await launch({ mode: "hang" });
    await until(async () => (await stub.stdinLines()).length >= 1, { what: "the prompt line" });
    const start = await stub.start();
    assert.deepEqual(start.argv, buildClaudeArgs({ sessionId: SESSION, agent: "architect" }));
    assert.equal(await realpath(start.cwd), await realpath(cwd));
    const [first] = await stub.stdinLines();
    assert.deepEqual(first, { type: "user", message: { role: "user", content: "do the thing" } });
    assert.ok(proc.handle && typeof proc.handle === "string");
  });

  test("a model reaches --model only from the fixed list", async () => {
    const { stub } = await launch({ mode: "hang" }, { args: { model: "sonnet" } });
    await until(async () => (await stub.start()) !== undefined, { what: "the child to start" });
    assert.deepEqual((await stub.start()).argv, buildClaudeArgs({ sessionId: SESSION, agent: "architect", model: "sonnet" }));
  });

  test("the child's environment is an allowlist: a secret in the bridge's env never reaches it", async () => {
    const { stub } = await launch({ mode: "hang" }, { env: { CANARY_SECRET: "s3cret", ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" } });
    await until(async () => (await stub.start()) !== undefined, { what: "the child to start" });
    const { envKeys } = await stub.start();
    for (const bad of ["CANARY_SECRET", "ANTHROPIC_API_KEY", "GITHUB_TOKEN"]) assert.ok(!envKeys.includes(bad), `${bad} leaked into the child`);
    assert.ok(envKeys.includes("DEN_CLAUDE_BIN"));
    assert.ok(envKeys.includes("PATH"));
  });

  test("a binary named in the spawn arguments is ignored; only DEN_CLAUDE_BIN chooses it", async () => {
    const decoy = await makeStub({ mode: "hang" });
    const { stub } = await launch({ mode: "hang" }, { args: { bin: decoy.bin, command: decoy.bin, claudeBin: decoy.bin, binary: decoy.bin } });
    await until(async () => (await stub.start()) !== undefined, { what: "the real stub to start" });
    await sleep(150);
    assert.equal(await decoy.start(), undefined, "the decoy named in the spawn arguments was run");
  });

  test("a binary that cannot start makes spawn reject (the host then answers 502)", async () => {
    const { createClaudeRuntime } = await loadRuntimeModule();
    const missing = path.join(await mkdtemp(path.join(tmpdir(), "den-claude-none-")), "no-such-claude");
    const rt = createClaudeRuntime({ env: { PATH: process.env.PATH, DEN_CLAUDE_BIN: missing } });
    await assert.rejects(rt.spawn({ role: "architect", ref: "fx/02-ready-p0", cwd: tmpdir(), prompt: "p", sessionId: SESSION }));
  });
});

describe("what the child says", () => {
  test("stdout decodes to events; a permission request is held, an allow echoes the input, and the child finishes", async () => {
    const { stub, proc, run } = await launch({ mode: "approve" });
    await until(() => run.events.some((e) => e.type === "permission-request"), { what: "the permission-request event" });
    const req = run.events.find((e) => e.type === "permission-request");
    assert.deepEqual(req, { type: "permission-request", requestId: "req-1", tool: "Bash", input: { command: "npm test" } });
    assert.ok(run.events.some((e) => e.type === "tool-start" && e.name === "Bash" && e.summary === "npm test"));
    assert.ok(run.events.some((e) => e.type === "usage" && e.input === 10 && e.output === 20));
    await sleep(150);
    assert.ok(!(await stub.stdinLines()).some((l) => l.type === "control_response"), "nothing is answered until the owner decides");

    await proc.decide("req-1", { allow: true });
    const { code, signal } = await proc.exited;
    assert.deepEqual({ code, signal }, { code: 0, signal: null });
    await run.done;
    const resp = (await stub.stdinLines()).find((l) => l.type === "control_response");
    assert.equal(resp.response.request_id, "req-1");
    assert.equal(resp.response.response.behavior, "allow");
    assert.deepEqual(resp.response.response.updatedInput, { command: "npm test" });
    assert.ok(run.events.some((e) => e.type === "tool-end"));
    assert.deepEqual(run.events.at(-1), { type: "done", ok: true });
  });

  test("a deny carries the owner's reason and the child still finishes", async () => {
    const { stub, proc, run } = await launch({ mode: "approve" });
    await until(() => run.events.some((e) => e.type === "permission-request"), { what: "the permission-request event" });
    await proc.decide("req-1", { allow: false, reason: "no thanks" });
    await proc.exited;
    const resp = (await stub.stdinLines()).find((l) => l.type === "control_response");
    assert.equal(resp.response.response.behavior, "deny");
    assert.equal(resp.response.response.message, "no thanks");
    assert.equal(resp.response.response.updatedInput, undefined);
  });

  test("a repeated request id and a non-can_use_tool subtype are answered deny with no event; an unknown id writes nothing", async () => {
    const { stub, proc, run } = await launch({ mode: "dup" });
    await until(async () => (await stub.stdinLines()).filter((l) => l.type === "control_response").length >= 2, { what: "two automatic denies" });
    const resps = (await stub.stdinLines()).filter((l) => l.type === "control_response");
    assert.deepEqual(resps.map((r) => [r.response.request_id, r.response.response.behavior]).sort(), [["req-1", "deny"], ["req-2", "deny"]]);
    assert.deepEqual(run.events.filter((e) => e.type === "permission-request").map((e) => e.requestId), ["req-1"], "only the first req-1 is held");
    const before = (await stub.stdinLines()).length;
    await Promise.resolve(proc.decide("never-asked", { allow: true })).catch(() => {});
    await sleep(200);
    assert.equal((await stub.stdinLines()).length, before, "deciding an id the child never asked wrote to its stdin");
  });

  test("a crash: exited reports the code and the event stream ends without a done event", async () => {
    const { proc, run } = await launch({ mode: "crash" });
    const { code, signal } = await proc.exited;
    assert.deepEqual({ code, signal }, { code: 3, signal: null });
    await run.done;
    assert.ok(run.events.some((e) => e.type === "tool-start"));
    assert.ok(!run.events.some((e) => e.type === "done"));
  });

  test("a 1 MB stderr flood is drained: the child is not blocked and finishes", async () => {
    const { proc, run } = await launch({ mode: "flood" });
    const r = await Promise.race([proc.exited, sleep(8000).then(() => "hung")]);
    assert.notEqual(r, "hung", "the child blocked on a full stderr pipe");
    assert.equal(r.code, 0);
    await run.done;
    assert.deepEqual(run.events.at(-1), { type: "done", ok: true });
  });

  test("multibyte characters split across stdout chunks arrive intact", async () => {
    const { proc, run } = await launch({ mode: "utf8" });
    await proc.exited;
    await run.done;
    const tool = run.events.find((e) => e.type === "tool-start");
    assert.equal(tool?.summary, UTF8_COMMAND);
  });

  test("an over-long stdout line is dropped and the stream carries on", async () => {
    const { proc, run } = await launch({ mode: "oversize" });
    await proc.exited;
    await run.done;
    assert.ok(run.events.some((e) => e.type === "tool-start" && e.summary === "after the big line"));
    assert.deepEqual(run.events.at(-1), { type: "done", ok: true });
  });
});

describe("stopping the child reaches its whole process group", () => {
  test("SIGTERM ends the child and its child", async () => {
    const { stub, proc } = await launch({ mode: "hang", grandchild: "plain" });
    const gc = await until(() => stub.grandchildPid(), { what: "the grandchild pid" });
    assert.ok(alive(gc));
    proc.signal("SIGTERM");
    const r = await Promise.race([proc.exited, sleep(5000).then(() => "hung")]);
    assert.notEqual(r, "hung");
    assert.equal(r.signal, "SIGTERM");
    await until(() => !alive(gc), { ms: 3000, what: "the grandchild to die with the group" });
  });

  test("SIGKILL ends a child that ignores SIGTERM, and a grandchild that ignores it too", async () => {
    const { stub, proc } = await launch({ mode: "hang", grandchild: "ignoreTerm", ignoreTerm: true });
    const gc = await until(() => stub.grandchildPid(), { what: "the grandchild pid" });
    proc.signal("SIGTERM");
    await sleep(300);
    assert.ok(alive(gc), "the grandchild ignores SIGTERM, so it is still here");
    proc.signal("SIGKILL");
    const r = await Promise.race([proc.exited, sleep(5000).then(() => "hung")]);
    assert.notEqual(r, "hung");
    assert.equal(r.signal, "SIGKILL");
    await until(() => !alive(gc), { ms: 3000, what: "the grandchild to die with the group" });
  });

  test("closeInput ends stdin without throwing, and signal after exit is a no-op that never throws", async () => {
    const { proc } = await launch({ mode: "crash" });
    await proc.exited;
    assert.doesNotThrow(() => proc.closeInput());
    assert.doesNotThrow(() => proc.signal("SIGTERM"));
    assert.doesNotThrow(() => proc.signal("SIGKILL"));
  });
});
