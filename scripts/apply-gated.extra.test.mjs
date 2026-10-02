// organism-infra/108: developer-added cases beyond qa's scripts/apply-gated.test.mjs
// (kept in a separate file so qa's tests stay untouched): a patch whose target
// already carries uncommitted work is refused, and a rename commits both paths.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "scripts", "apply-gated.mjs");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });

function initRepo() {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "apply-gated-x-"));
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "dev@example.test"]);
  git(root, ["config", "user.name", "Dev Fixture"]);
  writeFileSync(path.join(root, "CLAUDE.md"), "# Project\nline one\nline two\nline three\n");
  writeFileSync(path.join(root, "old.txt"), "a\nb\nc\nd\ne\nf\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "initial"]);
  return root;
}

function drop(root, name, text) {
  const dir = path.join(root, ".scratch", "_handoffs", "gated");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), text);
}

const run = (root, stdin) => {
  const res = spawnSync(process.execPath, [SCRIPT, "--root", root], {
    cwd: realpathSync(tmpdir()),
    input: stdin,
    encoding: "utf8",
    timeout: 30_000,
  });
  return { status: res.status, out: `${res.stdout ?? ""}${res.stderr ?? ""}` };
};

test("a patch whose target file has uncommitted edits is refused and left in place", () => {
  const root = initRepo();
  try {
    writeFileSync(path.join(root, "CLAUDE.md"), "# Project\nline one\nline TWO\nline three\n");
    git(root, ["commit", "-q", "-am", "patch source"]);
    const text = git(root, ["format-patch", "-1", "--stdout"]);
    git(root, ["reset", "-q", "--hard", "HEAD~1"]);
    drop(root, "01-dirty.patch", text);
    // An unrelated edit to the same file the patch touches, on a line it does not.
    writeFileSync(path.join(root, "CLAUDE.md"), "# Project\nline one\nline two\nline three\nmy own line\n");
    const before = git(root, ["rev-list", "--count", "HEAD"]);

    const r = run(root, "y\n");
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /01-dirty\.patch/);
    assert.match(r.out, /uncommitted/);
    assert.equal(git(root, ["rev-list", "--count", "HEAD"]), before);
    assert.equal(readFileSync(path.join(root, "CLAUDE.md"), "utf8"), "# Project\nline one\nline two\nline three\nmy own line\n");
    assert.ok(existsSync(path.join(root, ".scratch", "_handoffs", "gated", "01-dirty.patch")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a rename patch commits both the old and the new path", () => {
  const root = initRepo();
  try {
    git(root, ["mv", "old.txt", "new.txt"]);
    git(root, ["commit", "-q", "-m", "Rename old to new"]);
    const text = git(root, ["format-patch", "-1", "--stdout"]);
    git(root, ["reset", "-q", "--hard", "HEAD~1"]);
    drop(root, "01-rename.patch", text);

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);
    assert.equal(git(root, ["log", "-1", "--format=%s"]).trim(), "Rename old to new");
    assert.ok(existsSync(path.join(root, "new.txt")));
    assert.ok(!existsSync(path.join(root, "old.txt")));
    assert.equal(git(root, ["status", "--porcelain", "--", "old.txt", "new.txt"]).trim(), "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
