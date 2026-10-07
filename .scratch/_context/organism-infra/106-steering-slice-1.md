Jevgrep: 31 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 4 file(s).
- "apps/bridge/bridge-requests.test.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/conformance.test.mjs" — test, fixture, helper; source below
- "apps/bridge/server.mjs" — implementation, helper; locations only
- "apps/bridge/requests-log.mjs" — helper; source below
- "scripts/cell-start-context-gate.test.mjs" — test, fixture, helper; source below
- "apps/bridge/bridge-csp.test.mjs" — test, fixture, helper; source below
- "apps/bridge/bridge-state.test.mjs" — test, fixture, helper; source below
- "scripts/usage-provider.test.mjs" — caller, test, fixture, helper; source below
- "scripts/cell-start-ticket-claim.test.mjs" — test, fixture; source below
- "scripts/exposure.test.mjs" — test, fixture, helper; locations only
- "docs/adr/0016-ui-steering-channel.md" — helper; locations only
- "scripts/requests.test.mjs" — test, fixture; source omitted
- "scripts/jev-advisory-cli.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/conformance.mjs" — fixture, helper; locations only
- "apps/bridge/bridge-metrics.test.mjs" — test, fixture, helper; source omitted
- "docs/adr/0019-refocus.md" — helper; locations only
- "apps/organism-infra/board-comment-hardening.test.mjs" — test, fixture, helper; source omitted
- "scripts/usage-token.mjs" — helper; locations only
- "scripts/requests.mjs" — helper; locations only
- "scripts/risk-check.secrets.test.mjs" — test, fixture, helper; locations only
- "scripts/risk-check.mjs" — helper; locations only
- "scripts/cell-start.existing-branch.test.mjs" — test, fixture; locations only
- "scripts/jev-hardening.test.mjs" — test, fixture, helper; locations only
- "scripts/exposure.mjs" — helper; locations only
- "scripts/cell-start.mjs" — helper; locations only
- "apps/bridge/watch.mjs" — helper; locations only
- "scripts/jev-wake-prelude.mjs" — helper; locations only
- "apps/bridge/bridge-fixture.mjs" — fixture, helper; locations only
- "apps/bridge/snapshot.mjs" — helper; locations only
- "scripts/usage.mjs" — relevant; role uncertain; locations only
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md" — helper; locations only
End file list. Declaration locations follow source.

Source block "apps/bridge/bridge-requests.test.mjs" lines 9-19:
```
import { makeStateFixture, FEATURE, PENDING_ID } from "./bridge-fixture.mjs";

const DISPATCH_REF = `${FEATURE}/02-ready-p0`; // gate "dispatch" in the fixture
const MERGE_REF = `${FEATURE}/04-review`; // gate "merge", but its request is already pending

let fx;
let bridge;
let file;

beforeEach(async () => {
  fx = await makeStateFixture();
```

Source block "apps/bridge/bridge-requests.test.mjs" lines 25-31:
```
  await fx.cleanup();
});

const lines = async () => (await readFile(file, "utf8")).split("\n").filter(Boolean);
const safeJson = (s) => {
  try {
    return JSON.parse(s);
```

Source block "apps/bridge/bridge-requests.test.mjs" lines 34-153:
```
  }
};

function post(body, { headers = {}, raw = false, host } = {}) {
  return new Promise((resolve, reject) => {
    const payload = raw ? body : JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port: bridge.port,
        path: "/requests",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...(host ? { Host: host } : {}), ...headers },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, body: d ? safeJson(d) : null }));
      },
    );
    req.on("error", (e) => (e.code === "ECONNRESET" || e.code === "EPIPE" ? resolve({ status: 413, body: null }) : reject(e)));
    req.end(payload);
  });
}

// Mark the fixture's pending merge request handled, so the merge gate is free to be requested.
const handlePending = () =>
  appendFile(file, JSON.stringify({ handled: PENDING_ID, ts: "2026-09-29T05:59:00.000Z", outcome: "merged" }) + "\n");

describe("POST /requests: valid", () => {
  test("a valid dispatch request returns 201, is assigned id and ts, and appends exactly one line", async () => {
    const before = (await lines()).length;
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "go" });
    assert.equal(res.status, 201);
    const r = res.body.request;
    assert.match(r.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.ok(!Number.isNaN(Date.parse(r.ts)));
    assert.equal(r.kind, "dispatch-approve");
    assert.equal(r.ref, DISPATCH_REF);
    assert.equal(r.note, "go");
    const after = await lines();
    assert.equal(after.length, before + 1);
    assert.deepEqual(JSON.parse(after.at(-1)), r);
  });

  test("note is optional and omitted from the line when absent", async () => {
    const res = await post({ kind: "dispatch-reject", ref: DISPATCH_REF });
    assert.equal(res.status, 201);
    assert.equal("note" in JSON.parse((await lines()).at(-1)), false);
  });

  test("an empty board has no such ref: 404 and no requests file is created", async () => {
    const empty = await makeStateFixture({ empty: true });
    const b = await startBridge({ root: empty.root, port: 0 });
    try {
      const res = await fetch(`${b.url}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dispatch-approve", ref: DISPATCH_REF }),
      });
      assert.equal(res.status, 404);
      await assert.rejects(readFile(path.join(empty.root, ".scratch", "_requests", "requests.jsonl")));
    } finally {
      await b.close();
      await empty.cleanup();
    }
  });

  test("a merge request is accepted once the earlier one is handled", async () => {
    await handlePending();
    const res = await post({ kind: "merge-reject", ref: MERGE_REF });
    assert.equal(res.status, 201);
  });

  test("the snapshot shows the new request as the ticket's pending request", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF });
    const snap = await (await fetch(`${bridge.url}/state`)).json();
    const t = snap.tickets.find((x) => x.ref === DISPATCH_REF);
    assert.equal(t.request.id, res.body.request.id);
    assert.equal(t.request.kind, "dispatch-approve");
  });
});

describe("POST /requests: invalid writes nothing", () => {
  async function rejects(body, status, opts) {
    const before = await readFile(file, "utf8");
    const res = await post(body, opts);
    assert.equal(res.status, status, JSON.stringify(res.body));
    assert.equal(await readFile(file, "utf8"), before, "file must be unchanged");
  }

  test("unknown kind is 400", () => rejects({ kind: "merge-yolo", ref: DISPATCH_REF }, 400));
  test("missing kind is 400", () => rejects({ ref: DISPATCH_REF }, 400));
  test("malformed JSON is 400", () => rejects("{not json", 400, { raw: true }));
  test("non-string note is 400", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, note: 5 }, 400));
  test("note over 500 characters is 400", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "x".repeat(501) }, 400));
  test("note of exactly 500 characters is accepted", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "x".repeat(500) });
    assert.equal(res.status, 201);
  });
  test("ref not in the snapshot is 404", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/99-nope` }, 404));
  test("a resolved ticket is not in the snapshot: 404", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/01-done` }, 404));
  test("kind that does not match the ticket's gate is 409", () => rejects({ kind: "merge-approve", ref: DISPATCH_REF }, 409));
  test("a ticket with no gate is 409", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/08-plain` }, 409));
  test("a second request while one is pending for the ref is 409", () => rejects({ kind: "merge-approve", ref: MERGE_REF }, 409));
  test("a duplicate of a request just accepted is 409 and adds nothing", async () => {
    assert.equal((await post({ kind: "dispatch-approve", ref: DISPATCH_REF })).status, 201);
    await rejects({ kind: "dispatch-reject", ref: DISPATCH_REF }, 409);
  });
  test("body over 4 KB is 413", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, pad: "x".repeat(5000) }, 413));
  test("wrong Content-Type is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { headers: { "Content-Type": "text/plain" } }));
  test("a foreign Origin is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { headers: { Origin: "http://evil.example" } }));
  test("a foreign Host header is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { host: "evil.example" }));

  test("a same-origin Origin header is accepted", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF }, { headers: { Origin: `http://127.0.0.1:${bridge.port}` } });
    assert.equal(res.status, 201);
  });
});

```

Source block "apps/bridge/cells/conformance.test.mjs" lines 31-39:
```

// Capture helpers: a capture is { lines: [{ t, obj }], exit: { code, signal, t }|null, stderr }.
const L = (t, obj) => ({ t, obj });
const init = (t = 100, extra = {}) => L(t, { type: "system", subtype: "init", session_id: SID, ...extra });
const toolUse = (t, name, input, id = "tu1", extra = {}) =>
  L(t, { type: "assistant", message: { content: [{ type: "tool_use", id, name, input }] }, ...extra });
const toolResult = (t, id, content, isError = false, extra = {}) =>
  L(t, { type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, content, is_error: isError }] }, ...extra });
const text = (t, s) => L(t, { type: "assistant", message: { content: [{ type: "text", text: s }] } });
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 124-137:
```

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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 172-183:
```

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

Source block "apps/bridge/cells/conformance.test.mjs" lines 210-241:
```

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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 247-253:
```

// ---- S4 ----------------------------------------------------------------------------------

const s4Meta = { killedAt: 1000, transcriptFound: true, sessionId: SID };
test("S4 go: SIGTERM ends the child quickly, the transcript stays, resume reopens the session", () => {
  const killed = cap([init(100), toolUse(500, "Bash", { command: "sleep 20" })], { code: null, signal: "SIGTERM", t: 1300 });
  const resumed = cap([init(50, { session_id: SID }), result(900, "You were running sleep 20")]);
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 255-269:
```
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

```

Source block "apps/bridge/cells/conformance.test.mjs" lines 384-412:
```

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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 427-459:
```
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
```

Source block "apps/bridge/cells/conformance.test.mjs" lines 483-502:
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
```

Source block "apps/bridge/requests-log.mjs" lines 1-10:
```
// Gate requests log (ADR 0011 decision 6). One append-only JSONL file; a request is pending
// until a later {handled, ts, outcome} line names its id. Shared by the bridge (snapshot, POST)
// and scripts/requests.mjs, so both agree on what "pending" means.
import { readFile, appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const REQUEST_KINDS = ["merge-approve", "merge-reject", "dispatch-approve", "dispatch-reject"];
const HANDLED_KEPT = 10;

export const requestsFile = (root) => path.join(root, ".scratch", "_requests", "requests.jsonl");
```

Source block "scripts/cell-start-context-gate.test.mjs" lines 78-102:
```
  writeFileSync(path.join(fx.projDir, `${SESSION}.jsonl`), [assistant(1), assistant(tokens)].join("\n") + "\n");
}

function run(fx, extra = [], env = {}) {
  return spawnSync(
    "node",
    [SCRIPT, "--base", fx.sha, "--detach", "--ticket", REF, "--cell", "developer", ...extra],
    {
      cwd: fx.wt,
      encoding: "utf8",
      timeout: 60000,
      env: {
        ...process.env,
        PATH: `${fx.bin}${path.delimiter}${process.env.PATH}`,
        ORGANISM_ROOT: fx.main,
        HOME: fx.home,
        CLAUDE_CODE_SESSION_ID: SESSION,
        ...env,
      },
    },
  );
}

function ticketStatus(fx) {
  return spawnSync("node", [CLI, "status", REF], { cwd: fx.wt, encoding: "utf8", env: { ...process.env, ORGANISM_ROOT: fx.main } }).stdout;
```

Source block "scripts/cell-start-context-gate.test.mjs" lines 111-117:
```
  }
}

const out = (r) => `${r.stdout}\n${r.stderr}`;

// --- below the warning line ---

```

Source block "apps/bridge/bridge-csp.test.mjs" lines 8-16:
```
import { startBridge } from "./server.mjs";
import { makeStateFixture } from "./bridge-fixture.mjs";

function directive(csp, name) {
  return csp.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(name + " ")) ?? null;
}

describe("bridge static CSP", () => {
  let fx, uiDir, bridge;
```

Source block "apps/bridge/bridge-state.test.mjs" lines 231-274:
```
    }));
});

describe("network binding", () => {
  test("binds 127.0.0.1 only: url uses it and a non-loopback address refuses connections", () =>
    withBridge({ empty: true }, async (bridge) => {
      assert.match(bridge.url, /^http:\/\/127\.0\.0\.1:\d+$/);
      assert.equal(new URL(bridge.url).port, String(bridge.port));
      const external = Object.values(os.networkInterfaces())
        .flat()
        .find((i) => i && i.family === "IPv4" && !i.internal);
      if (!external) return; // no non-loopback interface to probe on this host
      const outcome = await new Promise((resolve) => {
        const s = net.connect({ host: external.address, port: bridge.port });
        s.once("connect", () => {
          s.destroy();
          resolve("connected");
        });
        s.once("error", (e) => resolve(e.code));
        setTimeout(() => {
          s.destroy();
          resolve("timeout");
        }, 3000);
      });
      assert.notEqual(outcome, "connected", `bridge reachable on ${external.address}`);
    }));

  test("a request whose Host header is not loopback is a 403 (DNS rebinding)", () =>
    withBridge({ empty: true }, async (bridge) => {
      const status = await new Promise((resolve, reject) => {
        const req = http.request(
          { host: "127.0.0.1", port: bridge.port, path: "/state", headers: { Host: "evil.example.com" } },
          (r) => {
            r.resume();
            resolve(r.statusCode);
          },
        );
        req.on("error", reject);
        req.end();
      });
      assert.equal(status, 403);
    }));
});

```

Source block "scripts/usage-provider.test.mjs" lines 60-118:
```
});
`;

function fixtureRun(args, { response = { rateLimits: codex() }, mode = "ok", claude = false, remote = false, selfCheck = false, timeout } = {}) {
  // organism-infra/104: the adapter deadline starts when the app-server spawns, so 1 s made every success test flake
  // when the machine was busy. Only the hang modes need a short deadline (they assert the deadline is honored).
  timeout ??= mode.startsWith("hang") ? "1000" : "20000";
  const root = mkdtempSync(path.join(tmpdir(), "usage-provider-"));
  const bin = path.join(root, "bin");
  const runtime = path.join(root, "runtime");
  mkdirSync(bin); mkdirSync(runtime);
  const trace = path.join(root, "trace.jsonl");
  const pidfile = path.join(root, "pid");
  const fetched = path.join(root, "fetches");
  const preload = path.join(root, "preload.mjs");
  writeFileSync(path.join(bin, "codex"), FAKE_CLI, { mode: 0o755 });
  if (mode === "missing-cli") rmSync(path.join(bin, "codex"));
  if (claude) {
    mkdirSync(path.join(root, ".claude"));
    writeFileSync(path.join(root, ".claude", ".credentials.json"), JSON.stringify({ claudeAiOauth: { accessToken: SECRET } }));
  }
  writeFileSync(preload, `import {appendFileSync} from 'node:fs';
globalThis.fetch=async(url)=>{appendFileSync(${JSON.stringify(fetched)},String(url)+'\\n');
if(!${JSON.stringify(claude)}) throw new Error('network forbidden in Codex fixture');
```

Output truncated at the byte limit (24576 bytes); 14512 original bytes omitted.

End context.
