# 45: Release without a claim still runs the handoff gate; wider secret patterns

**Type:** bug

**What to build:** On ticket 38, the fix-round developer ran `board release --status in-review` before publishing its handoff, and the release passed. The likely path: with no claim lock, `release()` skips the cell/mode/age binding, which security noted as LOW on 35 (ADR 0008 decision 11). Make a release with no lock either fail ("claim first") or require a handoff newer than the ticket's last release event. Also, from 38's security review, add `ghp_`, `sk-` and `xox[abp]-` token shapes to `SECRET_PATTERNS` in `scripts/risk-check.mjs`. Build any test fixtures at runtime, because CI gitleaks scans every commit in the PR.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `board release --status in-review` with no claim lock is refused, or requires a handoff newer than the last release (test)
- [ ] SECRET_PATTERNS matches ghp_, sk- and xox tokens (test with runtime-built fixtures)
- [ ] ADR 0008 decision 11 updated to match

## Comments

- **Created (orchestrator, 2026-09-28):** From 38's fix round and its security review.
- **qa, 2026-09-29:** QA pass: 308/308, specify tests unchanged, old-test edits faithful, no token literals. See handoff 45-qa-verify.
- **security, 2026-09-29:** Security pass. No critical/high. Low: dead ternary board-service.mjs:877; lock is self-declared (ADR 0008 d9); risk-check.mjs:25-27 misses gho_/ghs_/github_pat_/xoxr|s|e and underscore-glued ghp_. See handoffs/45-security.md.
- **orchestrator, 2026-09-29:** PR #35 merged
