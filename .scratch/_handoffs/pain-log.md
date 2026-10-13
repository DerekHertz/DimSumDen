# Pain log

One line per friction with the current infra: what, what it cost, what was done. No fixes are filed from here; the user reviews it.

- 2026-10-12: the 80k orchestrator context guard stopped one day's session three times. Each stop cost a handoff and a wait for the user's `/compact`.
- 2026-10-12: `board release --status` refuses without a handoff State block written after the claim. Moving a ticket's status by hand takes claim, handoff, release.
- 2026-10-12: the board has no `create` command and cells cannot write the main checkout. Tickets an architect designs are retyped by the orchestrator.
- 2026-10-12: `risk-check` hits on nearly any `apps/bridge` change, so a security cell ran on every ticket of the day; all passed.
- 2026-10-12: Jev's advisory route matched the orchestrator's pick on every ticket and changed nothing; two hand-run commands per ticket.
- 2026-10-12: ADR 0019 decision 4 (slim relay, accepted 2026-10-03) was never applied to `CLAUDE.md` or the orchestrator genome, so the full relay kept running.
- 2026-10-12: `log-cell --failures` splits on semicolons inside an item; one failed call and a retry.
- 2026-10-12: the user's video breakdown of the inspiration lives outside the repo and no file in the repo pointed to it. A session searched for it and failed; the user had to give the path.
- 2026-10-12: the auto-mode classifier blocked a session from drafting a `CLAUDE.md` change on a branch for the user's review (self-modification), and then blocked a read-only `git worktree list`. The user has to apply relay edits to `CLAUDE.md` by hand.
