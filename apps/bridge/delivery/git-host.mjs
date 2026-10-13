// den-mvp outcome 3 (spec sections 1 and 4): the bridge's own git-host operations. Each is one narrow call with a
// fixed argument list over values the bridge checked (a full commit id, a den branch name, a pull request number);
// there is no general command here and no shell. The credentials are the bridge process's own (the user's git and gh
// login): no agent is given them, and an agent's wall denies `git push` and `gh pr` besides.
// exec is a test seam with execFile's promise shape: (file, args, options) -> Promise<{ stdout, stderr }>.
import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { hasSecret } from "../../../scripts/exposure.mjs";
import { PUBLISH_BRANCH_RE } from "../cells/workspace.mjs";

const execFileP = promisify(execFile);
const COMMIT_RE = /^[0-9a-f]{40,64}$/;
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const DIFF_MAX = 32 * 1024 * 1024;
const NO_CHECKS_TRIES = 6; // a new pull request's checks take a moment to be registered
const NO_CHECKS_WAIT_MS = 10000;
const PASSED = ["SUCCESS", "NEUTRAL", "SKIPPED"];

const commit = (v, what) => {
  if (typeof v !== "string" || !COMMIT_RE.test(v)) throw new TypeError(`git host: ${what} must be a full commit id`);
  return v;
};
const branchName = (v) => {
  if (typeof v !== "string" || !PUBLISH_BRANCH_RE.test(v)) throw new TypeError("git host: not a den branch name");
  return v;
};
const prNumber = (v) => {
  if (!Number.isInteger(v) || v < 1 || v > 999999999) throw new TypeError("git host: not a pull request number");
  return String(v);
};
const oneLine = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").trim().slice(0, max);

// One check of a pull request, from either shape the git host reports. -> { name, done, ok }
const checkOf = (raw) => {
  if (raw?.__typename === "StatusContext" || raw?.context !== undefined) return { name: oneLine(raw.context, 100), done: raw.state !== "PENDING" && raw.state !== "EXPECTED", ok: raw.state === "SUCCESS" };
  return { name: oneLine(raw?.name, 100), done: raw?.status === "COMPLETED", ok: raw?.status === "COMPLETED" && PASSED.includes(raw?.conclusion) };
};

export function createGitHost(root, { exec = execFileP, remote = "origin", main = "main", riskScript = path.join(root, "scripts", "risk-check.mjs"), env = process.env, waitMs = NO_CHECKS_WAIT_MS } = {}) {
  if (!NAME_RE.test(remote) || !NAME_RE.test(main)) throw new TypeError("git host: bad remote or branch name");
  const quiet = { ...env, GIT_TERMINAL_PROMPT: "0", GH_PROMPT_DISABLED: "1", NO_COLOR: "1" };
  const git = async (...args) => String((await exec("git", ["-C", root, ...args], { env: quiet, maxBuffer: DIFF_MAX })).stdout);
  const gh = async (...args) => String((await exec("gh", args, { cwd: root, env: quiet, maxBuffer: 8 * 1024 * 1024 })).stdout);
  const view = async (number) => {
    const pr = JSON.parse(await gh("pr", "view", prNumber(number), "--json", "number,url,state,headRefOid,mergeable,statusCheckRollup"));
    return {
      number: pr.number, url: oneLine(pr.url, 300), state: ["OPEN", "MERGED", "CLOSED"].includes(pr.state) ? pr.state : "CLOSED",
      sha: COMMIT_RE.test(pr.headRefOid) ? pr.headRefOid : null, mergeable: ["MERGEABLE", "CONFLICTING"].includes(pr.mergeable) ? pr.mergeable : "UNKNOWN",
      checks: (Array.isArray(pr.statusCheckRollup) ? pr.statusCheckRollup : []).map(checkOf),
    };
  };
  return {
    /** The remote main branch as it is now: fetched, then read. -> a full commit id. */
    async mainSha() {
      await git("fetch", "--quiet", remote, main);
      return commit((await git("rev-parse", "--verify", `refs/remotes/${remote}/${main}^{commit}`)).trim(), "the main branch");
    },
    /** The repository paths a change touches. A rename is listed as both the path it left and the path it took. */
    async changed({ base, sha }) {
      return (await git("diff", "--name-only", "--no-renames", "-z", commit(base, "base"), commit(sha, "sha"))).split("\0").filter(Boolean);
    },
    /** Does a line the change adds look like a secret? */
    async addsSecret({ base, sha }) {
      const added = (await git("diff", "--no-color", "--no-ext-diff", "-U0", commit(base, "base"), commit(sha, "sha"))).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
      return added.some((l) => hasSecret(l));
    },
    /** The scripted risk check, run from the bridge's own checkout on the change. A repository with none reviews every change. */
    async risk({ base, sha }) {
      const range = `${commit(base, "base")}...${commit(sha, "sha")}`;
      if (!(await access(riskScript).then(() => true, () => false))) return { clean: false, hits: ["no scripted risk check here: security reviews the change"] };
      try {
        await exec(process.execPath, [riskScript, range], { cwd: root, env: quiet, maxBuffer: 4 * 1024 * 1024 });
        return { clean: true, hits: [] };
      } catch (err) {
        if (!Number.isInteger(err?.code) || err.code === 0) throw err;
        return { clean: false, hits: String(err.stdout ?? "").split("\n").map((l) => oneLine(l, 300)).filter(Boolean).slice(0, 50) };
      }
    },
    /** Puts exactly this commit on the remote branch. A branch that has moved elsewhere is not forced. */
    async push({ branch, sha }) {
      await git("push", "--porcelain", remote, `${commit(sha, "sha")}:refs/heads/${branchName(branch)}`);
    },
    /** The pull request of a branch, an open one first. -> { number, url, state, sha } | null */
    async findPr({ branch }) {
      const list = JSON.parse(await gh("pr", "list", "--head", branchName(branch), "--state", "all", "--limit", "10", "--json", "number,url,state,headRefOid"));
      const found = (Array.isArray(list) ? list : []).filter((p) => Number.isInteger(p?.number));
      const pr = found.find((p) => p.state === "OPEN") ?? found.find((p) => p.state === "MERGED") ?? found[0];
      return pr ? { number: pr.number, url: oneLine(pr.url, 300), state: pr.state, sha: COMMIT_RE.test(pr.headRefOid) ? pr.headRefOid : null } : null;
    },
    async openPr({ branch, title, body }) {
      await gh("pr", "create", "--head", branchName(branch), "--base", main, "--title", oneLine(title, 200), "--body", String(body).slice(0, 8000));
    },
    /** -> { number, url, state, sha, mergeable, checks: [{ name, done, ok }] } as the git host reports it now. */
    prState: ({ number }) => view(number),
    /** Resolves once the pull request's checks have finished, whatever they showed; prState then says what they showed. */
    async waitChecks({ number }) {
      for (let attempt = 1; ; attempt += 1) {
        try {
          await gh("pr", "checks", prNumber(number), "--watch", "--interval", "15");
          return;
        } catch (err) {
          if (attempt >= NO_CHECKS_TRIES || !/no checks reported/i.test(String(err?.stderr ?? err?.message ?? ""))) return;
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    },
    /** Merges the pull request only while its head is still this commit. */
    async merge({ number, sha }) {
      await gh("pr", "merge", prNumber(number), "--merge", "--match-head-commit", commit(sha, "sha"));
    },
  };
}
