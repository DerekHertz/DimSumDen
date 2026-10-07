# 165: Harden the context budget hook (162 security lows)

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** resolved

**Serves:** Relay context budget (organism-infra/162). Three low findings from `.scratch/organism-infra/handoffs/162-security.md`.

## What to build

Tighten three checks in `scripts/hooks/context-budget.mjs`. None is a security boundary (the hook only denies; the permission system still decides), but each lets the 80k gate be sidestepped or skips a validation the same file does elsewhere.

1. `isSimpleCommand`: a backslash-escaped quote hides a chain from the check. `git commit -m \"x; touch /tmp/y; echo \"` counts as simple, but the shell runs three commands. Treat a backslash outside single quotes as chain-unsafe.
2. `isWrapUpWrite`: any path with a `/.scratch/` segment counts as a wrap-up write, for example `/x/src/.scratch/a`. Allow only the main checkout's `.scratch/` (and the session scratchpad, as today).
3. `readContextTokens`: `session_id` goes into `context.mjs` unvalidated. Validate it with the same `/^[\w.-]+$/` check the scratchpad branch already uses.

Files: `scripts/hooks/context-budget.mjs` and its tests.

## Acceptance criteria

- [ ] At 80k+, a command whose chain is hidden by backslash-escaped quotes is refused (test)
- [ ] At 80k+, a write under a `.scratch/` directory outside the main checkout is refused; writes to the main checkout's `.scratch/` and the session scratchpad are still allowed (test)
- [ ] A `session_id` that fails `/^[\w.-]+$/` is not passed to `context.mjs`, and the hook fails open as it does for other unreadable context (test)
- [ ] The existing 162 tests still pass

## Comments

- **orchestrator, 2026-10-06:** Filed from the 162 security lows (user yes, 2026-10-06). One ticket because all three are in one file.
- **orchestrator, 2026-10-06:** Planned as `batch C` with the rescoped 145 (config-value thresholds), after 145's architect step. Both edit `scripts/hooks/context-budget.mjs`.
- **orchestrator, 2026-10-06:** batch C started 2026-10-06 (user yes): 145 + 165 + ADR 0010 note, one relay, one branch. qa specify first.
- **qa, 2026-10-06:** partial: context budget, tests unrun
- **security, 2026-10-07:** Security pass at ed2646a. Backslash chain bypass closed, wrap-up writes anchored to main .scratch, session id validated. No critical/high. gitleaks clean. Handoff 165-security.md.
