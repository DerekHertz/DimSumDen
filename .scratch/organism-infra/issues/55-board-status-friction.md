# 55: Board: status friction after specify and for designer verdicts

**Type:** feature

**Priority:** P1

**What to build:**
- `board release --keep-status` from a qa `specify` claim restores the ticket's status from before the claim (normally `ready-for-agent`), not `claimed`. Today the orchestrator resets it by hand with claim, handoff and release.
- A designer claim can use `--mode review|spec|critique|direction`, and `board comment --verdict pass|bounce` is accepted from a designer review, the same as from qa and security.

**Blocked by:** None (can start immediately).

**Status:** in-review

- [ ] After a specify claim and `--keep-status` release, the ticket is back at its prior status (test)
- [ ] A designer review claim can post a `--verdict` that the snapshot's gate logic reads (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From the post-UI v0 retro (cause 4, 4+ occurrences across 07-11), approved by the user.
- **Retro add (orchestrator, 2026-09-29):** `board handoff` refuses to republish a handoff under the same name even for the same cell after a State block fix (qa on dimsumden-ui-v0/15 had to write 15-qa-verify-2.md, leaving a stale file). Allow the same cell/mode to overwrite its own file.
- **orchestrator, 2026-09-30:** Scope added (user, 2026-09-30): the same restore applies when a qa specify fix-round claims a blocked ticket — --keep-status must return it to blocked (51 was left claimed with no lock; cost an extra developer hop).
