// organism-infra/140 (ADR 0016 decision 6.10): any diff under `.claude/**` is a risk-check hit, so `security` is
// dispatched. A spawned agent can edit its own permission surface there; this is the detection step. The pattern
// must fire for every file type under .claude/ (settings JSON, role files, skills), not only code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "scripts", "risk-check.mjs");

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });

function initRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "risk-claude-"));
  git(dir, ["init", "-q"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  writeFileSync(path.join(dir, "README.md"), "hello\n");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "base"]);
  git(dir, ["branch", "-m", "main"]);
  git(dir, ["checkout", "-q", "-b", "feature"]);
  return dir;
}

function commitChange(dir, relPath, content) {
  const full = path.join(dir, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
  git(dir, ["add", "-f", relPath]);
  git(dir, ["commit", "-q", "-m", `change ${relPath}`]);
}

function runCheck(dir) {
  try {
    return { code: 0, stdout: execFileSync("node", [SCRIPT, "main...feature"], { cwd: dir, encoding: "utf8" }) };
  } catch (err) {
    return { code: err.status ?? 1, stdout: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

for (const [rel, body] of [
  [".claude/settings.json", '{ "permissions": { "allow": ["Bash(npm test)"] } }\n'],
  [".claude/settings.local.json", '{ "permissions": { "allow": ["Write(.claude/**)"] } }\n'],
  [".claude/agents/qa.md", "# role file\nplain prose, no code\n"],
  [".claude/skills/tdd/SKILL.md", "plain prose\n"],
  [".claude/hooks/pre.sh", "echo hi\n"],
]) {
  test(`a change to ${rel} exits non-zero and names the file`, () => {
    const dir = initRepo();
    try {
      commitChange(dir, rel, body);
      const { code, stdout } = runCheck(dir);
      assert.notEqual(code, 0, stdout);
      assert.ok(stdout.includes(rel), stdout);
      assert.match(stdout, /\.claude/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("a docs-only diff is still clean (the new pattern is not a catch-all)", () => {
  const dir = initRepo();
  try {
    commitChange(dir, "docs/notes.md", "just prose\n");
    commitChange(dir, "apps/ci-cd/foo.mjs", "export const x = 1;\n");
    assert.equal(runCheck(dir).code, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a file merely named like .claude elsewhere does not trip it", () => {
  const dir = initRepo();
  try {
    commitChange(dir, "docs/dot-claude-notes.md", "prose\n");
    commitChange(dir, "docs/claude/readme.md", "prose\n");
    assert.equal(runCheck(dir).code, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
