// organism-infra/202: the S6b comparison run uses the main checkout as its cwd with a temporary allow in
// .claude/settings.local.json. An owner's own settings.local.json must come back byte for byte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runSpikes } from "./conformance.mjs";

// A child that never writes allowed.txt, so the control's allow is absent and the comparisons run.
const FAKE = `#!/usr/bin/env node
import readline from "node:readline";
const args = process.argv.slice(2);
const sid = args[args.indexOf("--session-id") + 1];
const out = (x) => process.stdout.write(JSON.stringify(x) + "\\n");
readline.createInterface({ input: process.stdin }).on("line", () => {
  out({ type: "system", subtype: "init", permissionMode: "default", session_id: sid, mcp_servers: [] });
  out({ type: "result", subtype: "success", is_error: false, result: "PROBE-ROLE-OK", session_id: sid });
}).on("close", () => process.exit(0));
`;

test("runSpikes S6b: the main checkout's own settings.local.json is restored byte for byte after the comparison", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "c6restore-"));
  const repo = mkdtempSync(path.join(tmpdir(), "c6restore-repo-"));
  const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...a], { cwd: repo, stdio: "pipe" });
  git("init", "-q");
  writeFileSync(path.join(repo, ".gitignore"), ".claude/settings.local.json\n");
  git("add", ".gitignore");
  git("commit", "-q", "-m", "init");
  mkdirSync(path.join(repo, ".claude"), { recursive: true });
  const original = '{\n  "permissions": { "allow": ["Bash(ls)"] }\n}\n';
  const local = path.join(repo, ".claude", "settings.local.json");
  writeFileSync(local, original);
  const fake = path.join(dir, "fake-claude.mjs");
  writeFileSync(fake, FAKE);
  chmodSync(fake, 0o755);
  const [r] = await runSpikes({ spikes: ["S6b"], out: path.join(dir, "out"), claudeBin: fake, env: { PATH: process.env.PATH, HOME: dir }, repo, timeoutMs: 10_000, log: () => {} });
  assert.equal(r.verdict, "setup-invalid");
  assert.equal(readFileSync(local, "utf8"), original);
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" }).trim(), "");
});
