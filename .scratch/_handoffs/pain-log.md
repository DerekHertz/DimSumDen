# Pain log

One line per friction with the current infra: what, what it cost, what was done. No fixes are filed from here; the user reviews it.

- 2026-10-12: the 80k orchestrator context guard stopped one day's session three times. Each stop cost a handoff and a wait for the user's `/compact`.
- 2026-10-12: `board release --status` refuses without a handoff State block written after the claim. Moving a ticket's status by hand takes claim, handoff, release.
- 2026-10-12: the board has no `create` command and cells cannot write the main checkout. Tickets an architect designs are retyped by the orchestrator.
- 2026-10-12: `risk-check` hits on nearly any `apps/bridge` change, so a security cell ran on every ticket of the day; all passed.
- 2026-10-12: Jev's advisory route matched the orchestrator's pick on every ticket and changed nothing; two hand-run commands per ticket.
- 2026-10-12: ADR 0019 decision 4 (slim relay, accepted 2026-10-03) was never applied to `CLAUDE.md` or the orchestrator genome, so the full relay kept running.
- 2026-10-12: `log-cell --failures` splits on semicolons inside an item; one failed call and a retry.
- 2026-10-12: the user's video breakdown of the inspiration was pasted into a session and never saved; no later session can find it.
