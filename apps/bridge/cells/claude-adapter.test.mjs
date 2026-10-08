// organism-infra/142 (ADR 0016 decisions 2, 6.5, 6.6, 6.8; amendment 5): the pure half of the Claude adapter.
// Public interface under test, all exported from ./claude-adapter.mjs (names and shapes pinned in the qa specify handoff):
//   buildClaudeArgs({ sessionId, agent, model? })         -> string[]   the fixed argv template (no binary name)
//   CLAUDE_MODELS                                           -> string[]   the fixed model list
//   buildClaudeEnv(parentEnv)                               -> object     the child's environment allowlist
//   MAX_LINE_BYTES                                          -> number     the stdout line cap (1 MB)
//   createLineSplitter({ maxLineBytes? }).push(chunk)       -> string[]   complete lines; an oversize line is dropped and resynced
//   parseClaudeLine(line)                                   -> CellEvent[] (tool-start, tool-end, usage, done; never throws)
//   decodeControlRequest(obj, seen)                         -> { kind: "approval", requestId, tool, input }
//                                                            | { kind: "deny", requestId } | { kind: "drop" }
//   encodeControlResponse({ requestId, allow, reason?, input }) -> one stdin line (JSON + "\n")
// Fixtures under ./fixtures/ are real captured lines (S1 to S3 of 2026-10-05, S4b and S6b and S8 of 2026-10-08), scrubbed.
// The expected values below are hand-read from those files and from ADR 0016, never recomputed with the code under test.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { controlResponseLine } from "./conformance.mjs";
import { ROLES, UUID_RE } from "./policy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures");

// A missing module fails each test by name with a plain message, not one import error for the whole file.
const adapter = await import("./claude-adapter.mjs").catch(() => ({}));
function need(name) {
  assert.equal(typeof adapter[name], "function", `claude-adapter.mjs must export the function ${name}`);
  return adapter[name];
}

const fixtureText = (name) => readFileSync(path.join(FIXTURES, name), "utf8");
const fixtureLines = (name) => fixtureText(name).split("\n").filter(Boolean);
const fixtureObjs = (name) => fixtureLines(name).map((l) => JSON.parse(l));

const SID = "5d3c9a52-8f0e-4b7c-9a41-0e6f1c2b7d90";
const SID2 = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const DENY_SETTINGS = '{"permissions":{"deny":["Write(.claude/**)","Edit(.claude/**)"]}}';

// ---- buildClaudeArgs -----------------------------------------------------------------------

describe("buildClaudeArgs: the fixed argv template (ADR 0016 6.6)", () => {
  const base = (agent = "architect", sessionId = SID) => [
    "-p",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--verbose",
    "--permission-prompt-tool", "stdio",
    "--session-id", sessionId,
    "--agent", agent,
    "--setting-sources", "project,local",
    "--strict-mcp-config",
    "--settings", DENY_SETTINGS,
  ];

  test("whole-argv equality: the exact list for a fixed input", () => {
    assert.deepEqual(need("buildClaudeArgs")({ sessionId: SID, agent: "architect" }), base());
  });

  test("with a model the argv is the same list plus `--model <m>` right after the agent, nothing else", () => {
    const model = adapter.CLAUDE_MODELS?.[0];
    assert.equal(typeof model, "string", "CLAUDE_MODELS must be an exported non-empty list");
    const expected = base();
    expected.splice(expected.indexOf("--agent") + 2, 0, "--model", model);
    assert.deepEqual(need("buildClaudeArgs")({ sessionId: SID, agent: "architect", model }), expected);
  });

  test("--setting-sources project,local and --strict-mcp-config are present, and no --mcp-config", () => {
    const argv = need("buildClaudeArgs")({ sessionId: SID, agent: "scout" });
    assert.equal(argv[argv.indexOf("--setting-sources") + 1], "project,local");
    assert.ok(argv.includes("--strict-mcp-config"));
    assert.ok(!argv.includes("--mcp-config"));
  });

  test("--settings carries the inline deny rule for Write and Edit of .claude/**, as JSON and not a file path", () => {
    const argv = need("buildClaudeArgs")({ sessionId: SID, agent: "scout" });
    const value = argv[argv.indexOf("--settings") + 1];
    const parsed = JSON.parse(value);
    assert.deepEqual(parsed, { permissions: { deny: ["Write(.claude/**)", "Edit(.claude/**)"] } });
    assert.equal(argv.filter((a) => a === "--settings").length, 1);
  });

  test("the child asks for permissions over stdio (the control_request channel)", () => {
    const argv = need("buildClaudeArgs")({ sessionId: SID, agent: "scout" });
    assert.equal(argv[argv.indexOf("--permission-prompt-tool") + 1], "stdio");
  });

  test("no permission-broadening flag for any role, with or without a model", () => {
    const build = need("buildClaudeArgs");
    const broadening = [
      "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--permission-mode",
      "--allowedTools", "--allowed-tools", "--add-dir", "--mcp-config", "--tools", "--disallowedTools", "--bare",
    ];
    for (const agent of ROLES) {
      for (const model of [undefined, ...(adapter.CLAUDE_MODELS ?? [])]) {
        const argv = build({ sessionId: SID, agent, ...(model ? { model } : {}) });
        for (const arg of argv) {
          for (const flag of broadening) assert.ok(arg !== flag && !arg.startsWith(`${flag}=`), `${agent}/${model}: argv holds ${arg}`);
        }
      }
    }
  });

  test("the only flags the builder can emit are the template's own", () => {
    const build = need("buildClaudeArgs");
    const flagsOf = (argv) => argv.filter((a, i) => a.startsWith("-") && argv[i - 1] !== "--settings" && argv[i - 1] !== "--agent" && argv[i - 1] !== "--session-id" && argv[i - 1] !== "--model").sort();
    const template = ["--input-format", "--output-format", "--permission-prompt-tool", "--session-id", "--agent", "--setting-sources", "--settings", "--strict-mcp-config", "--verbose", "-p"].sort();
    assert.deepEqual(flagsOf(build({ sessionId: SID, agent: "qa" })), template);
    const withModel = flagsOf(build({ sessionId: SID, agent: "qa", model: adapter.CLAUDE_MODELS?.[0] }));
    assert.deepEqual(withModel, [...template, "--model"].sort());
  });

  test("varying each allowed parameter changes only its own slot", () => {
    const build = need("buildClaudeArgs");
    const diffs = (a, b) => a.map((v, i) => (v === b[i] ? -1 : i)).filter((i) => i >= 0);
    const one = build({ sessionId: SID, agent: "architect" });
    assert.equal(one.length, build({ sessionId: SID2, agent: "architect" }).length);
    assert.deepEqual(diffs(one, build({ sessionId: SID2, agent: "architect" })), [one.indexOf(SID)]);
    assert.deepEqual(diffs(one, build({ sessionId: SID, agent: "designer" })), [one.indexOf("architect")]);
    if (adapter.CLAUDE_MODELS?.length > 1) {
      const [m1, m2] = adapter.CLAUDE_MODELS;
      const a = build({ sessionId: SID, agent: "architect", model: m1 });
      const b = build({ sessionId: SID, agent: "architect", model: m2 });
      assert.deepEqual(diffs(a, b), [a.indexOf(m1)]);
    }
  });

  test("CLAUDE_MODELS is a fixed non-empty list of plain names, each accepted and landing only in the model slot", () => {
    const models = adapter.CLAUDE_MODELS;
    assert.ok(Array.isArray(models) && models.length > 0, "CLAUDE_MODELS must be an exported non-empty array");
    for (const m of models) {
      assert.equal(typeof m, "string");
      assert.ok(m.length > 0 && !m.startsWith("-"), `model ${m} must not look like a flag`);
      const argv = need("buildClaudeArgs")({ sessionId: SID, agent: "qa", model: m });
      assert.equal(argv[argv.indexOf("--model") + 1], m);
    }
  });

  test("rejects input outside the template instead of ignoring it", () => {
    const build = need("buildClaudeArgs");
    const good = { sessionId: SID, agent: "architect" };
    for (const extra of [
      { extraArgs: ["--dangerously-skip-permissions"] },
      { allowedTools: ["Bash"] },
      { permissionMode: "bypassPermissions" },
      { permissionPromptTool: "stdio" },
      { settings: "{}" },
      { resume: SID },
      { mcpConfig: "x.json" },
      { addDir: "/" },
      { anything: 1 },
    ]) {
      assert.throws(() => build({ ...good, ...extra }), `extra key ${Object.keys(extra)[0]} must be rejected`);
    }
  });

  test("rejects a flag-shaped or unknown agent", () => {
    const build = need("buildClaudeArgs");
    for (const agent of ["--dangerously-skip-permissions", "-p", "probe", "", "Architect", "architect\n", "architect --agent qa", undefined, null, 7, ["qa"]]) {
      assert.throws(() => build({ sessionId: SID, agent }), `agent ${JSON.stringify(agent)} must be rejected`);
    }
  });

  test("rejects a session id that is not a UUID", () => {
    const build = need("buildClaudeArgs");
    for (const sessionId of ["--resume", "not-a-uuid", "", `${SID}\n`, `${SID} --verbose`, undefined, null, 7, [SID]]) {
      assert.throws(() => build({ sessionId, agent: "qa" }), `sessionId ${JSON.stringify(sessionId)} must be rejected`);
    }
    assert.ok(UUID_RE.test(SID), "the test's own session ids are valid UUIDs");
  });

  test("rejects a model outside the fixed list, a flag-shaped one, and a non-string", () => {
    const build = need("buildClaudeArgs");
    for (const model of ["--allowedTools", "-p", "gpt-4", "", "not-a-listed-model", 7, ["x"], {}]) {
      assert.throws(() => build({ sessionId: SID, agent: "qa", model }), `model ${JSON.stringify(model)} must be rejected`);
    }
  });

  test("rejects a missing or non-object argument", () => {
    const build = need("buildClaudeArgs");
    for (const arg of [undefined, null, "architect", 7, []]) assert.throws(() => build(arg));
  });

  test("returns a fresh array each call: mutating one result never changes the next", () => {
    const build = need("buildClaudeArgs");
    const first = build({ sessionId: SID, agent: "architect" });
    first.push("--dangerously-skip-permissions");
    first[0] = "mutated";
    assert.deepEqual(build({ sessionId: SID, agent: "architect" }), base());
  });
});

// ---- buildClaudeEnv ------------------------------------------------------------------------

describe("buildClaudeEnv: the child's environment is an allowlist, never a copy (ADR 0016 6.6)", () => {
  const parent = {
    PATH: "/usr/bin:/bin",
    HOME: "/home/someone",
    LANG: "en_US.UTF-8",
    LC_ALL: "C.UTF-8",
    LC_CTYPE: "en_US.UTF-8",
    DEN_CLAUDE_BIN: "/opt/claude/bin/claude",
    ANTHROPIC_API_KEY: "sk-not-a-real-key",
    ANTHROPIC_AUTH_TOKEN: "tok",
    CLAUDE_CODE_OAUTH_TOKEN: "tok",
    GITHUB_TOKEN: "tok",
    AWS_SECRET_ACCESS_KEY: "tok",
    DEN_CONFORMANCE_CANARY: "canary",
    NODE_OPTIONS: "--require /tmp/evil.js",
    LD_PRELOAD: "/tmp/evil.so",
    SSH_AUTH_SOCK: "/tmp/agent.sock",
    TMPDIR: "/tmp",
    USER: "someone",
    SHELL: "/bin/zsh",
    LCX: "not a locale variable",
  };

  test("keeps exactly PATH, HOME, the locale variables and DEN_CLAUDE_BIN, with their values", () => {
    assert.deepEqual(need("buildClaudeEnv")(parent), {
      PATH: "/usr/bin:/bin",
      HOME: "/home/someone",
      LANG: "en_US.UTF-8",
      LC_ALL: "C.UTF-8",
      LC_CTYPE: "en_US.UTF-8",
      DEN_CLAUDE_BIN: "/opt/claude/bin/claude",
    });
  });

  test("no API key, token, canary, preload or other inherited variable survives (ADR 0001: the owner's login only)", () => {
    const env = need("buildClaudeEnv")(parent);
    for (const name of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN", "GITHUB_TOKEN", "AWS_SECRET_ACCESS_KEY", "DEN_CONFORMANCE_CANARY", "NODE_OPTIONS", "LD_PRELOAD", "SSH_AUTH_SOCK", "LCX"]) {
      assert.ok(!(name in env), `${name} must not reach the child`);
    }
  });

  test("a second argument cannot widen the allowlist", () => {
    const env = need("buildClaudeEnv")(parent, ["GITHUB_TOKEN", "DEN_CONFORMANCE_CANARY"]);
    assert.ok(!("GITHUB_TOKEN" in env) && !("DEN_CONFORMANCE_CANARY" in env));
  });

  test("an unset allowlisted variable is absent, not the string undefined; an empty parent gives an empty env", () => {
    assert.deepEqual(need("buildClaudeEnv")({ PATH: "/bin", HOME: undefined, LANG: undefined }), { PATH: "/bin" });
    assert.deepEqual(need("buildClaudeEnv")({}), {});
  });

  test("the parent environment is not mutated", () => {
    const copy = { ...parent };
    need("buildClaudeEnv")(parent);
    assert.deepEqual(parent, copy);
  });
});

// ---- createLineSplitter --------------------------------------------------------------------

describe("createLineSplitter: stdout chunks to lines, with a size cap and resync (ADR 0016 6.8)", () => {
  test("a line split across chunks is joined; several lines in one chunk come out in order; blank lines are skipped", () => {
    const s = need("createLineSplitter")();
    assert.deepEqual(s.push('{"a":'), []);
    assert.deepEqual(s.push('1}\n{"b":2}\n\n{"c"'), ['{"a":1}', '{"b":2}']);
    assert.deepEqual(s.push(":3}\n"), ['{"c":3}']);
  });

  test("a multi-byte character cut between two Buffer chunks arrives intact", () => {
    const s = need("createLineSplitter")();
    const bytes = Buffer.from('{"t":"é😀"}\n', "utf8");
    const cut = bytes.indexOf(0xf0) + 2; // inside the four-byte emoji
    assert.deepEqual(s.push(bytes.subarray(0, cut)), []);
    assert.deepEqual(s.push(bytes.subarray(cut)), ['{"t":"é😀"}']);
  });

  test("a line of exactly the cap is kept; one byte more is dropped, and the next line still arrives", () => {
    const s = need("createLineSplitter")({ maxLineBytes: 16 });
    assert.deepEqual(s.push(`${"a".repeat(16)}\n`), ["a".repeat(16)]);
    assert.deepEqual(s.push(`${"b".repeat(17)}\n{"ok":1}\n`), ['{"ok":1}']);
  });

  test("an oversize line with no newline across many chunks is dropped, and the stream resyncs at the next newline", () => {
    const s = need("createLineSplitter")({ maxLineBytes: 16 });
    assert.deepEqual(s.push("x".repeat(10)), []);
    assert.deepEqual(s.push("x".repeat(10)), []); // 20 bytes and still no newline: over the cap
    assert.deepEqual(s.push("yy\n"), []); // the rest of the oversize line is discarded, not emitted
    assert.deepEqual(s.push('{"ok":1}\n'), ['{"ok":1}']);
  });

  test("a flood of newline-free input is bounded and costs only the one oversize line", () => {
    const s = need("createLineSplitter")({ maxLineBytes: 1024 });
    const chunk = "z".repeat(1024);
    for (let i = 0; i < 5000; i += 1) assert.deepEqual(s.push(chunk), []);
    assert.deepEqual(s.push('\n{"after":true}\n'), ['{"after":true}']);
  });

  test("the default cap is MAX_LINE_BYTES, about 1 MB", () => {
    assert.ok(Number.isInteger(adapter.MAX_LINE_BYTES) && adapter.MAX_LINE_BYTES >= 1_000_000 && adapter.MAX_LINE_BYTES <= 1_048_576, "MAX_LINE_BYTES must be an exported integer near 1 MB");
    const s = need("createLineSplitter")();
    assert.deepEqual(s.push(`${"q".repeat(adapter.MAX_LINE_BYTES + 1)}\n{"ok":1}\n`), ['{"ok":1}']);
  });
});

// ---- parseClaudeLine -----------------------------------------------------------------------

describe("parseClaudeLine over the committed fixtures", () => {
  const eventsOf = (name) => fixtureLines(name).flatMap((l) => need("parseClaudeLine")(l));
  const ofType = (events, type) => events.filter((e) => e.type === type);

  // [fixture, tool names in order, tool results, done count, a string every Bash/Write summary list must contain]
  const table = [
    ["s1.jsonl", ["Bash"], 1, 1, ["printenv DEN_CONFORMANCE_CANARY"]],
    ["s2.jsonl", ["Bash"], 1, 1, ["sleep 3"]],
    ["s3-allow.jsonl", ["Write"], 1, 1, ["s3-allow.txt"]],
    ["s3-deny.jsonl", ["Write"], 1, 1, ["s3-deny.txt"]],
    ["s4b-eof.jsonl", ["Bash", "Bash"], 2, 1, ["sleep 61", "sleep 61"]],
    ["s6b.jsonl", ["Write", "Write"], 2, 1, ["allowed.txt", "probe.txt"]],
    ["s8.jsonl", ["Bash", "Write"], 2, 2, ["sleep 15", "s8.txt"]],
  ];

  for (const [name, tools, results, dones, summaries] of table) {
    test(`${name}: tool starts, tool ends and the end of turn`, () => {
      const events = eventsOf(name);
      const starts = ofType(events, "tool-start");
      assert.deepEqual(starts.map((e) => e.name), tools);
      starts.forEach((e, i) => {
        assert.equal(typeof e.summary, "string");
        assert.ok(e.summary.includes(summaries[i]), `summary ${JSON.stringify(e.summary)} should show ${summaries[i]}`);
        assert.ok(e.summary.length <= 200);
        assert.deepEqual(Object.keys(e).sort(), ["name", "summary", "type"], "a tool-start carries no full tool input");
      });
      assert.equal(ofType(events, "tool-end").length, results);
      const done = ofType(events, "done");
      assert.equal(done.length, dones);
      for (const d of done) assert.deepEqual(d, { type: "done", ok: true });
    });
  }

  test("a tool-start comes before its tool-end", () => {
    const types = eventsOf("s1.jsonl").map((e) => e.type).filter((t) => t === "tool-start" || t === "tool-end");
    assert.deepEqual(types, ["tool-start", "tool-end"]);
  });

  test("assistant usage becomes a usage event: output tokens exactly, input tokens at least the plain input count", () => {
    const usage = ofType(eventsOf("s3-allow.jsonl"), "usage");
    assert.ok(usage.length >= 1);
    for (const u of usage) {
      assert.deepEqual(Object.keys(u).sort(), ["input", "output", "type"]);
      assert.ok(Number.isInteger(u.input) && u.input >= 8, "input counts at least input_tokens (8 or 10 in this fixture)");
      assert.ok(Number.isInteger(u.output) && u.output >= 0);
    }
    // The last assistant line of s3-allow carries output_tokens 1 (hand-read from the fixture).
    assert.equal(usage.at(-1).output, 1);
  });

  test("an errored tool result still ends the tool (s3-deny, s6b)", () => {
    assert.equal(ofType(eventsOf("s3-deny.jsonl"), "tool-end").length, 1);
    assert.equal(ofType(eventsOf("s6b.jsonl"), "tool-end").length, 2);
  });

  test("a control_request line is not a CellEvent here: it is decoded by decodeControlRequest, which tracks request ids", () => {
    const line = fixtureLines("s3-allow.jsonl").find((l) => JSON.parse(l).type === "control_request");
    assert.deepEqual(need("parseClaudeLine")(line), []);
  });

  test("lines that carry no event give no event: init, thinking_tokens, rate_limit_event, hooks, background-task notices", () => {
    const quiet = ["thinking_tokens", "rate_limit_event", "hook_started", "hook_response", "task_started", "task_notification", "background_tasks_changed", "permission_denied", "command_lifecycle"];
    let seen = 0;
    for (const name of ["s1.jsonl", "s4b-eof.jsonl", "s6b.jsonl", "s8.jsonl"]) {
      for (const l of fixtureLines(name)) {
        const o = JSON.parse(l);
        if (quiet.includes(o.subtype) || quiet.includes(o.type)) {
          seen += 1;
          assert.deepEqual(need("parseClaudeLine")(l), [], `${o.type}/${o.subtype} should give no event`);
        }
      }
    }
    assert.ok(seen >= 8, "the fixtures hold plenty of quiet lines");
  });
});

describe("parseClaudeLine: result lines and message shapes", () => {
  const resultLine = (patch) => {
    const base = fixtureObjs("s1.jsonl").find((o) => o.type === "result");
    return JSON.stringify({ ...base, ...patch });
  };

  test("a successful result is done ok", () => {
    assert.deepEqual(need("parseClaudeLine")(resultLine({})), [{ type: "done", ok: true }]);
  });

  test("an error result is done not ok", () => {
    assert.deepEqual(need("parseClaudeLine")(resultLine({ is_error: true })), [{ type: "done", ok: false }]);
    assert.deepEqual(need("parseClaudeLine")(resultLine({ subtype: "error_max_turns", is_error: false })), [{ type: "done", ok: false }]);
    assert.deepEqual(need("parseClaudeLine")(resultLine({ subtype: "error_during_execution" })), [{ type: "done", ok: false }]);
  });

  test("one assistant line with two tool_use blocks gives two tool-starts, one per block", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: { role: "assistant", content: [
        { type: "tool_use", id: "t1", name: "Read", input: { file_path: "docs/a.md" } },
        { type: "tool_use", id: "t2", name: "Bash", input: { command: "npm test" } },
      ] },
    });
    const starts = need("parseClaudeLine")(line).filter((e) => e.type === "tool-start");
    assert.deepEqual(starts.map((e) => e.name), ["Read", "Bash"]);
  });

  test("a very long command is shortened in the summary, not passed whole", () => {
    const line = JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: "t", name: "Bash", input: { command: `echo ${"x".repeat(5000)}` } }] } });
    const [start] = need("parseClaudeLine")(line).filter((e) => e.type === "tool-start");
    assert.ok(start.summary.length > 0 && start.summary.length <= 200);
    assert.ok(start.summary.startsWith("echo "));
  });

  test("a tool_use block with no usable name gives no tool-start", () => {
    for (const name of [42, null, "", undefined, ["Bash"], { n: 1 }]) {
      const line = JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: "t", name, input: {} }] } });
      assert.deepEqual(need("parseClaudeLine")(line).filter((e) => e.type === "tool-start"), [], `name ${JSON.stringify(name)}`);
    }
  });
});

describe("parseClaudeLine: hostile input never throws and never yields an event (ADR 0016 6.8)", () => {
  test("malformed JSON, non-object JSON, empty and whitespace lines", () => {
    const parse = need("parseClaudeLine");
    for (const line of ["", "   ", "{", "}{", "not json", '{"type":"assistant"', "null", "123", '"a string"', "true", "[]", '[{"type":"result"}]', "\u0000\u0001", '{"type":"result",}']) {
      assert.deepEqual(parse(line), [], `line ${JSON.stringify(line)}`);
    }
  });

  test("an unknown type and a known type with the wrong shape give nothing", () => {
    const parse = need("parseClaudeLine");
    for (const o of [
      { type: "future_thing", payload: 1 },
      { type: "assistant" },
      { type: "assistant", message: null },
      { type: "assistant", message: { content: "text, not blocks" } },
      { type: "assistant", message: { content: [null, 1, "x", [], {}] } },
      { type: "user", message: { content: 5 } },
      { type: "user", message: { content: [{ type: "tool_result" }, null, 3] } },
      { type: "result", subtype: 5, is_error: "yes" },
    ]) {
      const events = parse(JSON.stringify(o));
      assert.ok(Array.isArray(events), JSON.stringify(o));
      assert.deepEqual(events.filter((e) => e.type === "tool-start" || e.type === "tool-end" || e.type === "permission-request"), [], JSON.stringify(o));
    }
  });

  test("a non-string line (the splitter feeds strings, but a bug must not throw)", () => {
    const parse = need("parseClaudeLine");
    for (const line of [undefined, null, 7, {}, []]) assert.deepEqual(parse(line), []);
  });

  test("a valid line just under the cap parses; one over the cap gives nothing", () => {
    const parse = need("parseClaudeLine");
    const lineOfSize = (bytes) => {
      const shell = JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: "t", name: "Bash", input: { command: "" } }] } });
      return shell.replace('"command":""', `"command":"${"c".repeat(bytes - shell.length)}"`);
    };
    const under = lineOfSize(adapter.MAX_LINE_BYTES - 10);
    const over = lineOfSize(adapter.MAX_LINE_BYTES + 1);
    assert.ok(Buffer.byteLength(under) <= adapter.MAX_LINE_BYTES && Buffer.byteLength(over) > adapter.MAX_LINE_BYTES);
    const starts = parse(under).filter((e) => e.type === "tool-start");
    assert.equal(starts.length, 1);
    assert.ok(starts[0].summary.length <= 200);
    assert.deepEqual(parse(over), []);
  });

  test("a prototype-pollution payload changes nothing outside the parsed object", () => {
    need("parseClaudeLine")('{"__proto__":{"polluted":"yes"},"type":"assistant","message":{"__proto__":{"polluted":"yes"},"content":[]}}');
    assert.equal({}.polluted, undefined);
  });
});

// ---- decodeControlRequest ------------------------------------------------------------------

describe("decodeControlRequest (ADR 0016 6.5), against the real S3 fixtures", () => {
  const controlOf = (name) => fixtureObjs(name).find((o) => o.type === "control_request");
  const ALLOW_ID = "5fbbed42-9f35-4ca2-a446-cee46819b6ab";
  const DENY_ID = "cfd12ab2-4739-4d94-8c87-a3a9b608024c";

  test("the real can_use_tool request decodes to an approval: opaque request id, tool, original input, nothing else", () => {
    const decoded = need("decodeControlRequest")(controlOf("s3-allow.jsonl"), new Set());
    assert.deepEqual(decoded, {
      kind: "approval",
      requestId: ALLOW_ID,
      tool: "Write",
      input: { file_path: "/tmp/den-conformance-EggAXp/s3-allow.txt", content: "BODY-ALLOW96B368" },
    });
    const other = need("decodeControlRequest")(controlOf("s3-deny.jsonl"), new Set());
    assert.equal(other.requestId, DENY_ID);
    assert.equal(other.kind, "approval");
  });

  test("permission_suggestions is ignored: the real suggestion (setMode acceptEdits) and a hostile one change nothing", () => {
    const real = controlOf("s3-allow.jsonl");
    assert.equal(real.request.permission_suggestions[0].mode, "acceptEdits", "the fixture really carries a suggestion");
    const plain = need("decodeControlRequest")(real, new Set());
    for (const suggestions of [undefined, [], [{ type: "setMode", mode: "bypassPermissions", destination: "session" }], [{ type: "addRules", rules: [{ toolName: "Bash" }], behavior: "allow", destination: "userSettings" }], "not even a list"]) {
      const request = { ...real.request, permission_suggestions: suggestions };
      if (suggestions === undefined) delete request.permission_suggestions;
      const decoded = need("decodeControlRequest")({ ...real, request }, new Set());
      assert.deepEqual(decoded, plain);
      assert.ok(!JSON.stringify(decoded).includes("permission_suggestions") && !JSON.stringify(decoded).includes("acceptEdits"));
    }
  });

  test("a duplicate request_id on the same child is denied and never an approval; a second child (fresh set) is not affected", () => {
    const decode = need("decodeControlRequest");
    const seen = new Set();
    const req = controlOf("s3-allow.jsonl");
    assert.equal(decode(req, seen).kind, "approval");
    assert.deepEqual(decode(req, seen), { kind: "deny", requestId: ALLOW_ID });
    assert.deepEqual(decode(req, seen), { kind: "deny", requestId: ALLOW_ID }, "and again");
    assert.equal(decode(controlOf("s3-deny.jsonl"), seen).kind, "approval", "a different id is still decoded");
    assert.equal(decode(req, new Set()).kind, "approval");
  });

  test("an id that was answered deny (a bad request) cannot then come back as an approval", () => {
    const decode = need("decodeControlRequest");
    const seen = new Set();
    const bad = { type: "control_request", request_id: "r-1", request: { subtype: "can_use_tool", tool_name: "", input: {} } };
    assert.deepEqual(decode(bad, seen), { kind: "deny", requestId: "r-1" });
    const good = { type: "control_request", request_id: "r-1", request: { subtype: "can_use_tool", tool_name: "Bash", input: { command: "ls" } } };
    assert.deepEqual(decode(good, seen), { kind: "deny", requestId: "r-1" });
  });

  test("a non-can_use_tool subtype is denied with its request id and is never an approval", () => {
    const decode = need("decodeControlRequest");
    for (const subtype of ["interrupt", "set_permission_mode", "hook_callback", "mcp_message", "initialize", "can_use_tool2", "CAN_USE_TOOL", "", undefined, 5, null]) {
      const decoded = decode({ type: "control_request", request_id: `id-${String(subtype)}`, request: { subtype, tool_name: "Bash", input: { command: "ls" } } }, new Set());
      assert.deepEqual(decoded, { kind: "deny", requestId: `id-${String(subtype)}` }, `subtype ${JSON.stringify(subtype)}`);
    }
  });

  test("a can_use_tool request with a missing or mistyped field is denied, never an approval", () => {
    const decode = need("decodeControlRequest");
    const ok = { subtype: "can_use_tool", tool_name: "Bash", input: { command: "ls" } };
    for (const patch of [
      { tool_name: "" }, { tool_name: undefined }, { tool_name: 5 }, { tool_name: null }, { tool_name: ["Bash"] },
      { input: undefined }, { input: null }, { input: [] }, { input: ["ls"] }, { input: "ls" }, { input: 5 }, { input: true },
    ]) {
      const request = { ...ok, ...patch };
      for (const k of Object.keys(request)) if (request[k] === undefined) delete request[k];
      assert.deepEqual(decode({ type: "control_request", request_id: "r-2", request }, new Set()), { kind: "deny", requestId: "r-2" }, JSON.stringify(patch));
    }
    for (const request of [null, "can_use_tool", 5, [], undefined]) {
      const obj = { type: "control_request", request_id: "r-3", ...(request === undefined ? {} : { request }) };
      assert.deepEqual(decode(obj, new Set()), { kind: "deny", requestId: "r-3" }, JSON.stringify(request));
    }
  });

  test("with no usable request_id there is nothing to answer: the request is dropped", () => {
    const decode = need("decodeControlRequest");
    const request = { subtype: "can_use_tool", tool_name: "Bash", input: { command: "ls" } };
    for (const request_id of [undefined, null, 7, {}, ["a"], true]) {
      const obj = { type: "control_request", request, ...(request_id === undefined ? {} : { request_id }) };
      assert.deepEqual(decode(obj, new Set()), { kind: "drop" }, JSON.stringify(request_id));
    }
    assert.deepEqual(decode({ type: "control_request", request_id: 7, request: { subtype: "interrupt" } }, new Set()), { kind: "drop" });
  });

  test("request_id is an opaque key of at most 128 characters: 128 is accepted, 129 is never an approval", () => {
    const decode = need("decodeControlRequest");
    const request = { subtype: "can_use_tool", tool_name: "Bash", input: { command: "ls" } };
    const at = decode({ type: "control_request", request_id: "k".repeat(128), request }, new Set());
    assert.equal(at.kind, "approval");
    assert.equal(at.requestId, "k".repeat(128));
    const over = decode({ type: "control_request", request_id: "k".repeat(129), request }, new Set());
    assert.notEqual(over.kind, "approval");
  });

  test("request_id is never parsed or interpreted: odd keys are kept as they are, and prototype names work as keys", () => {
    const decode = need("decodeControlRequest");
    const request = { subtype: "can_use_tool", tool_name: "Bash", input: { command: "ls" } };
    const seen = new Set();
    for (const request_id of ["__proto__", "constructor", "hasOwnProperty", "a b\n\u202e", "../../etc/passwd", "0"]) {
      const decoded = decode({ type: "control_request", request_id, request }, seen);
      assert.equal(decoded.kind, "approval", request_id);
      assert.equal(decoded.requestId, request_id);
    }
    assert.equal(decode({ type: "control_request", request_id: "toString", request }, seen).kind, "approval", "an unrelated name is not 'already seen' by accident");
  });

  test("anything that is not a control_request is dropped, and a non-object argument does not throw", () => {
    const decode = need("decodeControlRequest");
    const assistant = fixtureObjs("s3-allow.jsonl").find((o) => o.type === "assistant");
    assert.deepEqual(decode(assistant, new Set()), { kind: "drop" });
    assert.deepEqual(decode({ type: "control_response", request_id: "x", request: { subtype: "can_use_tool", tool_name: "Bash", input: {} } }, new Set()), { kind: "drop" });
    for (const arg of [null, undefined, "control_request", 7, [], true]) assert.deepEqual(decode(arg, new Set()), { kind: "drop" });
  });

  test("the decoded input is the request's own plain object, with nested values intact", () => {
    const input = { command: "node -e 'x'", nested: { list: [1, { a: "é😀" }], flag: false, none: null }, empty: {} };
    const decoded = need("decodeControlRequest")({ type: "control_request", request_id: "r-n", request: { subtype: "can_use_tool", tool_name: "Bash", input } }, new Set());
    assert.deepEqual(decoded.input, input);
  });
});

// ---- encodeControlResponse -----------------------------------------------------------------

describe("encodeControlResponse: only ever a bare decision (ADR 0016 6.5)", () => {
  const real = fixtureObjs("s3-allow.jsonl").find((o) => o.type === "control_request");
  const input = real.request.input;
  const id = real.request_id;
  const parse = (line) => JSON.parse(line);

  test("allow is the shape the CLI honoured in S3: the same line as the conformance script's, updatedInput equal to the request input", () => {
    const line = need("encodeControlResponse")({ requestId: id, allow: true, input });
    assert.ok(line.endsWith("\n"), "one stdin line, newline-terminated");
    assert.deepEqual(JSON.parse(line), JSON.parse(controlResponseLine(id, "allow", input)));
    assert.deepEqual(parse(line), {
      type: "control_response",
      response: { subtype: "success", request_id: id, response: { behavior: "allow", updatedInput: input } },
    });
  });

  test("allow echoes a deep-equal copy of the original input, nested and unicode included, and does not mutate it", () => {
    const original = { command: "ls", nested: { list: [1, { a: "é😀 \u2028 \n" }], none: null }, empty: {} };
    const snapshot = structuredClone(original);
    const line = need("encodeControlResponse")({ requestId: "r-1", allow: true, input: original });
    assert.deepEqual(parse(line).response.response.updatedInput, snapshot);
    assert.deepEqual(original, snapshot);
  });

  test("deny is the S3 deny shape: behavior deny and a plain-text message", () => {
    const line = need("encodeControlResponse")({ requestId: "r-2", allow: false, reason: "not now", input });
    assert.deepEqual(parse(line), {
      type: "control_response",
      response: { subtype: "success", request_id: "r-2", response: { behavior: "deny", message: "not now" } },
    });
  });

  test("a deny with no reason still carries a non-empty message and never an updatedInput", () => {
    const body = parse(need("encodeControlResponse")({ requestId: "r-3", allow: false, input })).response.response;
    assert.equal(body.behavior, "deny");
    assert.equal(typeof body.message, "string");
    assert.ok(body.message.length > 0);
    assert.ok(!("updatedInput" in body));
  });

  test("only an explicit boolean true allows: truthy lookalikes and a missing flag are deny", () => {
    for (const allow of ["true", "yes", 1, {}, [], "allow", undefined, null, 0, ""]) {
      const body = parse(need("encodeControlResponse")({ requestId: "r-4", allow, input })).response.response;
      assert.equal(body.behavior, "deny", `allow=${JSON.stringify(allow)}`);
    }
  });

  test("the line carries no key that persists or broadens a rule, however the reason or input is shaped", () => {
    const hostile = { requestId: "r-5", allow: true, reason: "ok", input: { command: "ls" }, updatedPermissions: [{ type: "setMode", mode: "bypassPermissions" }], permission_suggestions: [{ type: "setMode", mode: "acceptEdits" }], mode: "acceptEdits", rules: ["Bash"] };
    for (const allow of [true, false]) {
      const line = need("encodeControlResponse")({ ...hostile, allow });
      const o = parse(line);
      assert.deepEqual(Object.keys(o).sort(), ["response", "type"]);
      assert.deepEqual(Object.keys(o.response).sort(), ["request_id", "response", "subtype"]);
      assert.ok(Object.keys(o.response.response).every((k) => ["behavior", "message", "updatedInput"].includes(k)), Object.keys(o.response.response).join());
      for (const word of ["updatedPermissions", "permission_suggestions", "acceptEdits", "bypassPermissions", "setMode"]) assert.ok(!line.includes(word), `${word} must not appear`);
    }
  });

  test("the reason stays plain text: control and line-break characters cannot split the stdin line", () => {
    const reason = "line1\nline2\r\n\u2028\u2029\u0000 \u202e{\"type\":\"control_request\"}";
    const line = need("encodeControlResponse")({ requestId: "r-6", allow: false, reason, input: {} });
    assert.ok(line.endsWith("\n"));
    assert.equal(line.indexOf("\n"), line.length - 1, "exactly one newline, at the very end");
    assert.equal(parse(line).response.response.message, reason);
  });

  test("an input containing newlines is still one line", () => {
    const line = need("encodeControlResponse")({ requestId: "r-7", allow: true, input: { content: "a\nb\nc" } });
    assert.equal(line.indexOf("\n"), line.length - 1);
  });

  test("a request id that is not a string of at most 128 characters is refused rather than echoed", () => {
    const encode = need("encodeControlResponse");
    for (const requestId of [undefined, null, 7, {}, ["a"], "k".repeat(129)]) {
      assert.throws(() => encode({ requestId, allow: false, input: {} }), `requestId ${JSON.stringify(requestId)?.slice(0, 20)}`);
    }
    const ok = parse(need("encodeControlResponse")({ requestId: "k".repeat(128), allow: false, input: {} }));
    assert.equal(ok.response.request_id, "k".repeat(128));
  });

  test("an allow without a plain-object input is refused: the encoder will not invent or widen the input", () => {
    const encode = need("encodeControlResponse");
    for (const input of [undefined, null, [], "ls", 5]) {
      assert.throws(() => encode({ requestId: "r-8", allow: true, input }), `input ${JSON.stringify(input)}`);
    }
  });

  test("round trip: what decodeControlRequest accepts, encodeControlResponse can answer with the same id and input", () => {
    const decoded = need("decodeControlRequest")(real, new Set());
    const o = parse(need("encodeControlResponse")({ requestId: decoded.requestId, allow: true, input: decoded.input }));
    assert.equal(o.response.request_id, real.request_id);
    assert.deepEqual(o.response.response.updatedInput, real.request.input);
  });
});

// ---- fixtures ------------------------------------------------------------------------------

describe("committed fixtures (ADR 0016 6.10 scrub step)", () => {
  const files = () => readdirSync(FIXTURES).filter((f) => f.endsWith(".jsonl") || f.endsWith(".json"));

  test("the fixtures from S1 to S3 and the S4b, S6b and S8 runs are committed", () => {
    for (const name of ["s1.jsonl", "s2.jsonl", "s3-allow.jsonl", "s3-deny.jsonl", "s4b-eof.jsonl", "s6b.jsonl", "s8.jsonl"]) {
      assert.ok(files().includes(name), `${name} must be committed under apps/bridge/cells/fixtures/`);
    }
  });

  test("no fixture holds a home path or the username: this machine's, or any /home/<name>, /Users/<name> or C:\\Users path", () => {
    const username = os.userInfo().username;
    const home = os.homedir().replace(/\/+$/, "");
    assert.ok(files().length >= 7);
    for (const name of files()) {
      const text = fixtureText(name);
      if (home.length > 1) assert.ok(!text.includes(home), `${name} holds this machine's home path`);
      if (username.length >= 3) assert.ok(!text.includes(username), `${name} holds the username`);
      assert.ok(!/\/home\/[^/\s"\\]+/.test(text), `${name} holds a /home/<name> path`);
      assert.ok(!/\/Users\/[^/\s"\\]+/.test(text), `${name} holds a /Users/<name> path`);
      assert.ok(!/[A-Za-z]:\\\\?Users\\\\?[^\\\s"]+/.test(text), `${name} holds a C:\\Users path`);
    }
  });

  test("no fixture holds the child's messaging socket path, its plugin or memory paths, or a signature blob", () => {
    for (const name of files()) {
      const text = fixtureText(name);
      assert.ok(!/cc-socks/.test(text), `${name} holds a messaging socket path`);
      assert.ok(!/messaging_socket_path|memory_paths/.test(text), `${name} holds an init key the parser never needs`);
      assert.ok(!/"signature":"[^"]{20,}"/.test(text), `${name} holds a thinking signature`);
    }
  });

  test("every fixture line is a JSON object (real lines, kept whole)", () => {
    for (const name of files().filter((f) => f.endsWith(".jsonl"))) {
      for (const [i, line] of fixtureLines(name).entries()) {
        const o = JSON.parse(line);
        assert.ok(o && typeof o === "object" && !Array.isArray(o) && typeof o.type === "string", `${name}:${i + 1}`);
      }
    }
  });
});
