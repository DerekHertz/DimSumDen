// den-v1 loop S0 (ADR 0016 decisions 3 and 6.6, amendment 7), amended by agent-os/09 (ADR 0021 Amendment 2, decision 17): the agent
// workspace. Every bridge-started agent gets one git worktree, so its working directory is never the repo root. The worktree is
// created DETACHED: the agent holds no branch, so the sandbox can deny every ref of the main .git. The bridge creates the branch
// (den/<ref>-<short>) at the agent's final commit when the agent ends. The names are a pure function of the validated ref and the
// bridge-minted agent id; git runs through execFile with an argument list, never a shell.
// A worktree is a working-directory convention, not a security boundary: nothing here confines the child.
import { execFile } from "node:child_process";
import { access, appendFile, lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { AGENT_ID_RE, REF_RE, WORKSPACE_BRANCH_PREFIX, WORKTREES_DIR } from "./policy.mjs";

const execFileP = promisify(execFile);

// The one shape a published branch may have: what workspaceNames derives (a ref's slashes kept, then "-" and 8 hex of the agent id).
export const PUBLISH_BRANCH_RE = new RegExp(`^${WORKSPACE_BRANCH_PREFIX}/[a-z0-9][a-z0-9-]*/\\d{2,}-[a-z0-9][a-z0-9-]*-[0-9a-f]{8}$`);

const COMMIT_RE = /^[0-9a-f]{40,64}$/;

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
    // -> { dir, worktree, branch }: `dir` is the resolved absolute path the child runs in. `branch` is only the name to publish to.
    // den-mvp outcome 3: `base` is the commit a delivery step starts from (a full commit id the bridge recorded); without it, HEAD.
    async create({ ref, agentId, base } = {}) {
      const { worktree, branch } = workspaceNames({ ref, agentId });
      if (base !== undefined && (typeof base !== "string" || !COMMIT_RE.test(base))) throw new TypeError("workspace: base must be a full commit id");
      await git("worktree", "add", "--detach", path.join(root, ...worktree.split("/")), base ?? "HEAD");
      return { dir: await realpath(path.join(root, ...worktree.split("/"))), worktree, branch };
    },
    // The commit a worktree is at now. -> a full commit id.
    async head({ dir } = {}) {
      const sha = String((await exec("git", ["-C", dir, "rev-parse", "HEAD"])).stdout).trim();
      if (!COMMIT_RE.test(sha)) throw new Error("workspace: the worktree has no commit");
      return sha;
    },
    // den-mvp outcome 3: the bridge's note to a delivery step (a review's findings for a fix round), written to
    // <worktree>/.den/findings.md. `.den/` is added once to the repository's own exclude file, so no commit carries it.
    async brief({ dir } = {}, text) {
      const common = String((await exec("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--git-common-dir"])).stdout).trim();
      const exclude = path.join(common, "info", "exclude");
      const current = await readFile(exclude, "utf8").catch(() => "");
      if (!current.split("\n").includes(".den/")) {
        await mkdir(path.dirname(exclude), { recursive: true });
        await appendFile(exclude, `${current === "" || current.endsWith("\n") ? "" : "\n"}.den/\n`);
      }
      await mkdir(path.join(dir, ".den"), { recursive: true });
      await writeFile(path.join(dir, ".den", "findings.md"), text, { mode: 0o600 });
    },
    // den-mvp outcome 2: the worktree of an earlier run (`origin`), reopened for a follow-up by a new run. Nothing is created:
    // the directory must still be a worktree of this repository at the derived path, or this rejects. `base` is its HEAD
    // now, so publish can tell whether the follow-up committed anything. -> { dir, worktree, branch, base, reopened: true }.
    async reopen({ ref, agentId, origin } = {}) {
      const { worktree } = workspaceNames({ ref, agentId: origin });
      const { branch } = workspaceNames({ ref, agentId });
      const dir = await realpath(path.join(root, ...worktree.split("/")));
      const listed = String((await git("worktree", "list", "--porcelain")).stdout).split("\n").filter((l) => l.startsWith("worktree ")).map((l) => l.slice(9));
      const resolved = await Promise.all(listed.map((p) => realpath(p).catch(() => p)));
      if (!resolved.includes(dir)) throw new Error("workspace: the earlier run's directory is no longer a worktree of this repository");
      const base = String((await exec("git", ["-C", dir, "rev-parse", "HEAD"])).stdout).trim();
      return { dir, worktree, branch, base, reopened: true };
    },
    // Creates `branch` in the main checkout at the worktree's current HEAD (the agent's final commit). Never moves a branch that
    // already exists (git branch refuses), and only a derived den/ name is accepted. -> { branch, sha }, or null for a reopened
    // worktree whose HEAD has not moved (a follow-up that committed nothing publishes nothing).
    async publish({ dir, branch, base } = {}) {
      if (typeof branch !== "string" || !PUBLISH_BRANCH_RE.test(branch)) throw new TypeError("workspace: not a den agent branch name");
      if (typeof dir !== "string" || dir === "") throw new TypeError("workspace: publish needs the worktree directory");
      const sha = String((await exec("git", ["-C", dir, "rev-parse", "HEAD"])).stdout).trim();
      if (!COMMIT_RE.test(sha)) throw new Error("workspace: the worktree has no commit to publish");
      if (base !== undefined && sha === base) return null;
      await git("branch", branch, sha);
      return { branch, sha };
    },
    // Undoes a create whose agent never started. Best effort: a leftover is reported by scripts/worktree-gc.mjs.
    // A reopened worktree belongs to an earlier run and is never removed here.
    async remove({ dir, branch, reopened }) {
      if (reopened) return;
      await git("worktree", "remove", "--force", dir).catch(() => {});
      await git("branch", "-D", branch).catch(() => {});
    },
  };
}

// agent-os/09: the main .git's deny targets must exist before the spawn, because the CLI's sandbox binds a deny on a path that is
// missing and git then fails in the worktree. A repo that was never packed has no packed-refs: the bridge makes one (no refs lost,
// nothing pruned). `refs` and `HEAD` exist in any repository. A missing index cannot be made safely, so the spawn is refused.
const GIT_TARGETS = ["refs", "HEAD", "packed-refs", "index"];
const exists = (p) => access(p).then(() => true, () => false);

/** Makes every deny target of the main .git exist, or rejects. -> { mainGit }: the resolved <root>/.git the host hands to the runtime. */
export async function prepareMainGit(root, { exec = execFileP } = {}) {
  const mainGit = path.join(await realpath(root), ".git");
  const info = await lstat(mainGit).catch(() => null);
  if (info === null || !info.isDirectory()) throw new Error("the main checkout's .git is not a directory");
  const missing = async () => {
    const out = [];
    for (const target of GIT_TARGETS) if (!(await exists(path.join(mainGit, target)))) out.push(target);
    return out;
  };
  let lacking = await missing();
  if (lacking.includes("packed-refs")) {
    // A failed attempt (another spawn holds the lock) is judged by whether the file is there afterwards.
    await exec("git", ["-C", root, "pack-refs", "--all", "--no-prune"]).catch(() => {});
    lacking = await missing();
  }
  if (lacking.length > 0) throw new Error(`the main checkout's .git lacks ${lacking.join(", ")}`);
  return { mainGit };
}
