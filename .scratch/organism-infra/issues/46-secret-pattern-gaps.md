# 46: Secret pattern gaps and dead release-gate code

**Type:** task

**Priority:** P3

**What to build:** From 45's security review (all LOW). In `scripts/risk-check.mjs`, extend `SECRET_PATTERNS` to cover `gho_`, `ghs_`, `ghu_`, `github_pat_` and Slack `xoxr-`/`xoxs-`/`xoxe-` shapes, and match a `ghp_`-style token glued to a word character or underscore (e.g. `GH_ghp_...`) without matching prose. In `apps/organism-infra/board-service.mjs` (~877-880), remove the `claimMtimeMs === undefined ? undefined : {...}` branch, which the new no-lock guard made dead. Build any test fixtures at runtime, because CI gitleaks scans every commit in the PR.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] SECRET_PATTERNS matches the new GitHub and Slack token shapes, including a glued prefix (test with runtime-built fixtures)
- [ ] Prose and lookalikes still don't match (test)
- [ ] The dead `claimMtimeMs` branch is removed; suite still passes

## Comments

- **Created (orchestrator, 2026-09-28):** From 45's security review.
