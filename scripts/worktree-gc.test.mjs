// organism-infra/05: acceptance tests for scripts/worktree-gc.mjs, per the
// approved scope in .scratch/organism-infra/issues/05-dispatch-into-existing-branch.md
// Comments ("Scope approved", 2026-09-27):
//
//   scripts/worktree-gc.mjs removes clean agent worktrees whose HEAD is
//   already on main, and reports dirty or locked ones; the orchestrator
//   runs it after each merge.
//
// The script does not exist yet, so every test here should currently fail on
// spawning `node scripts/worktree-gc.mjs` (module not found / non-zero exit
// with an ENOENT-shaped stderr), not on a fixture or assertion bug.
//
// Assumed CLI surface (not yet confirmed with the user; the developer may
// adjust and should update this comment if so):
//
//   node scripts/worktree-gc.mjs [--root <repoRoot>] [--apply]
//
//   - repoRoot defaults to cwd and must be the *main* checkout (the one
//     `git worktree list` shows first), not one of the worktrees themselves.
//   - Candidates are every entry `git worktree list --porcelain` reports
//     under <root>/.claude/worktrees/*. The main checkout itself is never a
//     candidate. Entries elsewhere (outside .claude/worktrees/) are ignored.
//   - Without --apply: dry run. Reports each candidate's disposition
//     (removable / dirty / locked / unmerged) on stdout. Deletes nothing.
//     Exits 0.
//   - With --apply: removes only candidates that are BOTH clean (no
//     uncommitted or untracked changes) AND whose HEAD is an ancestor of (or
//     equal to) main's current tip. Dirty, locked, and unmerged candidates
//     are left in place and reported. Exits 0 even when some are kept.
//   - A worktree is "on main" whether it has its own branch merged
//     fast-forward into main, or is a detached-HEAD checkout of a commit
//     that is itself an ancestor of main (the reviewer-checkout case from
//     this ticket).
//
// Every test builds a disposable git repo (a fixture "main checkout") with
// real `git worktree add`/`lock` calls, and tears it down in a `finally` so a
// failing assertion still cleans up.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(REPO_ROOT, "scripts", "worktree-gc.mjs");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function currentHeadSha(cwd) {
  return git(cwd, ["rev-parse", "HEAD"]).trim();
}

// Builds a disposable "main checkout" with an initial commit on `main`.
function initRepo() {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "worktree-gc-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  writeFileSync(path.join(root, "README.md"), "hello\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "base"]);
  git(root, ["branch", "-m", "main"]);
  return root;
}

// Adds an agent worktree under <root>/.claude/worktrees/<name> on a new
// branch checked out from main's current tip.
function addBranchWorktree(root, name) {
  const wtDir = path.join(root, ".claude", "worktrees", name);
  mkdirSync(path.dirname(wtDir), { recursive: true });
  git(root, ["worktree", "add", "-q", "-b", name, wtDir, "main"]);
  return wtDir;
}

// Adds an agent worktree under <root>/.claude/worktrees/<name> as a detached
// checkout of the given sha (the reviewer-checkout shape from the ticket).
function addDetachedWorktree(root, name, sha) {
  const wtDir = path.join(root, ".claude", "worktrees", name);
  mkdirSync(path.dirname(wtDir), { recursive: true });
  git(root, ["worktree", "add", "-q", "--detach", wtDir, sha]);
  return wtDir;
}

function commitFile(cwd, relPath, content) {
  const full = path.join(cwd, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
  git(cwd, ["add", relPath]);
  git(cwd, ["commit", "-q", "-m", `change ${relPath}`]);
}

// Fast-forwards main to the tip of `branch`, simulating a merged PR.
function fastForwardMainTo(root, branch) {
  git(root, ["checkout", "-q", "main"]);
  git(root, ["merge", "-q", "--ff-only", branch]);
}

function worktreePaths(root) {
  const raw = git(root, ["worktree", "list", "--porcelain"]);
  return raw
    .split("\n\n")
    .map((block) => block.match(/^worktree (.+)$/m)?.[1])
    .filter(Boolean)
    .map((p) => path.resolve(p));
}

function runGc(root, args = []) {
  try {
    const stdout = execFileSync("node", [SCRIPT, "--root", root, ...args], {
      cwd: root,
      encoding: "utf8",
    });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status ?? 1, stdout: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

test("a dry run reports a clean, merged worktree as removable but deletes nothing", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-clean");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-clean");

    const { code, stdout } = runGc(root);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /merged-clean/);
    assert.ok(existsSync(wtDir), "dry run must not delete the worktree directory");
    assert.ok(
      worktreePaths(root).some((p) => p === path.resolve(wtDir)),
      "dry run must not deregister the worktree from git either"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply removes a clean worktree whose branch is already merged into main", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-clean");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-clean");

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /merged-clean/);
    assert.equal(existsSync(wtDir), false, "the merged, clean worktree directory should be removed");
    assert.ok(
      !worktreePaths(root).some((p) => p === path.resolve(wtDir)),
      "git should no longer list the removed worktree"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply keeps a merged worktree that has uncommitted changes, and reports it as dirty", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-dirty");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-dirty");
    writeFileSync(path.join(wtDir, "scratch.txt"), "uncommitted\n");

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /merged-dirty/);
    assert.match(stdout, /dirty/i);
    assert.ok(existsSync(wtDir), "a dirty worktree must never be removed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply keeps a locked worktree even when it is clean and merged, and reports it as locked", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-locked");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-locked");
    git(root, ["worktree", "lock", wtDir, "--reason", "qa is verifying this branch"]);

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /merged-locked/);
    assert.match(stdout, /locked/i);
    assert.ok(existsSync(wtDir), "a locked worktree must never be removed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply keeps a clean worktree whose branch is not yet merged into main, and reports it as unmerged", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "in-progress");
    commitFile(wtDir, "feature.txt", "still going\n");
    // deliberately not merged into main

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /in-progress/);
    assert.ok(existsSync(wtDir), "an unmerged worktree must never be removed, clean or not");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply removes a clean detached-HEAD worktree once its checked-out commit is merged into main (the reviewer-checkout shape)", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "reviewed-branch");
    commitFile(wtDir, "feature.txt", "done\n");
    const reviewedSha = currentHeadSha(wtDir);

    const reviewerWtDir = addDetachedWorktree(root, "reviewer-check", reviewedSha);
    fastForwardMainTo(root, "reviewed-branch");

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.equal(existsSync(reviewerWtDir), false, "a merged detached reviewer checkout should be removed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply never removes or reports the main checkout itself", () => {
  const root = initRepo();
  try {
    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.doesNotMatch(stdout, new RegExp(path.basename(root)));
    assert.ok(existsSync(path.join(root, ".git")), "the main checkout must survive gc");
    assert.ok(
      worktreePaths(root).some((p) => p === path.resolve(root)),
      "the main checkout must still be registered with git"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply ignores a merged, clean worktree that lives outside .claude/worktrees/", () => {
  const root = initRepo();
  try {
    const branch = "merged-elsewhere";
    const outsideDir = mkdtempSync(path.join(realpathSync(tmpdir()), "worktree-gc-outside-"));
    rmSync(outsideDir, { recursive: true, force: true }); // git worktree add requires a fresh path
    git(root, ["worktree", "add", "-q", "-b", branch, outsideDir, "main"]);
    commitFile(outsideDir, "feature.txt", "done\n");
    fastForwardMainTo(root, branch);

    try {
      const { code } = runGc(root, ["--apply"]);
      assert.equal(code, 0);
      assert.ok(existsSync(outsideDir), "a worktree outside .claude/worktrees/ must never be touched");
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--root pointed at a linked worktree (not the main checkout) is refused, and nothing is touched", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-clean");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-clean");

    // `git worktree list --porcelain` lists every worktree of the repo
    // (main first, then each linked one) no matter which directory it's
    // run from. So running gc with --root pointed at the linked worktree
    // itself must still be refused, not silently accepted just because
    // that path appears somewhere in the list.
    let code;
    let stdout;
    try {
      stdout = execFileSync("node", [SCRIPT, "--root", wtDir, "--apply"], {
        cwd: wtDir,
        encoding: "utf8",
      });
      code = 0;
    } catch (err) {
      code = err.status ?? 1;
      stdout = (err.stdout ?? "") + (err.stderr ?? "");
    }

    assert.notEqual(code, 0, "must refuse to run with --root set to a linked worktree");
    assert.match(stdout, /not the main checkout/i);
    assert.ok(existsSync(wtDir), "nothing should be removed when the guard refuses to run");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// organism-infra/16: acceptance tests for the worktree-gc auto-clean and
// branch-delete rules, per the ticket's three code criteria
// (.scratch/organism-infra/issues/16-worktree-lifecycle.md):
//
//   1. gc auto-removes a merged worktree whose only dirty files are
//      byte-identical to main's (or .claude/ local config).
//   2. gc keeps and reports (one-line diff summary) a worktree with a
//      unique change.
//   3. gc deletes the merged branch for the resolved ticket.
//
// These extend the CLI surface documented above: none of it changes shape,
// but "dirty" is no longer a blanket "never touch" bucket -- some dirty
// worktrees are forgivable. Assumed (not confirmed with the user): a dirty
// file is forgivable if (a) it is untracked in the worktree and its bytes
// exactly match the file at the same repo-relative path in main's tree, or
// (b) its repo-relative path starts with `.claude/`, regardless of content.
// A worktree with only forgivable dirty files is otherwise treated exactly
// like a clean one (removable when merged, kept when unmerged/locked). A
// worktree with any other dirty file stays "dirty" and its report line
// grows a one-line diff summary (this suite only asserts the changed
// filename and some insertion/deletion count appear -- the developer picks
// the exact wording). On removal, gc also deletes the worktree's local
// branch (`git branch -d`); a detached-HEAD reviewer checkout has no branch
// to delete and removal must not fail because of that.
//
// As of this commit, scripts/worktree-gc.mjs implements neither forgiveness
// nor branch deletion, so each of these three should fail on an assertion
// (forgivable dirty worktree still reported/kept dirty; no diff summary in
// the dirty report line; branch still listed after removal) -- not on a
// module-load or fixture error.

function branchExists(root, branch) {
  return git(root, ["branch", "--list", branch]).trim().length > 0;
}

test("--apply removes a merged worktree whose only dirty files are untracked copies byte-identical to main's, or live under .claude/", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-forgivable");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-forgivable");

    // main moves ahead by one commit after the merge (e.g. a later ticket's
    // handoff), adding a file the worktree never had tracked.
    commitFile(root, ".scratch/handoffs/note.md", "handoff content\n");

    // An untracked copy of that same file, byte-identical, left behind in
    // the worktree (the "handoff copies identical to main's" case from the
    // ticket).
    mkdirSync(path.join(wtDir, ".scratch", "handoffs"), { recursive: true });
    writeFileSync(path.join(wtDir, ".scratch", "handoffs", "note.md"), "handoff content\n");

    // An untracked .claude/ local-config file with content that does NOT
    // match anything on main -- still forgivable because it's under
    // .claude/, not because of its content.
    mkdirSync(path.join(wtDir, ".claude"), { recursive: true });
    writeFileSync(path.join(wtDir, ".claude", "settings.local.json"), '{"unique":"to-this-worktree"}\n');

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.equal(
      existsSync(wtDir),
      false,
      "a merged worktree whose only dirty files are byte-identical to main's or under .claude/ should be auto-removed"
    );
    assert.ok(
      !worktreePaths(root).some((p) => p === path.resolve(wtDir)),
      "git should no longer list the removed worktree"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply keeps a worktree with a unique change and reports a one-line diff summary for it", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-unique-change");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-unique-change");

    // An untracked file with content that matches nothing on main -- a real
    // unique change, not a forgivable copy.
    writeFileSync(path.join(wtDir, "scratch-note.txt"), "unpublished idea\n");

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.ok(existsSync(wtDir), "a worktree with a unique change must never be removed");
    assert.match(stdout, /merged-unique-change/);
    assert.match(stdout, /dirty/i);
    assert.match(
      stdout,
      /scratch-note\.txt/,
      "the report should name the file holding the unique change"
    );
    assert.match(
      stdout,
      /\+\d|insertion|added|\d+ line/i,
      "the report should include a one-line diff summary (e.g. an insertion count), not just the word 'dirty'"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--apply deletes the branch of a merged worktree it removes", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "merged-branch-to-delete");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "merged-branch-to-delete");

    assert.ok(
      branchExists(root, "merged-branch-to-delete"),
      "sanity check: the branch should exist before gc runs"
    );

    const { code, stdout } = runGc(root, ["--apply"]);
    assert.equal(code, 0, stdout);
    assert.equal(existsSync(wtDir), false, "the merged worktree should be removed");
    assert.equal(
      branchExists(root, "merged-branch-to-delete"),
      false,
      "gc should delete the now-merged branch along with the worktree"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("without --apply, a worktree with a unique change is reported dirty but its branch is left alone", () => {
  const root = initRepo();
  try {
    const wtDir = addBranchWorktree(root, "dry-run-branch-kept");
    commitFile(wtDir, "feature.txt", "done\n");
    fastForwardMainTo(root, "dry-run-branch-kept");
    writeFileSync(path.join(wtDir, "scratch-note.txt"), "unpublished idea\n");

    const { code } = runGc(root); // no --apply
    assert.equal(code, 0);
    assert.ok(existsSync(wtDir));
    assert.ok(branchExists(root, "dry-run-branch-kept"), "a dry run must never delete a branch");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("without --apply, nothing is ever deleted even when every candidate is removable", () => {
  const root = initRepo();
  try {
    const a = addBranchWorktree(root, "merged-a");
    commitFile(a, "a.txt", "a\n");
    fastForwardMainTo(root, "merged-a");

    const b = addBranchWorktree(root, "merged-b");
    commitFile(b, "b.txt", "b\n");
    fastForwardMainTo(root, "merged-b");

    const { code } = runGc(root); // no --apply
    assert.equal(code, 0);
    assert.ok(existsSync(a));
    assert.ok(existsSync(b));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
