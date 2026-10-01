// organism-infra/82: paths reached through a symlink (macOS /var -> /private/var) compare as their resolved form.
// Fixtures build their own symlink so the tests exercise the same case on Linux/WSL, with no platform branch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runJg } from "./jg.mjs";

const SCRIPT = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "scripts", "worktree-gc.mjs");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const scratch = (p) => realpathSync(mkdtempSync(path.join(tmpdir(), p)));

function runGc(root, cwd) {
  try {
    return { code: 0, out: execFileSync("node", [SCRIPT, "--root", root], { cwd, encoding: "utf8" }) };
  } catch (err) {
    return { code: err.status ?? 1, out: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

// A real main checkout with one merged, clean worktree, plus a symlink to the checkout.
function fixture() {
  const base = scratch("t82-gc-");
  const root = path.join(base, "real");
  mkdirSync(root);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "t@example.com"]);
  git(root, ["config", "user.name", "T"]);
  writeFileSync(path.join(root, "a.txt"), "a\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "base"]);
  git(root, ["branch", "-m", "main"]);
  const wt = path.join(root, ".claude", "worktrees", "wt82");
  mkdirSync(path.dirname(wt), { recursive: true });
  git(root, ["worktree", "add", "-q", "-b", "wt82", wt, "main"]);
  const link = path.join(base, "link");
  symlinkSync(root, link);
  return { base, root, wt, link };
}

test("worktree-gc accepts a --root given through a symlink to the main checkout", () => {
  const { base, link } = fixture();
  try {
    const r = runGc(link, link);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /wt82/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("worktree-gc still refuses a --root that is a worktree, direct or through a symlink", () => {
  const { base, root, wt } = fixture();
  try {
    const wtLink = path.join(base, "wtlink");
    symlinkSync(wt, wtLink);
    for (const p of [wt, wtLink]) {
      const r = runGc(p, root);
      assert.notEqual(r.code, 0, p);
      assert.match(r.out, /not the main checkout/, p);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("worktree-gc still refuses a --root that is not a checkout at all", () => {
  const { base, root } = fixture();
  try {
    const r = runGc(base, root);
    assert.notEqual(r.code, 0, r.out);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// jg: both the root and the checkout are compared in resolved form.
function jgFixture() {
  const base = scratch("t82-jg-");
  const top = path.join(base, "real");
  mkdirSync(path.join(top, ".git"), { recursive: true });
  mkdirSync(path.join(top, "apps"));
  const link = path.join(base, "link");
  symlinkSync(top, link);
  return { base, top, link };
}
const ok = () => {
  const calls = [];
  return { calls, run: async (argv) => { calls.push(argv); return { stdout: "## f.mjs\nEnd context.", exitCode: 0 }; } };
};

test("jg allows a root reached through a symlink when the checkout is given as the real path", async () => {
  const { base, top, link } = jgFixture();
  try {
    const { run, calls } = ok();
    await runJg({ query: "q", root: path.join(link, "apps"), checkout: top, run });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].at(-1), path.join(top, "apps"));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("jg allows a real root when the checkout is given through a symlink", async () => {
  const { base, top, link } = jgFixture();
  try {
    const { run, calls } = ok();
    await runJg({ query: "q", root: path.join(top, "apps"), checkout: link, run });
    assert.equal(calls.length, 1);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("jg refuses a symlink inside the checkout that points outside it", async () => {
  const { base, top } = jgFixture();
  try {
    const outside = path.join(base, "outside");
    mkdirSync(outside);
    symlinkSync(outside, path.join(top, "escape"));
    const { run, calls } = ok();
    await assert.rejects(() => runJg({ query: "q", root: path.join(top, "escape"), checkout: top, run }), /outside the checkout/);
    assert.equal(calls.length, 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
