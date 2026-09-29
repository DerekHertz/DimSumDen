# 57: jevgrep context at dispatch

**Type:** design-question

**Priority:** P2

**What to build:** Cells start cold and spend tokens locating code. Try running `jg` (jevgrep) on a ticket's What-to-build text at dispatch and passing the top file paths and excerpts in the dispatch prompt; also consider `jg` for scout codebase surveys. ADR 0010 currently keeps dispatch routing and scout filtering out of Jev's scope, so the architect first records an ADR (amending or following 0010) on whether context supply is in scope. Then a trial on a few tickets compares cell tokens with and without jg context, using `log-cell.mjs` rows as the baseline.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] ADR recorded (architect)
- [ ] Trial on 3+ tickets, token comparison in the handoff
- [ ] Go/no-go from the user

## Comments

- **Created (orchestrator, 2026-09-29):** User: "jev would also be good for handing agents necessary codebase information really fast". jg has been run ~6 times across all sessions; no genome mentions it.
