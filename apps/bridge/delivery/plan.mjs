// den-mvp outcome 3 (spec section 4, ADR 0024): what a delivery job does next. One pure function over the job's own
// record: it reads nothing and starts nothing. Every piece of evidence names the commit it was made for, and counts
// only while that commit is still the candidate, so a changed commit asks for each check again.
//
//   nextStep(job) -> { kind: "run", role, mode?, at, since, fix? }      start an agent at commit `at`
//                  | { kind: "check" | "preview" | "publish" | "ci" | "merge" | "go-live" | "resolve" }   a bridge operation
//                  | { kind: "pause", pause, reason, next }             wait for the user
//   job = { base, candidate: { sha } | null, bounces, visual, evidence: { qa, security, risk, preview, verdict, pr, ci, live } }
// ADR 0026 decisions 5 and 6: a candidate that changes a path under apps/ui/ (risk.ui) is built as a preview and waits for
// the user before anything is pushed; their one approval covers the push, the pull request, the merge and going live.
// A decline (verdict.ok === false) sends the developer round again and is not a bounce.
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export const MAX_BOUNCES = 2; // the second bounce on one ticket pauses the job
export { DELIVERABLE_TYPES, VISUAL_TYPES } from "./types.mjs";

// A change to one of these is the user's own to review and merge, and always has a security review first: the files that
// say what an agent may do (the governance lists), the bridge that enforces it, the board and gate code, the checks a
// merge relies on, and everything that runs by itself on the user's machine or on the git host (hook and guard scripts,
// the instructions and settings every session loads, the package manifest). Every dot path at the repository root is
// one, so a new tool's settings directory is covered before anyone lists it. The governance file is read once, from
// the bridge's own checkout.
const governance = JSON.parse(readFileSync(fileURLToPath(new URL("../cells/governance.json", import.meta.url)), "utf8"));
// A change to CI configuration runs on the git host as soon as it is pushed, so the bridge does not push one at all.
export const CI_PATHS = [...governance.ciPaths, ".github/**"];
export const USER_MERGE_PATHS = [
  ...governance.guardrailPaths, ...CI_PATHS,
  "apps/bridge/**", "apps/organism-infra/**", "apps/ci-cd/**", "scripts/**", "mods/**",
  "CLAUDE.md", "AGENTS.md", "package.json", "package-lock.json", "skills-lock.json",
];
const matcher = (pattern) => (pattern.endsWith("/**") ? (p) => p.startsWith(pattern.slice(0, -2)) : (p) => p === pattern || p.startsWith(`${pattern}/`));
const USER_MERGE = [...USER_MERGE_PATHS.map(matcher), (p) => p.startsWith(".")];
const CI = CI_PATHS.map(matcher);
/** Is this repository path CI configuration? */
export const isCiPath = (file) => typeof file === "string" && CI.some((m) => m(file));
/** Is this repository path part of the den's UI? A change to one is previewed, and goes live after the merge. */
export const isUiPath = (file) => typeof file === "string" && file.startsWith("apps/ui/");
/** Is this repository path one whose change the user merges? Paths are as git prints them (forward slashes). */
export const isUserMergePath = (file) => typeof file === "string" && USER_MERGE.some((m) => m(file));

const pause = (kind, reason, next) => ({ kind: "pause", pause: kind, reason, next });

export function nextStep(job) {
  const c = job.candidate;
  if (!c) return { kind: "run", role: "developer", at: job.base, since: job.base };
  const ev = job.evidence ?? {};
  const now = (e) => (e && e.sha === c.sha ? e : null);
  const [qa, security, risk, pr, ci] = [now(ev.qa), now(ev.security), now(ev.risk), now(ev.pr), now(ev.ci)];
  const [preview, verdict, live] = [now(ev.preview), now(ev.verdict), now(ev.live)];

  // The user declined this commit: the developer runs again with their note, however many times. Not a bounce.
  if (verdict?.ok === false) return { kind: "run", role: "developer", at: c.sha, since: job.base, fix: true };
  // A preview that did not build is a failed check, like a reviewer's bounce.
  const bounced = [qa, security].find((e) => e?.verdict === "bounce") ?? (preview?.ok === false ? preview : undefined);
  if (bounced) {
    if (job.bounces >= MAX_BOUNCES) return pause("failed-twice", "the review sent the work back twice", "Read the findings on the ticket, then Resume for one more round or close the delivery.");
    return { kind: "run", role: "developer", at: c.sha, since: job.base, fix: true };
  }
  if (!qa) return { kind: "run", role: "qa", mode: "verify", at: c.sha, since: job.base };
  if (!risk) return { kind: "check" };
  if (risk.secret) return pause("possible-secret", "the change adds a line or a file that looks like a secret; nothing was pushed", "Look at the commit yourself. Close the delivery if it holds a secret.");
  if (risk.security && !security) return { kind: "run", role: "security", at: c.sha, since: job.base };
  if (risk.ui) {
    if (!preview) return { kind: "preview" };
    if (verdict?.ok !== true) return pause("visual-verdict", "a UI change waits for your verdict on its preview", "Open the preview. Approve it to merge it and put it live, or decline it with a note for the developer.");
  }
  if (!pr) return { kind: "publish" }; // a change to CI configuration is stopped there, before the push
  if (pr.state === "MERGED") {
    // What goes live is rebuilt from main after the merge. A change with nothing under apps/ui/ makes no release.
    if (!risk.ui || live?.state === "live") return { kind: "resolve" };
    if (!live) return { kind: "go-live" };
    if (live.state === "needs-update") return pause("needs-update", live.reason || "the merged commit changes the bridge or the lockfile, so the den must be updated before this change can go live", "Update the den (npm run den:update), then Resume to put this change live.");
    return pause("go-live-failed", live.reason || "the merged change could not be put live", "The merge stands and nothing went live. Resume to try again.");
  }
  if (!ci) return { kind: "ci" };
  if (ci.state === "red") return pause("ci-red", `a required check failed: ${ci.failed?.join(", ") || "see the pull request"}`, "Fix the check, or Resume once it passes.");
  if (ci.state === "none") return pause("no-checks", "no check ran on the pull request, so nothing was merged", "Resume once the checks have run.");
  if (ci.state !== "green") return pause("ci-pending", "the checks have not finished", "Resume to watch them again.");
  if (risk.userMerge) return pause("guardrail", "the change touches the den's own guardrails, the bridge, its checks or a script that runs by itself: the review and the merge are yours", "Review and merge the pull request yourself, then Resume to close the ticket.");
  if (job.visual && verdict?.ok !== true) return pause("visual-verdict", "a UI change waits for your visual verdict", "Look at the change, then approve it to merge.");
  if (pr.mergeable === "CONFLICTING") return pause("conflict", "the pull request conflicts with main", "Resolve the conflict, then Resume.");
  if (pr.mergeable !== "MERGEABLE") return pause("not-mergeable", "the git host has not said the pull request can merge", "Resume to ask again.");
  return { kind: "merge" };
}
