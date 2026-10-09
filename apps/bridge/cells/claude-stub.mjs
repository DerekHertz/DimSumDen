// organism-infra/143: test-only helpers for the Claude process tests (not a test file: no .test.mjs suffix).
//
// makeStub(opts) writes an executable node script that stands in for the `claude` binary, so the runtime is exercised
// over real pipes, real signals and a real process group. The script records what it sees to a jsonl file:
//   { kind: "start", pid, argv, cwd, envKeys }   once, at launch
//   { kind: "stdin", line }                      every line the runtime writes to the child's stdin
// opts.mode picks what it does after it reads the prompt line (its first stdin line):
//   approve   assistant tool_use (Bash, id tu1) + usage, then a can_use_tool control_request "req-1" (input
//             { command: "npm test" }); on a control_response it emits the tool_result and a success `result`, exits 0
//   hang      assistant tool_use + usage, then stays alive until killed (ignores stdin EOF)
//   crash     assistant tool_use, then exit code 3
//   flood     writes 1 MB to stderr, then a success `result`, exits 0
//   utf8      a tool_use whose command holds multibyte characters, written in byte pieces split inside a character
//   oversize  a 1.2 MB non-JSON stdout line, then a tool_use and a success `result`, exits 0
//   dup       control_request req-1 twice, then a control_request req-2 with subtype "set_model"; stays alive
// opts.grandchild: null | "plain" | "ignoreTerm"   spawns a child of the stub (same process group), pid in pidFile
// opts.ignoreTerm: the stub itself ignores SIGTERM
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const UTF8_COMMAND = "echo héllo 🙂 日本";
export const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

export async function makeStub({ mode = "approve", grandchild = null, ignoreTerm = false } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "den-claude-stub-"));
  const logFile = path.join(dir, "log.jsonl");
  const pidFile = path.join(dir, "grandchild.pid");
  const bin = path.join(dir, "claude-stub.mjs");
  const opts = { mode, grandchild, ignoreTerm, logFile, pidFile, command: UTF8_COMMAND };
  const source = `#!${process.execPath}
import { appendFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import readline from "node:readline";
const O = ${JSON.stringify(opts)};
const log = (o) => appendFileSync(O.logFile, JSON.stringify(o) + "\\n");
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
log({ kind: "start", pid: process.pid, argv: process.argv.slice(2), cwd: process.cwd(), envKeys: Object.keys(process.env).sort() });
if (O.ignoreTerm) process.on("SIGTERM", () => {});
if (O.grandchild) {
  const src = O.grandchild === "ignoreTerm" ? "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)" : "setInterval(()=>{},1000)";
  const gc = spawn(process.execPath, ["-e", src], { stdio: "ignore" });
  writeFileSync(O.pidFile, String(gc.pid));
}
const toolUse = (command) => ({ type: "assistant", message: { content: [{ type: "tool_use", id: "tu1", name: "Bash", input: { command } }], usage: { input_tokens: 10, output_tokens: 20 } } });
const request = (id, subtype) => ({ type: "control_request", request_id: id, request: subtype === "can_use_tool" ? { subtype, tool_name: "Bash", input: { command: "npm test" } } : { subtype } });
const result = () => ({ type: "result", subtype: "success", is_error: false });
const finish = (code = 0) => process.stdout.write("", () => process.exit(code));
setInterval(() => {}, 1000);
let prompted = false;
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  log({ kind: "stdin", line });
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.type === "control_response" && O.mode === "approve") {
    out({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "tu1", content: "ok" }] } });
    out(result());
    finish(0);
    return;
  }
  if (prompted || msg.type !== "user") return;
  prompted = true;
  if (O.mode === "approve") { out(toolUse("npm test")); out(request("req-1", "can_use_tool")); }
  else if (O.mode === "hang") out(toolUse("sleep 999"));
  else if (O.mode === "crash") { out(toolUse("boom")); finish(3); }
  else if (O.mode === "flood") {
    const chunk = "e".repeat(65536) + "\\n";
    for (let i = 0; i < 16; i += 1) process.stderr.write(chunk);
    out(result());
    finish(0);
  } else if (O.mode === "utf8") {
    const buf = Buffer.from(JSON.stringify(toolUse(O.command)) + "\\n");
    const cut = buf.indexOf(Buffer.from("é")) + 1; // inside the two-byte character
    process.stdout.write(buf.subarray(0, cut));
    await new Promise((r) => setTimeout(r, 60));
    const emoji = buf.indexOf(Buffer.from("🙂")) + 2; // inside the four-byte character
    process.stdout.write(buf.subarray(cut, emoji));
    await new Promise((r) => setTimeout(r, 60));
    process.stdout.write(buf.subarray(emoji));
    out(result());
    finish(0);
  } else if (O.mode === "oversize") {
    process.stdout.write("x".repeat(1_200_000) + "\\n");
    out(toolUse("after the big line"));
    out(result());
    finish(0);
  } else if (O.mode === "dup") {
    out(request("req-1", "can_use_tool"));
    out(request("req-1", "can_use_tool"));
    out(request("req-2", "set_model"));
  }
});
`;
  await writeFile(bin, source);
  await chmod(bin, 0o755);
  return {
    dir,
    bin,
    logFile,
    pidFile,
    async log() {
      const text = await readFile(logFile, "utf8").catch(() => "");
      return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    },
    async stdinLines() {
      return (await this.log()).filter((e) => e.kind === "stdin").map((e) => JSON.parse(e.line));
    },
    async start() {
      return (await this.log()).find((e) => e.kind === "start");
    },
    async grandchildPid() {
      const text = await readFile(pidFile, "utf8").catch(() => "");
      return text ? Number(text) : null;
    },
  };
}

// Drain a CellProcess's events into an array in the background; `done` resolves when the stream ends.
export function collect(proc) {
  const events = [];
  const done = (async () => {
    for await (const e of proc.events) events.push(e);
  })();
  return { events, done };
}
