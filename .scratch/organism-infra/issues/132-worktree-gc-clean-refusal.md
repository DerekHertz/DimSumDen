# 132: `worktree-gc` refuses a non-git `--root` cleanly

**Type:** bug

**Priority:** P3

**What to build:** Passing a `--root` that is not a git repository makes `worktree-gc` throw an uncaught exception with a stack trace instead of printing a one-line refusal and exiting non-zero. Found as a Low by security on ticket 82 (it predates that change). The tool should print a short message naming the path, exit non-zero, and change nothing, the same way it already refuses a path that is not the main checkout.

**Blocked by:** None

**Status:** parked

- [ ] A non-git `--root` prints a one-line refusal and exits non-zero with no stack trace (test)
- [ ] A missing or unreadable `--root` behaves the same (test)
- [ ] Existing behaviour for valid roots and for a non-main-checkout root is unchanged

## Comments
- **Created (orchestrator, 2026-10-01):** Low finding from security's review of ticket 82 (`82-security.md`).
- **orchestrator, 2026-10-04:** Filed from the Mac session of 2026-10-01, where it was ticket 93 and never pushed. Renumbered because main reused 82-94. Other Mac numbers in the body map to main as: 83, 84 -> 105; 86, 87, 88, 89 -> 106; 90 -> 107.
- **orchestrator, 2026-10-05:** Parked: Parked at filing (user, 2026-10-04): refocus rules supersede; names no v1 den-loop step or repeated testbed friction (docs/refocus/triage-2026-10-02.md)
