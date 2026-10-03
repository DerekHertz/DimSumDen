# 89: Jev `compact` point (when the orchestrator should hand off and compact)

**Type:** feature

**Priority:** P2

**What to build:** The orchestrator genome now says: from 120k context, finish the relay steps in flight and start no new tickets; at 150k or more, write the session handoff and ask the user to run `/compact` (PR 115). That fixed line doesn't know how far along a relay is. A 130k session one qa verify away from a merge should finish it; one about to start a developer hop should hand off now. Add a Jev point that advises on this, in shadow mode first (ADR 0015's rollout: shadow, then advisory).

- New point `compact` in `scripts/jev.mjs`: `node scripts/jev.mjs compact --context <tokens> [--mode shadow|advisory]`. It reads the in-flight relays from the board (ticket, stage, cell running) and the latest usage row, and returns one label: `continue`, `finish-in-flight` or `handoff-now`, with a confidence and a one-line reason.
- Deterministic guard rails beat the model: under 100k is always `continue`, and at 150k or more it is always `handoff-now`. The model only decides the 100k–150k band.
- `jev-wake-prelude.mjs` calls it whenever the latest `context` row is 100k or more, so the orchestrator sees the advice at the top of each wake without a separate step.
- Rows: append `{"kind":"jev","point":"compact",...}` like the other points, and log the outcome with `advisory-outcome` (did the orchestrator compact at that wake?).
- The genome line that names the point goes in the developer's handoff as an exact edit (`.claude/` is gated).

**Blocked by:** none (PR 115 should merge first so the genome edit applies to the new wording)

**Status:** closed

- [ ] `compact` returns `continue` under 100k and `handoff-now` at 150k or more without a model call (tests)
- [ ] In the 100k–150k band the label is one of the three, and a transport failure falls back to `finish-in-flight` (tests with a stub transport)
- [ ] The wake prelude includes the `compact` advice when the latest context row is 100k or more, and omits it below (test)
- [ ] `jev` and `jev-advisory-outcome` rows are written for the point (test)
- [ ] The orchestrator genome edit is in the developer's handoff

## Comments

- **Created (orchestrator, 2026-10-01):** Filed on the user's yes (2026-10-01): "when we approach the session token limit we set, 100-150k, we should write handoff then compact. this is something jev can help with." The fixed-threshold genome rule is PR 115.
- **orchestrator, 2026-10-01:** Thresholds changed (user, 2026-10-01): the genome now says no new tickets from 70k and handoff + /compact at 80k. Use 70k/80k for the guard rails instead of 100k/150k; the model decides the band between them.
- **orchestrator, 2026-10-03:** Closed: Jev find/compaction points dropped (refocus, docs/refocus/triage-2026-10-02.md)
