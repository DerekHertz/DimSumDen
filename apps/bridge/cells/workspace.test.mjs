// den-v1 loop S0 (ADR 0016 decisions 3 and 6.6, amendment 7): the agent workspace, one git worktree and branch per agent.
// Names come only from the validated ref and the bridge-minted agent id; git is run with an argument list, never a shell.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, realpath } from "node:fs/promises";
import path from "node:path";
import { makeStateFixture } from "../bridge-fixture.mjs";

const run = promisify(execFile);
const REF = "fx/02-ready-p0";
const ID = "c-0123456789abcdef";
const cleanups = [];
afterEach(async () => {
  for (const fn of cleanups.splice(0).reverse()) await fn();
});

async function load() {
  try {
    return await import("./workspace.mjs");
  } catch (err) {
    assert.fail(`apps/bridge/cells/workspace.mjs does not exist yet (missing feature): ${err.message}`);
  }
}
async function fixture(options) {
  const fx = await makeStateFixture(options);
  cleanups.push(fx.cleanup);
  return fx;
}
const exists = (p) => access(p).then(() => true, () => false);
const git = async (root, ...args) => (await run("git", ["-C", root, ...args])).stdout;

describe("workspaceNames", () => {
  test("derives the directory and the branch from the ref and the agent id alone", async () => {
    const { workspaceNames } = await load();
    assert.deepEqual(workspaceNames({ ref: REF, agentId: ID }), {
      worktree: ".claude/worktrees/den-fx-02-ready-p0-01234567",
      branch: "den/fx/02-ready-p0-01234567",
    });
  });

  test("rejects a ref or an agent id that fails its pattern", async () => {
    const { workspaceNames } = await load();
    for (const ref of ["-x/01-a", "fx/01-a/../../etc", "fx/01-a b", "fx/-01-a", "../01-a", "fx", "", null, 7, ["fx/01-a"]]) {
      assert.throws(() => workspaceNames({ ref, agentId: ID }), TypeError, `ref ${JSON.stringify(ref)}`);
    }
    for (const agentId of ["c-xyz", "a-0123456789abcdef", "c-0123456789abcdef/..", "", null, 7]) {
      assert.throws(() => workspaceNames({ ref: REF, agentId }), TypeError, `agentId ${JSON.stringify(agentId)}`);
    }
  });
});

describe("createWorkspaces", () => {
  test("create runs git once, with an argument list built from the derived names", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    const calls = [];
    const ws = createWorkspaces(fx.root, { exec: async (file, args) => (calls.push({ file, args }), { stdout: "" }) });
    await ws.create({ ref: REF, agentId: ID }).catch(() => {}); // the fake creates nothing, so resolving the path may fail
    assert.deepEqual(calls[0], {
      file: "git",
      args: ["-C", fx.root, "worktree", "add", "-b", "den/fx/02-ready-p0-01234567", path.join(fx.root, ".claude", "worktrees", "den-fx-02-ready-p0-01234567"), "HEAD"],
    });
  });

  test("a bad ref or agent id is refused before git runs", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    const calls = [];
    const ws = createWorkspaces(fx.root, { exec: async (file, args) => (calls.push({ file, args }), { stdout: "" }) });
    await assert.rejects(ws.create({ ref: "--upload-pack=x/01-a", agentId: ID }), TypeError);
    await assert.rejects(ws.create({ ref: REF, agentId: "c-../../x" }), TypeError);
    assert.equal(calls.length, 0);
  });

  test("create adds a worktree at the root's HEAD on a new branch; remove takes both away", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture({ git: true });
    const ws = createWorkspaces(fx.root);
    const made = await ws.create({ ref: REF, agentId: ID });
    assert.equal(made.branch, "den/fx/02-ready-p0-01234567");
    assert.equal(made.worktree, ".claude/worktrees/den-fx-02-ready-p0-01234567");
    assert.equal(made.dir, await realpath(path.join(fx.root, made.worktree)));
    assert.equal((await git(made.dir, "rev-parse", "HEAD")).trim(), (await git(fx.root, "rev-parse", "HEAD")).trim());
    assert.equal((await git(made.dir, "branch", "--show-current")).trim(), made.branch);
    assert.notEqual(await realpath(await git(made.dir, "rev-parse", "--show-toplevel").then((s) => s.trim())), await realpath(fx.root));

    await ws.remove(made);
    assert.equal(await exists(made.dir), false);
    assert.equal((await git(fx.root, "branch", "--list", "den/*")).trim(), "");
  });

  test("create rejects when the root is not a git repository", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    await assert.rejects(createWorkspaces(fx.root).create({ ref: REF, agentId: ID }));
    assert.equal(await exists(path.join(fx.root, ".claude", "worktrees", "den-fx-02-ready-p0-01234567")), false);
  });
});
