# Handoff: organism-infra/08 risk-sized review — developer

**Ticket:** `.scratch/organism-infra/issues/08-risk-sized-review.md`
**Branch:** `claude/organism-infra-08-risk-sized-review`, off `origin/main` (cc129e1), one commit (cf559a7).
**Status:** in-review (developer stage done; orchestrator's relay handles qa/security dispatch — see below).

## What was built

- `scripts/risk-check.mjs`: scans a git range (default `main...HEAD`) for secret-shaped strings, package.json dependency-field or package-lock.json changes, and risk paths/keywords (`.github/`, network/server code, shelling out, board/lock/daemon code, secrets-handling keywords) confined to `apps/`, `packages/`, `scripts/`. Exit 0 = clean; non-zero prints each hit as `file: reason`.
- `scripts/risk-check.test.mjs`: 10 `node --test` cases against temp git repos, covering a clean diff, each risk category, and a false-positive check (the word "secret" in ticket prose under `.scratch/` doesn't trigger).
- `package.json`: added `scripts/**/*.test.mjs` to the test glob and an `npm run risk-check` script. No new dependency.
- `.claude/agents/orchestrator.md`: stage 3 now says light vs full qa verify by whether qa ran specify; stage 4 replaced with "run `npm run risk-check` via scout, escalate to full security only on a hit."
- `.claude/agents/qa.md`: verify section split into **light verify** (rerun tests, diff test files against the specify commit, spot-check criteria) and **full verify** (previous behavior), gated on whether qa wrote the tests.
- `.claude/agents/security.md`: added one line — dispatched only on a risk-check hit or explicit escalation.

This is the user-approved design from the brain gate on 2026-09-27; implemented as specified, no scope changes.

## Testing

- `npm test`: 57/57 pass. Note: this worktree had no `node_modules` at all; `npm install` (no new/changed deps, just installing what package.json already declares) was needed before `apps/ci-cd/smoke.test.mjs` would pass — a pre-existing env gap in this worktree, unrelated to this ticket.
- Self-check: `node scripts/risk-check.mjs cc129e1...HEAD` (this ticket's own diff) reports clean, as expected — it only touches docs/genomes, a script, and a test-glob/script addition to package.json.

## Comments added to ticket

See `## Comments` in the ticket file for the developer entry.

## Next

qa/security review per the relay (developer stage ends at in-review, not resolved). No blockers found.
