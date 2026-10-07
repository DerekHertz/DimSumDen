Jevgrep: 3 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 1 file(s).
- "apps/bridge/cells/conformance.mjs" — implementation, caller, fixture, helper; source below
- "apps/bridge/cells/conformance.test.mjs" — caller, test, fixture, helper; source below
- "docs/adr/0016-ui-steering-channel.md" — helper; locations only
End file list. Declaration locations follow source.

Source block "apps/bridge/cells/conformance.mjs" lines 42-75:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 153-198:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 215-242:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 439-470:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 475-499:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 508-524:
```
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
```

Source block "apps/bridge/cells/conformance.mjs" lines 556-615:
```
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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 8-153:
```
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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 156-183:
```
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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 483-518:
```
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

```

Declaration locations:
- "apps/bridge/cells/conformance.mjs"
  source@15-15
  source@16-16
  source@17-17
  source@18-18
  source@19-19
  source@20-20
  source@21-21
  USAGE_SCRIPT@24-24
  FORBIDDEN_FLAGS@31-31
  ENV_ALLOW@33-33
  buildChildEnv@36-43
  buildArgs@45-58
  userMessageLine@61-63
  controlResponseLine@65-72
  parseCaptureLines@74-85
  objs@89-89
  blocks@90-90
  initOf@91-91
  resultsOf@92-92
  toolUses@93-94
  toolResults@95-96
  controlRequests@97-97
  flat@98-98
  verdict@99-99
  evaluateS1@103-126
  evaluateS2@128-154
  evaluateS3@156-176
  evaluateS4@178-195
  evaluateS5@199-216
  evaluateS6@218-239
  evaluateS7@243-259
  Child.source@264-296
  Child.now@297-299
  Child.#line@300-304
  Child.send@305-307
  Child.endStdin@308-310
  Child.kill@311-313
  Child.waitFor@315-331
  Child.waitExit@332-344
  Child.capture@345-347
  isResult@350-350
  isToolUse@351-351
  isControlRequest@352-352
  PROBE_MARKER@354-354
  PROBE_ROLE@355-362
  makeWorkdir@364-371
  readUsage@373-384
  sleep@386-386
  makeCtx@390-404
  runTurn@406-409

Output truncated at the byte limit (24576 bytes); 1739 original bytes omitted.

End context.
