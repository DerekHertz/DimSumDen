#!/usr/bin/env node
// organism-infra/34: prepare a cell's worktree at the previous hop's commit.
//
//   node scripts/cell-start.mjs --base <sha> (--branch <name> | --detach)
//
// Run first, inside the worktree. Refuses in the main checkout or a dirty
// worktree; otherwise switches to a new branch at <sha> (or detaches there),
// then runs `npm ci`. An existing branch is checked out and fast-forwarded to <sha>.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";

function fail(msg) {
  process.stderr.write(`cell-start: ${msg}\n`);
  process.exit(1);
}

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

function parseArgs(argv) {
  const opts = { base: null, branch: null, detach: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--detach") opts.detach = true;
    else if (a === "--base" || a === "--branch") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) fail(`${a} needs a value`);
      opts[a.slice(2)] = v;
    } else fail(`unknown argument ${a}`);
  }
  if (!opts.base) fail("--base <sha> is required");
  if (opts.branch && opts.detach) fail("use either --branch <name> or --detach, not both");
  if (!opts.branch && !opts.detach) fail("one of --branch <name> or --detach is required");
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

const top = git(["rev-parse", "--show-toplevel"]);
if (top.status !== 0) fail("not inside a git worktree");
const toplevel = realpathSync(top.stdout.trim());

const list = git(["worktree", "list", "--porcelain", "-z"]);
if (list.status !== 0) fail(`git worktree list failed: ${list.stderr.trim()}`);
const first = list.stdout.split("\0").find((l) => l.startsWith("worktree "));
if (!first) fail("git worktree list reported no worktrees");
if (realpathSync(first.slice("worktree ".length)) === toplevel) {
  fail("this is the main checkout; run cell-start only inside a cell worktree");
}

const status = git(["status", "--porcelain"]);
if (status.status !== 0) fail(`git status failed: ${status.stderr.trim()}`);
if (status.stdout.trim()) fail("worktree is dirty (uncommitted or untracked files); commit or remove them first");

const sha = git(["rev-parse", "--verify", "--quiet", `${opts.base}^{commit}`]);
if (sha.status !== 0) fail(`unknown base commit ${opts.base}`);
const base = sha.stdout.trim();

// organism-infra/51: an existing branch (the developer after qa specify) is checked
// out and fast-forwarded to --base; anything that isn't a fast-forward is refused.
let existingBranch = false;
if (opts.branch) {
  existingBranch = git(["show-ref", "--verify", "--quiet", `refs/heads/${opts.branch}`]).status === 0;
  if (existingBranch) {
    const ff = git(["merge-base", "--is-ancestor", `refs/heads/${opts.branch}`, base]);
    if (ff.status !== 0) fail(`branch ${opts.branch} cannot be fast-forwarded to ${base.slice(0, 12)} (diverged or ahead of it); refusing`);
  }
}

// npm finds its project root by walking up from cwd; a base with no root
// package.json would make it reinstall in the main checkout that nests this worktree.
const hasPkg = git(["cat-file", "-e", `${base}:package.json`]);
if (hasPkg.status !== 0) fail(`base ${base.slice(0, 12)} has no root package.json; refusing (npm ci would climb out of the worktree)`);

const sw = git(
  existingBranch ? ["switch", "-q", opts.branch] : opts.branch ? ["switch", "-q", "-c", opts.branch, base] : ["switch", "-q", "--detach", base],
);
if (sw.status !== 0) fail(`git switch failed: ${sw.stderr.trim()}`);
if (existingBranch) {
  const ffm = git(["merge", "-q", "--ff-only", base]);
  if (ffm.status !== 0) fail(`fast-forward to ${base.slice(0, 12)} failed: ${ffm.stderr.trim()}`);
}

const npm = spawnSync("npm", ["ci"], { stdio: "inherit", cwd: toplevel });
if (npm.status !== 0) fail(`npm ci failed (exit ${npm.status ?? npm.signal})`);
process.stdout.write(`cell-start: at ${base.slice(0, 12)} (${opts.branch ?? "detached"})\n`);
