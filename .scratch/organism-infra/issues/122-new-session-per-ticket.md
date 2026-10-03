# 122: New orchestrator session per ticket (genome rule + launcher)

**Type:** feature

**Priority:** P2

**Blocked by:** 119

**Status:** resolved

## What to build

Orchestrator sessions run long and every call re-reads the whole context. The user wants one fresh session per ticket (or batch), with compaction only as the fallback when a ticket reaches the 80k gate before it finishes (ticket 119 covers that gate).

1. **Genome rule (gated).** When a ticket or batch resolves, the orchestrator runs `worktree-gc`, writes its handoff, and tells the user to start a fresh session instead of dispatching the next ticket. It still proposes the next ticket in that message. Mid-ticket compaction at 80k stays as is. The developer writes this as a gated patch in `.scratch/_handoffs/gated/` for the user to apply with `npm run apply-gated`.
2. **Launcher script.** `npm run next-session` (script in `scripts/`) prints, and with a flag runs, `claude --agent orchestrator "<prompt>"`. The prompt points at the latest orchestrator handoff and asks for the frontier ticket proposal. It restates no rules.
3. **Not in scope.** No headless loop over tickets: dispatch approval and merge gates need the user in chat.

## Acceptance criteria

- [ ] The gated patch adds the end-of-ticket rule to the orchestrator genome, and says compaction is only for a ticket that hits the gate mid-flight.
- [ ] `npm run next-session` prints a command that names the latest handoff file, and exits non-zero with a clear message when there is none.
- [ ] The launcher's run flag is covered by a test that stubs `claude`.
- [ ] `npm test` is green.

## Comments

- **orchestrator, 2026-10-02:** Filed on the user's request ("new sessions for each ticket, compaction only when reaching the limit"). Queue after 119.
- **qa, 2026-10-02:** All acceptance criteria met: genome patch verified in main, launcher complete, 14 tests with no changes since spec, in-scope changes only.
- **security, 2026-10-02:** Security pass. No shell (spawnSync argv), handoff names regex-constrained, printed command quoting probed with hostile --root and held, no new deps, gitleaks clean. Low/info only: --root and PATH are operator-controlled. See handoffs/122-security.md.
