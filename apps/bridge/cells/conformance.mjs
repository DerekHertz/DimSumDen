#!/usr/bin/env node
// Manual conformance script for the bridge's Claude adapter (ADR 0016, spikes S1 to S7; ticket
// organism-infra/105). It runs a real headless `claude -p` stream-json child per spike on the
// owner's login, so it is NOT a CI test: a cell's sandbox has no login. Each spike prints go or
// no-go with evidence; raw stdout lines are saved as fixtures for the adapter's parser tests.
//
// Usage: node apps/bridge/cells/conformance.mjs [--spike S1,S3] [--out <dir>] [--model <m>]
//          [--timeout <seconds>] [--extra-env NAME]... [--dry-run] [--help]
//
// Every child runs in a throwaway temp directory (never this repo) with a generated role file
// `probe` (agents are chosen with `--agent <role>`), on a cheap model by default. The child's
// environment is the adapter's allowlist (decision 6.6), never a copy of this process's.
//
// Written for the new vocabulary (agent, role): the role is what `--agent` selects.
import { spawn, execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const USAGE_SCRIPT = path.resolve(HERE, "../../../scripts/usage-claude.mjs");

// ---- Pure builders -------------------------------------------------------------------------

// ADR 0016 decision 3: the adapter never constructs a permission-broadening flag. `--permission-mode`
// is listed whole because its only broadening value is `bypassPermissions` and the adapter has no
// use for any other.
export const FORBIDDEN_FLAGS = ["--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--permission-mode"];

const ENV_ALLOW = ["PATH", "HOME", "DEN_CLAUDE_BIN"];

// The child's environment: an allowlist (PATH, HOME, locale, DEN_CLAUDE_BIN), never a copy.
export function buildChildEnv(parentEnv, extraNames = []) {
  const env = {};
  for (const [key, value] of Object.entries(parentEnv)) {
    if (value === undefined) continue;
    if (ENV_ALLOW.includes(key) || key === "LANG" || key.startsWith("LC_") || extraNames.includes(key)) env[key] = value;
  }
  return env;
}

export function buildArgs({ sessionId, resume, agent, permissionPromptTool, settings, allowedTools, model, extraArgs = [] } = {}) {
  for (const arg of extraArgs) {
    if (FORBIDDEN_FLAGS.some((f) => arg === f || arg.startsWith(`${f}=`))) throw new Error(`forbidden flag: ${arg}`);
  }
  const args = ["-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose"];
  if (resume) args.push("--resume", resume);
  else if (sessionId) args.push("--session-id", sessionId);
  if (agent) args.push("--agent", agent);
  if (model) args.push("--model", model);
  if (permissionPromptTool) args.push("--permission-prompt-tool", permissionPromptTool);
  if (settings) args.push("--settings", settings);
  if (allowedTools?.length) args.push("--allowedTools", allowedTools.join(","));
  return [...args, ...extraArgs];
}

// Hypothesised shapes (ADR 0016: undocumented, unverified). S1 and S3 confirm or refute them.
export function userMessageLine(text) {
  return JSON.stringify({ type: "user", message: { role: "user", content: text } }) + "\n";
}

export function controlResponseLine(requestId, decision, updatedInput) {
  if (decision !== "allow" && decision !== "deny") throw new Error("decision must be allow or deny");
  const response =
    decision === "allow"
      ? { behavior: "allow", updatedInput: updatedInput ?? {} }
      : { behavior: "deny", message: "Denied by the conformance script" };
  return JSON.stringify({ type: "control_response", response: { subtype: "success", request_id: requestId, response } }) + "\n";
}

export function parseCaptureLines(rawLines) {
  return rawLines.map(({ t, raw }) => {
    let obj = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") obj = parsed;
    } catch {
      // not JSON: kept raw
    }
    return { t, raw, obj };
  });
}

// ---- Capture accessors ---------------------------------------------------------------------

const objs = (cap) => cap.lines.filter((l) => l.obj).map((l) => ({ t: l.t, ...l.obj, obj: l.obj }));
const blocks = (o) => (Array.isArray(o.message?.content) ? o.message.content : []);
const initOf = (cap) => objs(cap).find((o) => o.type === "system" && o.subtype === "init");
const resultsOf = (cap) => objs(cap).filter((o) => o.type === "result");
const toolUses = (cap) =>
  objs(cap).flatMap((o) => (o.type === "assistant" ? blocks(o).filter((b) => b.type === "tool_use").map((b) => ({ t: o.t, ...b, parent: o.parent_tool_use_id ?? null })) : []));
const toolResults = (cap) =>
  objs(cap).flatMap((o) => (o.type === "user" ? blocks(o).filter((b) => b.type === "tool_result").map((b) => ({ t: o.t, ...b, parent: o.parent_tool_use_id ?? null })) : []));
const controlRequests = (cap) => objs(cap).filter((o) => o.type === "control_request");
const flat = (c) => (typeof c === "string" ? c : JSON.stringify(c ?? ""));
const verdict = (spike, ok, evidence, extra = {}) => ({ spike, verdict: ok ? "go" : "no-go", evidence, ...extra });

// ---- Evaluators (pure: captured output in, go or no-go out) ---------------------------------

export function evaluateS1(cap, { sessionId, canary, marker, exitedOnEof }) {
  const ev = [];
  const init = initOf(cap);
  const results = resultsOf(cap);
  const last = results.at(-1);
  const resultText = flat(last?.result);
  let ok = true;
  const check = (pass, good, bad) => {
    ev.push(pass ? good : bad);
    if (!pass) ok = false;
  };
  check(Boolean(init), "system/init emitted after the first stdin user message", "no system/init line on stdout");
  if (init) {
    check(init.session_id === sessionId, `init.session_id equals the --session-id (${sessionId})`, `init.session_id is ${init.session_id}, not the --session-id ${sessionId}`);
    if (init.agent !== undefined) ev.push(`init reports agent: ${JSON.stringify(init.agent)}`);
  }
  const loggedOut = last && (last.is_error || /not logged in|\/login/i.test(resultText)) && /login/i.test(resultText);
  check(Boolean(last) && !last.is_error, "a result line arrived without an error (logged in, first stdin message accepted)", loggedOut ? "child is not logged in (result mentions login)" : `no successful result line${last ? `: ${resultText.slice(0, 160)}` : ""}`);
  check(resultText.includes(marker), `reply carries the role marker ${marker}: --agent was honoured under -p`, `reply lacks the role marker ${marker}: --agent not shown to take effect`);
  const leaked = cap.lines.some((l) => canary && (l.raw ?? JSON.stringify(l.obj ?? "")).includes(canary));
  check(!leaked, "canary variable did not reach the child", "canary value appeared in the child's output: the environment allowlist leaked");
  check(exitedOnEof === true, "child exited on stdin EOF", "child did not exit on stdin EOF");
  return verdict("S1", ok, ev);
}

export function evaluateS2(cap, { sleepMs, subagentCapture }) {
  const ev = [];
  const use = toolUses(cap).find((u) => !u.parent);
  const res = use && toolResults(cap).find((r) => r.tool_use_id === use.id);
  let ok = false;
  if (!use || !res) {
    ev.push("no tool_use and tool_result pair on the stdout stream");
  } else {
    const gap = res.t - use.t;
    const latency = sleepMs - gap;
    ok = latency < 1000;
    ev.push(`tool_use line arrived ${gap} ms before its tool_result for a ${sleepMs} ms command, so delivery latency is about ${latency} ms (go needs under 1000)`);
  }
  let tailerNeeded = null;
  if (!subagentCapture) {
    ev.push("subagent activity: not tested");
  } else if (!toolUses(subagentCapture).some((u) => !u.parent && /^(Task|Agent)$/.test(u.name))) {
    ev.push("subagent activity: not exercised (the model never started a subagent); rerun if the tailer decision matters");
  } else if (objs(subagentCapture).some((o) => o.parent_tool_use_id)) {
    tailerNeeded = false;
    ev.push("subagent activity: visible on stdout (lines carry parent_tool_use_id); the transcript tailer is not needed");
  } else {
    tailerNeeded = true;
    ev.push("subagent activity: not visible on stdout; the transcript tailer is needed");
  }
  return verdict("S2", ok, ev, { tailerNeeded });
}

export function evaluateS3({ allow, deny }, { allowBody, denyBody, allowFileExists, denyFileExists }) {
  const ev = [];
  let ok = true;
  const check = (pass, good, bad) => {
    ev.push(pass ? good : bad);
    if (!pass) ok = false;
  };
  const reqA = controlRequests(allow)[0];
  const reqD = controlRequests(deny)[0];
  check(Boolean(reqA), "allow run: a control_request was emitted for a tool outside the allowlist", "allow run: no control_request on stdout");
  check(Boolean(reqD), "deny run: a control_request was emitted", "deny run: no control_request on stdout");
  if (reqA) {
    const input = reqA.request?.input;
    check(flat(input).includes(allowBody), "control_request carries the full tool input (the written content is present)", "control_request input lacks the written content: input is not complete");
    ev.push(`control_request shape: ${JSON.stringify({ type: reqA.type, request_id: reqA.request_id, subtype: reqA.request?.subtype, tool_name: reqA.request?.tool_name, input_keys: Object.keys(input ?? {}) })}`);
  }
  if (reqD) check(flat(reqD.request?.input).includes(denyBody), "deny run: control_request carries the full input", "deny run: control_request input lacks the content");
  check(allowFileExists === true, "allow was honoured: the file was written", "allow was not honoured: the file does not exist");
  check(denyFileExists === false, "deny was honoured: the file was not written", "deny was not honoured: the file exists");
  return verdict("S3", ok, ev, { shapes: { controlRequest: reqA ?? null } });
}

export function evaluateS4({ killed, resumed }, { killedAt, transcriptFound, sessionId }) {
  const ev = [];
  let ok = true;
  const check = (pass, good, bad) => {
    ev.push(pass ? good : bad);
    if (!pass) ok = false;
  };
  const ended = killed.exit ?? null;
  const took = ended ? ended.t - killedAt : null;
  check(Boolean(ended) && took < 5000, `SIGTERM ended the running child in ${took} ms (${ended?.signal ?? `code ${ended?.code}`})`, `child did not end within 5 s of SIGTERM${ended ? ` (took ${took} ms)` : ""}`);
  check(transcriptFound === true, `transcript ${sessionId}.jsonl is on disk after the kill`, "no transcript file found after the kill");
  const r = resultsOf(resumed).at(-1);
  check(Boolean(r) && !r.is_error, "--resume reopened the session and answered", `--resume did not work: ${flat(r?.result).slice(0, 160) || "no result line"}`);
  const init = initOf(resumed);
  if (init) ev.push(`resumed init.session_id ${init.session_id === sessionId ? "equals" : `differs from (${init.session_id} vs)`} the original ${sessionId}`);
  if (r) ev.push(`resumed reply mentions the interrupted command: ${/sleep/i.test(flat(r.result))}`);
  return verdict("S4", ok, ev);
}

// Billing is never a no-go by measurement: a reading that did not move proves nothing (integer
// percent, a trivial run). The user confirms on the account's usage page either way.
export function evaluateS5({ before, after, costUsd }) {
  const ev = [];
  const b = before?.["5-hour"];
  const a = after?.["5-hour"];
  let moved = false;
  if (!b || !a) {
    ev.push("a usage reading was unavailable (before or after): cannot compare");
  } else if (b.resets_at !== a.resets_at) {
    ev.push(`the 5-hour window rolled over between readings (${b.resets_at} to ${a.resets_at}): not comparable`);
  } else {
    ev.push(`5-hour plan usage: ${b.percent}% -> ${a.percent}%`);
    moved = a.percent > b.percent;
    if (!moved) ev.push("the reading did not move; a trivial run can fall under the integer rounding, so this does not show separate billing");
  }
  if (costUsd !== undefined && costUsd !== null) ev.push(`the result line reports total_cost_usd ${costUsd}`);
  ev.push("the account's usage page must still be checked by the user (decision 2); until then the billing question stays unconfirmed in the ADR");
  return { spike: "S5", verdict: moved ? "go" : "unconfirmed", evidence: ev };
}

export function evaluateS6(cap, { allowedExists, deniedExists }) {
  const ev = [];
  const writes = toolUses(cap).filter((u) => u.name === "Write");
  const deniedAttempt = writes.some((u) => String(u.input?.file_path ?? "").endsWith(".claude/probe.txt"));
  const allowedAttempt = writes.some((u) => String(u.input?.file_path ?? "").endsWith("allowed.txt"));
  ev.push(`attempted writes: allowed.txt ${allowedAttempt}, .claude/probe.txt ${deniedAttempt}`);
  ev.push(`on disk: allowed.txt ${allowedExists}, .claude/probe.txt ${deniedExists}`);
  if (deniedExists) {
    ev.push("the --settings deny did NOT outrank the project allow (or was ignored)");
    return verdict("S6", false, ev);
  }
  if (!deniedAttempt) {
    ev.push("the model never attempted the denied write, so precedence is untested");
    return { spike: "S6", verdict: "unconfirmed", evidence: ev };
  }
  if (!allowedExists) {
    ev.push("the project's allow did not apply: --settings replaced the project permissions instead of merging, or the allow rule did not match");
    return verdict("S6", false, ev);
  }
  ev.push("--settings merged with the project settings, and its deny outranked the project allow");
  return verdict("S6", true, ev);
}

// The UI wording depends on the behaviour, so the result names it. Go means the message is not
// lost and does not break the running tool call; the exact behaviour is recorded either way.
export function evaluateS7(cap, { sentAt }) {
  const ev = [];
  const use = toolUses(cap)[0];
  const res = use && toolResults(cap).find((r) => r.tool_use_id === use.id);
  const results = resultsOf(cap);
  const mentionsSecond = results.some((r) => /second/i.test(flat(r.result)));
  const interrupted = res && (res.is_error || /interrupt/i.test(flat(res.content)));
  let behavior;
  if (interrupted) behavior = "interrupted";
  else if (results.length >= 2 && /second/i.test(flat(results.at(-1).result))) behavior = "queued-new-turn";
  else if (results.length === 1 && mentionsSecond) behavior = "merged-into-running-turn";
  else behavior = "dropped";
  if (res) ev.push(`running tool call: result at ${res.t} ms (message written at ${sentAt} ms), error ${Boolean(res.is_error)}`);
  ev.push(`result lines: ${results.length}; a later reply mentions the second message: ${mentionsSecond}`);
  ev.push(`behaviour: ${behavior}`);
  return verdict("S7", behavior === "queued-new-turn" || behavior === "merged-into-running-turn", ev, { behavior });
}

// ---- Child process harness -----------------------------------------------------------------

class Child extends EventEmitter {
  constructor({ bin, args, env, cwd }) {
    super();
    this.t0 = Date.now();
    this.lines = [];
    this.stderr = "";
    this.exit = null;
    this.buf = "";
    this.proc = spawn(bin, args, { env, cwd, stdio: ["pipe", "pipe", "pipe"], shell: false });
    this.proc.stdin.on("error", () => {});
    this.proc.stdout.setEncoding("utf8");
    this.proc.stdout.on("data", (chunk) => {
      this.buf += chunk;
      let i;
      while ((i = this.buf.indexOf("\n")) >= 0) {
        const raw = this.buf.slice(0, i).trim();
        this.buf = this.buf.slice(i + 1);
        if (raw) this.#line(raw);
      }
    });
    this.proc.stderr.setEncoding("utf8");
    this.proc.stderr.on("data", (c) => {
      this.stderr += c;
    });
    this.proc.on("error", (e) => {
      this.exit = { code: null, signal: null, t: this.now(), error: e.message };
      this.emit("activity");
    });
    this.proc.on("close", (code, signal) => {
      if (this.buf.trim()) this.#line(this.buf.trim());
      this.exit ??= { code, signal, t: this.now() };
      this.emit("activity");
    });
  }
  now() {
    return Date.now() - this.t0;
  }
  #line(raw) {
    const [entry] = parseCaptureLines([{ t: this.now(), raw }]);
    this.lines.push(entry);
    this.emit("activity");
  }
  send(line) {
    if (!this.exit) this.proc.stdin.write(line);
  }
  endStdin() {
    this.proc.stdin.end();
  }
  kill(signal) {
    this.proc.kill(signal);
  }
  // Resolves with the first line at or after index `from` that satisfies `pred`, or null on timeout or exit.
  waitFor(pred, ms, from = 0) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => done(null), ms);
      const check = () => {
        const hit = this.lines.slice(from).find((l) => l.obj && pred(l.obj));
        if (hit) done(hit);
        else if (this.exit) done(null);
      };
      const done = (v) => {
        clearTimeout(timer);
        this.off("activity", check);
        resolve(v);
      };
      this.on("activity", check);
      check();
    });
  }
  async waitExit(ms) {
    if (this.exit) return true;
    return new Promise((resolve) => {
      const timer = setTimeout(() => done(false), ms);
      const check = () => this.exit && done(true);
      const done = (v) => {
        clearTimeout(timer);
        this.off("activity", check);
        resolve(v);
      };
      this.on("activity", check);
    });
  }
  capture() {
    return { lines: this.lines.slice(), exit: this.exit, stderr: this.stderr };
  }
}

const isResult = (o) => o.type === "result";
const isToolUse = (o) => o.type === "assistant" && Array.isArray(o.message?.content) && o.message.content.some((b) => b.type === "tool_use");
const isControlRequest = (o) => o.type === "control_request";

const PROBE_MARKER = "PROBE-ROLE-OK";
const PROBE_ROLE = `---
name: probe
description: Conformance probe role (throwaway)
tools: Bash, Read, Write, Edit, Task
model: haiku
---
You are a conformance probe. Do exactly what the user asks and nothing more. Begin your final reply with the word ${PROBE_MARKER}.
`;

function makeWorkdir(projectSettings) {
  const dir = mkdtempSync(path.join(tmpdir(), "den-conformance-"));
  mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
  writeFileSync(path.join(dir, ".claude", "agents", "probe.md"), PROBE_ROLE);
  writeFileSync(path.join(dir, "notes.txt"), "hello from notes\n");
  if (projectSettings) writeFileSync(path.join(dir, ".claude", "settings.json"), JSON.stringify(projectSettings));
  return dir;
}

function readUsage(env) {
  return new Promise((resolve) => {
    execFile(process.execPath, [USAGE_SCRIPT], { env, timeout: 20_000 }, (err, stdout) => {
      if (err) return resolve(null);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve(null);
      }
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Spike runners (each returns { result, captures }) --------------------------------------

function makeCtx(opts) {
  const canary = opts.env?.DEN_CONFORMANCE_CANARY ?? `canary-${randomBytes(8).toString("hex")}`;
  const parentEnv = { ...opts.env, DEN_CONFORMANCE_CANARY: canary };
  const childEnv = buildChildEnv(parentEnv, opts.extraEnv ?? []);
  const bin = opts.claudeBin ?? "claude";
  return {
    canary,
    parentEnv,
    timeoutMs: opts.timeoutMs ?? 120_000,
    model: opts.model ?? "haiku",
    start(args, cwd) {
      return new Child({ bin, args, env: childEnv, cwd });
    },
  };
}

async function runTurn(child, text, timeoutMs, from = 0) {
  child.send(userMessageLine(text));
  return child.waitFor(isResult, timeoutMs, from);
}

async function finish(child) {
  child.endStdin();
  const exited = await child.waitExit(10_000);
  if (!exited) child.kill("SIGKILL");
  return exited;
}

async function runS1(ctx) {
  const dir = makeWorkdir();
  const sessionId = randomUUID();
  const child = ctx.start(buildArgs({ sessionId, agent: "probe", model: ctx.model, allowedTools: ["Bash(printenv DEN_CONFORMANCE_CANARY)"] }), dir);
  await runTurn(child, `Run the Bash command "printenv DEN_CONFORMANCE_CANARY" and tell me only whether it printed anything. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  const exitedOnEof = await finish(child);
  const capture = child.capture();
  return { result: evaluateS1(capture, { sessionId, canary: ctx.canary, marker: PROBE_MARKER, exitedOnEof }), captures: { main: capture } };
}

async function runS2(ctx) {
  const dir = makeWorkdir();
  const sleepMs = 3000;
  const a = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model, allowedTools: ["Bash(sleep 3)"] }), dir);
  await runTurn(a, `Run the Bash command "sleep 3", then reply done. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  await finish(a);
  const b = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model, allowedTools: ["Task", "Agent", "Read"] }), dir);
  await runTurn(b, `Use the Task tool to start a general-purpose subagent that reads notes.txt and returns its text, then reply with that text. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  await finish(b);
  const main = a.capture();
  const sub = b.capture();
  return { result: evaluateS2(main, { sleepMs, subagentCapture: sub }), captures: { main, subagent: sub } };
}

async function runS3(ctx) {
  const dir = makeWorkdir();
  const child = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model, permissionPromptTool: "stdio" }), dir);
  let decision = "allow";
  let answered = 0;
  child.on("activity", () => {
    for (; answered < child.lines.length; answered += 1) {
      const o = child.lines[answered].obj;
      if (o && isControlRequest(o)) child.send(controlResponseLine(o.request_id, decision, decision === "allow" ? o.request?.input : undefined));
    }
  });
  const allowBody = `BODY-ALLOW${randomBytes(3).toString("hex").toUpperCase()}`;
  const denyBody = `BODY-DENY${randomBytes(3).toString("hex").toUpperCase()}`;
  const allowFile = path.join(dir, "s3-allow.txt");
  const denyFile = path.join(dir, "s3-deny.txt");
  await runTurn(child, `Use the Write tool to create the file ${allowFile} with exactly this content: ${allowBody}. Do nothing else. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  const split = child.lines.length;
  decision = "deny";
  await runTurn(child, `Use the Write tool to create the file ${denyFile} with exactly this content: ${denyBody}. Do nothing else. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs, split);
  await finish(child);
  const all = child.capture();
  const allow = { ...all, lines: all.lines.slice(0, split) };
  const deny = { ...all, lines: all.lines.slice(split) };
  const result = evaluateS3({ allow, deny }, { allowBody, denyBody, allowFileExists: existsSync(allowFile), denyFileExists: existsSync(denyFile) });
  return { result, captures: { allow, deny } };
}

function findTranscript(home, sessionId) {
  const root = path.join(home, ".claude", "projects");
  try {
    return readdirSync(root).some((d) => existsSync(path.join(root, d, `${sessionId}.jsonl`)));
  } catch {
    return false;
  }
}

async function runS4(ctx) {
  const dir = makeWorkdir();
  const sessionId = randomUUID();
  const tools = ["Bash(sleep 20)"];
  const first = ctx.start(buildArgs({ sessionId, agent: "probe", model: ctx.model, allowedTools: tools }), dir);
  first.send(userMessageLine(`Run the Bash command "sleep 20", then reply done. Begin your reply with ${PROBE_MARKER}.`));
  await first.waitFor(isToolUse, ctx.timeoutMs);
  const killedAt = first.now();
  first.kill("SIGTERM");
  await first.waitExit(10_000);
  if (!first.exit) first.kill("SIGKILL");
  const transcriptFound = findTranscript(ctx.parentEnv.HOME ?? homedir(), sessionId);
  const second = ctx.start(buildArgs({ resume: sessionId, agent: "probe", model: ctx.model, allowedTools: tools }), dir);
  await runTurn(second, `In one short line, which Bash command were you running when you were interrupted? Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  await finish(second);
  const killed = first.capture();
  const resumed = second.capture();
  return { result: evaluateS4({ killed, resumed }, { killedAt, transcriptFound, sessionId }), captures: { killed, resumed } };
}

async function runS5(ctx) {
  const dir = makeWorkdir();
  const before = await readUsage(ctx.parentEnv);
  const child = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model }), dir);
  await runTurn(child, `Reply with the single word ${PROBE_MARKER}.`, ctx.timeoutMs);
  await finish(child);
  await sleep(5000);
  const after = await readUsage(ctx.parentEnv);
  const capture = child.capture();
  const costUsd = resultsOf(capture).at(-1)?.total_cost_usd ?? null;
  return { result: evaluateS5({ before, after, costUsd }), captures: { main: capture } };
}

async function runS6(ctx, outDir) {
  const dir = makeWorkdir({ permissions: { allow: ["Write(allowed.txt)", "Write(.claude/**)"] } });
  mkdirSync(outDir, { recursive: true });
  const settings = path.join(outDir, "s6-deny.settings.json");
  writeFileSync(settings, JSON.stringify({ permissions: { deny: ["Write(.claude/**)"] } }));
  const child = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model, settings }), dir);
  await runTurn(child, `Use the Write tool to create allowed.txt containing "ok", then use the Write tool to create .claude/probe.txt containing "ok". Report what happened. Begin your reply with ${PROBE_MARKER}.`, ctx.timeoutMs);
  await finish(child);
  const capture = child.capture();
  return { result: evaluateS6(capture, { allowedExists: existsSync(path.join(dir, "allowed.txt")), deniedExists: existsSync(path.join(dir, ".claude", "probe.txt")) }), captures: { main: capture } };
}

async function runS7(ctx) {
  const dir = makeWorkdir();
  const child = ctx.start(buildArgs({ sessionId: randomUUID(), agent: "probe", model: ctx.model, allowedTools: ["Bash(sleep 8)"] }), dir);
  child.send(userMessageLine(`Run the Bash command "sleep 8", then reply with exactly: first done. Begin your reply with ${PROBE_MARKER}.`));
  await child.waitFor(isToolUse, ctx.timeoutMs);
  const sentAt = child.now();
  child.send(userMessageLine("Also, in your reply, add a final line containing the word second."));
  const firstResult = await child.waitFor(isResult, ctx.timeoutMs);
  if (firstResult && !/second/i.test(flat(firstResult.obj.result))) {
    await child.waitFor(isResult, 20_000, child.lines.indexOf(firstResult) + 1);
  }
  await finish(child);
  const capture = child.capture();
  return { result: evaluateS7(capture, { sentAt }), captures: { main: capture } };
}

// turns: user turns the spike sends (each is a few API calls on a cheap model).
export const SPIKES = {
  S1: { title: "child starts logged in under the env allowlist; --session-id, --agent, stdin message, init, exit on EOF; canary absent", turns: 1, run: runS1 },
  S2: { title: "tool event latency on stdout (go: under 1 s) and whether subagent activity appears (tailer decision)", turns: 2, run: runS2 },
  S3: { title: "--permission-prompt-tool stdio: control_request with full input; allow and deny honoured; capture shapes", turns: 2, run: runS3 },
  S4: { title: "SIGTERM ends a running child, transcript kept, --resume reopens it", turns: 2, run: runS4 },
  S5: { title: "billing: plan usage reading before and after one trivial headless run (user confirms on the usage page)", turns: 1, run: runS5 },
  S6: { title: "--settings merge and deny precedence over a project allow", turns: 1, run: runS6 },
  S7: { title: "a user message written mid-turn: queued, merged, dropped or interrupting", turns: 1, run: runS7 },
};

// ---- Runner and CLI ------------------------------------------------------------------------

function writeCaptures(outDir, spike, captures) {
  for (const [name, cap] of Object.entries(captures ?? {})) {
    const file = path.join(outDir, name === "main" ? `${spike}.jsonl` : `${spike}-${name}.jsonl`);
    writeFileSync(file, cap.lines.map((l) => l.raw).join("\n") + (cap.lines.length ? "\n" : ""));
  }
}

export async function runSpikes(opts) {
  const { spikes, out, log = console.log } = opts;
  mkdirSync(out, { recursive: true });
  const ctx = makeCtx(opts);
  const results = [];
  for (const id of spikes) {
    log(`running ${id}: ${SPIKES[id].title}`);
    let run;
    try {
      run = await SPIKES[id].run(ctx, out);
    } catch (e) {
      run = { result: { spike: id, verdict: "no-go", evidence: [`could not run the spike: ${e.message}`] }, captures: {} };
    }
    const { result, captures } = run;
    const startError = Object.values(captures ?? {}).find((c) => c.exit?.error)?.exit.error;
    if (startError) result.evidence.push(`could not start the child: ${startError}`);
    if (result.verdict !== "go") {
      const tail = Object.values(captures ?? {}).map((c) => c.stderr).join("").trim().slice(-400);
      if (tail) result.evidence.push(`stderr tail: ${tail}`);
    }
    writeCaptures(out, id, captures);
    results.push(result);
  }
  writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2) + "\n");
  return results;
}

export function parseCli(argv) {
  const opts = { spikes: Object.keys(SPIKES), out: null, dryRun: false, model: "haiku", timeoutMs: 120_000, extraEnv: [], help: false, error: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => argv[++i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--out") opts.out = value();
    else if (arg === "--model") opts.model = value();
    else if (arg === "--extra-env") opts.extraEnv.push(value());
    else if (arg === "--timeout") opts.timeoutMs = Number(value()) * 1000;
    else if (arg === "--spike") {
      const wanted = String(value() ?? "").split(",").map((s) => s.trim().toUpperCase());
      const bad = wanted.find((s) => !SPIKES[s]);
      if (bad !== undefined) {
        opts.error = `unknown spike ${bad || "(empty)"}; choose from ${Object.keys(SPIKES).join(", ")}`;
        break;
      }
      opts.spikes = Object.keys(SPIKES).filter((s) => wanted.includes(s));
    } else {
      opts.error = `unknown argument ${arg}`;
      break;
    }
  }
  if (!Number.isFinite(opts.timeoutMs) || opts.timeoutMs <= 0) opts.error ??= "--timeout needs a positive number of seconds";
  return opts;
}

const HELP = `usage: node apps/bridge/cells/conformance.mjs [--spike S1,S3] [--out <dir>] [--model <m>] [--timeout <s>] [--extra-env NAME]... [--dry-run]
Runs ADR 0016's spikes against the real \`claude\` login (DEN_CLAUDE_BIN overrides the binary).
--dry-run prints the plan and spends nothing.`;

export function planText(opts) {
  const turns = opts.spikes.reduce((n, id) => n + SPIKES[id].turns, 0);
  const lines = opts.spikes.map((id) => `  ${id} (${SPIKES[id].turns} turns): ${SPIKES[id].title}`);
  return [`plan: ${opts.spikes.length} spikes, about ${turns} user turns on model ${opts.model} (each turn is roughly 2 to 4 API calls)`, ...lines].join("\n");
}

async function main() {
  const opts = parseCli(process.argv.slice(2));
  if (opts.help) return console.log(HELP);
  if (opts.error) {
    console.error(`conformance: ${opts.error}\n${HELP}`);
    process.exitCode = 2;
    return;
  }
  if (opts.dryRun) return console.log(planText(opts));
  const out = opts.out ?? path.join(tmpdir(), `den-conformance-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  console.log(planText(opts));
  const results = await runSpikes({
    spikes: opts.spikes,
    out,
    claudeBin: process.env.DEN_CLAUDE_BIN || "claude",
    env: process.env,
    extraEnv: opts.extraEnv,
    model: opts.model,
    timeoutMs: opts.timeoutMs,
  });
  console.log("");
  for (const r of results) {
    console.log(`${r.spike} ${r.verdict.toUpperCase()}`);
    for (const line of r.evidence) console.log(`  - ${line}`);
  }
  console.log(`\nfixtures and results.json: ${out}`);
  if (results.some((r) => r.verdict === "no-go")) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
