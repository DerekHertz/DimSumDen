// den-v1 loop S0 (ADR 0016 decisions 3 and 6.6, amendment 7): the agent workspace. Every bridge-started agent gets
// one git worktree and one branch, so its working directory is never the repo root. The names are a pure function of
// the validated ref and the bridge-minted agent id; git runs through execFile with an argument list, never a shell.
// A worktree is a working-directory convention, not a security boundary: nothing here confines the child.
import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { AGENT_ID_RE, REF_RE, WORKSPACE_BRANCH_PREFIX, WORKTREES_DIR } from "./policy.mjs";

const execFileP = promisify(execFile);

/** { worktree, branch } for one agent: the worktree's repo-relative path and its branch. Throws on a bad ref or id. */
export function workspaceNames({ ref, agentId } = {}) {
  if (typeof ref !== "string" || !REF_RE.test(ref)) throw new TypeError("workspace: ref must look like <feature>/<NN>-<slug>");
  if (typeof agentId !== "string" || !AGENT_ID_RE.test(agentId)) throw new TypeError("workspace: agentId must be a bridge-minted agent id");
  const short = agentId.slice(2, 10); // 32 of the id's 64 random bits: unique per agent, so a ticket's second run gets a new worktree
  return {
    worktree: `${WORKTREES_DIR}/${WORKSPACE_BRANCH_PREFIX}-${ref.replace("/", "-")}-${short}`,
    branch: `${WORKSPACE_BRANCH_PREFIX}/${ref}-${short}`,
  };
}

// exec is a test seam with execFile's promise shape: (file, args) -> Promise<{ stdout }>.
export function createWorkspaces(root, { exec = execFileP } = {}) {
  const git = (...args) => exec("git", ["-C", root, ...args]);
  return {
    // -> { dir, worktree, branch }: `dir` is the resolved absolute path the child runs in.
    async create({ ref, agentId } = {}) {
      const { worktree, branch } = workspaceNames({ ref, agentId });
      await git("worktree", "add", "-b", branch, path.join(root, ...worktree.split("/")), "HEAD");
      return { dir: await realpath(path.join(root, ...worktree.split("/"))), worktree, branch };
    },
    // Undoes a create whose agent never started. Best effort: a leftover is reported by scripts/worktree-gc.mjs.
    async remove({ dir, branch }) {
      await git("worktree", "remove", "--force", dir).catch(() => {});
      await git("branch", "-D", branch).catch(() => {});
    },
  };
}
