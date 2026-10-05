# 130: Bridge-signed request lines, so the orchestrator can tell a real answer from a forged one

**Type:** feature

**Priority:** P2

**What to build:** The residual from ADR 0016 decision 3 (security finding H1). The orchestrator genome still treats a `dispatch-approve` line in the requests file as the user's answer, and any cell on the same account can append such a line, so a prompt-injected cell can talk the orchestrator into acting. The bridge signs each line it writes (a keyed hash under a key the cells cannot read), and the orchestrator accepts only signed lines. A test proves that a line the bridge wrote is not re-actionable by the orchestrator after it is marked handled.

The key must not be readable by a cell: that is the design question to settle first (an architect step, or a short design section in this ticket's handoff), since a same-account file is readable by cells and an in-memory key means the orchestrator needs another way to verify. The orchestrator genome change that makes it accept only signed lines is the orchestrator's to make, and only with the user's permission; this ticket proposes the wording and does not edit `.claude/`.

**Blocked by:** 106

**Status:** parked

- [ ] The key's storage and the verification path are decided and recorded, with the reason a cell cannot read the key
- [ ] Lines the bridge writes carry a signature; a forged or edited line fails verification (tests)
- [ ] A signed, handled line cannot be acted on twice (test)
- [ ] The proposed genome wording is in the handoff, unapplied, for the user's decision

## Comments
- **Created (orchestrator, 2026-10-01):** follow-up named in ADR 0016 decision 3, "Known residual". Touches `.claude/`, so it is a user gate.
- **orchestrator, 2026-10-04:** Filed from the Mac session of 2026-10-01, where it was ticket 91 and never pushed. Renumbered because main reused 82-94. Other Mac numbers in the body map to main as: 83, 84 -> 105; 86, 87, 88, 89 -> 106; 90 -> 107.
- **orchestrator, 2026-10-05:** Parked: Parked at filing (user, 2026-10-04): refocus rules supersede; names no v1 den-loop step or repeated testbed friction (docs/refocus/triage-2026-10-02.md)
