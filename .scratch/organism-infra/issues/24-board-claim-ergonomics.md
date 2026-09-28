# 24: Board claim ergonomics (comment author, reclaim, release without a status change)

**Type:** task

**What to build:** Three gaps in the board CLI that cells hit on 2026-09-28. qa left them out of 18's scope (see `.scratch/organism-infra/handoffs/18-qa-specify.md`).

1. A comment shows its author as "unknown" when no claim lock exists at comment time. Use the caller's cell name, from `--as` or the lock, and reject the comment if there's neither.
2. There's no `reclaim` subcommand. Cells taking over a stale claim released it to `ready-for-agent` and claimed it again by hand. Add an explicit `board reclaim <ref> <cell>`, or document that `claim` takes over a stale lock.
3. qa specify can't end its claim without changing the ticket status. Add `board release <ref> --keep-status`, which frees the lock and leaves the status as it is.

**Blocked by:** 18 (same CLI surface)

**Status:** resolved

- [ ] A comment without an author source is rejected, and one with `--as <cell>` records that cell
- [ ] A stale claim can be taken over in one command
- [ ] `release --keep-status` frees the lock and leaves the status unchanged

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, as a follow-up to 18.
- **orchestrator, 2026-09-28:** From the security re-review of 18: a qa claim can release straight to `resolved`, because the transition rule only checks in-review. Add a rule so only the orchestrator can resolve.
- **qa, 2026-09-28:** QA pass (verify, e964665): 3 criteria + only-orchestrator-resolves rule each have a passing test; npm test 221/221. 18 older-test edits are --as qa only. Low: --as vs lock precedence untested.
- **security, 2026-09-28:** Security bounce (e964665): HIGH comment --as newline forges an attributed line (board-service.mjs comment stamp); MEDIUM reclaim as orchestrator + release resolved --force bypasses resolve gate; MEDIUM --as overrides lock cell. No secrets/deps. See handoffs/24-security.md
- **qa, 2026-09-28:** QA pass (round 2), 9c285a7: security findings fixed and tested (board-identity-hardening.test.mjs), npm test 236/0
- **security, 2026-09-28:** Security pass (9c285a7): forged --as, orchestrator reclaim, --as vs lock, cellType validation all closed. Note in ADR 0008: board identity is self-declared. Handoff: handoffs/24-security-2.md
- **orchestrator, 2026-09-28:** Merged via PR #27; resolved.
