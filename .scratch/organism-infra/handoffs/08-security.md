# Handoff: organism-infra/08 risk-sized review — security

**Ticket:** `.scratch/organism-infra/issues/08-risk-sized-review.md`
**Branch:** `claude/organism-infra-08-risk-sized-review`, commit `cf559a7`, off `origin/main` (`cc129e1`)
**Verdict: Security bounce**

## What I did

Reviewed via detached checkout of `cf559a7` in my own worktree (branch was checked out elsewhere by qa). Diffed against `cc129e1`. No new dependency confirmed — `package.json` only adds a `risk-check` npm script and a test glob, no `dependencies`/`devDependencies`/lockfile change. Full-diff secret scan found nothing beyond the intended fake fixtures in `scripts/risk-check.test.mjs`. No `.github/` files touched, so nothing new for the CI/CD pipeline stage.

Focused, per the escalation, on `scripts/risk-check.mjs`'s git invocation safety and whether its risk categories have false-negative gaps.

## Findings (full text in the ticket's `## Comments`)

- **HIGH — `scripts/risk-check.mjs:44`:** the caller-supplied git range (`process.argv[2]`) reaches `execFileSync("git", ["diff", "--unified=0", range])` unguarded. Empirically confirmed: `node scripts/risk-check.mjs "--output=pwned.txt"` writes an arbitrary file via git's own `--output=` option **and** makes risk-check itself report `clean` (exit 0), because stdout is now empty. This defeats the exact gate the script exists to provide. Not reachable via today's wiring (orchestrator calls it with no argument), but it's the script's documented contract and exactly what the ticket asked me to check. Fix: reject ranges starting with `-`, or insert `--end-of-options` before the range.
- **MEDIUM — `scripts/risk-check.mjs:33`:** the "shelling out" regex misses `execFileSync(` (matches `execFile(`/`execSync(` literally, not `execFileSync(`). Combined with added-lines-only diffing, a call added where the `child_process` import is already present (unchanged context line) evades detection — a false negative in one of the ticket's named risk categories.
- **LOW — `scripts/risk-check.test.mjs:262`:** the private-key test fixture uses a real PEM header/footer around a fake 3-byte body; some generic secret-scanner rules key off header/footer alone and could still flag it if push protection is ever enabled. The other fixtures (no `AKIA` string anywhere, Stripe-shaped key at 16 chars vs GitHub's 24-char minimum) are confirmed safely below real thresholds.

## Next

Developer needs to harden the range argument (the high finding) before this can pass; the medium/low items are recorded non-blocking and can be picked up in the same pass or deferred. I did not touch the branch, ticket status, or any lock — orchestrator holds the ticket lock per this dispatch's instructions. Verdict appended to the ticket's `## Comments`.
