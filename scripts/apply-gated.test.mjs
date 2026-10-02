// organism-infra/108: acceptance tests for scripts/apply-gated.mjs, the one
// command that applies edits only the user may make (.claude/, CLAUDE.md).
//
// The script does not exist yet, so every test here should currently fail on
// the missing module (`node scripts/apply-gated.mjs` exits 1 with
// MODULE_NOT_FOUND), not on a fixture or assertion bug. Each test asserts the
// script's own output or exit status, so none can pass vacuously.
//
// Seam the developer implements (the public interface these tests pin):
//
//   node scripts/apply-gated.mjs [--root <repoRoot>]
//
//   - --root <repoRoot>: the target worktree. Defaults to cwd. Patches are
//     read from <root>/.scratch/_handoffs/gated/*.patch (sorted by file name)
//     and applied to the working tree at <root>. Only `*.patch` files are
//     candidates; `.sh`, `.mjs` and anything else in gated/ is ignored.
//   - Answers come from stdin, one line per prompt. A TTY works the same way
//     (readline on stdin), so tests need no TTY. EOF with no answer means
//     "do not apply". Only an answer of exactly `y` applies; `n`, an empty
//     line, or anything else skips. A skipped patch stays in gated/.
//   - Per patch, before prompting, print the patch file name, the target (the
//     root path) and the `git apply --stat` summary (changed paths plus the
//     "N file(s) changed" line).
//   - A patch is checked with `git apply --check` (never `patch`, never a
//     shell). If the check fails, print the patch name plus a failure message,
//     leave the patch in gated/, and touch nothing in the tree. Whether that
//     patch consumes a stdin answer is NOT specified; tests give it a trailing
//     position or only one answer so either ordering passes. The exit code for
//     a failed patch is also not specified here.
//   - On `y` and a passing check: apply, then commit ONLY the paths the patch
//     touches (the tree may hold unrelated dirty or untracked files, as the
//     real main checkout does). The commit message is the patch's own message
//     (the Subject line and body of a `git format-patch` file, without the
//     "[PATCH]" prefix). A plain diff with no message falls back to a message
//     that contains the patch file's name without the `.patch` extension.
//     Then move the patch to <root>/.scratch/_handoffs/gated/applied/ (same
//     file name, same content). The patch file itself is not committed.
//   - With no pending patches: print "nothing to apply" and exit 0.
//   - Patch content and commit messages are data. Nothing from a patch or
//     from gated/ is ever run through a shell or executed.
//
// Every test builds a disposable git repo and tears it down in a `finally`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(REPO_ROOT, "scripts", "apply-gated.mjs");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function write(root, rel, content) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function read(root, rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

// A disposable "main checkout" with two tracked files and one commit.
function initRepo() {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "apply-gated-"));
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "qa@example.test"]);
  git(root, ["config", "user.name", "QA Fixture"]);
  write(root, "CLAUDE.md", "# Project\nline one\nline two\nline three\n");
  write(root, ".claude/settings.json", '{\n  "a": 1\n}\n');
  write(root, "notes.txt", "base notes\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "initial"]);
  return root;
}

function gatedDir(root) {
  return path.join(root, ".scratch", "_handoffs", "gated");
}

// Builds a real `git format-patch` file by committing `files` on top of HEAD,
// capturing the patch, then resetting back so the tree is as it was.
function makePatch(root, files, message) {
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", message]);
  const text = git(root, ["format-patch", "-1", "--stdout"]);
  git(root, ["reset", "-q", "--hard", "HEAD~1"]);
  return text;
}

function dropPatch(root, name, text) {
  write(root, path.join(".scratch", "_handoffs", "gated", name), text);
}

function run(root, stdin) {
  const res = spawnSync(process.execPath, [SCRIPT, "--root", root], {
    cwd: realpathSync(tmpdir()),
    input: stdin,
    encoding: "utf8",
    timeout: 30_000,
  });
  return { status: res.status, out: `${res.stdout ?? ""}${res.stderr ?? ""}` };
}

function headSubject(root) {
  return git(root, ["log", "-1", "--format=%s"]).trim();
}

function commitCount(root) {
  return Number(git(root, ["rev-list", "--count", "HEAD"]).trim());
}

function withRepo(fn) {
  const root = initRepo();
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// AC: with no pending patches, "nothing to apply" and exit 0.
test("no gated directory at all: prints 'nothing to apply' and exits 0", () => {
  withRepo((root) => {
    const r = run(root, "");
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /nothing to apply/i);
    assert.equal(commitCount(root), 1);
  });
});

test("empty gated directory (and an applied/ dir): prints 'nothing to apply' and exits 0", () => {
  withRepo((root) => {
    mkdirSync(path.join(gatedDir(root), "applied"), { recursive: true });
    write(root, ".scratch/_handoffs/gated/applied/01-old.patch", "already applied\n");
    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /nothing to apply/i);
    // Already-applied patches are not candidates.
    assert.equal(commitCount(root), 1);
  });
});

// AC: each patch shows its diff stat and target.
test("shows the patch name, target root and diff stat before asking", () => {
  withRepo((root) => {
    const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two");
    dropPatch(root, "01-tweak.patch", text);
    const r = run(root, "n\n");
    assert.equal(r.status, 0, r.out);
    assert.ok(r.out.includes("01-tweak.patch"), `patch name missing:\n${r.out}`);
    assert.ok(r.out.includes(root), `target (root path) missing:\n${r.out}`);
    assert.match(r.out, /CLAUDE\.md\s*\|\s*2/, `per-file stat line missing:\n${r.out}`);
    assert.match(r.out, /1 file changed/, `stat summary missing:\n${r.out}`);
  });
});

// AC: applied only on an explicit `y`; applied patches are committed and moved.
test("'y' applies the patch, commits it with the patch's message, and moves it to applied/", () => {
  withRepo((root) => {
    const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two\n\nBody paragraph for the commit.");
    dropPatch(root, "01-tweak.patch", text);
    const before = commitCount(root);

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);

    assert.equal(read(root, "CLAUDE.md"), "# Project\nline one\nline TWO\nline three\n");
    assert.equal(commitCount(root), before + 1, "exactly one new commit");
    assert.equal(headSubject(root), "Tweak line two");
    assert.match(git(root, ["log", "-1", "--format=%b"]), /Body paragraph for the commit\./);
    assert.equal(git(root, ["status", "--porcelain", "--", "CLAUDE.md"]).trim(), "", "change is committed, not left dirty");

    assert.ok(!existsSync(path.join(gatedDir(root), "01-tweak.patch")), "patch removed from gated/");
    const moved = path.join(gatedDir(root), "applied", "01-tweak.patch");
    assert.ok(existsSync(moved), "patch moved to applied/");
    assert.equal(readFileSync(moved, "utf8"), text, "moved patch is unchanged");
  });
});

test("a plain diff with no message still commits, with a message naming the patch", () => {
  withRepo((root) => {
    write(root, "notes.txt", "changed notes\n");
    const diff = git(root, ["diff"]);
    git(root, ["checkout", "--", "notes.txt"]);
    dropPatch(root, "07-plain-notes.patch", diff);
    const before = commitCount(root);

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);
    assert.equal(read(root, "notes.txt"), "changed notes\n");
    assert.equal(commitCount(root), before + 1);
    assert.match(git(root, ["log", "-1", "--format=%B"]), /07-plain-notes/);
    assert.ok(existsSync(path.join(gatedDir(root), "applied", "07-plain-notes.patch")));
  });
});

test("the commit holds only the patch's paths; unrelated dirty and untracked files are left alone", () => {
  withRepo((root) => {
    const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two");
    dropPatch(root, "01-tweak.patch", text);
    // The real main checkout is always dirty somewhere else.
    write(root, "notes.txt", "dirty unrelated edit\n");
    write(root, "untracked.txt", "stray\n");

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);

    const files = git(root, ["show", "--name-only", "--format=", "HEAD"]).trim().split("\n");
    assert.deepEqual(files, ["CLAUDE.md"]);
    assert.equal(read(root, "notes.txt"), "dirty unrelated edit\n");
    assert.match(git(root, ["status", "--porcelain"]), / M notes\.txt/);
    assert.ok(existsSync(path.join(root, "untracked.txt")));
    // The patch queue itself is never committed.
    assert.ok(!git(root, ["ls-files", ".scratch"]).trim(), "nothing under .scratch/ is tracked");
  });
});

// AC: `n` skips it and leaves it in place.
test("'n' skips: tree unchanged, no commit, patch still in gated/", () => {
  withRepo((root) => {
    const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two");
    dropPatch(root, "01-tweak.patch", text);
    const before = commitCount(root);

    const r = run(root, "n\n");
    assert.equal(r.status, 0, r.out);
    assert.ok(r.out.includes("01-tweak.patch"), `script did not list the patch:\n${r.out}`);

    assert.equal(read(root, "CLAUDE.md"), "# Project\nline one\nline two\nline three\n");
    assert.equal(commitCount(root), before);
    assert.equal(readFileSync(path.join(gatedDir(root), "01-tweak.patch"), "utf8"), text);
    assert.ok(!existsSync(path.join(gatedDir(root), "applied", "01-tweak.patch")));
  });
});

// AC: only an explicit `y` applies.
for (const [label, stdin] of [
  ["an empty line (just Enter)", "\n"],
  ["end of input with no answer", ""],
  ["an unrecognised answer", "maybe\n"],
]) {
  test(`${label} does not apply`, () => {
    withRepo((root) => {
      const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two");
      dropPatch(root, "01-tweak.patch", text);
      const before = commitCount(root);

      const r = run(root, stdin);
      assert.equal(r.status, 0, r.out);
      assert.ok(r.out.includes("01-tweak.patch"), `script did not list the patch:\n${r.out}`);

      assert.equal(read(root, "CLAUDE.md"), "# Project\nline one\nline two\nline three\n");
      assert.equal(commitCount(root), before);
      assert.ok(existsSync(path.join(gatedDir(root), "01-tweak.patch")));
      assert.ok(!existsSync(path.join(gatedDir(root), "applied", "01-tweak.patch")));
    });
  });
}

test("several patches are decided one by one, in file-name order", () => {
  withRepo((root) => {
    const a = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "First change");
    const b = makePatch(root, { "notes.txt": "second notes\n" }, "Second change");
    const c = makePatch(root, { ".claude/settings.json": '{\n  "a": 2\n}\n' }, "Third change");
    // Written out of order on purpose.
    dropPatch(root, "30-third.patch", c);
    dropPatch(root, "10-first.patch", a);
    dropPatch(root, "20-second.patch", b);
    const before = commitCount(root);

    const r = run(root, "y\nn\ny\n");
    assert.equal(r.status, 0, r.out);

    assert.equal(read(root, "CLAUDE.md"), "# Project\nline one\nline TWO\nline three\n");
    assert.equal(read(root, "notes.txt"), "base notes\n", "second patch was skipped");
    assert.equal(read(root, ".claude/settings.json"), '{\n  "a": 2\n}\n');
    assert.equal(commitCount(root), before + 2);
    assert.equal(headSubject(root), "Third change");
    assert.equal(git(root, ["log", "-2", "--format=%s"]).trim().split("\n")[1], "First change");

    assert.deepEqual(readdirSync(path.join(gatedDir(root), "applied")).sort(), ["10-first.patch", "30-third.patch"]);
    assert.deepEqual(readdirSync(gatedDir(root)).filter((n) => n.endsWith(".patch")), ["20-second.patch"]);
  });
});

// AC: a patch failing `git apply --check` is reported and left in place;
// nothing is partially applied.
test("a stale patch fails the check: reported, left in place, tree untouched", () => {
  withRepo((root) => {
    const text = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Tweak line two");
    // The target moves on after the patch was written, so it no longer applies.
    write(root, "CLAUDE.md", "# Project\nline one\nsomething else entirely\nline three\n");
    git(root, ["commit", "-q", "-am", "move on"]);
    dropPatch(root, "01-stale.patch", text);
    const before = commitCount(root);

    const r = run(root, "y\n");
    assert.ok(r.out.includes("01-stale.patch"), `failure must name the patch:\n${r.out}`);
    assert.match(r.out, /fail|does not apply|cannot apply|error/i);

    assert.equal(read(root, "CLAUDE.md"), "# Project\nline one\nsomething else entirely\nline three\n");
    assert.equal(commitCount(root), before);
    assert.equal(git(root, ["status", "--porcelain"]).replace(/\?\? \.scratch\/\n?/, "").trim(), "");
    assert.equal(readFileSync(path.join(gatedDir(root), "01-stale.patch"), "utf8"), text);
    assert.ok(!existsSync(path.join(gatedDir(root), "applied", "01-stale.patch")));
  });
});

test("a patch where one file applies and another does not changes neither file", () => {
  withRepo((root) => {
    const text = makePatch(
      root,
      { "notes.txt": "patched notes\n", "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" },
      "Touch two files",
    );
    // Only CLAUDE.md drifts; notes.txt would apply cleanly on its own.
    write(root, "CLAUDE.md", "# Project\ncompletely different\n");
    git(root, ["commit", "-q", "-am", "drift"]);
    dropPatch(root, "01-two-files.patch", text);
    const before = commitCount(root);

    const r = run(root, "y\n");
    assert.ok(r.out.includes("01-two-files.patch"), `failure must name the patch:\n${r.out}`);
    assert.match(r.out, /fail|does not apply|cannot apply|error/i);

    assert.equal(read(root, "notes.txt"), "base notes\n", "the clean half must not be applied");
    assert.equal(read(root, "CLAUDE.md"), "# Project\ncompletely different\n");
    assert.equal(commitCount(root), before);
    assert.ok(existsSync(path.join(gatedDir(root), "01-two-files.patch")));
    assert.ok(!existsSync(path.join(gatedDir(root), "applied", "01-two-files.patch")));
    // No leftover .rej / .orig litter from a partial apply.
    assert.deepEqual(readdirSync(root).filter((n) => /\.(rej|orig)$/.test(n)), []);
  });
});

test("a failing patch does not stop a good one from being applied", () => {
  withRepo((root) => {
    const good = makePatch(root, { "notes.txt": "patched notes\n" }, "Good change");
    const bad = makePatch(root, { "CLAUDE.md": "# Project\nline one\nline TWO\nline three\n" }, "Bad change");
    write(root, "CLAUDE.md", "# Project\ndrifted\n");
    git(root, ["commit", "-q", "-am", "drift"]);
    // Good sorts first so one `y` answer is enough whether or not the failing
    // patch consumes an answer.
    dropPatch(root, "01-good.patch", good);
    dropPatch(root, "02-bad.patch", bad);

    const r = run(root, "y\n");
    assert.ok(r.out.includes("02-bad.patch"), `failure must name the patch:\n${r.out}`);
    assert.equal(read(root, "notes.txt"), "patched notes\n");
    assert.equal(read(root, "CLAUDE.md"), "# Project\ndrifted\n");
    assert.equal(headSubject(root), "Good change");
    assert.ok(existsSync(path.join(gatedDir(root), "applied", "01-good.patch")));
    assert.ok(existsSync(path.join(gatedDir(root), "02-bad.patch")));
  });
});

// AC: never runs a patch's content as a shell script (patches only, no .sh).
test("ignores .sh and .mjs files in gated/ and never executes them", () => {
  withRepo((root) => {
    const marker = path.join(root, "EXECUTED-MARKER");
    write(root, ".scratch/_handoffs/gated/01-evil.sh", `#!/bin/sh\ntouch "${marker}"\n`);
    write(root, ".scratch/_handoffs/gated/02-evil.mjs", `import fs from "node:fs";\nfs.writeFileSync(${JSON.stringify(marker)}, "x");\n`);
    // Even an executable .sh must not be run.
    execFileSync("chmod", ["+x", path.join(gatedDir(root), "01-evil.sh")]);

    const r = run(root, "y\ny\ny\n");
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /nothing to apply/i);
    assert.ok(!existsSync(marker), "a gated .sh/.mjs file was executed");
    assert.ok(existsSync(path.join(gatedDir(root), "01-evil.sh")), ".sh left untouched");
    assert.ok(existsSync(path.join(gatedDir(root), "02-evil.mjs")), ".mjs left untouched");
    assert.ok(!existsSync(path.join(gatedDir(root), "applied", "01-evil.sh")));
    assert.equal(commitCount(root), 1);
  });
});

test("shell metacharacters in a patch's message and content are inert data", () => {
  withRepo((root) => {
    const marker = path.join(root, "EXECUTED-MARKER");
    const subject = `Fix $(touch ${marker}) \`touch ${marker}\`; touch ${marker} "q" 'q' | tee ${marker}`;
    const content = `#!/bin/sh\ntouch ${marker}\n$(touch ${marker})\n\`touch ${marker}\`\n`;
    const text = makePatch(root, { "notes.txt": content }, subject);
    dropPatch(root, "01-meta.patch", text);

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);
    assert.ok(!existsSync(marker), "patch content or message was run by a shell");
    assert.equal(read(root, "notes.txt"), content, "content applied verbatim");
    assert.equal(headSubject(root), subject, "message used verbatim, not interpolated");
    assert.ok(existsSync(path.join(gatedDir(root), "applied", "01-meta.patch")));
  });
});

test("a patch whose name has spaces and shell metacharacters is handled without a shell", () => {
  withRepo((root) => {
    const marker = path.join(root, "EXECUTED-MARKER");
    const text = makePatch(root, { "notes.txt": "named notes\n" }, "Odd name");
    const name = `01 odd; touch ${path.basename(marker)} $(x).patch`;
    dropPatch(root, name, text);

    const r = run(root, "y\n");
    assert.equal(r.status, 0, r.out);
    assert.ok(!existsSync(marker));
    assert.equal(read(root, "notes.txt"), "named notes\n");
    assert.ok(existsSync(path.join(gatedDir(root), "applied", name)));
  });
});

// AC: `npm run apply-gated` exists and runs the script.
test("package.json defines the apply-gated script", () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  assert.equal(pkg.scripts?.["apply-gated"], "node scripts/apply-gated.mjs");
});
