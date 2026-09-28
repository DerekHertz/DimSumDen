#!/usr/bin/env node
// organism-infra/05: worktree lifecycle cleanup. Removes clean agent
// worktrees under <root>/.claude/worktrees/ whose HEAD is already on main
// (fast-forward merged, or a detached checkout of an ancestor commit), and
// reports dirty, locked, or unmerged ones without touching them.
//
// Usage: node scripts/worktree-gc.mjs [--root <repoRoot>] [--apply]
//
//   --root <repoRoot>  Path to the main checkout (defaults to cwd). Must be
//                       the main checkout, not one of the worktrees.
//   --apply            Actually remove removable worktrees. Without it, this
//                       is a dry run: reports dispositions, deletes nothing.
//
// See .scratch/organism-infra/issues/05-dispatch-into-existing-branch.md
// ("Scope approved", 2026-09-27) for the rule this implements.
import { execFileSync } from "node:child_process";
import path from "node:path";

function parseArgs(argv) {
  let root = process.cwd();
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--root") {
      root = argv[++i];
    } else if (arg === "--apply") {
      apply = true;
    }
  }
  return { root, apply };
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const DISPOSITIONS = {
  LOCKED: "locked",
  DIRTY: "dirty",
  UNMERGED: "unmerged",
  REMOVABLE: "removable",
};

// Resolves a path to an absolute, forward-slashed form with no trailing
// slash, so paths from git output and from `path.join` compare equal
// regardless of platform separators or trailing slashes.
function normalizedAbsolutePath(p) {
  return path.resolve(p).replace(/\\/g, "/").replace(/\/$/, "");
}

// Parses `git worktree list --porcelain` into an array of
// { worktreePath, headSha, branch (or null if detached), locked, lockReason }.
function parseWorktreeList(raw) {
  const blocks = raw.split(/\n\n+/).filter((b) => b.trim().length > 0);
  return blocks.map((block) => {
    const lines = block.split("\n");
    const entry = { worktreePath: null, headSha: null, branch: null, locked: false, lockReason: "" };
    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        entry.worktreePath = line.slice("worktree ".length).trim();
      } else if (line.startsWith("HEAD ")) {
        entry.headSha = line.slice("HEAD ".length).trim();
      } else if (line.startsWith("branch ")) {
        entry.branch = line.slice("branch ".length).trim();
      } else if (line === "detached") {
        entry.branch = null;
      } else if (line.startsWith("locked")) {
        entry.locked = true;
        entry.lockReason = line.slice("locked".length).trim();
      }
    }
    return entry;
  });
}

function isDirty(worktreePath) {
  const status = git(worktreePath, ["status", "--porcelain"]);
  return status.trim().length > 0;
}

function isAncestorOfMain(root, sha, mainTip) {
  try {
    git(root, ["merge-base", "--is-ancestor", sha, mainTip]);
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    throw err;
  }
}

function determineMainTip(root, entries) {
  const rootResolved = normalizedAbsolutePath(root);
  const mainEntry = entries.find((e) => normalizedAbsolutePath(e.worktreePath) === rootResolved);
  let mainBranch = "main";
  if (mainEntry && mainEntry.branch) {
    mainBranch = mainEntry.branch.replace(/^refs\/heads\//, "");
  }
  return git(root, ["rev-parse", mainBranch]).trim();
}

function main() {
  const { root, apply } = parseArgs(process.argv.slice(2));
  const rootResolved = normalizedAbsolutePath(root);

  const raw = git(root, ["worktree", "list", "--porcelain"]);
  const entries = parseWorktreeList(raw);

  // `git worktree list --porcelain` always lists the main checkout first,
  // regardless of which worktree it's run from (see board-service.mjs's
  // resolveRoot, which relies on the same ordering). So the only way to
  // tell "this is the main checkout" from "this is some worktree of the
  // repo" is to compare against entries[0], not to check membership in the
  // whole list -- every worktree, including this one, is always a member.
  const isMainCheckout = entries.length > 0 && normalizedAbsolutePath(entries[0].worktreePath) === rootResolved;
  if (!isMainCheckout) {
    console.error(
      `worktree-gc: --root ${root} is not the main checkout (git worktree list does not list it). Refusing to run from inside a worktree.`
    );
    return 1;
  }

  const mainTip = determineMainTip(root, entries);

  const worktreesRoot = normalizedAbsolutePath(path.join(root, ".claude", "worktrees")) + "/";

  const candidates = entries.filter((e) => {
    const resolved = normalizedAbsolutePath(e.worktreePath);
    if (resolved === rootResolved) return false;
    return (resolved + "/").startsWith(worktreesRoot);
  });

  const lines = [];
  for (const entry of candidates) {
    const name = path.basename(entry.worktreePath);
    let disposition;
    if (entry.locked) {
      disposition = DISPOSITIONS.LOCKED;
    } else if (isDirty(entry.worktreePath)) {
      disposition = DISPOSITIONS.DIRTY;
    } else if (!isAncestorOfMain(root, entry.headSha, mainTip)) {
      disposition = DISPOSITIONS.UNMERGED;
    } else {
      disposition = DISPOSITIONS.REMOVABLE;
    }

    if (disposition === DISPOSITIONS.REMOVABLE && apply) {
      git(root, ["worktree", "remove", entry.worktreePath]);
      lines.push(`${name}: removed (was clean, merged into main)`);
    } else {
      lines.push(`${name}: ${disposition}${entry.locked && entry.lockReason ? ` (${entry.lockReason})` : ""}`);
    }
  }

  if (lines.length === 0) {
    console.log("no agent worktrees found under .claude/worktrees/");
  } else {
    console.log(lines.join("\n"));
  }

  return 0;
}

process.exit(main());
