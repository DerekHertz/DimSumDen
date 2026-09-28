# 03: security fix round 2 handoff

**Ticket:** `.scratch/ci-cd/issues/03-smoke-module-not-found-and-missing-checks.md`
**Branch:** `claude/ci-cd-03-smoke-and-checks`, now `d2bc58d` (was `cb72b2a`), PR #18
**CI:** new run [36380401057](https://github.com/DerekHertz/agent-office/actions/runs/36380401057) — both jobs pass (`security` 17s, `test` 1m8s). `gh pr checks 18` confirms.

## 1. timeout-minutes

Added `timeout-minutes: 15` to `test`, `5` to `security` in `.github/workflows/ci.yml`, per the user's approval.

## 2. The test-job hang (root-caused, fixed, confirmed)

Read the canceled run's log for job 108784498313: test 1 (`dev-server-bind.test.mjs`'s bind check) reported `ok` at 04:15:48, then nothing until cancellation at 04:52:12 — 36 minutes later, never reaching `smoke.test.mjs`. GitHub's own "Cleaning up orphan processes" step at cancellation listed a still-running `npm run dev 42655` process.

Root cause: `dev-server.test.mjs` and `dev-server-bind.test.mjs` both spawn `npm run dev` with `shell: true`, then `stopServer()` calls plain `child.kill()` on POSIX. That only signals the immediate `sh` process — npm's own `node` child (the real server) is orphaned, keeps running, and keeps its inherited stdout/stderr pipes open. `node --test`'s process never sees those pipes close, so it hangs forever even though the test itself already reported `ok`. The Windows branch already had the right idea (`taskkill /t` to kill the whole tree) — POSIX just never got the equivalent.

Fix: `startDevServer` now spawns `detached: true` on POSIX (its own process group); `stopServer` signals the group with `process.kill(-child.pid, "SIGTERM")` instead of `child.kill()`, falling back to `child.kill()` if that throws. Applied the identical fix to `smoke.test.mjs`'s `runSmoke` timeout-kill path as a backstop (same shell:true + child.kill() pattern; only ever fires if `smoke.mjs` itself truly hangs). Confirmed via the new CI run — `test` finished in 1m8s.

Local `npm test` (Windows, unaffected by the POSIX-only branch) is unchanged: 96/96 after `npm install`.

## 3. Gitleaks finding: false positive, not a leaked secret

The canceled run's `security` job failed at the Gitleaks step with an uncaught `RequestError [HttpError]: Resource not accessible by integration`, status 403, on `GET /repos/.../pulls/18/commits` — gitleaks-action's own PR-event API call, before it ever got to scan file content. The response's `x-accepted-github-permissions` header said `pull_requests=read`; the `security` job's `permissions:` block only granted `contents: read`. Added `pull-requests: read` to that job. Confirmed fixed: new run's Gitleaks step is green in 17s.

I also manually pattern-scanned this branch's diff (`git diff origin/main..HEAD`) for key/token/credential shapes (`gitleaks` itself isn't installed in this environment) — no matches beyond the word "secret" in my own comment explaining the fix. No secret was ever found or exposed on this branch.

## Comments

Security pass. All three findings from the orchestrator's escalation are closed: CI jobs are time-bounded, the real hang (a leaked `npm run dev` process from the dev-server test cleanup, not the smoke test itself) is fixed and confirmed on a real run, and the Gitleaks failure was a workflow permissions bug, not a secret — fixed and confirmed green. No blocking findings on the workflow or test changes: pinned-SHA actions retained, least-privilege permissions retained, no `pull_request_target`, no secrets exposed to forked PRs.

## Next step

PR #18 now has two green checks. Merging is the orchestrator/user's call, not mine.
