// organism-infra/25: a pre-commit/CI check that rejects a UTF-8 BOM in .md
// and .json files. PowerShell 5.1's `Set-Content -Encoding utf8` writes a
// BOM, which then trips markdown/JSON parsers downstream (the incident this
// ticket comes from). Given a list of file paths, the script exits 0 when
// none of the .md/.json files among them start with a UTF-8 BOM
// (EF BB BF), and non-zero when at least one does, printing the offending
// path(s) so the failure is actionable in a hook or CI log.
//
// Usage: node scripts/bom-check.mjs [file ...]
//   With no arguments, it scans git-tracked *.md and *.json files (the CI /
//   pre-commit default). With explicit arguments, it checks exactly those
//   paths, ignoring any that aren't .md or .json.
//
// See .scratch/organism-infra/issues/25-shell-and-git-guidance.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(REPO_ROOT, "scripts", "bom-check.mjs");

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function writeBomFile(dir, relPath, text) {
  const full = path.join(dir, relPath);
  writeFileSync(full, Buffer.concat([UTF8_BOM, Buffer.from(text, "utf8")]));
  return full;
}

function writeCleanFile(dir, relPath, text) {
  const full = path.join(dir, relPath);
  writeFileSync(full, text, "utf8");
  return full;
}

function runCheck(dir, args) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], { cwd: dir, encoding: "utf8" });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status ?? 1, stdout: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

test("rejects a UTF-8 BOM in a .md file and names it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    const file = writeBomFile(dir, "notes.md", "# Title\n");
    const { code, stdout } = runCheck(dir, ["notes.md"]);
    assert.notEqual(code, 0);
    assert.match(stdout, /notes\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects a UTF-8 BOM in a .json file and names it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    const file = writeBomFile(dir, "config.json", '{"a":1}\n');
    const { code, stdout } = runCheck(dir, ["config.json"]);
    assert.notEqual(code, 0);
    assert.match(stdout, /config\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("passes a clean .md file and a clean .json file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    writeCleanFile(dir, "readme.md", "# Title\n");
    writeCleanFile(dir, "data.json", '{"a":1}\n');
    const { code } = runCheck(dir, ["readme.md", "data.json"]);
    assert.equal(code, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ignores a BOM in a file whose extension isn't .md or .json", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    writeBomFile(dir, "notes.txt", "hello\n");
    const { code, stdout } = runCheck(dir, ["notes.txt"]);
    assert.equal(code, 0);
    assert.doesNotMatch(stdout, /notes\.txt/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a mix of one clean and one BOM-prefixed file fails and names only the offender", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    writeCleanFile(dir, "clean.md", "# Title\n");
    writeBomFile(dir, "dirty.json", '{"a":1}\n');
    const { code, stdout } = runCheck(dir, ["clean.md", "dirty.json"]);
    assert.notEqual(code, 0);
    assert.match(stdout, /dirty\.json/);
    assert.doesNotMatch(stdout, /clean\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("with no arguments, defaults to scanning git-tracked .md and .json files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bom-check-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: dir });
    writeBomFile(dir, "tracked.md", "# Title\n");
    execFileSync("git", ["add", "tracked.md"], { cwd: dir });
    execFileSync("git", ["commit", "-q", "-m", "add tracked bom file"], { cwd: dir });

    const { code, stdout } = runCheck(dir, []);
    assert.notEqual(code, 0);
    assert.match(stdout, /tracked\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
